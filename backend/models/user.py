from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
import uuid

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    fullName: str
    email: str
    phoneNumber: str
    country: str
    businessStage: Optional[str] = None
    referralCode: Optional[str] = None
    role: str = "founder"
    picture: Optional[str] = None
    session_token: Optional[str] = None
    password_hash: Optional[str] = None
    kyc_level: str = "none"
    kyc_status: str = "pending"
    kyc_verified_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserProfile(BaseModel):
    bio: Optional[str] = None
    website: Optional[str] = None
    linkedin: Optional[str] = None
    twitter: Optional[str] = None
    skills: List[str] = []
    interests: List[str] = []
    achievements: List[str] = [] 