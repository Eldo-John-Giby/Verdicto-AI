#!/bin/bash
# Startup script for InLegalBERT ML API
# ======================================

set -e

echo "================================================"
echo "InLegalBERT Bias Detection & Prediction API"
echo "================================================"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install/upgrade dependencies
echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Pre-download model if not cached
echo "Checking InLegalBERT model..."
python -c "from transformers import AutoTokenizer, AutoModel; AutoTokenizer.from_pretrained('law-ai/InLegalBERT'); AutoModel.from_pretrained('law-ai/InLegalBERT')" || {
    echo "Downloading InLegalBERT model..."
    python -c "from transformers import AutoTokenizer, AutoModel; AutoTokenizer.from_pretrained('law-ai/InLegalBERT'); AutoModel.from_pretrained('law-ai/InLegalBERT')"
}

# Start the API server
echo ""
echo "Starting API server on port 8001..."
echo "API Documentation: http://localhost:8001/docs"
echo "================================================"
echo ""

uvicorn api:app --host 0.0.0.0 --port 8001 --reload

