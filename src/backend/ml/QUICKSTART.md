# InLegalBERT ML API - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Python 3.10+
- pip
- 4GB+ RAM (8GB recommended)

---

## Step 1: Install Dependencies

### Linux/macOS
```bash
cd src/backend/ml
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Windows
```powershell
cd src\backend\ml
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

---

## Step 2: Start the API

### Option A: Using Start Script

**Linux/macOS:**
```bash
chmod +x start.sh
./start.sh
```

**Windows:**
```powershell
.\start.ps1
```

### Option B: Direct Command
```bash
uvicorn api:app --host 0.0.0.0 --port 8001 --reload
```

### Option C: Using Docker
```bash
docker-compose up
```

The API will be running at: **http://localhost:8001**

📚 **API Documentation**: http://localhost:8001/docs

---

## Step 3: Test the API

### Option A: Using the Web Interface
Open http://localhost:8001/docs in your browser and try the interactive API!

### Option B: Using Client Example
```bash
python client_example.py
```

### Option C: Using cURL
```bash
# Health check
curl http://localhost:8001/

# Analyze bias
curl -X POST http://localhost:8001/api/v1/analyze/document-bias \
  -H "Content-Type: application/json" \
  -d '{
    "case_text": "The woman from rural area was charged under Section 302 IPC.",
    "threshold": 0.15
  }'

# Predict outcome
curl -X POST http://localhost:8001/api/v1/predict/outcome \
  -H "Content-Type: application/json" \
  -d '{
    "case_text": "Bail application with no prior criminal record.",
    "case_metadata": {"case_type": "bail_application"}
  }'
```

---

## Step 4: Integrate with Verdicto

### A. Set ML API URL in Convex

```bash
# In your Verdicto project root
npx convex env set ML_API_URL http://localhost:8001
```

### B. Use in Your Frontend

```typescript
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

function MyComponent() {
  const analyzeCaseML = useAction(api.mlBiasAnalysis.analyzeCaseWithML);

  const handleAnalyze = async () => {
    const result = await analyzeCaseML({
      caseText: "Your legal case text here...",
      ragSummary: "AI-generated summary...",
      sourceDocuments: ["Source 1", "Source 2"]
    });

    if (result.success) {
      console.log("Document Bias:", result.analysis.document_bias);
      console.log("Outcome:", result.analysis.outcome_prediction);
    }
  };

  return <button onClick={handleAnalyze}>Analyze Case</button>;
}
```

---

## 📊 API Endpoints Overview

### 1. Comprehensive Analysis
```bash
POST /api/v1/analyze/comprehensive
```
- Performs all analyses in one call
- Returns: document bias, RAG bias, systemic bias, outcome prediction

### 2. Document Bias Detection
```bash
POST /api/v1/analyze/document-bias
```
- Detects gender, caste, religion, region, socioeconomic, age biases

### 3. RAG Output Bias
```bash
POST /api/v1/analyze/rag-bias
```
- Detects tone bias, interpretive bias, selectivity bias

### 4. Systemic Bias Analysis
```bash
POST /api/v1/analyze/systemic-bias
```
- Analyzes historical case data for disparities
- Returns dashboard-ready visualization data

### 5. Outcome Prediction
```bash
POST /api/v1/predict/outcome
```
- Predicts: conviction, acquittal, bail granted/denied
- Returns confidence score and justification

### 6. Model Info
```bash
GET /api/v1/model/info
```
- Returns model metadata and status

---

## 🔧 Configuration

### Environment Variables

Create `.env` file:
```bash
# API Configuration
API_HOST=0.0.0.0
API_PORT=8001

# Model Configuration
MODEL_NAME=law-ai/InLegalBERT
TRANSFORMERS_CACHE=/path/to/cache

# Device Selection
CUDA_VISIBLE_DEVICES=0  # For GPU
```

---

## 🧪 Run Tests

```bash
# Install test dependencies
pip install pytest httpx

# Run tests
pytest test_api.py -v

# Run with coverage
pytest test_api.py --cov=. --cov-report=html
```

---

## 📝 Example Use Cases

### Use Case 1: Analyze Legal Document for Bias
```python
import requests

response = requests.post(
    "http://localhost:8001/api/v1/analyze/document-bias",
    json={
        "case_text": """
        The accused, a 35-year-old woman from rural Maharashtra, 
        belongs to a scheduled caste community and was charged with murder.
        """,
        "threshold": 0.15
    }
)

result = response.json()
print("Bias Flags:", result["results"]["biasFlags_text"])
# Output: ['gender', 'region', 'caste']
```

### Use Case 2: Predict Case Outcome
```python
import requests

response = requests.post(
    "http://localhost:8001/api/v1/predict/outcome",
    json={
        "case_text": """
        Bail application under Section 420 IPC. The petitioner has no prior 
        criminal record and strong community ties. Evidence is primarily documentary.
        """,
        "case_metadata": {
            "case_type": "bail_application",
            "jurisdiction": "Delhi"
        }
    }
)

result = response.json()
prediction = result["results"]
print(f"Outcome: {prediction['predictedOutcome']}")
print(f"Confidence: {prediction['confidenceScore']}")
print(f"Reason: {prediction['justification']}")
```

### Use Case 3: Detect RAG Output Bias
```python
import requests

response = requests.post(
    "http://localhost:8001/api/v1/analyze/rag-bias",
    json={
        "rag_summary": "Clearly the defendant is obviously guilty without doubt.",
        "source_documents": ["The evidence shows circumstantial proof..."]
    }
)

result = response.json()
print("RAG Bias Flags:", result["results"]["biasFlags_output"])
# Output: ['tone_bias', 'interpretive_bias']
```

### Use Case 4: Systemic Bias Analysis
```python
import requests

historical_cases = [
    {"outcome": "conviction", "gender": "male", "region": "urban", "year": 2023},
    {"outcome": "acquittal", "gender": "female", "region": "rural", "year": 2023},
    # ... more cases
]

response = requests.post(
    "http://localhost:8001/api/v1/analyze/systemic-bias",
    json={"historical_cases": historical_cases}
)

result = response.json()
dashboard = result["results"]["biasDashboardData"]
print("Total Cases:", dashboard["summary_metrics"]["total_cases_analyzed"])
print("Bias Flags:", result["results"]["systemic_bias_flags"])
```

---

## 🐛 Troubleshooting

### Issue: Model Download Fails
**Solution:**
```bash
# Pre-download model manually
python -c "from transformers import AutoTokenizer, AutoModel; AutoTokenizer.from_pretrained('law-ai/InLegalBERT'); AutoModel.from_pretrained('law-ai/InLegalBERT')"
```

### Issue: CUDA Out of Memory
**Solution:**
```bash
# Force CPU mode
export CUDA_VISIBLE_DEVICES=-1
python api.py
```

### Issue: Port Already in Use
**Solution:**
```bash
# Use different port
uvicorn api:app --port 8002
```

### Issue: Import Errors
**Solution:**
```bash
# Reinstall dependencies
pip install --upgrade --force-reinstall -r requirements.txt
```

---

## 📚 Next Steps

1. ✅ **Read Full Documentation**: See `README.md` for detailed API docs
2. ✅ **Deploy to Cloud**: See `DEPLOYMENT.md` for production deployment
3. ✅ **Customize Models**: Fine-tune InLegalBERT for your specific use case
4. ✅ **Integrate with Verdicto**: Follow integration guide in `README.md`

---

## 🆘 Support

- 📖 **API Docs**: http://localhost:8001/docs
- 📝 **Full README**: `README.md`
- 🚀 **Deployment Guide**: `DEPLOYMENT.md`
- 🧪 **Tests**: `test_api.py`
- 💡 **Examples**: `client_example.py`

---

**You're all set! 🎉**

Your InLegalBERT ML API is now running and ready to detect bias and predict outcomes for Indian legal cases!

