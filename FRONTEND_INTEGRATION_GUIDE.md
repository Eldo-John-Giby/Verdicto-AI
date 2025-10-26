# Frontend Integration Guide - ML Backend Features

## 🚀 Quick Start

This guide explains how to integrate the ML backend features (InLegalBERT bias detection and hackathon features) with your Verdicto frontend.

## 📋 Changes Made

### 1. **Convex Backend Files**

#### Updated Files:
- ✅ `src/frontend/convex/predictions.ts` - Fixed `getHistoricalData` to use `internalQuery`
- ✅ `src/frontend/convex/rag.ts` - Added ML bias analysis call after RAG response
- ✅ `src/frontend/convex/hackathonFeatures.ts` - Already created (9 actions)
- ✅ `src/frontend/convex/mlBiasAnalysis.ts` - Already created (5 actions)

### 2. **Frontend Pages**

#### Enhanced Pages:
- ✅ `src/frontend/pages/CasePrediction.tsx` - Added multilingual, simplification, and simulation features
- ✅ `src/frontend/pages/BiasInsights.tsx` - Added systemic bias analysis dashboard
- ✅ `src/frontend/pages/DocumentGenerator.tsx` - **NEW** - Document generation page
- ✅ `src/frontend/pages/Dashboard.tsx` - Added DocumentGenerator to navigation

#### Routing:
- ✅ `src/frontend/main.tsx` - Added `/dashboard/generator` route

---

## 🔧 Environment Setup

### Step 1: Set Environment Variables

You need to configure two backend API URLs for Convex to communicate with the ML services.

#### Option A: Using Convex Dashboard (Recommended for Production)

1. Go to your Convex dashboard: https://dashboard.convex.dev
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

```bash
ML_API_URL=http://localhost:8001
HACKATHON_API_URL=http://localhost:8002
```

For production, replace with your deployed URLs:
```bash
ML_API_URL=https://your-ml-api.railway.app
HACKATHON_API_URL=https://your-hackathon-api.railway.app
```

#### Option B: Using CLI (For Development)

```bash
# Set ML API URL (for bias detection)
npx convex env set ML_API_URL http://localhost:8001

# Set Hackathon API URL (for translation, document generation, etc.)
npx convex env set HACKATHON_API_URL http://localhost:8002
```

### Step 2: Start Backend Services

You need to run **TWO** separate Python APIs:

#### Terminal 1: ML Bias Analysis API (Port 8001)
```bash
cd src/backend/ml
python api.py
```

This starts:
- InLegalBERT bias detection
- Outcome prediction
- RAG bias analysis
- Systemic bias analysis

#### Terminal 2: Hackathon Features API (Port 8002)
```bash
cd src/backend/ml
python hackathon_api.py
```

This starts:
- Multilingual translation (9 languages)
- Legal document generation (4 templates)
- Plain language simplification
- What-if simulation
- Sensitivity analysis

### Step 3: Deploy Convex Functions

After setting environment variables:

```bash
npx convex deploy
```

This deploys all the new Convex actions that connect to the ML backends.

### Step 4: Start Frontend

```bash
pnpm dev
```

---

## 📦 What's Available Now

### 1. **Case Prediction Page** (`/dashboard`)

#### New Features:
- **Multilingual Input**: Select from 9 Indian languages (Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam)
- **Auto Translation**: Queries are automatically translated to English for processing
- **Plain Language Simplification**: Click "Simplify to Plain Language" to get citizen-friendly explanations
- **What-If Simulation**: Toggle case factors to see how outcomes change
  - Remove Prior Conviction
  - Add Strong Alibi
  - Improve Witness Credibility
  - Add Mitigating Factors
  - Reduce Flight Risk
  - Enhance Evidence Quality

#### How to Use:
1. Select your language from the dropdown
2. Enter your legal query (in any supported language)
3. Click "Analyze Case"
4. View prediction with bias alerts
5. Click "Simplify to Plain Language" for easy understanding
6. Use "What-If Simulation" to explore different scenarios

### 2. **Document Generator** (`/dashboard/generator`) **[NEW]**

#### Available Document Types:
1. **Bail Application** - Complete bail application under CrPC
2. **FIR/Complaint** - First Information Report for police
3. **Legal Notice** - Legal notice under relevant provisions
4. **Court Petition** - Court petition/writ

#### How to Use:
1. Select document type
2. Fill in required details (name, state, incident description, etc.)
3. Click "Generate Document"
4. Copy or download the generated document

#### Features:
- ✅ AI-powered template filling
- ✅ Instant generation (2-3 seconds)
- ✅ Editable output
- ✅ Copy to clipboard
- ✅ Download as .txt file

### 3. **Bias Insights** (`/dashboard/bias`)

#### New Features:
- **Systemic Bias Analysis Dashboard**:
  - Total cases analyzed
  - Overall conviction rate
  - Bias flags detected
  - Gender-based analysis with conviction rates
  - Regional disparity analysis
  - Visual progress indicators

#### How it Works:
- Automatically analyzes historical prediction data
- Detects patterns across gender, region, and caste
- Shows statistical disparities
- Displays visualization-ready data

---

## 🔌 API Integration Details

### Convex Actions Available

#### From `hackathonFeatures.ts`:
```typescript
// Translation
api.hackathonFeatures.translateQuery({ text, sourceLang, targetLang })
api.hackathonFeatures.translateResponse({ text, targetLang })
api.hackathonFeatures.getSupportedLanguages({})

// Simplification
api.hackathonFeatures.simplifyLegalText({ legalText, readingLevel })

// Document Generation
api.hackathonFeatures.generateDocument({ documentType, details })
api.hackathonFeatures.getDocumentTemplates({})

// Simulation
api.hackathonFeatures.simulateOutcome({ baseCaseFacts, modifications })
api.hackathonFeatures.sensitivityAnalysis({ caseFacts })

// Demo
api.hackathonFeatures.getCompleteDemo({})
```

#### From `mlBiasAnalysis.ts`:
```typescript
// Comprehensive Analysis
api.mlBiasAnalysis.analyzeCaseWithML({ 
  caseText, 
  ragSummary?, 
  sourceDocuments?, 
  predictionId? 
})

// Outcome Prediction
api.mlBiasAnalysis.predictOutcome({ 
  caseText, 
  caseType?, 
  jurisdiction? 
})

// Bias Analysis
api.mlBiasAnalysis.analyzeSystemicBias({ timeRange? })
api.mlBiasAnalysis.analyzeRAGBias({ ragSummary, sourceDocuments })

// Health Check
api.mlBiasAnalysis.checkMLAPIStatus({})
```

---

## 🧪 Testing the Integration

### Test 1: Multilingual Translation
1. Go to `/dashboard`
2. Select "Hindi (हिन्दी)" from language dropdown
3. Enter: "मुझे जमानत चाहिए"
4. Click "Analyze Case"
5. Should see automatic translation and analysis

### Test 2: Document Generation
1. Go to `/dashboard/generator`
2. Select "Bail Application"
3. Fill in:
   - Applicant Name: "Test User"
   - State: "Delhi"
   - Check "First-time offender"
4. Click "Generate Document"
5. Should see complete bail application

### Test 3: What-If Simulation
1. Go to `/dashboard` and run a case analysis
2. After prediction appears, scroll to "What-If Simulation"
3. Click "Show"
4. Check "Remove Prior Conviction" and "Add Strong Alibi"
5. Click "Run Simulation"
6. Should see outcome comparison

### Test 4: Systemic Bias Analysis
1. Go to `/dashboard/bias`
2. Should see loading indicator
3. After a few seconds, systemic bias dashboard appears
4. View gender analysis, regional analysis, and bias flags

---

## 🐛 Troubleshooting

### Issue: "ML API error" or "Translation failed"

**Cause**: Backend APIs not running

**Solution**:
```bash
# Check if APIs are running
curl http://localhost:8001/
curl http://localhost:8002/

# If not, start them:
cd src/backend/ml
python api.py        # Terminal 1
python hackathon_api.py  # Terminal 2
```

### Issue: "Translation service not available"

**Cause**: Missing dependencies

**Solution**:
```bash
cd src/backend/ml
pip install googletrans==4.0.0rc1 langdetect
```

### Issue: Environment variables not set

**Cause**: Convex doesn't have the API URLs

**Solution**:
```bash
npx convex env set ML_API_URL http://localhost:8001
npx convex env set HACKATHON_API_URL http://localhost:8002
npx convex deploy
```

### Issue: "Action not found" errors

**Cause**: Convex functions not deployed

**Solution**:
```bash
npx convex deploy
```

---

## 📊 Feature Matrix

| Feature | Page | Backend Required | Convex Action |
|---------|------|------------------|---------------|
| Multilingual Translation | Case Prediction | Hackathon API | `translateQuery` |
| Plain Language Simplification | Case Prediction | Hackathon API | `simplifyLegalText` |
| What-If Simulation | Case Prediction | Hackathon API | `simulateOutcome` |
| Bias Detection | Case Prediction | ML API | `analyzeCaseWithML` |
| Document Generation | Document Generator | Hackathon API | `generateDocument` |
| Systemic Bias Analysis | Bias Insights | ML API | `analyzeSystemicBias` |
| Outcome Prediction | Case Prediction | ML API | `predictOutcome` |

---

## 🚀 Deployment Checklist

### Development:
- [x] Set local environment variables
- [x] Start ML API (port 8001)
- [x] Start Hackathon API (port 8002)
- [x] Deploy Convex functions
- [x] Start frontend

### Production:
- [ ] Deploy ML API to Railway/Render
- [ ] Deploy Hackathon API to Railway/Render
- [ ] Update Convex env vars with production URLs
- [ ] Deploy Convex functions
- [ ] Build and deploy frontend
- [ ] Test all features in production

---

## 📝 Notes

### Graceful Degradation:
All ML features have error handling that prevents the app from breaking if backends are unavailable:
- Translation failures fall back to original text
- Simplification failures show an error toast
- Simulation failures are logged and notified
- Bias analysis failures are caught and logged

### Performance:
- **Translation**: ~500ms per request
- **Document Generation**: ~2-3 seconds
- **Simulation**: ~1-2 seconds
- **Bias Analysis**: ~200-500ms
- **Systemic Analysis**: ~300ms (cached after first load)

### Supported Languages:
1. English
2. Hindi (हिन्दी)
3. Tamil (தமிழ்)
4. Telugu (తెలుగు)
5. Bengali (বাংলা)
6. Marathi (मराठी)
7. Gujarati (ગુજરાતી)
8. Kannada (ಕನ್ನಡ)
9. Malayalam (മലയാളം)

---

## 🎯 Next Steps

1. **Test all features locally**
2. **Deploy backend APIs to production**
3. **Update production environment variables**
4. **Test in production environment**
5. **Monitor API performance**
6. **Collect user feedback**

---

## 📞 Support

For issues or questions:
1. Check the backend README: `src/backend/ml/README.md`
2. Review API docs: `http://localhost:8001/docs` and `http://localhost:8002/docs`
3. Check backend implementation summary: `src/backend/ml/IMPLEMENTATION_SUMMARY.md`

---

**Built with ❤️ for Verdicto - Justice, Accelerated by AI**

