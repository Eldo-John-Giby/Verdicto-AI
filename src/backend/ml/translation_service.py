"""
Multilingual Translation Service for LexAI
==========================================

Quick MVP implementation for hackathon demo
Supports translation between English and Indian regional languages
"""

from typing import Dict, Any, Optional
from googletrans import Translator
import re

class MultilingualService:
    """
    Translate legal content between English and regional languages
    """
    
    # Language codes
    LANGUAGES = {
        'en': 'English',
        'hi': 'Hindi',
        'ta': 'Tamil',
        'te': 'Telugu',
        'bn': 'Bengali',
        'mr': 'Marathi',
        'gu': 'Gujarati',
        'kn': 'Kannada',
        'ml': 'Malayalam',
    }
    
    def __init__(self):
        self.translator = Translator()
        
    def detect_language(self, text: str) -> str:
        """Auto-detect language of input text"""
        try:
            detected = self.translator.detect(text)
            return detected.lang
        except:
            return 'en'
    
    def translate_query(self, text: str, source_lang: str = 'auto', target_lang: str = 'en') -> Dict[str, Any]:
        """
        Translate user query to English for processing
        
        Args:
            text: User query in regional language
            source_lang: Source language code (auto-detect if 'auto')
            target_lang: Target language (default: English)
            
        Returns:
            Dict with translated text and metadata
        """
        try:
            # Auto-detect if needed
            if source_lang == 'auto':
                source_lang = self.detect_language(text)
            
            # Translate
            result = self.translator.translate(text, src=source_lang, dest=target_lang)
            
            return {
                "original_text": text,
                "translated_text": result.text,
                "source_language": source_lang,
                "source_language_name": self.LANGUAGES.get(source_lang, "Unknown"),
                "target_language": target_lang,
                "confidence": 0.95  # Mock confidence for demo
            }
        except Exception as e:
            return {
                "error": str(e),
                "original_text": text,
                "translated_text": text,  # Fallback to original
                "source_language": source_lang,
                "target_language": target_lang
            }
    
    def translate_response(self, text: str, target_lang: str = 'hi') -> Dict[str, Any]:
        """
        Translate AI response to user's preferred language
        
        Args:
            text: AI response in English
            target_lang: User's preferred language
            
        Returns:
            Dict with translated response
        """
        try:
            result = self.translator.translate(text, src='en', dest=target_lang)
            
            return {
                "original_text": text,
                "translated_text": result.text,
                "target_language": target_lang,
                "target_language_name": self.LANGUAGES.get(target_lang, "Unknown"),
            }
        except Exception as e:
            return {
                "error": str(e),
                "original_text": text,
                "translated_text": text,
                "target_language": target_lang
            }
    
    def translate_legal_document(self, text: str, target_lang: str) -> str:
        """Translate legal document preserving structure"""
        try:
            result = self.translator.translate(text, src='en', dest=target_lang)
            return result.text
        except:
            return text
    
    def get_supported_languages(self) -> Dict[str, str]:
        """Return list of supported languages"""
        return self.LANGUAGES
    
    def simplify_legal_text(self, legal_text: str, reading_level: str = 'simple') -> Dict[str, Any]:
        """
        Convert complex legal language to plain language
        
        Args:
            legal_text: Complex legal text
            reading_level: 'simple' or 'intermediate'
            
        Returns:
            Simplified text with explanations
        """
        
        # Legal term mappings (MVP - can be expanded)
        legal_simplifications = {
            r'\binter alia\b': 'among other things',
            r'\bres ipsa loquitur\b': 'the thing speaks for itself',
            r'\bper se\b': 'by itself',
            r'\bpro bono\b': 'for free',
            r'\bhabeas corpus\b': 'produce the person (bring before court)',
            r'\bbail\b': 'temporary release from custody',
            r'\bFIR\b': 'First Information Report (initial police complaint)',
            r'\bIPC\b': 'Indian Penal Code (criminal law)',
            r'\bCrPC\b': 'Criminal Procedure Code (how criminal cases work)',
            r'\bappellant\b': 'person appealing the decision',
            r'\brespondent\b': 'person responding to appeal',
            r'\bpetitioner\b': 'person filing the case',
            r'\bdefendant\b': 'person accused/sued',
            r'\bplaintiff\b': 'person filing complaint',
            r'\bbeyond reasonable doubt\b': 'very certain, no significant doubts',
            r'\bprecedent\b': 'previous similar case decision',
            r'\bjurisdiction\b': 'legal authority/area of court',
            r'\bconviction\b': 'found guilty',
            r'\bacquittal\b': 'found not guilty',
        }
        
        simplified = legal_text
        
        # Apply simplifications
        for pattern, replacement in legal_simplifications.items():
            simplified = re.sub(pattern, replacement, simplified, flags=re.IGNORECASE)
        
        # Extract key points (simple sentence extraction)
        sentences = simplified.split('.')
        key_points = [s.strip() + '.' for s in sentences if len(s.strip()) > 20][:5]
        
        return {
            "original_text": legal_text,
            "simplified_text": simplified,
            "reading_level": reading_level,
            "key_points": key_points,
            "legal_terms_explained": list(legal_simplifications.values())[:10],
            "summary": f"This text explains legal matters in simpler terms. {len(key_points)} key points identified."
        }


# Global instance
_translation_service = None

def get_translation_service() -> MultilingualService:
    """Get or create translation service instance"""
    global _translation_service
    if _translation_service is None:
        _translation_service = MultilingualService()
    return _translation_service


# Quick test
if __name__ == "__main__":
    service = MultilingualService()
    
    # Test translation
    print("Testing translation...")
    result = service.translate_query("मुझे जमानत कैसे मिलेगी?", source_lang='hi', target_lang='en')
    print(f"Hindi → English: {result['translated_text']}")
    
    # Test simplification
    print("\nTesting simplification...")
    legal_text = "The appellant filed a habeas corpus petition seeking bail under Section 302 IPC. The FIR was lodged inter alia alleging murder beyond reasonable doubt."
    simplified = service.simplify_legal_text(legal_text)
    print(f"Original: {legal_text}")
    print(f"Simplified: {simplified['simplified_text']}")
    print(f"Key points: {simplified['key_points']}")

