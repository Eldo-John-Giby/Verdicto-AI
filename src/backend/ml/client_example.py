"""
Example Client for InLegalBERT Analysis API
===========================================

This script demonstrates how to use the InLegalBERT API endpoints
for bias detection and outcome prediction.
"""

import requests
import json
from typing import Dict, Any, List

# API Configuration
API_BASE_URL = "http://localhost:8001"  # Update with your API URL

# ============================================================================
# API CLIENT FUNCTIONS
# ============================================================================

def comprehensive_analysis(
    case_text: str,
    rag_summary: str = None,
    source_documents: List[str] = None,
    historical_cases: List[Dict] = None,
    case_metadata: Dict = None
) -> Dict[str, Any]:
    """
    Perform comprehensive legal case analysis
    
    Args:
        case_text: Legal document text
        rag_summary: Optional AI-generated summary
        source_documents: Optional source documents for RAG
        historical_cases: Optional historical case data
        case_metadata: Optional case metadata
        
    Returns:
        Complete analysis results
    """
    url = f"{API_BASE_URL}/api/v1/analyze/comprehensive"
    
    payload = {
        "case_text": case_text,
        "rag_summary": rag_summary,
        "source_documents": source_documents,
        "historical_cases": historical_cases,
        "case_metadata": case_metadata
    }
    
    # Remove None values
    payload = {k: v for k, v in payload.items() if v is not None}
    
    response = requests.post(url, json=payload)
    response.raise_for_status()
    
    return response.json()


def analyze_document_bias(case_text: str, threshold: float = 0.15) -> Dict[str, Any]:
    """
    Analyze document for textual biases
    
    Args:
        case_text: Legal document text
        threshold: Bias detection threshold (0-1)
        
    Returns:
        Bias detection results
    """
    url = f"{API_BASE_URL}/api/v1/analyze/document-bias"
    
    payload = {
        "case_text": case_text,
        "threshold": threshold
    }
    
    response = requests.post(url, json=payload)
    response.raise_for_status()
    
    return response.json()


def analyze_rag_bias(rag_summary: str, source_documents: List[str]) -> Dict[str, Any]:
    """
    Analyze RAG output for biases
    
    Args:
        rag_summary: AI-generated summary
        source_documents: Source documents used
        
    Returns:
        RAG bias analysis results
    """
    url = f"{API_BASE_URL}/api/v1/analyze/rag-bias"
    
    payload = {
        "rag_summary": rag_summary,
        "source_documents": source_documents
    }
    
    response = requests.post(url, json=payload)
    response.raise_for_status()
    
    return response.json()


def analyze_systemic_bias(historical_cases: List[Dict]) -> Dict[str, Any]:
    """
    Analyze systemic biases in historical data
    
    Args:
        historical_cases: List of historical case dictionaries
        
    Returns:
        Systemic bias analysis with dashboard data
    """
    url = f"{API_BASE_URL}/api/v1/analyze/systemic-bias"
    
    payload = {
        "historical_cases": historical_cases
    }
    
    response = requests.post(url, json=payload)
    response.raise_for_status()
    
    return response.json()


def predict_outcome(case_text: str, case_metadata: Dict = None) -> Dict[str, Any]:
    """
    Predict case outcome
    
    Args:
        case_text: Legal case text
        case_metadata: Optional case metadata
        
    Returns:
        Outcome prediction with confidence
    """
    url = f"{API_BASE_URL}/api/v1/predict/outcome"
    
    payload = {
        "case_text": case_text,
        "case_metadata": case_metadata
    }
    
    # Remove None values
    payload = {k: v for k, v in payload.items() if v is not None}
    
    response = requests.post(url, json=payload)
    response.raise_for_status()
    
    return response.json()


def get_model_info() -> Dict[str, Any]:
    """Get model information"""
    url = f"{API_BASE_URL}/api/v1/model/info"
    response = requests.get(url)
    response.raise_for_status()
    return response.json()


# ============================================================================
# USAGE EXAMPLES
# ============================================================================

if __name__ == "__main__":
    print("InLegalBERT Analysis API - Client Examples")
    print("=" * 70)
    
    # Example 1: Comprehensive Analysis
    print("\n1. COMPREHENSIVE ANALYSIS")
    print("-" * 70)
    
    case_text = """
    The appellant, a 45-year-old woman from a rural area in Uttar Pradesh, was 
    convicted under Section 302 IPC for murder. The prosecution case rests on 
    circumstantial evidence and witness testimonies. The defense argues that the 
    evidence is insufficient to establish guilt beyond reasonable doubt. The 
    appellant belongs to a scheduled caste community and claims bias in the trial.
    """
    
    rag_summary = """
    Clearly, the case shows strong evidence of guilt. The conviction is obviously 
    justified based on the available evidence.
    """
    
    historical_cases = [
        {
            "outcome": "conviction",
            "gender": "male",
            "region": "urban",
            "caste": "general",
            "year": 2022
        },
        {
            "outcome": "acquittal",
            "gender": "female",
            "region": "rural",
            "caste": "sc",
            "year": 2022
        },
        {
            "outcome": "conviction",
            "gender": "male",
            "region": "urban",
            "caste": "general",
            "year": 2023
        },
        {
            "outcome": "conviction",
            "gender": "female",
            "region": "urban",
            "caste": "sc",
            "year": 2023
        }
    ]
    
    try:
        result = comprehensive_analysis(
            case_text=case_text,
            rag_summary=rag_summary,
            source_documents=[case_text],
            historical_cases=historical_cases,
            case_metadata={"case_type": "criminal", "jurisdiction": "Uttar Pradesh"}
        )
        
        print("✓ Analysis Complete!")
        print(f"Analysis ID: {result.get('analysis_id')}")
        
        # Document Bias
        if 'document_bias' in result:
            doc_bias = result['document_bias']
            print(f"\nDocument Bias Flags: {doc_bias.get('biasFlags_text', [])}")
            print(f"Overall Bias Score: {doc_bias.get('overall_bias_score')}")
        
        # RAG Bias
        if 'rag_bias' in result:
            rag_bias = result['rag_bias']
            print(f"\nRAG Bias Flags: {rag_bias.get('biasFlags_output', [])}")
        
        # Systemic Bias
        if 'systemic_bias' in result:
            sys_bias = result['systemic_bias']
            print(f"\nSystemic Bias Flags: {sys_bias.get('systemic_bias_flags', [])}")
        
        # Outcome Prediction
        if 'outcome_prediction' in result:
            prediction = result['outcome_prediction']
            print(f"\nPredicted Outcome: {prediction.get('predictedOutcome')}")
            print(f"Confidence: {prediction.get('confidenceScore')} ({prediction.get('confidenceLevel')})")
            print(f"Justification: {prediction.get('justification')}")
        
    except requests.exceptions.RequestException as e:
        print(f"✗ Error: {e}")
    
    
    # Example 2: Document Bias Only
    print("\n\n2. DOCUMENT BIAS ANALYSIS ONLY")
    print("-" * 70)
    
    try:
        result = analyze_document_bias(case_text, threshold=0.15)
        print(json.dumps(result, indent=2))
    except requests.exceptions.RequestException as e:
        print(f"✗ Error: {e}")
    
    
    # Example 3: Outcome Prediction Only
    print("\n\n3. OUTCOME PREDICTION ONLY")
    print("-" * 70)
    
    bail_case = """
    The petitioner seeks bail in a case under Section 420 IPC. The petitioner has 
    no prior criminal record and has deep roots in the community. The evidence 
    against the petitioner is primarily documentary. There is no flight risk, and 
    the petitioner is willing to cooperate with the investigation.
    """
    
    try:
        result = predict_outcome(
            case_text=bail_case,
            case_metadata={"case_type": "bail_application", "jurisdiction": "Delhi"}
        )
        print(json.dumps(result, indent=2))
    except requests.exceptions.RequestException as e:
        print(f"✗ Error: {e}")
    
    
    # Example 4: Model Info
    print("\n\n4. MODEL INFORMATION")
    print("-" * 70)
    
    try:
        info = get_model_info()
        print(json.dumps(info, indent=2))
    except requests.exceptions.RequestException as e:
        print(f"✗ Error: {e}")
    
    print("\n" + "=" * 70)
    print("Examples Complete!")

