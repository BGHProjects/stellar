---
id: how-voyages-work
title: How Voyages Work
sidebar_position: 1
---

# How Voyages Work

Stellar operates more like a cruise line than an airline. The journey takes weeks or months. The ship is as much the experience as the destination. Choosing how you travel is as important as choosing where.

## The Booking Flow

Booking a voyage happens in six steps:

1. **Search** — enter origin, destination, departure date, and passenger count
2. **Voyage Detail** — select your cryostasis option and cabin class
3. **Packages** — add journey protection, dining upgrades, recreation, entertainment, and expedition extras
4. **Passenger Details** — fill in traveller information and apply loyalty points
5. **Review & Payment** — confirm everything and choose full payment or Voyage Bond
6. **Confirmation** — receive boarding passes for each passenger

## What Makes a Voyage

Each scheduled voyage has these key attributes:

**Route** — the origin and destination bodies, and the route type (Direct Transfer, Gravity Assist, Multi-Stop, or Scenic).

**Ship class** — Helion, Tethys, Lunara, or Solaris. The class determines speed, cabin options, cryo availability, and amenity access.

**Departure day** — a specific simulation day derived from the route's fixed departure schedule. Schedules are deterministic — the same date always produces the same set of available departures.

**Duration** — calculated at query time from the orbital positions of origin and destination on the departure day, divided by the ship class's cruise speed. Duration changes with every departure as planetary positions shift.

**Price** — derived from the base route price multiplied by the orbital window rating, route type, cabin class, and cryo option. Prices change with every departure for the same reason durations do.

## Multi-Leg Journeys

Up to three destinations can be chained into a single booking. Each leg is selected independently — you pick a voyage for Leg 1, configure it (cryo, cabin, add-ons), then move to Leg 2. All legs share the same passengers but can have different cabin classes and add-ons.

The route optimiser (available for three or more destinations) can reorder your desired destinations to minimise total journey time, accounting for orbital positions at each leg's departure.

## The Voyage Bond

For voyages booked well in advance, a Voyage Bond locks in today's price with a 20% deposit. The remaining 80% is due closer to departure. This reflects the reality that some outer-system voyages are booked a year or more in advance — locking in a 5-star orbital window price before the window closes is genuinely valuable.
