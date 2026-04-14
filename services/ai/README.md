# Stellar AI Chatbot Service

A FastAPI microservice providing an agentic chatbot for the Stellar voyage booking system. The chatbot can answer natural language questions about the Taunor system, calculate orbital windows, find optimal travel times, and search for available voyages — all powered by live calculations from `system.json`.

## Stack

| Concern              | Choice                                             |
| -------------------- | -------------------------------------------------- |
| Framework            | FastAPI                                            |
| AI Model             | Anthropic Claude (claude-3-5-haiku by default)     |
| Agent Pattern        | Tool-use loop (agentic)                            |
| Orbital Calculations | Python — mirrors Go and TypeScript implementations |

## Architecture

The service uses Anthropic's tool-use pattern. When the model needs factual data — orbital positions, voyage durations, closest approach windows, voyage search results — it calls one of the defined tools. The tool executes against `system.json` (for orbital data) or the Go gateway (for voyage search), and the model uses the result to compose its answer.

```
User message
    → FastAPI /chat endpoint
    → Anthropic API (with tool schemas)
    → Model calls tools as needed
    → Tools query system.json / Go gateway
    → Model composes final response
    → Response returned to gateway → frontend
```

### Available Tools

| Tool                    | Description                                     |
| ----------------------- | ----------------------------------------------- |
| `get_orbital_positions` | Current 2D positions of all system bodies       |
| `get_voyage_duration`   | Journey time between two bodies on a given date |
| `find_closest_approach` | Best departure window in a date range           |
| `search_voyages`        | Available scheduled departures (via gateway)    |
| `get_body_info`         | Facts about a planet or moon                    |
| `get_route_info`        | Schedule and ship class for a specific route    |
| `get_system_overview`   | All visitable bodies, routes, and ship classes  |

## Setup

**1. Navigate to the service directory:**

```bash
cd services/ai
```

**2. Create and activate a virtual environment:**

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate
```

**3. Install dependencies:**

```bash
pip install -r requirements.txt
```

**4. Copy and configure environment variables:**

```bash
cp .env.example .env
```

Set `ANTHROPIC_API_KEY` to your key from [console.anthropic.com](https://console.anthropic.com).

**5. Run the service:**

```bash
python main.py
```

Or with uvicorn directly:

```bash
uvicorn main:app --reload --port 8001
```

The service starts on port `8001` by default.

## Environment Variables

| Variable             | Default                     | Required | Description                                  |
| -------------------- | --------------------------- | -------- | -------------------------------------------- |
| `PORT`               | `8001`                      | No       | Port to listen on                            |
| `ANTHROPIC_API_KEY`  | —                           | **Yes**  | Anthropic API key                            |
| `ANTHROPIC_MODEL`    | `claude-haiku-4-5-20251001` | No       | Model to use                                 |
| `MAX_TOKENS`         | `1024`                      | No       | Max tokens per response                      |
| `SYSTEM_CONFIG_PATH` | `../../config/system.json`  | No       | Path to system config                        |
| `GATEWAY_URL`        | `http://localhost:8080`     | No       | Go gateway base URL (for voyage search tool) |

## Notes

- The service is **stateless** — conversation history must be sent on every request. The gateway passes the full history from the frontend widget.
- The orbital calculation code in `tools/orbital.py` is the third implementation of the same formula (alongside Go and TypeScript). All three read from `system.json`, so they always agree.
- The `search_voyages` tool calls the Go gateway's `/api/voyages/search` endpoint. The gateway must be running for this tool to work; other tools function offline.
- Model costs: `claude-3-5-haiku` is the recommended choice for an embedded chatbot — fast and inexpensive for conversational use.
