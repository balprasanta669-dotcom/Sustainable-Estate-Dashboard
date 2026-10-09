"""
Odisha Colleges & Higher Education Campuses API Blueprint.
Provides comprehensive profiles, sustainability telemetry, and live Open-Meteo telemetry
for Odisha's premier institutions (IIT Bhubaneswar, AIIMS Bhubaneswar, NIT Rourkela,
OUTR, VSSUT Burla, KIIT University, SCB Medical College, Ravenshaw University).
"""

from flask import Blueprint, jsonify, request
from app.services.live_data_service import (
    get_odisha_colleges,
    get_odisha_college_by_id,
    sync_live_open_data,
    ODISHA_COLLEGES,
    CITIES,
)

colleges_bp = Blueprint("colleges", __name__)


@colleges_bp.get("/colleges/odisha")
def list_odisha_colleges():
    """Return all Odisha colleges with live telemetry status and sustainability specs."""
    district_filter = request.args.get("district")
    type_filter = request.args.get("type")
    
    colleges = get_odisha_colleges()
    
    if district_filter:
        colleges = [c for c in colleges if c["district"].lower() == district_filter.lower()]
    if type_filter:
        colleges = [c for c in colleges if type_filter.lower() in c["type"].lower()]
        
    return jsonify({
        "state": "Odisha",
        "total_institutions": len(colleges),
        "colleges": colleges
    })


@colleges_bp.get("/colleges/odisha/<college_id>")
def get_odisha_college(college_id: str):
    """Return detailed metadata, zone breakdown, and sustainability profile for an Odisha college."""
    college = get_odisha_college_by_id(college_id)
    if not college:
        return jsonify({"error": f"Odisha college '{college_id}' not found."}), 404
        
    return jsonify(college)


@colleges_bp.post("/colleges/odisha/<college_id>/sync")
def sync_odisha_college(college_id: str):
    """Trigger on-demand live air quality telemetry sync from Open-Meteo for an Odisha college."""
    college = get_odisha_college_by_id(college_id)
    if not college:
        return jsonify({"error": f"Odisha college '{college_id}' not found."}), 404
        
    city_key = college["city_key"]
    success = sync_live_open_data(city_key)
    
    return jsonify({
        "success": success,
        "college_id": college_id,
        "college_name": college["name"],
        "city": college["city"],
        "city_key": city_key
    })


@colleges_bp.get("/colleges/odisha/stats")
def get_odisha_stats():
    """Aggregate sustainability and campus microgrid statistics across all Odisha campuses."""
    colleges = list(ODISHA_COLLEGES.values())
    total_solar_kwp = sum(c["sustainability_specs"]["rooftop_solar_capacity_kwp"] for c in colleges)
    total_daily_solar_kwh = sum(c["sustainability_specs"]["daily_solar_generation_kwh"] for c in colleges)
    total_stp_kld = sum(c["sustainability_specs"]["stp_capacity_kld"] for c in colleges)
    total_co2_offset_tons = sum(c["sustainability_specs"]["annual_co2_offset_tons"] for c in colleges)
    total_sensors = sum(c["active_sensors"] for c in colleges)
    total_area_acres = sum(c["campus_area_acres"] for c in colleges)
    total_population = sum(c["student_faculty_population"] for c in colleges)
    
    return jsonify({
        "state": "Odisha",
        "institutions_tracked": len(colleges),
        "total_campus_acreage": total_area_acres,
        "total_campus_population": total_population,
        "total_active_iot_sensors": total_sensors,
        "total_solar_capacity_kwp": total_solar_kwp,
        "total_daily_solar_generation_kwh": total_daily_solar_kwh,
        "total_stp_capacity_kld": total_stp_kld,
        "annual_co2_offset_tons": total_co2_offset_tons,
        "cities_covered": ["Bhubaneswar", "Rourkela", "Sambalpur", "Cuttack"]
    })
