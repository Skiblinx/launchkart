from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from typing import Optional
import uuid

class EmailVerificationToken(BaseModel):
    """Email verification token model"""
    id: str = uuid.uuid4().hex
    email: EmailStr
    token: str = uuid.uuid4().hex
    user_id: str
    created_at: datetime = datetime.utcnow()
    expires_at: datetime = datetime.utcnow() + timedelta(hours=24)
    used: bool = False
    used_at: Optional[datetime] = None

class EmailVerificationRequest(BaseModel):
    """Request to verify email"""
    token: str

class ResendVerificationRequest(BaseModel):
    """Request to resend verification email"""
    email: EmailStr

class PasswordResetToken(BaseModel):
    """Password reset token model"""
    id: str = uuid.uuid4().hex
    email: EmailStr
    token: str = uuid.uuid4().hex
    user_id: str
    created_at: datetime = datetime.utcnow()
    expires_at: datetime = datetime.utcnow() + timedelta(hours=1)
    used: bool = False
    used_at: Optional[datetime] = None

class PasswordResetRequest(BaseModel):
    """Request to reset password"""
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    """Confirm password reset with new password"""
    token: str
    new_password: str