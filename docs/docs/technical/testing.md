---
id: testing
title: Testing
sidebar_position: 6
---

# Testing

Stellar uses three levels of testing: unit tests per service, integration tests at the API layer, and end-to-end tests via Playwright.

## Unit Tests

### Gateway (Go)

```bash
cd gateway
go test ./...
```

The most valuable unit tests in the gateway are the orbital calculation functions — they are pure functions with known outputs for known inputs, making them ideal test targets.

```go
// orbital/orbital_test.go
func TestPosition(t *testing.T) {
    params := OrbitalParams{OrbitalRadius: 1.1, Period: 380, Eccentricity: 0.03, StartPhase: 163}
    x, y := Position(params, 0)
    // At day 0, position should match the start phase
    expectedAngle := 163.0 * math.Pi / 180.0
    assert.InDelta(t, math.Cos(expectedAngle)*1.1, x, 0.001)
}

func TestVoyageDuration(t *testing.T) {
    // Aethon to Calyx at average separation should take ~168–192 days on Solaris
    origin := OrbitalParams{OrbitalRadius: 1.1, Period: 380, Eccentricity: 0.03, StartPhase: 163}
    dest   := OrbitalParams{OrbitalRadius: 5.8, Period: 2400, Eccentricity: 0.07, StartPhase: 318}
    dur    := VoyageDuration(origin, dest, 0, 0.025, 2)
    assert.Greater(t, dur, 120.0)
    assert.Less(t, dur, 250.0)
}
```

Key test areas:

- Orbital position calculation at specific day values
- `VoyageDuration` produces physically plausible outputs
- `WindowRating` returns values in [1, 5]
- Pricing formula — correct application of all multipliers
- Schedule generation — departures are on the correct frequency
- Auth — password hashing, JWT issue/validate roundtrip

### AI Service (Python/pytest)

```bash
cd services/ai
pytest
```

Key test areas:

- Tool handlers return correctly structured responses
- Orbital calculations match Go implementation for identical inputs
- `voyage_duration` produces consistent results with gateway
- Tool dispatch handles unknown tool names gracefully

### Vision Service (Python/pytest)

```bash
cd services/vision
pytest
```

Key test areas:

- `cosine_similarity` returns 1.0 for identical vectors
- `cosine_similarity` returns ~0 for orthogonal vectors
- Authentication rejects vectors below the threshold
- Zero-length vectors handled gracefully

### Routing Service (Python/pytest)

```bash
cd services/routing
python manage.py test
```

Key test areas:

- Brute-force exact gives same result as QAOA for N=2
- `build_cost_matrix` produces symmetric reasonable values
- Optimiser handles duplicate body IDs gracefully
- `voyage_duration` matches AI service implementation

## Integration Tests

Integration tests verify the gateway's endpoints with real service instances running. These are run against a local environment with seeded fixture data.

Key scenarios:

- Full voyage search returns results with correct orbital calculations
- Booking creation → retrieval → cancellation roundtrip
- Auth flow — register → login → refresh → protected endpoint access
- Price calculation matches the booking creation price

## End-to-End Tests (Playwright)

```bash
cd frontend
pnpm test:e2e
```

Playwright tests run against the full local environment (all services running) or against mock mode for CI.

Key flows tested:

- Landing page quick search → results → voyage detail navigation
- Full booking funnel — all six pages, happy path
- Multi-leg booking flow
- Auth flow — register, login, logout, protected page redirect
- Star map — body selection, side panel, route arcs
- Profile — loyalty tier display, face ID enrolment UI
- Bookings page — upcoming, cancel flow

## Running Everything Locally

```bash
# Terminal 1
cd gateway && go run .

# Terminal 2
cd services/ai && python main.py

# Terminal 3
cd services/vision && python main.py

# Terminal 4
cd services/routing && python manage.py runserver 0.0.0.0:8003

# Terminal 5
cd frontend && pnpm dev

# Tests
cd gateway && go test ./...
cd frontend && pnpm test:e2e
```

## CI Considerations

For CI, set `VITE_MOCK_MODE=true` in the frontend environment so Playwright tests run without needing the full backend stack. The orbital renderer and booking flow UI tests all function correctly in mock mode. Backend unit tests run independently per service.
