from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File
from fastapi.responses import FileResponse
from typing import Optional
from datetime import datetime, timedelta
import os
import shutil
from backend.models.user import User, UserProfile
from backend.db import db, get_current_user
from passlib.context import CryptContext
import uuid
from jose import jwt


router = APIRouter(prefix="/api/users", tags=["users"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-here')
JWT_ALGORITHM = "HS256"

@router.put("/profile")
async def update_user_profile(
    fullName: Optional[str] = Form(None),
    phoneNumber: Optional[str] = Form(None),
    businessStage: Optional[str] = Form(None),
    bio: Optional[str] = Form(None),
    website: Optional[str] = Form(None),
    linkedin: Optional[str] = Form(None),
    twitter: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user)
):
    update_data = {"updated_at": datetime.utcnow()}
    if fullName is not None:
        update_data["fullName"] = fullName  # type: ignore
    if phoneNumber is not None:
        update_data["phoneNumber"] = phoneNumber  # type: ignore
    if businessStage is not None:
        update_data["businessStage"] = businessStage  # type: ignore
    if bio is not None:
        update_data["bio"] = bio  # type: ignore
    if website is not None:
        update_data["website"] = website  # type: ignore
    if linkedin is not None:
        update_data["linkedin"] = linkedin  # type: ignore
    if twitter is not None:
        update_data["twitter"] = twitter  # type: ignore
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": update_data}
    )
    return {"message": "Profile updated successfully"}

@router.post("/profile/picture")
async def upload_profile_picture(
    picture: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    if not picture or not picture.content_type or not picture.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    upload_dir = "uploads/profiles"
    os.makedirs(upload_dir, exist_ok=True)
    file_extension = picture.filename.split('.')[-1] if picture.filename else 'jpg'
    filename = f"{current_user.id}_{int(datetime.utcnow().timestamp())}.{file_extension}"
    file_path = os.path.join(upload_dir, filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(picture.file, buffer)
    picture_url = f"/uploads/profiles/{filename}"
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"picture": picture_url, "updated_at": datetime.utcnow()}}
    )
    return {"message": "Profile picture updated successfully", "picture_url": picture_url} 