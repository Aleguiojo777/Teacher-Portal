# Teacher Portal - System Dependencies

## Backend Dependencies

### Production Dependencies
- **express** (^4.18.2) - Web server framework
- **cors** (^2.8.5) - Cross-Origin Resource Sharing middleware
- **bcrypt** (^5.1.1) - Password hashing and encryption
- **sqlite3** (^5.1.7) - SQLite database driver

### Development Dependencies
- None specified (uses runtime Node.js features)

## Frontend Dependencies

### Runtime
- None - Uses vanilla JavaScript (no build step required)

### Optional Enhancements
- None currently, but can add:
  - Webpack/Vite for bundling
  - TypeScript for type safety
  - ESLint for code quality

## System Requirements

### Node.js & npm
- Node.js: v14+ (tested with current LTS)
- npm: v6+

### Recommended
- Git for version control
- SQLite3 CLI (optional, for database inspection)

## Installation

### Backend Setup
```bash
cd backend
npm install
```

### Frontend Setup
Frontend is pure HTML/CSS/JavaScript - no npm installation needed.

## Environment Configuration

See `.env.example` in the root directory for required environment variables:
- `JWT_SECRET` - Secret key for JWT tokens
- `NODE_ENV` - Development or production mode
- `PORT` - Server port (default: 3000)
- `DATABASE_PATH` - SQLite database file location
- `CORS_ORIGIN` - Allowed CORS origin

## Database

- **Type**: SQLite3
- **Location**: `./database/teacher_portal.db`
- **Schema**: Auto-created on first run

## Optional Tools

### Tunneling (for testing on mobile/external devices)
Choose one:
- **ngrok**: `npm run tunnel`
- **LocalTunnel**: `npm run tunnel:lt`

Requires ngrok or localtunnel to be installed globally.

## Version Compatibility

| Component | Version | Status |
|-----------|---------|--------|
| Node.js | 14+ | Tested |
| npm | 6+ | Tested |
| Express | 4.18.2 | Current |
| SQLite3 | 5.1.7 | Current |
| bcrypt | 5.1.1 | Current |
