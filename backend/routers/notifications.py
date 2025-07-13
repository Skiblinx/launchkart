from fastapi import APIRouter, Depends, HTTPException, Form
from typing import Optional
from datetime import datetime
from backend.models.notification import Notification
from backend.db import db, get_current_user, get_user_by_role
from bson import ObjectId

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

def fix_mongo_ids(obj):
    """Recursively convert all ObjectId fields in a dict to strings."""
    if isinstance(obj, list):
        return [fix_mongo_ids(item) for item in obj]
    if isinstance(obj, dict):
        return {k: fix_mongo_ids(v) for k, v in obj.items()}
    if isinstance(obj, ObjectId):
        return str(obj)
    return obj

@router.get("")
async def get_notifications(current_user=Depends(get_current_user)):
    notifications = await db.notifications.find({
        "user_id": current_user.id,
        "read": False
    }).sort("created_at", -1).to_list(50)
    
    # Fix ObjectIds for JSON serialization
    notifications = fix_mongo_ids(notifications)
    return notifications

@router.post("")
async def create_notification(
    user_id: str = Form(...),
    title: str = Form(...),
    message: str = Form(...),
    type: str = Form("info"),
    action_url: str = Form(None),
    current_user=Depends(get_user_by_role("admin"))
):
    notification = {
        "id": str(datetime.utcnow().timestamp()),
        "user_id": user_id,
        "title": title,
        "message": message,
        "type": type,
        "action_url": action_url,
        "read": False,
        "created_at": datetime.utcnow()
    }
    await db.notifications.insert_one(notification)
    return {"message": "Notification created successfully"}

@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user=Depends(get_current_user)
):
    await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user.id},
        {"$set": {"read": True, "read_at": datetime.utcnow()}}
    )
    return {"message": "Notification marked as read"} 