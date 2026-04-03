---
id: booking-flow
title: Booking Flow
sidebar_position: 3
---

# Booking Flow

The booking flow is a six-page wizard that maintains state across navigation in a Zustand store. Pages are lazy-loaded for code splitting.

## Pages

| Step | Route           | Component              |
| ---- | --------------- | ---------------------- |
| 1    | `/search`       | `SearchResultsPage`    |
| 2    | `/voyage/:id`   | `VoyageDetailPage`     |
| 3    | `/packages`     | `PackagesPage`         |
| 4    | `/passengers`   | `PassengerDetailsPage` |
| 5    | `/review`       | `ReviewPaymentPage`    |
| 6    | `/confirmation` | `ConfirmationPage`     |

The landing page (`/`) handles search initiation — both the Quick Search form and the Explore Mode star map funnel into the same `/search` route.

## State Management

The entire in-progress booking lives in `bookingStore` (Zustand):

```typescript
interface BookingState {
  currentStep: BookingStep;
  searchParams: SearchParams | null; // origin, destination, dates, pax
  legs: BookingLeg[]; // one per leg (multi-stop)
  passengers: PassengerRequest[]; // shared across all legs
  loyaltyPointsToRedeem: number;
  isVoyageBond: boolean;
  completedBookingIds: string[]; // set on confirmation
}
```

Each `BookingLeg` holds:

- The selected `Voyage` object (from search results)
- `routeTypeId`, `cryoOptionId`, `cabinClassId`
- `departurePortId`, `arrivalPortId`
- `addOnIds[]`

**Why Zustand instead of URL state?** The booking funnel requires carrying complex structured data (a full voyage object, a list of add-on IDs, passenger details) across six page navigations. URL state works for simple key-value data; Zustand is cleaner for structured objects.

## Multi-Leg Journeys

Multi-stop bookings add legs to `legs[]`. Each leg is configured independently — different cryo, different cabin class, different add-ons — but passengers are shared. The booking review page shows all legs together with a combined price.

On confirmation, `createBooking` is called once per leg. All legs in a group share a `groupId` (a UUID generated for the group on the first leg).

## Voyage Selection Flow

1. `SearchResultsPage` calls `addLeg()` with the selected voyage and a default `routeTypeId`
2. `VoyageDetailPage` calls `updateLeg()` to set `cryoOptionId` and `cabinClassId`
3. `PackagesPage` calls `updateLeg()` to set `addOnIds`
4. `PassengerDetailsPage` calls `setPassengers()` and `setLoyaltyPointsToRedeem()`
5. `ReviewPaymentPage` calls `createBooking()` for each leg and `setCompletedBookingIds()`
6. `ConfirmationPage` reads `completedBookingIds` and `legs` to render boarding passes

## Live Pricing

`ReviewPaymentPage` shows an estimated total calculated client-side from the booking store state. For the exact itemised breakdown, it calls the gateway's `POST /api/voyages/price` endpoint. This ensures the final price matches what the server will charge.

## Booking Store Reset

After confirmation, `resetBooking()` clears the entire store back to initial state. This prevents stale booking data appearing if the user starts a new search from the confirmation page.

## Protected Pages

`PassengerDetailsPage`, `ReviewPaymentPage`, and `ConfirmationPage` check that required previous steps are complete — specifically that `legs` is non-empty. If a user navigates directly to `/review` with no booking in progress, they are redirected back to `/`.

## The Boarding Pass

`ConfirmationPage` renders one `BoardingPass` component per passenger per leg. Each boarding pass is a styled card designed as an artefact from the fictional world — ship name, passenger name, cabin class, cryo status, departure date, arrival date, voyage number, and orbital window rating stars.

The boarding pass uses a perforation-style divider (negative-margin circles) and a top accent stripe in the accent colour — visual details that make it feel like a genuine physical object.
