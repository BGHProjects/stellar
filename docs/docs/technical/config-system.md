---
id: config-system
title: The Config System
sidebar_position: 2
---

# The Config System

`config/system.json` is the single source of truth for everything in the Solara system. Every service reads from it at startup. Nothing is hardcoded.

## What Lives in system.json

| Section            | Contents                                                               |
| ------------------ | ---------------------------------------------------------------------- |
| `epoch`            | Simulation start date and day number                                   |
| `simulation`       | AU conversion factor, orbit refinement passes, Scatter radii           |
| `stars`            | Solara Prime and Solara Minor orbital and render parameters            |
| `lagrangeStations` | L4 and L5 station positions and spaceport IDs                          |
| `bodies`           | All planets and moons — orbital params, render data, visitation status |
| `spaceports`       | All spaceports with parent body and type                               |
| `shipClasses`      | Speed, capacity, cryo options, cabin classes per ship class            |
| `cabinClasses`     | Price multipliers, amenity tiers, cryo compatibility                   |
| `cryoOptions`      | Multipliers, amenity flags, interval bounds                            |
| `routeTypes`       | Speed and price multipliers per route type                             |
| `routes`           | All 16 scheduled routes — origin, destination, frequency, base price   |
| `pricing`          | Currency, orbital window multipliers, loyalty rates                    |
| `addOns`           | All bookable add-ons with prices and availability constraints          |
| `loyaltyTiers`     | Point thresholds and benefits per tier                                 |
| `mock`             | Mock mode toggle and disabled features list                            |

## The Pricing Formula

Every fare is derived from this formula — all multipliers come from config:

```
total = basePriceCredits
      × orbitalWindowMultiplier     // 0.80–1.35 based on planetary separation
      × routeTypeMultiplier         // 0.70–1.65 based on route type
      × cabinClassMultiplier        // 1.0–6.0 based on cabin tier
      × cryoOptionMultiplier        // 0.55–1.35 based on cryo choice
      × passengerCount              // with child discount applied
      + addOnsTotal
      + portFees (5% of base)
      − loyaltyDiscount
```

Changing any multiplier in `system.json` updates all prices across all endpoints without touching code.

## Changing a Value

To change Calyx's orbital period from 2400 to 2600 days:

```json
// config/system.json
{
  "bodies": [
    {
      "id": "calyx",
      "period": 2600,   // ← change this one value
      ...
    }
  ]
}
```

Effect:

- Gateway recalculates all Calyx voyage durations on the next request
- Frontend orbital renderer moves Calyx at the new speed
- AI service tools return updated distances and approach windows
- Routing service finds optimal Calyx routes with updated timing
- All prices that involve Calyx update automatically

No code changes. No restarts (the gateway reads config at startup — restart needed for the config change to take effect, but the point is no code is touched).

## The Orbital Window Rating

The 1–5 star rating displayed on voyage search results is calculated from `orbitalWindowRating.thresholds` in config:

```json
"orbitalWindowRating": {
  "thresholds": {
    "rating5": 0.20,
    "rating4": 0.40,
    "rating3": 0.65,
    "rating2": 0.85,
    "rating1": 1.00
  }
}
```

The calculation normalises the current distance between origin and destination against the historical min/max separation for that route pair over one synodic period. A value of 0.0 means the planets are at their absolute closest; 1.0 means furthest apart.

If `normalised ≤ 0.20` → 5 stars. The thresholds are all configurable.
