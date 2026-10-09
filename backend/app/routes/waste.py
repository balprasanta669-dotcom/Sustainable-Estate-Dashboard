"""Waste management blueprint."""
from flask import Blueprint, jsonify, request
from app.services.data_generator import generate_waste_bins, generate_waste_history
from app.services.ml_service import forecast_series

waste_bp = Blueprint("waste", __name__)


@waste_bp.get("/waste/bins")
def get_bins():
    return jsonify(generate_waste_bins())


@waste_bp.get("/waste/history")
def get_history():
    hours = int(request.args.get("hours", 168))
    return jsonify(generate_waste_history(hours_back=hours))


@waste_bp.get("/waste/overflow-risk")
def get_overflow_risk():
    bins = generate_waste_bins()
    at_risk = [b for b in bins if b["fill_level"] > 75]
    return jsonify({
        "total_bins":    len(bins),
        "at_risk_count": len(at_risk),
        "at_risk_bins":  at_risk,
        "recommendation": (
            "Dispatch collection vehicle to high-risk zones immediately."
            if at_risk else "All bins within safe capacity."
        ),
    })


@waste_bp.get("/waste/forecast")
def get_forecast():
    steps   = int(request.args.get("steps", 24))
    history = generate_waste_history(hours_back=168)
    values  = [r["total_kg"] for r in history]
    return jsonify(forecast_series(values, steps=steps, label="total_kg"))
