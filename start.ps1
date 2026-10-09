# FacilityIQ - Sustainable Facility Intelligence Dashboard Startup Script
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  FacilityIQ - Sustainable Facility Intelligence Dashboard" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$baseDir = $PSScriptRoot

Write-Host "[1/2] Starting Backend (Flask API on port 8000)..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "venv\Scripts\python -m flask --app app.main run --host 0.0.0.0 --port 8000 --debug" -WorkingDirectory "$baseDir\backend"

Start-Sleep -Seconds 2

Write-Host "[2/2] Starting Frontend (Vite on port 5173)..." -ForegroundColor Yellow
Start-Process -FilePath "cmd.exe" -ArgumentList "/k", "npm run dev" -WorkingDirectory "$baseDir\frontend"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Dashboard: http://localhost:5173" -ForegroundColor Green
Write-Host "  API Root:  http://localhost:8000/api/dashboard/overview" -ForegroundColor White
Write-Host "  Health:    http://localhost:8000/health" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
