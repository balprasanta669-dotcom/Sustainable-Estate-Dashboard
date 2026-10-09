"""Alerts aggregation blueprint."""
import random
from datetime import datetime, timedelta
from flask import Blueprint, jsonify
from app.services.data_generator import generate_overview
from app.services.gemini_service import generate_ai_decisions
from app.routes.ai_decisions import _gather_live_telemetry

alerts_bp = Blueprint("alerts", __name__)


def _make_alert(i, module, severity, msg):
    return {
        "id":           f"ALT-{i:04d}",
        "module":       module,
        "severity":     severity,
        "message":      msg,
        "timestamp":    (datetime.utcnow() - timedelta(minutes=random.randint(1, 240))).isoformat(),
        "acknowledged": random.random() < 0.3,
    }


@alerts_bp.get("/alerts")
def get_all_alerts():
    alerts = [
        _make_alert(1, "air_quality", "High",     "AQI exceeded 200 in OPD Block — consider ventilation increase."),
        _make_alert(2, "waste",       "Critical", "Bin BIN-007 in Zone B at 96% fill — immediate collection required."),
        _make_alert(3, "water",       "High",     "Potential leak detected in Block C water main — TDS spike."),
        _make_alert(4, "energy",      "Medium",   "Energy consumption 22% above daily baseline — peak load event."),
        _make_alert(5, "safety",      "High",     "Unresolved electrical hazard in Stairwell B — 3 hours outstanding."),
        _make_alert(6, "emissions",   "Medium",   "Generator Bay CO₂ at 1,650 ppm — above recommended threshold."),
        _make_alert(7, "traffic",     "Low",      "Gate 1 queue length > 15 vehicles — consider opening Gate 3."),
        _make_alert(8, "assets",      "Medium",   "HVAC Unit 3 uptime dropped to 78% — maintenance recommended."),
    ]
    alerts.sort(key=lambda a: a["timestamp"], reverse=True)
    return jsonify({
        "total":          len(alerts),
        "unacknowledged": sum(1 for a in alerts if not a["acknowledged"]),
        "alerts":         alerts,
    })


@alerts_bp.get("/recommendations")
def get_recommendations():
    telemetry = _gather_live_telemetry()
    return jsonify(generate_ai_decisions(telemetry))
