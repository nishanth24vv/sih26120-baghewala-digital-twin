@echo off
title Baghewala Heavy-Oil Well-to-Surface Digital Twin (SIH 26120)
echo ===============================================================================
echo     BAGHEWALA HEAVY-OIL DIGITAL TWIN (SIH 26120) - STARTUP SCRIPT
echo ===============================================================================
echo.

cd /d %~dp0

echo [1/4] Checking Python environment...
if not exist "backend\venv\Scripts\python.exe" (
    echo Creating virtualenv and installing dependencies...
    python -m venv backend\venv
    backend\venv\Scripts\pip install -r backend\requirements.txt
)

echo [2/4] Initializing Database and ML Models...
backend\venv\Scripts\python backend\scripts\generate_synthetic_data.py
backend\venv\Scripts\python backend\scripts\train_models.py

echo [3/4] Starting FastAPI Backend on http://127.0.0.1:8002 ...
start "Baghewala Backend" cmd /k "backend\venv\Scripts\uvicorn app.main:app --host 127.0.0.1 --port 8002 --reload"

echo [4/4] Starting Vite Frontend on http://localhost:5174 ...
cd frontend
if not exist "node_modules" (
    call npm install
)
start "Baghewala Frontend" cmd /k "npm run dev"

echo.
echo ===============================================================================
echo   APPLICATION LAUNCHED SUCCESSFULLY!
echo   Frontend Dashboard:  http://localhost:5174
echo   Backend API Swagger: http://127.0.0.1:8002/docs
echo   Health Check:        http://127.0.0.1:8002/health
echo ===============================================================================
pause
