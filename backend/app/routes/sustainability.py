"""Sustainability scorecard blueprint."""
from flask import Blueprint, jsonify, request
from app.services.data_generator import generate_scorecard
from app.services.ml_service import run_scenario

sustainability_bp = Blueprint("sustainability", __name__)


@sustainability_bp.get("/sustainability/scorecard")
def get_scorecard():
    return jsonify(generate_scorecard())


@sustainability_bp.post("/sustainability/simulate")
def simulate():
    body        = request.get_json(force=True) or {}
    scenario    = body.get("scenario", "")
    baseline_kw = float(body.get("baseline_kw", 500))
    return jsonify(run_scenario(scenario, {"baseline_kw": baseline_kw}))


@sustainability_bp.get("/sustainability/scenarios")
def list_scenarios():
    return jsonify([
        {"id": "reduce_energy_15pct",      "name": "Reduce Energy by 15%",         "category": "Energy"},
        {"id": "solar_expansion",          "name": "Solar Expansion (100 kWp)",     "category": "Energy"},
        {"id": "waste_route_optimization", "name": "Waste Route Optimisation",      "category": "Waste"},
        {"id": "water_leak_fix",           "name": "Fix Water Leaks + Smart Meters","category": "Water"},
    ])
