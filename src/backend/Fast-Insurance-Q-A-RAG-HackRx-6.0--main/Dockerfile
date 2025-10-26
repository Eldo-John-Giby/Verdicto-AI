FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements_clean.txt .

# Install Python dependencies with optimizations
# Install in order: lightweight packages first, then heavier ones
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
    fastapi==0.116.1 \
    uvicorn[standard]==0.35.0 \
    python-dotenv==1.1.1 \
    pydantic==2.11.7 \
    httpx==0.28.1 \
    groq==0.30.0 \
    voyageai==0.3.4 \
    PyMuPDF==1.26.3 \
    pypdf==5.1.0 && \
    pip install --no-cache-dir \
    langchain==0.3.27 \
    langchain-community==0.3.27 \
    langchain-groq==0.3.6 \
    langchain-voyageai==0.1.6 \
    langchain-weaviate==0.0.5 \
    langchain-text-splitters==0.3.9 \
    weaviate-client==4.16.4

# Copy application code
COPY app/ ./app/

# Railway dynamically assigns the PORT environment variable
# We'll use a shell script to handle this
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000}