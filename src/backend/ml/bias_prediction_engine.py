"""
Bias Detection and Outcome Prediction Engine using InLegalBERT
================================================================

This module provides:
1. Document/Text bias detection (gender, region, caste, etc.)
2. RAG output bias detection (tone, interpretive bias)
3. Systemic/Statistical bias analysis
4. Legal outcome prediction with confidence scores

Model: InLegalBERT (Hugging Face pretrained for Indian legal cases)
"""

import torch
import numpy as np
from transformers import AutoTokenizer, AutoModelForSequenceClassification, AutoModel
from typing import Dict, List, Any, Optional, Union
import re
from collections import Counter
import json
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# ============================================================================
# MODEL INITIALIZATION
# ============================================================================

class InLegalBERTEngine:
    """
    Main engine for bias detection and outcome prediction using InLegalBERT
    """
    
    def __init__(self, model_name: str = "law-ai/InLegalBERT"):
        """
        Initialize the InLegalBERT model and tokenizer
        
        Args:
            model_name: HuggingFace model identifier (use your fine-tuned model path)
        """
        print(f"Loading InLegalBERT model: {model_name}")
        
        # Load tokenizer and base model for embeddings
        # TODO: Replace "law-ai/InLegalBERT" with your fine-tuned model path
        # Example: "your-username/inlegalbert-bias-finetuned"
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.base_model = AutoModel.from_pretrained(model_name)
        
        # Set device
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.base_model.to(self.device)
        self.base_model.eval()
        
        # Bias detection keywords (Indian legal context)
        self.bias_keywords = {
            'gender': [
                'woman', 'women', 'girl', 'female', 'lady', 'wife', 'mother',
                'man', 'men', 'boy', 'male', 'husband', 'father', 'manhood', 'womanhood'
            ],
            'caste': [
                'scheduled caste', 'sc', 'st', 'scheduled tribe', 'obc', 'backward class',
                'dalit', 'brahmin', 'upper caste', 'lower caste', 'caste', 'jati'
            ],
            'religion': [
                'hindu', 'muslim', 'christian', 'sikh', 'buddhist', 'jain',
                'religious', 'communal', 'minority', 'majority community'
            ],
            'region': [
                'north', 'south', 'east', 'west', 'rural', 'urban', 'tribal',
                'metropolitan', 'village', 'city', 'state', 'region'
            ],
            'socioeconomic': [
                'poor', 'rich', 'wealthy', 'poverty', 'income', 'economically',
                'below poverty line', 'bpl', 'weaker section', 'privileged'
            ],
            'age': [
                'minor', 'juvenile', 'child', 'elderly', 'senior citizen', 'youth',
                'old', 'young', 'aged'
            ]
        }
        
        print(f"Model loaded successfully on {self.device}")
    
    # ========================================================================
    # UTILITY FUNCTIONS
    # ========================================================================
    
    def get_embeddings(self, text: str) -> torch.Tensor:
        """
        Get BERT embeddings for input text
        
        Args:
            text: Input text string
            
        Returns:
            torch.Tensor: Embedding vector
        """
        # Tokenize
        inputs = self.tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            max_length=512,
            padding=True
        ).to(self.device)
        
        # Get embeddings
        with torch.no_grad():
            outputs = self.base_model(**inputs)
            # Use CLS token embedding (first token)
            embeddings = outputs.last_hidden_state[:, 0, :]
        
        return embeddings
    
    def compute_bias_score(self, text: str, bias_type: str) -> float:
        """
        Compute bias score for a specific bias type using keyword frequency
        and contextual analysis
        
        Args:
            text: Input text
            bias_type: Type of bias (gender, caste, etc.)
            
        Returns:
            float: Bias score between 0 and 1
        """
        text_lower = text.lower()
        keywords = self.bias_keywords.get(bias_type, [])
        
        # Count keyword occurrences
        keyword_count = sum(text_lower.count(keyword) for keyword in keywords)
        
        # Normalize by text length (words)
        word_count = len(text.split())
        if word_count == 0:
            return 0.0
        
        # Calculate frequency-based score
        frequency_score = min(keyword_count / word_count * 10, 1.0)
        
        # Get contextual score using embeddings (simplified)
        # In production, use a fine-tuned classifier
        contextual_score = frequency_score * 0.8  # Simplified
        
        return round(contextual_score, 3)
    
    # ========================================================================
    # 1. DOCUMENT/TEXT BIAS DETECTION
    # ========================================================================
    
    def detect_document_bias(self, text: str, threshold: float = 0.15) -> Dict[str, Any]:
        """
        Detect various biases in legal documents/FIRs/judgments
        
        Args:
            text: Legal document text
            threshold: Minimum score to flag a bias (default 0.15)
            
        Returns:
            Dict containing bias flags and detailed scores
        """
        # Get embeddings and run through fine-tuned model
        # NOTE: This assumes the fine-tuned model returns granular bias scores
        # If using the actual fine-tuned model, replace this with model inference
        
        bias_scores = {}
        bias_flags = []
        
        # Analyze each bias type using keyword-based approach
        # In production, this should use the fine-tuned model's predictions
        for bias_type in self.bias_keywords.keys():
            score = self.compute_bias_score(text, bias_type)
            bias_scores[bias_type] = score
            
            if score >= threshold:
                bias_flags.append(bias_type)
        
        # Add new bias categories from fine-tuned model
        # These should come from actual model inference in production
        bias_scores['judicial_attitude_bias'] = self.compute_bias_score(text, 'age') * 0.5  # Placeholder
        bias_scores['language_bias'] = self.compute_bias_score(text, 'region') * 0.3  # Placeholder
        
        # Calculate overall bias score
        overall_bias = round(np.mean(list(bias_scores.values())), 3)
        
        # Determine severity levels and create detailed bias info
        bias_details = []
        for bias_type, score in bias_scores.items():
            if score >= threshold:
                severity = "high" if score >= 0.4 else "medium" if score >= 0.25 else "low"
                bias_details.append({
                    "type": bias_type,
                    "severity": severity,
                    "score": score,
                    "description": f"{bias_type.replace('_', ' ').capitalize()} detected in the document"
                })
        
        return {
            "biasFlags_text": bias_flags,
            "bias_scores": bias_scores,
            "bias_details": bias_details,
            "overall_bias_score": overall_bias,
            "granular_scores": {
                "gender_bias": bias_scores.get('gender', 0),
                "caste_bias": bias_scores.get('caste', 0),
                "religious_bias": bias_scores.get('religion', 0),
                "regional_bias": bias_scores.get('region', 0),
                "socioeconomic_bias": bias_scores.get('socioeconomic', 0),
                "judicial_attitude_bias": bias_scores.get('judicial_attitude_bias', 0),
                "language_bias": bias_scores.get('language_bias', 0)
            },
            "analysis_timestamp": datetime.now().isoformat()
        }
    
    # ========================================================================
    # 2. RAG OUTPUT BIAS DETECTION
    # ========================================================================
    
    def detect_rag_output_bias(self, 
                               rag_summary: str, 
                               source_documents: List[str]) -> Dict[str, Any]:
        """
        Detect bias in AI-generated RAG summaries/reasoning
        
        Args:
            rag_summary: AI-generated summary or reasoning
            source_documents: Original source documents used for RAG
            
        Returns:
            Dict containing RAG-specific bias flags
        """
        bias_flags = []
        bias_details = []
        
        # Get embeddings
        summary_emb = self.get_embeddings(rag_summary)
        source_embs = [self.get_embeddings(doc) for doc in source_documents[:5]]  # Limit to 5
        
        # 1. TONE BIAS - Check if summary tone differs from sources
        if source_embs:
            avg_source_emb = torch.mean(torch.stack(source_embs), dim=0)
            # Cosine similarity
            similarity = torch.nn.functional.cosine_similarity(summary_emb, avg_source_emb)
            
            if similarity < 0.7:  # Low similarity indicates tone shift
                bias_flags.append("tone_bias")
                bias_details.append({
                    "type": "tone_bias",
                    "severity": "medium",
                    "score": round(1 - similarity.item(), 3),
                    "description": "AI summary tone differs significantly from source documents"
                })
        
        # 2. INTERPRETIVE BIAS - Check for subjective language
        subjective_words = [
            'clearly', 'obviously', 'undoubtedly', 'certainly', 'definitely',
            'surely', 'apparently', 'seemingly', 'arguably', 'presumably'
        ]
        summary_lower = rag_summary.lower()
        subjective_count = sum(summary_lower.count(word) for word in subjective_words)
        
        if subjective_count > 2:
            bias_flags.append("interpretive_bias")
            bias_details.append({
                "type": "interpretive_bias",
                "severity": "medium" if subjective_count > 4 else "low",
                "score": round(min(subjective_count / 10, 1.0), 3),
                "description": f"Summary contains {subjective_count} subjective/interpretive terms"
            })
        
        # 3. SELECTIVITY BIAS - Check if summary over-represents certain aspects
        # Count mentions of different legal aspects
        aspects = {
            'procedural': ['procedure', 'process', 'filing', 'hearing', 'appeal'],
            'substantive': ['law', 'statute', 'provision', 'section', 'act'],
            'factual': ['fact', 'evidence', 'witness', 'testimony', 'statement']
        }
        
        aspect_counts = {k: sum(summary_lower.count(w) for w in v) for k, v in aspects.items()}
        max_count = max(aspect_counts.values()) if aspect_counts.values() else 1
        
        if max_count > 5 and any(count < max_count * 0.3 for count in aspect_counts.values()):
            bias_flags.append("selectivity_bias")
            bias_details.append({
                "type": "selectivity_bias",
                "severity": "low",
                "score": 0.4,
                "description": "Summary may over-emphasize certain legal aspects"
            })
        
        return {
            "biasFlags_output": bias_flags,
            "bias_details": bias_details,
            "analysis_timestamp": datetime.now().isoformat()
        }
    
    # ========================================================================
    # 3. SYSTEMIC/STATISTICAL BIAS DETECTION
    # ========================================================================
    
    def detect_systemic_bias(self, 
                            historical_cases: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze systemic and statistical biases from historical case data
        
        Args:
            historical_cases: List of case dictionaries with keys:
                - outcome: str (e.g., "conviction", "acquittal")
                - gender: str (optional)
                - region: str (optional)
                - caste: str (optional)
                - case_type: str
                - year: int
                
        Returns:
            Dict containing systemic bias metrics and dashboard data
        """
        if not historical_cases:
            return {"error": "No historical cases provided"}
        
        # Initialize analytics
        outcome_by_gender = {}
        outcome_by_region = {}
        outcome_by_caste = {}
        outcome_by_year = {}
        
        # Process cases
        for case in historical_cases:
            outcome = case.get('outcome', 'unknown')
            
            # Gender analysis
            if 'gender' in case:
                gender = case['gender']
                if gender not in outcome_by_gender:
                    outcome_by_gender[gender] = []
                outcome_by_gender[gender].append(outcome)
            
            # Region analysis
            if 'region' in case:
                region = case['region']
                if region not in outcome_by_region:
                    outcome_by_region[region] = []
                outcome_by_region[region].append(outcome)
            
            # Caste analysis
            if 'caste' in case:
                caste = case['caste']
                if caste not in outcome_by_caste:
                    outcome_by_caste[caste] = []
                outcome_by_caste[caste].append(outcome)
            
            # Temporal analysis
            if 'year' in case:
                year = case['year']
                if year not in outcome_by_year:
                    outcome_by_year[year] = []
                outcome_by_year[year].append(outcome)
        
        # Calculate disparity metrics
        def calculate_disparity(outcome_dict: Dict) -> Dict:
            """Calculate outcome disparities"""
            disparity_data = {}
            for category, outcomes in outcome_dict.items():
                total = len(outcomes)
                if total > 0:
                    conviction_rate = outcomes.count('conviction') / total
                    disparity_data[category] = {
                        'total_cases': total,
                        'conviction_rate': round(conviction_rate, 3),
                        'acquittal_rate': round(outcomes.count('acquittal') / total, 3)
                    }
            return disparity_data
        
        gender_disparity = calculate_disparity(outcome_by_gender)
        region_disparity = calculate_disparity(outcome_by_region)
        caste_disparity = calculate_disparity(outcome_by_caste)
        
        # Detect significant disparities
        bias_flags = []
        
        if gender_disparity:
            rates = [d['conviction_rate'] for d in gender_disparity.values()]
            if max(rates) - min(rates) > 0.15:
                bias_flags.append("gender_disparity")
        
        if region_disparity:
            rates = [d['conviction_rate'] for d in region_disparity.values()]
            if max(rates) - min(rates) > 0.15:
                bias_flags.append("regional_disparity")
        
        if caste_disparity:
            rates = [d['conviction_rate'] for d in caste_disparity.values()]
            if max(rates) - min(rates) > 0.15:
                bias_flags.append("caste_disparity")
        
        # Generate dashboard-ready data
        dashboard_data = {
            "summary_metrics": {
                "total_cases_analyzed": len(historical_cases),
                "overall_conviction_rate": round(
                    sum(1 for c in historical_cases if c.get('outcome') == 'conviction') / len(historical_cases),
                    3
                ),
                "bias_flags_detected": len(bias_flags)
            },
            "gender_analysis": {
                "disparity_data": gender_disparity,
                "chart_data": [
                    {"category": k, "conviction_rate": v['conviction_rate']} 
                    for k, v in gender_disparity.items()
                ]
            },
            "regional_analysis": {
                "disparity_data": region_disparity,
                "chart_data": [
                    {"category": k, "conviction_rate": v['conviction_rate']} 
                    for k, v in region_disparity.items()
                ]
            },
            "caste_analysis": {
                "disparity_data": caste_disparity,
                "chart_data": [
                    {"category": k, "conviction_rate": v['conviction_rate']} 
                    for k, v in caste_disparity.items()
                ]
            },
            "temporal_trends": {
                "by_year": {
                    year: {
                        'total': len(outcomes),
                        'conviction_rate': round(outcomes.count('conviction') / len(outcomes), 3)
                    }
                    for year, outcomes in outcome_by_year.items()
                }
            }
        }
        
        return {
            "systemic_bias_flags": bias_flags,
            "biasDashboardData": dashboard_data,
            "analysis_timestamp": datetime.now().isoformat()
        }
    
    # ========================================================================
    # 4. OUTCOME PREDICTION
    # ========================================================================
    
    def predict_outcome(self, 
                       case_text: str,
                       case_metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Predict legal case outcome using InLegalBERT embeddings and heuristics
        
        Args:
            case_text: Full case text (FIR, facts, arguments, etc.)
            case_metadata: Optional metadata (case_type, jurisdiction, etc.)
            
        Returns:
            Dict containing prediction, confidence, and justification
        """
        # Get text embeddings
        embeddings = self.get_embeddings(case_text)
        
        # Keyword-based prediction (simplified - in production use fine-tuned classifier)
        conviction_keywords = [
            'guilty', 'convicted', 'evidence proves', 'beyond reasonable doubt',
            'establish', 'proven', 'corroborated', 'substantiated'
        ]
        acquittal_keywords = [
            'not guilty', 'acquitted', 'benefit of doubt', 'insufficient evidence',
            'failed to prove', 'contradictory', 'unreliable', 'doubt'
        ]
        
        text_lower = case_text.lower()
        conviction_score = sum(text_lower.count(kw) for kw in conviction_keywords)
        acquittal_score = sum(text_lower.count(kw) for kw in acquittal_keywords)
        
        # Calculate prediction
        total_score = conviction_score + acquittal_score
        if total_score == 0:
            # No strong indicators, use neutral prediction
            predicted_outcome = "uncertain"
            confidence_score = 0.5
            justification = "Insufficient textual indicators for confident prediction"
        else:
            conviction_prob = conviction_score / total_score
            
            if conviction_prob > 0.6:
                predicted_outcome = "conviction"
                confidence_score = round(conviction_prob, 3)
                justification = f"Text analysis shows {conviction_score} conviction indicators vs {acquittal_score} acquittal indicators"
            elif conviction_prob < 0.4:
                predicted_outcome = "acquittal"
                confidence_score = round(1 - conviction_prob, 3)
                justification = f"Text analysis shows {acquittal_score} acquittal indicators vs {conviction_score} conviction indicators"
            else:
                predicted_outcome = "uncertain"
                confidence_score = 0.5
                justification = "Mixed indicators suggest uncertain outcome"
        
        # Adjust for metadata if provided
        if case_metadata:
            case_type = case_metadata.get('case_type', '').lower()
            
            # Example adjustments (customize based on domain knowledge)
            if 'bail' in case_type:
                if predicted_outcome == "conviction":
                    predicted_outcome = "bail_denied"
                    justification += "; Bail application context considered"
                elif predicted_outcome == "acquittal":
                    predicted_outcome = "bail_granted"
                    justification += "; Bail application context considered"
        
        # Confidence level categorization
        if confidence_score >= 0.75:
            confidence_level = "high"
        elif confidence_score >= 0.5:
            confidence_level = "medium"
        else:
            confidence_level = "low"
        
        return {
            "predictedOutcome": predicted_outcome,
            "confidenceScore": confidence_score,
            "confidenceLevel": confidence_level,
            "justification": justification,
            "embedding_norm": float(torch.norm(embeddings).item()),
            "analysis_timestamp": datetime.now().isoformat()
        }

# ============================================================================
# API INTERFACE FUNCTIONS
# ============================================================================

# Global model instance (loaded once)
_model_instance = None

def get_model() -> InLegalBERTEngine:
    """Get or create model instance (singleton pattern)"""
    global _model_instance
    if _model_instance is None:
        _model_instance = InLegalBERTEngine()
    return _model_instance


def analyze_legal_case(
    case_text: str,
    rag_summary: Optional[str] = None,
    source_documents: Optional[List[str]] = None,
    historical_cases: Optional[List[Dict]] = None,
    case_metadata: Optional[Dict] = None
) -> Dict[str, Any]:
    """
    Main API function for comprehensive legal case analysis
    
    Args:
        case_text: Legal document/FIR/judgment text
        rag_summary: AI-generated summary (for RAG bias detection)
        source_documents: Source docs used for RAG (for RAG bias detection)
        historical_cases: Historical case data (for systemic bias analysis)
        case_metadata: Case metadata for outcome prediction
        
    Returns:
        JSON-serializable dict with all analysis results
    """
    model = get_model()
    
    results = {
        "status": "success",
        "analysis_id": f"analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
        "timestamp": datetime.now().isoformat()
    }
    
    # 1. Document bias detection
    if case_text:
        results["document_bias"] = model.detect_document_bias(case_text)
    
    # 2. RAG output bias detection
    if rag_summary and source_documents:
        results["rag_bias"] = model.detect_rag_output_bias(rag_summary, source_documents)
    
    # 3. Systemic bias analysis
    if historical_cases:
        results["systemic_bias"] = model.detect_systemic_bias(historical_cases)
    
    # 4. Outcome prediction
    if case_text:
        results["outcome_prediction"] = model.predict_outcome(case_text, case_metadata)
    
    return results


# ============================================================================
# EXAMPLE USAGE
# ============================================================================

if __name__ == "__main__":
    # Example legal case text
    sample_case = """
    The accused, a 35-year-old woman from rural Maharashtra, was charged under 
    Section 302 IPC for alleged murder. The prosecution's case relies heavily on 
    circumstantial evidence. The witness testimonies are contradictory, and the 
    forensic evidence is inconclusive. The accused belongs to a scheduled caste 
    community. The defense argues that there is insufficient evidence to establish 
    guilt beyond reasonable doubt.
    """
    
    # Example RAG summary
    sample_rag_summary = """
    Clearly, the evidence points toward acquittal. The case obviously lacks 
    substantial proof of guilt.
    """
    
    # Example historical cases
    sample_historical = [
        {"outcome": "conviction", "gender": "male", "region": "urban", "year": 2020},
        {"outcome": "acquittal", "gender": "female", "region": "rural", "year": 2020},
        {"outcome": "conviction", "gender": "male", "region": "urban", "year": 2021},
        {"outcome": "conviction", "gender": "female", "region": "urban", "year": 2021},
    ]
    
    # Run comprehensive analysis
    print("Running comprehensive legal analysis...\n")
    results = analyze_legal_case(
        case_text=sample_case,
        rag_summary=sample_rag_summary,
        source_documents=[sample_case],
        historical_cases=sample_historical,
        case_metadata={"case_type": "criminal", "jurisdiction": "Maharashtra"}
    )
    
    # Print results
    print(json.dumps(results, indent=2))