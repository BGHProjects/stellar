---
id: overview
title: Frontend Overview
sidebar_position: 1
---

# Frontend Overview

**Stack:** React 18, Vite, TypeScript, Tailwind CSS, React Three Fibre, Framer Motion, Zustand, React Query

## Structure

```
frontend/src/
├── pages/          # One file per route
├── components/
│   ├── ui/         # Button, Badge, Card, Input, Select, Spinner
│   ├── layout/     # Navbar, BookingStepIndicator, PageWrapper
│   └── common/     # AnimatedText, ImagePlaceholder, Modal, MobileGate
├── lib/
│   ├── api.ts      # Typed gateway client — all fetch calls live here
│   ├── orbital.ts  # TypeScript orbital mechanics (mirrors Go)
│   ├── utils.ts    # cn(), formatCredits(), formatDuration(), etc.
│   ├── animations.ts  # All Framer Motion variants — one place
│   ├── planetData.ts  # Planet lore and display data
│   └── fleetData.ts   # Ship class lore and specs
├── store/
│   ├── authStore.ts    # Zustand — user session
│   └── bookingStore.ts # Zustand — booking funnel state across all 6 pages
└── types/
    ├── system.ts   # TypeScript mirrors of Go config structs
    └── voyage.ts   # TypeScript mirrors of Go model structs
```

## State Management

**React Query** handles all server state — voyage search results, system config, booking data. Queries are cached and refetched as needed.

**Zustand** handles client state — the authenticated user session and the entire in-progress booking across the six-page funnel. The booking store persists every selection (voyage, cryo, cabin, add-ons, passengers) so the user can navigate back and forward without losing progress.

## Animation System

All Framer Motion variants are defined in `lib/animations.ts`. To change the animation feel of the entire app, edit one file:

- `loomUp` — hero title animation (looms upward with scale + blur)
- `staggerContainer` / `staggerItem` — left-to-right cascading lists
- `letterContainer` / `letterVariant` — per-character text animation
- `modalExpand` — circle-origin modal expansion
- `pageEnter` — deliberate page transition
- `starMapEnter` — cinematic star map reveal
- `sidePanelEnter` — star map planet detail panel
