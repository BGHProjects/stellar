---
id: orbital-windows
title: Orbital Windows & Pricing
sidebar_position: 2
---

# Orbital Windows & Pricing

The single most distinctive feature of Stellar's pricing is that **fares change based on where the planets are**. A voyage booked during a 5-star orbital window is both cheaper and shorter than the same voyage booked during a 1-star window.

## What Is an Orbital Window?

Planets move. The distance between Aethon and Calyx varies from roughly 3.2 AU at closest approach to nearly 7.0 AU at maximum separation — more than double. A ship travelling at 0.025 AU/day takes 128 days at closest approach and 280 days at furthest separation. That's a 152-day difference in journey time for the same route on the same ship.

The orbital window rating (1–5 stars) expresses where in this cycle the planets are at a given departure date.

## How the Rating Is Calculated

The rating normalises current separation against the historical min/max for that route pair over one full synodic period:

```
normalised = (currentDistance - minimumDistance) / (maximumDistance - minimumDistance)
```

| normalised  | Rating               |
| ----------- | -------------------- |
| 0.00 – 0.20 | ⭐⭐⭐⭐⭐ Excellent |
| 0.21 – 0.40 | ⭐⭐⭐⭐ Good        |
| 0.41 – 0.65 | ⭐⭐⭐ Average       |
| 0.66 – 0.85 | ⭐⭐ Poor            |
| 0.86 – 1.00 | ⭐ Unfavourable      |

A rating of 5 means the planets are within the closest 20% of their separation range. A rating of 1 means they're in the furthest 15%.

## How Rating Affects Price

| Rating           | Price Multiplier       |
| ---------------- | ---------------------- |
| 5 — Excellent    | 0.80× (20% below base) |
| 4 — Good         | 0.92×                  |
| 3 — Average      | 1.00× (base price)     |
| 2 — Poor         | 1.14×                  |
| 1 — Unfavourable | 1.35× (35% above base) |

These multipliers apply before cabin class, cryo, and route type adjustments. All multipliers are configurable in `system.json`.

## Practical Implications

**Booking during a 5-star window** means you pay 20% less than base and arrive significantly sooner. For the Aethon–Calyx route, that could mean a 128-day voyage instead of 280 days at 80% of the base price.

**Booking during a 1-star window** is not wrong — sometimes you need to travel when you need to travel. But if you have flexibility, the chatbot can tell you when the next good window opens.

## Asking the Chatbot

The AI chatbot has access to the `find_closest_approach` tool and will tell you the optimal departure window for any route:

> "When is the next 5-star window for Aethon to Calyx?"

> "What's the cheapest month to travel from Kalos to Lun this year?"

> "How long would it take to get from Aethon to Calyx if I left next Tuesday?"

All responses use live orbital calculations from the same formula as the booking system.
