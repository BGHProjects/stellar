---
id: vision
title: Vision Service
sidebar_position: 2
---

# Vision Service

**Framework:** Litestar  
**Port:** 8002  
**Purpose:** Facial landmark vector storage and cosine similarity comparison

## Privacy Design

This service never receives, processes, or stores image data. The full ML pipeline runs in the browser:

1. User grants camera permission in the browser
2. `face-api.js` (TensorFlow.js) loads locally — no external requests
3. Camera feed is processed on-device to extract 128 facial landmark coordinates
4. **Only the 128-float vector** is sent to this service

There is no way to reconstruct a face from a 128-dimensional numeric vector. The enrolled data is mathematically similar to storing a fingerprint hash rather than a fingerprint image.

## Endpoints

### `POST /enrol`

Receives a vector and user ID, forwards the vector to the gateway for storage. Requires a valid Bearer JWT.

### `POST /authenticate`

Receives a vector and email address. Fetches the enrolled vector from the gateway, computes cosine similarity, returns match result and similarity score.

## Similarity Threshold

Default threshold: **0.85**. Configurable via `SIMILARITY_THRESHOLD` env var.

| Similarity | Interpretation                         |
| ---------- | -------------------------------------- |
| > 0.90     | Very strong match                      |
| 0.85–0.90  | Good match (default threshold)         |
| 0.70–0.85  | Possible match — face may have changed |
| < 0.70     | Different person                       |

The similarity score is always returned in the response so the threshold can be tuned empirically.
