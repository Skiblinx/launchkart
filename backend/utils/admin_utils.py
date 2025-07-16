import os
import random
import string
import smtplib
import logging
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jose import jwt, JWTError
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer
from motor.motor_asyncio import AsyncIOMotorDatabase
from backend.db import get_database
from backend.models.admin import Admin, AdminUser, AdminPermission
from typing import Optional

# Configure logging
logger = logging.getLogger(__name__)

# Email configuration
SMTP_SERVER = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '587'))
SMTP_USERNAME = os.environ.get('SMTP_USERNAME', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
FROM_EMAIL = os.environ.get('FROM_EMAIL', 'noreply@launchkart.com')

# JWT configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-here')
JWT_ALGORITHM = "HS256"

# Security
security = HTTPBearer()

# OTP storage (in production, use Redis or database)
otp_storage = {}

def generate_otp(length: int = 6) -> str:
    """Generate a random OTP"""
    return ''.join(random.choices(string.digits, k=length))

def create_admin_jwt_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT token for admin authentication"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=24)  # 24 hours for admin tokens
    
    to_encode.update({"exp": expire, "type": "admin"})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_admin_token(token: str):
    """Verify admin JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "admin":
            raise HTTPException(status_code=401, detail="Invalid token type")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_admin_permission(required_permission: AdminPermission):
    """Dependency to check if admin has required permission"""
    async def permission_checker(current_admin: Admin = Depends(get_current_admin_enhanced)):
        if required_permission not in current_admin.permissions:
            raise HTTPException(
                status_code=403, 
                detail=f"Permission denied: {required_permission} required"
            )
        return current_admin
    return permission_checker

async def get_current_admin_enhanced(credentials = Depends(security)):
    """Enhanced admin authentication that works with user-promoted admins"""
    try:
        token = credentials.credentials
        payload = verify_admin_token(token)
        email = payload.get("email")
        
        db = await get_database()
        
        # Check if user is an active admin
        admin = await db.admin_users.find_one({"email": email, "is_active": True})
        if not admin:
            raise HTTPException(status_code=403, detail="Admin access denied or revoked")
        
        # Get additional user info
        user = await db.users.find_one({"email": email})
        
        # Update last login
        await db.admin_users.update_one(
            {"email": email},
            {
                "$set": {"last_login": datetime.utcnow()},
                "$inc": {"login_count": 1}
            }
        )
        
        # Return Admin model instance
        return Admin(
            id=admin.get("id", admin.get("_id")),
            email=admin["email"],
            role=admin["role"],
            permissions=admin["permissions"],
            fullName=admin["full_name"],
            picture=user.get("picture") if user else None
        )
        
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid authentication")

# Alias for compatibility
get_current_admin = get_current_admin_enhanced

async def send_otp_email(email: str, otp: str, full_name: str):
    """Send OTP email to admin"""
    try:
        from backend.utils.email_service import email_service
        
        success = email_service.send_admin_otp(email, full_name, otp)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to send OTP email")
        
        logger.info(f"OTP email sent to {email}")
        
    except Exception as e:
        logger.error(f"Failed to send OTP email to {email}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send OTP email")

async def send_admin_promotion_email(
    email: str,
    full_name: str,
    role: str,
    promoted_by: str
):
    """Send email notification about admin promotion"""
    try:
        from backend.utils.email_service import email_service
        
        success = email_service.send_admin_promotion_notification(email, full_name, role, promoted_by)
        if success:
            logger.info(f"Admin promotion notification sent to {email}")
        else:
            logger.error(f"Failed to send promotion email to {email}")
        
    except Exception as e:
        logger.error(f"Failed to send promotion email to {email}: {str(e)}") 