"""
Config loader for the Stellar AI service.
Reads system.json and environment variables once at startup.
All other modules import from here — no module reads env vars directly.
"""

import json
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()


class Config:
    PORT:               int  = int(os.getenv("PORT", "8001"))
    ANTHROPIC_API_KEY:  str  = os.getenv("ANTHROPIC_API_KEY", "")
    ANTHROPIC_MODEL:    str  = os.getenv("ANTHROPIC_MODEL", "claude-haiku-4-5-20251001")
    MAX_TOKENS:         int  = int(os.getenv("MAX_TOKENS", "1024"))
    SYSTEM_CONFIG_PATH: str  = os.getenv("SYSTEM_CONFIG_PATH", "../../config/system.json")
    GATEWAY_URL:        str  = os.getenv("GATEWAY_URL", "http://localhost:8080")

    def __post_init__(self):
        if not self.ANTHROPIC_API_KEY:
            raise ValueError("ANTHROPIC_API_KEY is required")


config = Config()


def load_system_config() -> dict:
    """Load and return the canonical system.json config."""
    path = Path(config.SYSTEM_CONFIG_PATH)
    if not path.exists():
        raise FileNotFoundError(f"system.json not found at {path.resolve()}")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


# Load once at import time — treat as read-only throughout
try:
    SYSTEM_CONFIG = load_system_config()
except FileNotFoundError as e:
    print(f"[WARNING] Could not load system config: {e}. Orbital tools will be unavailable.")
    SYSTEM_CONFIG = {}