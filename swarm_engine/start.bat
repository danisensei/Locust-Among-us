@echo off
REM Quick start script for Locust Swarm Engine (Windows)

echo 🦗 Locust Swarm Engine - Quick Start (Windows)
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.8 or higher from python.org
    pause
    exit /b 1
)

echo ✅ Python found:
python --version
echo.

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo 🚀 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo 📥 Installing dependencies...
pip install -r requirements.txt

REM Run the engine
echo.
echo 🎯 Starting Locust Swarm Engine...
echo 📍 Server will run on http://localhost:8000
echo 📊 API Endpoints:
echo    - GeoJSON: http://localhost:8000/api/swarms/geojson
echo    - Heatmap: http://localhost:8000/api/swarms/heatmap
echo    - Stats:   http://localhost:8000/api/swarms/stats
echo.
echo Press Ctrl+C to stop the server
echo.

python engine.py

pause
