#!/usr/bin/env python3
"""
Debug script to check user authentication issues
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import hashlib

async def debug_user_auth(email: str):
    """Debug authentication issues for a specific user"""
    
    # Connect to database
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'launchkart')]
    
    try:
        # Find user
        user = await db.users.find_one({"email": email})
        if not user:
            print(f"❌ User with email '{email}' not found in database")
            return
        
        print(f"✅ User found: {user.get('fullName', 'Unknown Name')}")
        print(f"📧 Email: {user.get('email')}")
        print(f"🔒 Email verified: {user.get('email_verified', False)}")
        print(f"🆔 User ID: {user.get('id')}")
        print(f"📅 Created: {user.get('created_at')}")
        print(f"🔑 Has password hash: {'Yes' if user.get('password_hash') else 'No'}")
        
        password_hash = user.get('password_hash', '')
        if password_hash:
            # Try to determine password hash format
            if password_hash.startswith('$2b$') or password_hash.startswith('$2a$'):
                print("🔐 Password format: bcrypt (new format)")
            elif len(password_hash) > 64:
                print("🔐 Password format: pbkdf2_hmac (legacy format)")
            else:
                print("🔐 Password format: unknown/invalid")
            
            print(f"📏 Password hash length: {len(password_hash)}")
            print(f"🎯 Password hash preview: {password_hash[:20]}...")
        
        if not user.get('email_verified', False):
            print("\n⚠️  ISSUE: Email is not verified!")
            print("   User needs to verify their email before they can log in.")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        client.close()

async def fix_user_password(email: str, new_password: str):
    """Fix a user's password by rehashing it with bcrypt"""
    
    # Connect to database
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'launchkart')]
    
    try:
        # Find user
        user = await db.users.find_one({"email": email})
        if not user:
            print(f"❌ User with email '{email}' not found")
            return
        
        # Hash new password with bcrypt
        password_bytes = new_password.encode('utf-8')
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password_bytes, salt)
        new_hash = hashed.decode('utf-8')
        
        # Update user password
        result = await db.users.update_one(
            {"email": email},
            {"$set": {"password_hash": new_hash}}
        )
        
        if result.modified_count > 0:
            print(f"✅ Password updated for {email}")
            print(f"🔑 New password hash: {new_hash[:20]}...")
        else:
            print(f"❌ Failed to update password for {email}")
    
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        client.close()

async def verify_user_email(email: str):
    """Mark a user's email as verified"""
    
    # Connect to database
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'launchkart')]
    
    try:
        # Update user email verification
        result = await db.users.update_one(
            {"email": email},
            {"$set": {"email_verified": True, "email_verified_at": asyncio.get_event_loop().time()}}
        )
        
        if result.modified_count > 0:
            print(f"✅ Email verified for {email}")
        else:
            print(f"❌ Failed to verify email for {email} (user may not exist)")
    
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 3:
        print("Usage:")
        print("  python debug_auth.py debug <email>")
        print("  python debug_auth.py fix-password <email> <new_password>")
        print("  python debug_auth.py verify-email <email>")
        sys.exit(1)
    
    action = sys.argv[1]
    email = sys.argv[2]
    
    if action == "debug":
        asyncio.run(debug_user_auth(email))
    elif action == "fix-password" and len(sys.argv) >= 4:
        new_password = sys.argv[3]
        asyncio.run(fix_user_password(email, new_password))
    elif action == "verify-email":
        asyncio.run(verify_user_email(email))
    else:
        print("Invalid action or missing parameters")