# Stellar Routing Service

A Django REST framework microservice that finds the optimal visit order for multi-stop interplanetary voyages using a QAOA-inspired quantum optimisation approach.

## What It Solves

When a passenger books a multi-stop voyage (up to 4 destinations), the order in which they visit those destinations affects total journey time significantly — because orbital positions change between legs, and the distance between any two bodies changes daily.

This is a variant of the **Travelling Salesman Problem**: given a set of destinations, find the visit order that minimises total travel time, where travel time between any two bodies depends on when you depart (because the bodies are moving).

## Approach

**For N ≤ 3 destinations (the booking flow maximum):**
Brute-force enumeration of all permutations (max 3! = 6). This is exact, not approximate, and extremely fast.

**For N = 4 destinations:**
QAOA (Quantum Approximate Optimisation Algorithm) via Qiskit's classical simulator. The problem is encoded as a QUBO and solved using the QAOA variational circuit. This is honest about being a classical simulation — real quantum hardware would require significantly more qubits than are currently available for problems of this size, but the algorithm and encoding are the real thing.

**Fallback:**
Nearest-neighbour greedy heuristic if Qiskit is unavailable.

## Stack

| Concern            | Choice                         |
| ------------------ | ------------------------------ |
| Framework          | Django + Django REST Framework |
| Quantum            | Qiskit / qiskit-algorithms     |
| Classical fallback | NumPy + itertools              |

## Setup

```bash
cd services/routing
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver 0.0.0.0:8003
```

## Endpoints

### `POST /optimise`

**Request:**

```json
{
  "bodyIds": ["kalos", "calyx", "lun"],
  "startBodyId": "aethon",
  "departureDay": 12500.0,
  "shipClassId": "solaris"
}
```

**Response:**

```json
{
  "optimisedOrder": ["calyx", "lun", "kalos"],
  "totalDays": 287.4,
  "legs": [
    {
      "from": "aethon",
      "to": "calyx",
      "departDay": 12500.0,
      "arriveDay": 12692.0,
      "durationDays": 192.0,
      "distanceAU": 4.8
    }
  ],
  "method": "brute_force_exact",
  "shipClass": "solaris",
  "departureDay": 12500.0
}
```

### `GET /health`

Returns service status, Qiskit availability, and configuration.

## Environment Variables

| Variable             | Default                    | Required   | Description                                          |
| -------------------- | -------------------------- | ---------- | ---------------------------------------------------- |
| `PORT`               | `8003`                     | No         | Port (set in runserver command)                      |
| `DEBUG`              | `False`                    | No         | Django debug mode                                    |
| `SECRET_KEY`         | dev key                    | Yes (prod) | Django secret key                                    |
| `SYSTEM_CONFIG_PATH` | `../../config/system.json` | No         | Path to system config                                |
| `QAOA_LAYERS`        | `2`                        | No         | Number of QAOA repetition layers (p parameter)       |
| `USE_QAOA`           | `true`                     | No         | Use QAOA simulator (false = classical fallback only) |

## Notes on the Quantum Approach

The QAOA implementation here is legitimate quantum computing applied to a real combinatorial optimisation problem. A few honest caveats worth understanding:

**Classical simulation:** Qiskit's `Sampler` primitive runs a classical simulation of the quantum circuit. Real quantum advantage on TSP only appears at problem sizes far beyond what's useful for a booking flow (hundreds of cities). For N ≤ 4 destinations, the brute-force exact solver is actually optimal — but QAOA is used for N = 4 to demonstrate the quantum encoding.

**QUBO encoding:** The problem is correctly encoded as a Quadratic Unconstrained Binary Optimisation problem with one binary variable per (destination, position) pair, with penalty terms enforcing that each destination is visited exactly once and each position is filled exactly once.

**Portfolio value:** Being able to explain "I implemented QAOA via Qiskit for route optimisation, running on a classical simulator, because real quantum hardware doesn't yet have the qubit count for meaningful advantage at this problem size" is a stronger answer than claiming quantum magic. The encoding, the variational circuit, and the hybrid classical-quantum optimisation loop are all real.
