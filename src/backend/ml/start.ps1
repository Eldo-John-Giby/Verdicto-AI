# PowerShell startup script for InLegalBERT ML API (Windows)
# ============================================================

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "InLegalBERT Bias Detection & Prediction API" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Check if virtual environment exists
if (!(Test-Path -Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# Install/upgrade dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
python -m pip install --upgrade pip
pip install -r requirements.txt

# Pre-download model if not cached
Write-Host "Checking InLegalBERT model..." -ForegroundColor Yellow
try {
    python -c "from transformers import AutoTokenizer, AutoModel; AutoTokenizer.from_pretrained('law-ai/InLegalBERT'); AutoModel.from_pretrained('law-ai/InLegalBERT')"
    Write-Host "Model already cached!" -ForegroundColor Green
} catch {
    Write-Host "Downloading InLegalBERT model..." -ForegroundColor Yellow
    python -c "from transformers import AutoTokenizer, AutoModel; AutoTokenizer.from_pretrained('law-ai/InLegalBERT'); AutoModel.from_pretrained('law-ai/InLegalBERT')"
}

# Start the API server
Write-Host ""
Write-Host "Starting API server on port 8001..." -ForegroundColor Green
Write-Host "API Documentation: http://localhost:8001/docs" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

uvicorn api:app --host 0.0.0.0 --port 8001 --reload

