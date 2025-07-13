#!/usr/bin/env python3
"""
Setup script to create the first admin user for LaunchKart
Run this script once to set up the initial admin user.
"""

import asyncio
import uuid
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB configuration
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'launchkart')

async def setup_first_admin():
    """Create the first admin user"""
    try:
        # Connect to MongoDB
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]
        
        print("🔗 Connecting to MongoDB...")
        
        # Check if admin already exists
        existing_admin = await db.admin_users.find_one({"is_active": True})
        if existing_admin:
            print("⚠️  Admin user already exists!")
            print(f"   Email: {existing_admin['email']}")
            print(f"   Role: {existing_admin['role']}")
            return
        
        # Get user input for admin details
        print("\n👤 Setting up first admin user")
        print("=" * 40)
        
        email = input("Enter admin email: ").strip().lower()
        if not email:
            print("❌ Email is required!")
            return
        
        full_name = input("Enter admin full name: ").strip()
        if not full_name:
            print("❌ Full name is required!")
            return
        
        # Check if user exists in the platform
        user = await db.users.find_one({"email": email})
        if not user:
            print("❌ User not found in the platform!")
            print("   Please create a regular user account first, then run this script.")
            return
        
        # Check if user has verified KYC
        if user.get("kyc_status") != "verified":
            print("❌ User must have verified KYC to become admin!")
            print("   Please complete KYC verification first.")
            return
        
        # Create admin user
        admin_user = {
            "id": str(uuid.uuid4()),
            "email": email,
            "full_name": full_name,
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
            "created_by": "system_setup",
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
                "admin_role": "super_admin",
                "updated_at": datetime.utcnow()
            }}
        )
        
        print("\n✅ Admin user created successfully!")
        print(f"   Email: {email}")
        print(f"   Name: {full_name}")
        print(f"   Role: Super Admin")
        print(f"   Permissions: All permissions granted")
        
        print("\n🔐 Admin Login Instructions:")
        print("1. Use the admin OTP endpoint: POST /api/admin/manage/auth/request-otp")
        print("2. Verify OTP: POST /api/admin/manage/auth/verify-otp")
        print("3. Use the returned JWT token for admin API calls")
        
        print("\n📧 Email Configuration:")
        print("Make sure to set up SMTP settings in your .env file:")
        print("SMTP_SERVER=smtp.gmail.com")
        print("SMTP_PORT=587")
        print("SMTP_USERNAME=your-email@gmail.com")
        print("SMTP_PASSWORD=your-app-password")
        print("FROM_EMAIL=noreply@launchkart.com")
        
    except Exception as e:
        print(f"❌ Error setting up admin: {str(e)}")
    finally:
        client.close()

async def list_admins():
    """List all admin users"""
    try:
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]
        
        admins = await db.admin_users.find({"is_active": True}).to_list(100)
        
        if not admins:
            print("No admin users found.")
            return
        
        print("\n👥 Current Admin Users:")
        print("=" * 40)
        for admin in admins:
            print(f"Email: {admin['email']}")
            print(f"Name: {admin['full_name']}")
            print(f"Role: {admin['role']}")
            print(f"Created: {admin['created_at']}")
            print(f"Last Login: {admin.get('last_login', 'Never')}")
            print("-" * 20)
            
    except Exception as e:
        print(f"❌ Error listing admins: {str(e)}")
    finally:
        client.close()

async def main():
    """Main function"""
    print("🚀 LaunchKart Admin Setup")
    print("=" * 40)
    
    while True:
        print("\nOptions:")
        print("1. Create first admin user")
        print("2. List existing admin users")
        print("3. Exit")
        
        choice = input("\nEnter your choice (1-3): ").strip()
        
        if choice == "1":
            await setup_first_admin()
        elif choice == "2":
            await list_admins()
        elif choice == "3":
            print("👋 Goodbye!")
            break
        else:
            print("❌ Invalid choice. Please try again.")

if __name__ == "__main__":
    asyncio.run(main()) 