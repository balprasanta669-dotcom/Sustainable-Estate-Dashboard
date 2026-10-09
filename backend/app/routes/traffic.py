"""Traffic flow blueprint."""
from flask import Blueprint, jsonify, request
from app.services.data_generator import generate_traffic, generate_parking

traffic_bp = Blueprint("traffic", __name__)


@traffic_bp.get("/traffic/flow")
def get_flow():
    hours = int(request.args.get("hours", 48))
    return jsonify(generate_traffic(hours_back=hours))


@traffic_bp.get("/traffic/parking")
def get_parking():
    return jsonify(generate_parking())


@traffic_bp.get("/traffic/hotspots")
def get_hotspots():
    flow = generate_traffic(hours_back=4)
    high = [r for r in flow if r["congestion_level"] == "High"]
    return jsonify({
        "hotspot_events": len(high),
        "hotspots":       high[:10],
        "recommendation": "Open alternate gates to distribute vehicle load." if high else "Traffic flowing normally.",
    })
