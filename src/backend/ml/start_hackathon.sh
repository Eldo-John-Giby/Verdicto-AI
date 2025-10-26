#!/bin/bash
# Quick Start Script for Hackathon Demo
# =====================================

echo "🏆 ================================================"
echo "   LEXAI HACKATHON DEMO - QUICK START"
echo "================================================ 🏆"
echo ""

# Check if in correct directory
if [ ! -f "hackathon_api.py" ]; then
    echo "❌ Error: Please run this script from src/backend/ml directory"
    exit 1
fi

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.10+"
    exit 1
fi

echo "📦 Installing dependencies..."
pip install googletrans==4.0.0rc1 langdetect -q

echo ""
echo "✅ Dependencies installed!"
echo ""
echo "🚀 Starting Hackathon Features API..."
echo "   - Multilingual Translation (9 languages)"
echo "   - Legal Document Generator (4 types)"
echo "   - Plain Language Simplification"
echo "   - What-If Simulation Engine"
echo "   - Sensitivity Analysis"
echo ""
echo "📍 API will run on: http://localhost:8002"
echo "📚 Documentation: http://localhost:8002/docs"
echo "🎯 Demo Endpoint: http://localhost:8002/api/v1/demo/complete"
echo ""
echo "================================================"
echo ""

# Start the API
python3 hackathon_api.py

