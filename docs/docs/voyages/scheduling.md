---
id: scheduling
title: Scheduling & Departure Cycles
sidebar_position: 3
---

# Scheduling & Departure Cycles

Stellar uses a **fixed-schedule, orbital-influenced** model. Departure dates repeat on a fixed frequency; journey durations and prices float with orbital positions.

## The Schedule Model

Each route has a fixed departure frequency defined in `system.json`:

```json
{
  "id": "aethon_kalos",
  "frequencyDays": 5,
  ...
}
```

Departures are calculated deterministically from simulation day 0 — every multiple of 5 simulation days is a departure day for the Aethon–Kalos route. The same query on the same date always returns the same set of departures.

This is similar to how real airlines work: a fixed timetable that repeats indefinitely. Unlike real airlines, the _outputs_ of that timetable — duration, price, orbital window rating — are recalculated fresh for every departure based on where the planets will actually be.

## Duration Variability

The journey duration for a given route on a given departure day is:

```
duration = distance(origin, destination, departureDay) / shipSpeed
```

With one refinement pass to account for the destination moving during transit:

```
estimatedArrival = departureDay + (distance at departure / speed)
duration = distance(origin, destination, estimatedArrival) / speed
```

Because planetary positions change continuously, no two departures on the same route ever have exactly the same duration. The variability is significant:

| Route                    | Minimum Duration | Maximum Duration | Swing |
| ------------------------ | ---------------- | ---------------- | ----- |
| Aethon → Kalos (Tethys)  | ~32 days         | ~56 days         | ±27%  |
| Aethon → Calyx (Solaris) | ~128 days        | ~280 days        | ±54%  |
| Kalos → Thal (Helion)    | ~1.5 hours       | ~6 hours         | ±75%  |

Inner-system moon-to-moon routes swing proportionally more because the parent planet's position adds another layer of orbital variability.

## Repetition Cycles

The schedule repeats, but the orbital conditions do not repeat on the same cycle. The orbital window rating for a given route follows the synodic period of the origin and destination — the time between successive closest approaches.

For the Aethon–Kalos route:

- Departure frequency: every 5 days
- Aethon orbital period: 380 days
- Kalos orbital period: ~906 days (Vareth period + Kalos moon period)
- Synodic period: ~566 days

This means the 5-star window for Aethon–Kalos recurs roughly every 566 days. Within that cycle, the schedule runs normally — departures every 5 days regardless of orbital conditions. The window rating tells you which of those departures to choose.

## The Chatbot and Scheduling

The AI chatbot can answer scheduling questions by calling the `search_voyages` and `find_closest_approach` tools:

- "When is the next departure from Aethon to Kalos?"
- "How many Solaris departures to Calyx are there in the next 60 days?"
- "What's the next 5-star window for the Aethon–Calyx route?"
- "If I miss the 14-day departure, how long until the next one?"

Because the schedule is deterministic, the chatbot can answer questions about departures arbitrarily far in the future.

## Why This Model

A purely orbital-driven schedule — where departure frequency itself changes based on planetary positions — would be more realistic but significantly more complex to implement and harder for users to plan around. The fixed-schedule, orbital-influenced model gives the best of both: a predictable, plannable timetable with prices and durations that genuinely reflect the physics of the system.

It also means the orbital simulation is _consequential_ rather than decorative. The 3D star map isn't just a pretty visualisation — it directly determines what users pay and how long they travel.
