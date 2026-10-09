"""Dashboard blueprint."""
from flask import Blueprint, jsonify, request
from app.services.data_generator import (
    generate_overview,
    get_dashboard_iot_trends,
    inject_synthetic_data,
    reset_synthetic_data,
    get_synthetic_status
)
from app.services.gemini_service import generate_ai_decisions
from app.routes.ai_decisions import _gather_live_telemetry

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.get("/dashboard/overview")
def get_overview():
    college_id = request.args.get("college") or request.args.get("facility")
    data = generate_overview(college_id=college_id)
    telemetry = _gather_live_telemetry()
    data["top_recommendations"] = generate_ai_decisions(telemetry)[:3]
    return jsonify(data)


@dashboard_bp.get("/dashboard/iot-trends")
def get_iot_trends():
    """Return multi-metric synchronized IoT sensor trends (Energy, Air, Water, Traffic, Waste)."""
    hours = int(request.args.get("hours", 24))
    college_id = request.args.get("college") or request.args.get("facility")
    city = request.args.get("city", "delhi")
    trends = get_dashboard_iot_trends(hours_back=hours, college_id=college_id, city=city)
    return jsonify(trends)


@dashboard_bp.post("/dashboard/synthetic/inject")
def inject_synthetic():
    """Inject synthetic anomaly / surge scenarios into live campus telemetry."""
    payload = request.get_json(silent=True) or {}
    scenario = payload.get("scenario", "custom")
    sensor_type = payload.get("sensor_type", "energy")
    pattern = payload.get("pattern", "spike")
    multiplier = float(payload.get("multiplier", 1.6))
    duration_hours = int(payload.get("duration_hours", 12))
    custom_value = payload.get("custom_value")
    description = payload.get("description")

    result = inject_synthetic_data(
        scenario=scenario,
        sensor_type=sensor_type,
        pattern=pattern,
        multiplier=multiplier,
        duration_hours=duration_hours,
        custom_value=custom_value,
        description=description
    )
    return jsonify({
        "success": True,
        "message": f"Synthetic scenario '{result.get('scenario_name')}' successfully injected into IoT telemetry.",
        "synthetic_state": result
    })


@dashboard_bp.post("/dashboard/synthetic/reset")
def reset_synthetic():
    """Reset synthetic telemetry and restore authentic real sensor baseline."""
    result = reset_synthetic_data()
    return jsonify(result)


@dashboard_bp.get("/dashboard/synthetic/status")
def get_synthetic():
    """Check current status of synthetic telemetry overlay."""
    return jsonify(get_synthetic_status())
