from fastapi import FastAPI, Depends, HTTPException, status, Response, Cookie
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional, List
import uuid
import time
import os

from database import get_db, init_db
from models import User, Case, Document, Query, Prediction, BiasReport, OTPCode, QueryStatus, ConfidenceLevel
from schemas import (
    RequestOTP, VerifyOTP, UserResponse, CaseResponse, DocumentCreate, DocumentResponse,
    QueryCreate, QueryResponse, PredictionCreate, PredictionResponse
)
from auth import create_access_token, verify_token, generate_otp_code, send_otp_email

app = FastAPI(title="Verdicto API")

# CORS
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize DB on startup
@app.on_event("startup")
def startup_event():
    init_db()

# Auth dependency
def get_current_user(session_token: Optional[str] = Cookie(None), db: Session = Depends(get_db)) -> User:
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    payload = verify_token(session_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

# Auth endpoints
@app.post("/auth/request-otp")
def request_otp(data: RequestOTP, db: Session = Depends(get_db)):
    code = generate_otp_code()
    expires_at = int(time.time()) + 600  # 10 minutes
    
    otp = OTPCode(email=data.email, code=code, expires_at=expires_at)
    db.add(otp)
    db.commit()
    
    send_otp_email(data.email, code)
    
    return {"message": "OTP sent to email"}

@app.post("/auth/verify-otp")
def verify_otp(data: VerifyOTP, response: Response, db: Session = Depends(get_db)):
    otp = db.query(OTPCode).filter(
        OTPCode.email == data.email,
        OTPCode.code == data.code,
        OTPCode.used == 0,
        OTPCode.expires_at > int(time.time())
    ).first()
    
    if not otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    otp.used = 1
    db.commit()
    
    # Get or create user
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        user = User(
            id=str(uuid.uuid4()),
            email=data.email,
            email_verification_time=int(time.time() * 1000),
            is_anonymous=0
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # Create session token
    token = create_access_token({"sub": user.id})
    
    # Set HttpOnly cookie
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=60 * 60 * 24 * 7  # 7 days
    )
    
    return {"message": "Authenticated", "user": UserResponse.from_orm(user)}

@app.get("/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@app.post("/auth/signout")
def signout(response: Response):
    response.delete_cookie("session_token")
    return {"message": "Signed out"}

# Users
@app.get("/users/me", response_model=UserResponse)
def current_user_endpoint(current_user: User = Depends(get_current_user)):
    return current_user

# Cases
@app.get("/cases", response_model=List[CaseResponse])
def list_cases(category: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Case)
    if category:
        query = query.filter(Case.category == category)
    return query.all()

@app.get("/cases/search", response_model=List[CaseResponse])
def search_cases(search_term: str, db: Session = Depends(get_db)):
    return db.query(Case).filter(
        (Case.title.contains(search_term)) | (Case.description.contains(search_term))
    ).all()

@app.get("/cases/{case_id}", response_model=CaseResponse)
def get_case(case_id: str, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case

# Documents
@app.post("/documents", response_model=DocumentResponse)
def create_document(doc: DocumentCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    document = Document(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        title=doc.title,
        upload_date=int(time.time() * 1000),
        jurisdiction=doc.jurisdiction,
        file_id=doc.file_id,
        metadata=doc.metadata
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document

@app.get("/documents", response_model=List[DocumentResponse])
def list_documents(jurisdiction: Optional[str] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(Document).filter(Document.user_id == current_user.id)
    if jurisdiction:
        query = query.filter(Document.jurisdiction == jurisdiction)
    return query.all()

# Queries
@app.post("/queries", response_model=QueryResponse)
def create_query(query_data: QueryCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = Query(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        query_text=query_data.query_text,
        uploaded_files=query_data.uploaded_files,
        language=query_data.language,
        view_mode=query_data.view_mode,
        document_ids=query_data.document_ids,
        status=QueryStatus.PENDING
    )
    db.add(query)
    db.commit()
    db.refresh(query)
    return query

@app.get("/queries", response_model=List[QueryResponse])
def list_queries(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Query).filter(Query.user_id == current_user.id).all()

# Predictions
@app.post("/predictions", response_model=PredictionResponse)
def create_prediction(pred_data: PredictionCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Calculate confidence level
    if pred_data.confidence_score >= 0.8:
        level = ConfidenceLevel.HIGH
    elif pred_data.confidence_score >= 0.5:
        level = ConfidenceLevel.MEDIUM
    else:
        level = ConfidenceLevel.LOW
    
    prediction = Prediction(
        id=str(uuid.uuid4()),
        query_id=pred_data.query_id,
        user_id=current_user.id,
        prediction=pred_data.prediction,
        confidence_score=pred_data.confidence_score,
        confidence_level=level,
        reasoning=pred_data.reasoning,
        related_cases=[c for c in pred_data.related_cases],
        bias_flags=[flag.dict() for flag in pred_data.bias_flags],
        evidence_snippets=[snip.dict() for snip in pred_data.evidence_snippets]
    )
    db.add(prediction)
    
    # Update query status
    query = db.query(Query).filter(Query.id == pred_data.query_id).first()
    if query:
        query.status = QueryStatus.COMPLETED
    
    db.commit()
    db.refresh(prediction)
    return prediction

@app.get("/predictions/by-user", response_model=List[PredictionResponse])
def list_predictions_by_user(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Prediction).filter(Prediction.user_id == current_user.id).all()

@app.get("/predictions/by-query/{query_id}", response_model=Optional[PredictionResponse])
def get_prediction_by_query(query_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Prediction).filter(Prediction.query_id == query_id, Prediction.user_id == current_user.id).first()

# Seed data endpoint
@app.post("/seed")
def seed_data(db: Session = Depends(get_db)):
    # Create sample cases
    cases_data = [
        {
            "id": str(uuid.uuid4()),
            "case_number": "2023-CV-001",
            "title": "Smith v. Johnson",
            "description": "Contract dispute regarding breach of service agreement",
            "outcome": "Plaintiff awarded damages",
            "jurisdiction": "Federal",
            "year": 2023,
            "category": "Contract Law",
            "tags": ["contract", "breach", "damages"]
        },
        {
            "id": str(uuid.uuid4()),
            "case_number": "2022-CR-045",
            "title": "State v. Williams",
            "description": "Criminal case involving theft and fraud",
            "outcome": "Defendant convicted",
            "jurisdiction": "State",
            "year": 2022,
            "category": "Criminal Law",
            "tags": ["theft", "fraud", "criminal"]
        }
    ]
    
    for case_data in cases_data:
        if not db.query(Case).filter(Case.case_number == case_data["case_number"]).first():
            case = Case(**case_data)
            db.add(case)
    
    db.commit()
    return {"message": "Seed data created"}

@app.get("/")
def root():
    return {"message": "Verdicto API", "status": "running"}
