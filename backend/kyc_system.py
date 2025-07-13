import os
import uuid
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List
from fastapi import HTTPException, Request, Depends, Query
import logging
import hmac
import hashlib
from functools import wraps

# 1. KYC Indexes
kyc_indexes = [
    ("users", [("email", 1)]),
    ("users", [("kyc_level", 1), ("kyc_status", 1)]),
    ("users", [("country", 1)]),
    ("kyc_documents", [("user_id", 1), ("document_type", 1)]),
    ("kyc_documents", [("verification_status", 1)]),
    ("kyc_documents", [("created_at", -1)]),
    ("kyc_sessions", [("session_id", 1)]),
    ("kyc_sessions", [("user_id", 1)]),
    ("kyc_sessions", [("status", 1)]),
    ("kyc_sessions", [("expires_at", 1)]),
    ("kyc_attempts", [("user_id", 1), ("document_type", 1)]),
    ("kyc_attempts", [("status", 1)]),
    ("kyc_attempts", [("created_at", -1)]),
]

# 2. KYC Configurations
kyc_configurations = [
    # ... (copy the kyc_configurations list from your message here) ...
]

# 3. Migration
async def migrate_kyc_database(db):
    for collection_name, index_spec in kyc_indexes:
        collection = db[collection_name]
        try:
            await collection.create_index(index_spec)
        except Exception as e:
            print(f"Error creating index on {collection_name}: {e}")
    for config in kyc_configurations:
        existing = await db.kyc_configurations.find_one({
            "country": config["country"],
            "tier": config["tier"]
        })
        if not existing:
            config["id"] = str(uuid.uuid4())
            config["created_at"] = datetime.utcnow()
            await db.kyc_configurations.insert_one(config)

# 4. Health Check
async def kyc_health_check(db):
    health_status = {"database": {"status": "unknown", "details": {}}, "providers": {"status": "unknown", "details": {}}, "configurations": {"status": "unknown", "details": {}}}
    try:
        await db.users.find_one({})
        health_status["database"]["status"] = "healthy"
        configs = await db.kyc_configurations.find({"is_active": True}).to_list(100)
        health_status["configurations"]["status"] = "healthy"
        health_status["configurations"]["details"] = {
            "total_configs": len(configs),
            "countries": list(set(c["country"] for c in configs)),
            "tiers": list(set(c["tier"] for c in configs))
        }
        providers_status = {}
        providers_status["hyperverge"] = {"status": "healthy", "api_key_configured": bool(os.environ.get('HYPERVERGE_API_KEY'))}
        providers_status["idfy"] = {"status": "healthy", "api_key_configured": bool(os.environ.get('IDFY_API_KEY'))}
        health_status["providers"]["status"] = "healthy"
        health_status["providers"]["details"] = providers_status
    except Exception as e:
        health_status["database"]["status"] = "unhealthy"
        health_status["database"]["details"] = {"error": str(e)}
    return health_status

# 5. Webhook Signature
def verify_webhook_signature(payload: bytes, signature: str, secret: str) -> bool:
    expected_signature = hmac.new(secret.encode('utf-8'), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(f"sha256={expected_signature}", signature)

# 6. Rate Limiting
class KYCRateLimiter:
    def __init__(self, db):
        self.db = db
    async def check_rate_limit(self, user_id: str, action: str) -> Dict[str, Any]:
        now = datetime.utcnow()
        hour_ago = now - timedelta(hours=1)
        day_ago = now - timedelta(days=1)
        hourly_attempts = await self.db.kyc_attempts.count_documents({"user_id": user_id, "created_at": {"$gte": hour_ago}})
        daily_attempts = await self.db.kyc_attempts.count_documents({"user_id": user_id, "created_at": {"$gte": day_ago}})
        limits = {"hourly": 5, "daily": 10}
        if hourly_attempts >= limits["hourly"]:
            return {"allowed": False, "reason": "hourly_limit_exceeded", "reset_time": hour_ago + timedelta(hours=1)}
        if daily_attempts >= limits["daily"]:
            return {"allowed": False, "reason": "daily_limit_exceeded", "reset_time": day_ago + timedelta(days=1)}
        return {"allowed": True, "remaining": {"hourly": limits["hourly"] - hourly_attempts, "daily": limits["daily"] - daily_attempts}}

def rate_limit_kyc(action: str, db):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_user = kwargs.get('current_user')
            if not current_user:
                return {"error": "Authentication required"}
            rate_limiter = KYCRateLimiter(db)
            limit_check = await rate_limiter.check_rate_limit(current_user.id, action)
            if not limit_check["allowed"]:
                raise HTTPException(status_code=429, detail=f"Rate limit exceeded: {limit_check['reason']}")
            return await func(*args, **kwargs)
        return wrapper
    return decorator

# 7. Error Handling
class KYCErrorCode(str):
    DOCUMENT_INVALID = "DOCUMENT_INVALID"
    DOCUMENT_EXPIRED = "DOCUMENT_EXPIRED"
    FACE_MATCH_FAILED = "FACE_MATCH_FAILED"
    OCR_FAILED = "OCR_FAILED"
    API_ERROR = "API_ERROR"
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
    UNSUPPORTED_DOCUMENT = "UNSUPPORTED_DOCUMENT"
    POOR_IMAGE_QUALITY = "POOR_IMAGE_QUALITY"
    DUPLICATE_DOCUMENT = "DUPLICATE_DOCUMENT"

class KYCErrorHandler:
    def __init__(self):
        self.logger = logging.getLogger("kyc_system")
    def handle_error(self, error_code: str, details: Dict[str, Any], user_id: str):
        error_messages = {
            KYCErrorCode.DOCUMENT_INVALID: "The document appears to be invalid. Please check and try again.",
            KYCErrorCode.DOCUMENT_EXPIRED: "The document has expired. Please upload a valid document.",
            KYCErrorCode.FACE_MATCH_FAILED: "Face verification failed. Please ensure good lighting and try again.",
            KYCErrorCode.OCR_FAILED: "Unable to read document text. Please upload a clearer image.",
            KYCErrorCode.API_ERROR: "Verification service temporarily unavailable. Please try again later.",
            KYCErrorCode.RATE_LIMIT_EXCEEDED: "Too many attempts. Please wait before trying again.",
            KYCErrorCode.UNSUPPORTED_DOCUMENT: "This document type is not supported for your region.",
            KYCErrorCode.POOR_IMAGE_QUALITY: "Image quality is too poor. Please upload a clearer image.",
            KYCErrorCode.DUPLICATE_DOCUMENT: "This document has already been verified."
        }
        self.logger.error(f"KYC Error for user {user_id}: {error_code} - {details}")
        return {
            "error_code": error_code,
            "message": error_messages.get(error_code, "An unexpected error occurred"),
            "details": details,
            "user_message": error_messages.get(error_code, "Please contact support")
        }

# 8. Notification
class KYCNotificationService:
    def __init__(self, db):
        self.db = db
    async def send_kyc_status_notification(self, user_id: str, status: str, tier: str):
        user = await self.db.users.find_one({"id": user_id})
        if not user:
            return
        notifications = {
            "verified": {
                "basic": {"title": "Basic KYC Verified!", "message": "Your identity has been verified. You can now access all basic features.", "action_url": "/dashboard"},
                "full": {"title": "Full KYC Verified!", "message": "Your full verification is complete. You can now access investment features.", "action_url": "/investment"}
            },
            "failed": {
                "basic": {"title": "Basic KYC Failed", "message": "Your identity verification was unsuccessful. Please try again or contact support.", "action_url": "/kyc"},
                "full": {"title": "Full KYC Failed", "message": "Your full verification was unsuccessful. Please try again or contact support.", "action_url": "/kyc"}
            }
        }
        notification = notifications.get(status, {}).get(tier, {})
        if notification:
            await self.db.notifications.insert_one({
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "type": "kyc_status",
                "title": notification["title"],
                "message": notification["message"],
                "action_url": notification["action_url"],
                "is_read": False,
                "created_at": datetime.utcnow()
            })

# 9. Compliance
class KYCComplianceManager:
    def __init__(self, db):
        self.db = db
    async def create_audit_log(self, user_id: str, action: str, details: Dict[str, Any]):
        audit_entry = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "action": action,
            "details": details,
            "timestamp": datetime.utcnow(),
            "ip_address": details.get("ip_address"),
            "user_agent": details.get("user_agent")
        }
        await self.db.kyc_audit_logs.insert_one(audit_entry)
    async def get_user_audit_trail(self, user_id: str) -> List[Dict[str, Any]]:
        return await self.db.kyc_audit_logs.find({"user_id": user_id}).sort("timestamp", -1).to_list(100)
    async def generate_compliance_report(self, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        pipeline = [
            {"$match": {"timestamp": {"$gte": start_date, "$lte": end_date}}},
            {"$group": {"_id": "$action", "count": {"$sum": 1}, "users": {"$addToSet": "$user_id"}}}
        ]
        result = await self.db.kyc_audit_logs.aggregate(pipeline).to_list(100)
        return {
            "report_period": {"start": start_date, "end": end_date},
            "summary": result,
            "total_actions": sum(r["count"] for r in result),
            "unique_users": len(set().union(*[r["users"] for r in result]))
        }

# 10. Initialization
async def initialize_kyc_system(app, db):
    await migrate_kyc_database(db)
    health = await kyc_health_check(db)
    print("KYC System Health Check:", health)
    return True 