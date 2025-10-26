from sqlalchemy import Column, String, Integer, Float, JSON, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
from database import Base
import enum
import time

class Role(str, enum.Enum):
    ADMIN = "admin"
    USER = "user"
    MEMBER = "member"

class ViewMode(str, enum.Enum):
    CITIZEN = "citizen"
    LAWYER = "lawyer"

class DocumentStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    PROCESSED = "processed"
    FAILED = "failed"

class QueryStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class ConfidenceLevel(str, enum.Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class Severity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=True)
    image = Column(String, nullable=True)
    email_verification_time = Column(Integer, nullable=True)
    is_anonymous = Column(Integer, default=0)
    role = Column(SQLEnum(Role), default=Role.USER)
    view_mode = Column(SQLEnum(ViewMode), nullable=True)
    preferred_language = Column(String, nullable=True)
    creation_time = Column(Integer, default=lambda: int(time.time() * 1000))

class Case(Base):
    __tablename__ = "cases"
    
    id = Column(String, primary_key=True)
    case_number = Column(String, unique=True)
    title = Column(String)
    description = Column(Text)
    outcome = Column(String)
    jurisdiction = Column(String, index=True)
    year = Column(Integer)
    category = Column(String, index=True)
    tags = Column(JSON)
    creation_time = Column(Integer, default=lambda: int(time.time() * 1000))

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), index=True)
    title = Column(String)
    upload_date = Column(Integer)
    jurisdiction = Column(String, index=True)
    status = Column(SQLEnum(DocumentStatus), default=DocumentStatus.PENDING, index=True)
    file_id = Column(String)
    # Rename ORM attribute to avoid SQLAlchemy reserved name conflict, keep DB column name as "metadata"
    meta = Column("metadata", JSON, nullable=True)
    chunks = Column(JSON, nullable=True)
    creation_time = Column(Integer, default=lambda: int(time.time() * 1000))

    # Provide backward-compatible property so code and Pydantic can access `metadata`
    @property
    def metadata(self):
        return self.meta

    @metadata.setter
    def metadata(self, value):
        self.meta = value

class Query(Base):
    __tablename__ = "queries"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), index=True)
    query_text = Column(Text)
    uploaded_files = Column(JSON, nullable=True)
    status = Column(SQLEnum(QueryStatus), default=QueryStatus.PENDING)
    language = Column(String, nullable=True)
    view_mode = Column(SQLEnum(ViewMode), nullable=True)
    document_ids = Column(JSON, nullable=True)
    creation_time = Column(Integer, default=lambda: int(time.time() * 1000))

class Prediction(Base):
    __tablename__ = "predictions"
    
    id = Column(String, primary_key=True)
    query_id = Column(String, ForeignKey("queries.id"), index=True)
    user_id = Column(String, ForeignKey("users.id"), index=True)
    prediction = Column(Text)
    confidence_score = Column(Float)
    confidence_level = Column(SQLEnum(ConfidenceLevel))
    reasoning = Column(Text)
    related_cases = Column(JSON)
    bias_flags = Column(JSON)
    evidence_snippets = Column(JSON)
    source_references = Column(JSON, nullable=True)
    disclaimers = Column(JSON, nullable=True)
    creation_time = Column(Integer, default=lambda: int(time.time() * 1000))

class BiasReport(Base):
    __tablename__ = "bias_reports"
    
    id = Column(String, primary_key=True)
    prediction_id = Column(String, ForeignKey("predictions.id"), index=True)
    user_id = Column(String, ForeignKey("users.id"), index=True)
    overall_score = Column(Float)
    categories = Column(JSON)
    recommendations = Column(JSON)
    creation_time = Column(Integer, default=lambda: int(time.time() * 1000))

class OTPCode(Base):
    __tablename__ = "otp_codes"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String, index=True)
    code = Column(String)
    expires_at = Column(Integer)
    used = Column(Integer, default=0)