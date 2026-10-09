"""Safety incidents blueprint."""
from flask import Blueprint, jsonify, request
from app.services.data_generator import generate_safety_incidents

safety_bp = Blueprint("safety", __name__)


@safety_bp.get("/safety/incidents")
def get_incidents():
    days = int(request.args.get("days", 30))
    return jsonify(generate_safety_incidents(days_back=days))


@safety_bp.get("/safety/summary")
def get_summary():
    incidents = generate_safety_incidents(days_back=30)
    severity_counts = {"Low": 0, "Medium": 0, "High": 0, "Critical": 0}
    status_counts   = {"Open": 0, "In Progress": 0, "Resolved": 0}
    type_counts: dict = {}

    for inc in incidents:
        severity_counts[inc["severity"]] = severity_counts.get(inc["severity"], 0) + 1
        status_counts[inc["status"]]     = status_counts.get(inc["status"],     0) + 1
        type_counts[inc["type"]]         = type_counts.get(inc["type"],         0) + 1

    avg_response = (
        round(sum(i["response_time_min"] for i in incidents) / len(incidents), 1)
        if incidents else 0
    )

    return jsonify({
        "total_incidents_30d": len(incidents),
        "by_severity":         severity_counts,
        "by_status":           status_counts,
        "by_type":             type_counts,
        "avg_response_time_min": avg_response,
        "risk_score": min(100, len([i for i in incidents if i["severity"] in ("High", "Critical")]) * 5),
    })
