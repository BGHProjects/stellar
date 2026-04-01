"""
Stellar Vision Service — Litestar application.

Handles facial landmark vector storage and comparison for Face ID authentication.

Key design principle: no images are ever received, stored, or processed here.
The browser runs face-api.js (TensorFlow.js) to extract a 128-dimensional
landmark vector locally. Only that numeric vector is transmitted to this service.

Endpoints:
  POST /enrol        — Store a facial landmark vector for a user
  POST /authenticate — Compare a presented vector against a stored one
  GET  /health       — Health check
"""

import math
import os
from typing import Annotated

import httpx
import numpy as np
from dotenv import load_dotenv
from litestar import Litestar, get, post
from litestar.datastructures import State
from litestar.exceptions import HTTPException
from litestar.params import Body
from pydantic import BaseModel, Field, field_validator

load_dotenv()

PORT               = int(os.getenv("PORT", "8002"))
SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "0.85"))
GATEWAY_URL        = os.getenv("GATEWAY_URL", "http://localhost:8080")
JWT_SECRET         = os.getenv("JWT_SECRET", "")

VECTOR_DIMENSION = 128  # face-api.js produces 128-dimensional descriptors


# ─────────────────────────────────────────────────────────────────
# Request / response models
# ─────────────────────────────────────────────────────────────────

class EnrolRequest(BaseModel):
    user_id: str = Field(..., min_length=1)
    vector:  list[float] = Field(..., description="128-dimensional facial landmark descriptor from face-api.js")

    @field_validator("vector")
    @classmethod
    def validate_vector(cls, v: list[float]) -> list[float]:
        if len(v) != VECTOR_DIMENSION:
            raise ValueError(f"Vector must be {VECTOR_DIMENSION}-dimensional, got {len(v)}")
        return v


class AuthenticateRequest(BaseModel):
    email:  str = Field(..., description="User email — used to look up the stored vector via the gateway")
    vector: list[float] = Field(..., description="128-dimensional facial landmark descriptor from face-api.js")

    @field_validator("vector")
    @classmethod
    def validate_vector(cls, v: list[float]) -> list[float]:
        if len(v) != VECTOR_DIMENSION:
            raise ValueError(f"Vector must be {VECTOR_DIMENSION}-dimensional, got {len(v)}")
        return v


class EnrolResponse(BaseModel):
    success: bool
    message: str


class AuthenticateResponse(BaseModel):
    authenticated: bool
    similarity:    float
    message:       str


# ─────────────────────────────────────────────────────────────────
# Cosine similarity
# ─────────────────────────────────────────────────────────────────

def cosine_similarity(a: list[float], b: list[float]) -> float:
    """
    Compute cosine similarity between two vectors.
    Returns a value in [-1, 1] where 1 = identical direction.
    For face descriptors, values above ~0.85 typically indicate the same person.
    """
    va = np.array(a, dtype=np.float64)
    vb = np.array(b, dtype=np.float64)

    norm_a = np.linalg.norm(va)
    norm_b = np.linalg.norm(vb)

    if norm_a == 0 or norm_b == 0:
        return 0.0

    return float(np.dot(va, vb) / (norm_a * norm_b))


# ─────────────────────────────────────────────────────────────────
# Gateway communication helpers
# ─────────────────────────────────────────────────────────────────

def store_vector_via_gateway(user_id: str, vector: list[float], auth_token: str) -> None:
    """
    Store the face vector by calling the gateway's /api/auth/face-vector endpoint.
    The gateway owns the data store — this service never writes directly.
    """
    with httpx.Client(timeout=10.0) as client:
        resp = client.post(
            f"{GATEWAY_URL}/api/auth/face-vector",
            json={"vector": vector},
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        resp.raise_for_status()


def fetch_user_vector_via_gateway(email: str) -> list[float] | None:
    """
    Fetch a user's stored face vector from the gateway.
    Returns None if the user has no enrolled vector.

    Note: In production this would use a service-to-service auth token.
    For this portfolio implementation we use a dedicated internal endpoint.
    """
    with httpx.Client(timeout=10.0) as client:
        resp = client.get(
            f"{GATEWAY_URL}/api/auth/face-vector",
            params={"email": email},
        )
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
        data = resp.json()
        return data.get("vector")


# ─────────────────────────────────────────────────────────────────
# Route handlers
# ─────────────────────────────────────────────────────────────────

@get("/health")
async def health() -> dict:
    return {
        "status":    "ok",
        "service":   "stellar-vision",
        "threshold": SIMILARITY_THRESHOLD,
        "note":      "No image data is ever received or stored by this service.",
    }


@post("/enrol")
async def enrol(
    data: Annotated[EnrolRequest, Body()],
    request,
) -> EnrolResponse:
    """
    Store a facial landmark vector for a user.

    The vector is sent to the gateway for storage against the user's account.
    The vision service itself stores nothing — it is stateless.

    Requires a valid Bearer JWT in the Authorization header
    (the user must be logged in to enrol their face).
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header required for enrolment")

    token = auth_header.removeprefix("Bearer ")

    try:
        store_vector_via_gateway(data.user_id, data.vector, token)
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Gateway rejected vector storage: {e.response.text}",
        )
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Could not reach gateway: {str(e)}")

    return EnrolResponse(
        success=True,
        message="Facial landmark vector enrolled successfully. No image data was stored.",
    )


@post("/authenticate")
async def authenticate(
    data: Annotated[AuthenticateRequest, Body()],
) -> AuthenticateResponse:
    """
    Compare a presented facial landmark vector against the stored enrolled vector.

    Returns whether authentication succeeded and the similarity score.
    A JWT is issued by the gateway, not here — on success, the frontend
    calls the gateway's /api/auth/login flow with the face auth result.
    """
    try:
        stored_vector = fetch_user_vector_via_gateway(data.email)
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Could not reach gateway: {str(e)}")

    if stored_vector is None:
        return AuthenticateResponse(
            authenticated=False,
            similarity=0.0,
            message="No facial landmark vector enrolled for this account.",
        )

    similarity = cosine_similarity(data.vector, stored_vector)
    authenticated = similarity >= SIMILARITY_THRESHOLD

    return AuthenticateResponse(
        authenticated=authenticated,
        similarity=round(similarity, 4),
        message=(
            "Authentication successful."
            if authenticated
            else f"Face not recognised (similarity {similarity:.3f} < threshold {SIMILARITY_THRESHOLD})."
        ),
    )


# ─────────────────────────────────────────────────────────────────
# App
# ─────────────────────────────────────────────────────────────────

app = Litestar(route_handlers=[health, enrol, authenticate])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)