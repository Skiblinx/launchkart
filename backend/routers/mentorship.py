from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File
from typing import List, Optional, Dict, Any
from datetime import datetime
import base64
from backend.models.mentor import EnhancedMentor, EnhancedMentorshipSession
from backend.db import db, get_current_user, get_user_by_role
from bson import ObjectId

router = APIRouter(prefix="/api/mentorship", tags=["mentorship"])

def fix_mongo_ids(obj):
    """Recursively convert all ObjectId fields in a dict to strings."""
    if isinstance(obj, list):
        return [fix_mongo_ids(item) for item in obj]
    if isinstance(obj, dict):
        return {k: fix_mongo_ids(v) for k, v in obj.items()}
    if isinstance(obj, ObjectId):
        return str(obj)
    return obj

@router.post("/profile")
async def create_mentor_profile(
    expertise: List[str] = Form(...),
    experience_years: int = Form(...),
    hourly_rate: float = Form(...),
    bio: str = Form(...),
    languages: List[str] = Form([]),
    company: Optional[str] = Form(None),
    achievements: List[str] = Form([]),
    current_user=Depends(get_current_user)
):
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

@router.get("/mentors")
async def get_mentors():
    """Get all available mentors"""
    mentors = await db.mentors.find({}).to_list(100)
    mentors = fix_mongo_ids(mentors)
    return mentors

@router.post("/book")
async def book_session(
    mentor_id: str = Form(...),
    scheduled_at: str = Form(...),
    duration: int = Form(...),
    agenda: str = Form(None),
    current_user=Depends(get_current_user)
):
    session = EnhancedMentorshipSession(
        mentor_id=mentor_id,
        mentee_id=current_user.id,
        scheduled_at=datetime.fromisoformat(scheduled_at.replace('Z', '+00:00')),
        duration=duration,
        agenda=agenda
    )
    await db.mentorship_sessions.insert_one(session.dict())
    return {"message": "Session booked successfully"}

@router.get("/sessions")
async def get_user_sessions(current_user=Depends(get_current_user)):
    """Get all mentorship sessions for the current user"""
    sessions = await db.mentorship_sessions.find({
        "$or": [
            {"mentor_id": current_user.id},
            {"mentee_id": current_user.id}
        ]
    }).to_list(100)
    sessions = fix_mongo_ids(sessions)
    return sessions

@router.get("/user-sessions")
async def get_user_mentorship_sessions(current_user=Depends(get_current_user)):
    sessions = await db.mentorship_sessions.find({
        "$or": [
            {"mentor_id": current_user.id},
            {"mentee_id": current_user.id}
        ]
    }).to_list(100)
    sessions = fix_mongo_ids(sessions)
    return sessions 