---
id: overview
title: Gateway Overview
sidebar_position: 1
---

# Gateway Overview

The Go gateway is the heart of the application. It is the only service the frontend communicates with, and the only service that writes to the data store.

## Responsibilities

- **Authentication** — JWT registration, login, token refresh, and facial landmark vector storage
- **Voyage search** — calculates orbital-influenced journey durations and pricing in real time from `system.json`
- **Booking management** — creates, retrieves, and cancels bookings via the repository layer
- **System config** — serves all orbital, route, ship, and pricing configuration to the frontend
- **Proxy** — forwards requests to the AI, vision, and routing microservices

## Structure

```
gateway/
├── main.go              # Entry point, dependency injection, route registration
├── config/config.go     # Typed structs for system.json + env vars
├── orbital/orbital.go   # Position, distance, voyage duration, window rating
├── data/store.go        # JSON file read/write abstraction
├── models/              # User, Booking, Voyage types
├── repository/          # Data access — user_repo.go, booking_repo.go
├── services/            # Business logic — auth, voyage, booking, proxy
├── handlers/            # HTTP handlers with Swagger annotations
└── middleware/          # JWT auth, CORS, request logger
```

## Viewing the API

With the gateway running, the full interactive Swagger UI is at:

```
http://localhost:8080/swagger/index.html
```

All endpoints are documented with request/response schemas. You can authenticate using the **Authorize** button and execute live requests from the browser.

If you add or change an endpoint, regenerate the docs:

```bash
cd gateway
swag init
```

## The Repository Pattern

The `repository/` package abstracts all data access. Services call `userRepo.GetByEmail()`, not `json.Decode()`. The current backing store is local JSON files — but the interface is designed so a PostgreSQL implementation could replace it without touching any handler or service code.

## Degraded Mode

If a microservice is unavailable, the gateway returns `503 Service Unavailable` for that proxy endpoint without affecting other endpoints. The AI chatbot, face authentication, and route optimisation can all be absent without breaking voyage search, booking, or authentication.
