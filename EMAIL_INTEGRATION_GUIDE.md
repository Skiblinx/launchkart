# 📧 Gmail SMTP Email Integration Guide

## 🎯 Overview

Your LaunchKart platform now has complete email integration with Gmail SMTP for:
- ✅ **User Email Verification** - Required before login
- ✅ **Admin OTP Authentication** - Secure admin portal access
- ✅ **Password Reset** - Self-service password recovery
- ✅ **Admin Promotion Notifications** - Automated admin welcome emails

## 🔧 Setup Instructions

### Step 1: Gmail App Password Setup

1. **Enable 2-Factor Authentication**
   - Go to [Google Account Settings](https://myaccount.google.com/)
   - Click "Security" → "2-Step Verification"
   - Follow the setup process

2. **Generate App Password**
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" as the app type
   - Choose "Other" and name it "LaunchKart Backend"
   - **Copy the 16-character password** (save it securely!)

### Step 2: Environment Configuration

Update your `backend/.env` file with these values:

```env
# Gmail SMTP Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-16-character-app-password
FROM_EMAIL=noreply@launchkart.com
FROM_NAME=LaunchKart

# JWT Configuration (change this!)
JWT_SECRET=your-super-secure-jwt-secret-key-here
```

⚠️ **Security Notes:**
- Replace `your-email@gmail.com` with your Gmail address
- Replace `your-16-character-app-password` with the password from Step 1
- Generate a strong, unique JWT_SECRET for production
- Never commit real credentials to git!

### Step 3: Test the Integration

1. **Start the backend server:**
   ```bash
   cd backend
   uvicorn server:app --reload
   ```

2. **Start the frontend:**
   ```bash
   cd frontend
   npm start
   ```

3. **Test user registration:**
   - Go to `/signup`
   - Create account with real email
   - Check inbox for verification email
   - Click verification link
   - Try logging in (should work after verification)

4. **Test admin OTP:**
   - Create an admin user first
   - Go to `/admin/dashboard`
   - Enter admin email
   - Check inbox for OTP
   - Enter OTP to access admin portal

## 📧 Email Flow Overview

### User Registration Flow
```
User Signs Up → Email Verification Sent → User Clicks Link → Email Verified → Login Allowed
```

### Admin Login Flow  
```
Admin Enters Email → OTP Sent → Admin Enters OTP → Dashboard Access Granted
```

### Password Reset Flow
```
User Requests Reset → Reset Link Sent → User Clicks Link → New Password Set
```

## 🎨 Email Templates

All emails include professional HTML templates with:
- ✨ LaunchKart branding and colors
- 📱 Mobile-responsive design
- 🔐 Security warnings and instructions
- 🎯 Clear call-to-action buttons
- ⏰ Expiration timers

## 🛠️ Backend Implementation

### New Components Added:

1. **Email Service** (`utils/email_service.py`)
   - Gmail SMTP integration
   - Professional HTML templates
   - Error handling and logging

2. **Email Verification Router** (`routers/email_verification.py`)
   - Email verification endpoints
   - Password reset functionality
   - Rate limiting protection

3. **Updated Auth Router** (`routers/auth.py`)
   - Email verification requirement
   - Enhanced signup flow
   - Improved error messages

4. **Verification Models** (`models/verification.py`)
   - Email verification tokens
   - Password reset tokens
   - Proper expiration handling

### New API Endpoints:

```
POST /api/email/verify
POST /api/email/resend-verification  
POST /api/email/request-password-reset
POST /api/email/confirm-password-reset
GET  /api/email/verification-status/{email}
```

## 🌐 Frontend Implementation

### New Components:

1. **EmailVerification.js**
   - Email verification page
   - Success/error states
   - Resend verification option

2. **Enhanced Login/Signup**
   - Email verification warnings
   - Resend verification button
   - Improved error handling

### Updated User Flow:

1. **Signup** → Shows "Check your email" message
2. **Login** → Blocks unverified users with helpful message
3. **Verification** → Professional verification page
4. **Admin Portal** → OTP-based secure access

## 🔒 Security Features

- ✅ **Token Expiration** - 24h for verification, 1h for password reset, 10min for OTP
- ✅ **Rate Limiting** - Prevents email spam (5min cooldown)
- ✅ **One-time Use** - Tokens invalidated after use
- ✅ **Secure Storage** - No sensitive data in URLs
- ✅ **Audit Logging** - All admin actions logged

## 🚨 Troubleshooting

### Common Issues:

1. **"Failed to send email"**
   - Check Gmail App Password is correct
   - Verify 2FA is enabled on Gmail
   - Check SMTP credentials in .env

2. **"Invalid token"**
   - Token may have expired (24h limit)
   - Use resend verification option
   - Check URL wasn't truncated

3. **"Email not verified"**
   - Check spam/junk folder
   - Use resend verification
   - Verify FROM_EMAIL is set correctly

### Debug Steps:

1. Check backend logs for email errors
2. Verify environment variables are loaded
3. Test with Gmail's SMTP directly
4. Check firewall/network restrictions

## 📱 Production Deployment

### Environment Variables for Production:

```env
# Use production email address
SMTP_USERNAME=noreply@yourdomain.com
FROM_EMAIL=noreply@yourdomain.com

# Strong, unique secrets
JWT_SECRET=generate-a-strong-secret-for-production

# Production URLs
FRONTEND_URL=https://yourdomain.com
```

### Recommendations:

1. **Custom Domain**: Use your own domain for FROM_EMAIL
2. **Email Service**: Consider dedicated services like SendGrid for high volume
3. **SSL/TLS**: Ensure all connections are encrypted
4. **Monitoring**: Set up alerts for email delivery failures
5. **Backups**: Regular database backups including verification tokens

## 🎉 Success!

Your LaunchKart platform now has enterprise-grade email functionality:

- ✨ **Professional user onboarding** with email verification
- 🔐 **Secure admin access** with OTP authentication  
- 🛡️ **Password recovery** for enhanced user experience
- 📧 **Beautiful email templates** that match your brand
- 🔒 **Security best practices** with proper token management

The integration is production-ready and provides a seamless, secure experience for both users and administrators!

---

**Need Help?** Check the troubleshooting section above or review the test script: `test_email_integration.py`