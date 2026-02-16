# 📚 Teacher Portal - Documentation Index

## Getting Started
| Document | Purpose | Time |
|----------|---------|------|
| [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) | Fast lookup for developers | 5 min |
| [SETUP.md](./SETUP.md) | First-time setup guide | 15 min |
| [DEPENDENCIES.md](./DEPENDENCIES.md) | System requirements & versions | 10 min |

## Configuration & Management
| Document | Purpose | When |
|----------|---------|------|
| [config/environment.js](./config/environment.js) | Centralized config file | Every start |
| [config/ENVIRONMENT_PRESETS.md](./config/ENVIRONMENT_PRESETS.md) | Dev/Staging/Production settings | Setup & deployment |
| [.env.example](./.env.example) | Environment template | Initial setup |

## Operations & Maintenance
| Document | Purpose | Frequency |
|----------|---------|-----------|
| [MAINTENANCE.md](./MAINTENANCE.md) | Maintenance tasks & checklists | Weekly/Monthly |
| [SETUP.md - Production](./SETUP.md#production-deployment) | Production deployment | One-time setup |
| [SETUP.md - Troubleshooting](./SETUP.md#troubleshooting) | Common issues & solutions | As needed |

---

## 📁 System Organization

### Root Level (`.` - Project Root)
```
.env                    ← Active environment variables (DO NOT COMMIT)
.env.example            ← Template for .env (COMMIT THIS)
DEPENDENCIES.md         ← ALL dependencies documented
SETUP.md               ← Complete setup instructions
MAINTENANCE.md         ← Task checklists & procedures
QUICK_REFERENCE.md     ← Developer quick lookup
config/                ← Configuration management
backend/               ← Backend server code
frontend/              ← Frontend UI code
```

### Config Folder (`config/`)
```
environment.js                ← Main configuration handler
ENVIRONMENT_PRESETS.md        ← Dev/Staging/Prod templates
```

### Backend Folder (`backend/`)
```
.env.example                  ← Backend environment template
package.json                  ← Node dependencies & scripts
package-lock.json            ← Locked dependency versions
server.js                     ← Express server entry point
database/                     ← SQLite database (auto-created)
  └── teacher_portal.db       ← Actual database file
scripts/                      ← Utility scripts
  ├── list_users.js
  ├── set_main_admin.js
  └── ... other management scripts
```

### Frontend Folder (`frontend/`)
```
login.html                    ← Login page
portal.html                  ← Home dashboard
manage.html                  ← Student management
attendance.html              ← Daily attendance
attendance-report.html       ← Attendance reports
user-management.html         ← Admin user management
portal.js                    ← Main JavaScript
user-management.js           ← User admin JS
login.js                     ← Login JS
portal.css                   ← Main styles
login.css                    ← Login styles
resources/                   ← Images & assets
  └── techvision.png        ← Logo
```

---

## 🚀 Workflow Overview

### First Time Setup
```
1. Clone/Extract project
2. Read: SETUP.md
3. Run: cp .env.example .env
4. Configure: Edit .env file
5. Install: npm install (in backend/)
6. Start: npm start
7. Access: http://localhost:3000
```

### Weekly Operations
```
1. Check: Review QUICK_REFERENCE.md
2. Monitor: Server logs for errors
3. Backup: Database backup
4. Refer: MAINTENANCE.md - Weekly checklist
```

### Monthly Operations
```
1. Update: npm outdated / npm audit
2. Backup: Full database backup
3. Review: MAINTENANCE.md - Monthly checklist
4. Security: npm audit fix
```

### Deployment
```
1. Read: SETUP.md - Production Deployment
2. Configure: Edit .env for production
3. Security: Set strong JWT_SECRET
4. Deploy: Follow production steps
5. Monitor: Check server health
```

---

## 📋 Environment Configuration

### Development (.env)
Used for local development with debug output.

### Staging (.env.staging)
Mimics production but allows more logging.
Located in: config/ENVIRONMENT_PRESETS.md

### Production (.env.production)
Secure configuration for live deployment.
Located in: config/ENVIRONMENT_PRESETS.md

**How to switch:**
```bash
cp .env.staging .env    # For staging
cp .env.production .env # For production
```

---

## 🔐 Security Checklist

- [ ] JWT_SECRET is 32+ characters (random)
- [ ] CORS_ORIGIN is set correctly
- [ ] .env is in .gitignore (never committed)
- [ ] Database backups have restricted access
- [ ] npm audit shows no critical issues
- [ ] HTTPS is enabled in production
- [ ] Passwords are bcrypt hashed

More details: See SETUP.md - Production Deployment

---

## 📊 Dependency Overview

### Backend Dependencies (in package.json)
- **express** - Web framework
- **cors** - Cross-origin requests
- **bcrypt** - Password hashing
- **sqlite3** - Database

### System Requirements
- Node.js: v14+
- npm: v6+

Full list: See DEPENDENCIES.md

---

## 🛠️ Common Tasks Reference

### Start Server
```bash
cd backend && npm start
```

### Check Dependencies
```bash
npm outdated              # See what's outdated
npm audit                 # Security check
npm audit fix             # Auto-fix vulnerabilities
```

### List Users
```bash
cd backend && node scripts/list_users.js
```

### Set Main Admin
```bash
cd backend && node scripts/set_main_admin.js
```

### Backup Database
```bash
cp backend/database/teacher_portal.db backup/backup_$(date +%Y%m%d).db
```

More commands: See QUICK_REFERENCE.md

---

## 📞 Quick Help

| Need Help With | See |
|---|---|
| First time setup | **SETUP.md** |
| Running commands | **QUICK_REFERENCE.md** |
| Dependencies & versions | **DEPENDENCIES.md** |
| Maintenance tasks | **MAINTENANCE.md** |
| Environment variables | **config/ENVIRONMENT_PRESETS.md** |
| Troubleshooting | **SETUP.md - Troubleshooting** |
| Production deployment | **SETUP.md - Production Deployment** |

---

## ✅ Best Practices

1. **Always** read from `.env.example` when updating .env
2. **Never** commit `.env` file to git
3. **Backup** database before major changes
4. **Update** npm packages monthly
5. **Monitor** server logs regularly
6. **Rotate** JWT_SECRET annually
7. **Test** backup restoration quarterly
8. **Document** any custom configurations

---

## 📝 Documentation Maintenance

After making changes, update:
- [ ] DEPENDENCIES.md (if adding packages)
- [ ] SETUP.md (if changing setup process)
- [ ] MAINTENANCE.md (if new maintenance tasks)
- [ ] QUICK_REFERENCE.md (if new commands/endpoints)
- [ ] config/ENVIRONMENT_PRESETS.md (if env vars change)

---

**Last Updated**: February 16, 2026  
**Status**: Complete  
**Version**: 1.0
