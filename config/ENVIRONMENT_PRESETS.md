# Configuration Presets for Different Environments

## Development Environment (.env)
```
NODE_ENV=development
PORT=3000
DATABASE_PATH=./database/teacher_portal.db
JWT_SECRET=dev-secret-key-change-in-production
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=debug
ENABLE_REGISTRATION=false
```

## Staging Environment (.env.staging)
```
NODE_ENV=staging
PORT=3000
DATABASE_PATH=/var/data/teacher_portal.db
JWT_SECRET=staging-secret-key-use-strong-key
CORS_ORIGIN=https://staging.yourdomain.com
LOG_LEVEL=info
ENABLE_REGISTRATION=false
DB_CONNECTION_LIMIT=10
```

## Production Environment (.env.production)
```
NODE_ENV=production
PORT=3000
DATABASE_PATH=/var/data/teacher_portal.db
JWT_SECRET=use-strong-random-key-min-32-chars
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=warn
ENABLE_REGISTRATION=false
DB_CONNECTION_LIMIT=20
```

## Generate Secure JWT Secret

### Using Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Using OpenSSL
```bash
openssl rand -hex 32
```

### Using Python
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

## Switch Between Environments

### Automated (Recommended)
Update config/environment.js to support environment switching:

```javascript
// Load environment-specific .env file
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
require('dotenv').config({ path: path.join(__dirname, '../' + envFile) });
```

### Manual Switching
```bash
# Development
cp .env.example .env

# Staging
cp .env.staging .env

# Production
cp .env.production .env
```
