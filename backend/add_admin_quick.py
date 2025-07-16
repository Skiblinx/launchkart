#!/usr/bin/env python3
"""
Quick script to add admin user to MongoDB directly
"""
import os
import sys
import uuid
from datetime import datetime

# Add the backend directory to Python path
sys.path.append('/home/blinxz/iconedge/launchkart/backend')

def add_admin_user():
    """Add admin user directly to MongoDB"""
    
    # MongoDB connection string (adjust if needed)
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'launchkart')
    
    print("Adding admin user to MongoDB...")
    print(f"Email: IconMikky112@gmail.com")
    print(f"Role: super_admin")
    print(f"MongoDB URL: {mongo_url}")
    print(f"Database: {db_name}")
    
    # Create admin user document
    admin_user = {
        "id": str(uuid.uuid4()),
        "email": "iconmikky112@gmail.com",
        "full_name": "IconMikky Admin",
        "role": "super_admin",
        "permissions": [
            "user_management",
            "kyc_verification", 
            "service_approval",
            "admin_management",
            "analytics_access",
            "system_configuration"
        ],
        "is_active": True,
        "created_by": "system",
        "created_at": datetime.utcnow(),
        "last_login": None,
        "login_count": 0
    }
    
    print("\nAdmin user document:")
    print(admin_user)
    
    # MongoDB insert command
    mongo_insert_cmd = f'''
use {db_name}
db.admin_users.insertOne({admin_user})
'''
    
    print("\nTo manually insert into MongoDB, run:")
    print("mongo")
    print(mongo_insert_cmd)
    
    print("\nOr use MongoDB Compass/Studio 3T to insert this document into the 'admin_users' collection:")
    print(admin_user)

if __name__ == "__main__":
    add_admin_user()