from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Form, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timedelta
import requests
from enum import Enum
import bcrypt
import jwt
from passlib.context import CryptContext
import base64
from kyc_system import initialize_kyc_system, kyc_health_check

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-here')
JWT_ALGORITHM = "HS256"

# Create the main app without a prefix
app = FastAPI(title="LaunchKart API", version="2.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Enums
class UserRole(str, Enum):
    ADMIN = "admin"
    FOUNDER = "founder"
    MENTOR = "mentor"
    INVESTOR = "investor"

class Country(str, Enum):
    INDIA = "India"
    UAE = "UAE"

class BusinessStage(str, Enum):
    IDEA = "Idea"
    PROTOTYPE = "Prototype"
    LAUNCHED = "Launched"
    SCALING = "Scaling"

class KYCLevel(str, Enum):
    NONE = "none"
    BASIC = "basic"
    FULL = "full"

class KYCStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    FAILED = "failed"

class ServiceStatus(str, Enum):
    PENDING = "pending"
    QUOTED = "quoted"
    PAID = "paid"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

# Models
class UserSignup(BaseModel):
    fullName: str
    email: EmailStr
    phoneNumber: str
    country: Country
    businessStage: Optional[BusinessStage] = None
    password: str
    confirmPassword: str
    referralCode: Optional[str] = None
    role: UserRole = UserRole.FOUNDER

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    fullName: str
    email: str
    phoneNumber: str
    country: Country
    businessStage: Optional[BusinessStage] = None
    referralCode: Optional[str] = None
    role: UserRole = UserRole.FOUNDER
    picture: Optional[str] = None
    session_token: Optional[str] = None
    password_hash: Optional[str] = None
    kyc_level: KYCLevel = KYCLevel.NONE
    kyc_status: KYCStatus = KYCStatus.PENDING
    kyc_verified_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class KYCDocument(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    document_type: str  # aadhaar, emirates_id, passport
    document_number: str
    document_data: str  # base64 encoded
    verification_status: KYCStatus = KYCStatus.PENDING
    verified_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Mentor(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    expertise: List[str]
    experience_years: int
    hourly_rate: float
    bio: str
    availability: Dict[str, List[str]]  # day: [time_slots]
    rating: float = 0.0
    total_sessions: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MentorshipSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    mentor_id: str
    mentee_id: str
    scheduled_at: datetime
    duration: int  # minutes
    meeting_link: Optional[str] = None
    notes: Optional[str] = None
    status: str = "scheduled"  # scheduled, completed, cancelled
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PitchSubmission(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    company_name: str
    industry: str
    funding_amount: float
    equity_offering: float
    pitch_deck: str  # base64 encoded
    business_plan: Optional[str] = None
    financial_projections: Optional[str] = None
    team_info: Dict
    review_status: str = "under_review"  # under_review, approved, rejected
    reviewed_by: Optional[str] = None
    review_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ServiceRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    service_type: str
    title: str
    description: str
    budget: float
    status: ServiceStatus = ServiceStatus.PENDING
    assigned_to: Optional[str] = None
    deliverables: List[str] = []
    files: List[str] = []  # file paths or base64
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class PaymentRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    service_request_id: Optional[str] = None
    amount: float
    currency: str = "USD"
    payment_method: str
    transaction_id: str
    status: str = "pending"  # pending, completed, failed
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Utility functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_jwt_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_jwt_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Authentication helpers
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = verify_jwt_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return User(**user)
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid authentication")

def get_user_by_role(required_role: UserRole):
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role != required_role:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return role_checker

# Authentication routes
@api_router.post("/auth/signup")
async def signup(user_data: UserSignup):
    # Validate passwords match
    if user_data.password != user_data.confirmPassword:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = hash_password(user_data.password)
    
    # Create user
    user = User(
        fullName=user_data.fullName,
        email=user_data.email,
        phoneNumber=user_data.phoneNumber,
        country=user_data.country,
        businessStage=user_data.businessStage,
        referralCode=user_data.referralCode,
        role=user_data.role,
        password_hash=hashed_password
    )
    
    await db.users.insert_one(user.dict())
    
    # Create JWT token
    token = create_jwt_token({"sub": user.id, "email": user.email})
    
    return {
        "message": "User created successfully",
        "user": user.dict(),
        "token": token
    }

@api_router.post("/auth/login")
async def login(user_data: UserLogin):
    # Find user
    user = await db.users.find_one({"email": user_data.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password
    if not verify_password(user_data.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create JWT token
    token = create_jwt_token({"sub": user["id"], "email": user["email"]})
    
    # Convert user to Pydantic model and dict for serialization
    user_model = User(**user)
    return {
        "message": "Login successful",
        "user": user_model.dict(),
        "token": token
    }

@api_router.get("/auth/login-redirect")
async def login_redirect(request: Request):
    # For development/demo purposes, return a mock auth URL
    # This bypasses the external auth service that's causing the state parameter error
    host = request.headers.get("host", "localhost")
    protocol = "https" if "preview.emergentagent.com" in host else "http"
    redirect_url = f"{protocol}://{host}/profile"
    
    # Return a mock auth URL that will redirect back to our app
    auth_url = f"{protocol}://{host}/api/auth/mock-google-callback?redirect={redirect_url}"
    
    return {"auth_url": auth_url}

@api_router.get("/auth/mock-google-callback")
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

@api_router.post("/auth/google-profile")
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

@api_router.get("/auth/me")
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

@api_router.put("/auth/role")
async def update_user_role(role: UserRole, current_user: User = Depends(get_current_user)):
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"role": role, "updated_at": datetime.utcnow()}}
    )
    return {"message": "Role updated successfully"}

# KYC routes
@api_router.post("/kyc/basic")
async def submit_basic_kyc(
    document_type: str = Form(...),
    document_number: str = Form(...),
    document_file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    # Convert uploaded file to base64
    file_content = await document_file.read()
    document_data = base64.b64encode(file_content).decode('utf-8')
    
    # Create KYC document
    kyc_doc = KYCDocument(
        user_id=current_user.id,
        document_type=document_type,
        document_number=document_number,
        document_data=document_data
    )
    
    await db.kyc_documents.insert_one(kyc_doc.dict())
    
    # Update user KYC status
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {
            "kyc_level": KYCLevel.BASIC.value,
            "kyc_status": KYCStatus.PENDING.value,
            "updated_at": datetime.utcnow()
        }}
    )
    
    return {"message": "Basic KYC submitted successfully"}

@api_router.post("/kyc/full")
async def submit_full_kyc(
    additional_documents: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user)
):
    # Process additional documents for full KYC
    for doc in additional_documents:
        file_content = await doc.read()
        document_data = base64.b64encode(file_content).decode('utf-8')
        
        kyc_doc = KYCDocument(
            user_id=current_user.id,
            document_type="full_kyc",
            document_number="",
            document_data=document_data
        )
        
        await db.kyc_documents.insert_one(kyc_doc.dict())
    
    # Update user KYC status
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {
            "kyc_level": KYCLevel.FULL.value,
            "kyc_status": KYCStatus.PENDING.value,
            "updated_at": datetime.utcnow()
        }}
    )
    
    return {"message": "Full KYC submitted successfully"}

@api_router.get("/kyc/status")
async def get_kyc_status(current_user: User = Depends(get_current_user)):
    return {
        "kyc_level": current_user.kyc_level,
        "kyc_status": current_user.kyc_status,
        "kyc_verified_at": current_user.kyc_verified_at
    }

# Mentorship routes
@api_router.get("/mentors")
async def get_mentors(
    expertise: Optional[str] = None,
    country: Optional[Country] = None
):
    filter_query = {}
    if expertise:
        filter_query["expertise"] = {"$in": [expertise]}
    
    mentors = await db.mentors.find(filter_query).to_list(100)
    
    # Populate mentor user data
    for mentor in mentors:
        user = await db.users.find_one({"id": mentor["user_id"]})
        mentor["user"] = user
    
    return mentors

@api_router.post("/mentors/profile")
async def create_mentor_profile(
    expertise: List[str] = Form(...),
    experience_years: int = Form(...),
    hourly_rate: float = Form(...),
    bio: str = Form(...),
    current_user: User = Depends(get_current_user)
):
    mentor = Mentor(
        user_id=current_user.id,
        expertise=expertise,
        experience_years=experience_years,
        hourly_rate=hourly_rate,
        bio=bio,
        availability={}
    )
    
    await db.mentors.insert_one(mentor.dict())
    return {"message": "Mentor profile created successfully"}

@api_router.post("/mentorship/book")
async def book_mentorship_session(
    mentor_id: str = Form(...),
    scheduled_at: datetime = Form(...),
    duration: int = Form(60),
    current_user: User = Depends(get_current_user)
):
    session = MentorshipSession(
        mentor_id=mentor_id,
        mentee_id=current_user.id,
        scheduled_at=scheduled_at,
        duration=duration
    )
    
    await db.mentorship_sessions.insert_one(session.dict())
    return {"message": "Mentorship session booked successfully"}

@api_router.get("/mentorship/sessions")
async def get_user_sessions(current_user: User = Depends(get_current_user)):
    sessions = await db.mentorship_sessions.find({
        "$or": [
            {"mentor_id": current_user.id},
            {"mentee_id": current_user.id}
        ]
    }).to_list(100)
    
    return sessions

# Investment routes
@api_router.post("/investment/pitch")
async def submit_pitch(
    company_name: str = Form(...),
    industry: str = Form(...),
    funding_amount: float = Form(...),
    equity_offering: float = Form(...),
    team_info: str = Form(...),
    pitch_deck: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    # Check if user has full KYC
    if current_user.kyc_level != KYCLevel.FULL:
        raise HTTPException(status_code=400, detail="Full KYC required for investment applications")
    
    # Convert pitch deck to base64
    file_content = await pitch_deck.read()
    pitch_deck_data = base64.b64encode(file_content).decode('utf-8')
    
    # Parse team info JSON
    import json
    team_data = json.loads(team_info)
    
    pitch = PitchSubmission(
        user_id=current_user.id,
        company_name=company_name,
        industry=industry,
        funding_amount=funding_amount,
        equity_offering=equity_offering,
        pitch_deck=pitch_deck_data,
        team_info=team_data
    )
    
    await db.pitch_submissions.insert_one(pitch.dict())
    return {"message": "Pitch submitted successfully"}

@api_router.get("/investment/applications")
async def get_investment_applications(current_user: User = Depends(get_current_user)):
    applications = await db.pitch_submissions.find({"user_id": current_user.id}).to_list(100)
    return applications

@api_router.get("/investment/dashboard")
async def get_investor_dashboard(current_user: User = Depends(get_user_by_role(UserRole.INVESTOR))):
    pitches = await db.pitch_submissions.find({}).to_list(100)
    
    # Populate user data
    for pitch in pitches:
        user = await db.users.find_one({"id": pitch["user_id"]})
        pitch["user"] = user
    
    return pitches

# Admin routes
@api_router.get("/admin/users")
async def get_all_users(current_user: User = Depends(get_user_by_role(UserRole.ADMIN))):
    users = await db.users.find().to_list(1000)
    return users

@api_router.put("/admin/kyc/approve")
async def approve_kyc(
    user_id: str = Form(...),
    kyc_level: KYCLevel = Form(...),
    current_user: User = Depends(get_user_by_role(UserRole.ADMIN))
):
    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "kyc_status": KYCStatus.VERIFIED.value,
            "kyc_level": kyc_level.value,
            "kyc_verified_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }}
    )
    return {"message": "KYC approved successfully"}

@api_router.get("/admin/service-requests")
async def get_all_service_requests(current_user: User = Depends(get_user_by_role(UserRole.ADMIN))):
    requests = await db.service_requests.find().to_list(1000)
    return requests

@api_router.put("/admin/service-request/assign")
async def assign_service_request(
    request_id: str = Form(...),
    assigned_to: str = Form(...),
    current_user: User = Depends(get_user_by_role(UserRole.ADMIN))
):
    await db.service_requests.update_one(
        {"id": request_id},
        {"$set": {"assigned_to": assigned_to, "updated_at": datetime.utcnow()}}
    )
    return {"message": "Service request assigned successfully"}

@api_router.get("/admin/investment/review")
async def get_investment_review(current_user: User = Depends(get_user_by_role(UserRole.ADMIN))):
    pitches = await db.pitch_submissions.find({}).to_list(100)
    return pitches

@api_router.put("/admin/investment/review")
async def review_investment(
    pitch_id: str = Form(...),
    review_status: str = Form(...),
    review_notes: str = Form(...),
    current_user: User = Depends(get_user_by_role(UserRole.ADMIN))
):
    await db.pitch_submissions.update_one(
        {"id": pitch_id},
        {"$set": {
            "review_status": review_status,
            "review_notes": review_notes,
            "reviewed_by": current_user.id,
            "updated_at": datetime.utcnow()
        }}
    )
    return {"message": "Investment review completed"}

@api_router.get("/admin/kyc/health")
async def get_kyc_health(current_user: User = Depends(get_user_by_role(UserRole.ADMIN))):
    return await kyc_health_check(db)

# Dashboard routes
@api_router.get("/dashboard")
async def get_dashboard(current_user: User = Depends(get_current_user)):
    # Get user's business essentials
    essentials = await db.business_essentials.find({"user_id": current_user.id}).to_list(100)
    
    # Get user's service requests
    services = await db.service_requests.find({"user_id": current_user.id}).to_list(100)
    
    # Get user's mentorship sessions
    sessions = await db.mentorship_sessions.find({
        "$or": [
            {"mentor_id": current_user.id},
            {"mentee_id": current_user.id}
        ]
    }).to_list(100)
    
    # Get user's investment applications
    applications = await db.pitch_submissions.find({"user_id": current_user.id}).to_list(100)
    
    dashboard_data = {
        "user": current_user.dict(),
        "business_essentials": essentials,
        "service_requests": services,
        "mentorship_sessions": sessions,
        "investment_applications": applications,
        "stats": {
            "total_essentials": len(essentials),
            "total_services": len(services),
            "total_sessions": len(sessions),
            "total_applications": len(applications),
            "completed_services": len([s for s in services if s["status"] == "completed"])
        }
    }
    
    return dashboard_data

# Business essentials routes (existing)
@api_router.get("/business-essentials")
async def get_business_essentials(current_user: User = Depends(get_current_user)):
    essentials = await db.business_essentials.find({"user_id": current_user.id}).to_list(100)
    return essentials

# Service routes (existing)
@api_router.get("/services")
async def get_services():
    services = [
        {"id": "incorporation", "title": "Company Incorporation", "description": "Legal company setup in India/UAE", "price": 500},
        {"id": "website", "title": "Professional Website", "description": "Complete business website with CMS", "price": 1500},
        {"id": "mobile-app", "title": "Mobile App Development", "description": "Native iOS/Android app", "price": 3000},
        {"id": "legal-docs", "title": "Legal Documents", "description": "MoU, NDA, SHA preparation", "price": 300},
        {"id": "marketing", "title": "Marketing Strategy", "description": "Complete marketing and SEO plan", "price": 800},
        {"id": "trademark", "title": "Trademark Registration", "description": "Brand protection and registration", "price": 400},
    ]
    return services

@api_router.post("/services/request")
async def create_service_request(
    service_type: str = Form(...),
    title: str = Form(...),
    description: str = Form(...),
    budget: float = Form(...),
    current_user: User = Depends(get_current_user)
):
    service_request = ServiceRequest(
        user_id=current_user.id,
        service_type=service_type,
        title=title,
        description=description,
        budget=budget
    )
    
    await db.service_requests.insert_one(service_request.dict())
    return {"message": "Service request created successfully", "request": service_request}

# Legal/Static pages
@api_router.get("/legal/terms")
async def get_terms():
    return {
        "title": "Terms of Service",
        "content": "Terms of service content for LaunchKart platform..."
    }

@api_router.get("/legal/privacy")
async def get_privacy():
    return {
        "title": "Privacy Policy",
        "content": "Privacy policy content for LaunchKart platform..."
    }

@api_router.get("/legal/investment-disclaimer")
async def get_investment_disclaimer():
    return {
        "title": "Investment Disclaimer",
        "content": "Investment disclaimer content for LaunchKart platform..."
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()