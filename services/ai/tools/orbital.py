"""
Orbital mechanics for the Solara system — Python implementation.

Mirrors gateway/orbital/orbital.go and frontend/src/lib/orbital.ts.
All three implementations read from the same system.json config values,
so the Go gateway, TypeScript renderer, and this agent always agree
on where every body is.

Units: AU for distance, days for time.
"""

import math
from datetime import datetime, timezone
from typing import Optional


EPOCH_DATE = "2800-01-01"


# ─────────────────────────────────────────────────────────────────
# Core position calculation
# ─────────────────────────────────────────────────────────────────

def position(
    orbital_radius: float,
    period: float,
    eccentricity: float,
    start_phase_deg: float,
    day_t: float,
) -> tuple[float, float]:
    """
    Calculate the 2D orbital plane position of a body at simulation day T.

    angle(T) = startPhase + (2π / period) × T
    radius(T) = orbitalRadius × (1 - eccentricity × cos(angle))
    x = radius × cos(angle), y = radius × sin(angle)
    """
    start_phase_rad = math.radians(start_phase_deg)
    angle = start_phase_rad + (2 * math.pi / period) * day_t
    radius = orbital_radius * (1 - eccentricity * math.cos(angle))
    return radius * math.cos(angle), radius * math.sin(angle)


def moon_position(
    moon_radius: float,
    moon_period: float,
    moon_eccentricity: float,
    moon_phase: float,
    parent_radius: float,
    parent_period: float,
    parent_eccentricity: float,
    parent_phase: float,
    day_t: float,
) -> tuple[float, float]:
    """Calculate the absolute system position of a moon."""
    px, py = position(parent_radius, parent_period, parent_eccentricity, parent_phase, day_t)
    mx, my = position(moon_radius, moon_period, moon_eccentricity, moon_phase, day_t)
    return px + mx, py + my


def distance_au(
    ax: float, ay: float,
    bx: float, by: float,
) -> float:
    return math.sqrt((ax - bx) ** 2 + (ay - by) ** 2)


# ─────────────────────────────────────────────────────────────────
# Voyage duration
# ─────────────────────────────────────────────────────────────────

def voyage_duration(
    origin_params: dict,
    dest_params: dict,
    departure_day: float,
    speed_au_per_day: float,
    refinement_passes: int = 2,
) -> float:
    """
    Estimate journey time in days with iterative refinement.
    origin_params / dest_params are dicts with keys:
      orbital_radius, period, eccentricity, start_phase
    """
    def body_pos(params: dict, day: float) -> tuple[float, float]:
        return position(
            params["orbital_radius"],
            params["period"],
            params["eccentricity"],
            params["start_phase"],
            day,
        )

    ox, oy = body_pos(origin_params, departure_day)
    dx, dy = body_pos(dest_params, departure_day)
    duration = distance_au(ox, oy, dx, dy) / speed_au_per_day

    for _ in range(refinement_passes - 1):
        arrival_day = departure_day + duration
        dax, day_ = body_pos(dest_params, arrival_day)
        duration = distance_au(ox, oy, dax, day_) / speed_au_per_day

    return duration


# ─────────────────────────────────────────────────────────────────
# Orbital window rating
# ─────────────────────────────────────────────────────────────────

def window_rating(
    origin_params: dict,
    dest_params: dict,
    departure_day: float,
    thresholds: dict,
) -> int:
    """
    Return 1–5 orbital window rating.
    5 = close approach (best), 1 = far separation (worst).
    """
    def dist_at(day: float) -> float:
        ox, oy = position(**{k: origin_params[k] for k in ("orbital_radius", "period", "eccentricity")},
                          start_phase_deg=origin_params["start_phase"], day_t=day)
        dx, dy = position(**{k: dest_params[k] for k in ("orbital_radius", "period", "eccentricity")},
                          start_phase_deg=dest_params["start_phase"], day_t=day)
        return distance_au(ox, oy, dx, dy)

    period = max(origin_params["period"], dest_params["period"])
    dists  = [dist_at(departure_day + i) for i in range(int(period) + 1)]
    mn, mx = min(dists), max(dists)

    if mx == mn:
        return 3

    current    = dist_at(departure_day)
    normalised = (current - mn) / (mx - mn)

    if normalised <= thresholds.get("rating5", 0.20):
        return 5
    if normalised <= thresholds.get("rating4", 0.40):
        return 4
    if normalised <= thresholds.get("rating3", 0.65):
        return 3
    if normalised <= thresholds.get("rating2", 0.85):
        return 2
    return 1


# ─────────────────────────────────────────────────────────────────
# Closest approach search
# ─────────────────────────────────────────────────────────────────

def closest_approach(
    origin_params: dict,
    dest_params: dict,
    from_day: float,
    window_days: int = 365,
) -> dict:
    """Find the day with minimum separation within a search window."""
    best_day  = from_day
    best_dist = math.inf

    for i in range(window_days + 1):
        day = from_day + i
        ox, oy = position(origin_params["orbital_radius"], origin_params["period"],
                          origin_params["eccentricity"], origin_params["start_phase"], day)
        dx, dy = position(dest_params["orbital_radius"], dest_params["period"],
                          dest_params["eccentricity"], dest_params["start_phase"], day)
        dist = distance_au(ox, oy, dx, dy)
        if dist < best_dist:
            best_dist = dist
            best_day  = day

    return {"day": best_day, "distance_au": round(best_dist, 4)}


# ─────────────────────────────────────────────────────────────────
# Simulation day helpers
# ─────────────────────────────────────────────────────────────────

def day_from_date(date: datetime, epoch_str: str = EPOCH_DATE) -> float:
    epoch = datetime.strptime(epoch_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    target = date.replace(tzinfo=timezone.utc) if date.tzinfo is None else date
    return (target - epoch).total_seconds() / 86400


def date_from_day(day_t: float, epoch_str: str = EPOCH_DATE) -> datetime:
    epoch = datetime.strptime(epoch_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    return epoch.replace(tzinfo=timezone.utc).__class__.fromtimestamp(
        epoch.timestamp() + day_t * 86400, tz=timezone.utc
    )


def today_day(epoch_str: str = EPOCH_DATE) -> float:
    return day_from_date(datetime.now(tz=timezone.utc), epoch_str)


# ─────────────────────────────────────────────────────────────────
# Config adapter — extract params dict from system.json body entry
# ─────────────────────────────────────────────────────────────────

def params_from_body(body: dict) -> dict:
    return {
        "orbital_radius": body["orbitalRadius"],
        "period":         body["period"],
        "eccentricity":   body.get("eccentricity", 0.0),
        "start_phase":    body.get("startPhase", 0.0),
    }