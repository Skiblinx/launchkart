from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

class ServicePricing(BaseModel):
    base_price: float
    currency: str = "INR"
    pricing_type: str = "fixed"  # fixed, range, custom
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    price_factors: List[Dict[str, Any]] = []  # factors affecting price
    includes_gst: bool = True
    gst_rate: float = 18.0
    
class ServiceTemplate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    category: str
    description: str
    features: List[str] = []
    requirements: List[str] = []
    duration: str
    pricing: ServicePricing
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class PaymentRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    service_request_id: str
    user_id: str
    amount: float
    currency: str = "INR"
    gateway: str  # razorpay, stripe
    gateway_order_id: Optional[str] = None
    gateway_payment_id: Optional[str] = None
    status: str = "pending"  # pending, processing, completed, failed, refunded
    payment_method: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = {}

class EnhancedServiceRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    service_type: str
    title: str
    description: str
    budget: float
    status: str = "pending"  # pending, quoted, payment_pending, paid, in_progress, completed, cancelled
    assigned_to: Optional[str] = None
    deliverables: List[str] = []
    files: List[Dict[str, Any]] = []  # file info dicts
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    timeline: Optional[str] = None
    additional_notes: Optional[str] = None
    requirements: List[str] = []
    quote_amount: Optional[float] = None
    quoted_at: Optional[datetime] = None
    estimated_completion: Optional[datetime] = None
    progress_updates: List[Dict[str, Any]] = []
    client_feedback: Optional[str] = None
    service_rating: Optional[int] = None
    payment_record_id: Optional[str] = None
    pricing_breakdown: Dict[str, Any] = {}
    location: Optional[str] = None  # for location-based pricing
    urgency_level: str = "normal"  # urgent, normal, flexible 