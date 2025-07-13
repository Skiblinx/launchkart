#!/usr/bin/env python3
"""
Test script for the Admin Dashboard functionality
This script verifies that all admin components are properly configured
"""

import sys
import os
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / 'backend'))

def test_admin_imports():
    """Test that all admin-related modules can be imported"""
    try:
        print("🧪 Testing admin component imports...")
        
        # Test admin models
        from backend.models.admin import AdminUser, AdminRole, AdminPermission
        print("✅ Admin models imported successfully")
        
        # Test admin utils
        from backend.utils.admin_utils import generate_otp, create_admin_jwt_token
        print("✅ Admin utils imported successfully")
        
        # Test admin router
        from backend.routers.admin_management import router
        print("✅ Admin management router imported successfully")
        
        return True
    except Exception as e:
        print(f"❌ Import error: {e}")
        return False

def test_admin_models():
    """Test admin models functionality"""
    try:
        print("\n🧪 Testing admin models...")
        
        from backend.models.admin import AdminUser, AdminRole, AdminPermission
        
        # Test admin user creation
        admin_data = {
            "email": "test@example.com",
            "full_name": "Test Admin",
            "role": AdminRole.ADMIN,
            "permissions": [AdminPermission.USER_MANAGEMENT, AdminPermission.ANALYTICS_ACCESS]
        }
        
        admin_user = AdminUser(**admin_data)
        print(f"✅ Admin user created: {admin_user.email} ({admin_user.role})")
        print(f"✅ Permissions: {admin_user.permissions}")
        
        return True
    except Exception as e:
        print(f"❌ Model test error: {e}")
        return False

def test_admin_utils():
    """Test admin utility functions"""
    try:
        print("\n🧪 Testing admin utilities...")
        
        from backend.utils.admin_utils import generate_otp, create_admin_jwt_token
        
        # Test OTP generation
        otp = generate_otp()
        assert len(otp) == 6 and otp.isdigit()
        print(f"✅ OTP generated: {otp}")
        
        # Test JWT token creation
        test_data = {
            "email": "test@example.com",
            "role": "admin",
            "permissions": ["user_management"]
        }
        
        token = create_admin_jwt_token(test_data)
        assert isinstance(token, str) and len(token) > 0
        print("✅ JWT token created successfully")
        
        return True
    except Exception as e:
        print(f"❌ Utils test error: {e}")
        return False

def test_frontend_components():
    """Check that frontend components exist"""
    try:
        print("\n🧪 Testing frontend components...")
        
        components_dir = project_root / 'frontend' / 'src' / 'components'
        
        required_files = [
            'AdminDashboard.js',
            'DashboardOverview.js', 
            'UserManagement.js',
            'AnalyticsOverview.js',
            'ServiceManagement.js',
            'SystemManagement.js',
            'AdminManagementComponent.js'
        ]
        
        for file in required_files:
            file_path = components_dir / file
            if file_path.exists():
                print(f"✅ {file} exists")
            else:
                print(f"❌ {file} missing")
                return False
        
        return True
    except Exception as e:
        print(f"❌ Frontend test error: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting Admin Dashboard Tests")
    print("=" * 50)
    
    tests = [
        test_admin_imports,
        test_admin_models,
        test_admin_utils,
        test_frontend_components
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        print()
    
    print("=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Admin Dashboard is ready!")
        print("\n📝 Next Steps:")
        print("1. Start the backend server: cd backend && uvicorn server:app --reload")
        print("2. Start the frontend: cd frontend && npm start")
        print("3. Navigate to /admin/dashboard to access the admin portal")
        return True
    else:
        print("❌ Some tests failed. Please check the errors above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)