"""Air quality blueprint."""
from flask import Blueprint, jsonify, request
from app.services.data_generator import generate_air_quality
from app.services.ml_service import detect_anomalies, forecast_series

air_quality_bp = Blueprint("air_quality", __name__)


@air_quality_bp.get("/air-quality/current")
def get_current():
    city = request.args.get("city", "delhi")
    data = generate_air_quality(hours_back=1, city=city)
    return jsonify(data[-1] if data else {})


@air_quality_bp.get("/air-quality/history")
def get_history():
    hours = int(request.args.get("hours", 168))
    city = request.args.get("city", "delhi")
    return jsonify(generate_air_quality(hours_back=hours, city=city))


@air_quality_bp.get("/air-quality/anomalies")
def get_anomalies():
    hours = int(request.args.get("hours", 168))
    city = request.args.get("city", "delhi")
    history = generate_air_quality(hours_back=hours, city=city)
    aqi_values = [r["aqi"] for r in history]
    anomaly_results = detect_anomalies(aqi_values)
    for i, rec in enumerate(history):
        rec["is_anomaly"]    = anomaly_results[i]["is_anomaly"]
        rec["anomaly_score"] = anomaly_results[i]["anomaly_score"]
    return jsonify(history)


@air_quality_bp.get("/air-quality/forecast")
def get_forecast():
    steps = int(request.args.get("steps", 24))
    city = request.args.get("city", "delhi")
    history = generate_air_quality(hours_back=168, city=city)
    values  = [r["aqi"] for r in history]
    return jsonify(forecast_series(values, steps=steps, label="aqi"))
