from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File
from typing import List, Optional, Dict, Any
from datetime import datetime
import base64
from backend.models.service import EnhancedServiceRequest
from backend.db import db, get_current_user, get_user_by_role
from bson import ObjectId

router = APIRouter(prefix="/api/services", tags=["services"])

def fix_mongo_ids(obj):
    """Recursively convert all ObjectId fields in a dict to strings."""
    if isinstance(obj, list):
        return [fix_mongo_ids(item) for item in obj]
    if isinstance(obj, dict):
        return {k: fix_mongo_ids(v) for k, v in obj.items()}
    if isinstance(obj, ObjectId):
        return str(obj)
    return obj

@router.post("/request")
async def create_service_request(
    service_type: str = Form(...),
    title: str = Form(...),
    description: str = Form(...),
    budget: float = Form(...),
    timeline: str = Form(None),
    additional_notes: str = Form(None),
    files: List[UploadFile] = File(None),
    current_user=Depends(get_current_user)
):
    uploaded_files = []
    if files:
        for file in files:
            if file.filename:
                file_content = await file.read()
                file_data = base64.b64encode(file_content).decode('utf-8')
                uploaded_files.append({
                    'filename': file.filename,
                    'content_type': file.content_type,
                    'data': file_data
                })
    service_request = EnhancedServiceRequest(
        user_id=current_user.id,
        service_type=service_type,
        title=title,
        description=description,
        budget=budget,
        timeline=timeline,
        additional_notes=additional_notes,
        files=uploaded_files
    )
    await db.service_requests.insert_one(service_request.dict())
    return {"message": "Service request created successfully", "request": service_request}

@router.get("/service-requests")
async def get_service_requests(current_user=Depends(get_current_user)):
    """Get all service requests for the current user"""
    requests = await db.service_requests.find({"user_id": current_user.id}).to_list(100)
    # Fix ObjectIds for JSON serialization
    requests = fix_mongo_ids(requests)
    return requests

@router.get("/user-requests")
async def get_user_service_requests(current_user=Depends(get_current_user)):
    requests = await db.service_requests.find({"user_id": current_user.id}).to_list(100)
    # Fix ObjectIds for JSON serialization
    requests = fix_mongo_ids(requests)
    return requests

@router.put("/{request_id}/status")
async def update_service_request_status(
    request_id: str,
    status: str = Form(...),
    notes: str = Form(None),
    current_user=Depends(get_user_by_role("admin"))
):
    update_data = {
        "status": status,
        "updated_at": datetime.utcnow()
    }
    if notes:
        update_data["status_notes"] = notes
    await db.service_requests.update_one(
        {"id": request_id},
        {"$set": update_data}
    )
    return {"message": "Service request status updated"} 