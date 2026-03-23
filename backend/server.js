const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const logger = require('./logger');
const alerts = require('./alerts');

// Load environment variables
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON bodies
app.use(express.json());

// Basic security headers
app.use(helmet());

// Simple request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url} - ${req.ip}`);
  next();
});

// In-memory account lockout tracking (email -> { count, firstAttempt, lockedUntil })
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

// ============= ENVIRONMENT VALIDATION =============
function validateEnvironment() {
  const isDevelopment = (process.env.NODE_ENV || 'development') === 'development';
  const requiredVars = ['JWT_SECRET'];
  const missingVars = requiredVars.filter(v => !process.env[v]);

  if (missingVars.length > 0) {
    console.warn(`[WARNING] Missing environment variables: ${missingVars.join(', ')}`);
    if (!isDevelopment) {
      console.error('[ERROR] Required environment variables are missing. Exiting...');
      process.exit(1);
    }
  }

  // Warn if using default JWT_SECRET in production
  if (!isDevelopment && process.env.JWT_SECRET === 'change_this_to_a_secure_random_string_in_production_min_32_chars') {
    console.error('[ERROR] Cannot run in production with default JWT_SECRET. Please set a secure secret.');
    process.exit(1);
  }

  console.log(`[INFO] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[INFO] Database: ${process.env.DATABASE_PATH || './database/teacher_portal.db'}`);
  console.log(`[INFO] Log Level: ${process.env.LOG_LEVEL || 'debug'}`);
}

validateEnvironment();

// SECURITY: Strict CORS - only allow same origin
const allowedOrigins = [process.env.CORS_ORIGIN || 'http://localhost:3000'];
if (process.env.NODE_ENV === 'production' && !process.env.CORS_ORIGIN) {
  console.error('[SECURITY ERROR] CORS_ORIGIN must be set in production');
  process.exit(1);
}
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Add a relaxed Content Security Policy so the frontend can connect back to the API
app.use((req, res, next) => {
  // Allow same-origin resources and connections to localhost API during development
  res.setHeader('Content-Security-Policy', "default-src 'self'; connect-src 'self' http://localhost:3000 ws://localhost:3000; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval';");
  next();
});

// Serve static files from the frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

// Database setup
const db = new sqlite3.Database(path.join(__dirname, process.env.DATABASE_PATH || './database/teacher_portal.db'), (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  // Create admins table
  db.run(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fullName TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      isAdmin BOOLEAN DEFAULT 1,
      isMain INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating admins table:', err.message);
    } else {
      console.log('Admins table ready');
    }
  });

  // Ensure legacy databases have `isMain` column
  db.all("PRAGMA table_info(admins)", (err, cols) => {
    if (err) return;
    const hasIsMain = cols && cols.some(c => c.name === 'isMain');
    if (!hasIsMain) {
      db.run('ALTER TABLE admins ADD COLUMN isMain INTEGER DEFAULT 0', (alterErr) => {
        if (alterErr) console.error('Error adding isMain column:', alterErr.message);
        else console.log('Migrated admins table: added isMain column');
      });
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      contactNo TEXT NOT NULL,
      course TEXT NOT NULL,
      section TEXT NOT NULL,
      startTime TEXT,
      endTime TEXT,
      createdBy INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(createdBy) REFERENCES admins(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating students table:', err.message);
    } else {
      console.log('Students table ready');
    }
  });

  // Ensure legacy databases have `startTime` and `endTime` columns (and migrate any existing `timeOfClass` values)
  db.all("PRAGMA table_info(students)", (err, cols) => {
    if (err) return;
    const hasStart = cols && cols.some(c => c.name === 'startTime');
    const hasEnd = cols && cols.some(c => c.name === 'endTime');
    const hasTimeOfClass = cols && cols.some(c => c.name === 'timeOfClass');
    const hasUsername = cols && cols.some(c => c.name === 'username');

    if (!hasStart) {
      db.run('ALTER TABLE students ADD COLUMN startTime TEXT', (alterErr) => {
        if (alterErr) console.error('Error adding startTime column:', alterErr.message);
        else console.log('Migrated students table: added startTime column');
      });
    }
    if (!hasEnd) {
      db.run('ALTER TABLE students ADD COLUMN endTime TEXT', (alterErr) => {
        if (alterErr) console.error('Error adding endTime column:', alterErr.message);
        else console.log('Migrated students table: added endTime column');
      });
    }

    if (!hasUsername) {
      db.run('ALTER TABLE students ADD COLUMN username TEXT', (alterErr) => {
        if (alterErr) console.error('Error adding username column:', alterErr.message);
        else {
          console.log('Migrated students table: added username column');
          // create unique index to enforce username uniqueness
          db.run('CREATE UNIQUE INDEX IF NOT EXISTS idx_students_username ON students(username)', (ixErr) => {
            if (ixErr) console.error('Error creating username index:', ixErr.message);
          });
        }
      });
    }

    // If older DB used single `timeOfClass`, copy it into `startTime` to preserve data
    if (hasTimeOfClass && (!hasStart || !hasEnd)) {
      db.run('UPDATE students SET startTime = timeOfClass WHERE (startTime IS NULL OR startTime = "")', (updErr) => {
        if (updErr) console.error('Error migrating timeOfClass -> startTime:', updErr.message);
        else console.log('Migrated existing timeOfClass values into startTime');
      });
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'Absent',
      attendanceDate DATE NOT NULL,
      recordedBy INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(studentId) REFERENCES students(id),
      FOREIGN KEY(recordedBy) REFERENCES admins(id),
      UNIQUE(studentId, attendanceDate)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating attendance table:', err.message);
    } else {
      console.log('Attendance table ready');
    }
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sectionName TEXT NOT NULL,
      course TEXT NOT NULL,
      subject TEXT NOT NULL,
      scheduleTime TEXT NOT NULL,
      scheduleDay TEXT NOT NULL,
      createdBy INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(createdBy) REFERENCES admins(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating sections table:', err.message);
    } else {
      console.log('Sections table ready');
    }
  });
}

// ============= SECURITY NOTE =============
// NO automatic default admin creation. 
// Admins must be created explicitly via secure setup process.
// This is a critical security best practice.
// ========================================


// ============= ADMIN AUTHENTICATION =============

// Admin Registration endpoint
// Register new user (admin or teacher) - only allowed for logged-in admins
app.post('/api/admin/register', verifyToken, async (req, res) => {
  try {
    const { fullName, email, password, isAdmin } = req.body;

    // Validate input
    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'Full name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Ensure requester is an admin
    db.get('SELECT isAdmin FROM admins WHERE id = ?', [req.adminId], async (err, requester) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!requester || Number(requester.isAdmin) !== 1) {
        return res.status(403).json({ error: 'Forbidden: Only administrators can create users' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user into database (isMain defaults to 0)
      const sql = 'INSERT INTO admins (fullName, email, password, isAdmin, isMain) VALUES (?, ?, ?, ?, ?)';
      db.run(sql, [fullName, email, hashedPassword, isAdmin ? 1 : 0, 0], function(insertErr) {
        if (insertErr) {
          if (insertErr.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Email already registered' });
          }
          return res.status(500).json({ error: insertErr.message });
        }

        // Return success with created user info
        res.status(201).json({
          success: true,
          message: 'User registered successfully',
          user: {
            id: this.lastID,
            fullName,
            email,
            isAdmin: isAdmin ? 1 : 0
          }
        });
      });
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Rate limiter for login to mitigate brute-force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: { error: 'Too many login attempts from this IP, please try again later.' }
});

// Admin Login endpoint
app.post('/api/admin/login', loginLimiter, async (req, res) => {
  logger.info('[DEBUG] /api/admin/login - handler entered');
  try {
    const { email, password } = req.body;

    logger.info('[DEBUG] /api/admin/login - received body:', { email: email && String(email).slice(0, 60) });

    // Validate input
    if (!email || !password) {
      console.log('[DEBUG] /api/admin/login - missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Account-level lockout check
    const key = (email || '').toLowerCase();
    const attempt = loginAttempts.get(key);
    const now = Date.now();
    if (attempt && attempt.lockedUntil && attempt.lockedUntil > now) {
    logger.warn(`Locked login attempt for ${key}`);
    logger.info('[DEBUG] /api/admin/login - account locked until ' + new Date(attempt.lockedUntil).toISOString());
      return res.status(429).json({ error: 'Account locked due to repeated failed login attempts. Try again later.' });
    }

    logger.info('[DEBUG] /api/admin/login - querying DB for admin');
    // Find admin by email
    db.get('SELECT * FROM admins WHERE email = ?', [email], async (err, admin) => {
      if (err) {
        logger.error('[DEBUG] /api/admin/login - db.get error: ' + (err && err.message));
        return res.status(500).json({ error: err.message });
      }

      logger.info('[DEBUG] /api/admin/login - db.get returned admin: ' + (!!admin));

      if (!admin) {
        // increment attempt counter by email
        const prev = loginAttempts.get(key) || { count: 0, firstAttempt: now };
        prev.count = (prev.count || 0) + 1;
        if (!prev.firstAttempt) prev.firstAttempt = now;
        // reset window
        if (now - prev.firstAttempt > WINDOW_MS) {
          prev.count = 1;
          prev.firstAttempt = now;
        }
        if (prev.count >= MAX_ATTEMPTS) {
          prev.lockedUntil = now + LOCK_DURATION_MS;
          logger.warn(`Account locked for ${key} due to repeated failed attempts`);
          // send alert (best-effort)
          try { alerts.sendLockoutEmail(key, req.ip); } catch (e) { logger.error('Alert send failed: ' + (e && e.message)); }
        }
        loginAttempts.set(key, prev);
        logger.info('[DEBUG] /api/admin/login - admin not found, returning 401');
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Compare passwords
      try {
        logger.info('[DEBUG] /api/admin/login - about to compare password hashes');
        const beforeCompare = Date.now();
        const validPassword = await bcrypt.compare(password, admin.password);
        const afterCompare = Date.now();
        logger.info('[DEBUG] /api/admin/login - bcrypt.compare completed - valid=' + validPassword + ' durMs=' + (afterCompare - beforeCompare));

        if (!validPassword) {
          // increment attempt counter
          const prev = loginAttempts.get(key) || { count: 0, firstAttempt: now };
          prev.count = (prev.count || 0) + 1;
          if (!prev.firstAttempt) prev.firstAttempt = now;
          if (now - prev.firstAttempt > WINDOW_MS) {
            prev.count = 1;
            prev.firstAttempt = now;
          }
          if (prev.count >= MAX_ATTEMPTS) {
            prev.lockedUntil = now + LOCK_DURATION_MS;
            logger.warn(`Account locked for ${key} due to repeated failed attempts`);
            try { alerts.sendLockoutEmail(key, req.ip); } catch (e) { logger.error('Alert send failed: ' + (e && e.message)); }
          }
          loginAttempts.set(key, prev);
          logger.info('[DEBUG] /api/admin/login - invalid password, returning 401');
          return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Login successful
        // reset attempts on success
        if (loginAttempts.has(key)) loginAttempts.delete(key);
        const token = generateToken(admin.id);
        logger.info('[DEBUG] /api/admin/login - login successful, sending token');
        res.status(200).json({
          success: true,
          message: 'Login successful',
          admin: {
            id: admin.id,
            fullName: admin.fullName,
            email: admin.email,
            isAdmin: admin.isAdmin,
            isMain: admin.isMain || 0
          },
          token
        });
      } catch (bcryptError) {
        logger.error('[DEBUG] /api/admin/login - Password comparison error: ' + (bcryptError && (bcryptError.message || bcryptError)));
        res.status(500).json({ error: 'Error during authentication' });
      }
    });
  } catch (error) {
    console.error('[DEBUG] /api/admin/login - handler error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Token generation helper using signed JWT
function generateToken(adminId) {
  const payload = { adminId };
  const secret = process.env.JWT_SECRET || 'change_this_to_a_secure_random_string_in_production_min_32_chars';
  return jwt.sign(payload, secret, { expiresIn: '8h' });
}

// ============= MIDDLEWARE =============

// Middleware to verify admin token using JWT
function verifyToken(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'change_this_to_a_secure_random_string_in_production_min_32_chars';
    const decoded = jwt.verify(token, secret);
    req.adminId = decoded.adminId;
    next();
  } catch (error) {
    console.error('[WARN] JWT verification failed:', error && error.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}

// ============= STUDENT API ENDPOINTS =============

// GET all students
app.get('/api/students', verifyToken, (req, res) => {
  // When calling protected endpoints, the frontend must send Authorization: Bearer <token>
  // Check if user is admin or teacher
  db.get('SELECT isAdmin FROM admins WHERE id = ?', [req.adminId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Admins see all students, teachers see only their own students
    const isAdmin = Number(user.isAdmin) === 1;
    const query = isAdmin 
      ? 'SELECT * FROM students ORDER BY id DESC'
      : 'SELECT * FROM students WHERE createdBy = ? ORDER BY id DESC';
    
    const params = isAdmin ? [] : [req.adminId];
    
    db.all(query, params, (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(rows || []);
      }
    });
  });
});

// GET single student by ID
app.get('/api/students/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  
  // Check if user is admin or teacher
  db.get('SELECT isAdmin FROM admins WHERE id = ?', [req.adminId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const isAdmin = Number(user.isAdmin) === 1;
    
    // Admins can see any student, teachers can only see their own students
    const query = isAdmin
      ? 'SELECT * FROM students WHERE id = ?'
      : 'SELECT * FROM students WHERE id = ? AND createdBy = ?';
    
    const params = isAdmin ? [id] : [id, req.adminId];
    
    db.get(query, params, (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else if (!row) {
        res.status(404).json({ error: 'Student not found or access denied' });
      } else {
        res.json(row);
      }
    });
  });
});

// POST - Add new student
app.post('/api/students', verifyToken, (req, res) => {
  const { firstName, lastName, username, contactNo, course, section, startTime, endTime } = req.body;
  const createdBy = req.adminId;

  if (!firstName || !lastName || !username || !contactNo || !course || !section || !startTime || !endTime) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Validate start/end time format: hh:mm AM/PM
  const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?[AaPp][Mm]$/;
  if (!timeRegex.test(String(startTime).trim()) || !timeRegex.test(String(endTime).trim())) {
    return res.status(400).json({ error: 'Invalid time format. Use hh:mm AM or hh:mm PM' });
  }

  const sql = 'INSERT INTO students (firstName, lastName, username, contactNo, course, section, startTime, endTime, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
  db.run(sql, [firstName, lastName, username.trim(), contactNo, course, section, startTime.trim(), endTime.trim(), createdBy], function(err) {
    if (err) {
      if (err.message && err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      return res.status(500).json({ error: err.message });
    } else {
      res.json({
        id: this.lastID,
        firstName,
        lastName,
        username,
        contactNo,
        course,
        section,
        startTime,
        endTime,
        createdBy,
        message: 'Student added successfully'
      });
    }
  });
});

// PUT - Update student
app.put('/api/students/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, contactNo, course, section, startTime, endTime } = req.body;

  if (!firstName || !lastName || !contactNo || !course || !section || !startTime || !endTime) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Validate start/end time format
  const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?[AaPp][Mm]$/;
  if (!timeRegex.test(String(startTime).trim()) || !timeRegex.test(String(endTime).trim())) {
    return res.status(400).json({ error: 'Invalid time format. Use hh:mm AM or hh:mm PM' });
  }

  // Check if user is admin or teacher
  db.get('SELECT isAdmin FROM admins WHERE id = ?', [req.adminId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const isAdmin = Number(user.isAdmin) === 1;
    
    // Check if student exists and if teacher has access
    const query = isAdmin
      ? 'SELECT * FROM students WHERE id = ?'
      : 'SELECT * FROM students WHERE id = ? AND createdBy = ?';
    
    const params = isAdmin ? [id] : [id, req.adminId];
    
    db.get(query, params, (err, student) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!student) {
        return res.status(404).json({ error: 'Student not found or access denied' });
      }

      const sql = 'UPDATE students SET firstName = ?, lastName = ?, contactNo = ?, course = ?, section = ?, startTime = ?, endTime = ? WHERE id = ?';
      db.run(sql, [firstName, lastName, contactNo, course, section, startTime.trim(), endTime.trim(), id], function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
        } else if (this.changes === 0) {
          res.status(404).json({ error: 'Student not found' });
        } else {
          res.json({
            id,
            firstName,
            lastName,
            contactNo,
            course,
            section,
            startTime,
            endTime,
            message: 'Student updated successfully'
          });
        }
      });
    });
  });
});

// DELETE - Remove student
app.delete('/api/students/:id', verifyToken, (req, res) => {
  const { id } = req.params;

  db.get('SELECT isAdmin FROM admins WHERE id = ?', [req.adminId], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'User not found' });

    const isAdmin = Number(user.isAdmin) === 1;
    const query = isAdmin
      ? 'SELECT * FROM students WHERE id = ?'
      : 'SELECT * FROM students WHERE id = ? AND createdBy = ?';

    const params = isAdmin ? [id] : [id, req.adminId];

    db.get(query, params, (err, student) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!student) return res.status(404).json({ error: 'Student not found or access denied' });

      db.run('DELETE FROM students WHERE id = ?', [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Student not found' });
        res.json({ message: 'Student deleted successfully' });
      });
    });
  });
});

// ===================================================

// ============= SECTION MANAGEMENT ENDPOINTS =============

// GET - All sections (admins see their own, teachers see all sections)
app.get('/api/sections', verifyToken, (req, res) => {
  // Check if user is admin or teacher
  db.get('SELECT isAdmin FROM admins WHERE id = ?', [req.adminId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const isAdmin = Number(user.isAdmin) === 1;
    
    // Admins see only their own sections, teachers see all sections
    const query = isAdmin
      ? 'SELECT * FROM sections WHERE createdBy = ? ORDER BY course, sectionName'
      : 'SELECT * FROM sections ORDER BY course, sectionName';
    
    const params = isAdmin ? [req.adminId] : [];
    
    db.all(query, params, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows || []);
    });
  });
});

// GET - Single section (verify ownership)
app.get('/api/sections/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM sections WHERE id = ? AND createdBy = ?', [id, req.adminId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Section not found or access denied' });
    }
    res.json(row);
  });
});

// POST - Create new section (ADMIN ONLY)
app.post('/api/sections', verifyToken, (req, res) => {
  // Check if user is admin
  db.get('SELECT isAdmin FROM admins WHERE id = ?', [req.adminId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const isAdmin = Number(user.isAdmin) === 1;
    if (!isAdmin) {
      return res.status(403).json({ error: 'Access denied: Only administrators can create sections' });
    }

    const { sectionName, course, subject, scheduleTime, scheduleDay } = req.body;
    const createdBy = req.adminId;

    if (!sectionName || !course || !subject || !scheduleTime || !scheduleDay) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const sql = 'INSERT INTO sections (sectionName, course, subject, scheduleTime, scheduleDay, createdBy) VALUES (?, ?, ?, ?, ?, ?)';
    db.run(sql, [sectionName, course, subject, scheduleTime, scheduleDay, createdBy], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({
        id: this.lastID,
        sectionName,
        course,
        subject,
        scheduleTime,
        scheduleDay,
        createdBy,
        message: 'Section created successfully'
      });
    });
  });
});

// PUT - Update section (ADMIN ONLY)
app.put('/api/sections/:id', verifyToken, (req, res) => {
  // Check if user is admin
  db.get('SELECT isAdmin FROM admins WHERE id = ?', [req.adminId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const isAdmin = Number(user.isAdmin) === 1;
    if (!isAdmin) {
      return res.status(403).json({ error: 'Access denied: Only administrators can update sections' });
    }

    const { id } = req.params;
    const { sectionName, course, subject, scheduleTime, scheduleDay } = req.body;

    if (!sectionName || !course || !subject || !scheduleTime || !scheduleDay) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const sql = 'UPDATE sections SET sectionName = ?, course = ?, subject = ?, scheduleTime = ?, scheduleDay = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND createdBy = ?';
    db.run(sql, [sectionName, course, subject, scheduleTime, scheduleDay, id, req.adminId], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Section not found or access denied' });
      }
      res.json({
        id,
        sectionName,
        course,
        subject,
        scheduleTime,
        scheduleDay,
        message: 'Section updated successfully'
      });
    });
  });
});

// DELETE - Remove section (ADMIN ONLY)
app.delete('/api/sections/:id', verifyToken, (req, res) => {
  // Check if user is admin
  db.get('SELECT isAdmin FROM admins WHERE id = ?', [req.adminId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const isAdmin = Number(user.isAdmin) === 1;
    if (!isAdmin) {
      return res.status(403).json({ error: 'Access denied: Only administrators can delete sections' });
    }

    const { id } = req.params;

    db.run('DELETE FROM sections WHERE id = ? AND createdBy = ?', [id, req.adminId], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Section not found or access denied' });
      }
      res.json({ message: 'Section deleted successfully' });
    });
  });
});

// ===================================================

// ============= ATTENDANCE ENDPOINTS =============

// Save attendance status for a student
app.post('/api/attendance', verifyToken, (req, res) => {
  const { studentId, status, attendanceDate } = req.body;
  const recordedBy = req.adminId;

  if (!studentId || !status) {
    return res.status(400).json({ error: 'studentId and status are required' });
  }

  const date = attendanceDate || new Date().toISOString().split('T')[0];

  // Check if user is admin or teacher, and if teacher, verify student ownership
  db.get('SELECT isAdmin FROM admins WHERE id = ?', [req.adminId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const isAdmin = Number(user.isAdmin) === 1;
    
    // For teachers, verify they own the student
    if (!isAdmin) {
      db.get('SELECT id FROM students WHERE id = ? AND createdBy = ?', [studentId, req.adminId], (err, student) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        if (!student) {
          return res.status(403).json({ error: 'Access denied: Student not found or does not belong to you' });
        }

        // Student belongs to teacher, proceed with attendance recording
        recordAttendance(studentId, status, date, recordedBy, res);
      });
    } else {
      // Admin can record attendance for any student
      recordAttendance(studentId, status, date, recordedBy, res);
    }
  });
});

// Helper function to record attendance
function recordAttendance(studentId, status, date, recordedBy, res) {
  const sql = `
    INSERT OR REPLACE INTO attendance (studentId, status, attendanceDate, recordedBy)
    VALUES (?, ?, ?, ?)
  `;

  db.run(sql, [studentId, status, date, recordedBy], function(err) {
    if (err) {
      console.error('[ERROR] Failed to save attendance:', err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log('[DEBUG] Attendance saved - studentId:', studentId, 'status:', status);
    // Return the saved attendance row so frontend can show timestamp
    db.get('SELECT id, studentId, status, attendanceDate, createdAt, recordedBy FROM attendance WHERE studentId = ? AND attendanceDate = ?', [studentId, date], (getErr, row) => {
      if (getErr) {
        console.error('[ERROR] Failed to retrieve saved attendance:', getErr.message);
        return res.status(500).json({ error: getErr.message });
      }
      res.json({ success: true, message: 'Attendance recorded', attendance: row });
    });
  });
}

// Get attendance for a specific date
app.get('/api/attendance/:date', verifyToken, (req, res) => {
  const date = req.params.date;

  // Check if user is admin or teacher
  db.get('SELECT isAdmin FROM admins WHERE id = ?', [req.adminId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const isAdmin = Number(user.isAdmin) === 1;
    
    // Admins see all attendance records, teachers see only their own students' attendance
    const query = isAdmin
      ? `
        SELECT a.id, a.studentId, a.status, a.attendanceDate, a.createdAt, s.firstName, s.lastName, s.course, s.section
        FROM attendance a
        LEFT JOIN students s ON a.studentId = s.id
        WHERE a.attendanceDate = ?
        ORDER BY s.section, s.firstName
      `
      : `
        SELECT a.id, a.studentId, a.status, a.attendanceDate, a.createdAt, s.firstName, s.lastName, s.course, s.section
        FROM attendance a
        LEFT JOIN students s ON a.studentId = s.id
        WHERE a.attendanceDate = ? AND s.createdBy = ?
        ORDER BY s.section, s.firstName
      `;
    
    const params = isAdmin ? [date] : [date, req.adminId];
    
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('[ERROR] Failed to get attendance:', err.message);
        return res.status(500).json({ error: err.message });
      }
      res.json(rows || []);
    });
  });
});

// Get attendance report for a date range
app.get('/api/reports/attendance', verifyToken, (req, res) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate query parameters are required' });
  }

  // Check if user is admin or teacher
  db.get('SELECT isAdmin FROM admins WHERE id = ?', [req.adminId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const isAdmin = Number(user.isAdmin) === 1;
    
    // Admins see all attendance records, teachers see only their own students' attendance
    const query = isAdmin
      ? `
        SELECT a.id, a.studentId, a.status, a.attendanceDate, a.createdAt, s.firstName, s.lastName, s.course, s.section
        FROM attendance a
        LEFT JOIN students s ON a.studentId = s.id
        WHERE a.attendanceDate BETWEEN ? AND ?
        ORDER BY a.attendanceDate DESC, s.section, s.firstName
      `
      : `
        SELECT a.id, a.studentId, a.status, a.attendanceDate, s.firstName, s.lastName, s.course, s.section
        FROM attendance a
        LEFT JOIN students s ON a.studentId = s.id
        WHERE a.attendanceDate BETWEEN ? AND ? AND s.createdBy = ?
        ORDER BY a.attendanceDate DESC, s.section, s.firstName
      `;
    
    const params = isAdmin ? [startDate, endDate] : [startDate, endDate, req.adminId];
    
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('[ERROR] Failed to get attendance report:', err.message);
        return res.status(500).json({ error: err.message });
      }
      res.json(rows || []);
    });
  });
});

// ===================================================

// ============= USER MANAGEMENT ENDPOINTS =============

// List users (admins and teachers) - only accessible to admins
app.get('/api/users', verifyToken, (req, res) => {
  console.log('[DEBUG] GET /api/users called by adminId=', req.adminId);
  db.get('SELECT isAdmin, isMain FROM admins WHERE id = ?', [req.adminId], (err, requester) => {
    if (err) {
      console.error('[ERROR] GET /api/users - requester lookup failed:', err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log('[DEBUG] GET /api/users - requester:', requester);
    if (!requester || Number(requester.isAdmin) !== 1) {
      console.warn('[WARN] GET /api/users - Forbidden for adminId=', req.adminId);
      return res.status(403).json({ error: 'Forbidden' });
    }

    db.all('SELECT id, fullName, email, isAdmin, isMain, createdAt FROM admins ORDER BY id DESC', (err, rows) => {
      if (err) {
        console.error('[ERROR] GET /api/users - select failed:', err.message);
        return res.status(500).json({ error: err.message });
      }
      console.log('[DEBUG] GET /api/users - returning rows count=', (rows || []).length);
      res.json(rows || []);
    });
  });
});

// Update user (only allowed by main administrator)
app.put('/api/users/:id', verifyToken, async (req, res) => {
  const targetId = parseInt(req.params.id, 10);
  const { fullName, email, password, isAdmin } = req.body;

  console.log('[DEBUG PUT] Update user called - targetId:', targetId, 'adminId:', req.adminId, 'body:', { fullName, email, isAdmin });

  db.get('SELECT isAdmin, isMain FROM admins WHERE id = ?', [req.adminId], async (err, requester) => {
    if (err) {
      console.error('[ERROR PUT] Requester lookup failed:', err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log('[DEBUG PUT] Requester:', requester);
    
    if (!requester || Number(requester.isAdmin) !== 1) {
      console.warn('[WARN PUT] Requester is not admin');
      return res.status(403).json({ error: 'Forbidden - you must be an administrator' });
    }

    // Check if target user exists and prevent editing main admin
    db.get('SELECT id, isMain FROM admins WHERE id = ?', [targetId], async (err2, target) => {
      if (err2) {
        console.error('[ERROR PUT] Target lookup failed:', err2.message);
        return res.status(500).json({ error: err2.message });
      }
      console.log('[DEBUG PUT] Target user:', target);
      
      if (!target) {
        console.warn('[WARN PUT] Target user not found');
        return res.status(404).json({ error: 'User not found' });
      }
      // Allow the main administrator to edit their own account, but prevent other admins from editing the main admin
      if (Number(target.isMain) === 1 && targetId !== req.adminId) {
        console.warn('[WARN PUT] Cannot edit main administrator by another admin');
        return res.status(403).json({ error: 'Cannot edit the main administrator' });
      }

      try {
        let updateFields = [];
        let updateValues = [];

        if (fullName) {
          updateFields.push('fullName = ?');
          updateValues.push(fullName);
        }
        if (email) {
          updateFields.push('email = ?');
          updateValues.push(email);
        }
        if (password) {
          const hashed = await bcrypt.hash(password, 10);
          updateFields.push('password = ?');
          updateValues.push(hashed);
        }
        if (isAdmin !== undefined) {
          updateFields.push('isAdmin = ?');
          updateValues.push(isAdmin ? 1 : 0);
        }

        if (updateFields.length === 0) {
          console.warn('[WARN PUT] No fields to update');
          return res.status(400).json({ error: 'No fields to update' });
        }

        updateValues.push(targetId);
        const sql = `UPDATE admins SET ${updateFields.join(', ')} WHERE id = ?`;
        console.log('[DEBUG PUT] SQL:', sql, 'values:', updateValues);

        db.run(sql, updateValues, function(updateErr) {
          if (updateErr) {
            console.error('[ERROR PUT] Update failed:', updateErr.message);
            if (updateErr.message.includes('UNIQUE constraint failed')) {
              return res.status(400).json({ error: 'Email already in use' });
            }
            return res.status(500).json({ error: updateErr.message });
          }
          console.log('[DEBUG PUT] User updated successfully - changes:', this.changes);
          res.json({ success: true, message: 'User updated successfully' });
        });
      } catch (hashErr) {
        console.error('[ERROR] hashing password failed:', hashErr);
        res.status(500).json({ error: 'Error processing update' });
      }
    });
  });
});

// Delete user (only allowed by main administrator)
app.delete('/api/users/:id', verifyToken, (req, res) => {
  const targetId = parseInt(req.params.id, 10);

  db.get('SELECT isAdmin, isMain FROM admins WHERE id = ?', [req.adminId], (err, requester) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!requester || Number(requester.isAdmin) !== 1) return res.status(403).json({ error: 'Forbidden' });
    if (Number(requester.isMain) !== 1) return res.status(403).json({ error: 'Only the main administrator can delete users' });

    // Prevent deleting the main admin or self
    db.get('SELECT id, isMain FROM admins WHERE id = ?', [targetId], (err2, target) => {
      if (err2) return res.status(500).json({ error: err2.message });
      if (!target) return res.status(404).json({ error: 'User not found' });
      if (target.isMain === 1) return res.status(403).json({ error: 'Cannot delete the main administrator' });
      if (target.id === req.adminId) return res.status(400).json({ error: 'Cannot delete yourself' });

      db.run('DELETE FROM admins WHERE id = ?', [targetId], function(delErr) {
        if (delErr) return res.status(500).json({ error: delErr.message });
        if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ success: true, message: 'User deleted successfully' });
      });
    });
  });
});

// Create user (admin or teacher) - only accessible to admins
app.post('/api/users', verifyToken, async (req, res) => {
  const { fullName, email, password, isAdmin } = req.body;
  if (!fullName || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  // Log incoming request for debugging
  console.log('[DEBUG] POST /api/users called by adminId=', req.adminId, 'body=', { fullName, email, isAdmin });

  db.get('SELECT isAdmin FROM admins WHERE id = ?', [req.adminId], async (err, requester) => {
    if (err) {
      console.error('[ERROR] failed to lookup requester for /api/users:', err.message);
      return res.status(500).json({ error: err.message });
    }

    console.log('[DEBUG] requester lookup result:', requester);

    // Ensure requester is an administrator (normalize to number for safety)
    if (!requester || Number(requester.isAdmin) !== 1) {
      console.warn('[WARN] Forbidden: requester not admin or not found - adminId=', req.adminId);
      return res.status(403).json({ error: 'Forbidden' });
    }

    try {
      const hashed = await bcrypt.hash(password, 10);
      const sql = 'INSERT INTO admins (fullName, email, password, isAdmin, isMain) VALUES (?, ?, ?, ?, ?)';
      db.run(sql, [fullName, email, hashed, isAdmin ? 1 : 0, 0], function(insertErr) {
        if (insertErr) {
          console.error('[ERROR] failed to insert new user:', insertErr.message);
          if (insertErr.message.includes('UNIQUE constraint failed')) return res.status(400).json({ error: 'Email already registered' });
          return res.status(500).json({ error: insertErr.message });
        }

        console.log('[DEBUG] new user inserted id=', this.lastID, 'email=', email);
        res.status(201).json({ success: true, id: this.lastID });
      });
    } catch (hashErr) {
      console.error('[ERROR] hashing password failed:', hashErr);
      res.status(500).json({ error: 'Error hashing password' });
    }
  });
});


// Health check endpoint (no sensitive info)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve login.html for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🔐 TEACHER PORTAL - SECURE SERVER STARTED`);
  console.log(`${'='.repeat(60)}`);
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✓ Database: ${process.env.DATABASE_PATH || './database/teacher_portal.db'}`);
  console.log(`✓ JWT Security: ${process.env.JWT_SECRET ? 'ENABLED ✓' : 'WARNING: NOT SET'}`);
  console.log(`${'='.repeat(60)}\n`);
  
  console.log('📋 INITIAL SETUP INSTRUCTIONS:');
  console.log('1. Create main administrator (FIRST TIME ONLY):');
  console.log('   $ node scripts/create_main_admin.js');
  console.log('2. Login at: http://localhost:3000/');
  console.log('3. Create additional users via User Management');
  console.log('4. Manage students and attendance\n');
  
  console.log('📚 API ENDPOINTS (all require JWT token):');
  console.log('  POST   /api/admin/login        - Login with email/password');
  console.log('  GET    /api/students           - List students (token required)');
  console.log('  POST   /api/students           - Add student (token required)');
  console.log('  PUT    /api/students/:id       - Update student (token required)');
  console.log('  DELETE /api/students/:id       - Delete student (token required)');
  console.log('  GET    /api/users              - List users (admin only)');
  console.log('  POST   /api/users              - Create user (admin only)');
  console.log('  GET    /api/health             - Health check\n');
  
  console.log('🔒 SECURITY NOTES:');
  console.log('  • No default credentials - create admin via script');
  console.log('  • Debug endpoints disabled for security');
  console.log('  • All requests validated and secured');
  console.log('  • See SECURITY.md for detailed documentation');
  console.log(`${'='.repeat(60)}\n`);
});
