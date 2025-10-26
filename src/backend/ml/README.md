# InLegalBERT Bias Detection & Outcome Prediction API

## 🎯 Overview

This module provides **AI-powered bias detection and outcome prediction** for Indian legal cases using **InLegalBERT** (a pretrained LegalBERT model fine-tuned for Indian legal contexts from Hugging Face).

### Key Features

1. **📄 Document/Text Bias Detection** - Identifies biases in legal documents, FIRs, and judgments
   - Gender bias
   - Caste bias
   - Religious bias
   - Regional bias
   - Socioeconomic bias
   - Age bias

2. **🤖 RAG Output Bias Detection** - Analyzes AI-generated summaries for:
   - Tone bias (deviation from source)
   - Interpretive bias (subjective language)
   - Selectivity bias (over-emphasis)

3. **📊 Systemic/Statistical Bias Analysis** - Detects patterns in historical cases:
   - Gender disparities in outcomes
   - Regional disparities
   - Caste-based disparities
   - Temporal trends
   - Dashboard-ready visualization data

4. **⚖️ Outcome Prediction** - Predicts legal case outcomes:
   - Conviction/Acquittal
   - Bail granted/denied
   - Confidence scores (0-1)
   - Detailed justification

---

## 🚀 Quick Start

### Installation

```bash
# Navigate to ML backend directory
cd src/backend/ml

# Install dependencies
pip install -r requirements.txt
```

### Running the API Server

```bash
# Start the FastAPI server
python api.py

# Or with uvicorn directly
uvicorn api:app --host 0.0.0.0 --port 8001 --reload
```

The API will be available at: `http://localhost:8001`

API Documentation (Swagger): `http://localhost:8001/docs`

---

## 📡 API Endpoints

### 1. Comprehensive Analysis
**POST** `/api/v1/analyze/comprehensive`

Performs all analyses in one call.

**Request Body:**
```json
{
  "case_text": "Legal document text here...",
  "rag_summary": "AI-generated summary (optional)",
  "source_documents": ["Source doc 1", "Source doc 2"],
  "historical_cases": [
    {
      "outcome": "conviction",
      "gender": "male",
      "region": "urban",
      "caste": "general",
      "year": 2023
    }
  ],
  "case_metadata": {
    "case_type": "criminal",
    "jurisdiction": "Delhi"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "analysis_id": "analysis_20231215_143022",
  "timestamp": "2023-12-15T14:30:22",
  "document_bias": {
    "biasFlags_text": ["gender", "caste"],
    "bias_scores": {
      "gender": 0.234,
      "caste": 0.187,
      "religion": 0.045
    },
    "bias_details": [
      {
        "type": "gender",
        "severity": "medium",
        "score": 0.234,
        "description": "Gender bias detected based on keyword analysis"
      }
    ]
  },
  "rag_bias": {
    "biasFlags_output": ["tone_bias", "interpretive_bias"],
    "bias_details": [...]
  },
  "systemic_bias": {
    "systemic_bias_flags": ["gender_disparity"],
    "biasDashboardData": {
      "summary_metrics": {...},
      "gender_analysis": {...},
      "regional_analysis": {...}
    }
  },
  "outcome_prediction": {
    "predictedOutcome": "acquittal",
    "confidenceScore": 0.73,
    "confidenceLevel": "medium",
    "justification": "Text analysis shows 8 acquittal indicators vs 3 conviction indicators"
  }
}
```

### 2. Document Bias Detection Only
**POST** `/api/v1/analyze/document-bias`

```json
{
  "case_text": "Document text...",
  "threshold": 0.15
}
```

### 3. RAG Output Bias Detection
**POST** `/api/v1/analyze/rag-bias`

```json
{
  "rag_summary": "AI summary...",
  "source_documents": ["Source 1", "Source 2"]
}
```

### 4. Systemic Bias Analysis
**POST** `/api/v1/analyze/systemic-bias`

```json
{
  "historical_cases": [
    {
      "outcome": "conviction",
      "gender": "female",
      "region": "rural",
      "year": 2023
    }
  ]
}
```

### 5. Outcome Prediction
**POST** `/api/v1/predict/outcome`

```json
{
  "case_text": "Case description...",
  "case_metadata": {
    "case_type": "bail_application",
    "jurisdiction": "Maharashtra"
  }
}
```

### 6. Model Information
**GET** `/api/v1/model/info`

Returns model metadata and configuration.

---

## 🔧 Integration Guide

### Integration with Existing Verdicto Backend

#### Option 1: Direct Python Integration (Recommended)

```python
# In your existing FastAPI backend or Convex actions
from src.backend.ml.bias_prediction_engine import analyze_legal_case

# Use in your existing code
result = analyze_legal_case(
    case_text=document_text,
    rag_summary=rag_output,
    source_documents=sources,
    historical_cases=historical_data,
    case_metadata=metadata
)
```

#### Option 2: HTTP API Integration

```python
import requests

# Call ML API from your existing backend
response = requests.post(
    "http://localhost:8001/api/v1/analyze/comprehensive",
    json={
        "case_text": case_text,
        "rag_summary": rag_summary,
        # ... other params
    }
)

result = response.json()
```

### Integration with Convex Actions

Create a new Convex action:

```typescript
// src/frontend/convex/mlAnalysis.ts
"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";

const ML_API_URL = process.env.ML_API_URL || "http://localhost:8001";

export const analyzeCaseWithML = action({
  args: {
    caseText: v.string(),
    ragSummary: v.optional(v.string()),
    caseMetadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const response = await fetch(`${ML_API_URL}/api/v1/analyze/comprehensive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        case_text: args.caseText,
        rag_summary: args.ragSummary,
        case_metadata: args.caseMetadata,
      }),
    });

    if (!response.ok) {
      throw new Error(`ML analysis failed: ${response.statusText}`);
    }

    return await response.json();
  },
});
```

Use in frontend:

```typescript
// In your React component
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

const analyzeCaseML = useAction(api.mlAnalysis.analyzeCaseWithML);

const handleAnalysis = async () => {
  const result = await analyzeCaseML({
    caseText: caseText,
    ragSummary: ragOutput,
    caseMetadata: { case_type: "criminal" }
  });
  
  // Use result.document_bias, result.outcome_prediction, etc.
};
```

---

## 📊 Response Schema Details

### Document Bias Response
```typescript
{
  biasFlags_text: string[];  // ["gender", "caste", "region"]
  bias_scores: {
    gender: number;       // 0.0 - 1.0
    caste: number;
    religion: number;
    region: number;
    socioeconomic: number;
    age: number;
  };
  bias_details: Array<{
    type: string;
    severity: "low" | "medium" | "high";
    score: number;
    description: string;
  }>;
  overall_bias_score: number;
}
```

### RAG Bias Response
```typescript
{
  biasFlags_output: string[];  // ["tone_bias", "interpretive_bias", "selectivity_bias"]
  bias_details: Array<{
    type: string;
    severity: "low" | "medium" | "high";
    score: number;
    description: string;
  }>;
}
```

### Systemic Bias Response
```typescript
{
  systemic_bias_flags: string[];  // ["gender_disparity", "regional_disparity"]
  biasDashboardData: {
    summary_metrics: {
      total_cases_analyzed: number;
      overall_conviction_rate: number;
      bias_flags_detected: number;
    };
    gender_analysis: {
      disparity_data: Record<string, {
        total_cases: number;
        conviction_rate: number;
        acquittal_rate: number;
      }>;
      chart_data: Array<{
        category: string;
        conviction_rate: number;
      }>;
    };
    regional_analysis: { /* same structure */ };
    caste_analysis: { /* same structure */ };
    temporal_trends: {
      by_year: Record<number, {
        total: number;
        conviction_rate: number;
      }>;
    };
  };
}
```

### Outcome Prediction Response
```typescript
{
  predictedOutcome: string;  // "conviction" | "acquittal" | "bail_granted" | "bail_denied" | "uncertain"
  confidenceScore: number;   // 0.0 - 1.0
  confidenceLevel: "low" | "medium" | "high";
  justification: string;
  analysis_timestamp: string;
}
```

---

## 🧪 Testing

### Using the Client Example

```bash
# Run the example client
python client_example.py
```

### Using cURL

```bash
# Comprehensive analysis
curl -X POST http://localhost:8001/api/v1/analyze/comprehensive \
  -H "Content-Type: application/json" \
  -d '{
    "case_text": "The accused, a woman from rural area...",
    "case_metadata": {"case_type": "criminal"}
  }'

# Outcome prediction
curl -X POST http://localhost:8001/api/v1/predict/outcome \
  -H "Content-Type: application/json" \
  -d '{
    "case_text": "Bail application for fraud case...",
    "case_metadata": {"case_type": "bail_application"}
  }'
```

### Using Postman

Import the OpenAPI schema from: `http://localhost:8001/openapi.json`

---

## 🔬 Technical Details

### Model Architecture
- **Base Model**: InLegalBERT (law-ai/InLegalBERT)
- **Framework**: Hugging Face Transformers
- **Backend**: PyTorch
- **Embedding Dimension**: 768
- **Max Sequence Length**: 512 tokens

### Bias Detection Methods

1. **Keyword-based Analysis**: Frequency analysis of bias-indicating terms
2. **Contextual Analysis**: BERT embeddings for semantic understanding
3. **Statistical Analysis**: Distribution analysis for systemic patterns
4. **Comparative Analysis**: Cosine similarity for RAG output bias

### Outcome Prediction Approach

Current implementation uses:
- Keyword frequency analysis
- Contextual embeddings
- Heuristic scoring

**For Production**: Fine-tune a classification head on labeled Indian legal case outcomes.

---

## 🚀 Deployment

### Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001

CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8001"]
```

Build and run:
```bash
docker build -t inlegalbert-api .
docker run -p 8001:8001 inlegalbert-api
```

### Railway/Render Deployment

Add `Procfile`:
```
web: uvicorn api:app --host 0.0.0.0 --port $PORT
```

---

## 📈 Performance Optimization

### Tips for Production

1. **Model Caching**: Model is loaded once at startup (singleton pattern)
2. **Batch Processing**: Process multiple cases in parallel
3. **GPU Acceleration**: Set `CUDA_VISIBLE_DEVICES` for GPU usage
4. **API Rate Limiting**: Add rate limiting for production
5. **Async Processing**: Use background tasks for long-running analyses

### Example: Batch Processing

```python
from concurrent.futures import ThreadPoolExecutor

cases = [case1, case2, case3]

with ThreadPoolExecutor(max_workers=4) as executor:
    results = list(executor.map(analyze_legal_case, cases))
```

---

## 🛠️ Customization

### Adding New Bias Types

Edit `bias_keywords` in `bias_prediction_engine.py`:

```python
self.bias_keywords = {
    'your_new_bias': ['keyword1', 'keyword2', ...],
    # ... existing biases
}
```

### Fine-tuning for Outcome Prediction

```python
# Train a classification head
from transformers import AutoModelForSequenceClassification

model = AutoModelForSequenceClassification.from_pretrained(
    "law-ai/InLegalBERT",
    num_labels=3  # conviction, acquittal, uncertain
)

# Fine-tune on your labeled dataset
# ... training loop ...

# Save and use in production
model.save_pretrained("./models/outcome_classifier")
```

---

## 🐛 Troubleshooting

### Common Issues

1. **Model Download Fails**
   ```bash
   # Pre-download model
   python -c "from transformers import AutoModel; AutoModel.from_pretrained('law-ai/InLegalBERT')"
   ```

2. **CUDA Out of Memory**
   ```python
   # Use CPU
   device = torch.device("cpu")
   ```

3. **API Timeout**
   ```python
   # Increase timeout in client
   response = requests.post(url, json=data, timeout=60)
   ```

---

## 📝 License & Credits

- **InLegalBERT Model**: [law-ai/InLegalBERT](https://huggingface.co/law-ai/InLegalBERT)
- **Transformers**: Hugging Face
- **Framework**: FastAPI, PyTorch

---

## 🤝 Contributing

To add features or improvements:

1. Add functionality to `bias_prediction_engine.py`
2. Add corresponding API endpoint to `api.py`
3. Update client examples in `client_example.py`
4. Update this README

---

## 📞 Support

For issues or questions:
- Check API docs: `http://localhost:8001/docs`
- Review examples: `client_example.py`
- Check logs for detailed error messages

---

**Built with ❤️ for Indian Legal Tech**

