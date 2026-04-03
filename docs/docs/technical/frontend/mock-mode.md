---
id: mock-mode
title: Mock Mode (Vercel Deployment)
sidebar_position: 4
---

# Mock Mode

Mock mode allows Stellar to be deployed to Vercel as a frontend-only application with no backend required. All API calls return pre-generated fixture data.

## What Stays Live in Mock Mode

Everything that is pure computation or UI continues to work exactly as normal:

- **3D star map** — orbital renderer runs live, planets move in real time
- **Orbital calculations** — TypeScript `orbital.ts` runs in the browser
- **Booking flow UI** — all six pages, all selections, all animations
- **Price calculations** — derived from config multipliers in TypeScript
- **Boarding pass generation** — purely frontend
- **Authentication UI** — login and register forms (mock responses)

## What Returns Fixture Data

- Voyage search results
- User profile and loyalty balance
- Booking history
- Booking confirmation

## What Is Disabled

- **AI chatbot** — replaced with a "Chat available in full deployment" notice
- **Face ID** — replaced with standard password auth only

## Enabling Mock Mode

```bash
# frontend/.env
VITE_MOCK_MODE=true
```

## How Fixture Data Is Generated

Fixture data should be generated from the real orbital calculations, not hand-written. A generation script runs the TypeScript orbital logic against a range of dates and saves realistic voyage options with real durations, window ratings, and pricing to `src/mock/fixtures/`.

This means the mock feels real — journey durations reflect actual planetary positions and prices reflect actual orbital windows.
