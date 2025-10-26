# Quick Start Script for Hackathon Demo (Windows)
# ================================================

Write-Host "🏆 ================================================" -ForegroundColor Cyan
Write-Host "   LEXAI HACKATHON DEMO - QUICK START" -ForegroundColor Cyan
Write-Host "================================================ 🏆" -ForegroundColor Cyan
Write-Host ""

# Check if in correct directory
if (!(Test-Path "hackathon_api.py")) {
    Write-Host "❌ Error: Please run this script from src\backend\ml directory" -ForegroundColor Red
    exit 1
}

# Check Python
if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Python not found. Please install Python 3.10+" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
pip install googletrans==4.0.0rc1 langdetect -q

Write-Host ""
Write-Host "✅ Dependencies installed!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Starting Hackathon Features API..." -ForegroundColor Green
Write-Host "   - Multilingual Translation (9 languages)" -ForegroundColor White
Write-Host "   - Legal Document Generator (4 types)" -ForegroundColor White
Write-Host "   - Plain Language Simplification" -ForegroundColor White
Write-Host "   - What-If Simulation Engine" -ForegroundColor White
Write-Host "   - Sensitivity Analysis" -ForegroundColor White
Write-Host ""
Write-Host "📍 API will run on: http://localhost:8002" -ForegroundColor Cyan
Write-Host "📚 Documentation: http://localhost:8002/docs" -ForegroundColor Cyan
Write-Host "🎯 Demo Endpoint: http://localhost:8002/api/v1/demo/complete" -ForegroundColor Cyan
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Start the API
python hackathon_api.py

