#!/bin/bash

echo "🚀 Starting LaunchKart Backend Server with Email Integration"
echo "=============================================================="

# Activate virtual environment
source venv/bin/activate

# Check if email-validator is installed
python -c "import email_validator; print('✅ email-validator installed')" 2>/dev/null || {
    echo "📦 Installing email-validator..."
    pip install email-validator
}

# Check Gmail configuration
echo "📧 Checking Gmail SMTP configuration..."
python test_email_send.py

if [ $? -eq 0 ]; then
    echo ""
    echo "🚀 Starting backend server..."
    echo "Access admin portal at: http://localhost:8000/admin/dashboard"
    echo "Access main app at: http://localhost:3000"
    echo ""
    uvicorn backend.server:app --reload --host 0.0.0.0 --port 8000
else
    echo "❌ Gmail SMTP configuration issues detected"
    echo "Please check your .env file and Gmail App Password"
    exit 1
fi