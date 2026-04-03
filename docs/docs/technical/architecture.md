---
id: architecture
title: Architecture Overview
sidebar_position: 1
---

# Architecture Overview

Stellar uses a polyglot microservice architecture where the frontend exclusively communicates with a Go gateway. No microservice is ever called directly from the browser.

## Service Map

```
Frontend (React/Vite)   :5173
        │
        │ All API calls via /api/*
        ▼
Go Gateway (Chi)        :8080
  ├── Auth (JWT)
  ├── Voyage Search (orbital calculations)
  ├── Booking Management (JSON store)
  ├── System Config (serves system.json)
  └── Proxy ──► AI Service (FastAPI)     :8001
               ├── Vision Service (Litestar)  :8002
               └── Routing Service (Django)   :8003
```

## Design Principles

**Single entry point.** The frontend only knows the gateway's address. Microservice URLs, ports, and implementations are entirely opaque to the browser. This means microservices can be swapped, relocated, or disabled without any frontend changes.

**Config-driven.** `config/system.json` is the canonical source of truth for all system parameters. Every service reads from it. No orbital period, ship speed, pricing multiplier, or route frequency is hardcoded in any service — they all derive from config. Changing a single value in `system.json` flows through to all calculations automatically.

**Repository pattern.** The gateway uses a repository pattern for data access. Handlers and services never read or write files directly — they call repository methods. The current backing store is local JSON files, but the interface is identical to what a PostgreSQL implementation would look like.

**Orbital agreement.** The orbital position formula is implemented four times — in Go (gateway), TypeScript (frontend), and Python (AI service and routing service). All four read from the same `system.json` values, so they always agree on where every body is regardless of which service is doing the calculation.

## Technology Choices

| Service         | Language   | Framework    | Rationale                                                                     |
| --------------- | ---------- | ------------ | ----------------------------------------------------------------------------- |
| Gateway         | Go         | Chi          | Fast, statically typed, excellent concurrency, natural fit for an API gateway |
| AI Service      | Python     | FastAPI      | Async, excellent Anthropic SDK support, fast iteration on agent logic         |
| Vision Service  | Python     | Litestar     | Modern async Python framework, minimal footprint for a thin service           |
| Routing Service | Python     | Django       | DRF for mature API tooling; Qiskit runs well in Django's sync views           |
| Frontend        | TypeScript | React + Vite | R3F for 3D, React Query for server state, Zustand for booking funnel state    |

## Data Flow: Voyage Search

A voyage search request illustrates the full data flow:

1. User fills the search form on the landing page
2. Frontend calls `GET /api/voyages/search?originId=aethon&destinationId=kalos&...`
3. Gateway receives the request, validates parameters
4. Gateway calls `VoyageService.SearchVoyages()` which:
   - Looks up both bodies in the body map (built from `system.json` at startup)
   - Calculates the simulation day from today's date
   - For each scheduled departure on the route, calculates duration via `orbital.VoyageDuration()`
   - Calculates the orbital window rating using `orbital.WindowRating()`
   - Applies pricing multipliers from config
5. Gateway returns a list of `Voyage` objects with calculated durations and prices
6. Frontend renders the search results with orbital window stars

The same orbital formula is used by the TypeScript renderer to position the planets in the 3D map — so the "5 star window" displayed in search results corresponds exactly to how close together the planets look in the star map.
