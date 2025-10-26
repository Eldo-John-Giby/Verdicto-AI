"""
What-If Simulation Engine for LexAI
===================================

Hackathon MVP - Interactive case outcome simulation
Shows how changes in case facts affect predictions
"""

from typing import Dict, Any, List, Optional
import re
from bias_prediction_engine import get_model

class SimulationEngine:
    """
    Simulate legal case outcomes with modified facts
    """
    
    def __init__(self):
        self.ml_model = get_model()
        
        # Modifiable factors and their impacts
        self.factor_impacts = {
            'prior_conviction': {
                'weight': 0.25,
                'direction': 'negative',
                'description': 'Previous criminal record'
            },
            'witness_credibility': {
                'weight': 0.20,
                'direction': 'positive',
                'description': 'Reliability of witnesses'
            },
            'evidence_quality': {
                'weight': 0.30,
                'direction': 'positive',
                'description': 'Strength of evidence'
            },
            'mitigating_factors': {
                'weight': 0.15,
                'direction': 'positive',
                'description': 'Circumstances favoring accused'
            },
            'flight_risk': {
                'weight': 0.10,
                'direction': 'negative',
                'description': 'Risk of absconding'
            }
        }
    
    def simulate_outcome(self, 
                        base_case: Dict[str, Any], 
                        modifications: Dict[str, Any]) -> Dict[str, Any]:
        """
        Simulate how case outcome changes with modifications
        
        Args:
            base_case: Original case facts
            modifications: Changes to apply
            
        Returns:
            Comparison of outcomes
        """
        
        # Get base prediction
        base_text = base_case.get('facts', '')
        base_prediction = self.ml_model.predict_outcome(
            base_text,
            base_case.get('metadata', {})
        )
        
        # Apply modifications
        modified_text = self._apply_modifications(base_text, modifications)
        modified_prediction = self.ml_model.predict_outcome(
            modified_text,
            base_case.get('metadata', {})
        )
        
        # Calculate impact
        impact_analysis = self._analyze_impact(
            base_prediction,
            modified_prediction,
            modifications
        )
        
        return {
            'base_case': {
                'facts': base_text,
                'prediction': base_prediction
            },
            'modified_case': {
                'facts': modified_text,
                'prediction': modified_prediction,
                'changes_applied': list(modifications.keys())
            },
            'impact_analysis': impact_analysis,
            'visualization_data': self._generate_viz_data(
                base_prediction,
                modified_prediction
            )
        }
    
    def _apply_modifications(self, base_text: str, modifications: Dict[str, Any]) -> str:
        """Apply modifications to case facts"""
        modified = base_text
        
        # Remove prior conviction if specified
        if modifications.get('remove_prior_conviction'):
            modified = re.sub(
                r'(prior conviction|criminal record|previous offense).*?\.', 
                'has no prior criminal record.', 
                modified, 
                flags=re.IGNORECASE
            )
        
        # Add strong alibi
        if modifications.get('add_strong_alibi'):
            modified += " The accused has a strong alibi with multiple credible witnesses confirming their presence elsewhere during the incident."
        
        # Improve witness credibility
        if modifications.get('improve_witness_credibility'):
            modified = re.sub(
                r'(witness.*?)(contradictory|unreliable|questionable)',
                r'\1credible and consistent',
                modified,
                flags=re.IGNORECASE
            )
        
        # Add mitigating factors
        if modifications.get('add_mitigating_factors'):
            mitigating = modifications['add_mitigating_factors']
            modified += f" {mitigating}"
        
        # Reduce flight risk
        if modifications.get('reduce_flight_risk'):
            modified += " The accused has deep roots in the community, stable employment, and family responsibilities, eliminating any flight risk."
        
        # Enhance evidence quality
        if modifications.get('enhance_evidence'):
            modified = re.sub(
                r'(evidence.*?)(weak|insufficient|circumstantial)',
                r'\1strong and conclusive',
                modified,
                flags=re.IGNORECASE
            )
        
        return modified
    
    def _analyze_impact(self, 
                       base_pred: Dict, 
                       modified_pred: Dict,
                       modifications: Dict) -> Dict[str, Any]:
        """Analyze impact of modifications"""
        
        confidence_change = modified_pred['confidenceScore'] - base_pred['confidenceScore']
        outcome_changed = base_pred['predictedOutcome'] != modified_pred['predictedOutcome']
        
        # Calculate factor contributions
        factor_impacts = []
        for mod_key, mod_value in modifications.items():
            if mod_value:  # If modification was applied
                factor_name = mod_key.replace('_', ' ').title()
                estimated_impact = self._estimate_factor_impact(mod_key)
                factor_impacts.append({
                    'factor': factor_name,
                    'estimated_impact': estimated_impact,
                    'direction': 'positive' if estimated_impact > 0 else 'negative'
                })
        
        return {
            'outcome_changed': outcome_changed,
            'confidence_change': round(confidence_change, 3),
            'confidence_change_percent': round(confidence_change * 100, 1),
            'factor_contributions': factor_impacts,
            'key_factors': self._identify_key_factors(modifications),
            'recommendation': self._generate_recommendation(
                base_pred,
                modified_pred,
                outcome_changed
            )
        }
    
    def _estimate_factor_impact(self, factor_key: str) -> float:
        """Estimate impact of a specific factor"""
        impact_map = {
            'remove_prior_conviction': 0.25,
            'add_strong_alibi': 0.30,
            'improve_witness_credibility': 0.20,
            'add_mitigating_factors': 0.15,
            'reduce_flight_risk': 0.10,
            'enhance_evidence': 0.35,
        }
        return impact_map.get(factor_key, 0.10)
    
    def _identify_key_factors(self, modifications: Dict) -> List[str]:
        """Identify most impactful factors"""
        applied_mods = [k for k, v in modifications.items() if v]
        impacts = [(mod, self._estimate_factor_impact(mod)) for mod in applied_mods]
        impacts.sort(key=lambda x: x[1], reverse=True)
        return [mod.replace('_', ' ').title() for mod, _ in impacts[:3]]
    
    def _generate_recommendation(self, 
                                 base_pred: Dict,
                                 modified_pred: Dict,
                                 outcome_changed: bool) -> str:
        """Generate recommendation based on simulation"""
        if outcome_changed:
            return f"Modifying the specified factors could change the outcome from {base_pred['predictedOutcome']} to {modified_pred['predictedOutcome']}. These factors should be given priority in case preparation."
        else:
            conf_diff = abs(modified_pred['confidenceScore'] - base_pred['confidenceScore'])
            if conf_diff > 0.15:
                return f"While the outcome remains {base_pred['predictedOutcome']}, the confidence has changed by {round(conf_diff * 100, 1)}%. These factors significantly influence case strength."
            else:
                return "The modifications have minimal impact on the outcome. Other factors may be more critical to case success."
    
    def _generate_viz_data(self, base_pred: Dict, modified_pred: Dict) -> Dict:
        """Generate data for visualization"""
        return {
            'confidence_comparison': {
                'base': round(base_pred['confidenceScore'] * 100, 1),
                'modified': round(modified_pred['confidenceScore'] * 100, 1),
                'change': round((modified_pred['confidenceScore'] - base_pred['confidenceScore']) * 100, 1)
            },
            'outcome_labels': {
                'base': base_pred['predictedOutcome'],
                'modified': modified_pred['predictedOutcome']
            },
            'chart_type': 'bar_comparison',
            'color_scheme': {
                'base': '#6366f1',  # Indigo
                'modified': '#10b981'  # Green
            }
        }
    
    def sensitivity_analysis(self, case_facts: str) -> Dict[str, Any]:
        """
        Analyze sensitivity to different factors
        
        Tests each factor independently to see impact
        """
        base_prediction = self.ml_model.predict_outcome(case_facts, {})
        
        sensitivity_results = []
        
        # Test each modification independently
        test_modifications = [
            {'remove_prior_conviction': True},
            {'add_strong_alibi': True},
            {'improve_witness_credibility': True},
            {'add_mitigating_factors': 'First-time offender with family responsibilities'},
            {'reduce_flight_risk': True},
        ]
        
        for mod in test_modifications:
            result = self.simulate_outcome(
                {'facts': case_facts},
                mod
            )
            
            mod_name = list(mod.keys())[0].replace('_', ' ').title()
            sensitivity_results.append({
                'factor': mod_name,
                'confidence_impact': result['impact_analysis']['confidence_change'],
                'outcome_change': result['impact_analysis']['outcome_changed'],
                'new_outcome': result['modified_case']['prediction']['predictedOutcome']
            })
        
        # Sort by impact
        sensitivity_results.sort(
            key=lambda x: abs(x['confidence_impact']),
            reverse=True
        )
        
        return {
            'base_outcome': base_prediction['predictedOutcome'],
            'base_confidence': base_prediction['confidenceScore'],
            'sensitivity_analysis': sensitivity_results,
            'most_influential_factor': sensitivity_results[0]['factor'] if sensitivity_results else None,
            'visualization_ready': True
        }


# Global instance
_simulation_engine = None

def get_simulation_engine() -> SimulationEngine:
    """Get or create simulation engine instance"""
    global _simulation_engine
    if _simulation_engine is None:
        _simulation_engine = SimulationEngine()
    return _simulation_engine


# Test
if __name__ == "__main__":
    engine = SimulationEngine()
    
    # Test case
    base_case = {
        'facts': """
        The accused has prior conviction for theft. Witnesses gave contradictory statements.
        Evidence is largely circumstantial. The accused attempted to flee when arrested.
        """,
        'metadata': {'case_type': 'criminal'}
    }
    
    # Test modifications
    modifications = {
        'remove_prior_conviction': True,
        'add_strong_alibi': True,
        'improve_witness_credibility': True,
    }
    
    print("Running simulation...")
    result = engine.simulate_outcome(base_case, modifications)
    
    print(f"\nBase Outcome: {result['base_case']['prediction']['predictedOutcome']}")
    print(f"Base Confidence: {result['base_case']['prediction']['confidenceScore']}")
    
    print(f"\nModified Outcome: {result['modified_case']['prediction']['predictedOutcome']}")
    print(f"Modified Confidence: {result['modified_case']['prediction']['confidenceScore']}")
    
    print(f"\nOutcome Changed: {result['impact_analysis']['outcome_changed']}")
    print(f"Confidence Change: {result['impact_analysis']['confidence_change_percent']}%")
    print(f"Key Factors: {', '.join(result['impact_analysis']['key_factors'])}")
    print(f"\nRecommendation: {result['impact_analysis']['recommendation']}")

