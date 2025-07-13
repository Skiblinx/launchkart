# LaunchKart Backend

A comprehensive backend API for the LaunchKart platform, built with FastAPI and MongoDB.

## Features

- **User Management**: Registration, authentication, and profile management
- **KYC System**: Document verification and user validation
- **Business Essentials**: AI-powered asset generation (logos, landing pages, etc.)
- **Mentorship**: Mentor-mentee matching and session management
- **Service Requests**: Service marketplace functionality
- **Investment**: Pitch submission and investor matching
- **Analytics**: Platform analytics and reporting
- **Admin Management**: User-to-admin promotion system with OTP authentication

## Quick Start

### Prerequisites

- Python 3.8+
- MongoDB (local or Atlas)
- SMTP server for email functionality

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd launchkart/backend
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**
   Create a `.env` file in the backend directory:
   ```env
   MONGO_URL=mongodb://localhost:27017
   DB_NAME=launchkart
   JWT_SECRET=your-secret-key-here
   
   # Email configuration (for admin system)
   SMTP_SERVER=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   FROM_EMAIL=noreply@launchkart.com
   ```

4. **Start the server**
   ```bash
   # From project root
   uvicorn backend.server:app --reload
   
   # Or from backend directory
   uvicorn server:app --reload
   ```

5. **Access the API**
   - API Documentation: http://localhost:8000/docs
   - Alternative docs: http://localhost:8000/redoc

## Admin System Setup

The admin management system allows existing users to be promoted to admin roles with specific permissions.

### 1. Create First Admin User

Run the setup script to create your first admin user:

```bash
cd backend
python setup_admin.py
```

This script will:
- Check if an admin already exists
- Verify the user exists in the platform
- Ensure the user has verified KYC
- Create the admin user with super admin privileges

### 2. Admin Authentication

Admins use OTP-based authentication:

1. **Request OTP**
   ```bash
   curl -X POST "http://localhost:8000/api/admin/manage/auth/request-otp" \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@example.com"}'
   ```

2. **Verify OTP**
   ```bash
   curl -X POST "http://localhost:8000/api/admin/manage/auth/verify-otp" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@example.com",
       "otp": "123456"
     }'
   ```

3. **Use Admin Token**
   Use the returned JWT token in the Authorization header for admin API calls.

### 3. Admin API Endpoints

- `GET /api/admin/manage/eligible-users` - Get users eligible for promotion
- `POST /api/admin/manage/promote-user` - Promote user to admin
- `POST /api/admin/manage/demote-admin/{admin_id}` - Demote admin to user
- `GET /api/admin/manage/me` - Get current admin profile

## Testing

### Test Admin System

Run the admin system test to verify everything is working:

```bash
cd backend
python test_admin_system.py
```

### Test API Endpoints

1. **Start the server**
   ```bash
   uvicorn backend.server:app --reload
   ```

2. **Visit the interactive docs**
   - http://localhost:8000/docs

3. **Test endpoints directly**
   - Use the built-in Swagger UI to test all endpoints
   - Or use curl/Postman for programmatic testing

## Troubleshooting

### Common Issues

1. **Import Errors**
   ```bash
   # Install dependencies
   pip install -r requirements.txt
   
   # If using virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **MongoDB Connection Issues**
   - Ensure MongoDB is running
   - Check MONGO_URL in .env file
   - For local MongoDB: `mongod`
   - For Docker: `docker run -d -p 27017:27017 --name mongodb mongo:latest`

3. **Email Configuration**
   - For Gmail, use App Passwords (not regular password)
   - Enable 2FA on your Google account
   - Generate App Password: Google Account → Security → App Passwords

4. **Admin System Issues**
   - Ensure user exists in platform before promoting to admin
   - User must have verified KYC status
   - Check SMTP settings for OTP emails

### Linter Errors

If you see linter errors about unresolved imports:

1. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Check Python path**
   ```bash
   # Run from project root, not backend directory
   uvicorn backend.server:app --reload
   ```

3. **Verify imports**
   ```bash
   python test_admin_system.py
   ```

## API Structure

### Core Endpoints

- **Authentication**: `/api/auth/*`
- **Users**: `/api/users/*`
- **KYC**: `/api/kyc/*`
- **Business Essentials**: `/api/business-essentials/*`
- **Mentorship**: `/api/mentorship/*`
- **Services**: `/api/services/*`
- **Investment**: `/api/investment/*`
- **Analytics**: `/api/analytics/*`
- **Admin Management**: `/api/admin/manage/*`

### Database Collections

- `users` - User accounts and profiles
- `admin_users` - Admin user records
- `admin_audit_logs` - Admin action audit trail
- `kyc_documents` - KYC verification documents
- `user_assets` - Generated business assets
- `service_requests` - Service marketplace requests
- `mentorship_sessions` - Mentor-mentee sessions
- `pitch_submissions` - Investment pitch submissions

## Deployment

### Render Deployment

1. **Set environment variables** in Render dashboard
2. **Build command**: `pip install -r requirements.txt`
3. **Start command**: `uvicorn backend.server:app --host 0.0.0.0 --port $PORT`
4. **Working directory**: `backend`

### Environment Variables for Production

```env
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/launchkart
DB_NAME=launchkart
JWT_SECRET=your-secure-secret-key
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@launchkart.com
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License. 