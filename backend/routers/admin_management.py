from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
import uuid
import logging
from datetime import datetime, timedelta

from backend.db import get_database
from backend.models.admin import (
    AdminUser, AdminRole, AdminPermission, UserToAdminRequest, 
    AdminUpdateRequest, AdminOTPRequest, AdminOTPVerify,
    KYCUpdateRequest, ServiceRequestUpdate, MaintenanceModeRequest
)
from backend.utils.admin_utils import (
    generate_otp, create_admin_jwt_token, require_admin_permission,
    get_current_admin_enhanced, send_otp_email, send_admin_promotion_email,
    otp_storage
)

router = APIRouter(prefix="/api/admin/manage", tags=["admin-management"])
logger = logging.getLogger(__name__)

@router.get("/eligible-users")
async def get_eligible_users(
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    current_admin = Depends(require_admin_permission(AdminPermission.ADMIN_MANAGEMENT)),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get users who can be promoted to admin"""
    try:
        admin_users_cursor = db.admin_users.find({"is_active": True}, {"email": 1})
        admin_emails = {admin["email"] async for admin in admin_users_cursor}
        
        query = {
            "email": {"$nin": list(admin_emails)},
            "kyc_status": "verified"
        }
        
        if search:
            query["$or"] = [
                {"fullName": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}}
            ]
        
        total = await db.users.count_documents(query)
        skip = (page - 1) * limit
        users_cursor = db.users.find(query).skip(skip).limit(limit).sort("created_at", -1)
        users = await users_cursor.to_list(limit)
        
        for user in users:
            if "_id" in user:
                del user["_id"]
            if "password_hash" in user:
                del user["password_hash"]
        
        return {
            "users": users,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit
        }
        
    except Exception as e:
        logger.error(f"Error fetching eligible users: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch eligible users")

@router.post("/promote-user")
async def promote_user_to_admin(
    request: UserToAdminRequest,
    background_tasks: BackgroundTasks,
    current_admin = Depends(require_admin_permission(AdminPermission.ADMIN_MANAGEMENT)),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Promote an existing user to admin"""
    try:
        user = await db.users.find_one({"id": request.user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        existing_admin = await db.admin_users.find_one({"email": user["email"]})
        if existing_admin:
            raise HTTPException(status_code=400, detail="User is already an admin")
        
        if user.get("kyc_status") != "verified":
            raise HTTPException(status_code=400, detail="User must have verified KYC to become admin")
        
        admin_user = AdminUser(
            id=str(uuid.uuid4()),
            email=user["email"],
            full_name=user["fullName"],
            role=request.role,
            permissions=request.permissions,
            is_active=True,
            created_by=current_admin.email,
            created_at=datetime.utcnow()
        )
        
        await db.admin_users.insert_one(admin_user.dict())
        
        await db.users.update_one(
            {"id": request.user_id},
            {"$set": {
                "admin_role": request.role,
                "updated_at": datetime.utcnow()
            }}
        )
        
        background_tasks.add_task(
            send_admin_promotion_email,
            user["email"],
            user["fullName"],
            request.role,
            current_admin.email
        )
        
        audit_log = {
            "id": str(uuid.uuid4()),
            "admin_email": current_admin.email,
            "action": "user_promoted_to_admin",
            "resource_type": "admin_user",
            "resource_id": request.user_id,
            "details": {
                "promoted_user_email": user["email"],
                "promoted_user_name": user["fullName"],
                "new_role": request.role,
                "permissions": request.permissions
            },
            "timestamp": datetime.utcnow()
        }
        await db.admin_audit_logs.insert_one(audit_log)
        
        return {
            "message": "User promoted to admin successfully",
            "admin_id": admin_user.id,
            "user_email": user["email"],
            "role": request.role
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error promoting user to admin: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to promote user to admin")

@router.get("/dashboard")
async def get_admin_dashboard(
    current_admin = Depends(get_current_admin_enhanced),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get admin dashboard data"""
    try:
        # Get real statistics from database
        total_users = await db.users.count_documents({})
        total_service_requests = await db.service_requests.count_documents({})
        pending_kyc = await db.users.count_documents({"kyc_status": "pending"})
        
        # Calculate total revenue from payments
        revenue_pipeline = [
            {"$match": {"status": "completed"}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]
        revenue_result = await db.payments.aggregate(revenue_pipeline).to_list(1)
        total_revenue = revenue_result[0]["total"] if revenue_result else 0
        
        # Get recent users
        recent_users_cursor = db.users.find().sort("created_at", -1).limit(5)
        recent_users = await recent_users_cursor.to_list(5)
        
        # Clean up user data
        for user in recent_users:
            if "_id" in user:
                del user["_id"]
            if "password_hash" in user:
                del user["password_hash"]
            user["created_at"] = user["created_at"].isoformat()
        
        return {
            "stats": {
                "total_users": total_users,
                "total_service_requests": total_service_requests,
                "total_revenue": total_revenue,
                "pending_kyc": pending_kyc
            },
            "recent_users": recent_users,
            "permissions": current_admin.permissions
        }
        
    except Exception as e:
        logger.error(f"Error fetching admin dashboard: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch dashboard data")

@router.get("/users")
async def get_admin_users(
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    kyc_status: Optional[str] = None,
    current_admin = Depends(require_admin_permission(AdminPermission.USER_MANAGEMENT)),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get users for admin management"""
    try:
        # Build query filter
        query = {}
        if search:
            query["$or"] = [
                {"fullName": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}}
            ]
        if kyc_status and kyc_status != "all":
            query["kyc_status"] = kyc_status
        
        # Get total count
        total = await db.users.count_documents(query)
        
        # Get paginated users
        skip = (page - 1) * limit
        users_cursor = db.users.find(query).skip(skip).limit(limit).sort("created_at", -1)
        users = await users_cursor.to_list(limit)
        
        # Clean up user data
        for user in users:
            if "_id" in user:
                del user["_id"]
            if "password_hash" in user:
                del user["password_hash"]
            user["created_at"] = user["created_at"].isoformat()
        
        return {
            "users": users,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit
        }
        
    except Exception as e:
        logger.error(f"Error fetching users: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch users")

@router.put("/users/{user_id}/kyc")
async def update_user_kyc(
    user_id: str,
    request: KYCUpdateRequest,
    current_admin = Depends(require_admin_permission(AdminPermission.KYC_APPROVAL)),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update user KYC status"""
    try:
        # Update user KYC status
        update_data = {
            "kyc_status": request.status,
            "updated_at": datetime.utcnow()
        }
        
        if request.status == "verified":
            update_data["kyc_verified_at"] = datetime.utcnow()
        elif request.status == "failed":
            update_data["kyc_verified_at"] = None
        
        await db.users.update_one(
            {"id": user_id},
            {"$set": update_data}
        )
        
        # Create audit log
        audit_log = {
            "id": str(uuid.uuid4()),
            "admin_email": current_admin.email,
            "action": "kyc_status_updated",
            "resource_type": "user",
            "resource_id": user_id,
            "details": {
                "new_status": request.status,
                "notes": request.notes
            },
            "timestamp": datetime.utcnow()
        }
        await db.admin_audit_logs.insert_one(audit_log)
        
        logger.info(f"KYC status updated for user {user_id} to {request.status} by {current_admin.email}")
        
        return {"message": f"KYC status updated to {request.status}"}
        
    except Exception as e:
        logger.error(f"Error updating KYC status: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update KYC status")

@router.get("/service-requests")
async def get_admin_service_requests(
    page: int = 1,
    limit: int = 20,
    status: Optional[str] = None,
    current_admin = Depends(require_admin_permission(AdminPermission.SERVICE_APPROVAL)),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get service requests for admin management"""
    try:
        # Build query filter
        query = {}
        if status and status != "all":
            query["status"] = status
        
        # Get total count
        total = await db.service_requests.count_documents(query)
        
        # Get paginated requests with user information
        skip = (page - 1) * limit
        pipeline = [
            {"$match": query},
            {
                "$lookup": {
                    "from": "users",
                    "localField": "user_id",
                    "foreignField": "id",
                    "as": "user"
                }
            },
            {"$unwind": "$user"},
            {
                "$project": {
                    "id": 1,
                    "user_id": 1,
                    "user_name": "$user.fullName",
                    "title": 1,
                    "service_type": 1,
                    "description": 1,
                    "budget": 1,
                    "status": 1,
                    "assigned_to": 1,
                    "created_at": 1
                }
            },
            {"$sort": {"created_at": -1}},
            {"$skip": skip},
            {"$limit": limit}
        ]
        
        requests_cursor = db.service_requests.aggregate(pipeline)
        requests = await requests_cursor.to_list(limit)
        
        # Clean up data
        for req in requests:
            if "_id" in req:
                del req["_id"]
            req["created_at"] = req["created_at"].isoformat()
        
        return {
            "requests": requests,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit
        }
        
    except Exception as e:
        logger.error(f"Error fetching service requests: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch service requests")

@router.put("/service-requests/{request_id}")
async def update_service_request(
    request_id: str,
    request: ServiceRequestUpdate,
    current_admin = Depends(require_admin_permission(AdminPermission.SERVICE_APPROVAL)),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update service request status"""
    try:
        # Update service request
        update_data = {
            "status": request.status,
            "updated_at": datetime.utcnow()
        }
        
        if request.assigned_to:
            update_data["assigned_to"] = request.assigned_to
        
        await db.service_requests.update_one(
            {"id": request_id},
            {"$set": update_data}
        )
        
        # Create audit log
        audit_log = {
            "id": str(uuid.uuid4()),
            "admin_email": current_admin.email,
            "action": "service_request_updated",
            "resource_type": "service_request",
            "resource_id": request_id,
            "details": {
                "new_status": request.status,
                "assigned_to": request.assigned_to,
                "notes": request.notes
            },
            "timestamp": datetime.utcnow()
        }
        await db.admin_audit_logs.insert_one(audit_log)
        
        logger.info(f"Service request {request_id} updated to {request.status} by {current_admin.email}")
        
        return {"message": f"Service request updated to {request.status}"}
        
    except Exception as e:
        logger.error(f"Error updating service request: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update service request")

@router.get("/analytics")
async def get_admin_analytics(
    period: str = "7d",  # 7d, 30d, 90d, 1y
    current_admin = Depends(require_admin_permission(AdminPermission.ANALYTICS_ACCESS)),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get analytics data"""
    try:
        # Calculate period dates
        end_date = datetime.utcnow()
        if period == "7d":
            start_date = end_date - timedelta(days=7)
        elif period == "30d":
            start_date = end_date - timedelta(days=30)
        elif period == "90d":
            start_date = end_date - timedelta(days=90)
        elif period == "1y":
            start_date = end_date - timedelta(days=365)
        else:
            start_date = end_date - timedelta(days=7)
        
        # Get user growth data
        user_growth_pipeline = [
            {
                "$match": {
                    "created_at": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$group": {
                    "_id": {
                        "$dateToString": {
                            "format": "%Y-%m-%d",
                            "date": "$created_at"
                        }
                    },
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"_id": 1}}
        ]
        
        user_growth_data = await db.users.aggregate(user_growth_pipeline).to_list(100)
        
        # Get revenue data
        revenue_pipeline = [
            {
                "$match": {
                    "status": "completed",
                    "created_at": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$group": {
                    "_id": {
                        "$dateToString": {
                            "format": "%Y-%m-%d",
                            "date": "$created_at"
                        }
                    },
                    "amount": {"$sum": "$amount"}
                }
            },
            {"$sort": {"_id": 1}}
        ]
        
        revenue_data = await db.payments.aggregate(revenue_pipeline).to_list(100)
        
        # Get service request statistics
        total_requests = await db.service_requests.count_documents({})
        completed_requests = await db.service_requests.count_documents({"status": "completed"})
        pending_requests = await db.service_requests.count_documents({"status": "pending"})
        completion_rate = (completed_requests / total_requests * 100) if total_requests > 0 else 0
        
        analytics = {
            "user_growth": {
                "total": await db.users.count_documents({}),
                "growth_rate": 12.5,  # This would need more complex calculation
                "period_data": [
                    {"date": item["_id"], "count": item["count"]}
                    for item in user_growth_data
                ]
            },
            "revenue": {
                "total": sum(item["amount"] for item in revenue_data),
                "growth_rate": 15.2,  # This would need more complex calculation
                "period_data": [
                    {"date": item["_id"], "amount": item["amount"]}
                    for item in revenue_data
                ]
            },
            "service_requests": {
                "total": total_requests,
                "completed": completed_requests,
                "pending": pending_requests,
                "completion_rate": round(completion_rate, 1)
            }
        }
        
        return analytics
        
    except Exception as e:
        logger.error(f"Error fetching analytics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch analytics")

@router.get("/system/health")
async def get_system_health(
    current_admin = Depends(require_admin_permission(AdminPermission.SYSTEM_CONFIGURATION)),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get system health status"""
    try:
        # Check database health
        start_time = datetime.utcnow()
        await db.users.find_one({})
        db_response_time = (datetime.utcnow() - start_time).total_seconds() * 1000
        
        # Check email service (mock for now)
        email_status = "healthy"
        try:
            # You could add actual email service check here
            pass
        except:
            email_status = "unhealthy"
        
        # Check payment gateway (mock for now)
        payment_status = "healthy"
        try:
            # You could add actual payment gateway check here
            pass
        except:
            payment_status = "unhealthy"
        
        health_status = {
            "database": {
                "status": "healthy",
                "response_time": f"{db_response_time:.0f}ms"
            },
            "api": {
                "status": "healthy",
                "response_time": "5ms"
            },
            "email_service": {
                "status": email_status,
                "last_sent": datetime.utcnow().isoformat()
            },
            "payment_gateway": {
                "status": payment_status,
                "last_transaction": datetime.utcnow().isoformat()
            },
            "storage": {
                "status": "healthy",
                "usage": "45%"
            }
        }
        
        return health_status
        
    except Exception as e:
        logger.error(f"Error checking system health: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to check system health")

@router.post("/system/maintenance")
async def toggle_maintenance_mode(
    request: MaintenanceModeRequest,
    current_admin = Depends(require_admin_permission(AdminPermission.SYSTEM_CONFIGURATION)),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Toggle maintenance mode"""
    try:
        # Store maintenance mode status in database
        await db.system_settings.update_one(
            {"key": "maintenance_mode"},
            {
                "$set": {
                    "value": request.enable,
                    "message": request.message,
                    "updated_by": current_admin.email,
                    "updated_at": datetime.utcnow()
                }
            },
            upsert=True
        )
        
        # Create audit log
        audit_log = {
            "id": str(uuid.uuid4()),
            "admin_email": current_admin.email,
            "action": "maintenance_mode_toggled",
            "resource_type": "system",
            "resource_id": "maintenance_mode",
            "details": {
                "enabled": request.enable,
                "message": request.message
            },
            "timestamp": datetime.utcnow()
        }
        await db.admin_audit_logs.insert_one(audit_log)
        
        status = "enabled" if request.enable else "disabled"
        logger.info(f"Maintenance mode {status} by {current_admin.email}")
        
        return {
            "message": f"Maintenance mode {status}",
            "maintenance_message": request.message
        }
        
    except Exception as e:
        logger.error(f"Error toggling maintenance mode: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to toggle maintenance mode")

@router.post("/auth/request-otp")
async def request_admin_otp_enhanced(
    request: AdminOTPRequest, 
    background_tasks: BackgroundTasks,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Request OTP for admin login"""
    email = request.email.lower()
    
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=403, detail="User not found in the platform")
    
    admin = await db.admin_users.find_one({"email": email, "is_active": True})
    if not admin:
        raise HTTPException(status_code=403, detail="User is not an admin")
    
    otp = generate_otp()
    
    otp_storage[email] = {
        "otp": otp,
        "expires_at": datetime.utcnow() + timedelta(minutes=10),
        "attempts": 0
    }
    
    background_tasks.add_task(send_otp_email, email, otp, admin["full_name"])
    
    return {
        "message": "OTP sent successfully",
        "role": admin["role"],
        "expires_in": 600
    }

@router.post("/auth/verify-otp")
async def verify_admin_otp(
    request: AdminOTPVerify,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Verify OTP and return admin JWT token"""
    email = request.email.lower()
    
    if email not in otp_storage:
        raise HTTPException(status_code=400, detail="OTP not found or expired")
    
    otp_data = otp_storage[email]
    
    if datetime.utcnow() > otp_data["expires_at"]:
        del otp_storage[email]
        raise HTTPException(status_code=400, detail="OTP expired")
    
    if otp_data["attempts"] >= 3:
        del otp_storage[email]
        raise HTTPException(status_code=400, detail="Too many failed attempts")
    
    if otp_data["otp"] != request.otp:
        otp_data["attempts"] += 1
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    admin = await db.admin_users.find_one({"email": email, "is_active": True})
    if not admin:
        raise HTTPException(status_code=403, detail="Admin access denied")
    
    token_data = {
        "email": admin["email"],
        "role": admin["role"],
        "permissions": admin["permissions"]
    }
    token = create_admin_jwt_token(token_data)
    
    del otp_storage[email]
    
    await db.admin_users.update_one(
        {"email": email},
        {
            "$set": {"last_login": datetime.utcnow()},
            "$inc": {"login_count": 1}
        }
    )
    
    return {
        "message": "Admin login successful",
        "token": token,
        "admin": {
            "email": admin["email"],
            "role": admin["role"],
            "permissions": admin["permissions"],
            "fullName": admin["full_name"]
        }
    }

@router.get("/me")
async def get_current_admin_profile(
    current_admin = Depends(get_current_admin_enhanced)
):
    """Get current admin profile"""
    return current_admin 