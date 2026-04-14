---
id: intro
title: Introduction
slug: /
sidebar_position: 1
---

# Stellar Documentation

Welcome to the Stellar documentation site. Stellar is a full-stack portfolio project — an interplanetary voyage booking application set in the fictional Taunor binary star system.

Use the navigation on the left to explore:

- **Technical Docs** — architecture, services, frontend implementation, and testing
- **The Taunor System** — planets, moons, the fleet, and the route network
- **Voyages** — how bookings work, orbital windows, scheduling, and all booking options

---

## Quick Links

### For Developers

| Topic                       | Where to go                                                      |
| --------------------------- | ---------------------------------------------------------------- |
| How the services connect    | [Architecture Overview](/technical/architecture)                 |
| The system.json config file | [The Config System](/technical/config-system)                    |
| Running the project locally | [Root README on GitHub](https://github.com)                      |
| API documentation           | Gateway Swagger UI at `http://localhost:8080/swagger/index.html` |

### For the Lore

| Topic                    | Where to go                              |
| ------------------------ | ---------------------------------------- |
| The star system overview | [The Taunor System](/system/overview)    |
| Where you can travel     | [Planets & Moons](/system/bodies/aethon) |
| The ships                | [The Fleet](/system/fleet/overview)      |
| All scheduled routes     | [Route Map](/system/route-map)           |

### For Booking

| Topic                  | Where to go                                           |
| ---------------------- | ----------------------------------------------------- |
| How a voyage is priced | [Orbital Windows & Pricing](/voyages/orbital-windows) |
| Departure schedules    | [Scheduling & Departure Cycles](/voyages/scheduling)  |
| Cryostasis options     | [Cryostasis](/voyages/options/cryostasis)             |
| Cabin classes          | [Cabin Classes](/voyages/options/cabin-classes)       |

---

## About This Project

Stellar demonstrates a polyglot microservice architecture:

- **Go** gateway — the single entry point for all frontend requests
- **React + Vite + TypeScript** frontend — including a live 3D star map via React Three Fibre
- **FastAPI** AI chatbot — agentic, with orbital calculation tools
- **Litestar** vision service — facial landmark vector authentication
- **Django** routing service — QAOA-inspired multi-stop voyage optimisation

All orbital mechanics — planetary positions, journey durations, and prices — are derived at runtime from a single `config/system.json` file. Changing a planet's orbital period or a ship's speed flows through to every calculation automatically, across every service.
