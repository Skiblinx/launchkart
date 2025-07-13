from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

class EnhancedPitchSubmission(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    company_name: str
    industry: str
    funding_amount: float
    equity_offering: float
    stage: Optional[str] = None
    problem: Optional[str] = None
    solution: Optional[str] = None
    traction: Optional[str] = None
    market_size: Optional[str] = None
    business_model: Optional[str] = None
    use_of_funds: Optional[str] = None
    competitive_advantage: Optional[str] = None
    team_info: Dict[str, Any] = {}
    business_metrics: Dict[str, Any] = {}
    files: Dict[str, str] = {}
    reviewed_at: Optional[datetime] = None
    due_diligence_status: str = "pending"
    investor_interest: List[str] = []
    review_status: str = "under_review"
    created_at: datetime = Field(default_factory=datetime.utcnow) 