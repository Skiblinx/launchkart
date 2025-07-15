from fastapi import APIRouter, Depends, HTTPException, Form, Request, BackgroundTasks
from backend.db import db, get_current_user
from backend.models.user import User
from passlib.context import CryptContext
from jose import jwt

import os
from typing import Optional
from pydantic import BaseModel
import requests
from datetime import datetime, timedelta
from enum import Enum
import uuid
import hashlib

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Password context for hashing - using argon2 for better compatibility
pwd_context = CryptContext(
    schemes=["argon2", "bcrypt"],
    deprecated="auto",
    argon2__default_rounds=4,
)

def hash_password(password: str) -> str:
    """Hash password using passlib"""
    return pwd_context.hash(password)

def verify_password(password: str, stored_hash: str) -> bool:
    """Verify password against stored hash - supports both passlib and legacy formats"""
    try:
        # First try passlib verification (new format)
        return pwd_context.verify(password, stored_hash)
    except:
        # Fallback to legacy pbkdf2_hmac verification for existing users
        try:
            if len(stored_hash) < 64:
                return False
            salt = stored_hash[:64]
            stored_pwdhash = stored_hash[64:]
            pwdhash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
            return pwdhash.hex() == stored_pwdhash
        except:
            return False
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-here')
JWT_ALGORITHM = "HS256"

class UserRole(str, Enum):
    ADMIN = "admin"
    FOUNDER = "founder"
    MENTOR = "mentor"
    INVESTOR = "investor"

class Country(str, Enum):
    INDIA = "India"
    UAE = "UAE"

class SignupRequest(BaseModel):
    fullName: str
    email: str
    phoneNumber: str
    country: str
    businessStage: Optional[str] = None
    password: str
    confirmPassword: str
    referralCode: Optional[str] = None
    role: str = "founder"

class LoginRequest(BaseModel):
    email: str
    password: str

def create_jwt_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

@router.post("/signup")
async def signup(data: SignupRequest, background_tasks: BackgroundTasks):
    # Validate passwords match
    if data.password != data.confirmPassword:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = hash_password(data.password)
    
    # Create user with email_verified = False
    user = User(
        fullName=data.fullName,
        email=data.email,
        phoneNumber=data.phoneNumber,
        country=data.country,
        businessStage=data.businessStage,
        referralCode=data.referralCode,
        role=data.role,
        password_hash=hashed_password,
        email_verified=False  # New field for email verification
    )
    
    # Insert user
    await db.users.insert_one(user.dict())
    
    # Create email verification token
    verification_token = {
        "id": str(uuid.uuid4()),
        "email": data.email,
        "token": str(uuid.uuid4()),
        "user_id": user.id,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(hours=24),
        "used": False
    }
    
    await db.email_verifications.insert_one(verification_token)
    
    # Send verification email
    from backend.utils.email_service import email_service
    background_tasks.add_task(
        send_verification_email_task,
        data.email,
        data.fullName,
        verification_token["token"]
    )
    
    return {
        "message": "User created successfully. Please check your email to verify your account.",
        "user": user.dict(),
        "email_verification_required": True
    }

@router.post("/login")
async def login(data: LoginRequest):
    import logging
    logger = logging.getLogger(__name__)
    
    # Find user
    user = await db.users.find_one({"email": data.email})
    if not user:
        logger.warning(f"Login attempt with non-existent email: {data.email}")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password
    password_valid = verify_password(data.password, user.get("password_hash", ""))
    if not password_valid:
        logger.warning(f"Login attempt with invalid password for user: {data.email}")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check if email is verified
    if not user.get("email_verified", False):
        logger.warning(f"Login attempt with unverified email: {data.email}")
        raise HTTPException(
            status_code=403, 
            detail="Email not verified. Please check your email and verify your account before signing in."
        )
    
    # Create JWT token
    token = create_jwt_token({"sub": user["id"], "email": user["email"]})
    user_model = User(**user)
    
    return {
        "message": "Login successful",
        "user": user_model.dict(),
        "token": token
    }

@router.get("/login-redirect")
async def login_redirect(request: Request):
    # For development/demo purposes, return a mock auth URL
    host = request.headers.get("host", "localhost")
    protocol = "https" if "preview.emergentagent.com" in host else "http"
    redirect_url = f"{protocol}://{host}/profile"
    
    # Return a mock auth URL that will redirect back to our app
    auth_url = f"{protocol}://{host}/api/auth/mock-google-callback?redirect={redirect_url}"
    
    return {"auth_url": auth_url}

@router.get("/mock-google-callback")
async def mock_google_callback(request: Request):
    """Mock Google OAuth callback for development/demo purposes"""
    try:
        # Get redirect URL from query params
        redirect_url = request.query_params.get("redirect", "http://localhost:3000/profile")
        
        # Create a mock user for demo purposes
        mock_user_data = {
            "name": "Demo User",
            "email": "demo@example.com",
            "picture": "https://via.placeholder.com/150"
        }
        
        # Check if user exists
        existing_user = await db.users.find_one({"email": mock_user_data["email"]})
        
        if existing_user:
            user = User(**existing_user)
        else:
            # Create new user from mock data
            user = User(
                fullName=mock_user_data["name"],
                email=mock_user_data["email"],
                phoneNumber="",  # Will be collected later
                country=Country.INDIA,  # Default, can be updated
                picture=mock_user_data.get("picture"),
                role=UserRole.FOUNDER
            )
            await db.users.insert_one(user.dict())
        
        # Create JWT token
        token = create_jwt_token({"sub": user.id, "email": user.email})
        
        # Redirect to frontend with token
        return {
            "user": user.dict(),
            "token": token,
            "redirect_url": redirect_url
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/google-profile")
async def google_profile(request: Request):
    try:
        # Get session ID from headers
        session_id = request.headers.get("X-Session-ID")
        if not session_id:
            raise HTTPException(status_code=400, detail="Session ID required")
        
        # Call Emergent auth API
        auth_response = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        
        if auth_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        auth_data = auth_response.json()
        
        # Check if user exists
        existing_user = await db.users.find_one({"email": auth_data["email"]})
        
        if existing_user:
            user = User(**existing_user)
        else:
            # Create new user from Google data
            user = User(
                fullName=auth_data["name"],
                email=auth_data["email"],
                phoneNumber="",  # Will be collected later
                country=Country.INDIA,  # Default, can be updated
                picture=auth_data.get("picture"),
                role=UserRole.FOUNDER
            )
            await db.users.insert_one(user.dict())
        
        # Create JWT token
        token = create_jwt_token({"sub": user.id, "email": user.email})
        
        return {
            "user": user.dict(),
            "token": token
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/me")
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/role")
async def update_user_role(role: UserRole, current_user: User = Depends(get_current_user)):
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"role": role, "updated_at": datetime.utcnow()}}
    )
    return {"message": "Role updated successfully"}

# Background task functions
async def send_verification_email_task(email: str, full_name: str, token: str):
    """Send verification email as background task"""
    try:
        from backend.utils.email_service import email_service
        success = email_service.send_email_verification(email, full_name, token)
        if success:
            print(f"✅ Verification email sent to {email}")
        else:
            print(f"❌ Failed to send verification email to {email}")
    except Exception as e:
        print(f"❌ Error in background verification email task: {str(e)}") 