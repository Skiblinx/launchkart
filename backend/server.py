from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import requests
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="LaunchKart API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# User roles
class UserRole(str, Enum):
    ADMIN = "admin"
    FOUNDER = "founder"
    MENTOR = "mentor"
    INVESTOR = "investor"

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    picture: Optional[str] = None
    role: UserRole = UserRole.FOUNDER
    session_token: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserProfile(BaseModel):
    user: User
    dashboard_data: dict

class AuthResponse(BaseModel):
    success: bool
    message: str
    user: Optional[User] = None
    redirect_url: Optional[str] = None

class BusinessEssential(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: str  # logo, website, social_media, mockup
    title: str
    description: str
    content: str  # base64 for images, HTML for websites
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ServiceRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    service_type: str
    title: str
    description: str
    budget: float
    status: str = "pending"  # pending, quoted, paid, in_progress, completed
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Authentication helpers
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        session_token = credentials.credentials
        user = await db.users.find_one({"session_token": session_token})
        if not user:
            raise HTTPException(status_code=401, detail="Invalid session token")
        return User(**user)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authentication")

async def get_user_by_role(required_role: UserRole):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role != required_role:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return role_checker

# Authentication routes
@api_router.get("/auth/login")
async def login_redirect(request: Request):
    # Get the current URL for redirect
    host = request.headers.get("host", "localhost")
    protocol = "https" if "preview.emergentagent.com" in host else "http"
    redirect_url = f"{protocol}://{host}/profile"
    
    auth_url = f"https://auth.emergentagent.com/?redirect={redirect_url}"
    return {"auth_url": auth_url}

@api_router.post("/auth/profile")
async def get_profile(request: Request):
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
        
        # Generate session token
        session_token = str(uuid.uuid4())
        
        # Check if user exists
        existing_user = await db.users.find_one({"email": auth_data["email"]})
        
        if existing_user:
            # Update session token
            await db.users.update_one(
                {"email": auth_data["email"]},
                {"$set": {"session_token": session_token, "updated_at": datetime.utcnow()}}
            )
            user = User(**existing_user)
            user.session_token = session_token
        else:
            # Create new user
            user = User(
                email=auth_data["email"],
                name=auth_data["name"],
                picture=auth_data.get("picture"),
                session_token=session_token
            )
            await db.users.insert_one(user.dict())
        
        return {
            "user": user.dict(),
            "session_token": session_token
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

# Dashboard routes
@api_router.get("/dashboard")
async def get_dashboard(current_user: User = Depends(get_current_user)):
    # Get user's business essentials
    essentials = await db.business_essentials.find({"user_id": current_user.id}).to_list(100)
    
    # Get user's service requests
    services = await db.service_requests.find({"user_id": current_user.id}).to_list(100)
    
    dashboard_data = {
        "user": current_user.dict(),
        "business_essentials": essentials,
        "service_requests": services,
        "stats": {
            "total_essentials": len(essentials),
            "total_services": len(services),
            "completed_services": len([s for s in services if s["status"] == "completed"])
        }
    }
    
    return dashboard_data

# Business essentials routes
@api_router.get("/business-essentials")
async def get_business_essentials(current_user: User = Depends(get_current_user)):
    essentials = await db.business_essentials.find({"user_id": current_user.id}).to_list(100)
    return essentials

@api_router.post("/business-essentials/generate")
async def generate_business_essentials(current_user: User = Depends(get_current_user)):
    # Generate default business essentials for new users
    essentials = []
    
    # Logo
    logo_essential = BusinessEssential(
        user_id=current_user.id,
        type="logo",
        title="Company Logo",
        description="Professional logo for your startup",
        content="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiByeD0iMTAiIGZpbGw9IiMzQjgyRjYiLz4KPHRleHQgeD0iNTAiIHk9IjU1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TEs8L3RleHQ+Cjwvc3ZnPg=="
    )
    
    # Website
    website_essential = BusinessEssential(
        user_id=current_user.id,
        type="website",
        title="Landing Page",
        description="Professional one-page website for your startup",
        content='<!DOCTYPE html><html><head><title>Your Startup</title><style>body{font-family:Arial,sans-serif;margin:0;padding:0;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;text-align:center;padding:50px}</style></head><body><h1>Welcome to Your Startup</h1><p>Building the future, one step at a time.</p><button style="background:#fff;color:#333;padding:15px 30px;border:none;border-radius:5px;cursor:pointer">Get Started</button></body></html>'
    )
    
    # Social media creative
    social_essential = BusinessEssential(
        user_id=current_user.id,
        type="social_media",
        title="Social Media Post",
        description="Professional social media creative",
        content="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI1MDAiIGhlaWdodD0iNTAwIiBmaWxsPSJsaW5lYXItZ3JhZGllbnQoNDVkZWcsICM2NjdlZWEgMCUsICM3NjRiYTIgMTAwJSkiLz4KPHRleHQgeD0iMjUwIiB5PSIyMDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIzNiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Zb3VyIFN0YXJ0dXA8L3RleHQ+Cjx0ZXh0IHg9IjI1MCIgeT0iMjUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Jbm5vdmF0aW5nIGZvciB0aGUgZnV0dXJlPC90ZXh0Pgo8L3N2Zz4="
    )
    
    essentials = [logo_essential, website_essential, social_essential]
    
    # Insert into database
    for essential in essentials:
        await db.business_essentials.insert_one(essential.dict())
    
    return {"message": "Business essentials generated successfully", "essentials": essentials}

# Service requests routes
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
    service_type: str,
    title: str,
    description: str,
    budget: float,
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

# Admin routes
@api_router.get("/admin/users")
async def get_all_users(current_user: User = Depends(get_user_by_role(UserRole.ADMIN))):
    users = await db.users.find().to_list(1000)
    return users

@api_router.get("/admin/service-requests")
async def get_all_service_requests(current_user: User = Depends(get_user_by_role(UserRole.ADMIN))):
    requests = await db.service_requests.find().to_list(1000)
    return requests

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