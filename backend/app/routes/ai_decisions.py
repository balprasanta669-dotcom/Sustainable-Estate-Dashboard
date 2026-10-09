"""
AI Decision Making & Gemini Engine Blueprint.
Directs all facility advisories, scenario simulations, and executive briefings through Google Gemini.
"""

from flask import Blueprint, jsonify, request
from app.services.gemini_service import (
    generate_ai_decisions,
    simulate_ai_scenario,
    get_api_key,
    save_api_key,
    _call_gemini
)
from app.services.data_generator import (
    generate_overview,
    generate_air_quality,
    generate_energy,
    generate_water_usage,
    generate_waste_history,
    generate_traffic,
    generate_assets,
    generate_safety_incidents
)

ai_decisions_bp = Blueprint("ai_decisions", __name__)


def _gather_live_telemetry():
    """Gathers real-time snapshot across all 9 facility modules for Gemini ingestion."""
    overview = generate_overview()
    aqi_data = generate_air_quality(hours_back=1)
    energy_data = generate_energy(hours_back=1)
    water_data = generate_water_usage(hours_back=1)
    traffic_data = generate_traffic(hours_back=1)
    assets_data = generate_assets()
    safety_data = generate_safety_incidents(days_back=7)

    return {
        "facility_name": overview.get("facility", {}).get("name", "AIIMS Institutional Complex, Delhi"),
        "timestamp": overview.get("generated_at"),
        "air_quality": {
            "current_aqi": aqi_data[-1].get("aqi") if aqi_data else 138,
            "pm25_ugm3": aqi_data[-1].get("pm25") if aqi_data else 45,
            "pm10_ugm3": aqi_data[-1].get("pm10") if aqi_data else 95,
            "category": aqi_data[-1].get("category") if aqi_data else "Moderate",
        },
        "energy": {
            "total_consumption_kw": energy_data[-1].get("consumption_kw") if energy_data else 510,
            "solar_pv_generation_kw": energy_data[-1].get("solar_generation_kw") if energy_data else 35,
            "grid_draw_kw": energy_data[-1].get("grid_draw_kw") if energy_data else 475,
            "power_factor": energy_data[-1].get("pf") if energy_data else 0.94,
        },
        "water": {
            "hourly_consumption_kl": water_data[-1].get("consumption_kl") if water_data else 28,
            "ph": water_data[-1].get("ph") if water_data else 7.3,
            "tds_ppm": water_data[-1].get("tds_ppm") if water_data else 310,
            "stp_recycled_kl": water_data[-1].get("stp_recycled_kl") if water_data else 9.5,
        },
        "traffic": {
            "recent_vehicle_inflow": traffic_data[-1].get("inflow") if traffic_data else 65,
            "recent_vehicle_outflow": traffic_data[-1].get("outflow") if traffic_data else 48,
            "gate": "Main Campus Gate 1 & 2",
        },
        "degraded_assets_count": len([a for a in assets_data if a.get("status") != "Operational"]),
        "open_safety_incidents_count": len([s for s in safety_data if s.get("status") != "Resolved"]),
    }


@ai_decisions_bp.get("/ai/decisions")
def get_ai_decisions():
    """Generate real-time AI facility decisions using Google Gemini."""
    telemetry = _gather_live_telemetry()
    decisions = generate_ai_decisions(telemetry)
    return jsonify({
        "success": True,
        "count": len(decisions),
        "telemetry_analyzed": telemetry,
        "decisions": decisions
    })


@ai_decisions_bp.post("/ai/simulate")
def run_ai_simulation():
    """Simulate a user-specified hypothesis or what-if scenario with Gemini."""
    body = request.get_json() or {}
    scenario_prompt = body.get("scenario_prompt", "What if we install 200 kW rooftop solar and reschedule HVAC?")
    telemetry = _gather_live_telemetry()
    result = simulate_ai_scenario(scenario_prompt, telemetry)
    return jsonify({
        "success": True,
        "simulation": result
    })


@ai_decisions_bp.get("/ai/key-status")
def get_key_status():
    """Check if Gemini API key is configured."""
    key = get_api_key()
    has_key = bool(key and len(key) > 5)
    masked = f"{key[:4]}...{key[-4:]}" if has_key else None
    return jsonify({
        "has_key": has_key,
        "masked_key": masked,
        "model": "gemini-1.5-flash"
    })


@ai_decisions_bp.post("/ai/set-key")
def set_gemini_key():
    """Save or update Gemini API key."""
    body = request.get_json() or {}
    key = body.get("api_key", "").strip()
    if not key:
        return jsonify({"success": False, "error": "API key cannot be empty"}), 400

    # Quick validation call to Gemini
    test_res = _call_gemini("Reply with: OK", api_key=key)
    if "error" in test_res and test_res["error"] != "NO_API_KEY":
        return jsonify({
            "success": False,
            "error": f"Invalid Gemini API key or connection error: {test_res.get('message')}"
        }), 400

    saved = save_api_key(key)
    return jsonify({
        "success": saved,
        "message": "Gemini API key successfully saved and verified!"
    })
