# Quick Reference Guide

## Start Development Server
```bash
cd backend
npm install
npm start
# Open http://localhost:3000 in browser
```

## Directory Structure Quick Reference

```
Teacher-Portal/
├── config/                 # Centralized configuration
│   ├── environment.js      # Main config file (use this!)
│   └── ENVIRONMENT_PRESETS.md
├── backend/
│   ├── .env.example        # Copy to .env
│   ├── package.json        # Dependencies
│   ├── server.js           # Express server
│   ├── database/           # Auto-created SQLite DB
│   └── scripts/            # Utility scripts
├── frontend/               # Pure HTML/CSS/JS (no build)
│   ├── login.html
│   ├── portal.html
│   ├── manage.html         # Student management
│   └── *.js / *.css
├── .env.example            # Root environment template
├── DEPENDENCIES.md         # All packages & versions
├── SETUP.md               # Setup instructions
├── MAINTENANCE.md         # Maintenance tasks
└── README.md              # Project info
```

## Key Files to Know

| File | Purpose | Edit? |
|------|---------|-------|
| `.env` | Environment variables | YES (create from .env.example) |
| `config/environment.js` | Configuration management | Rarely |
| `backend/server.js` | Express server entry | Maybe |
| `backend/package.json` | Dependencies list | When adding packages |
| `frontend/*.html` | Frontend pages | Yes (UI changes) |
| `DEPENDENCIES.md` | Package documentation | Update when adding deps |

## Common Commands

```bash
# Setup (first time)
npm install
cp .env.example .env

# Run server
npm start

# Check dependencies
npm outdated      # Show outdated packages
npm audit         # Check security issues
npm audit fix     # Auto-fix vulnerabilities

# Database scripts
node scripts/list_users.js
node scripts/set_main_admin.js

# Utilities (from backend dir)
npm run tunnel    # ngrok tunneling
npm run tunnel:lt # LocalTunnel tunneling
```

## Environment Variables at a Glance

| Variable | Purpose | Example |
|----------|---------|---------|
| `NODE_ENV` | dev/prod mode | `development` |
| `PORT` | Server port | `3000` |
| `JWT_SECRET` | Token secret (IMPORTANT!) | `long-random-string` |
| `DATABASE_PATH` | SQLite file location | `./database/teacher_portal.db` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3000` |
| `LOG_LEVEL` | Logging verbosity | `debug` / `info` |

## API Endpoints Reference

### Authentication
- `POST /api/login` - User login
- `POST /api/auth/verify` - Verify token

### Students
- `GET /api/students` - List all students
- `POST /api/students` - Create student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Users
- `GET /api/users` - List users (admin only)
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Attendance
- `GET /api/attendance/:date` - Get attendance records
- `POST /api/attendance` - Record attendance

## Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 3000 in use | Kill process: `lsof -ti:3000 \| xargs kill -9` |
| .env not found | Run `cp .env.example .env` |
| JWT_SECRET error | Set JWT_SECRET in .env |
| CORS error | Check CORS_ORIGIN matches frontend URL |
| DB locked | Restart server or delete DB file |
| Slow performance | Backup & compact database |

## Adding New Dependencies

```bash
cd backend
npm install package-name
npm install package-name --save-dev  # Dev only

# Update DEPENDENCIES.md after!
```

## Git Operations

```bash
# Check status
git status

# Add changes
git add .
git commit -m "Description of changes"

# Push to remote
git push origin main

# Never commit
# - .env (security!)
# - node_modules/ (too large)
# - database/teacher_portal.db (local data)
```

## Frontend Navigation

- **portal.html** - Home/Dashboard
- **manage.html** - Student Management (CRUD)
- **attendance.html** - Daily Attendance
- **attendance-report.html** - Attendance Reports
- **user-management.html** - Admin User Management
- **login.html** - Login page

## Testing URLs

```
Local: http://localhost:3000
Login: http://localhost:3000/login.html
Dashboard: http://localhost:3000/portal.html
Students: http://localhost:3000/manage.html
Attendance: http://localhost:3000/attendance.html
Users: http://localhost:3000/user-management.html
```

## Performance Metrics

Track these to ensure smooth operation:
- Server response time: < 200ms
- Database queries: < 100ms
- Page load time: < 2s
- Memory usage: < 500MB
- CPU usage: < 30%

## Need to remember?

1. **Always backup database before major changes**
2. **Use strong JWT_SECRET in production**
3. **Update dependencies monthly**
4. **Test backup restoration regularly**
5. **Keep .env secure (never commit it)**
