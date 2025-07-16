from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime
from enum import Enum
import uuid

class AdminRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    MODERATOR = "moderator"
    SUPPORT = "support"

class AdminPermission(str, Enum):
    # User Management
    USER_MANAGEMENT = "user_management"
    ADMIN_MANAGEMENT = "admin_management"
    
    # Content Management
    CONTENT_MODERATION = "content_moderation"
    SERVICE_APPROVAL = "service_approval"
    
    # Financial Management
    PAYMENT_MANAGEMENT = "payment_management"
    REFUND_PROCESSING = "refund_processing"
    
    # Analytics & Reporting
    ANALYTICS_ACCESS = "analytics_access"
    REPORT_GENERATION = "report_generation"
    
    # System Management
    SYSTEM_CONFIGURATION = "system_configuration"
    EMAIL_MANAGEMENT = "email_management"
    
    # KYC Management
    KYC_VERIFICATION = "kyc_verification"
    KYC_APPROVAL = "kyc_approval"

class AdminUser(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    full_name: str
    role: AdminRole
    permissions: List[AdminPermission]
    is_active: bool = True
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    login_count: int = 0
    demoted_by: Optional[str] = None
    demoted_at: Optional[datetime] = None

class Admin(BaseModel):
    """Simplified admin model for API responses"""
    id: str
    email: str
    fullName: str
    role: str
    permissions: List[str]
    picture: Optional[str] = None

class AdminOTPRequest(BaseModel):
    email: EmailStr

class AdminOTPVerify(BaseModel):
    email: EmailStr
    otp: str

class UserToAdminRequest(BaseModel):
    user_id: str
    role: AdminRole
    permissions: List[AdminPermission]

class AdminUpdateRequest(BaseModel):
    role: Optional[AdminRole] = None
    permissions: Optional[List[AdminPermission]] = None
    is_active: Optional[bool] = None

class AdminAuditLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    admin_email: str
    action: str
    resource_type: str
    resource_id: str
    details: dict
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# Dashboard and Management Models
class KYCUpdateRequest(BaseModel):
    status: str  # pending, verified, failed
    notes: Optional[str] = None

class ServiceRequestUpdate(BaseModel):
    status: str  # pending, quoted, paid, in_progress, completed, cancelled
    assigned_to: Optional[str] = None
    notes: Optional[str] = None

class SystemHealthStatus(BaseModel):
    database: dict
    api: dict
    email_service: dict
    payment_gateway: dict
    storage: dict

class MaintenanceModeRequest(BaseModel):
    enable: bool
    message: Optional[str] = None 