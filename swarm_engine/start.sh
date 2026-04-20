#!/bin/bash
# Quick start script for Locust Swarm Engine

echo "🦗 Locust Swarm Engine - Quick Start"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

echo "✅ Python found: $(python3 --version)"
echo ""

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🚀 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Run the engine
echo ""
echo "🎯 Starting Locust Swarm Engine..."
echo "📍 Server will run on http://localhost:8000"
echo "📊 API Endpoints:"
echo "   - GeoJSON: http://localhost:8000/api/swarms/geojson"
echo "   - Heatmap: http://localhost:8000/api/swarms/heatmap"
echo "   - Stats:   http://localhost:8000/api/swarms/stats"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python3 engine.py
