---
id: orbital
title: Orbital Calculations
sidebar_position: 3
---

# Orbital Calculations

The `gateway/orbital/orbital.go` package implements the Solara system's orbital mechanics. The same formula is implemented in TypeScript (`frontend/src/lib/orbital.ts`), and Python (`services/ai/tools/orbital.py`, `services/routing/solver/optimiser.py`). All four read from `system.json`, so they always agree.

## The Formula

All orbital positions use simplified circular orbits with eccentricity — not full Keplerian ellipses. This is sufficient for a booking application and produces convincing visual results.

```
angle(T) = startPhase + (2π / period) × T
radius(T) = orbitalRadius × (1 - eccentricity × cos(angle))
x(T) = radius × cos(angle)
y(T) = radius × sin(angle)
```

Where `T` is the simulation day number (days since epoch `2800-01-01`), and all parameters come from `system.json`.

## Voyage Duration

Journey time is estimated with two refinement passes to account for the destination moving during transit:

```go
func VoyageDuration(origin, dest OrbitalParams, departureDay, speedAUPerDay float64, passes int) float64 {
    // Pass 1: estimate from departure-day distance
    duration := Distance(origin, dest, departureDay) / speedAUPerDay

    // Pass 2: recalculate using destination's position at estimated arrival
    arrivalDay := departureDay + duration
    dist := Distance(origin, dest, arrivalDay)
    duration = dist / speedAUPerDay

    return duration
}
```

Two passes is sufficient accuracy for booking purposes. The refinement passes count is configurable in `system.json` under `simulation.orbitRefinementPasses`.

## Orbital Window Rating

The 1–5 window rating is calculated by comparing current separation against the historical range for that route pair over one synodic period:

```go
func WindowRating(origin, dest OrbitalParams, departureDay float64, thresholds config.OrbitalWindowThresholds) int {
    min, max := separationRange(origin, dest, departureDay)
    current := Distance(origin, dest, departureDay)
    normalised := (current - min) / (max - min)

    switch {
    case normalised <= thresholds.Rating5: return 5
    case normalised <= thresholds.Rating4: return 4
    case normalised <= thresholds.Rating3: return 3
    case normalised <= thresholds.Rating2: return 2
    default:                               return 1
    }
}
```

Rating 5 = close approach (best window). Rating 1 = maximum separation (worst window, highest price multiplier).
