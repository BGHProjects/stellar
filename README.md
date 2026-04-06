# Stellar

An interplanetary voyage booking application set in the fictional Solara binary star system. Built as a full-stack portfolio project demonstrating a polyglot microservice architecture, orbital mechanics simulation, 3D rendering, agentic AI, and biometric authentication.

You can view a deployment with reduced functionality [here](https://stellar-frontend-ten.vercel.app/).
<br />
You can view a Docusaurus wiki breaking down the technical implementation, the fictional star system, and how a voyage works on the app [here](https://stellar-docs-one.vercel.app/).

---

## What It Is

Stellar is a cruise-style booking experience for commercial space travel. Users search for voyages between planets and moons, configure their journey (ship class, cryostasis option, cabin tier, add-ons), review pricing influenced by real-time orbital positions, and receive a generated boarding pass on confirmation.

The application is built around a fictional but internally consistent star system with two binary stars, three colonised planetary systems, a debris field called the Scatter, and a fleet of four ship classes flying 16 scheduled routes.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                             │
│          React + Vite + Tailwind + React Three Fibre        │
│                  localhost:5173                             │
└───────────────────────┬─────────────────────────────────────┘
                        │ All API calls
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                     Go Gateway                              │
│              Chi router + JWT auth                          │
│                  localhost:8080                             │
│                                                             │
│   Auth · Voyage Search · Bookings · System Config           │
└──────┬────────────────┬───────────────┬─────────────────────┘
       │                │               │
       ▼                ▼               ▼
┌──────────┐    ┌───────────┐    ┌────────────┐
│ AI       │    │ Vision    │    │ Routing    │
│ FastAPI  │    │ Litestar  │    │ Django     │
│ :8001    │    │ :8002     │    │ :8003      │
│          │    │           │    │            │
│ Agentic  │    │ Face vec  │    │ QAOA route │
│ chatbot  │    │ compare   │    │ optimiser  │
└──────────┘    └───────────┘    └────────────┘
```

The frontend **exclusively** communicates with the Go gateway. No microservice is ever called directly from the browser.

---

## Repository Structure

```
stellar/
├── config/
│   └── system.json          # Canonical source of truth — all orbital params,
│                            # ship classes, routes, and pricing multipliers
├── frontend/                # React + Vite + Tailwind + R3F
├── gateway/                 # Go — main API gateway
├── services/
│   ├── ai/                  # Python (FastAPI) — agentic chatbot
│   ├── vision/              # Python (Litestar) — face vector auth
│   └── routing/             # Python (Django) — QAOA route optimiser
└── docs/                    # Docusaurus documentation site
```

---

## The System Configuration

`config/system.json` is the **single source of truth** for all system parameters. Every service reads from it. Changing a value — a planet's orbital period, a ship's speed, a route's frequency, a pricing multiplier — automatically flows through to all calculations without touching any code.

See [`config/system.json`](./config/system.json) for the full specification.

---

## Key Features

**Orbital mechanics** — planetary positions are calculated at runtime using the same formula implemented in Go (gateway), TypeScript (frontend renderer), and Python (AI and routing services). Journey durations and prices change based on where the planets actually are on the day of departure.

**3D star map** — React Three Fibre renders the full Solara system with orbiting bodies, the Scatter debris field, and route arcs. Interactive — click any visitable body to see routes, distances, and optimal departure windows.

**Booking flow** — six-page cruise-style booking: search → voyage detail → packages → passengers → review → confirmation. Supports multi-leg journeys, three cryostasis modes, four cabin classes, and a full add-on catalogue.

**Agentic AI chatbot** — Claude-powered agent with seven orbital calculation and voyage search tools. Can answer questions like "when is the cheapest time to fly from Aethon to Calyx" by running live orbital calculations.

**Face ID authentication** — facial landmark extraction runs entirely in the browser via face-api.js (TensorFlow.js). Only a 128-dimensional numeric vector is transmitted — no images ever leave the device.

**Quantum-inspired routing** — Qiskit QAOA simulator finds the optimal visit order for multi-stop voyages by formulating the problem as a QUBO and running on a classical quantum circuit simulator.

---

## Prerequisites

| Tool    | Version | Used by                  |
| ------- | ------- | ------------------------ |
| Go      | 1.23+   | Gateway                  |
| Node.js | 22+     | Frontend                 |
| pnpm    | 9+      | Frontend package manager |
| Python  | 3.11+   | All three services       |
| swag    | latest  | Swagger doc generation   |

Install `swag` (Swagger generator for Go):

```bash
go install github.com/swaggo/swag/cmd/swag@latest
```

---

## Running Locally

Each service runs independently. Start them in any order — the gateway gracefully degrades if a microservice is unavailable.

### 1. Gateway

```bash
cd gateway
cp .env.example .env
# Edit .env — set JWT_SECRET to: openssl rand -hex 32
go mod tidy
swag init
go run .
```

Swagger UI: [http://localhost:8080/swagger/index.html](http://localhost:8080/swagger/index.html)

### 2. Frontend

```bash
cd frontend
cp .env.example .env
pnpm install
pnpm dev
```

App: [http://localhost:5173](http://localhost:5173)

### 3. AI Chatbot Service

```bash
cd services/ai
python -m venv .venv
source .venv/bin/activate   # .venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env
# Edit .env — set ANTHROPIC_API_KEY
python main.py
```

### 4. Vision Service

```bash
cd services/vision
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env — set JWT_SECRET to match gateway
python main.py
```

### 5. Routing Service

```bash
cd services/routing
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver 0.0.0.0:8003
```

---

## Environment Variables

Each service has its own `.env.example` with full documentation. The key values:

| Service | Variable             | Notes                                                                 |
| ------- | -------------------- | --------------------------------------------------------------------- |
| Gateway | `JWT_SECRET`         | Required. Generate: `openssl rand -hex 32`                            |
| Gateway | `SYSTEM_CONFIG_PATH` | Path to `config/system.json`                                          |
| AI      | `ANTHROPIC_API_KEY`  | Required. From [console.anthropic.com](https://console.anthropic.com) |
| Vision  | `JWT_SECRET`         | Must match gateway's value                                            |
| Routing | `USE_QAOA`           | Set `false` to skip Qiskit if install is slow                         |

---

## Mock / Vercel Deployment

The frontend can be deployed to Vercel as a standalone application with no backend required. In this mode, all API calls return pre-generated fixture data — the orbital renderer, booking flow UI, and price calculations remain fully live.

To enable mock mode:

```bash
# In frontend/.env
VITE_MOCK_MODE=true
```

The AI chatbot and facial recognition are replaced with graceful placeholder states. Everything else — including orbital mechanics, the 3D star map, and the full six-page booking flow — operates normally.

---

## Documentation

Full technical and lore documentation is available in the Docusaurus site:

```bash
cd docs
pnpm install
pnpm start
```

Docs: [http://localhost:3000](http://localhost:3000)

---

## Tech Stack Summary

| Layer           | Technology                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------ |
| Frontend        | React 18, Vite, TypeScript, Tailwind CSS, React Three Fibre, Framer Motion, Zustand, React Query |
| Gateway         | Go 1.23, Chi router, JWT, swaggo/swag                                                            |
| AI Service      | Python, FastAPI, Anthropic Claude (tool use)                                                     |
| Vision Service  | Python, Litestar, NumPy                                                                          |
| Routing Service | Python, Django, DRF, Qiskit, NumPy                                                               |
| Fonts           | Lexend Giga (display), Lato (body)                                                               |
| Config          | Single `system.json` — all services derive calculations from it                                  |
