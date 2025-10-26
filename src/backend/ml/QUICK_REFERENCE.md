# 🚀 LexAI Hackathon - Quick Reference Card

## ⚡ Start Everything (ONE COMMAND)

### Windows:
```powershell
cd src\backend\ml
.\start_hackathon.ps1
```

### Linux/macOS:
```bash
cd src/backend/ml
./start_hackathon.sh
```

---

## 📡 API Endpoints (Copy-Paste Ready)

### Base URL: `http://localhost:8002`

### 1. Complete Demo (Show Everything!)
```bash
curl http://localhost:8002/api/v1/demo/complete | jq
```

### 2. Translate Hindi to English
```bash
curl -X POST http://localhost:8002/api/v1/translate/query \
  -H "Content-Type: application/json" \
  -d '{"text": "मुझे जमानत चाहिए", "source_lang": "hi", "target_lang": "en"}'
```

### 3. Generate Bail Application
```bash
curl -X POST http://localhost:8002/api/v1/generate/document \
  -H "Content-Type: application/json" \
  -d '{
    "document_type": "bail_application",
    "details": {
      "applicant_name": "Demo User",
      "state": "Delhi",
      "fir_number": "123/2024",
      "first_time_offender": true
    }
  }'
```

### 4. Simplify Legal Text
```bash
curl -X POST http://localhost:8002/api/v1/simplify \
  -H "Content-Type: application/json" \
  -d '{"legal_text": "The appellant filed a habeas corpus petition.", "reading_level": "simple"}'
```

### 5. What-If Simulation
```bash
curl -X POST http://localhost:8002/api/v1/simulate/outcome \
  -H "Content-Type: application/json" \
  -d '{
    "base_case": {"facts": "Accused has prior conviction. Witnesses unreliable."},
    "modifications": {"remove_prior_conviction": true, "improve_witness_credibility": true}
  }'
```

---

## 🎯 Demo Sequence (5 Minutes)

### Minute 1: Problem Statement
> "85% of Indians can't afford lawyers. We're solving this with AI."

### Minute 2: Translation
1. Type in Hindi: "मुझे जमानत कैसे मिलेगी?"
2. Show English translation + analysis

### Minute 3: Document Generation
1. Click "Generate Bail Application"
2. Fill name, FIR number
3. Show instant document

### Minute 4: Simulation
1. Show case with prior conviction → Conviction (78%)
2. Remove prior conviction → Acquittal (65%)
3. Show chart

### Minute 5: Impact
> "4 ML models, 9 languages, real impact!"

---

## 📊 Key Stats to Mention

- ✅ **9 languages** (80%+ India coverage)
- ✅ **4 ML models** integrated
- ✅ **4 document types** auto-generated
- ✅ **< 2 second** response time
- ✅ **100% functional** - all features work

---

## 🛠️ Troubleshooting

### API won't start?
```bash
# Kill existing process
lsof -i :8002
kill -9 <PID>

# Restart
python hackathon_api.py
```

### Translation fails?
```bash
pip install googletrans==4.0.0rc1
```

### Check if running:
```bash
curl http://localhost:8002/
# Should return: "ready to impress judges! 🚀"
```

---

## 🎬 Elevator Pitch (30s)

> "LexAI democratizes legal access in India. We translate legal content to 9 languages, generate court documents instantly, and predict outcomes with explainable AI. Our what-if simulation shows how case factors affect outcomes - unique for legal strategy. Built with InLegalBERT for Indian context."

---

## 📱 Quick Links

- **API Docs**: http://localhost:8002/docs
- **Demo**: http://localhost:8002/api/v1/demo/complete
- **Full Guide**: `HACKATHON_DEMO.md`

---

## ✅ Pre-Demo Checklist

- [ ] API running on port 8002
- [ ] Test demo endpoint works
- [ ] Prepare Hindi sample query
- [ ] Open API docs in browser
- [ ] Charge laptop
- [ ] Practice 5-min pitch

---

**You're ready! Go win! 🏆**

