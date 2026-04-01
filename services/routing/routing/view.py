"""
Django REST framework views for the Stellar routing service.
"""

import json
import os
from pathlib import Path

from django.conf import settings
from rest_framework.views import APIView
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework import status

from solver.optimiser import optimise_route


# Load system config once at startup
def _load_system_config() -> dict:
    path = Path(settings.SYSTEM_CONFIG_PATH)
    if not path.exists():
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


try:
    SYSTEM_CONFIG = _load_system_config()
except Exception as e:
    print(f"[WARNING] Could not load system config: {e}")
    SYSTEM_CONFIG = {}


class HealthView(APIView):
    """GET /health — service health check."""

    def get(self, request: Request) -> Response:
        try:
            from qiskit import __version__ as qiskit_version
            qiskit_available = True
        except ImportError:
            qiskit_version    = None
            qiskit_available  = False

        return Response({
            "status":           "ok",
            "service":          "stellar-routing",
            "qaoa_enabled":     settings.USE_QAOA,
            "qaoa_layers":      settings.QAOA_LAYERS,
            "qiskit_available": qiskit_available,
            "qiskit_version":   qiskit_version,
            "system_config_loaded": bool(SYSTEM_CONFIG),
        })


class OptimiseView(APIView):
    """
    POST /optimise — optimise the visit order for a multi-stop voyage.

    Request body:
    {
      "bodyIds":      ["kalos", "calyx", "lun"],  // destinations to visit (unordered)
      "startBodyId":  "aethon",                   // departure origin
      "departureDay": 12500.0,                    // simulation day number
      "shipClassId":  "solaris"                   // ship class ID from system.json
    }

    Response:
    {
      "optimisedOrder": ["calyx", "lun", "kalos"],
      "totalDays":      287.4,
      "legs":           [...],
      "method":         "brute_force_exact",
      "shipClass":      "solaris",
      "departureDay":   12500.0
    }
    """

    def post(self, request: Request) -> Response:
        if not SYSTEM_CONFIG:
            return Response(
                {"error": "System config not loaded — routing service is not fully initialised."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        # Validate request
        body_ids     = request.data.get("bodyIds", [])
        start_id     = request.data.get("startBodyId", "")
        departure_day = request.data.get("departureDay")
        ship_class_id = request.data.get("shipClassId", "tethys")

        if not body_ids:
            return Response(
                {"error": "bodyIds is required and must be a non-empty list."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not start_id:
            return Response(
                {"error": "startBodyId is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if departure_day is None:
            return Response(
                {"error": "departureDay is required (simulation day number)."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(body_ids) > 4:
            return Response(
                {"error": "Maximum 4 destinations supported."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate that all body IDs exist in system config
        body_map = {b["id"]: b for b in SYSTEM_CONFIG.get("bodies", [])}
        unknown  = [bid for bid in [start_id] + body_ids if bid not in body_map]
        if unknown:
            return Response(
                {"error": f"Unknown body IDs: {unknown}. Check system config."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            result = optimise_route(
                start_body_id=start_id,
                destination_ids=body_ids,
                departure_day=float(departure_day),
                ship_class_id=ship_class_id,
                system_config=SYSTEM_CONFIG,
                use_qaoa=settings.USE_QAOA,
                qaoa_layers=settings.QAOA_LAYERS,
            )
        except Exception as e:
            return Response(
                {"error": f"Optimisation failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if "error" in result:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)

        # Camel-case the response keys for the Go gateway / frontend
        return Response({
            "optimisedOrder": result["optimised_order"],
            "totalDays":      result["total_days"],
            "legs":           [
                {
                    "from":        leg["from"],
                    "to":          leg["to"],
                    "departDay":   leg["depart_day"],
                    "arriveDay":   leg["arrive_day"],
                    "durationDays": leg["duration_days"],
                    "distanceAU":  leg["distance_au"],
                }
                for leg in result["legs"]
            ],
            "method":       result["method"],
            "shipClass":    result["ship_class"],
            "departureDay": result["departure_day"],
        })