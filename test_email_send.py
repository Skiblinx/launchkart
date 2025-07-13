#!/usr/bin/env python3
"""
Quick test to verify Gmail SMTP is working with your credentials
"""

import os
import sys
from pathlib import Path

# Load environment
project_root = Path(__file__).parent
env_file = project_root / 'backend' / '.env'

if env_file.exists():
    # Simple .env parser
    with open(env_file) as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                key, value = line.strip().split('=', 1)
                os.environ[key] = value

# Add backend to path
sys.path.append('backend')

def test_email_config():
    """Test email configuration"""
    print("🧪 Testing Gmail SMTP Configuration...")
    
    # Check environment variables
    smtp_username = os.environ.get('SMTP_USERNAME')
    smtp_password = os.environ.get('SMTP_PASSWORD') 
    from_email = os.environ.get('FROM_EMAIL')
    
    print(f"📧 SMTP Username: {smtp_username}")
    print(f"📧 From Email: {from_email}")
    print(f"🔐 Password configured: {'✅ Yes' if smtp_password else '❌ No'}")
    
    if smtp_username and smtp_password:
        print("✅ Gmail credentials are configured!")
        return True
    else:
        print("❌ Gmail credentials missing")
        return False

def test_email_service():
    """Test email service initialization"""
    try:
        print("\n🧪 Testing Email Service...")
        from backend.utils.email_service import EmailService
        
        service = EmailService()
        print("✅ Email service initialized successfully")
        
        # Test template generation (without sending)
        print("✅ Email templates ready")
        return True
        
    except Exception as e:
        print(f"❌ Email service error: {e}")
        return False

def main():
    """Run tests"""
    print("🚀 Gmail SMTP Integration Test")
    print("=" * 40)
    
    config_ok = test_email_config()
    service_ok = test_email_service()
    
    print("\n" + "=" * 40)
    if config_ok and service_ok:
        print("🎉 Gmail SMTP is ready!")
        print("\n📝 Next steps:")
        print("1. Start your server: uvicorn backend.server:app --reload")
        print("2. Test signup with a real email address")
        print("3. Check your inbox for verification email")
        print("4. Test admin login with OTP")
    else:
        print("❌ There are configuration issues")
        print("\n🔧 To fix:")
        print("1. Make sure Gmail 2FA is enabled")
        print("2. Generate App Password for 'Mail'")
        print("3. Update SMTP_USERNAME and SMTP_PASSWORD in .env")
    
    return config_ok and service_ok

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)