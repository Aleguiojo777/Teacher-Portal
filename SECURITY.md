# TEACHER PORTAL - SECURITY DOCUMENTATION

## Overview
This document outlines the security measures implemented in the Teacher Portal system.

---

## 🔐 Security Features Implemented

### 1. **No Hardcoded Default Credentials**
- ✅ Removed automatic admin creation on startup
- ✅ Admins must be created explicitly by authorized personnel
- ✅ Prevents unauthorized access from known default credentials

### 2. **JWT Secret Management**
- ✅ JWT_SECRET is now required and must be configured in `.env`
- ✅ Server will not start without a valid JWT_SECRET in production
- ✅ Use strong random 64+ character secrets generated via cryptography

### 3. **Strict CORS Policy**
- ✅ CORS restricted to only `CORS_ORIGIN` environment variable
- ✅ Production mode requires explicit CORS_ORIGIN configuration
- ✅ Only allows GET, POST, PUT, DELETE, OPTIONS methods
- ✅ Credentials-based requests only from allowed origins

### 4. **Removed Debug Endpoints**
- ✅ Removed `/api/debug/dbinfo` endpoint that exposed:
  - Database file location
  - Admin email addresses and IDs
  - Admin credentials
- ✅ Removed verbose stack traces from error responses

### 5. **Input Validation**
- ✅ Email validation on login/registration
- ✅ Password minimum length enforcement (8+ characters)
- ✅ All API inputs validated before database operations
- ✅ SQL injection protection via parameterized queries

### 6. **Token-Based Authentication**
- ✅ All protected endpoints require valid JWT token
- ✅ Token verification on every request
- ✅ Token format: Base64-encoded JSON with adminId and timestamp
- ✅ Tokens must be sent in Authorization header: `Bearer <token>`

### 7. **Role-Based Access Control (RBAC)**
- ✅ Admin-only endpoints check `isAdmin` flag
- ✅ Main admin-only operations check `isMain` flag
- ✅ Teachers can only access their own student data
- ✅ Prevents privilege escalation

### 8. **Environment Configuration**
- ✅ `.env` file NOT committed to version control (in `.gitignore`)
- ✅ All secrets managed via environment variables
- ✅ Production mode enforces strict configuration

---

## 🚀 Initial Setup & Admin Creation

### Step 1: Configure Environment
Edit `backend/.env`:
```bash
NODE_ENV=production
JWT_SECRET=<GENERATE_STRONG_SECRET>
CORS_ORIGIN=http://your-frontend-domain.com
```

Generate a strong JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 2: Create Main Administrator
Run the secure admin creation script:
```bash
cd backend
node scripts/create_main_admin.js
```

Follow the prompts to create the main admin account:
- Full Name
- Email Address
- Password (minimum 8 characters)

Example:
```
Full Name: John Admin
Email Address: admin@techvision.edu
Password (min 8 chars): YourSecurePassword123!
Confirm Password: YourSecurePassword123!

[SUCCESS] Main Administrator Created!
Admin ID: 1
Name: John Admin
Email: admin@techvision.edu
Role: Main Administrator (isMain=1, isAdmin=1)
```

### Step 3: Start the Server
```bash
npm start
```

---

## 🔑 API Authentication

### Getting a Token
**Login Endpoint:**
```
POST /api/admin/login
Content-Type: application/json

{
  "email": "admin@techvision.edu",
  "password": "YourSecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "admin": {
    "id": 1,
    "fullName": "John Admin",
    "email": "admin@techvision.edu",
    "isAdmin": 1,
    "isMain": 1
  },
  "token": "eyJhZG1pbklkIjoxLCJ0aW1lc3RhbXAiOjE3NzE4MjU4ODA0NTJ9"
}
```

### Using a Token
Add to all protected requests:
```
Authorization: Bearer <token>
```

Example:
```bash
curl -H "Authorization: Bearer eyJhZG1pbklkIjoxLCJ0aW1lc3RhbXAiOjE3NzE4MjU4ODA0NTJ9" \
  http://localhost:3000/api/students
```

---

## 📋 Protected Endpoints Requiring JWT Token

All these endpoints require valid JWT token:

```
GET    /api/students              - List students (admins see all, teachers see own)
GET    /api/students/:id          - Get student details
POST   /api/students              - Create student
PUT    /api/students/:id          - Update student
DELETE /api/students/:id          - Delete student

POST   /api/attendance            - Record attendance
GET    /api/attendance/:date      - Get attendance for date
GET    /api/reports/attendance    - Get attendance report (date range)

GET    /api/users                 - List all users (admin only)
POST   /api/users                 - Create user (admin only)
PUT    /api/users/:id             - Update user (admin only)
DELETE /api/users/:id             - Delete user (main admin only)

GET    /api/health                - Health check (no sensitive info)
GET    /                          - Serve login page
```

---

## 🚨 Security Best Practices

### For System Administrators:
1. ✅ Keep `.env` file private - add to `.gitignore`
2. ✅ Use strong, unique passwords (minimum 8 characters recommended: 12+)
3. ✅ Rotate JWT_SECRET periodically
4. ✅ Store JWT_SECRET in a secure vault (not hardcoded)
5. ✅ Only main admin can delete users
6. ✅ Audit logs for admin actions (logs folder)
7. ✅ Use HTTPS in production (configure reverse proxy with SSL)
8. ✅ Keep Node.js and dependencies up to date
9. ✅ Run security audits: `npm audit`

### For Frontend/Token Storage:
1. ✅ Store JWT in localStorage (already handled by portal.js)
2. ✅ Clear token on logout
3. ✅ Do NOT expose token in console logs
4. ✅ Do NOT commit token to version control
5. ✅ Send token only over HTTPS

### For Database:
1. ✅ Database file path: `backend/database/teacher_portal.db`
2. ✅ Regularly backup database to secure location
3. ✅ Restrict file permissions: `chmod 600 database.db`
4. ✅ Do NOT expose database to public network
5. ✅ Run on isolated VPC/network in production

---

## 📊 User Role Hierarchy

**Main Administrator (isMain=1, isAdmin=1)**
- Create users (admin and teacher)
- Delete users
- Update user credentials
- View all student data
- View all attendance
- Manage all system settings

**Administrator (isAdmin=1, isMain=0)**
- Create users (admin and teacher)
- Update own account
- View all student data
- View all attendance
- Cannot delete users
- Cannot edit main admin

**Teacher (isAdmin=0)**
- View own student data
- Record own student attendance
- Update own account
- Cannot view other teacher's students
- Cannot create users
- Cannot delete users

---

## 🔄 Changing Admin Credentials

### Main Admin Password Reset:
```bash
# For secured production environments, require admin to:
# 1. Login via web UI
# 2. Use User Management page to reset their own password
# 3. Or delete user and recreate via create_main_admin.js
```

### Emergency: Create New Main Admin
If main admin is unavailable:
```bash
cd backend
node scripts/create_main_admin.js
# Create a new main admin account
# Use User Management to delete old admin if needed
```

---

## 🧪 Security Testing

### Test Unauthorized Access:
```bash
# Without token (should fail with 401)
curl http://localhost:3000/api/students

# With invalid token (should fail with 401)
curl -H "Authorization: Bearer invalid_token" http://localhost:3000/api/students

# With valid token (should succeed)
curl -H "Authorization: Bearer <valid_token>" http://localhost:3000/api/students
```

### Check for SQL Injection:
All query parameters are parameterized (using `?` placeholders).
Test: Attempts to inject SQL will fail safely.

### Check CORS:
```bash
# Cross-origin requests from unauthorized origins should be blocked
curl -H "Origin: http://evil.com" -H "Access-Control-Request-Method: GET" \
  http://localhost:3000/api/students
```

---

## 📝 Audit & Monitoring

### Server Logs:
- All authentication attempts logged
- Admin actions logged
- Error messages in `[ERROR]` format
- Debug info in `[DEBUG]` format

### Database Audit Trail:
- `createdAt` timestamp on all users
- `createdBy` tracks student creator
- `recordedBy` tracks attendance recorder

---

## 🔄 Environment Variables Reference

```bash
# Required in Production:
NODE_ENV=production
JWT_SECRET=<your-strong-secret-here>
CORS_ORIGIN=<your-frontend-url>

# Optional (defaults shown):
PORT=3000
DATABASE_PATH=./database/teacher_portal.db
JWT_EXPIRY=7d
LOG_LEVEL=info
ENABLE_REGISTRATION=false
```

---

## 📞 Support & Issues

For security issues:
1. Do NOT open public issues
2. Contact system administrators directly
3. Follow responsible disclosure practices
4. Document the vulnerability clearly
5. Allow time for patching before disclosure

---

**Last Updated:** February 23, 2026  
**Version:** 1.0 (Security Hardened)
