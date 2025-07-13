from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

class EnhancedServiceRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    service_type: str
    title: str
    description: str
    budget: float
    status: str = "pending"
    assigned_to: Optional[str] = None
    deliverables: List[str] = []
    files: List[Dict[str, Any]] = []  # file info dicts
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    timeline: Optional[str] = None
    additional_notes: Optional[str] = None
    requirements: List[str] = []
    quote_amount: Optional[float] = None
    estimated_completion: Optional[datetime] = None
    progress_updates: List[Dict[str, Any]] = []
    client_feedback: Optional[str] = None
    service_rating: Optional[int] = None 