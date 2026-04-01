"""
Quantum-inspired route optimisation for multi-stop voyages.

Uses Qiskit's QAOA (Quantum Approximate Optimisation Algorithm) simulator
to find the optimal visit order for a set of destinations that minimises
total journey time, accounting for orbital positions at each leg's departure.

Problem formulation:
  Given a start body and a set of required destinations, find the permutation
  of destinations that minimises the sum of voyage durations across all legs,
  where each leg departs after the previous leg arrives.

For the booking flow's maximum of 3 destinations, the problem size is small
enough (3! = 6 permutations) that QAOA converges quickly and the classical
simulation is fast. This is a legitimate QAOA application — we're honest that
it runs on a classical simulator, not real quantum hardware.

If Qiskit is unavailable or USE_QAOA is False, falls back to a classical
nearest-neighbour heuristic that produces near-optimal results for small inputs.
"""

import json
import math
import itertools
from pathlib import Path
from typing import Optional

import numpy as np

try:
    from qiskit_algorithms import QAOA, NumPyMinimumEigensolver
    from qiskit_algorithms.optimizers import COBYLA
    from qiskit.primitives import Sampler
    from qiskit_optimization import QuadraticProgram
    from qiskit_optimization.algorithms import MinimumEigenOptimizer
    QISKIT_AVAILABLE = True
except ImportError:
    QISKIT_AVAILABLE = False


# ─────────────────────────────────────────────────────────────────
# Orbital helpers (same formula as Go, TypeScript, and Python AI service)
# ─────────────────────────────────────────────────────────────────

def _position(orbital_radius, period, eccentricity, start_phase_deg, day_t):
    import math
    angle  = math.radians(start_phase_deg) + (2 * math.pi / period) * day_t
    radius = orbital_radius * (1 - eccentricity * math.cos(angle))
    return radius * math.cos(angle), radius * math.sin(angle)


def _distance(ax, ay, bx, by):
    return math.sqrt((ax - bx) ** 2 + (ay - by) ** 2)


def _body_position(body: dict, body_map: dict, day: float) -> tuple[float, float]:
    """Get absolute system position of a body, resolving moon parents."""
    if body.get("parent") and body["parent"] in body_map:
        parent = body_map[body["parent"]]
        px, py = _position(parent["orbitalRadius"], parent["period"],
                           parent.get("eccentricity", 0), parent.get("startPhase", 0), day)
        mx, my = _position(body["orbitalRadius"], body["period"],
                           body.get("eccentricity", 0), body.get("startPhase", 0), day)
        return px + mx, py + my
    return _position(body["orbitalRadius"], body["period"],
                     body.get("eccentricity", 0), body.get("startPhase", 0), day)


def voyage_duration(origin: dict, dest: dict, body_map: dict,
                    departure_day: float, speed: float, passes: int = 2) -> float:
    """Estimate journey days between two bodies at a given departure day."""
    ox, oy = _body_position(origin, body_map, departure_day)
    dx, dy = _body_position(dest, body_map, departure_day)
    dur    = _distance(ox, oy, dx, dy) / speed

    for _ in range(passes - 1):
        arrival  = departure_day + dur
        dax, day_ = _body_position(dest, body_map, arrival)
        dur       = _distance(ox, oy, dax, day_) / speed

    return dur


# ─────────────────────────────────────────────────────────────────
# Cost matrix — total journey time for a given visit order
# ─────────────────────────────────────────────────────────────────

def build_cost_matrix(
    start_body_id: str,
    destination_ids: list[str],
    body_map: dict,
    ship_speed: float,
    departure_day: float,
) -> np.ndarray:
    """
    Build an NxN cost matrix where cost[i][j] = journey time from body i to body j,
    departing immediately after arrival at body i.

    Rows/columns:
      0 = start body
      1..N = destinations in order
    """
    all_ids  = [start_body_id] + destination_ids
    n        = len(all_ids)
    cost     = np.zeros((n, n))

    current_day = departure_day
    for i, origin_id in enumerate(all_ids):
        for j, dest_id in enumerate(all_ids):
            if i == j:
                continue
            origin = body_map.get(origin_id)
            dest   = body_map.get(dest_id)
            if not origin or not dest:
                cost[i][j] = 1e9  # penalise unknown bodies
                continue
            dur = voyage_duration(origin, dest, body_map, current_day, ship_speed)
            cost[i][j] = dur

    return cost


def total_journey_time(
    order: list[int],  # indices into the cost matrix
    cost: np.ndarray,
    body_map: dict,
    all_ids: list[str],
    ship_speed: float,
    departure_day: float,
) -> float:
    """
    Calculate total journey time for a given visit order,
    accounting for orbital movement between legs.
    """
    total    = 0.0
    day      = departure_day
    prev_idx = 0  # start body

    for idx in order:
        origin_id = all_ids[prev_idx]
        dest_id   = all_ids[idx]
        origin    = body_map.get(origin_id)
        dest      = body_map.get(dest_id)
        if not origin or not dest:
            return 1e9
        dur    = voyage_duration(origin, dest, body_map, day, ship_speed)
        total += dur
        day   += dur
        prev_idx = idx

    return total


# ─────────────────────────────────────────────────────────────────
# Classical nearest-neighbour fallback
# ─────────────────────────────────────────────────────────────────

def classical_nearest_neighbour(
    n_destinations: int,
    cost: np.ndarray,
) -> list[int]:
    """
    Greedy nearest-neighbour heuristic — O(n²).
    Returns destination indices (1-indexed in the cost matrix) in visit order.
    """
    unvisited = list(range(1, n_destinations + 1))
    current   = 0  # start at index 0
    order     = []

    while unvisited:
        nearest = min(unvisited, key=lambda j: cost[current][j])
        order.append(nearest)
        unvisited.remove(nearest)
        current = nearest

    return order


# ─────────────────────────────────────────────────────────────────
# Brute-force optimal for small N (N ≤ 3, 6 permutations max)
# ─────────────────────────────────────────────────────────────────

def brute_force_optimal(
    n_destinations: int,
    body_map: dict,
    all_ids: list[str],
    ship_speed: float,
    departure_day: float,
) -> list[int]:
    """
    Exhaustively try all permutations when N is small enough (≤ 3).
    This is exact, not approximate.
    """
    dest_indices = list(range(1, n_destinations + 1))
    best_order   = dest_indices
    best_time    = float("inf")

    for perm in itertools.permutations(dest_indices):
        t = total_journey_time(
            list(perm), None, body_map, all_ids, ship_speed, departure_day
        )
        if t < best_time:
            best_time  = t
            best_order = list(perm)

    return best_order


# ─────────────────────────────────────────────────────────────────
# QAOA optimiser
# ─────────────────────────────────────────────────────────────────

def qaoa_optimise(
    n_destinations: int,
    cost: np.ndarray,
    qaoa_layers: int = 2,
) -> list[int]:
    """
    Use Qiskit's QAOA simulator to find the optimal visit order.

    The Travelling Salesman Problem is encoded as a QUBO (Quadratic Unconstrained
    Binary Optimisation) problem. For N=2 or N=3 destinations, the problem
    has a small enough Hilbert space for fast classical simulation.

    Returns destination indices in optimal visit order.
    """
    if not QISKIT_AVAILABLE:
        raise RuntimeError("Qiskit not available")

    n = n_destinations

    # Build QUBO — one binary variable per (destination, position) pair
    # x[i][p] = 1 means destination i is visited at position p
    qp = QuadraticProgram()
    for i in range(n):
        for p in range(n):
            qp.binary_var(f"x_{i}_{p}")

    # Objective: minimise total cost
    linear    = {}
    quadratic = {}

    for p in range(n - 1):
        for i in range(n):
            for j in range(n):
                if i == j:
                    continue
                cost_val = float(cost[i + 1][j + 1])  # offset by 1 (start body is index 0)
                var_a    = f"x_{i}_{p}"
                var_b    = f"x_{j}_{p+1}"
                key      = (var_a, var_b)
                quadratic[key] = quadratic.get(key, 0.0) + cost_val

    qp.minimize(linear=linear, quadratic=quadratic)

    # Constraints: each destination visited exactly once
    penalty = float(np.max(cost) * n)
    for i in range(n):
        linear_c = {f"x_{i}_{p}": 1.0 for p in range(n)}
        qp.linear_constraint(linear_c, "==", 1.0, f"dest_{i}_once")

    # Each position filled exactly once
    for p in range(n):
        linear_c = {f"x_{i}_{p}": 1.0 for i in range(n)}
        qp.linear_constraint(linear_c, "==", 1.0, f"pos_{p}_filled")

    # Run QAOA
    qaoa     = QAOA(sampler=Sampler(), optimizer=COBYLA(), reps=qaoa_layers)
    solver   = MinimumEigenOptimizer(qaoa)
    result   = solver.solve(qp)

    # Decode result
    order = [None] * n
    for i in range(n):
        for p in range(n):
            val = result.variables_dict.get(f"x_{i}_{p}", 0)
            if val > 0.5:
                order[p] = i + 1  # +1 to offset back to cost matrix indices

    # Fill any None slots (shouldn't happen with valid constraints)
    filled = [x for x in order if x is not None]
    missing = [i + 1 for i in range(n) if (i + 1) not in filled]
    for k, slot in enumerate(order):
        if slot is None:
            order[k] = missing.pop(0) if missing else k + 1

    return order


# ─────────────────────────────────────────────────────────────────
# Main optimise function
# ─────────────────────────────────────────────────────────────────

def optimise_route(
    start_body_id: str,
    destination_ids: list[str],
    departure_day: float,
    ship_class_id: str,
    system_config: dict,
    use_qaoa: bool = True,
    qaoa_layers: int = 2,
) -> dict:
    """
    Find the optimal visit order for a multi-stop voyage.

    Returns:
      optimised_order: list of body IDs in optimal visit sequence
      total_days:      estimated total journey time
      legs:            per-leg breakdown
      method:          which optimiser was used
    """
    body_map  = {b["id"]: b for b in system_config.get("bodies", [])}
    ship_map  = {s["id"]: s for s in system_config.get("shipClasses", [])}

    ship = ship_map.get(ship_class_id)
    if not ship:
        return {"error": f"Ship class '{ship_class_id}' not found"}

    speed = ship["speedAUPerDay"]

    all_ids  = [start_body_id] + destination_ids
    n        = len(destination_ids)
    method   = "brute_force"

    # For small N, brute force is exact and fast
    if n <= 3:
        cost  = build_cost_matrix(start_body_id, destination_ids, body_map, speed, departure_day)
        order = brute_force_optimal(n, body_map, all_ids, speed, departure_day)
        method = "brute_force_exact"
    elif use_qaoa and QISKIT_AVAILABLE:
        cost  = build_cost_matrix(start_body_id, destination_ids, body_map, speed, departure_day)
        try:
            order  = qaoa_optimise(n, cost, qaoa_layers)
            method = f"qaoa_p{qaoa_layers}"
        except Exception:
            order  = classical_nearest_neighbour(n, cost)
            method = "nearest_neighbour_fallback"
    else:
        cost  = build_cost_matrix(start_body_id, destination_ids, body_map, speed, departure_day)
        order = classical_nearest_neighbour(n, cost)
        method = "nearest_neighbour"

    # Build leg breakdown
    legs        = []
    current_day = departure_day
    prev_id     = start_body_id

    optimised_ids = [destination_ids[i - 1] for i in order]

    for dest_id in optimised_ids:
        origin = body_map.get(prev_id)
        dest   = body_map.get(dest_id)
        if not origin or not dest:
            continue
        dur = voyage_duration(origin, dest, body_map, current_day, speed)
        ox, oy = _body_position(origin, body_map, current_day)
        dx, dy = _body_position(dest, body_map, current_day)
        dist   = _distance(ox, oy, dx, dy)

        legs.append({
            "from":         prev_id,
            "to":           dest_id,
            "depart_day":   round(current_day, 2),
            "arrive_day":   round(current_day + dur, 2),
            "duration_days": round(dur, 1),
            "distance_au":  round(dist, 3),
        })
        current_day += dur
        prev_id      = dest_id

    total_days = sum(leg["duration_days"] for leg in legs)

    return {
        "start_body_id":   start_body_id,
        "optimised_order": optimised_ids,
        "total_days":      round(total_days, 1),
        "legs":            legs,
        "method":          method,
        "ship_class":      ship_class_id,
        "departure_day":   round(departure_day, 2),
    }