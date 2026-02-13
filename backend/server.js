const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Add a relaxed Content Security Policy so the frontend can connect back to the API
app.use((req, res, next) => {
  // Allow same-origin resources and connections to localhost API during development
  res.setHeader('Content-Security-Policy', "default-src 'self'; connect-src 'self' http://localhost:3000 ws://localhost:3000; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval';");
  next();
});

// Serve static files from the frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

// Database setup
const db = new sqlite3.Database(path.join(__dirname, 'database.db'), (err) => {
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
}
  // Insert default admin account if it doesn't exist
  const defaultAdminEmail = 'aleguiojoaljey@gmail.com';
  const defaultAdminName = 'Default Admin';
  const defaultAdminPassword = 'admin123';

  db.get('SELECT id FROM admins WHERE email = ?', [defaultAdminEmail], (err, row) => {
    if (err) {
      console.error('Error checking default admin:', err.message);
      return;
    }

    if (row) {
      console.log('Default admin already exists');
      return;
    }

    // Hash the default password and insert the admin (mark as main)
    bcrypt.hash(defaultAdminPassword, 10)
      .then((hashed) => {
        const insertSql = 'INSERT INTO admins (fullName, email, password, isAdmin, isMain) VALUES (?, ?, ?, ?, ?)';
        db.run(insertSql, [defaultAdminName, defaultAdminEmail, hashed, 1, 1], function(insertErr) {
          if (insertErr) {
            console.error('Error creating default admin:', insertErr.message);
          } else {
            console.log('Default admin created (main):', defaultAdminEmail);
          }
        });
      })
      .catch((hashErr) => {
        console.error('Error hashing default admin password:', hashErr);
      });
  });


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

// Admin Login endpoint
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find admin by email
    db.get('SELECT * FROM admins WHERE email = ?', [email], async (err, admin) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!admin) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Compare passwords
      try {
        const validPassword = await bcrypt.compare(password, admin.password);
        
        if (!validPassword) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Login successful
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
          token: generateToken(admin.id)
        });
      } catch (bcryptError) {
        console.error('Password comparison error:', bcryptError);
        res.status(500).json({ error: 'Error during authentication' });
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Token generation helper (simple JWT-like token)
function generateToken(adminId) {
  return Buffer.from(JSON.stringify({ adminId, timestamp: Date.now() })).toString('base64');
}

// ============= MIDDLEWARE =============

// Middleware to verify admin token
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    req.adminId = decoded.adminId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}

// ============= STUDENT API ENDPOINTS =============

// GET all students
app.get('/api/students', verifyToken, (req, res) => {
  // When calling protected endpoints, the frontend must send Authorization: Bearer <token>
  db.all('SELECT * FROM students ORDER BY id DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows || []);
    }
  });
});

// GET single student by ID
app.get('/api/students/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM students WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (!row) {
      res.status(404).json({ error: 'Student not found' });
    } else {
      res.json(row);
    }
  });
});

// POST - Add new student
app.post('/api/students', verifyToken, (req, res) => {
  const { firstName, lastName, contactNo, course, section } = req.body;
  const createdBy = req.adminId;

  if (!firstName || !lastName || !contactNo || !course || !section) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const sql = 'INSERT INTO students (firstName, lastName, contactNo, course, section, createdBy) VALUES (?, ?, ?, ?, ?, ?)';
  db.run(sql, [firstName, lastName, contactNo, course, section, createdBy], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({
        id: this.lastID,
        firstName,
        lastName,
        contactNo,
        course,
        section,
        createdBy,
        message: 'Student added successfully'
      });
    }
  });
});

// PUT - Update student
app.put('/api/students/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, contactNo, course, section } = req.body;

  if (!firstName || !lastName || !contactNo || !course || !section) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const sql = 'UPDATE students SET firstName = ?, lastName = ?, contactNo = ?, course = ?, section = ? WHERE id = ?';
  db.run(sql, [firstName, lastName, contactNo, course, section, id], function(err) {
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
        message: 'Student updated successfully'
      });
    }
  });
});

// DELETE - Remove student
app.delete('/api/students/:id', verifyToken, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM students WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ error: 'Student not found' });
    } else {
      res.json({ message: 'Student deleted successfully' });
    }
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
      if (Number(target.isMain) === 1) {
        console.warn('[WARN PUT] Cannot edit main administrator');
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


// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// DEBUG: show DB file path and admins rows (temporary)
app.get('/api/debug/dbinfo', (req, res) => {
  try {
    const dbFile = path.join(__dirname, 'database.db');
    db.all('SELECT id, fullName, email, isAdmin, isMain, createdAt FROM admins ORDER BY id DESC', (err, rows) => {
      if (err) return res.status(500).json({ error: err.message, dbFile });
      res.json({ dbFile, rows: rows || [] });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve login.html for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('\nTest the following:');
  console.log('1. Register a new Admin account');
  console.log('2. Login with your email and password');
  console.log('3. Create and manage student accounts');
  console.log('\nAPI Endpoints:');
  console.log('POST   /api/admin/register - Register new admin');
  console.log('POST   /api/admin/login    - Login with email');
  console.log('GET    /api/students       - Get all students (requires token)');
  console.log('POST   /api/students       - Add new student (requires token)');
  console.log('PUT    /api/students/:id   - Update student (requires token)');
  console.log('DELETE /api/students/:id   - Delete student (requires token)');
});
