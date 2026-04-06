"""
Agent tools for the Stellar AI chatbot.

Each tool is defined as an Anthropic tool schema plus a Python handler function.
The agent decides which tools to call; this module executes them and returns results.

All orbital calculations read from system.json via the config module —
changing a planet's orbital period automatically flows through to tool responses.
"""

import math
from datetime import datetime, timezone
from typing import Any

import httpx

from config.settings import SYSTEM_CONFIG, config
from tools.orbital import (
    params_from_body,
    voyage_duration,
    window_rating,
    closest_approach,
    today_day,
    day_from_date,
    date_from_day,
    position,
    distance_au,
)


# ─────────────────────────────────────────────────────────────────
# Lookup helpers
# ─────────────────────────────────────────────────────────────────

def _body_map() -> dict[str, dict]:
    return {b["id"]: b for b in SYSTEM_CONFIG.get("bodies", [])}


def _route_map() -> dict[str, dict]:
    return {r["id"]: r for r in SYSTEM_CONFIG.get("routes", [])}


def _ship_map() -> dict[str, dict]:
    return {s["id"]: s for s in SYSTEM_CONFIG.get("shipClasses", [])}


def _thresholds() -> dict:
    return SYSTEM_CONFIG.get("orbitalWindowRating", {}).get("thresholds", {
        "rating5": 0.20, "rating4": 0.40,
        "rating3": 0.65, "rating2": 0.85, "rating1": 1.00,
    })


def _epoch() -> str:
    return SYSTEM_CONFIG.get("epoch", {}).get("date", "2800-01-01")


# ─────────────────────────────────────────────────────────────────
# Tool schemas (Anthropic tool_use format)
# ─────────────────────────────────────────────────────────────────

TOOL_SCHEMAS = [
    {
        "name": "get_orbital_positions",
        "description": (
            "Get the current 2D orbital positions (in AU) of all bodies in the Solara system "
            "at a given simulation day. Returns x,y coordinates for each body."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "day": {
                    "type": "number",
                    "description": "Simulation day number. Omit to use today.",
                }
            },
            "required": [],
        },
    },
    {
        "name": "get_voyage_duration",
        "description": (
            "Calculate the estimated journey time in days between two bodies "
            "for a given departure day and ship class."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "origin_id": {
                    "type": "string",
                    "description": "Origin body ID (e.g. 'aethon', 'kalos').",
                },
                "destination_id": {
                    "type": "string",
                    "description": "Destination body ID.",
                },
                "departure_date": {
                    "type": "string",
                    "description": "Departure date as ISO 8601 string (e.g. '2801-06-15'). Omit for today.",
                },
                "ship_class_id": {
                    "type": "string",
                    "description": "Ship class ID (e.g. 'tethys', 'solaris'). Omit for Tethys-class.",
                },
            },
            "required": ["origin_id", "destination_id"],
        },
    },
    {
        "name": "find_closest_approach",
        "description": (
            "Find the day within a search window when two bodies are at their closest orbital separation. "
            "Useful for answering questions like 'when is the best time to travel from X to Y'."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "origin_id":    {"type": "string", "description": "Origin body ID."},
                "destination_id": {"type": "string", "description": "Destination body ID."},
                "from_date": {
                    "type": "string",
                    "description": "Start of search window (ISO 8601). Omit for today.",
                },
                "window_days": {
                    "type": "integer",
                    "description": "Number of days to search ahead. Default 365.",
                },
            },
            "required": ["origin_id", "destination_id"],
        },
    },
    {
        "name": "search_voyages",
        "description": (
            "Search for available scheduled voyages between two bodies. "
            "Returns upcoming departures with durations and prices."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "origin_id":       {"type": "string"},
                "destination_id":  {"type": "string"},
                "departure_date":  {
                    "type": "string",
                    "description": "ISO 8601 date. Omit for today.",
                },
            },
            "required": ["origin_id", "destination_id"],
        },
    },
    {
        "name": "get_body_info",
        "description": (
            "Get factual information about a planet, moon, or other body in the Solara system — "
            "orbital parameters, visitation status, spaceports, and description."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "body_id": {
                    "type": "string",
                    "description": "Body ID (e.g. 'aethon', 'mira', 'calyx').",
                },
            },
            "required": ["body_id"],
        },
    },
    {
        "name": "get_route_info",
        "description": (
            "Get schedule and ship class information for a specific route "
            "(e.g. how often does the Aethon-Kalos service run, which ship class)."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "route_id": {
                    "type": "string",
                    "description": "Route ID (e.g. 'aethon_kalos'). Use 'list' to see all route IDs.",
                },
            },
            "required": ["route_id"],
        },
    },
    {
        "name": "get_system_overview",
        "description": (
            "Get a high-level overview of the Solara system: all visitable bodies, "
            "all scheduled routes, and all ship classes."
        ),
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
]


# ─────────────────────────────────────────────────────────────────
# Tool handlers
# ─────────────────────────────────────────────────────────────────

def handle_get_orbital_positions(inputs: dict) -> dict:
    day = inputs.get("day") or today_day(_epoch())
    body_map = _body_map()
    positions = {}

    for body_id, body in body_map.items():
        if body.get("parent") and body["parent"] in body_map:
            parent = body_map[body["parent"]]
            pp = params_from_body(parent)
            mp = params_from_body(body)
            px, py = position(pp["orbital_radius"], pp["period"],
                              pp["eccentricity"], pp["start_phase"], day)
            mx, my = position(mp["orbital_radius"], mp["period"],
                              mp["eccentricity"], mp["start_phase"], day)
            positions[body_id] = {"x": round(px + mx, 6), "y": round(py + my, 6)}
        else:
            p = params_from_body(body)
            x, y = position(p["orbital_radius"], p["period"],
                            p["eccentricity"], p["start_phase"], day)
            positions[body_id] = {"x": round(x, 6), "y": round(y, 6)}

    return {
        "day": round(day, 2),
        "date": date_from_day(day, _epoch()).strftime("%Y-%m-%d"),
        "positions": positions,
    }


def handle_get_voyage_duration(inputs: dict) -> dict:
    body_map  = _body_map()
    ship_map  = _ship_map()
    epoch     = _epoch()

    origin_id = inputs["origin_id"]
    dest_id   = inputs["destination_id"]

    if origin_id not in body_map:
        return {"error": f"Body '{origin_id}' not found in system config."}
    if dest_id not in body_map:
        return {"error": f"Body '{dest_id}' not found in system config."}

    dep_date_str = inputs.get("departure_date")
    if dep_date_str:
        try:
            dep_day = day_from_date(
                datetime.strptime(dep_date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc),
                epoch,
            )
        except ValueError:
            return {"error": f"Invalid date format: '{dep_date_str}'. Use YYYY-MM-DD."}
    else:
        dep_day = today_day(epoch)

    ship_id    = inputs.get("ship_class_id", "tethys")
    ship       = ship_map.get(ship_id)
    if not ship:
        return {"error": f"Ship class '{ship_id}' not found."}

    speed = ship["speedAUPerDay"]

    origin_params = params_from_body(body_map[origin_id])
    dest_params   = params_from_body(body_map[dest_id])

    # For moons, resolve to system position
    if body_map[origin_id].get("parent"):
        parent = body_map[body_map[origin_id]["parent"]]
        pp     = params_from_body(parent)
        op     = params_from_body(body_map[origin_id])
        ox, oy = (
            position(pp["orbital_radius"], pp["period"], pp["eccentricity"], pp["start_phase"], dep_day)[0]
            + position(op["orbital_radius"], op["period"], op["eccentricity"], op["start_phase"], dep_day)[0],
            position(pp["orbital_radius"], pp["period"], pp["eccentricity"], pp["start_phase"], dep_day)[1]
            + position(op["orbital_radius"], op["period"], op["eccentricity"], op["start_phase"], dep_day)[1],
        )
    else:
        ox, oy = position(origin_params["orbital_radius"], origin_params["period"],
                          origin_params["eccentricity"], origin_params["start_phase"], dep_day)

    if body_map[dest_id].get("parent"):
        parent = body_map[body_map[dest_id]["parent"]]
        pp     = params_from_body(parent)
        dp     = params_from_body(body_map[dest_id])
        dx, dy = (
            position(pp["orbital_radius"], pp["period"], pp["eccentricity"], pp["start_phase"], dep_day)[0]
            + position(dp["orbital_radius"], dp["period"], dp["eccentricity"], dp["start_phase"], dep_day)[0],
            position(pp["orbital_radius"], pp["period"], pp["eccentricity"], pp["start_phase"], dep_day)[1]
            + position(dp["orbital_radius"], dp["period"], dp["eccentricity"], dp["start_phase"], dep_day)[1],
        )
    else:
        dx, dy = position(dest_params["orbital_radius"], dest_params["period"],
                          dest_params["eccentricity"], dest_params["start_phase"], dep_day)

    dist   = distance_au(ox, oy, dx, dy)
    dur    = dist / speed
    rating = window_rating(origin_params, dest_params, dep_day, _thresholds())

    arrival_day  = dep_day + dur
    arrival_date = date_from_day(arrival_day, epoch)
    dep_date     = date_from_day(dep_day, epoch)

    return {
        "origin":           origin_id,
        "destination":      dest_id,
        "ship_class":       ship_id,
        "departure_date":   dep_date.strftime("%Y-%m-%d"),
        "arrival_date":     arrival_date.strftime("%Y-%m-%d"),
        "duration_days":    round(dur, 1),
        "distance_au":      round(dist, 3),
        "orbital_window_rating": rating,
        "speed_au_per_day": speed,
    }


def handle_find_closest_approach(inputs: dict) -> dict:
    body_map  = _body_map()
    epoch     = _epoch()

    origin_id = inputs["origin_id"]
    dest_id   = inputs["destination_id"]

    if origin_id not in body_map:
        return {"error": f"Body '{origin_id}' not found."}
    if dest_id not in body_map:
        return {"error": f"Body '{dest_id}' not found."}

    from_date_str = inputs.get("from_date")
    if from_date_str:
        try:
            from_day = day_from_date(
                datetime.strptime(from_date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc), epoch
            )
        except ValueError:
            return {"error": f"Invalid date: '{from_date_str}'."}
    else:
        from_day = today_day(epoch)

    window = inputs.get("window_days", 365)

    origin_params = params_from_body(body_map[origin_id])
    dest_params   = params_from_body(body_map[dest_id])

    result = closest_approach(origin_params, dest_params, from_day, window)
    approach_date = date_from_day(result["day"], epoch)
    rating = window_rating(origin_params, dest_params, result["day"], _thresholds())

    return {
        "origin":        origin_id,
        "destination":   dest_id,
        "closest_day":   round(result["day"], 2),
        "closest_date":  approach_date.strftime("%Y-%m-%d"),
        "distance_au":   result["distance_au"],
        "orbital_window_rating": rating,
        "search_window_days": window,
    }


def handle_search_voyages(inputs: dict) -> dict:
    """Forward voyage search to the gateway and return results."""
    params = {
        "originId":      inputs["origin_id"],
        "destinationId": inputs["destination_id"],
        "adults":        "1",
        "children":      "0",
    }
    if inputs.get("departure_date"):
        params["departureDate"] = inputs["departure_date"]

    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(f"{config.GATEWAY_URL}/api/voyages/search", params=params)
            resp.raise_for_status()
            voyages = resp.json()
    except httpx.HTTPError as e:
        return {"error": f"Could not reach gateway: {e}"}

    # Summarise for the agent — full voyage objects are verbose
    summary = []
    for v in voyages[:5]:  # top 5 results
        summary.append({
            "id":                  v.get("id"),
            "ship_class":          v.get("shipClassId"),
            "route_type":          v.get("routeTypeId"),
            "departure_date":      v.get("departureDate", "")[:10],
            "arrival_date":        v.get("arrivalDate", "")[:10],
            "duration_days":       v.get("durationDays"),
            "distance_au":         v.get("distanceAU"),
            "orbital_window":      v.get("orbitalWindowRating"),
            "lowest_price":        v.get("lowestAvailablePrice"),
            "available_berths":    v.get("availableBerths"),
            "permit_required":     v.get("permitRequired", False),
            "crosses_scatter":     v.get("crossesScatter", False),
        })

    return {
        "origin":       inputs["origin_id"],
        "destination":  inputs["destination_id"],
        "results_count": len(voyages),
        "voyages":      summary,
    }


def handle_get_body_info(inputs: dict) -> dict:
    body_map = _body_map()
    body_id  = inputs["body_id"]
    body     = body_map.get(body_id)

    if not body:
        all_ids = list(body_map.keys())
        return {"error": f"Body '{body_id}' not found. Known bodies: {all_ids}"}

    return {
        "id":            body["id"],
        "name":          body["name"],
        "type":          body["type"],
        "parent":        body.get("parent"),
        "description":   body.get("description", ""),
        "visitable":     body.get("visitable", False),
        "visit_restricted": body.get("visitRestricted", False),
        "permit_required":  body.get("visitPermitRequired", False),
        "spaceports":    body.get("spaceports", []),
        "moons":         body.get("moons", []),
        "orbital_radius_au": body.get("orbitalRadius"),
        "period_days":   body.get("period"),
        "gravity":       "See planet profile page for full details",
    }


def handle_get_route_info(inputs: dict) -> dict:
    route_map = _route_map()
    ship_map  = _ship_map()

    if inputs["route_id"] == "list":
        return {"all_route_ids": list(route_map.keys())}

    route = route_map.get(inputs["route_id"])
    if not route:
        return {
            "error": f"Route '{inputs['route_id']}' not found.",
            "all_route_ids": list(route_map.keys()),
        }

    ship = ship_map.get(route["shipClass"], {})

    return {
        "id":              route["id"],
        "origin":          route["origin"],
        "destination":     route["destination"],
        "ship_class":      route["shipClass"],
        "ship_speed_au_per_day": ship.get("speedAUPerDay"),
        "frequency_days":  route["frequencyDays"],
        "crosses_scatter": route.get("crossesScatter", False),
        "available_route_types": route.get("availableRouteTypes", []),
        "base_price_credits":    route.get("basePriceCredits"),
        "permit_required":       route.get("permitRequired", False),
    }


def handle_get_system_overview(inputs: dict) -> dict:
    bodies    = SYSTEM_CONFIG.get("bodies", [])
    routes    = SYSTEM_CONFIG.get("routes", [])
    ships     = SYSTEM_CONFIG.get("shipClasses", [])

    visitable = [
        {"id": b["id"], "name": b["name"], "type": b["type"],
         "restricted": b.get("visitRestricted", False)}
        for b in bodies if b.get("visitable")
    ]

    route_summary = [
        {
            "id":        r["id"],
            "from":      r["origin"],
            "to":        r["destination"],
            "ship":      r["shipClass"],
            "every_days": r["frequencyDays"],
        }
        for r in routes
    ]

    ship_summary = [
        {
            "id":    s["id"],
            "name":  s["name"],
            "speed": s["speedAUPerDay"],
            "max_passengers": s["maxPassengers"],
            "has_cryo": s["hasCryo"],
        }
        for s in ships
    ]

    return {
        "visitable_bodies": visitable,
        "routes":           route_summary,
        "ship_classes":     ship_summary,
        "total_routes":     len(routes),
        "total_ship_classes": len(ships),
    }


# ─────────────────────────────────────────────────────────────────
# Dispatch
# ─────────────────────────────────────────────────────────────────

TOOL_HANDLERS: dict[str, Any] = {
    "get_orbital_positions":  handle_get_orbital_positions,
    "get_voyage_duration":    handle_get_voyage_duration,
    "find_closest_approach":  handle_find_closest_approach,
    "search_voyages":         handle_search_voyages,
    "get_body_info":          handle_get_body_info,
    "get_route_info":         handle_get_route_info,
    "get_system_overview":    handle_get_system_overview,
}


def execute_tool(tool_name: str, tool_inputs: dict) -> str:
    """Execute a tool by name and return the result as a JSON string."""
    import json
    handler = TOOL_HANDLERS.get(tool_name)
    if not handler:
        return json.dumps({"error": f"Unknown tool: '{tool_name}'"})
    try:
        result = handler(tool_inputs)
        return json.dumps(result, default=str)
    except Exception as e:
        return json.dumps({"error": f"Tool execution failed: {str(e)}"})