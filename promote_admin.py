#!/usr/bin/env python3
"""
Quick script to promote francisperkins125@gmail.com to admin
"""

import asyncio
import uuid
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent / 'backend'
load_dotenv(ROOT_DIR / '.env')

# MongoDB configuration
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'launchkart')

async def promote_to_admin():
    """Promote francisperkins125@gmail.com to admin"""
    try:
        # Connect to MongoDB
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]
        
        email = "francisperkins125@gmail.com"
        print(f"🔗 Connecting to MongoDB...")
        print(f"👤 Promoting {email} to admin...")
        
        # Check if user exists
        user = await db.users.find_one({"email": email})
        if not user:
            print("❌ User not found! Creating user record first...")
            # Create basic user record
            user = {
                "id": str(uuid.uuid4()),
                "email": email,
                "fullName": "Francis Perkins",
                "phoneNumber": "+1234567890",
                "country": "India",
                "role": "founder",
                "kyc_status": "verified",  # Skip KYC requirement
                "email_verified": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            await db.users.insert_one(user)
            print("✅ User record created")
        
        # Check if already admin
        existing_admin = await db.admin_users.find_one({"email": email})
        if existing_admin:
            print("⚠️  Already an admin!")
            print(f"   Role: {existing_admin['role']}")
            return
        
        # Create admin user
        admin_user = {
            "id": str(uuid.uuid4()),
            "email": email,
            "full_name": "Francis Perkins",
            "role": "super_admin",
            "permissions": [
                "user_management",
                "admin_management", 
                "content_moderation",
                "service_approval",
                "payment_management",
                "refund_processing",
                "analytics_access",
                "report_generation",
                "system_configuration",
                "email_management",
                "kyc_verification",
                "kyc_approval"
            ],
            "is_active": True,
            "created_by": "manual_promotion",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "login_count": 0
        }
        
        # Insert admin user
        await db.admin_users.insert_one(admin_user)
        
        # Update user record with admin role
        await db.users.update_one(
            {"email": email},
            {"$set": {
                "role": "admin",
                "admin_role": "super_admin",
                "updated_at": datetime.utcnow()
            }}
        )
        
        print("\n✅ Admin promotion successful!")
        print(f"   Email: {email}")
        print(f"   Name: Francis Perkins")
        print(f"   Role: Super Admin")
        print(f"   Permissions: All permissions granted")
        
        print("\n🚀 Ready to test admin panel!")
        print("1. Visit: http://localhost:3000/admin/dashboard")
        print("2. Enter your email: francisperkins125@gmail.com")
        print("3. Request OTP (check backend logs for OTP in development mode)")
        print("4. Enter OTP to access admin dashboard")
        
    except Exception as e:
        print(f"❌ Error promoting to admin: {str(e)}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(promote_to_admin())