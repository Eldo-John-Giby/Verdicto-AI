"""
Unified FastAPI API for InLegalBERT Analysis & Hackathon Features
==================================================================

This module provides REST API endpoints for:
1. Bias detection and outcome prediction (InLegalBERT)
2. Multilingual translation (9 languages)
3. Legal document generation (4 types)
4. Plain language simplification
5. What-if simulation engine
6. Sensitivity analysis

All features consolidated into a single API on port 8001.
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uvicorn
from datetime import datetime

from bias_prediction_engine import analyze_legal_case, get_model
from translation_service import get_translation_service
from document_generator import get_document_generator
from simulation_engine import get_simulation_engine

# ============================================================================
# FASTAPI APP SETUP
# ============================================================================

app = FastAPI(
    title="LexAI Unified ML API",
    description="Comprehensive legal AI analysis: bias detection, translation, document generation, and simulation",
    version="2.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# PYDANTIC MODELS (Request/Response Schemas)
# ============================================================================

# --- Bias Analysis Models ---
class CaseMetadata(BaseModel):
    """Optional metadata for case analysis"""
    case_type: Optional[str] = Field(None, description="Type of case (criminal, civil, bail, etc.)")
    jurisdiction: Optional[str] = Field(None, description="Court jurisdiction")
    year: Optional[int] = Field(None, description="Case year")
    

class HistoricalCase(BaseModel):
    """Historical case data for systemic bias analysis"""
    outcome: str = Field(..., description="Case outcome (conviction, acquittal, etc.)")
    gender: Optional[str] = Field(None, description="Gender of defendant")
    region: Optional[str] = Field(None, description="Geographic region")
    caste: Optional[str] = Field(None, description="Caste category")
    case_type: Optional[str] = Field(None, description="Type of case")
    year: Optional[int] = Field(None, description="Year of case")


class AnalysisRequest(BaseModel):
    """Main request model for comprehensive analysis"""
    case_text: str = Field(..., description="Legal document/FIR/judgment text", min_length=10)
    rag_summary: Optional[str] = Field(None, description="AI-generated summary for RAG bias detection")
    source_documents: Optional[List[str]] = Field(None, description="Source documents used for RAG")
    historical_cases: Optional[List[HistoricalCase]] = Field(None, description="Historical cases for systemic analysis")
    case_metadata: Optional[CaseMetadata] = Field(None, description="Case metadata")


class DocumentBiasRequest(BaseModel):
    """Request for document-only bias detection"""
    case_text: str = Field(..., description="Legal document text")
    threshold: float = Field(0.15, ge=0.0, le=1.0, description="Bias detection threshold")


class RAGBiasRequest(BaseModel):
    """Request for RAG output bias detection"""
    rag_summary: str = Field(..., description="AI-generated summary")
    source_documents: List[str] = Field(..., description="Source documents")


class SystemicBiasRequest(BaseModel):
    """Request for systemic bias analysis"""
    historical_cases: List[HistoricalCase] = Field(..., description="Historical case data")


class OutcomePredictionRequest(BaseModel):
    """Request for outcome prediction only"""
    case_text: str = Field(..., description="Legal case text")
    case_metadata: Optional[CaseMetadata] = Field(None, description="Optional case metadata")


class AnalysisResponse(BaseModel):
    """Response model for analysis results"""
    status: str
    analysis_id: str
    timestamp: str
    document_bias: Optional[Dict[str, Any]] = None
    rag_bias: Optional[Dict[str, Any]] = None
    systemic_bias: Optional[Dict[str, Any]] = None
    outcome_prediction: Optional[Dict[str, Any]] = None


# --- Translation & Simplification Models ---
class TranslateRequest(BaseModel):
    text: str = Field(..., description="Text to translate")
    source_lang: str = Field("auto", description="Source language (auto-detect)")
    target_lang: str = Field("en", description="Target language")


class SimplifyRequest(BaseModel):
    legal_text: str = Field(..., description="Complex legal text")
    reading_level: str = Field("simple", description="Reading level (simple/intermediate)")


# --- Document Generation Models ---
class DocumentGenerateRequest(BaseModel):
    document_type: str = Field(..., description="Type: bail_application, fir_complaint, legal_notice, petition")
    details: Dict[str, Any] = Field(..., description="Document details")


# --- Simulation Models ---
class SimulationRequest(BaseModel):
    base_case: Dict[str, Any] = Field(..., description="Original case facts")
    modifications: Dict[str, Any] = Field(..., description="Modifications to test")


class SensitivityRequest(BaseModel):
    case_facts: str = Field(..., description="Case facts for sensitivity analysis")


# ============================================================================
# ROOT & HEALTH CHECK
# ============================================================================

@app.get("/")
async def root():
    """API health check and feature overview"""
    return {
        "service": "LexAI Unified ML API",
        "status": "operational",
        "version": "2.0.0",
        "port": 8001,
        "features": {
            "bias_analysis": "InLegalBERT-powered bias detection",
            "outcome_prediction": "Legal case outcome prediction",
            "translation": "9 Indian languages supported",
            "simplification": "Plain language conversion",
            "document_generation": "4 legal document types",
            "simulation": "What-if scenario analysis"
        },
        "timestamp": datetime.now().isoformat()
    }


# ============================================================================
# BIAS ANALYSIS ENDPOINTS
# ============================================================================

@app.post("/api/v1/analyze/comprehensive", response_model=AnalysisResponse)
async def comprehensive_analysis(request: AnalysisRequest):
    """
    Perform comprehensive legal case analysis including:
    - Document bias detection
    - RAG output bias detection (if RAG summary provided)
    - Systemic bias analysis (if historical cases provided)
    - Outcome prediction
    """
    try:
        # Convert Pydantic models to dicts
        historical_cases_dict = None
        if request.historical_cases:
            historical_cases_dict = [case.dict() for case in request.historical_cases]
        
        case_metadata_dict = None
        if request.case_metadata:
            case_metadata_dict = request.case_metadata.dict()
        
        # Run analysis
        results = analyze_legal_case(
            case_text=request.case_text,
            rag_summary=request.rag_summary,
            source_documents=request.source_documents,
            historical_cases=historical_cases_dict,
            case_metadata=case_metadata_dict
        )
        
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.post("/api/v1/analyze/document-bias")
async def document_bias_analysis(request: DocumentBiasRequest):
    """Analyze document for textual biases (gender, caste, region, etc.)"""
    try:
        model = get_model()
        results = model.detect_document_bias(request.case_text, request.threshold)
        
        return {
            "status": "success",
            "analysis_id": f"doc_bias_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "timestamp": datetime.now().isoformat(),
            "results": results,
            "granular_bias_scores": results.get("granular_scores", {}),
            "overall_bias": results.get("overall_bias_score", 0)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document bias analysis failed: {str(e)}")


@app.post("/api/v1/analyze/rag-bias")
async def rag_bias_analysis(request: RAGBiasRequest):
    """Analyze RAG-generated output for tone, interpretive, and selectivity biases"""
    try:
        model = get_model()
        results = model.detect_rag_output_bias(
            request.rag_summary,
            request.source_documents
        )
        
        return {
            "status": "success",
            "analysis_id": f"rag_bias_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "timestamp": datetime.now().isoformat(),
            "results": results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG bias analysis failed: {str(e)}")


@app.post("/api/v1/analyze/systemic-bias")
async def systemic_bias_analysis(request: SystemicBiasRequest):
    """Analyze historical cases for systemic and statistical biases"""
    try:
        model = get_model()
        historical_cases_dict = [case.dict() for case in request.historical_cases]
        results = model.detect_systemic_bias(historical_cases_dict)
        
        return {
            "status": "success",
            "analysis_id": f"systemic_bias_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "timestamp": datetime.now().isoformat(),
            "results": results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Systemic bias analysis failed: {str(e)}")


@app.post("/api/v1/predict/outcome")
async def outcome_prediction(request: OutcomePredictionRequest):
    """Predict legal case outcome with confidence score"""
    try:
        model = get_model()
        case_metadata_dict = None
        if request.case_metadata:
            case_metadata_dict = request.case_metadata.dict()
        
        results = model.predict_outcome(request.case_text, case_metadata_dict)
        
        return {
            "status": "success",
            "analysis_id": f"prediction_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "timestamp": datetime.now().isoformat(),
            "results": results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Outcome prediction failed: {str(e)}")


@app.get("/api/v1/model/info")
async def model_info():
    """Get information about the loaded model"""
    try:
        model = get_model()
        return {
            "model_name": "InLegalBERT (law-ai/InLegalBERT)",
            "device": str(model.device),
            "bias_types_supported": list(model.bias_keywords.keys()),
            "status": "loaded",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model info retrieval failed: {str(e)}")


# ============================================================================
# TRANSLATION ENDPOINTS
# ============================================================================

@app.post("/api/v1/translate/query")
async def translate_query(request: TranslateRequest):
    """
    Translate user query to English for processing
    
    **Supports**: Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam
    """
    try:
        service = get_translation_service()
        result = service.translate_query(
            request.text,
            request.source_lang,
            request.target_lang
        )
        
        return {
            "status": "success",
            "translation": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/translate/response")
async def translate_response(request: TranslateRequest):
    """Translate AI response to user's language"""
    try:
        service = get_translation_service()
        result = service.translate_response(
            request.text,
            request.target_lang
        )
        
        return {
            "status": "success",
            "translation": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/languages")
async def get_supported_languages():
    """Get list of supported languages"""
    service = get_translation_service()
    return {
        "languages": service.get_supported_languages(),
        "total": len(service.get_supported_languages())
    }


# ============================================================================
# SIMPLIFICATION ENDPOINTS
# ============================================================================

@app.post("/api/v1/simplify")
async def simplify_legal_text(request: SimplifyRequest):
    """
    Convert complex legal language to plain language
    
    **Perfect for citizens!**
    """
    try:
        service = get_translation_service()
        result = service.simplify_legal_text(
            request.legal_text,
            request.reading_level
        )
        
        return {
            "status": "success",
            "simplification": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# DOCUMENT GENERATION ENDPOINTS
# ============================================================================

@app.post("/api/v1/generate/document")
async def generate_document(request: DocumentGenerateRequest):
    """
    Generate legal documents from templates
    
    **Available Types:**
    - `bail_application`: Bail application under CrPC
    - `fir_complaint`: FIR/Complaint for police
    - `legal_notice`: Legal notice
    - `petition`: Court petition
    """
    try:
        generator = get_document_generator()
        
        if request.document_type == 'bail_application':
            result = generator.generate_bail_application(request.details)
        elif request.document_type == 'fir_complaint':
            result = generator.generate_fir(request.details)
        elif request.document_type == 'legal_notice':
            result = generator.generate_legal_notice(request.details)
        elif request.document_type == 'petition':
            result = generator.generate_petition(request.details)
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown document type: {request.document_type}"
            )
        
        return {
            "status": "success",
            "document": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/templates")
async def get_templates():
    """Get list of available document templates"""
    generator = get_document_generator()
    return {
        "templates": generator.get_template_list(),
        "total": len(generator.get_template_list())
    }


# ============================================================================
# SIMULATION ENDPOINTS
# ============================================================================

@app.post("/api/v1/simulate/outcome")
async def simulate_outcome(request: SimulationRequest):
    """
    What-If Simulation: See how case facts affect outcomes
    
    **Modifications Available:**
    - `remove_prior_conviction`: Remove criminal history
    - `add_strong_alibi`: Add alibi evidence
    - `improve_witness_credibility`: Enhance witness reliability
    - `add_mitigating_factors`: Add favorable circumstances
    - `reduce_flight_risk`: Show community ties
    - `enhance_evidence`: Strengthen evidence quality
    """
    try:
        engine = get_simulation_engine()
        result = engine.simulate_outcome(
            request.base_case,
            request.modifications
        )
        
        return {
            "status": "success",
            "simulation": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/simulate/sensitivity")
async def sensitivity_analysis(request: SensitivityRequest):
    """
    Sensitivity Analysis: Test impact of each factor independently
    
    Shows which factors have the most influence on case outcome
    """
    try:
        engine = get_simulation_engine()
        result = engine.sensitivity_analysis(request.case_facts)
        
        return {
            "status": "success",
            "sensitivity": result,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# DEMO ENDPOINT
# ============================================================================

@app.get("/api/v1/demo/complete")
async def complete_demo():
    """
    Complete feature demonstration
    
    Shows all capabilities in one response
    """
    
    # 1. Translation
    translation_service = get_translation_service()
    translation_demo = translation_service.translate_query(
        "मुझे जमानत चाहिए",
        "hi",
        "en"
    )
    
    # 2. Simplification
    simplification_demo = translation_service.simplify_legal_text(
        "The appellant filed a habeas corpus petition under Article 226.",
        "simple"
    )
    
    # 3. Document Generation
    doc_generator = get_document_generator()
    doc_demo = doc_generator.generate_bail_application({
        'applicant_name': 'Demo User',
        'state': 'Demo State',
        'first_time_offender': True
    })
    
    # 4. Simulation
    sim_engine = get_simulation_engine()
    sim_demo = sim_engine.simulate_outcome(
        {'facts': 'Accused has prior conviction. Witnesses unreliable.'},
        {'remove_prior_conviction': True, 'improve_witness_credibility': True}
    )
    
    return {
        "status": "success",
        "demo_features": {
            "1_translation": {
                "feature": "Multilingual Support",
                "input": "मुझे जमानत चाहिए (Hindi)",
                "output": translation_demo['translated_text'],
                "languages_supported": 9
            },
            "2_simplification": {
                "feature": "Plain Language Conversion",
                "original": "habeas corpus petition under Article 226",
                "simplified": simplification_demo['simplified_text'][:100] + "...",
                "reading_level": "Grade 8"
            },
            "3_document_generation": {
                "feature": "Legal Document Generator",
                "document_type": "Bail Application",
                "length": len(doc_demo['content']),
                "editable": doc_demo['editable'],
                "preview": doc_demo['content'][:300] + "..."
            },
            "4_simulation": {
                "feature": "What-If Simulation",
                "base_outcome": sim_demo['base_case']['prediction']['predictedOutcome'],
                "modified_outcome": sim_demo['modified_case']['prediction']['predictedOutcome'],
                "outcome_changed": sim_demo['impact_analysis']['outcome_changed'],
                "confidence_change": f"{sim_demo['impact_analysis']['confidence_change_percent']}%"
            }
        },
        "total_features_demonstrated": 4,
        "ai_models_used": [
            "InLegalBERT (Bias Detection)",
            "Google Translate (Multilingual)",
            "Template-based Document Generation",
            "Simulation Engine"
        ],
        "timestamp": datetime.now().isoformat()
    }


# ============================================================================
# STARTUP EVENT
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize all services on startup"""
    print("=" * 70)
    print("🚀 LEXAI UNIFIED ML API")
    print("=" * 70)
    print("✅ InLegalBERT Model: Loading...")
    get_model()
    print("✅ InLegalBERT Model: Ready")
    print("✅ Translation Service: Ready (9 languages)")
    print("✅ Document Generator: Ready (4 templates)")
    print("✅ Simplification: Ready")
    print("✅ Simulation Engine: Ready")
    print("=" * 70)
    print("📍 API Docs: http://localhost:8001/docs")
    print("🎯 Demo Endpoint: http://localhost:8001/api/v1/demo/complete")
    print("=" * 70)


# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )