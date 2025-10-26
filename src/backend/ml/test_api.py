"""
Test Suite for InLegalBERT Analysis API
========================================

Run tests with: pytest test_api.py -v
"""

import pytest
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from api import app

client = TestClient(app)

# ============================================================================
# TEST DATA
# ============================================================================

SAMPLE_CASE_TEXT = """
The accused, a 35-year-old woman from a rural village in Uttar Pradesh, 
was charged under Section 302 IPC for alleged murder. The prosecution's case 
relies primarily on circumstantial evidence. The witness testimonies are 
contradictory, and forensic evidence is inconclusive. The accused belongs to 
a scheduled caste community. The defense argues insufficient evidence to 
establish guilt beyond reasonable doubt.
"""

SAMPLE_RAG_SUMMARY = """
Clearly, the evidence strongly indicates guilt. The case obviously shows 
signs of premeditation and intent.
"""

SAMPLE_HISTORICAL_CASES = [
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
        "caste": "obc",
        "year": 2023
    },
]

# ============================================================================
# TESTS
# ============================================================================

class TestHealthEndpoints:
    """Test basic API health and info endpoints"""
    
    def test_root_endpoint(self):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["service"] == "InLegalBERT Analysis API"
        assert data["status"] == "operational"
    
    def test_model_info(self):
        response = client.get("/api/v1/model/info")
        assert response.status_code == 200
        data = response.json()
        assert "model_name" in data
        assert "bias_types_supported" in data
        assert data["status"] == "loaded"


class TestDocumentBiasAnalysis:
    """Test document bias detection"""
    
    def test_basic_bias_detection(self):
        response = client.post(
            "/api/v1/analyze/document-bias",
            json={
                "case_text": SAMPLE_CASE_TEXT,
                "threshold": 0.15
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "results" in data
        assert "biasFlags_text" in data["results"]
        assert "bias_scores" in data["results"]
    
    def test_bias_threshold(self):
        # High threshold should detect fewer biases
        response_high = client.post(
            "/api/v1/analyze/document-bias",
            json={
                "case_text": SAMPLE_CASE_TEXT,
                "threshold": 0.5
            }
        )
        
        # Low threshold should detect more biases
        response_low = client.post(
            "/api/v1/analyze/document-bias",
            json={
                "case_text": SAMPLE_CASE_TEXT,
                "threshold": 0.1
            }
        )
        
        high_flags = len(response_high.json()["results"]["biasFlags_text"])
        low_flags = len(response_low.json()["results"]["biasFlags_text"])
        
        assert low_flags >= high_flags
    
    def test_empty_text_handling(self):
        response = client.post(
            "/api/v1/analyze/document-bias",
            json={
                "case_text": "",
                "threshold": 0.15
            }
        )
        # Should handle gracefully or return validation error
        assert response.status_code in [200, 422]


class TestRAGBiasAnalysis:
    """Test RAG output bias detection"""
    
    def test_rag_bias_detection(self):
        response = client.post(
            "/api/v1/analyze/rag-bias",
            json={
                "rag_summary": SAMPLE_RAG_SUMMARY,
                "source_documents": [SAMPLE_CASE_TEXT]
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "results" in data
        assert "biasFlags_output" in data["results"]
    
    def test_rag_interpretive_bias(self):
        # Summary with interpretive language should be flagged
        subjective_summary = "Clearly the defendant is obviously guilty without a doubt."
        response = client.post(
            "/api/v1/analyze/rag-bias",
            json={
                "rag_summary": subjective_summary,
                "source_documents": [SAMPLE_CASE_TEXT]
            }
        )
        data = response.json()
        bias_flags = data["results"]["biasFlags_output"]
        assert "interpretive_bias" in bias_flags


class TestSystemicBiasAnalysis:
    """Test systemic bias detection"""
    
    def test_systemic_bias_detection(self):
        response = client.post(
            "/api/v1/analyze/systemic-bias",
            json={
                "historical_cases": SAMPLE_HISTORICAL_CASES
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "results" in data
        assert "biasDashboardData" in data["results"]
    
    def test_dashboard_data_structure(self):
        response = client.post(
            "/api/v1/analyze/systemic-bias",
            json={
                "historical_cases": SAMPLE_HISTORICAL_CASES
            }
        )
        dashboard = response.json()["results"]["biasDashboardData"]
        
        assert "summary_metrics" in dashboard
        assert "gender_analysis" in dashboard
        assert "regional_analysis" in dashboard
        assert "chart_data" in dashboard["gender_analysis"]
    
    def test_empty_historical_cases(self):
        response = client.post(
            "/api/v1/analyze/systemic-bias",
            json={
                "historical_cases": []
            }
        )
        data = response.json()
        # Should handle gracefully
        assert "error" in data["results"] or response.status_code == 422


class TestOutcomePrediction:
    """Test legal outcome prediction"""
    
    def test_basic_prediction(self):
        response = client.post(
            "/api/v1/predict/outcome",
            json={
                "case_text": SAMPLE_CASE_TEXT,
                "case_metadata": {
                    "case_type": "criminal",
                    "jurisdiction": "Uttar Pradesh"
                }
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "results" in data
        assert "predictedOutcome" in data["results"]
        assert "confidenceScore" in data["results"]
    
    def test_confidence_score_range(self):
        response = client.post(
            "/api/v1/predict/outcome",
            json={
                "case_text": SAMPLE_CASE_TEXT
            }
        )
        confidence = response.json()["results"]["confidenceScore"]
        assert 0.0 <= confidence <= 1.0
    
    def test_confidence_level_categorization(self):
        response = client.post(
            "/api/v1/predict/outcome",
            json={
                "case_text": SAMPLE_CASE_TEXT
            }
        )
        level = response.json()["results"]["confidenceLevel"]
        assert level in ["low", "medium", "high"]
    
    def test_bail_case_prediction(self):
        bail_text = """
        Bail application for fraud case. Petitioner has no prior criminal record,
        deep community roots, and is willing to cooperate. No flight risk evident.
        """
        response = client.post(
            "/api/v1/predict/outcome",
            json={
                "case_text": bail_text,
                "case_metadata": {
                    "case_type": "bail_application"
                }
            }
        )
        outcome = response.json()["results"]["predictedOutcome"]
        # Should predict bail-related outcome
        assert "bail" in outcome.lower() or outcome == "uncertain"


class TestComprehensiveAnalysis:
    """Test comprehensive analysis endpoint"""
    
    def test_full_analysis(self):
        response = client.post(
            "/api/v1/analyze/comprehensive",
            json={
                "case_text": SAMPLE_CASE_TEXT,
                "rag_summary": SAMPLE_RAG_SUMMARY,
                "source_documents": [SAMPLE_CASE_TEXT],
                "historical_cases": SAMPLE_HISTORICAL_CASES,
                "case_metadata": {
                    "case_type": "criminal",
                    "jurisdiction": "Uttar Pradesh"
                }
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "success"
        assert "document_bias" in data
        assert "rag_bias" in data
        assert "systemic_bias" in data
        assert "outcome_prediction" in data
    
    def test_partial_analysis(self):
        # Test with only case_text (minimum requirement)
        response = client.post(
            "/api/v1/analyze/comprehensive",
            json={
                "case_text": SAMPLE_CASE_TEXT
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # Should have document bias and outcome prediction
        assert "document_bias" in data
        assert "outcome_prediction" in data
        # Should not have RAG or systemic bias (not provided)
        assert "rag_bias" not in data or data["rag_bias"] is None
        assert "systemic_bias" not in data or data["systemic_bias"] is None
    
    def test_analysis_id_generation(self):
        response = client.post(
            "/api/v1/analyze/comprehensive",
            json={
                "case_text": SAMPLE_CASE_TEXT
            }
        )
        data = response.json()
        assert "analysis_id" in data
        assert data["analysis_id"].startswith("analysis_")
    
    def test_timestamp_inclusion(self):
        response = client.post(
            "/api/v1/analyze/comprehensive",
            json={
                "case_text": SAMPLE_CASE_TEXT
            }
        )
        data = response.json()
        assert "timestamp" in data
        # Verify ISO format
        from datetime import datetime
        datetime.fromisoformat(data["timestamp"])  # Should not raise error


class TestErrorHandling:
    """Test error handling and edge cases"""
    
    def test_invalid_json(self):
        response = client.post(
            "/api/v1/analyze/comprehensive",
            data="invalid json",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 422
    
    def test_missing_required_field(self):
        response = client.post(
            "/api/v1/analyze/comprehensive",
            json={}
        )
        assert response.status_code == 422
    
    def test_invalid_threshold(self):
        response = client.post(
            "/api/v1/analyze/document-bias",
            json={
                "case_text": "Some text",
                "threshold": 2.0  # Invalid: should be 0-1
            }
        )
        assert response.status_code == 422
    
    def test_very_long_text(self):
        # Test with text longer than model's max length
        long_text = "This is a test. " * 1000
        response = client.post(
            "/api/v1/analyze/comprehensive",
            json={
                "case_text": long_text
            }
        )
        # Should handle gracefully (truncation)
        assert response.status_code == 200


# ============================================================================
# RUN TESTS
# ============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

