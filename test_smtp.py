#!/usr/bin/env python3
"""
Test SMTP connection directly
"""
import smtplib
import os
from pathlib import Path

# Load environment
env_file = Path(__file__).parent / 'backend' / '.env'
if env_file.exists():
    with open(env_file) as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                key, value = line.strip().split('=', 1)
                os.environ[key] = value

def test_smtp():
    smtp_server = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
    smtp_port = int(os.environ.get('SMTP_PORT', 587))
    smtp_username = os.environ.get('SMTP_USERNAME')
    smtp_password = os.environ.get('SMTP_PASSWORD')
    
    print(f"Testing SMTP connection to {smtp_server}:{smtp_port}")
    print(f"Username: {smtp_username}")
    
    try:
        # Test basic connection
        print("🔌 Connecting to SMTP server...")
        server = smtplib.SMTP(smtp_server, smtp_port)
        print("✅ Connected to SMTP server")
        
        # Test STARTTLS
        print("🔐 Starting TLS...")
        server.starttls()
        print("✅ TLS started successfully")
        
        # Test login
        print("🔑 Logging in...")
        server.login(smtp_username, smtp_password)
        print("✅ Login successful")
        
        server.quit()
        print("🎉 SMTP test passed!")
        return True
        
    except Exception as e:
        print(f"❌ SMTP test failed: {e}")
        print("\n🔧 Troubleshooting:")
        print("1. Check if you're behind a firewall/proxy")
        print("2. Verify Gmail App Password is correct")
        print("3. Check internet connectivity")
        print("4. Try using port 465 with SSL instead of 587 with TLS")
        return False

if __name__ == "__main__":
    test_smtp()