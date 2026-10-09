"""Water usage blueprint."""
from flask import Blueprint, jsonify, request
from app.services.data_generator import generate_water_usage, generate_water_alerts
from app.services.ml_service import detect_anomalies, forecast_series

water_bp = Blueprint("water", __name__)


@water_bp.get("/water/usage")
def get_usage():
    hours = int(request.args.get("hours", 168))
    return jsonify(generate_water_usage(hours_back=hours))


@water_bp.get("/water/current")
def get_current():
    data = generate_water_usage(hours_back=1)
    return jsonify(data[-1] if data else {})


@water_bp.get("/water/alerts")
def get_alerts():
    return jsonify(generate_water_alerts())


@water_bp.get("/water/anomalies")
def get_anomalies():
    history = generate_water_usage(hours_back=168)
    values  = [r["consumption_kl"] for r in history]
    anomalies = detect_anomalies(values)
    flagged = [a for a in anomalies if a["is_anomaly"]]
    return jsonify({"total_points": len(anomalies), "anomalies_detected": len(flagged), "anomalies": flagged})


@water_bp.get("/water/forecast")
def get_forecast():
    steps   = int(request.args.get("steps", 24))
    history = generate_water_usage(hours_back=168)
    values  = [r["consumption_kl"] for r in history]
    return jsonify(forecast_series(values, steps=steps, label="consumption_kl"))
