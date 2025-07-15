from fastapi import APIRouter, Depends, HTTPException, Form
from typing import List, Optional
from datetime import datetime
from backend.db import db
from backend.models.admin import Admin
from backend.utils.admin_utils import get_current_admin, require_admin_permission
from bson import ObjectId
import logging
 
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin/investment", tags=["admin-investment"])

def fix_mongo_ids(obj):
    """Recursively convert all ObjectId fields in a dict to strings."""
    if isinstance(obj, list):
        return [fix_mongo_ids(item) for item in obj]
    if isinstance(obj, dict):
        return {k: fix_mongo_ids(v) for k, v in obj.items()}
    if isinstance(obj, ObjectId):
        return str(obj)
    return obj

@router.get("/pitches")
async def get_all_pitches(
    status: Optional[str] = None,
    industry: Optional[str] = None,
    current_admin: Admin = Depends(require_admin_permission("payment_management"))
):
    """Get all pitch submissions for admin review"""
    try:
        # Build query
        query = {}
        if status:
            query["review_status"] = status
        if industry:
            query["industry"] = industry
        
        # Aggregate pitches with user data
        match_stage = {"$match": query} if query else {"$match": {}}
        
        pipeline = [
            match_stage,
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
                    "phone_number": {"$arrayElemAt": ["$user_data.phoneNumber", 0]},
                    "country": {"$arrayElemAt": ["$user_data.country", 0]}
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
        
        pitches = await db.pitch_submissions.aggregate(pipeline).to_list(1000)
        
        return {"data": fix_mongo_ids(pitches)}
        
    except Exception as e:
        logger.error(f"Error fetching pitch submissions: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch pitch submissions")

@router.get("/pitch/{pitch_id}")
async def get_pitch_details(
    pitch_id: str,
    current_admin: Admin = Depends(require_admin_permission("payment_management"))
):
    """Get detailed pitch information"""
    try:
        pitch = await db.pitch_submissions.find_one({"id": pitch_id})
        if not pitch:
            raise HTTPException(status_code=404, detail="Pitch not found")
        
        # Get user data
        user = await db.users.find_one({"id": pitch["user_id"]})
        
        # Get pitch review history
        reviews = await db.pitch_reviews.find({"pitch_id": pitch_id}).to_list(100)
        
        # Get due diligence data if exists
        due_diligence = await db.due_diligence.find_one({"pitch_id": pitch_id})
        
        pitch_details = {
            "pitch_data": pitch,
            "user_data": user,
            "reviews": reviews,
            "due_diligence": due_diligence
        }
        
        return {"data": fix_mongo_ids(pitch_details)}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching pitch details for {pitch_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch pitch details")

@router.put("/pitch/{pitch_id}/review")
async def review_pitch_submission(
    pitch_id: str,
    review_status: str = Form(...),
    review_notes: str = Form(""),
    current_admin: Admin = Depends(require_admin_permission("payment_management"))
):
    """Review and update pitch submission status"""
    try:
        valid_statuses = ["under_review", "approved", "rejected", "due_diligence", "funded"]
        if review_status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
        
        # Update pitch status
        update_result = await db.pitch_submissions.update_one(
            {"id": pitch_id},
            {
                "$set": {
                    "review_status": review_status,
                    "reviewed_by": current_admin.id,
                    "reviewed_at": datetime.utcnow(),
                    "review_notes": review_notes,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if update_result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Pitch not found")
        
        # Create review record
        review_record = {
            "id": str(ObjectId()),
            "pitch_id": pitch_id,
            "admin_id": current_admin.id,
            "admin_name": current_admin.fullName,
            "status": review_status,
            "notes": review_notes,
            "reviewed_at": datetime.utcnow()
        }
        
        await db.pitch_reviews.insert_one(review_record)
        
        # If approved for due diligence, create due diligence record
        if review_status == "due_diligence":
            due_diligence_record = {
                "id": str(ObjectId()),
                "pitch_id": pitch_id,
                "status": "pending",
                "assigned_to": None,
                "documents_requested": [],
                "documents_received": [],
                "started_at": datetime.utcnow(),
                "created_by": current_admin.id
            }
            await db.due_diligence.insert_one(due_diligence_record)
        
        return {"message": f"Pitch status updated to {review_status}"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reviewing pitch {pitch_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to review pitch")

@router.put("/pitch/{pitch_id}/assign")
async def assign_investor_to_pitch(
    pitch_id: str,
    investor_id: str = Form(...),
    assigned_by: str = Form(...),
    current_admin: Admin = Depends(require_admin_permission("payment_management"))
):
    """Assign an investor to a pitch"""
    try:
        # Update pitch with assigned investor
        update_result = await db.pitch_submissions.update_one(
            {"id": pitch_id},
            {
                "$set": {
                    "assigned_investor": investor_id,
                    "assigned_by": current_admin.id,
                    "assigned_at": datetime.utcnow()
                }
            }
        )
        
        if update_result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Pitch not found")
        
        # Create assignment record
        assignment_record = {
            "id": str(ObjectId()),
            "pitch_id": pitch_id,
            "investor_id": investor_id,
            "assigned_by": current_admin.id,
            "assigned_at": datetime.utcnow(),
            "status": "assigned"
        }
        
        await db.investor_assignments.insert_one(assignment_record)
        
        return {"message": "Investor assigned successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error assigning investor to pitch {pitch_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to assign investor")

@router.get("/investors")
async def get_all_investors(
    current_admin: Admin = Depends(require_admin_permission("payment_management"))
):
    """Get all investors"""
    try:
        # Get users with investor role
        investors = await db.users.find({"role": "investor"}).to_list(1000)
        
        # Get investor profiles
        investor_profiles = await db.investor_profiles.find({}).to_list(1000)
        
        # Merge data
        investor_map = {inv["user_id"]: inv for inv in investor_profiles}
        
        enriched_investors = []
        for investor in investors:
            profile = investor_map.get(investor["id"], {})
            enriched_investor = {
                **investor,
                **profile,
                "name": investor.get("fullName"),
                "email": investor.get("email")
            }
            enriched_investors.append(enriched_investor)
        
        return {"data": fix_mongo_ids(enriched_investors)}
        
    except Exception as e:
        logger.error(f"Error fetching investors: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch investors")

@router.get("/investor/{investor_id}")
async def get_investor_details(
    investor_id: str,
    current_admin: Admin = Depends(require_admin_permission("payment_management"))
):
    """Get detailed investor information"""
    try:
        # Get investor user data
        investor = await db.users.find_one({"id": investor_id, "role": "investor"})
        if not investor:
            raise HTTPException(status_code=404, detail="Investor not found")
        
        # Get investor profile
        profile = await db.investor_profiles.find_one({"user_id": investor_id})
        
        # Get assigned pitches
        assignments = await db.investor_assignments.find({"investor_id": investor_id}).to_list(100)
        
        # Get investment history
        investments = await db.investments.find({"investor_id": investor_id}).to_list(100)
        
        investor_details = {
            "investor_data": investor,
            "profile": profile,
            "assignments": assignments,
            "investments": investments,
            "total_invested": sum(inv.get("amount", 0) for inv in investments),
            "active_deals": len([a for a in assignments if a.get("status") == "active"])
        }
        
        return {"data": fix_mongo_ids(investor_details)}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching investor details for {investor_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch investor details")

@router.get("/deal-flow")
async def get_deal_flow(
    current_admin: Admin = Depends(require_admin_permission("payment_management"))
):
    """Get deal flow pipeline"""
    try:
        # Get pitches grouped by stage
        pipeline = [
            {
                "$group": {
                    "_id": "$review_status",
                    "pitches": {
                        "$push": {
                            "id": "$id",
                            "company_name": "$company_name",
                            "funding_amount": "$funding_amount",
                            "industry": "$industry",
                            "created_at": "$created_at"
                        }
                    },
                    "count": {"$sum": 1},
                    "total_amount": {"$sum": "$funding_amount"}
                }
            }
        ]
        
        deal_flow = await db.pitch_submissions.aggregate(pipeline).to_list(100)
        
        # Structure the data by stages
        stages = {
            "under_review": {"name": "Under Review", "pitches": [], "count": 0, "total_amount": 0},
            "due_diligence": {"name": "Due Diligence", "pitches": [], "count": 0, "total_amount": 0},
            "approved": {"name": "Term Sheet", "pitches": [], "count": 0, "total_amount": 0},
            "funded": {"name": "Funded", "pitches": [], "count": 0, "total_amount": 0}
        }
        
        for stage_data in deal_flow:
            stage = stage_data["_id"]
            if stage in stages:
                stages[stage]["pitches"] = stage_data["pitches"]
                stages[stage]["count"] = stage_data["count"]
                stages[stage]["total_amount"] = stage_data["total_amount"]
        
        return {"data": fix_mongo_ids(stages)}
        
    except Exception as e:
        logger.error(f"Error fetching deal flow: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch deal flow")

@router.get("/statistics")
async def get_investment_statistics(
    current_admin: Admin = Depends(require_admin_permission("payment_management"))
):
    """Get investment statistics for dashboard"""
    try:
        # Get pitch statistics
        total_pitches = await db.pitch_submissions.count_documents({})
        approved_pitches = await db.pitch_submissions.count_documents({"review_status": "approved"})
        funded_pitches = await db.pitch_submissions.count_documents({"review_status": "funded"})
        under_review = await db.pitch_submissions.count_documents({"review_status": "under_review"})
        
        # Get funding statistics
        funding_pipeline = [
            {
                "$group": {
                    "_id": None,
                    "total_requested": {"$sum": "$funding_amount"},
                    "average_ask": {"$avg": "$funding_amount"}
                }
            }
        ]
        
        funding_result = await db.pitch_submissions.aggregate(funding_pipeline).to_list(1)
        funding_stats = funding_result[0] if funding_result else {"total_requested": 0, "average_ask": 0}
        
        # Get industry distribution
        industry_pipeline = [
            {
                "$group": {
                    "_id": "$industry",
                    "count": {"$sum": 1},
                    "total_amount": {"$sum": "$funding_amount"}
                }
            },
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        
        industry_distribution = await db.pitch_submissions.aggregate(industry_pipeline).to_list(10)
        
        # Get monthly trends
        monthly_pipeline = [
            {
                "$group": {
                    "_id": {
                        "year": {"$year": "$created_at"},
                        "month": {"$month": "$created_at"}
                    },
                    "pitches": {"$sum": 1},
                    "funding_requested": {"$sum": "$funding_amount"}
                }
            },
            {"$sort": {"_id.year": -1, "_id.month": -1}},
            {"$limit": 12}
        ]
        
        monthly_trends = await db.pitch_submissions.aggregate(monthly_pipeline).to_list(12)
        
        # Get investor statistics
        total_investors = await db.users.count_documents({"role": "investor"})
        active_investors = await db.investor_assignments.distinct("investor_id")
        
        # Calculate success rate
        success_rate = (funded_pitches / total_pitches * 100) if total_pitches > 0 else 0
        
        return {
            "data": {
                "pitch_stats": {
                    "total": total_pitches,
                    "approved": approved_pitches,
                    "funded": funded_pitches,
                    "under_review": under_review,
                    "success_rate": round(success_rate, 2)
                },
                "funding_stats": {
                    "total_requested": funding_stats["total_requested"],
                    "average_ask": round(funding_stats["average_ask"], 2),
                    "total_funded": 0  # Would need to track actual funded amounts
                },
                "investor_stats": {
                    "total": total_investors,
                    "active": len(active_investors)
                },
                "industry_distribution": fix_mongo_ids(industry_distribution),
                "monthly_trends": fix_mongo_ids(monthly_trends)
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching investment statistics: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch investment statistics")

@router.post("/due-diligence/{pitch_id}")
async def initiate_due_diligence(
    pitch_id: str,
    assigned_to: str = Form(...),
    documents_required: List[str] = Form(...),
    current_admin: Admin = Depends(require_admin_permission("payment_management"))
):
    """Initiate due diligence process for a pitch"""
    try:
        # Check if pitch exists and is approved
        pitch = await db.pitch_submissions.find_one({"id": pitch_id})
        if not pitch:
            raise HTTPException(status_code=404, detail="Pitch not found")
        
        if pitch.get("review_status") != "approved":
            raise HTTPException(status_code=400, detail="Pitch must be approved before due diligence")
        
        # Create due diligence record
        due_diligence = {
            "id": str(ObjectId()),
            "pitch_id": pitch_id,
            "assigned_to": assigned_to,
            "status": "in_progress",
            "documents_requested": documents_required,
            "documents_received": [],
            "started_at": datetime.utcnow(),
            "created_by": current_admin.id,
            "checklist": [
                {"item": "Financial statements review", "completed": False},
                {"item": "Legal documentation check", "completed": False},
                {"item": "Market analysis", "completed": False},
                {"item": "Team background check", "completed": False},
                {"item": "Technology assessment", "completed": False}
            ]
        }
        
        await db.due_diligence.insert_one(due_diligence)
        
        # Update pitch status
        await db.pitch_submissions.update_one(
            {"id": pitch_id},
            {
                "$set": {
                    "review_status": "due_diligence",
                    "due_diligence_started": datetime.utcnow()
                }
            }
        )
        
        return {"message": "Due diligence initiated successfully", "due_diligence_id": due_diligence["id"]}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error initiating due diligence for pitch {pitch_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to initiate due diligence")

@router.get("/reports/funding-pipeline")
async def get_funding_pipeline_report(
    current_admin: Admin = Depends(require_admin_permission("payment_management"))
):
    """Get funding pipeline report"""
    try:
        # Get detailed pipeline data
        pipeline = [
            {
                "$lookup": {
                    "from": "users",
                    "localField": "user_id",
                    "foreignField": "id",
                    "as": "founder"
                }
            },
            {
                "$addFields": {
                    "founder_name": {"$arrayElemAt": ["$founder.fullName", 0]},
                    "founder_email": {"$arrayElemAt": ["$founder.email", 0]}
                }
            },
            {
                "$project": {
                    "founder": 0
                }
            },
            {
                "$sort": {"created_at": -1}
            }
        ]
        
        pipeline_data = await db.pitch_submissions.aggregate(pipeline).to_list(1000)
        
        # Group by stage and calculate metrics
        stage_metrics = {}
        for pitch in pipeline_data:
            stage = pitch.get("review_status", "unknown")
            if stage not in stage_metrics:
                stage_metrics[stage] = {
                    "count": 0,
                    "total_amount": 0,
                    "pitches": []
                }
            
            stage_metrics[stage]["count"] += 1
            stage_metrics[stage]["total_amount"] += pitch.get("funding_amount", 0)
            stage_metrics[stage]["pitches"].append(pitch)
        
        return {"data": fix_mongo_ids(stage_metrics)}
        
    except Exception as e:
        logger.error(f"Error generating funding pipeline report: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate funding pipeline report")

@router.post("/bulk-action")
async def execute_bulk_pitch_action(
    action: str = Form(...),
    pitch_ids: List[str] = Form(...),
    notes: str = Form(""),
    current_admin: Admin = Depends(require_admin_permission("payment_management"))
):
    """Execute bulk action on multiple pitches"""
    try:
        if action == "approve_all":
            await db.pitch_submissions.update_many(
                {"id": {"$in": pitch_ids}},
                {
                    "$set": {
                        "review_status": "approved",
                        "reviewed_by": current_admin.id,
                        "reviewed_at": datetime.utcnow(),
                        "review_notes": notes or "Bulk approved"
                    }
                }
            )
            
        elif action == "reject_all":
            await db.pitch_submissions.update_many(
                {"id": {"$in": pitch_ids}},
                {
                    "$set": {
                        "review_status": "rejected",
                        "reviewed_by": current_admin.id,
                        "reviewed_at": datetime.utcnow(),
                        "review_notes": notes or "Bulk rejected"
                    }
                }
            )
            
        elif action == "move_to_due_diligence":
            await db.pitch_submissions.update_many(
                {"id": {"$in": pitch_ids}},
                {
                    "$set": {
                        "review_status": "due_diligence",
                        "reviewed_by": current_admin.id,
                        "reviewed_at": datetime.utcnow(),
                        "review_notes": notes or "Moved to due diligence"
                    }
                }
            )
            
        else:
            raise HTTPException(status_code=400, detail="Invalid bulk action")
        
        return {"message": f"Bulk action '{action}' executed successfully for {len(pitch_ids)} pitches"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error executing bulk action {action}: {e}")
        raise HTTPException(status_code=500, detail="Failed to execute bulk action")