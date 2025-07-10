from fastapi import APIRouter, Depends
from datetime import datetime
from backend.db import db, get_current_user
from bson import ObjectId

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

def fix_mongo_ids(obj):
    """Recursively convert all ObjectId fields in a dict to strings."""
    if isinstance(obj, list):
        return [fix_mongo_ids(item) for item in obj]
    if isinstance(obj, dict):
        return {k: fix_mongo_ids(v) for k, v in obj.items()}
    if isinstance(obj, ObjectId):
        return str(obj)
    return obj

@router.get("/dashboard")
async def get_analytics_dashboard(current_user=Depends(get_current_user)):
    service_requests = await db.service_requests.find({"user_id": current_user.id}).to_list(1000)
    mentorship_sessions = await db.mentorship_sessions.find({
        "$or": [
            {"mentor_id": current_user.id},
            {"mentee_id": current_user.id}
        ]
    }).to_list(1000)
    investment_apps = await db.pitch_submissions.find({"user_id": current_user.id}).to_list(1000)
    
    # Fix ObjectIds for JSON serialization
    service_requests = fix_mongo_ids(service_requests)
    mentorship_sessions = fix_mongo_ids(mentorship_sessions)
    investment_apps = fix_mongo_ids(investment_apps)
    
    analytics = {
        "services": {
            "total_requests": len(service_requests),
            "pending": len([r for r in service_requests if r.get("status") == "pending"]),
            "in_progress": len([r for r in service_requests if r.get("status") == "in_progress"]),
            "completed": len([r for r in service_requests if r.get("status") == "completed"]),
            "total_spent": sum(r.get("budget", 0) for r in service_requests if r.get("status") == "completed")
        },
        "mentorship": {
            "total_sessions": len(mentorship_sessions),
            "as_mentor": len([s for s in mentorship_sessions if s.get("mentor_id") == current_user.id]),
            "as_mentee": len([s for s in mentorship_sessions if s.get("mentee_id") == current_user.id]),
            "completed_sessions": len([s for s in mentorship_sessions if s.get("status") == "completed"]),
            "total_hours": sum(s.get("duration", 0) for s in mentorship_sessions if s.get("status") == "completed") / 60
        },
        "investment": {
            "total_applications": len(investment_apps),
            "under_review": len([a for a in investment_apps if a.get("review_status") == "under_review"]),
            "approved": len([a for a in investment_apps if a.get("review_status") == "approved"]),
            "funded": len([a for a in investment_apps if a.get("review_status") == "funded"]),
            "total_funding_requested": sum(a.get("funding_amount", 0) for a in investment_apps)
        }
    }
    return analytics

@router.get("/services")
async def get_service_analytics(current_user=Depends(get_current_user)):
    service_requests = await db.service_requests.find({"user_id": current_user.id}).to_list(1000)
    
    # Fix ObjectIds for JSON serialization
    service_requests = fix_mongo_ids(service_requests)
    
    service_breakdown = {}
    for request in service_requests:
        service_type = request.get("service_type", "unknown")
        if service_type not in service_breakdown:
            service_breakdown[service_type] = {
                "count": 0,
                "total_budget": 0,
                "completed": 0,
                "avg_completion_time": 0
            }
        service_breakdown[service_type]["count"] += 1
        service_breakdown[service_type]["total_budget"] += request.get("budget", 0)
        if request.get("status") == "completed":
            service_breakdown[service_type]["completed"] += 1
    return {
        "total_requests": len(service_requests),
        "service_breakdown": service_breakdown,
        "monthly_trend": [],
        "status_distribution": {
            "pending": len([r for r in service_requests if r.get("status") == "pending"]),
            "in_progress": len([r for r in service_requests if r.get("status") == "in_progress"]),
            "completed": len([r for r in service_requests if r.get("status") == "completed"]),
            "cancelled": len([r for r in service_requests if r.get("status") == "cancelled"])
        }
    } 