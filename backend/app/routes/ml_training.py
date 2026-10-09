"""
Machine Learning Training & Telemetry API Blueprint.
Allows facility administrators to inspect trained ML models, trigger on-demand model retraining,
and monitor real Indian data sources.
"""

from flask import Blueprint, jsonify, request
import os
import json
from datetime import datetime
from app.ml.train_models import train_all_models, BASE_DIR, DATA_DIR, MODELS_DIR
from app.services.live_data_service import sync_live_open_data

ml_training_bp = Blueprint("ml_training", __name__)


@ml_training_bp.get("/ml/metrics")
def get_model_metrics():
    """Return metrics and hyperparameters of all currently trained ML models."""
    manifest_path = os.path.join(MODELS_DIR, "training_manifest.json")
    if os.path.exists(manifest_path):
        with open(manifest_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return jsonify(data)
    
    # If not trained yet, run training once
    out = train_all_models()
    return jsonify(out)


@ml_training_bp.post("/ml/train")
def trigger_training():
    """Trigger training pipeline on real CPCB and institutional datasets."""
    try:
        results = train_all_models()
        return jsonify({
            "success": True,
            "message": "All ML models successfully retrained on real datasets.",
            "results": results
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@ml_training_bp.get("/ml/data-sources")
def get_data_sources():
    """Return overview of all real Indian datasets in the system."""
    sources = [
        {
            "id": "DS-01",
            "name": "CPCB Indian National Air Quality Telemetry",
            "location": "Anand Vihar Station, Delhi (CPCB / CAAQMS)",
            "file": "cpcb_air_quality.csv",
            "type": "Continuous Ambient Air Quality Monitoring (CAAQMS)",
            "parameters": ["PM2.5", "PM10", "NO2", "CO", "SO2", "O3", "AQI", "Temperature", "RH"],
            "sampling_frequency": "1 Hour",
            "standard": "CPCB NAAQS 2009 Standards"
        },
        {
            "id": "DS-02",
            "name": "Institutional Campus Microgrid & Solar PV",
            "location": "Central Substation & Terrace Array (AIIMS / IISc)",
            "file": "campus_energy.csv",
            "type": "Smart Multi-Function Metering (Modbus RTU / IEC 61850)",
            "parameters": ["Total kW", "Solar PV kW", "Grid Draw kW", "DG Backup kW", "Power Factor"],
            "sampling_frequency": "1 Hour",
            "standard": "BEE Star Rating / CEA Grid Code"
        },
        {
            "id": "DS-03",
            "name": "Estate Smart Water Metering & Water Quality",
            "location": "Pumping Station & STP Recycled Line",
            "file": "campus_water.csv",
            "type": "Ultrasonic Flow & Multiparameter Quality Probes",
            "parameters": ["Total Consumption KL", "Municipal KL", "Borewell KL", "STP KL", "pH", "Turbidity", "TDS"],
            "sampling_frequency": "1 Hour",
            "standard": "IS 10500:2012 Drinking Water Standard"
        },
        {
            "id": "DS-04",
            "name": "Campus Gate Vehicular Traffic & Parking",
            "location": "Gates 1-3 RFID & ANPR Camera Feeds",
            "file": "campus_traffic.csv",
            "type": "Automatic Vehicle Counting & Ultrasonic Bay Sensors",
            "parameters": ["Inflow Count", "Outflow Count", "Parking Occupancy %", "Wait Time"],
            "sampling_frequency": "1 Hour",
            "standard": "IRC Urban Road Capacity Standards"
        },
        {
            "id": "DS-05",
            "name": "Solid Waste Zone Fill Telemetry",
            "location": "Hostel, Cafeteria, Hospital OPD & Academic Zones",
            "file": "campus_waste.csv",
            "type": "Ultrasonic Bin Fill & Loadcell Sensor Nodes",
            "parameters": ["Fill Level %", "Weight kg", "Waste Category", "Overflow Risk"],
            "sampling_frequency": "3 Hours",
            "standard": "SWM Rules 2016 India"
        },
        {
            "id": "DS-06",
            "name": "Odisha Higher Education & Smart Campus Telemetry",
            "location": "Bhubaneswar (IIT / AIIMS), Rourkela (NIT), Sambalpur (VSSUT), Cuttack (SCB/Ravenshaw)",
            "file": "live_bhubaneswar.json",
            "type": "Continuous Ambient Air Quality & Microgrid Telemetry (OSPCB / Open-Meteo)",
            "parameters": ["PM2.5", "PM10", "NO2", "CO", "SO2", "Ozone", "Solar PV kWp", "STP KLD"],
            "sampling_frequency": "1 Hour",
            "standard": "OSPCB Clean Air Baseline & National Clean Air Programme (NCAP)"
        }
    ]

    for s in sources:
        filepath = os.path.join(DATA_DIR, s["file"])
        if os.path.exists(filepath):
            s["status"] = "Active"
            s["size_kb"] = round(os.path.getsize(filepath) / 1024, 1)
            # Count rows
            with open(filepath, "r", encoding="utf-8") as f:
                s["record_count"] = sum(1 for _ in f) - 1
        else:
            s["status"] = "Not Found"
            s["size_kb"] = 0
            s["record_count"] = 0

    return jsonify({"sources": sources, "total_datasets": len(sources)})


@ml_training_bp.post("/ml/sync-live")
def trigger_live_sync():
    """Sync live sensor feed from real open data APIs for Indian cities."""
    city = request.args.get("city", "delhi")
    success = sync_live_open_data(city)
    return jsonify({
        "success": success,
        "city": city,
        "synced_at": datetime.now().isoformat()
    })
