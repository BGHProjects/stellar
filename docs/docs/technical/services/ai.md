---
id: ai
title: AI Chatbot Service
sidebar_position: 1
---

# AI Chatbot Service

**Framework:** FastAPI  
**Port:** 8001  
**Pattern:** Agentic tool use

## How It Works

The chatbot uses Anthropic's tool-use pattern. When a user asks a question, the model decides whether it needs to call a tool to get accurate data before answering.

```
User: "When is the best time to fly from Aethon to Calyx this year?"

Model decides: I need orbital data to answer this accurately.
  → Calls find_closest_approach(origin="aethon", destination="calyx", window_days=365)
  → Tool runs orbital calculation, returns: { closest_date: "2801-08-14", distance_au: 4.21, window_rating: 5 }
  → Model uses result to compose answer

Response: "The best departure window in the next year is around 14 August 2801,
           when Aethon and Calyx are at their closest approach (4.21 AU apart,
           5-star orbital window). A Solaris-class voyage departing then would
           take approximately 168 days..."
```

The loop continues until the model produces a final text response with `stop_reason: "end_turn"`.

## Available Tools

| Tool                    | What It Does                                     |
| ----------------------- | ------------------------------------------------ |
| `get_orbital_positions` | 2D positions of all bodies at a given day        |
| `get_voyage_duration`   | Journey time between two bodies on a given date  |
| `find_closest_approach` | Best departure window in a date range            |
| `search_voyages`        | Available scheduled departures (queries gateway) |
| `get_body_info`         | Facts about a planet or moon from system.json    |
| `get_route_info`        | Schedule and ship class for a route              |
| `get_system_overview`   | All visitable bodies, routes, and ship classes   |

## Example Questions the Agent Can Answer

- "What's the distance between Aethon and Calyx right now?"
- "When is the next Solaris-class departure to Mira?"
- "How long does it take to get from Kalos to Calyx on a Tethys-class ship?"
- "What are the cheapest routes from Aethon this month?"
- "Does Mira require a permit?"
- "What's the difference between Full Cryo and Cryo Intervals?"
- "Which ship class is fastest for the Aethon to Eos route?"

## Orbital Accuracy

The orbital calculations in `tools/orbital.py` mirror the Go gateway implementation exactly. Both read from `system.json`. A user asking the chatbot about travel time gets the same number they would see in the booking flow's search results.
