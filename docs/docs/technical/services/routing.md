---
id: routing
title: Routing Service
sidebar_position: 3
---

# Routing Service

**Framework:** Django + DRF  
**Port:** 8003  
**Purpose:** Quantum-inspired optimisation of multi-stop voyage visit order

## The Problem

When a passenger wants to visit three moons in the Vareth system, the optimal visit order depends on where each moon is in its orbit when the ship would arrive — not just departure-day distance. A moon that appears closer at departure may be further by the time the first leg is complete.

This is a variant of the **Travelling Salesman Problem** over a dynamic cost matrix where distances change with time.

## The Optimiser

For each request, the service:

1. Builds a cost matrix where `cost[i][j]` = voyage time from body `i` to body `j` using live orbital positions
2. Selects an optimisation strategy based on problem size:

| N destinations     | Strategy          | Why                                           |
| ------------------ | ----------------- | --------------------------------------------- |
| ≤ 3                | Brute-force exact | 6 permutations max — always optimal, instant  |
| 4–6 with Qiskit    | QAOA simulator    | Quantum-inspired, legitimate QAOA formulation |
| 4–6 without Qiskit | Nearest-neighbour | Classical heuristic fallback                  |

## QAOA Formulation

The TSP is encoded as a **QUBO** (Quadratic Unconstrained Binary Optimisation) problem. Binary variables `x[i][p]` encode "destination `i` is visited at position `p`". The objective minimises total cost subject to constraints that each destination is visited exactly once and each position is filled exactly once.

Qiskit's `MinimumEigenOptimizer` with QAOA and COBYLA optimiser solves the QUBO on a classical statevector simulator.

:::note Honesty About Quantum
This runs on Qiskit's **classical simulator**, not real quantum hardware. For 3-destination problems (the booking flow maximum), classical exact search is always used anyway. The QAOA formulation demonstrates the approach and scales to real quantum hardware — IBM Quantum's free cloud tier supports real execution if you want to extend this.
:::

## Response Format

```json
{
  "optimisedOrder": ["kalos", "mira", "thal"],
  "totalDays": 28.4,
  "legs": [
    {
      "from": "aethon",
      "to": "kalos",
      "departDay": 12500.0,
      "arriveDay": 12522.3,
      "durationDays": 22.3,
      "distanceAU": 1.23
    }
  ],
  "method": "brute_force_exact",
  "shipClass": "tethys"
}
```

The `method` field tells you which optimiser was used — useful for debugging and for demonstrating the QAOA path in a live demo.
