# Dockerfile for InLegalBERT Analysis API
# =======================================

FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Pre-download InLegalBERT model to reduce startup time
RUN python -c "from transformers import AutoTokenizer, AutoModel; \
    AutoTokenizer.from_pretrained('law-ai/InLegalBERT'); \
    AutoModel.from_pretrained('law-ai/InLegalBERT')"

# Copy application code
COPY . .

# Expose API port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8001/ || exit 1

# Run the application
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "2"]

