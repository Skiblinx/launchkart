# LaunchKart Admin Management System

## Overview

The admin management system allows existing users to be promoted to admin roles with specific permissions. This system provides a secure way to manage admin access through OTP-based authentication.

## Features

- **User-to-Admin Promotion**: Promote verified users to admin roles
- **Admin Demotion**: Demote admins back to regular users
- **OTP Authentication**: Secure admin login using email OTP
- **Permission-Based Access**: Granular permission system
- **Audit Logging**: Track all admin actions
- **Admin Candidates**: AI-powered suggestions for admin promotion

## Admin Roles

- **SUPER_ADMIN**: Full system access
- **ADMIN**: General administrative access
- **MODERATOR**: Content moderation and user management
- **SUPPORT**: Customer support and basic management

## Admin Permissions

### User Management
- `user_management`: Manage user accounts
- `admin_management`: Promote/demote admins

### Content Management
- `content_moderation`: Moderate platform content
- `service_approval`: Approve service requests

### Financial Management
- `payment_management`: Manage payments
- `refund_processing`: Process refunds

### Analytics & Reporting
- `analytics_access`: Access analytics
- `report_generation`: Generate reports

### System Management
- `system_configuration`: Configure system settings
- `email_management`: Manage email templates

### KYC Management
- `kyc_verification`: Verify KYC documents
- `kyc_approval`: Approve KYC submissions

## API Endpoints

### Admin Authentication
- `POST /api/admin/manage/auth/request-otp` - Request OTP for admin login
- `POST /api/admin/manage/auth/verify-otp` - Verify OTP and get admin token
- `GET /api/admin/manage/me` - Get current admin profile

### User Management
- `GET /api/admin/manage/eligible-users` - Get users eligible for admin promotion
- `POST /api/admin/manage/promote-user` - Promote user to admin
- `POST /api/admin/manage/demote-admin/{admin_id}` - Demote admin to user
- `GET /api/admin/manage/admin-candidates` - Get suggested admin candidates

### Audit & Monitoring
- `GET /api/admin/manage/audit-logs` - Get admin audit logs

## Usage Examples

### 1. Promoting a User to Admin

```bash
# First, get eligible users
curl -X GET "http://localhost:8000/api/admin/manage/eligible-users" \
  -H "Authorization: Bearer <admin_token>"

# Promote a user to admin
curl -X POST "http://localhost:8000/api/admin/manage/promote-user" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-uuid",
    "role": "admin",
    "permissions": ["user_management", "content_moderation"]
  }'
```

### 2. Admin Login Process

```bash
# Step 1: Request OTP
curl -X POST "http://localhost:8000/api/admin/manage/auth/request-otp" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com"}'

# Step 2: Verify OTP and get token
curl -X POST "http://localhost:8000/api/admin/manage/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "otp": "123456"
  }'
```

## Environment Variables

Add these to your `.env` file for email functionality:

```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@launchkart.com
JWT_SECRET=your-secret-key
```

## Security Features

1. **OTP Expiration**: OTPs expire after 10 minutes
2. **Attempt Limiting**: Maximum 3 failed OTP attempts
3. **Permission Checks**: All admin actions require specific permissions
4. **Audit Logging**: All admin actions are logged
5. **Self-Demotion Prevention**: Admins cannot demote themselves
6. **KYC Requirement**: Only verified users can become admins

## Database Collections

The system uses these MongoDB collections:

- `admin_users`: Admin user records
- `admin_audit_logs`: Audit trail of admin actions
- `users`: Regular user records (updated with admin role)

## Frontend Integration

To integrate with the frontend:

1. Create an admin portal at `/admin-portal`
2. Implement OTP request/verification flow
3. Use admin JWT tokens for authenticated requests
4. Display admin-specific UI based on permissions
5. Show audit logs and admin management tools

## Error Handling

Common error responses:

- `400`: Invalid request data or OTP
- `401`: Invalid authentication
- `403`: Permission denied
- `404`: Resource not found
- `500`: Internal server error

## Best Practices

1. **Regular Audit Reviews**: Regularly review audit logs
2. **Permission Principle**: Grant minimum required permissions
3. **Secure Email**: Use secure SMTP settings
4. **Token Management**: Implement proper token refresh
5. **Monitoring**: Monitor admin login patterns 