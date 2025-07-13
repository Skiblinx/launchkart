from motor.motor_asyncio import AsyncIOMotorClient
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.models.user import User
import os
from datetime import datetime
from jose import jwt

from jose.exceptions import ExpiredSignatureError, JWTError
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from .env file
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Load environment variables with fallbacks
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'launchkart')
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-here')
JWT_ALGORITHM = 'HS256'

# Initialize MongoDB client with error handling
try:
    client = AsyncIOMotorClient(MONGO_URL)
    # Test the connection
    # client.admin.command('ping')
    print(f"✅ Successfully connected to MongoDB at {MONGO_URL}")
except Exception as e:
    print(f"❌ Failed to connect to MongoDB: {e}")
    print("Please ensure MongoDB is running or check your MONGO_URL in .env file")
    print("You can:")
    print("1. Install MongoDB locally")
    print("2. Use MongoDB Atlas (cloud)")
    print("3. Use Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest")
    raise

db = client[DB_NAME]

security = HTTPBearer()

async def get_database():
    """Get database instance for dependency injection"""
    return db

def verify_jwt_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

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
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authentication")

def get_user_by_role(required_role: str):
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role != required_role:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return role_checker 