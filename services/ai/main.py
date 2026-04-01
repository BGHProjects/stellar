"""
Stellar AI Chatbot Service — FastAPI application.

Exposes a single /chat endpoint that the Go gateway proxies to.
The frontend never calls this service directly.

Endpoints:
  POST /chat        — Send a message, receive a response
  GET  /health      — Health check
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from config.settings import config
from agent.chat import chat

app = FastAPI(
    title="Stellar AI Chatbot Service",
    description="Agentic chatbot for the Stellar interplanetary voyage booking system.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],  # Gateway only
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────────────
# Request / response models
# ─────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role:    str = Field(..., pattern="^(user|assistant)$")
    content: str


class ChatRequest(BaseModel):
    message:             str = Field(..., min_length=1, max_length=4000)
    conversationHistory: list[ChatMessage] = Field(default_factory=list)


class ChatResponse(BaseModel):
    reply:               str
    conversationHistory: list[ChatMessage]


# ─────────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status":  "ok",
        "service": "stellar-ai",
        "model":   config.ANTHROPIC_MODEL,
        "system_config_loaded": bool(config.SYSTEM_CONFIG_PATH),
    }


@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(req: ChatRequest):
    """
    Accepts a user message and conversation history.
    Returns the assistant's reply and the updated conversation history.

    The conversation history must be sent on every request — this service
    is stateless between calls. The gateway passes through the full history
    from the frontend widget.
    """
    if not config.ANTHROPIC_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="AI service is not configured — ANTHROPIC_API_KEY is missing.",
        )

    # Convert Pydantic models to plain dicts for the Anthropic client
    history = [{"role": m.role, "content": m.content} for m in req.conversationHistory]

    try:
        reply, updated_history = chat(req.message, history)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

    # Convert back to Pydantic models for the response
    response_history = [
        ChatMessage(role=m["role"], content=m["content"] if isinstance(m["content"], str) else "")
        for m in updated_history
        if isinstance(m.get("content"), str)
    ]

    return ChatResponse(reply=reply, conversationHistory=response_history)


# ─────────────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=config.PORT, reload=True)