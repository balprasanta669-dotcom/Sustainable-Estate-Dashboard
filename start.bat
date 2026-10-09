@echo off
echo ============================================================
echo   FacilityIQ - Sustainable Facility Intelligence Dashboard
echo ============================================================
echo.

echo [1/2] Starting Backend (Flask API on port 8000)...
start "FacilityIQ Backend" /D "%~dp0backend" cmd /k "venv\Scripts\python -m flask --app app.main run --host 0.0.0.0 --port 8000 --debug"

timeout /t 2 /nobreak >nul

echo [2/2] Starting Frontend (Vite on port 5173)...
start "FacilityIQ Frontend" /D "%~dp0frontend" cmd /k "npm run dev"

echo.
echo ============================================================
echo   Dashboard: http://localhost:5173
echo   API Docs:  http://localhost:8000/api/dashboard/overview
echo   Health:    http://localhost:8000/health
echo ============================================================
echo.
pause
