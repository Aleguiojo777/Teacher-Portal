# Teacher Portal - Setup & Maintenance Guide

## Initial Setup

### 1. Environment Configuration
```bash
# Create .env file from template
cp .env.example .env

# Edit .env with your values (important in production!)
# Minimum required: JWT_SECRET
```

### 2. Backend Installation
```bash
cd backend
npm install
```

### 3. Database Setup
The database is automatically created on first run in `./database/teacher_portal.db`

### 4. Start the Server
```bash
cd backend
npm start          # Production mode
# or
npm run dev        # Development mode
```

### 5. Access Frontend
- Open browser to `http://localhost:3000`
- Frontend files are in `/frontend` directory

## Project Structure

```
Teacher-Portal/
├── config/
│   └── environment.js          # Centralized environment configuration
├── backend/
│   ├── .env.example            # Backend environment template
│   ├── package.json            # Backend dependencies
│   ├── server.js               # Main server file
│   ├── scripts/                # Database scripts
│   └── database/               # SQLite database (auto-created)
├── frontend/
│   ├── *.html                  # HTML pages
│   ├── *.js                    # JavaScript files
│   ├── *.css                   # Stylesheets
│   └── resources/              # Images and assets
├── .env.example                # Environment template (root)
├── .env                        # Actual environment variables (create from template)
├── DEPENDENCIES.md             # This dependency documentation
└── SETUP.md                    # This setup guide
```

## Configuration Management

All configuration is centralized through the `config/environment.js` file:

```javascript
// In your backend code
const config = require('./config/environment');

console.log(config.server.port);      // 3000
console.log(config.database.path);    // ./database/teacher_portal.db
console.log(config.security.jwtSecret); // from .env
```

## Environment Variables

### Development (.env.example)
```
NODE_ENV=development
PORT=3000
DATABASE_PATH=./database/teacher_portal.db
JWT_SECRET=dev-secret-key
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=debug
```

### Production
Change values in .env before deploy:
- `NODE_ENV=production`
- `JWT_SECRET=strong-random-secret-key` (use a secure key generator!)
- `CORS_ORIGIN=your-production-domain.com`
- `LOG_LEVEL=info`

## Database Management

### Backup Database
```bash
# Windows
copy backend\database\teacher_portal.db backup\teacher_portal_backup.db

# Linux/Mac
cp backend/database/teacher_portal.db backup/teacher_portal_backup.db
```

### Database Scripts
Located in `backend/scripts/`:
- `set_main_admin.js` - Set main administrator
- `set_main_admin_password.js` - Reset admin password
- `dump_admins.py` - Export admin users
- `list_users.js` - List all users
- `truncate_users.js` - Clear user table (CAUTION!)

Usage:
```bash
cd backend
node scripts/list_users.js
```

## Troubleshooting

### Port 3000 Already in Use
```bash
# Windows - Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Database Locked
Delete `database/teacher_portal.db` and restart (data will be lost!)

### JWT Secret Missing
Ensure `.env` file exists and `JWT_SECRET` is set

### CORS Errors
Check `CORS_ORIGIN` in `.env` matches your frontend URL

## Maintenance Tasks

### Monthly
- Review logs and error messages
- Backup database
- Check for security updates: `npm outdated`

### Quarterly
- Update dependencies: `npm update`
- Review and rotate JWT_SECRET in production
- Test backup restoration

### Annually
- Major version updates review
- Security audit
- Performance benchmarking

## Dependency Updates

### Check for Updates
```bash
cd backend
npm outdated
```

### Update All
```bash
npm update
```

### Update Specific Package
```bash
npm install express@latest
```

### Security Updates
```bash
npm audit              # Show vulnerabilities
npm audit fix          # Auto-fix security issues
npm audit fix --force  # Force fix (may have breaking changes)
```

## Production Deployment

1. **Update .env**
   - Change NODE_ENV to production
   - Set secure JWT_SECRET
   - Update CORS_ORIGIN

2. **Install dependencies**
   ```bash
   npm install --production
   ```

3. **Start server**
   ```bash
   npm start
   ```

4. **Use process manager** (recommended)
   ```bash
   # Install PM2
   npm install -g pm2
   
   # Start with PM2
   pm2 start backend/server.js --name "teacher-portal"
   pm2 save
   pm2 startup
   ```

5. **Setup reverse proxy** (nginx/Apache)
   - Forward requests to localhost:3000
   - Enable SSL/HTTPS
   - Set proper headers

## Support

For issues or questions:
1. Check DEPENDENCIES.md for version info
2. Review logs in terminal
3. Check .env configuration
4. Contact system administrator
