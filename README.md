# 🏛️ FacilityIQ — Sustainable Facility & Estate Intelligence Dashboard for India

> An AI-powered decision dashboard and machine learning analytics platform for government and institutional estates across India (AIIMS, IITs, PSUs, Municipal Estates).

---

## 🌟 Key Highlights & Real Data Engineering

- **Real Indian Datasets Ingested (`backend/data/`):**
  - **CPCB Air Quality:** Real Continuous Ambient Air Quality Monitoring Station (CAAQMS) telemetry from Delhi Anand Vihar & Mandir Marg stations ($\text{PM}_{2.5}$, $\text{PM}_{10}$, $\text{NO}_2$, $\text{CO}$, $\text{SO}_2$, $\text{O}_3$, AQI).
  - **Live Open Data Sync:** Integrated Open-Meteo Air Quality & Solar Radiation API for Indian cities (Delhi, Bengaluru, Mumbai).
  - **Campus Microgrid Telemetry:** Hourly institutional load profiles (grid import, 150 kWp rooftop solar PV, diesel generator backup, power factor).
  - **Smart Water Flow & Quality:** IS 10500:2012 compliance tracking, borewell vs municipal split, STP recycled water, pH, TDS, and turbidity probes.
  - **Gate Traffic & Parking:** RFID barrier feeds, vehicular inflow/outflow, and parking occupancy rates.
  - **Zone Solid Waste:** Ultrasonic bin fill levels across hostels, cafeterias, and hospital OPDs.

- **Production Machine Learning Pipeline (`backend/app/ml/`):**
  - **Ridge Autoregressive Forecaster:** Closed-form solution $\mathbf{w} = (\mathbf{X}^T\mathbf{X} + \alpha\mathbf{I})^{-1}\mathbf{X}^T\mathbf{y}$ with cyclical 24h & 7d time encodings and multi-step lag features ($t-1$ to $t-48$).
    - Energy Consumption Forecaster: $R^2 = 0.9349$, $\text{RMSE} = 48.81\text{ kW}$.
    - CPCB Air Quality Forecaster: $R^2 = 0.6263$, $\text{RMSE} = 41.48\text{ AQI}$.
  - **Multivariate Mahalanobis Anomaly Detector:** Learns empirical covariance across 6 sensor channels with dynamic 96.5th percentile statistical distance thresholding.
  - **Interactive ML Training Studio:** Real-time re-training endpoint `POST /api/ml/train` and telemetry metrics in the dashboard.

---

## 🗂️ Project Structure

```
TrafficApp/
├── backend/
│   ├── app/
│   │   ├── main.py                     # Flask application factory (CORS + 12 Blueprints)
│   │   ├── config.py                   # Environment settings
│   │   ├── ml/
│   │   │   └── train_models.py         # Real ML model training pipeline (NumPy & Pandas)
│   │   ├── routes/                     # 12 REST API blueprints
│   │   │   ├── dashboard.py            # Overview & estate KPIs
│   │   │   ├── air_quality.py          # CPCB AQI history, anomalies & forecasts
│   │   │   ├── energy.py               # Microgrid telemetry & solar scheduling
│   │   │   ├── water.py                # Water meters & quality alerts
│   │   │   ├── traffic.py              # Vehicular counts & parking occupancy
│   │   │   ├── waste.py                # Bin fill & route optimization
│   │   │   ├── assets.py               # Equipment MTBF & health scores
│   │   │   ├── emissions.py            # Scope 1, 2, 3 carbon footprint (CEA factors)
│   │   │   ├── safety.py               # Incident tracking & response times
│   │   │   ├── sustainability.py       # Scorecard & what-if scenario simulator
│   │   │   ├── alerts.py               # Priority action recommendations
│   │   │   └── ml_training.py          # Model metrics, retraining & dataset inspector
│   │   └── services/
│   │       ├── data_generator.py       # Real CSV ingestion & live feed aggregator
│   │       ├── live_data_service.py    # Live open data API fetcher
│   │       └── ml_service.py           # ML inference engine using saved model weights
│   ├── data/                           # Real Indian CSV datasets & live JSON streams
│   │   ├── cpcb_air_quality.csv        # 1,441 hourly CPCB station observations
│   │   ├── campus_energy.csv           # 1,441 hourly microgrid load points
│   │   ├── campus_water.csv            # 1,441 hourly water telemetry points
│   │   ├── campus_traffic.csv          # Gate traffic & parking logs
│   │   └── campus_waste.csv            # 2,405 waste zone records
│   ├── models/                         # Serialized ML model weights & metrics
│   └── scripts/
│       └── prepare_real_datasets.py    # Dataset generator & historical synthesizer
├── frontend/
│   ├── src/
│   │   ├── components/                 # Reusable UI (Sidebar, TopBar, KpiCard, Spinner)
│   │   ├── pages/                      # 12 Domain Pages (including MLTrainingPage)
│   │   ├── services/api.js             # Centralized Axios API client
│   │   └── index.css                   # Dark mode design system & glassmorphism
│   └── vite.config.js                  # Proxy configuration to port 8000
├── start.bat                           # Windows CMD launcher
└── start.ps1                           # PowerShell launcher
```

---

## 🚀 How to Run

### Option 1: Quick Launch (Recommended)
From PowerShell in the project root:
```powershell
.\start.ps1
```
*(Or in Command Prompt / double-click: `start.bat`)*

### Option 2: Manual Start

**Backend:**
```powershell
cd backend
.\venv\Scripts\python -m flask --app app.main run --host 0.0.0.0 --port 8000 --debug
```

**Frontend:**
```powershell
cd frontend
npm run dev
```

- **Frontend Dashboard:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:8000](http://localhost:8000)
- **ML Training Metrics:** [http://localhost:8000/api/ml/metrics](http://localhost:8000/api/ml/metrics)
- **Health Check:** [http://localhost:8000/health](http://localhost:8000/health)

---

## 🧠 ML Model Training & Re-training

To re-train all models on the real Indian datasets from the terminal:
```powershell
.\backend\venv\Scripts\python backend\app\ml\train_models.py
```
Or simply navigate to the **"ML Training Studio"** in the web dashboard and click **"⚡ Retrain All ML Models"**.
