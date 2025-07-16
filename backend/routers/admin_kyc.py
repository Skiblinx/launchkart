from fastapi import APIRouter, Depends, HTTPException, Form
from typing import List, Optional
from datetime import datetime
from backend.db import db
from backend.models.admin import Admin
from backend.utils.admin_utils import get_current_admin, require_admin_permission
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin/kyc", tags=["admin-kyc"])

def fix_mongo_ids(obj):
    """Recursively convert all ObjectId fields in a dict to strings."""
    if isinstance(obj, list):
        return [fix_mongo_ids(item) for item in obj]
    if isinstance(obj, dict):
        return {k: fix_mongo_ids(v) for k, v in obj.items()}
    if isinstance(obj, ObjectId):
        return str(obj)
    return obj

@router.get("/submissions")
async def get_kyc_submissions(
    current_admin: Admin = Depends(require_admin_permission("kyc_verification"))
):
    """Get all KYC submissions for admin review"""
    try:
        # Aggregate KYC submissions with user data
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
                "$lookup": {
                    "from": "kyc_documents",
                    "localField": "user_id",
                    "foreignField": "user_id",
                    "as": "documents"
                }
            },
            {
                "$addFields": {
                    "user_name": {"$arrayElemAt": ["$user_data.fullName", 0]},
                    "user_email": {"$arrayElemAt": ["$user_data.email", 0]},
                    "phone_number": {"$arrayElemAt": ["$user_data.phoneNumber", 0]},
                    "country": {"$arrayElemAt": ["$user_data.country", 0]},
                    "business_stage": {"$arrayElemAt": ["$user_data.businessStage", 0]},
                    "kyc_level": {"$arrayElemAt": ["$user_data.kyc_level", 0]},
                    "kyc_status": {"$arrayElemAt": ["$user_data.kyc_status", 0]},
                    "created_at": {"$arrayElemAt": ["$user_data.created_at", 0]}
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
        
        # Get all users with KYC data
        submissions = await db.users.aggregate(pipeline).to_list(1000)
        
        # Filter out users without KYC attempts
        submissions = [s for s in submissions if s.get('kyc_level') != 'none' or s.get('documents')]
        
        return {"data": fix_mongo_ids(submissions)}
        
    except Exception as e:
        logger.error(f"Error fetching KYC submissions: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch KYC submissions")

@router.get("/submission/{user_id}")
async def get_kyc_submission(
    user_id: str,
    current_admin: Admin = Depends(require_admin_permission("kyc_verification"))
):
    """Get detailed KYC submission for a specific user"""
    try:
        # Get user data
        user = await db.users.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get KYC documents
        documents = await db.kyc_documents.find({"user_id": user_id}).to_list(100)
        
        # Get KYC review history
        reviews = await db.kyc_reviews.find({"user_id": user_id}).to_list(100)
        
        submission = {
            "user_data": user,
            "documents": documents,
            "reviews": reviews
        }
        
        return {"data": fix_mongo_ids(submission)}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching KYC submission for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch KYC submission")

@router.put("/review/{user_id}")
async def review_kyc_submission(
    user_id: str,
    status: str = Form(...),
    review_notes: str = Form(""),
    current_admin: Admin = Depends(require_admin_permission("kyc_verification"))
):
    """Review and update KYC submission status"""
    try:
        valid_statuses = ["pending", "verified", "rejected"]
        if status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
        
        # Update user KYC status
        update_result = await db.users.update_one(
            {"id": user_id},
            {
                "$set": {
                    "kyc_status": status,
                    "kyc_verified_at": datetime.utcnow() if status == "verified" else None,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if update_result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Create review record
        review_record = {
            "id": str(ObjectId()),
            "user_id": user_id,
            "admin_id": current_admin.id,
            "admin_name": current_admin.fullName,
            "status": status,
            "review_notes": review_notes,
            "reviewed_at": datetime.utcnow()
        }
        
        await db.kyc_reviews.insert_one(review_record)
        
        # Update all related documents status
        await db.kyc_documents.update_many(
            {"user_id": user_id},
            {
                "$set": {
                    "verification_status": status,
                    "verified_at": datetime.utcnow() if status == "verified" else None,
                    "reviewed_by": current_admin.id
                }
            }
        )
        
        return {"message": f"KYC status updated to {status}", "review_id": review_record["id"]}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reviewing KYC submission for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to review KYC submission")

@router.get("/statistics")
async def get_kyc_statistics(
    current_admin: Admin = Depends(require_admin_permission("kyc_verification"))
):
    """Get KYC statistics for dashboard"""
    try:
        # Get total users by KYC level
        pipeline = [
            {
                "$group": {
                    "_id": "$kyc_level",
                    "count": {"$sum": 1}
                }
            }
        ]
        
        level_stats = await db.users.aggregate(pipeline).to_list(100)
        
        # Get users by KYC status
        status_pipeline = [
            {
                "$group": {
                    "_id": "$kyc_status",
                    "count": {"$sum": 1}
                }
            }
        ]
        
        status_stats = await db.users.aggregate(status_pipeline).to_list(100)
        
        # Get recent KYC submissions
        recent_submissions = await db.kyc_reviews.find().sort([("reviewed_at", -1)]).limit(10).to_list(10)
        
        # Get pending submissions count
        pending_count = await db.users.count_documents({"kyc_status": "pending"})
        
        # Get verification rate
        total_users = await db.users.count_documents({})
        verified_users = await db.users.count_documents({"kyc_status": "verified"})
        verification_rate = (verified_users / total_users * 100) if total_users > 0 else 0
        
        return {
            "data": {
                "level_distribution": fix_mongo_ids(level_stats),
                "status_distribution": fix_mongo_ids(status_stats),
                "recent_reviews": fix_mongo_ids(recent_submissions),
                "pending_count": pending_count,
                "verification_rate": round(verification_rate, 2),
                "total_users": total_users,
                "verified_users": verified_users
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching KYC statistics: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch KYC statistics")

@router.get("/document/{document_id}")
async def get_kyc_document(
    document_id: str,
    current_admin: Admin = Depends(require_admin_permission("kyc_verification"))
):
    """Get a specific KYC document"""
    try:
        document = await db.kyc_documents.find_one({"id": document_id})
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return {"data": fix_mongo_ids(document)}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching KYC document {document_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch KYC document")

@router.put("/document/{document_id}/verify")
async def verify_kyc_document(
    document_id: str,
    verification_status: str = Form(...),
    notes: str = Form(""),
    current_admin: Admin = Depends(require_admin_permission("kyc_verification"))
):
    """Verify a specific KYC document"""
    try:
        valid_statuses = ["pending", "verified", "rejected"]
        if verification_status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
        
        update_result = await db.kyc_documents.update_one(
            {"id": document_id},
            {
                "$set": {
                    "verification_status": verification_status,
                    "verification_notes": notes,
                    "verified_at": datetime.utcnow() if verification_status == "verified" else None,
                    "reviewed_by": current_admin.id
                }
            }
        )
        
        if update_result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return {"message": f"Document verification status updated to {verification_status}"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying KYC document {document_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to verify KYC document")

@router.get("/bulk-actions")
async def get_bulk_actions(
    current_admin: Admin = Depends(require_admin_permission("kyc_verification"))
):
    """Get available bulk actions for KYC submissions"""
    return {
        "data": {
            "actions": [
                {"id": "approve_all", "label": "Approve All Selected", "type": "approve"},
                {"id": "reject_all", "label": "Reject All Selected", "type": "reject"},
                {"id": "request_additional", "label": "Request Additional Documents", "type": "request"},
                {"id": "export_data", "label": "Export Selected Data", "type": "export"}
            ]
        }
    }

@router.post("/bulk-action")
async def execute_bulk_action(
    action: str = Form(...),
    user_ids: List[str] = Form(...),
    notes: str = Form(""),
    current_admin: Admin = Depends(require_admin_permission("kyc_verification"))
):
    """Execute bulk action on multiple KYC submissions"""
    try:
        if action == "approve_all":
            # Approve all selected users
            await db.users.update_many(
                {"id": {"$in": user_ids}},
                {
                    "$set": {
                        "kyc_status": "verified",
                        "kyc_verified_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            # Create review records for all
            review_records = []
            for user_id in user_ids:
                review_records.append({
                    "id": str(ObjectId()),
                    "user_id": user_id,
                    "admin_id": current_admin.id,
                    "admin_name": current_admin.fullName,
                    "status": "verified",
                    "review_notes": notes or "Bulk approved",
                    "reviewed_at": datetime.utcnow()
                })
            
            await db.kyc_reviews.insert_many(review_records)
            
        elif action == "reject_all":
            # Reject all selected users
            await db.users.update_many(
                {"id": {"$in": user_ids}},
                {
                    "$set": {
                        "kyc_status": "rejected",
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            # Create review records for all
            review_records = []
            for user_id in user_ids:
                review_records.append({
                    "id": str(ObjectId()),
                    "user_id": user_id,
                    "admin_id": current_admin.id,
                    "admin_name": current_admin.fullName,
                    "status": "rejected",
                    "review_notes": notes or "Bulk rejected",
                    "reviewed_at": datetime.utcnow()
                })
            
            await db.kyc_reviews.insert_many(review_records)
            
        else:
            raise HTTPException(status_code=400, detail="Invalid bulk action")
        
        return {"message": f"Bulk action '{action}' executed successfully for {len(user_ids)} users"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error executing bulk action {action}: {e}")
        raise HTTPException(status_code=500, detail="Failed to execute bulk action")

@router.get("/export")
async def export_kyc_data(
    format: str = "csv",
    status: str = "all",
    current_admin: Admin = Depends(require_admin_permission("kyc_verification"))
):
    """Export KYC data in specified format"""
    try:
        # Build query based on filters
        query = {}
        if status != "all":
            query["kyc_status"] = status
        
        # Get user data
        users = await db.users.find(query).to_list(1000)
        
        if format == "csv":
            # Return CSV data (simplified for demo)
            csv_data = "Name,Email,Country,KYC Level,Status,Created At\n"
            for user in users:
                csv_data += f"{user.get('fullName', '')},{user.get('email', '')},{user.get('country', '')},{user.get('kyc_level', '')},{user.get('kyc_status', '')},{user.get('created_at', '')}\n"
            
            return {"data": csv_data, "format": "csv"}
        
        return {"data": fix_mongo_ids(users), "format": "json"}
        
    except Exception as e:
        logger.error(f"Error exporting KYC data: {e}")
        raise HTTPException(status_code=500, detail="Failed to export KYC data")