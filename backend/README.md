# Teacher Portal Backend

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

The server will run on `http://localhost:3000`

## API Endpoints

### POST /api/login
Login endpoint that accepts username and password.

**Request:**
```json
{
  "username": "teacher1",
  "password": "teacher123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "username": "teacher1"
  }
}
```

**Response (Error):**
```json
{
  "error": "Invalid username or password"
}
```

## Test Credentials

- Username: `teacher1` or `teacher2`
- Password: `teacher123`

## Notes

- Currently uses in-memory user storage (sample data)
- In production, integrate with a real database
- Consider adding JWT tokens for session management
