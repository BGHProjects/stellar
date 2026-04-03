---
id: auth
title: Authentication
sidebar_position: 2
---

# Authentication

The gateway handles all authentication. The frontend and microservices never deal with password hashing or token signing.

## JWT Flow

```
Register/Login
  → Gateway validates credentials
  → Issues short-lived access token (24h) + refresh token (30d)
  → Frontend stores tokens in localStorage

Subsequent requests
  → Frontend sends Authorization: Bearer <accessToken>
  → Gateway middleware validates JWT signature and expiry
  → User ID and email injected into request context
  → Handlers read user ID from context — never from request body

Token refresh
  → Frontend calls POST /api/auth/refresh with refreshToken
  → Gateway issues new access + refresh token pair
```

## Passwords

Passwords are hashed with bcrypt at cost factor 10 before storage. The plaintext password is never stored and cannot be recovered.

## Face ID Authentication

Face ID uses a two-component design:

**Client side (browser):**

- `face-api.js` (TensorFlow.js) runs entirely in the browser
- Camera feed is processed locally — no images are transmitted
- Outputs a 128-dimensional float vector describing facial landmark geometry

**Server side (Vision Service → Gateway):**

- Gateway receives the vector and forwards it to the Vision Service
- Vision Service computes cosine similarity against the stored enrolled vector
- Match above threshold (default 0.85) → authentication successful
- Gateway issues a JWT on success

No images are ever stored. The enrolled vector is a list of 128 floating-point numbers. It cannot be used to reconstruct a face image.

## Protected Routes

All `/api/bookings/*` endpoints require authentication. The `Authenticate` middleware checks for a valid Bearer JWT and injects the user ID into the request context. Handlers use this injected user ID — not a user ID from the request body — to prevent users from accessing each other's bookings.
