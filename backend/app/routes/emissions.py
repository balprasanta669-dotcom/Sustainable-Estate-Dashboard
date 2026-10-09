"""Emissions blueprint."""
from flask import Blueprint, jsonify, request
from app.services.data_generator import generate_emissions, generate_hotspots
from app.services.ml_service import forecast_series

emissions_bp = Blueprint("emissions", __name__)


@emissions_bp.get("/emissions/data")
def get_data():
    hours = int(request.args.get("hours", 168))
    return jsonify(generate_emissions(hours_back=hours))


@emissions_bp.get("/emissions/hotspots")
def get_hotspots_route():
    return jsonify(generate_hotspots())


@emissions_bp.get("/emissions/forecast")
def get_forecast():
    steps   = int(request.args.get("steps", 24))
    history = generate_emissions(hours_back=168)
    values  = [r["co2_amu"] for r in history]
    return jsonify(forecast_series(values, steps=steps, label="co2_kg"))
