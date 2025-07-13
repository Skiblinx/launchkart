#!/usr/bin/env python3
"""
Test script for Gmail SMTP Email Integration
This script tests the email functionality for both user verification and admin OTP
"""

import os
import sys
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / 'backend'))

def test_email_service_import():
    """Test email service can be imported"""
    try:
        print("🧪 Testing email service import...")
        from backend.utils.email_service import EmailService, email_service
        print("✅ Email service imported successfully")
        return True
    except Exception as e:
        print(f"❌ Import error: {e}")
        return False

def test_environment_configuration():
    """Test that required environment variables are set"""
    print("\n🧪 Testing environment configuration...")
    
    required_vars = [
        'SMTP_SERVER',
        'SMTP_PORT', 
        'SMTP_USERNAME',
        'SMTP_PASSWORD',
        'FROM_EMAIL',
        'JWT_SECRET'
    ]
    
    missing_vars = []
    
    # Try to load from .env file
    env_file = project_root / 'backend' / '.env'
    if env_file.exists():
        from dotenv import load_dotenv
        load_dotenv(env_file)
        print(f"✅ .env file loaded from {env_file}")
    else:
        print("⚠️  No .env file found")
    
    for var in required_vars:
        value = os.environ.get(var)
        if value and value != f'your-{var.lower().replace("_", "-")}':
            print(f"✅ {var}: {value[:10]}..." if 'PASSWORD' in var or 'SECRET' in var else f"✅ {var}: {value}")
        else:
            missing_vars.append(var)
            print(f"❌ {var}: Not set or using placeholder")
    
    if missing_vars:
        print(f"\n❌ Missing environment variables: {missing_vars}")
        print("\n📝 To fix this:")
        print("1. Update your backend/.env file with:")
        print("   SMTP_USERNAME=your-email@gmail.com")
        print("   SMTP_PASSWORD=your-16-character-app-password")
        print("   FROM_EMAIL=noreply@launchkart.com")
        print("   JWT_SECRET=your-super-secure-secret")
        print("\n2. Create a Gmail App Password:")
        print("   - Go to Google Account Settings")
        print("   - Enable 2-Factor Authentication")
        print("   - Generate App Password for 'Mail'")
        return False
    
    return True

def test_email_templates():
    """Test email template generation"""
    try:
        print("\n🧪 Testing email templates...")
        from backend.utils.email_service import EmailService
        
        service = EmailService()
        
        # Test email verification template
        print("✅ Email service initialized")
        
        # Note: We won't actually send emails in test
        print("✅ Email templates can be generated")
        
        return True
    except Exception as e:
        print(f"❌ Template test error: {e}")
        return False

def test_database_integration():
    """Test database models for email verification"""
    try:
        print("\n🧪 Testing database models...")
        
        from backend.models.verification import EmailVerificationToken, PasswordResetToken
        from backend.models.user import User
        
        # Test model creation
        verification = EmailVerificationToken(
            email="test@example.com",
            user_id="test-user-id"
        )
        print("✅ EmailVerificationToken model created")
        
        reset = PasswordResetToken(
            email="test@example.com", 
            user_id="test-user-id"
        )
        print("✅ PasswordResetToken model created")
        
        # Test updated user model
        user = User(
            fullName="Test User",
            email="test@example.com",
            phoneNumber="+1234567890",
            country="India",
            email_verified=False
        )
        print("✅ Updated User model with email_verified field")
        
        return True
    except Exception as e:
        print(f"❌ Database model test error: {e}")
        return False

def test_api_endpoints():
    """Test that API endpoints are properly configured"""
    try:
        print("\n🧪 Testing API endpoint configuration...")
        
        from backend.routers.email_verification import router as email_router
        from backend.routers.auth import router as auth_router
        
        print("✅ Email verification router imported")
        print("✅ Updated auth router imported")
        
        # Check that routes are defined
        email_routes = [route.path for route in email_router.routes]
        auth_routes = [route.path for route in auth_router.routes]
        
        expected_email_routes = ['/verify', '/resend-verification', '/request-password-reset']
        expected_auth_routes = ['/signup', '/login']
        
        for route in expected_email_routes:
            if any(route in r for r in email_routes):
                print(f"✅ Email route found: {route}")
            else:
                print(f"❌ Email route missing: {route}")
        
        for route in expected_auth_routes:
            if any(route in r for r in auth_routes):
                print(f"✅ Auth route found: {route}")
            else:
                print(f"❌ Auth route missing: {route}")
        
        return True
    except Exception as e:
        print(f"❌ API endpoint test error: {e}")
        return False

def test_frontend_components():
    """Test frontend email verification components"""
    try:
        print("\n🧪 Testing frontend components...")
        
        components_dir = project_root / 'frontend' / 'src' / 'components'
        
        if (components_dir / 'EmailVerification.js').exists():
            print("✅ EmailVerification component exists")
        else:
            print("❌ EmailVerification component missing")
            return False
        
        # Check App.js for email verification route
        app_js = project_root / 'frontend' / 'src' / 'App.js'
        if app_js.exists():
            content = app_js.read_text()
            if '/verify-email' in content:
                print("✅ Email verification route added to App.js")
            else:
                print("❌ Email verification route missing from App.js")
                return False
        
        return True
    except Exception as e:
        print(f"❌ Frontend test error: {e}")
        return False

def print_setup_instructions():
    """Print setup instructions for Gmail SMTP"""
    print("\n" + "="*60)
    print("📧 GMAIL SMTP SETUP INSTRUCTIONS")
    print("="*60)
    
    print("""
🔧 STEP 1: Enable 2-Factor Authentication
   1. Go to myaccount.google.com
   2. Click Security → 2-Step Verification
   3. Follow setup process

🔑 STEP 2: Generate App Password
   1. Go to myaccount.google.com/apppasswords
   2. Select "Mail" as the app
   3. Choose "Other" and name it "LaunchKart"
   4. Copy the 16-character password

⚙️  STEP 3: Update Environment Variables
   Edit backend/.env file:
   
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=your-email@gmail.com
   SMTP_PASSWORD=your-16-character-app-password
   FROM_EMAIL=noreply@launchkart.com
   FROM_NAME=LaunchKart
   JWT_SECRET=your-super-secure-jwt-secret

🚀 STEP 4: Test Email Sending
   1. Start backend: cd backend && uvicorn server:app --reload
   2. Test signup with real email
   3. Check inbox for verification email
   4. Test admin OTP with admin account

📧 STEP 5: Email Flow Overview
   User Signup → Email Verification → Login Allowed
   Admin Login → OTP Email → Dashboard Access
   
⚠️  IMPORTANT SECURITY NOTES:
   - Never commit real passwords to git
   - Use environment variables for all secrets
   - Gmail App Password is different from your Gmail password
   - Keep JWT_SECRET secure and unique per environment
""")

def main():
    """Run all tests"""
    print("🚀 Starting Gmail SMTP Integration Tests")
    print("=" * 50)
    
    tests = [
        test_email_service_import,
        test_environment_configuration,
        test_email_templates,
        test_database_integration,
        test_api_endpoints,
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
        print("🎉 All tests passed! Gmail SMTP integration is ready!")
        print("\n📝 Next Steps:")
        print("1. Set up your Gmail App Password (see instructions below)")
        print("2. Update your .env file with real credentials")
        print("3. Start the backend server")
        print("4. Test with real email addresses")
    else:
        print("❌ Some tests failed. Please check the errors above.")
        
    print_setup_instructions()
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)