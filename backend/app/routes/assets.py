"""Assets blueprint."""
from flask import Blueprint, jsonify
from app.services.data_generator import generate_assets

assets_bp = Blueprint("assets", __name__)


@assets_bp.get("/assets/utilization")
def get_utilization():
    return jsonify(generate_assets())


@assets_bp.get("/assets/critical")
def get_critical():
    assets   = generate_assets()
    critical = [a for a in assets if a["status"] in ("Degraded", "Down")]
    return jsonify({
        "count":          len(critical),
        "assets":         critical,
        "recommendation": "Schedule immediate inspection for Down assets." if critical else "All assets operational.",
    })
