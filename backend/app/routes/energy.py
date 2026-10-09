"""Energy consumption blueprint."""
from flask import Blueprint, jsonify, request
from app.services.data_generator import generate_energy
from app.services.ml_service import detect_anomalies, forecast_series

energy_bp = Blueprint("energy", __name__)


@energy_bp.get("/energy/consumption")
def get_consumption():
    hours = int(request.args.get("hours", 168))
    return jsonify(generate_energy(hours_back=hours))


@energy_bp.get("/energy/current")
def get_current():
    data = generate_energy(hours_back=1)
    return jsonify(data[-1] if data else {})


@energy_bp.get("/energy/anomalies")
def get_anomalies():
    history = generate_energy(hours_back=168)
    values  = [r["consumption_kw"] for r in history]
    anomalies = detect_anomalies(values)
    flagged = [a for a in anomalies if a["is_anomaly"]]
    return jsonify({"total_points": len(anomalies), "anomalies_detected": len(flagged), "anomalies": flagged})


@energy_bp.get("/energy/forecast")
def get_forecast():
    steps   = int(request.args.get("steps", 24))
    history = generate_energy(hours_back=168)
    values  = [r["consumption_kw"] for r in history]
    return jsonify(forecast_series(values, steps=steps, label="consumption_kw"))


@energy_bp.get("/energy/optimization")
def get_optimization():
    return jsonify({
        "recommendations": [
            {"time_slot": "14:00–16:00 IST", "action": "Dim non-critical lighting by 40%; shift HVAC to economy mode.", "potential_saving_kw": 85, "cost_saving_inr": 1105},
            {"time_slot": "22:00–06:00 IST", "action": "Turn off decorative lighting; run EV chargers on off-peak tariff.", "potential_saving_kw": 120, "cost_saving_inr": 6240},
            {"time_slot": "10:00–16:00 IST", "action": "Maximise solar PV utilisation; defer diesel generator start.", "potential_saving_kw": 100, "cost_saving_inr": 3900},
        ],
        "total_daily_saving_kw":  305,
        "total_daily_saving_inr": 1982,
        "co2_reduction_kg_day":   250.1,
    })
