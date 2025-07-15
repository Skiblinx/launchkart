from fastapi import APIRouter, Depends, HTTPException, Form
from typing import List, Optional
from datetime import datetime
from backend.db import db
from backend.models.admin import Admin
from backend.utils.admin_utils import get_current_admin, require_admin_permission
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin/mentorship", tags=["admin-mentorship"])

def fix_mongo_ids(obj):
    """Recursively convert all ObjectId fields in a dict to strings."""
    if isinstance(obj, list):
        return [fix_mongo_ids(item) for item in obj]
    if isinstance(obj, dict):
        return {k: fix_mongo_ids(v) for k, v in obj.items()}
    if isinstance(obj, ObjectId):
        return str(obj)
    return obj

@router.get("/mentors")
async def get_all_mentors(
    current_admin: Admin = Depends(require_admin_permission("content_moderation"))
):
    """Get all mentors for admin management"""
    try:
        # Aggregate mentors with user data
        pipeline = [
            {
                "$lookup": {
                    "from": "users",
                    "localField": "user_id",
                    "foreignField": "id",
                    "as": "user_data"
                }
            },
            {
                "$addFields": {
                    "user_name": {"$arrayElemAt": ["$user_data.fullName", 0]},
                    "user_email": {"$arrayElemAt": ["$user_data.email", 0]},
                    "status": {"$ifNull": ["$status", "active"]}
                }
            },
            {
                "$project": {
                    "user_data": 0
                }
            },
            {
                "$sort": {"created_at": -1}
            }
        ]
        
        mentors = await db.mentors.aggregate(pipeline).to_list(1000)
        
        return {"data": fix_mongo_ids(mentors)}
        
    except Exception as e:
        logger.error(f"Error fetching mentors: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch mentors")

@router.get("/mentor/{mentor_id}")
async def get_mentor_details(
    mentor_id: str,
    current_admin: Admin = Depends(require_admin_permission("content_moderation"))
):
    """Get detailed mentor information"""
    try:
        # Get mentor data
        mentor = await db.mentors.find_one({"id": mentor_id})
        if not mentor:
            raise HTTPException(status_code=404, detail="Mentor not found")
        
        # Get user data
        user = await db.users.find_one({"id": mentor["user_id"]})
        
        # Get mentor's sessions
        sessions = await db.mentorship_sessions.find({"mentor_id": mentor_id}).to_list(100)
        
        # Get mentor reviews/ratings
        reviews = await db.mentor_reviews.find({"mentor_id": mentor_id}).to_list(100)
        
        mentor_details = {
            "mentor_data": mentor,
            "user_data": user,
            "sessions": sessions,
            "reviews": reviews,
            "session_count": len(sessions),
            "average_rating": sum(r.get("rating", 0) for r in reviews) / len(reviews) if reviews else 0
        }
        
        return {"data": fix_mongo_ids(mentor_details)}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching mentor details for {mentor_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch mentor details")

@router.put("/mentor/{mentor_id}/status")
async def update_mentor_status(
    mentor_id: str,
    status: str = Form(...),
    updated_by: str = Form(...),
    reason: str = Form(""),
    current_admin: Admin = Depends(require_admin_permission("content_moderation"))
):
    """Update mentor status (active, suspended, pending)"""
    try:
        valid_statuses = ["active", "suspended", "pending", "rejected"]
        if status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
        
        # Update mentor status
        update_result = await db.mentors.update_one(
            {"id": mentor_id},
            {
                "$set": {
                    "status": status,
                    "status_updated_by": current_admin.id,
                    "status_updated_at": datetime.utcnow(),
                    "status_reason": reason,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if update_result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Mentor not found")
        
        # Create status change record
        status_record = {
            "id": str(ObjectId()),
            "mentor_id": mentor_id,
            "admin_id": current_admin.id,
            "admin_name": current_admin.fullName,
            "old_status": None,  # Could fetch previous status if needed
            "new_status": status,
            "reason": reason,
            "changed_at": datetime.utcnow()
        }
        
        await db.mentor_status_changes.insert_one(status_record)
        
        # If suspended, cancel all future sessions
        if status == "suspended":
            await db.mentorship_sessions.update_many(
                {
                    "mentor_id": mentor_id,
                    "status": "scheduled",
                    "scheduled_at": {"$gte": datetime.utcnow()}
                },
                {
                    "$set": {
                        "status": "cancelled",
                        "cancellation_reason": "Mentor suspended",
                        "cancelled_by": current_admin.id,
                        "cancelled_at": datetime.utcnow()
                    }
                }
            )
        
        return {"message": f"Mentor status updated to {status}"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating mentor status for {mentor_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update mentor status")

@router.get("/sessions")
async def get_all_sessions(
    status: Optional[str] = None,
    current_admin: Admin = Depends(require_admin_permission("content_moderation"))
):
    """Get all mentorship sessions"""
    try:
        # Build query
        query = {}
        if status:
            query["status"] = status
        
        # Aggregate sessions with mentor and mentee data
        pipeline = [
            {"$match": query},
            {
                "$lookup": {
                    "from": "users",
                    "localField": "mentor_id",
                    "foreignField": "id",
                    "as": "mentor_data"
                }
            },
            {
                "$lookup": {
                    "from": "users",
                    "localField": "mentee_id",
                    "foreignField": "id",
                    "as": "mentee_data"
                }
            },
            {
                "$addFields": {
                    "mentor_name": {"$arrayElemAt": ["$mentor_data.fullName", 0]},
                    "mentor_email": {"$arrayElemAt": ["$mentor_data.email", 0]},
                    "mentee_name": {"$arrayElemAt": ["$mentee_data.fullName", 0]},
                    "mentee_email": {"$arrayElemAt": ["$mentee_data.email", 0]}
                }
            },
            {
                "$project": {
                    "mentor_data": 0,
                    "mentee_data": 0
                }
            },
            {
                "$sort": {"scheduled_at": -1}
            }
        ]
        
        sessions = await db.mentorship_sessions.aggregate(pipeline).to_list(1000)
        
        return {"data": fix_mongo_ids(sessions)}
        
    except Exception as e:
        logger.error(f"Error fetching mentorship sessions: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch mentorship sessions")

@router.get("/session/{session_id}")
async def get_session_details(
    session_id: str,
    current_admin: Admin = Depends(require_admin_permission("content_moderation"))
):
    """Get detailed session information"""
    try:
        session = await db.mentorship_sessions.find_one({"id": session_id})
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Get mentor and mentee data
        mentor = await db.users.find_one({"id": session["mentor_id"]})
        mentee = await db.users.find_one({"id": session["mentee_id"]})
        
        session_details = {
            "session_data": session,
            "mentor_data": mentor,
            "mentee_data": mentee
        }
        
        return {"data": fix_mongo_ids(session_details)}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching session details for {session_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch session details")

@router.put("/session/{session_id}/status")
async def update_session_status(
    session_id: str,
    status: str = Form(...),
    reason: str = Form(""),
    current_admin: Admin = Depends(require_admin_permission("content_moderation"))
):
    """Update session status"""
    try:
        valid_statuses = ["scheduled", "completed", "cancelled", "no_show"]
        if status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
        
        update_data = {
            "status": status,
            "admin_updated_by": current_admin.id,
            "admin_updated_at": datetime.utcnow()
        }
        
        if status == "cancelled":
            update_data["cancellation_reason"] = reason
            update_data["cancelled_by"] = current_admin.id
            update_data["cancelled_at"] = datetime.utcnow()
        
        update_result = await db.mentorship_sessions.update_one(
            {"id": session_id},
            {"$set": update_data}
        )
        
        if update_result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return {"message": f"Session status updated to {status}"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating session status for {session_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update session status")

@router.post("/mentor/{mentor_id}/notify")
async def send_mentor_notification(
    mentor_id: str,
    message: str = Form(...),
    sent_by: str = Form(...),
    current_admin: Admin = Depends(require_admin_permission("content_moderation"))
):
    """Send notification to mentor"""
    try:
        # Get mentor data
        mentor = await db.mentors.find_one({"id": mentor_id})
        if not mentor:
            raise HTTPException(status_code=404, detail="Mentor not found")
        
        # Create notification
        notification = {
            "id": str(ObjectId()),
            "recipient_id": mentor["user_id"],
            "sender_id": current_admin.id,
            "sender_name": current_admin.fullName,
            "type": "admin_notification",
            "title": "Admin Notification",
            "message": message,
            "read": False,
            "created_at": datetime.utcnow()
        }
        
        await db.notifications.insert_one(notification)
        
        return {"message": "Notification sent successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending notification to mentor {mentor_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to send notification")

@router.get("/statistics")
async def get_mentorship_statistics(
    current_admin: Admin = Depends(require_admin_permission("content_moderation"))
):
    """Get mentorship statistics for dashboard"""
    try:
        # Get mentor statistics
        total_mentors = await db.mentors.count_documents({})
        active_mentors = await db.mentors.count_documents({"status": "active"})
        pending_mentors = await db.mentors.count_documents({"status": "pending"})
        suspended_mentors = await db.mentors.count_documents({"status": "suspended"})
        
        # Get session statistics
        total_sessions = await db.mentorship_sessions.count_documents({})
        completed_sessions = await db.mentorship_sessions.count_documents({"status": "completed"})
        scheduled_sessions = await db.mentorship_sessions.count_documents({"status": "scheduled"})
        cancelled_sessions = await db.mentorship_sessions.count_documents({"status": "cancelled"})
        
        # Get top expertise areas
        expertise_pipeline = [
            {"$unwind": "$expertise"},
            {
                "$group": {
                    "_id": "$expertise",
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        
        top_expertise = await db.mentors.aggregate(expertise_pipeline).to_list(10)
        
        # Get average session rating
        rating_pipeline = [
            {
                "$group": {
                    "_id": None,
                    "average_rating": {"$avg": "$rating_mentor"}
                }
            }
        ]
        
        rating_result = await db.mentorship_sessions.aggregate(rating_pipeline).to_list(1)
        average_rating = rating_result[0]["average_rating"] if rating_result else 0
        
        # Get recent activity
        recent_sessions = await db.mentorship_sessions.find().sort([("created_at", -1)]).limit(5).to_list(5)
        recent_mentors = await db.mentors.find().sort([("created_at", -1)]).limit(5).to_list(5)
        
        return {
            "data": {
                "mentor_stats": {
                    "total": total_mentors,
                    "active": active_mentors,
                    "pending": pending_mentors,
                    "suspended": suspended_mentors
                },
                "session_stats": {
                    "total": total_sessions,
                    "completed": completed_sessions,
                    "scheduled": scheduled_sessions,
                    "cancelled": cancelled_sessions,
                    "completion_rate": (completed_sessions / total_sessions * 100) if total_sessions > 0 else 0
                },
                "top_expertise": fix_mongo_ids(top_expertise),
                "average_rating": round(average_rating, 2) if average_rating else 0,
                "recent_activity": {
                    "sessions": fix_mongo_ids(recent_sessions),
                    "mentors": fix_mongo_ids(recent_mentors)
                }
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching mentorship statistics: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch mentorship statistics")

@router.get("/reports/mentor-performance")
async def get_mentor_performance_report(
    current_admin: Admin = Depends(require_admin_permission("content_moderation"))
):
    """Get mentor performance report"""
    try:
        # Get mentor performance data
        pipeline = [
            {
                "$lookup": {
                    "from": "mentorship_sessions",
                    "localField": "id",
                    "foreignField": "mentor_id",
                    "as": "sessions"
                }
            },
            {
                "$addFields": {
                    "session_count": {"$size": "$sessions"},
                    "completed_sessions": {
                        "$size": {
                            "$filter": {
                                "input": "$sessions",
                                "cond": {"$eq": ["$$this.status", "completed"]}
                            }
                        }
                    },
                    "average_rating": {
                        "$avg": {
                            "$map": {
                                "input": {
                                    "$filter": {
                                        "input": "$sessions",
                                        "cond": {"$ne": ["$$this.rating_mentor", None]}
                                    }
                                },
                                "as": "session",
                                "in": "$$session.rating_mentor"
                            }
                        }
                    }
                }
            },
            {
                "$lookup": {
                    "from": "users",
                    "localField": "user_id",
                    "foreignField": "id",
                    "as": "user_data"
                }
            },
            {
                "$addFields": {
                    "user_name": {"$arrayElemAt": ["$user_data.fullName", 0]},
                    "user_email": {"$arrayElemAt": ["$user_data.email", 0]}
                }
            },
            {
                "$project": {
                    "sessions": 0,
                    "user_data": 0
                }
            },
            {
                "$sort": {"session_count": -1}
            }
        ]
        
        mentor_performance = await db.mentors.aggregate(pipeline).to_list(100)
        
        return {"data": fix_mongo_ids(mentor_performance)}
        
    except Exception as e:
        logger.error(f"Error generating mentor performance report: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate mentor performance report")

@router.post("/bulk-action")
async def execute_bulk_mentor_action(
    action: str = Form(...),
    mentor_ids: List[str] = Form(...),
    reason: str = Form(""),
    current_admin: Admin = Depends(require_admin_permission("content_moderation"))
):
    """Execute bulk action on multiple mentors"""
    try:
        if action == "approve_all":
            await db.mentors.update_many(
                {"id": {"$in": mentor_ids}},
                {
                    "$set": {
                        "status": "active",
                        "status_updated_by": current_admin.id,
                        "status_updated_at": datetime.utcnow(),
                        "status_reason": reason or "Bulk approved"
                    }
                }
            )
            
        elif action == "suspend_all":
            await db.mentors.update_many(
                {"id": {"$in": mentor_ids}},
                {
                    "$set": {
                        "status": "suspended",
                        "status_updated_by": current_admin.id,
                        "status_updated_at": datetime.utcnow(),
                        "status_reason": reason or "Bulk suspended"
                    }
                }
            )
            
            # Cancel future sessions for suspended mentors
            await db.mentorship_sessions.update_many(
                {
                    "mentor_id": {"$in": mentor_ids},
                    "status": "scheduled",
                    "scheduled_at": {"$gte": datetime.utcnow()}
                },
                {
                    "$set": {
                        "status": "cancelled",
                        "cancellation_reason": "Mentor suspended",
                        "cancelled_by": current_admin.id,
                        "cancelled_at": datetime.utcnow()
                    }
                }
            )
            
        else:
            raise HTTPException(status_code=400, detail="Invalid bulk action")
        
        return {"message": f"Bulk action '{action}' executed successfully for {len(mentor_ids)} mentors"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error executing bulk action {action}: {e}")
        raise HTTPException(status_code=500, detail="Failed to execute bulk action")