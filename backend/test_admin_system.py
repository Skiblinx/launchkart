#!/usr/bin/env python3
"""
Simple test script to verify admin system imports and basic functionality
"""

def test_imports():
    """Test if all admin system imports work"""
    try:
        print("🔍 Testing admin system imports...")
        
        # Test basic imports
        from backend.models.admin import AdminUser, AdminRole, AdminPermission
        print("✅ Admin models imported successfully")
        
        from backend.utils.admin_utils import generate_otp, create_admin_jwt_token
        print("✅ Admin utils imported successfully")
        
        from backend.routers.admin_management import router
        print("✅ Admin router imported successfully")
        
        from backend.db import get_database
        print("✅ Database utilities imported successfully")
        
        print("\n🎉 All admin system imports successful!")
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("💡 Make sure to install dependencies: pip install -r requirements.txt")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def test_admin_models():
    """Test admin model creation"""
    try:
        from backend.models.admin import AdminUser, AdminRole, AdminPermission
        
        # Test creating admin user
        admin = AdminUser(
            email="test@example.com",
            full_name="Test Admin",
            role=AdminRole.ADMIN,
            permissions=[AdminPermission.USER_MANAGEMENT]
        )
        
        print("✅ Admin model creation successful")
        print(f"   Email: {admin.email}")
        print(f"   Role: {admin.role}")
        print(f"   Permissions: {admin.permissions}")
        
        return True
        
    except Exception as e:
        print(f"❌ Admin model test failed: {e}")
        return False

def test_utils():
    """Test admin utilities"""
    try:
        from backend.utils.admin_utils import generate_otp
        
        # Test OTP generation
        otp = generate_otp()
        print(f"✅ OTP generation successful: {otp}")
        
        return True
        
    except Exception as e:
        print(f"❌ Utils test failed: {e}")
        return False

def test_database_connection():
    """Test database connection"""
    try:
        import asyncio
        from backend.db import get_database
        
        async def test_db():
            db = await get_database()
            # Try to access a collection to test connection
            await db.users.find_one({})
            return True
        
        # Run the async test
        result = asyncio.run(test_db())
        if result:
            print("✅ Database connection successful")
            return True
        
    except Exception as e:
        print(f"❌ Database connection test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 LaunchKart Admin System Test")
    print("=" * 40)
    
    tests = [
        ("Import Test", test_imports),
        ("Model Test", test_admin_models),
        ("Utils Test", test_utils),
        ("Database Test", test_database_connection)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n📋 Running {test_name}...")
        if test_func():
            passed += 1
        else:
            print(f"❌ {test_name} failed")
    
    print(f"\n📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Admin system is ready to use.")
        print("\n🚀 Next steps:")
        print("1. Set up your .env file with SMTP settings")
        print("2. Run: python -m backend.setup_admin")
        print("3. Start your server: uvicorn backend.server:app --reload")
    else:
        print("⚠️  Some tests failed. Please check the errors above.")

if __name__ == "__main__":
    main() 