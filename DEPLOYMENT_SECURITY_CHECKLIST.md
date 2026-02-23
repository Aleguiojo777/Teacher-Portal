# 🔐 TEACHER PORTAL - DEPLOYMENT SECURITY CHECKLIST

## Pre-Deployment Security Review

### ✅ Backend Security
- [ ] `.env` file created with strong random `JWT_SECRET` (64+ chars)
- [ ] `.env` file is in `.gitignore` (NOT committed to git)
- [ ] `NODE_ENV=production` set in production environment
- [ ] `CORS_ORIGIN` set to actual frontend domain (not localhost)
- [ ] Database path verified and directory exists with proper permissions
- [ ] Main admin created via `scripts/create_main_admin.js`
- [ ] All default/hardcoded credentials removed
- [ ] `/api/debug/dbinfo` endpoint removed (verified it's gone)
- [ ] Dependencies up to date: `npm audit` passes
- [ ] No console errors or warnings on startup
- [ ] Server starts successfully with `npm start`

### ✅ Frontend Security
- [ ] Login page loads correctly: `http://localhost:3000/`
- [ ] Authentication token stored in localStorage
- [ ] All API calls include Authorization header with token
- [ ] Cross-site scripting protections in place (CSP headers)
- [ ] No sensitive data in HTML/JS source code
- [ ] No hardcoded API keys or credentials
- [ ] `applyUserVisibility()` called on all pages to enforce RBAC
- [ ] User Management link hidden for non-admins
- [ ] Logout properly clears token and redirects to login

### ✅ Database Security
- [ ] Database file permissions restricted: `chmod 600 teacher_portal.db`
- [ ] Database stored outside web-accessible directories
- [ ] No database credentials in source code
- [ ] Database path from environment variables only
- [ ] Regular backups automated and tested
- [ ] Database integrity verified

### ✅ Access Control
- [ ] Admin-only endpoints require `isAdmin=1` check ✓
- [ ] Main admin operations require `isMain=1` check ✓
- [ ] Teachers cannot access other teachers' students (verified)
- [ ] All endpoints verify valid JWT token
- [ ] Role-based endpoint access enforced
- [ ] User can only edit own account (except admins)

### ✅ Network & Infrastructure
- [ ] HTTPS/SSL configured for production
- [ ] Backend not exposed directly to internet (reverse proxy in place)
- [ ] CORS strictly configured to allowed domains only
- [ ] Firewall rules enforce production access
- [ ] Database only accessible from backend server
- [ ] No debug ports exposed (3000 internal only)

### ✅ Monitoring & Logging
- [ ] Error logs captured and monitored
- [ ] Authentication logs enabled
- [ ] Admin action logs captured
- [ ] Log rotation configured
- [ ] Suspicious activity alerts configured
- [ ] Database backup logs verified
- [ ] No sensitive data in logs

### ✅ Documentation
- [ ] SECURITY.md reviewed and understood
- [ ] Admin setup procedures documented
- [ ] Disaster recovery plan in place
- [ ] Password reset procedures documented
- [ ] Contact list for security incidents

---

## 🚀 Go-Live Checklist

### Final Verification
- [ ] Test login with created admin account
- [ ] Test student creation & management
- [ ] Test attendance marking
- [ ] Test user management (admin only)
- [ ] Verify CORS blocks unauthorized origins
- [ ] Verify debug endpoints are removed
- [ ] Test logout and re-login flow
- [ ] Verify token expiration works
- [ ] Test authorization on protected endpoints

### Production Environment
- [ ] `NODE_ENV=production` confirmed
- [ ] Strong `JWT_SECRET` generated and configured
- [ ] `CORS_ORIGIN` set to production domain
- [ ] Database backed up before rollout
- [ ] Monitoring alerts enabled
- [ ] Team trained on admin procedures
- [ ] Incident response plan ready
- [ ] Support documentation available

---

## 🔄 Ongoing Security Maintenance

### Weekly
- [ ] Review error logs for anomalies
- [ ] Check for failed login attempts
- [ ] Verify backup completion

### Monthly
- [ ] Run `npm audit` for vulnerabilities
- [ ] Review user access logs
- [ ] Verify database backups
- [ ] Test disaster recovery plan
- [ ] Review CORS configuration

### Quarterly
- [ ] Security audit of codebase
- [ ] Penetration testing if possible
- [ ] Review and update SECURITY.md
- [ ] Team security training refresh

### Annually
- [ ] Full security assessment
- [ ] Compliance check (GDPR, FERPA, etc.)
- [ ] Disaster recovery full test
- [ ] Update security policies

---

## 🚨 Incident Response

### If Compromised:
1. [ ] Immediately revoke all active JWT tokens (restart server without JWT_SECRET)
2. [ ] Change JWT_SECRET and restart server
3. [ ] Reset all admin passwords via script
4. [ ] Review audit logs for unauthorized access
5. [ ] Check database for unauthorized data modifications
6. [ ] Notify affected users
7. [ ] Document incident
8. [ ] Post-mortem analysis

### If Data Leaked:
1. [ ] Identify what data was exposed
2. [ ] Determine affected users
3. [ ] Notify users immediately
4. [ ] Document timeline of incident
5. [ ] Implement preventive measures
6. [ ] Review backup retention policy

---

## 📋 Admin Credentials Management

### Initial Setup:
```bash
node scripts/create_main_admin.js
```
Secure prompt guides through safe admin creation.

### Password Reset:
1. Main admin can update own password via User Management UI
2. Other admins can reset via User Management (main admin only)
3. Emergency: Create new admin via script, delete old one

### Credential Rotation (Recommended Quarterly):
```bash
# All admins update passwords via User Management
# Delete unused admin accounts
# Review all user access logs
```

---

## ✨ Security Features Verification

```bash
# Verify debug endpoint is removed
curl http://localhost:3000/api/debug/dbinfo
# Expected: 404 Not Found (GOOD) or Connection Refused (GOOD)

# Verify token required for students endpoint
curl http://localhost:3000/api/students
# Expected: 401 Unauthorized (GOOD)

# Verify CORS restriction
curl -H "Origin: http://evil.com" http://localhost:3000/api/health
# Expected: CORS block or success (depends on browser/curl)

# Verify health endpoint works
curl http://localhost:3000/api/health
# Expected: {"status":"ok"} (GOOD - minimal info)
```

---

## 📞 Emergency Contacts

Document here:
- [ ] System Administrator: ________________
- [ ] Database Administrator: ______________
- [ ] Security Officer: ___________________
- [ ] Incident Response Team: _____________
- [ ] Backup & Recovery: __________________

---

## 📝 Sign-Off

- [ ] Security Review Completed: __________ (date)
- [ ] Reviewer Name: _____________________
- [ ] Approved for Production: __________ (date)
- [ ] Deployment Authority: _____________

---

**Last Updated:** February 23, 2026  
**Version:** 1.0
