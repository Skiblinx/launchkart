from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File
from fastapi.responses import FileResponse
from typing import List, Optional, Dict, Any
from datetime import datetime
import base64
from backend.models.investment import EnhancedPitchSubmission
from backend.db import db, get_current_user, get_user_by_role
from bson import ObjectId

router = APIRouter(prefix="/api/investment", tags=["investment"])

def fix_mongo_ids(obj):
    """Recursively convert all ObjectId fields in a dict to strings."""
    if isinstance(obj, list):
        return [fix_mongo_ids(item) for item in obj]
    if isinstance(obj, dict):
        return {k: fix_mongo_ids(v) for k, v in obj.items()}
    if isinstance(obj, ObjectId):
        return str(obj)
    return obj

@router.post("/pitch")
async def submit_pitch(
    company_name: str = Form(...),
    industry: str = Form(...),
    funding_amount: float = Form(...),
    equity_offering: float = Form(...),
    pitch_deck: UploadFile = File(...),
    business_plan: UploadFile = File(None),
    financial_projections: UploadFile = File(None),
    team_info: str = Form(...),  # JSON string
    current_user=Depends(get_current_user)
):
    # Convert uploaded files to base64 and store in files dict
    files = {}
    pitch_deck_content = await pitch_deck.read()
    files["pitch_deck"] = base64.b64encode(pitch_deck_content).decode('utf-8')
    
    if business_plan:
        business_plan_content = await business_plan.read()
        files["business_plan"] = base64.b64encode(business_plan_content).decode('utf-8')
    
    if financial_projections:
        projections_content = await financial_projections.read()
        files["financial_projections"] = base64.b64encode(projections_content).decode('utf-8')
    
    import json
    team_info_dict = json.loads(team_info)
    
    pitch = EnhancedPitchSubmission(
        user_id=current_user.id,
        company_name=company_name,
        industry=industry,
        funding_amount=funding_amount,
        equity_offering=equity_offering,
        team_info=team_info_dict,
        files=files
    )
    
    await db.pitch_submissions.insert_one(pitch.dict())
    return {"message": "Pitch submitted successfully"}

@router.get("/applications")
async def get_investment_applications(current_user=Depends(get_current_user)):
    """Get all investment applications for the current user"""
    applications = await db.pitch_submissions.find({"user_id": current_user.id}).to_list(100)
    applications = fix_mongo_ids(applications)
    return applications

@router.get("/user-applications")
async def get_user_investment_applications(current_user=Depends(get_current_user)):
    applications = await db.pitch_submissions.find({"user_id": current_user.id}).to_list(100)
    applications = fix_mongo_ids(applications)
    return applications

@router.put("/pitch/{pitch_id}/review")
async def review_pitch(
    pitch_id: str,
    review_status: str = Form(...),
    review_notes: str = Form(None),
    current_user=Depends(get_user_by_role("investor"))
):
    valid_statuses = ["under_review", "approved", "rejected", "funded"]
    if review_status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid review status")
    update_data = {
        "review_status": review_status,
        "reviewed_by": current_user.id,
        "reviewed_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    if review_notes:
        update_data["review_notes"] = review_notes
    await db.pitch_submissions.update_one(
        {"id": pitch_id},
        {"$set": update_data}
    )
    return {"message": "Pitch review updated successfully"} 