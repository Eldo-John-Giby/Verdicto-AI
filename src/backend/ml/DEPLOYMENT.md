# InLegalBERT ML API - Deployment Guide

## 🚀 Deployment Options

### Option 1: Local Development

#### Linux/macOS
```bash
cd src/backend/ml
chmod +x start.sh
./start.sh
```

#### Windows
```powershell
cd src\backend\ml
.\start.ps1
```

The API will be available at `http://localhost:8001`

---

### Option 2: Docker Deployment

#### Build and Run
```bash
cd src/backend/ml

# Build image
docker build -t inlegalbert-api .

# Run container
docker run -p 8001:8001 --name ml-api inlegalbert-api

# Or use docker-compose
docker-compose up -d
```

#### Docker Compose with Hot Reload (Development)
```bash
docker-compose up
```

#### Production Docker
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

### Option 3: Railway Deployment

1. Create `railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "uvicorn api:app --host 0.0.0.0 --port $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

2. Create `Procfile`:
```
web: uvicorn api:app --host 0.0.0.0 --port $PORT
```

3. Deploy:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

4. Set environment variables in Railway dashboard:
   - `PYTHONUNBUFFERED=1`
   - `ML_API_URL=https://your-app.railway.app`

---

### Option 4: Render Deployment

1. Create `render.yaml`:
```yaml
services:
  - type: web
    name: inlegalbert-api
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn api:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: PYTHON_VERSION
        value: 3.10.0
      - key: PYTHONUNBUFFERED
        value: 1
```

2. Connect GitHub repo to Render
3. Deploy from dashboard

---

### Option 5: Google Cloud Run

1. Build and push image:
```bash
# Authenticate
gcloud auth login

# Set project
gcloud config set project YOUR_PROJECT_ID

# Build
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/inlegalbert-api

# Deploy
gcloud run deploy inlegalbert-api \
  --image gcr.io/YOUR_PROJECT_ID/inlegalbert-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2
```

---

### Option 6: AWS (EC2 / ECS / Lambda)

#### EC2 Deployment
```bash
# SSH to EC2 instance
ssh -i key.pem ubuntu@ec2-instance

# Install dependencies
sudo apt update
sudo apt install python3-pip python3-venv

# Clone repo and setup
git clone your-repo
cd src/backend/ml
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run with systemd
sudo nano /etc/systemd/system/inlegalbert.service
```

Systemd service file:
```ini
[Unit]
Description=InLegalBERT ML API
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/src/backend/ml
Environment="PATH=/home/ubuntu/src/backend/ml/venv/bin"
ExecStart=/home/ubuntu/src/backend/ml/venv/bin/uvicorn api:app --host 0.0.0.0 --port 8001
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Start service
sudo systemctl start inlegalbert
sudo systemctl enable inlegalbert
```

---

## 🔧 Environment Configuration

### Required Environment Variables

```bash
# ML API URL (for Convex integration)
ML_API_URL=http://localhost:8001  # or your deployed URL

# Optional: Model cache directory
TRANSFORMERS_CACHE=/path/to/cache

# Optional: Device selection
CUDA_VISIBLE_DEVICES=0  # For GPU

# Optional: API Configuration
API_HOST=0.0.0.0
API_PORT=8001
LOG_LEVEL=info
```

### Convex Environment Variables

Add to your Convex deployment:
```bash
# In Convex dashboard or .env
ML_API_URL=https://your-ml-api.railway.app
```

---

## 🔗 Integration with Verdicto Frontend

### Step 1: Update Convex Environment

```bash
# Set ML API URL in Convex
npx convex env set ML_API_URL https://your-ml-api-url.com
```

### Step 2: Use ML Actions in Frontend

```typescript
// In your React component
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

function MyComponent() {
  const analyzeCaseML = useAction(api.mlBiasAnalysis.analyzeCaseWithML);
  const predictOutcome = useAction(api.mlBiasAnalysis.predictOutcome);

  const handleAnalysis = async () => {
    // Comprehensive analysis
    const result = await analyzeCaseML({
      caseText: documentText,
      ragSummary: ragOutput,
      sourceDocuments: sources,
    });

    if (result.success) {
      const { document_bias, outcome_prediction } = result.analysis;
      // Use the results...
    }
  };

  const handlePrediction = async () => {
    // Outcome prediction only
    const result = await predictOutcome({
      caseText: caseText,
      caseType: "criminal",
      jurisdiction: "Delhi"
    });

    if (result.success) {
      const { predictedOutcome, confidenceScore } = result.prediction;
      // Use the prediction...
    }
  };

  return (
    // Your UI
  );
}
```

### Step 3: Integrate with Existing RAG Flow

Update `src/frontend/convex/rag.ts`:

```typescript
export const analyzeQuery = action({
  args: {
    queryId: v.id("queries"),
    queryText: v.string(),
    documentIds: v.optional(v.array(v.id("documents"))),
  },
  handler: async (ctx, args) => {
    try {
      // ... existing RAG analysis code ...

      // After creating prediction, run ML bias analysis
      const mlAnalysis = await ctx.runAction(internal.mlBiasAnalysis.analyzeCaseWithML, {
        caseText: args.queryText,
        ragSummary: ragResponse,
        sourceDocuments: sources.map(s => s.content),
        predictionId: predictionId,
      });

      // ML analysis automatically updates prediction with enhanced bias flags
      
      return {
        success: true,
        predictionId,
        mlAnalysis: mlAnalysis,
      };
    } catch (error) {
      // Handle error...
    }
  },
});
```

---

## 📊 Monitoring & Scaling

### Health Checks

```bash
# Check API status
curl http://localhost:8001/

# Check model info
curl http://localhost:8001/api/v1/model/info

# From Convex
const status = await checkMLAPIStatus();
```

### Performance Optimization

#### 1. Use GPU for Faster Inference
```dockerfile
# In Dockerfile
FROM nvidia/cuda:11.8.0-runtime-ubuntu22.04
# ... rest of dockerfile
```

#### 2. Model Quantization
```python
# In bias_prediction_engine.py
from transformers import BitsAndBytesConfig

quantization_config = BitsAndBytesConfig(
    load_in_8bit=True,
    llm_int8_threshold=6.0
)

self.base_model = AutoModel.from_pretrained(
    model_name,
    quantization_config=quantization_config,
    device_map="auto"
)
```

#### 3. Batch Processing
```python
# Process multiple cases in parallel
from concurrent.futures import ThreadPoolExecutor

def batch_analyze(cases: List[str]):
    with ThreadPoolExecutor(max_workers=4) as executor:
        results = list(executor.map(analyze_legal_case, cases))
    return results
```

#### 4. Redis Caching
```python
# Add caching layer
import redis
import json

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def analyze_with_cache(case_text: str):
    # Check cache
    cache_key = f"analysis:{hash(case_text)}"
    cached = redis_client.get(cache_key)
    
    if cached:
        return json.loads(cached)
    
    # Run analysis
    result = analyze_legal_case(case_text)
    
    # Cache result (1 hour)
    redis_client.setex(cache_key, 3600, json.dumps(result))
    
    return result
```

### Load Balancing

Use Nginx for load balancing multiple API instances:

```nginx
upstream ml_api {
    server ml-api-1:8001;
    server ml-api-2:8001;
    server ml-api-3:8001;
}

server {
    listen 80;
    
    location / {
        proxy_pass http://ml_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 🔒 Security Considerations

### 1. API Authentication

Add JWT authentication:

```python
# In api.py
from fastapi import Security, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

async def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    # Verify JWT token
    if not verify_jwt(token):
        raise HTTPException(status_code=401, detail="Invalid token")
    return token

# Protect endpoints
@app.post("/api/v1/analyze/comprehensive")
async def comprehensive_analysis(
    request: AnalysisRequest,
    token: str = Depends(verify_token)
):
    # ... analysis code
```

### 2. Rate Limiting

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/api/v1/analyze/comprehensive")
@limiter.limit("10/minute")
async def comprehensive_analysis(request: Request, data: AnalysisRequest):
    # ... analysis code
```

### 3. HTTPS/SSL

Always use HTTPS in production. Configure SSL in Railway/Render (automatic) or use Let's Encrypt for EC2.

---

## 🧪 Testing Deployment

### Test Script
```bash
#!/bin/bash

API_URL="http://localhost:8001"

echo "Testing ML API deployment..."

# Test 1: Health check
echo "1. Health check..."
curl -s $API_URL/ | jq .

# Test 2: Model info
echo "2. Model info..."
curl -s $API_URL/api/v1/model/info | jq .

# Test 3: Document bias analysis
echo "3. Document bias analysis..."
curl -s -X POST $API_URL/api/v1/analyze/document-bias \
  -H "Content-Type: application/json" \
  -d '{
    "case_text": "The accused woman from rural area was charged under Section 302 IPC.",
    "threshold": 0.15
  }' | jq .

# Test 4: Outcome prediction
echo "4. Outcome prediction..."
curl -s -X POST $API_URL/api/v1/predict/outcome \
  -H "Content-Type: application/json" \
  -d '{
    "case_text": "Bail application with no prior record and strong community ties.",
    "case_metadata": {"case_type": "bail_application"}
  }' | jq .

echo "All tests complete!"
```

---

## 📈 Monitoring Dashboard

Use Prometheus + Grafana:

```python
# Add to api.py
from prometheus_fastapi_instrumentator import Instrumentator

@app.on_event("startup")
async def startup():
    Instrumentator().instrument(app).expose(app)
```

Access metrics at: `http://localhost:8001/metrics`

---

## 🎯 Next Steps

1. ✅ Deploy ML API to Railway/Render
2. ✅ Set `ML_API_URL` in Convex
3. ✅ Test integration with Convex actions
4. ✅ Update frontend to use ML-enhanced predictions
5. ✅ Monitor performance and scale as needed

---

**Deployment Complete! 🚀**

Your InLegalBERT ML API is now ready to provide AI-powered bias detection and outcome prediction for Verdicto!

