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
from backend.kyc_system import initialize_kyc_system, kyc_health_check
from backend.business_essentials import BusinessEssentialsGenerator
from fastapi import BackgroundTasks
from fastapi.responses import FileResponse
import aiofiles
from bson import ObjectId

# Modular routers
from backend.routers.users import router as users_router
from backend.routers.mentorship import router as mentorship_router
from backend.routers.services import router as services_router
from backend.routers.investment import router as investment_router
from backend.routers.notifications import router as notifications_router
from backend.routers.analytics import router as analytics_router
from backend.routers.auth import router as auth_router

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection with error handling
try:
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    print(f"✅ MongoDB client initialized for {mongo_url}")
except Exception as e:
    print(f"❌ Failed to initialize MongoDB client: {e}")
    print("Please ensure MongoDB is running or check your MONGO_URL in .env file")
    print("You can:")
    print("1. Install MongoDB locally")
    print("2. Use MongoDB Atlas (cloud)")
    print("3. Use Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest")
    raise

db = client[os.environ.get('DB_NAME', 'launchkart')]

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

# Business essentials routes (existing)
@api_router.get("/business-essentials")
async def get_business_essentials(current_user: User = Depends(get_current_user)):
    essentials = await db.business_essentials.find({"user_id": current_user.id}).to_list(100)
    return essentials

# Business Essentials Asset Generation Routes
def fix_mongo_ids(doc):
    """Recursively convert all ObjectId fields in a dict to strings."""
    if isinstance(doc, list):
        return [fix_mongo_ids(item) for item in doc]
    if isinstance(doc, dict):
        return {k: fix_mongo_ids(v) for k, v in doc.items()}
    if isinstance(doc, ObjectId):
        return str(doc)
    return doc

@api_router.get("/business-essentials/user-assets")
async def get_user_assets(current_user: User = Depends(get_current_user)):
    """Get all user's generated assets"""
    try:
        # Check KYC requirement
        if current_user.kyc_level == KYCLevel.NONE:
            return {"kyc_required": True, "message": "Basic KYC required for business essentials"}
        
        # Get user's assets
        assets_cursor = db.user_assets.find({"user_id": current_user.id})
        user_assets = await assets_cursor.to_list(100)
        
        # Organize assets by type
        assets_by_type = {}
        for asset in user_assets:
            asset_type = asset["asset_type"]
            assets_by_type[asset_type] = fix_mongo_ids(asset)
        
        return {"assets": assets_by_type}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/business-essentials/generate-asset")
async def generate_asset(
    request: dict,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """Request generation of a specific asset"""
    try:
        asset_type = request.get("asset_type")
        
        if not asset_type:
            raise HTTPException(status_code=400, detail="Asset type is required")
        
        valid_asset_types = ["logo", "landing_page", "social_creatives", "promo_video", "mockups"]
        if asset_type not in valid_asset_types:
            raise HTTPException(status_code=400, detail=f"Invalid asset type. Must be one of: {valid_asset_types}")
        
        # Check KYC requirement
        if current_user.kyc_level == KYCLevel.NONE:
            raise HTTPException(status_code=403, detail="Basic KYC verification required")
        
        # Initialize generator
        generator = BusinessEssentialsGenerator(db)
        
        # Generate asset
        user_data = current_user.dict()
        asset = await generator.generate_single_asset(
            current_user.id, 
            asset_type, 
            user_data,
            background_tasks
        )
        asset = fix_mongo_ids(asset)
        
        return {
            "message": f"{asset_type.replace('_', ' ').title()} generation started",
            "asset": asset
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating asset: {e}")
        raise HTTPException(status_code=500, detail="Asset generation failed")

@api_router.get("/business-essentials/asset-status/{asset_type}")
async def get_asset_status(asset_type: str, current_user: User = Depends(get_current_user)):
    asset = await db.user_assets.find_one({"user_id": current_user.id, "asset_type": asset_type})
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    asset = fix_mongo_ids(asset)
    status = asset.get("status", "unknown") if isinstance(asset, dict) else "unknown"
    return {
        "status": status,
        "asset": asset
    }

@api_router.get("/business-essentials/download/{asset_id}")
async def download_asset(asset_id: str, current_user: User = Depends(get_current_user)):
    """Download a generated asset as a ZIP file"""
    generator = BusinessEssentialsGenerator(db)
    zip_path = await generator.create_asset_download_package(asset_id)
    if not zip_path:
        raise HTTPException(status_code=404, detail="Asset not found or not ready")
    return FileResponse(zip_path, filename=os.path.basename(zip_path), media_type="application/zip")

@api_router.get("/business-essentials/assets/{filename}")
async def serve_asset_file(filename: str):
    """Serve generated asset files (images, html, etc)"""
    storage_path = os.path.join("./storage/essentials", filename)
    if not os.path.exists(storage_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(storage_path)

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

# Service requests endpoint for frontend compatibility
@api_router.get("/service-requests")
async def get_service_requests(current_user: User = Depends(get_current_user)):
    """Get all service requests for the current user"""
    requests = await db.service_requests.find({"user_id": current_user.id}).to_list(100)
    
    # Convert ObjectIds to strings for JSON serialization
    def fix_mongo_ids(obj):
        if isinstance(obj, list):
            return [fix_mongo_ids(item) for item in obj]
        if isinstance(obj, dict):
            return {k: fix_mongo_ids(v) for k, v in obj.items()}
        if isinstance(obj, ObjectId):
            return str(obj)
        return obj
    
    # Fix ObjectIds in the response
    requests = fix_mongo_ids(requests)
    
    return requests

# Mentors profile endpoint for frontend compatibility
@api_router.post("/mentors/profile")
async def create_mentor_profile(
    expertise: List[str] = Form(...),
    experience_years: int = Form(...),
    hourly_rate: float = Form(...),
    bio: str = Form(...),
    languages: List[str] = Form([]),
    company: Optional[str] = Form(None),
    achievements: List[str] = Form([]),
    current_user: User = Depends(get_current_user)
):
    """Create mentor profile - frontend compatibility endpoint"""
    from backend.models.mentor import EnhancedMentor
    
    mentor = EnhancedMentor(
        user_id=current_user.id,
        expertise=expertise,
        experience_years=experience_years,
        hourly_rate=hourly_rate,
        bio=bio,
        languages=languages,
        company=company,
        achievements=achievements,
        availability={}
    )
    await db.mentors.insert_one(mentor.dict())
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"role": "mentor"}}
    )
    return {"message": "Mentor profile created successfully"}

# Dashboard endpoint for frontend compatibility
@api_router.get("/dashboard")
async def get_dashboard(current_user: User = Depends(get_current_user)):
    """Get dashboard analytics - frontend compatibility endpoint"""
    # Get user's data for dashboard
    user_requests = await db.service_requests.find({"user_id": current_user.id}).to_list(100)
    user_sessions = await db.mentorship_sessions.find({
        "$or": [
            {"mentor_id": current_user.id},
            {"mentee_id": current_user.id}
        ]
    }).to_list(100)
    user_pitches = await db.pitch_submissions.find({"user_id": current_user.id}).to_list(100)
    
    # Fix ObjectIds for JSON serialization
    user_requests = fix_mongo_ids(user_requests)
    user_sessions = fix_mongo_ids(user_sessions)
    user_pitches = fix_mongo_ids(user_pitches)
    
    return {
        "user": current_user.dict(),
        "service_requests": user_requests,
        "mentorship_sessions": user_sessions,
        "pitch_submissions": user_pitches,
        "stats": {
            "total_requests": len(user_requests),
            "total_sessions": len(user_sessions),
            "total_pitches": len(user_pitches)
        }
    }

# Include modular routers
app.include_router(api_router)  # Include the main API router with /api prefix
app.include_router(users_router)
app.include_router(mentorship_router)
app.include_router(services_router)
app.include_router(investment_router)
app.include_router(notifications_router)
app.include_router(analytics_router)
app.include_router(auth_router)

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