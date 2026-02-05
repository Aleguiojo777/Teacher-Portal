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
  db.run(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      contactNo TEXT NOT NULL,
      course TEXT NOT NULL,
      section TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating students table:', err.message);
    } else {
      console.log('Students table ready');
    }
  });
}

// Sample user data (In production, use a real database)
const users = [
  {
    id: 1,
    username: 'teacher1',
    password: 'teacher123' // In production, store hashed passwords
  },
  {
    id: 2,
    username: 'teacher2',
    password: 'teacher123' // In production, store hashed passwords
  }
];

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user
    const user = users.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check password (for production, use bcrypt.compare)
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Return success (In production, generate JWT token)
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============= STUDENT API ENDPOINTS =============

// GET all students
app.get('/api/students', (req, res) => {
  db.all('SELECT * FROM students ORDER BY id DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows || []);
    }
  });
});

// GET single student by ID
app.get('/api/students/:id', (req, res) => {
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
app.post('/api/students', (req, res) => {
  const { firstName, lastName, contactNo, course, section } = req.body;

  if (!firstName || !lastName || !contactNo || !course || !section) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const sql = 'INSERT INTO students (firstName, lastName, contactNo, course, section) VALUES (?, ?, ?, ?, ?)';
  db.run(sql, [firstName, lastName, contactNo, course, section], function(err) {
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
        message: 'Student added successfully'
      });
    }
  });
});

// PUT - Update student
app.put('/api/students/:id', (req, res) => {
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
app.delete('/api/students/:id', (req, res) => {
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Serve login.html for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('\nTest credentials:');
  console.log('Username: teacher1 or teacher2');
  console.log('Password: teacher123');
});
