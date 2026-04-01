# Stellar Vision Service

A minimal Litestar microservice for facial landmark vector storage and comparison. This service implements the server-side component of Stellar's Face ID authentication.

## The Privacy Model

This service **never receives, processes, or stores image data**. The entire ML pipeline runs client-side:

1. The browser loads `face-api.js` (TensorFlow.js)
2. `face-api.js` accesses the device camera and extracts a **128-dimensional numeric vector** describing facial landmark geometry
3. Only that vector — a list of 128 floating-point numbers — is transmitted to this service
4. This service stores the vector (via the gateway) or compares it against a stored vector using cosine similarity

No face images exist anywhere in the system after enrolment.

## Stack

| Concern      | Choice                                              |
| ------------ | --------------------------------------------------- |
| Framework    | Litestar                                            |
| Similarity   | NumPy cosine similarity                             |
| Data storage | Delegated to Go gateway (this service is stateless) |

## Endpoints

### `POST /enrol`

Stores a facial landmark vector for a user. Requires a valid Bearer JWT (user must be authenticated). Forwards the vector to the gateway for storage.

**Request body:**

```json
{
  "user_id": "uuid-here",
  "vector": [0.123, -0.456, ...]  // 128 floats from face-api.js
}
```

### `POST /authenticate`

Compares a presented vector against the enrolled vector for a user. Returns a similarity score and authentication result.

**Request body:**

```json
{
  "email": "user@example.com",
  "vector": [0.123, -0.456, ...]  // 128 floats from face-api.js
}
```

**Response:**

```json
{
  "authenticated": true,
  "similarity": 0.9134,
  "message": "Authentication successful."
}
```

### `GET /health`

## Setup

```bash
cd services/vision
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env
# Set JWT_SECRET to match the gateway's JWT_SECRET
python main.py
```

## Environment Variables

| Variable               | Default                 | Required | Description                                  |
| ---------------------- | ----------------------- | -------- | -------------------------------------------- |
| `PORT`                 | `8002`                  | No       | Port to listen on                            |
| `SIMILARITY_THRESHOLD` | `0.85`                  | No       | Minimum cosine similarity for authentication |
| `GATEWAY_URL`          | `http://localhost:8080` | No       | Go gateway base URL                          |
| `JWT_SECRET`           | —                       | Yes      | Must match gateway JWT_SECRET                |

## Similarity Threshold

The default threshold of `0.85` is a reasonable starting point for face-api.js 128-dimensional descriptors. Increase it (towards 1.0) for stricter matching; decrease it (towards 0.6) if legitimate users are being rejected. The similarity score is returned in every authentication response so you can tune this empirically.
