# Baghewala Heavy-Oil Digital Twin (SIH 26120) PowerShell Startup
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "    BAGHEWALA HEAVY-OIL DIGITAL TWIN (SIH 26120) - STARTUP SCRIPT" -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $rootDir

# 1. Python Environment Check
Write-Host "`n[1/4] Checking Python Virtual Environment..." -ForegroundColor Yellow
if (-not (Test-Path "$rootDir\backend\venv\Scripts\python.exe")) {
    Write-Host "Creating virtualenv..."
    python -m venv "$rootDir\backend\venv"
    & "$rootDir\backend\venv\Scripts\pip.exe" install -r "$rootDir\backend\requirements.txt"
}

# 2. Database & Models
Write-Host "`n[2/4] Initializing Database & ML Models..." -ForegroundColor Yellow
& "$rootDir\backend\venv\Scripts\python.exe" "$rootDir\backend\scripts\generate_synthetic_data.py"
& "$rootDir\backend\venv\Scripts\python.exe" "$rootDir\backend\scripts\train_models.py"

# 3. Backend
Write-Host "`n[3/4] Launching FastAPI Backend on http://127.0.0.1:8002 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootDir\backend'; .\venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8002 --reload"

# 4. Frontend
Write-Host "`n[4/4] Launching React Vite Frontend on http://localhost:5174 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootDir\frontend'; npm run dev"

Write-Host "`n===============================================================================" -ForegroundColor Green
Write-Host "  DIGITAL TWIN RUNNING LOCALLY & 100% OFFLINE-READY!" -ForegroundColor Green
Write-Host "  Frontend Dashboard:  http://localhost:5174" -ForegroundColor White
Write-Host "  Backend API Swagger: http://127.0.0.1:8002/docs" -ForegroundColor White
Write-Host "  Health Check:        http://127.0.0.1:8002/health" -ForegroundColor White
Write-Host "===============================================================================" -ForegroundColor Green
