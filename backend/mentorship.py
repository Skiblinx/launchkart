from fastapi import APIRouter, HTTPException, Depends, Form
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
from pydantic import BaseModel, Field
from .server import db, get_current_user, get_user_by_role, UserRole

router = APIRouter(prefix="/api/mentorship", tags=["mentorship"])

class EnhancedMentor(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    expertise: List[str]
    experience_years: int
    hourly_rate: float
    bio: str
    languages: List[str] = []
    company: Optional[str] = None
    achievements: List[str] = []
    calendar_integration: Optional[str] = None
    meeting_preferences: Dict[str, Any] = {}
    availability: Dict[str, List[str]] = {}
    rating: float = 0.0
    total_sessions: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class EnhancedMentorshipSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    mentor_id: str
    mentee_id: str
    scheduled_at: datetime
    duration: int
    agenda: Optional[str] = None
    meeting_type: str = "video"
    cost: Optional[float] = None
    status: str = "scheduled"
    payment_status: str = "pending"
    feedback_mentor: Optional[str] = None
    feedback_mentee: Optional[str] = None
    rating_mentor: Optional[int] = None
    rating_mentee: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Add routes for mentor profile, availability, booking, session status, etc.
# (Implementation would follow the enhanced route logic you provided) 