from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timedelta
import uuid
import logging
from passlib.context import CryptContext

from backend.db import get_database
from backend.models.verification import (
    EmailVerificationRequest, 
    ResendVerificationRequest,
    PasswordResetRequest,
    PasswordResetConfirm
)
from backend.utils.email_service import email_service

router = APIRouter(prefix="/api/email", tags=["email-verification"])
logger = logging.getLogger(__name__)

@router.post("/verify")
async def verify_email(
    request: EmailVerificationRequest,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Verify user email address"""
    try:
        # Find verification token
        verification = await db.email_verifications.find_one({
            "token": request.token,
            "used": False,
            "expires_at": {"$gt": datetime.utcnow()}
        })
        
        if not verification:
            raise HTTPException(
                status_code=400, 
                detail="Invalid or expired verification token"
            )
        
        # Mark token as used
        await db.email_verifications.update_one(
            {"token": request.token},
            {
                "$set": {
                    "used": True,
                    "used_at": datetime.utcnow()
                }
            }
        )
        
        # Update user email verification status
        await db.users.update_one(
            {"id": verification["user_id"]},
            {
                "$set": {
                    "email_verified": True,
                    "email_verified_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        logger.info(f"Email verified for user {verification['user_id']}")
        
        return {
            "message": "Email verified successfully",
            "verified": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying email: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to verify email")

@router.post("/resend-verification")
async def resend_verification_email(
    request: ResendVerificationRequest,
    background_tasks: BackgroundTasks,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Resend email verification"""
    try:
        # Find user
        user = await db.users.find_one({"email": request.email})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if user.get("email_verified", False):
            raise HTTPException(status_code=400, detail="Email already verified")
        
        # Check if there's a recent verification sent (rate limiting)
        recent_verification = await db.email_verifications.find_one({
            "email": request.email,
            "created_at": {"$gt": datetime.utcnow() - timedelta(minutes=5)}
        })
        
        if recent_verification:
            raise HTTPException(
                status_code=429, 
                detail="Please wait 5 minutes before requesting another verification email"
            )
        
        # Create new verification token
        verification_token = {
            "id": str(uuid.uuid4()),
            "email": request.email,
            "token": str(uuid.uuid4()),
            "user_id": user["id"],
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(hours=24),
            "used": False
        }
        
        await db.email_verifications.insert_one(verification_token)
        
        # Send verification email
        background_tasks.add_task(
            send_verification_email_async,
            request.email,
            user["fullName"],
            verification_token["token"]
        )
        
        return {
            "message": "Verification email sent",
            "expires_in": 86400  # 24 hours
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resending verification: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to resend verification email")

@router.post("/request-password-reset")
async def request_password_reset(
    request: PasswordResetRequest,
    background_tasks: BackgroundTasks,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Request password reset"""
    try:
        # Find user
        user = await db.users.find_one({"email": request.email})
        if not user:
            # Don't reveal if email exists or not for security
            return {
                "message": "If the email exists, a password reset link has been sent",
                "sent": True
            }
        
        # Check if there's a recent reset request (rate limiting)
        recent_reset = await db.password_resets.find_one({
            "email": request.email,
            "created_at": {"$gt": datetime.utcnow() - timedelta(minutes=5)}
        })
        
        if recent_reset:
            raise HTTPException(
                status_code=429, 
                detail="Please wait 5 minutes before requesting another password reset"
            )
        
        # Create password reset token
        reset_token = {
            "id": str(uuid.uuid4()),
            "email": request.email,
            "token": str(uuid.uuid4()),
            "user_id": user["id"],
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(hours=1),
            "used": False
        }
        
        await db.password_resets.insert_one(reset_token)
        
        # Send password reset email
        background_tasks.add_task(
            send_password_reset_email_async,
            request.email,
            user["fullName"],
            reset_token["token"]
        )
        
        return {
            "message": "If the email exists, a password reset link has been sent",
            "sent": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error requesting password reset: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to process password reset request")

@router.post("/confirm-password-reset")
async def confirm_password_reset(
    request: PasswordResetConfirm,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Confirm password reset with new password"""
    try:
        # Find reset token
        reset_token = await db.password_resets.find_one({
            "token": request.token,
            "used": False,
            "expires_at": {"$gt": datetime.utcnow()}
        })
        
        if not reset_token:
            raise HTTPException(
                status_code=400, 
                detail="Invalid or expired reset token"
            )
        
        # Validate new password
        if len(request.new_password) < 8:
            raise HTTPException(
                status_code=400, 
                detail="Password must be at least 8 characters long"
            )
        
        # Password context for hashing - using argon2 for better compatibility
        pwd_context = CryptContext(
            schemes=["argon2", "bcrypt"],
            deprecated="auto",
            argon2__default_rounds=4,
        )
        
        # Hash new password using passlib
        hashed_password = pwd_context.hash(request.new_password)
        
        # Update user password
        await db.users.update_one(
            {"id": reset_token["user_id"]},
            {
                "$set": {
                    "password_hash": hashed_password,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # Mark reset token as used
        await db.password_resets.update_one(
            {"token": request.token},
            {
                "$set": {
                    "used": True,
                    "used_at": datetime.utcnow()
                }
            }
        )
        
        logger.info(f"Password reset completed for user {reset_token['user_id']}")
        
        return {
            "message": "Password reset successfully",
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error confirming password reset: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to reset password")

@router.get("/verification-status/{email}")
async def get_verification_status(
    email: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get email verification status"""
    try:
        user = await db.users.find_one({"email": email}, {"email_verified": 1, "_id": 0})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "email": email,
            "verified": user.get("email_verified", False)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking verification status: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to check verification status")

# Background task functions
async def send_verification_email_async(email: str, full_name: str, token: str):
    """Send verification email as background task"""
    try:
        success = email_service.send_email_verification(email, full_name, token)
        if success:
            logger.info(f"Verification email sent to {email}")
        else:
            logger.error(f"Failed to send verification email to {email}")
    except Exception as e:
        logger.error(f"Error in background verification email task: {str(e)}")

async def send_password_reset_email_async(email: str, full_name: str, token: str):
    """Send password reset email as background task"""
    try:
        success = email_service.send_password_reset(email, full_name, token)
        if success:
            logger.info(f"Password reset email sent to {email}")
        else:
            logger.error(f"Failed to send password reset email to {email}")
    except Exception as e:
        logger.error(f"Error in background password reset email task: {str(e)}")