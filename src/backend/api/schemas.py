from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from models import Role, ViewMode, DocumentStatus, QueryStatus, ConfidenceLevel, Severity

class UserBase(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    image: Optional[str] = None
    role: Optional[Role] = None
    view_mode: Optional[ViewMode] = None
    preferred_language: Optional[str] = None

class UserResponse(UserBase):
    id: str
    is_anonymous: bool
    creation_time: int
    
    class Config:
        from_attributes = True

class RequestOTP(BaseModel):
    email: EmailStr

class VerifyOTP(BaseModel):
    email: EmailStr
    code: str

class CaseResponse(BaseModel):
    id: str
    case_number: str
    title: str
    description: str
    outcome: str
    jurisdiction: str
    year: int
    category: str
    tags: List[str]
    creation_time: int
    
    class Config:
        from_attributes = True

class DocumentCreate(BaseModel):
    title: str
    jurisdiction: str
    file_id: str
    metadata: Optional[Dict[str, Any]] = None

class DocumentResponse(BaseModel):
    id: str
    user_id: str
    title: str
    upload_date: int
    jurisdiction: str
    status: DocumentStatus
    file_id: str
    metadata: Optional[Dict[str, Any]] = None
    creation_time: int
    
    class Config:
        from_attributes = True

class QueryCreate(BaseModel):
    query_text: str
    uploaded_files: Optional[List[str]] = None
    language: Optional[str] = None
    view_mode: Optional[ViewMode] = None
    document_ids: Optional[List[str]] = None

class QueryResponse(BaseModel):
    id: str
    user_id: str
    query_text: str
    status: QueryStatus
    creation_time: int
    
    class Config:
        from_attributes = True

class BiasFlag(BaseModel):
    type: str
    severity: Severity
    description: str

class EvidenceSnippet(BaseModel):
    case_id: str
    snippet: str
    relevance: float

class PredictionCreate(BaseModel):
    query_id: str
    prediction: str
    confidence_score: float
    reasoning: str
    related_cases: List[str]
    bias_flags: List[BiasFlag]
    evidence_snippets: List[EvidenceSnippet]

class PredictionResponse(BaseModel):
    id: str
    query_id: str
    user_id: str
    prediction: str
    confidence_score: float
    confidence_level: ConfidenceLevel
    reasoning: str
    related_cases: List[str]
    bias_flags: List[Dict[str, Any]]
    evidence_snippets: List[Dict[str, Any]]
    creation_time: int
    
    class Config:
        from_attributes = True
