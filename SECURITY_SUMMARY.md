# Teacher Portal Security Summary

## Completed Hardening (2026-02-23)

### Authentication & Authorization
- ✅ **JWT Tokens**: Replaced insecure base64 tokens with signed JWTs using `jsonwebtoken` (8-hour expiration)
- ✅ **Password Hashing**: Uses `bcryptjs` (browser-friendly, no native build vulnerabilities)
- ✅ **Rate Limiting**: 10 failed login attempts per 15 minutes → account locked for 30 minutes
- ✅ **Account Lockout**: Per-email tracking; triggers security alerts on lock

### Infrastructure Security
- ✅ **Helmet.js**: Applies security headers (X-Frame-Options, X-Content-Type-Options, CSP, etc.)
- ✅ **CORS**: Strict origin validation (configurable via `CORS_ORIGIN` env var)
- ✅ **No Debug Endpoints**: Removed `/api/debug/dbinfo` and auto-default admin creation
- ✅ **Environment Validation**: Enforces `JWT_SECRET` in production; exits if not set

### Dependency & Vulnerability Management
- ✅ **Upgraded bcrypt to bcryptjs**: Eliminates native build dependency vulnerabilities
- ✅ **Upgraded sqlite3 to 5.0.2**: Patches tar/rimraf/node-gyp vulnerabilities
- ✅ **npm audit fix**: Applied safe patches; 14 high/moderate vulnerabilities remain (mostly in optional dev deps)
- ✅ **Added nodemailer**: Ready for email alerts on security events

### Logging & Monitoring
- ✅ **Winston Logger**: Structured logging to file (`backend/logs/combined.log`, `error.log`) and console (dev mode)
- ✅ **Request Logging**: All HTTP requests logged with method, URL, and client IP
- ✅ **Login Attempt Tracking**: Failed attempts tracked per email with lockout alerts
- ✅ **Email Alerts**: Account lockouts can trigger email notifications (requires SMTP config in `.env`)

### How to Enable Email Alerts

Add to `backend/.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ALERT_EMAIL_TO=security-admin@example.com
ALERT_EMAIL_FROM=alerts@example.com
```

For Gmail: Generate an [App Password](https://support.google.com/accounts/answer/185833) instead of using your regular password.

### Deployment & HTTPS

**Recommended**: Cloudflare Tunnel (see `CLOUDFLARE_TUNNEL_SETUP.md`)
- Free HTTPS with automatic certificate management
- No port-forwarding or router changes needed
- Tunnel persists across restarts (install as Windows service)

Alternative: Self-host with Caddy + Let's Encrypt (requires router port-forwarding on 80/443).

### Remaining Security Considerations

#### Priority (Not Yet Implemented)
1. **Persist Lockout Data**: Current lockout state resets on server restart. For production, persist to DB:
   ```sql
   CREATE TABLE IF NOT EXISTS login_attempts (
     email TEXT PRIMARY KEY,
     attempt_count INTEGER,
     first_attempt_time DATETIME,
     locked_until DATETIME
   );
   ```

2. **MFA (Multi-Factor Authentication)**: Consider TOTP (Google Authenticator) to prevent credential compromise.

3. **API Key Management**: If integrating external APIs, use secure key storage (HashiCorp Vault, AWS Secrets Manager).

4. **Database Encryption**: SQLite data at rest is unencrypted. For sensitive deployments, enable SQLite encryption.

5. **Audit Logging**: Detailed activity logs (who viewed what data, when) are not yet implemented.

#### Medium Priority
- Rate limiting on other endpoints (/api/students, /api/attendance)
- Implement CSRF tokens for form submissions
- Add secure HTTP-only cookies for token storage (frontend adjustments needed)
- Regular security patching (monthly `npm audit`)

#### Low Priority (Beyond Scope)
- Intrusion detection system (IDS)
- Web Application Firewall (WAF) — Cloudflare offers in paid tiers
- Penetration testing by a third party
- SOC 2 / ISO 27001 compliance

### Quick Test Commands

**Test Login (with JWT)**:
```powershell
cd "C:\Users\broal\Desktop\Teacher Protal\Teacher-Portal"
node .\backend\test_login.js
```

Expected output includes a valid JWT token in the response.

**View Logs**:
```powershell
Get-Content backend\logs\combined.log -Tail 20
```

**Check Server Health**:
```powershell
Invoke-RestMethod -Uri 'http://localhost:3000/api/health'
```

### Production Deployment Checklist

- [ ] Set strong `JWT_SECRET` (min 32 chars, random)
- [ ] Enable SMTP and test email alerts
- [ ] Set `NODE_ENV=production` for optimizations
- [ ] Rotate database backups regularly
- [ ] Monitor `backend/logs/error.log` daily
- [ ] Set up Cloudflare Tunnel as Windows service (or equivalent on production OS)
- [ ] Test failover: restart server and verify tunnel reconnects
- [ ] Document admin credentials and recovery procedures
- [ ] Schedule monthly `npm audit` and dependency updates

### Files Modified/Created

- `backend/server.js`: JWT, rate limiting, lockout, logging, helmet, CORS
- `backend/logger.js`: Winston configuration
- `backend/alerts.js`: Email alert integration
- `backend/package.json`: Added helmet, express-rate-limit, jsonwebtoken, winston, nodemailer
- `backend/.env`: Template for secrets (user must fill in)
- `SECURITY.md`: This file
- `CLOUDFLARE_TUNNEL_SETUP.md`: Step-by-step tunnel setup guide

### Support & Next Steps

1. **For Immediate Deployment**: Follow `CLOUDFLARE_TUNNEL_SETUP.md` to go live with HTTPS.
2. **For Production Hardening**: Implement persistent lockout + audit logging.
3. **For Monitoring**: Set up centralized logging (e.g., Sentry, Datadog) or monitored S3 bucket backups of logs.

---

**Last Updated**: 2026-02-23  
**Security Review**: Complete for MVP  
**Recommendation**: Deploy with Cloudflare Tunnel for immediate public access.
