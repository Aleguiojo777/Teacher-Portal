const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'database', 'teacher_portal.db');
console.log('Creating sample DB at', dbPath);

const fs = require('fs');
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) return console.error('DB open error:', err.message);
});

function runSql(sql) {
  return new Promise((resolve, reject) => db.run(sql, (err) => (err ? reject(err) : resolve())));
}

(async () => {
  try {
    // Create tables (minimal subset to support login)
    await runSql(`CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fullName TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      isAdmin BOOLEAN DEFAULT 1,
      isMain INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await runSql(`CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      contactNo TEXT NOT NULL,
      course TEXT NOT NULL,
      section TEXT NOT NULL,
      startTime TEXT,
      endTime TEXT,
      username TEXT UNIQUE,
      password TEXT,
      createdBy INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    await runSql(`CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'Absent',
      attendanceDate DATE NOT NULL,
      recordedBy INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Insert admin
    const adminEmail = 'admin@example.com';
    const adminPass = 'AdminPass1';
    const adminHash = await bcrypt.hash(adminPass, 10);
    db.get('SELECT id FROM admins WHERE email = ?', [adminEmail], (err, row) => {
      if (err) return console.error('Admin lookup error:', err.message);
      if (row) {
        console.log('Admin already exists:', adminEmail);
      } else {
        db.run('INSERT INTO admins (fullName, email, password, isAdmin, isMain) VALUES (?, ?, ?, ?, ?)', ['Main Admin', adminEmail, adminHash, 1, 1], function(err) {
          if (err) console.error('Insert admin error:', err.message);
          else console.log('Inserted admin:', adminEmail, 'password:', adminPass);
        });
      }
    });

    // Insert student
    const username = 'sampleuser';
    const studentPass = 'samplepass';
    const studentHash = await bcrypt.hash(studentPass, 10);
    db.get('SELECT id FROM students WHERE username = ?', [username], (err, row) => {
      if (err) return console.error('Student lookup error:', err.message);
      if (row) {
        console.log('Student already exists:', username);
      } else {
        db.run('INSERT INTO students (firstName, lastName, contactNo, course, section, username, password, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', ['Sample', 'Student', '0000000000', 'DemoCourse', 'DemoSection', username, studentHash, 1], function(err) {
          if (err) console.error('Insert student error:', err.message);
          else console.log('Inserted student:', username, 'password:', studentPass);
        });
      }
    });

    // Insert a sample attendance record
    db.get('SELECT id FROM students WHERE username = ?', [username], (err, row) => {
      if (err) return;
      if (row) {
        const sid = row.id;
        db.run('INSERT OR IGNORE INTO attendance (studentId, status, attendanceDate, recordedBy) VALUES (?, ?, ?, ?)', [sid, 'Absent', new Date().toISOString().slice(0,10), 1]);
      }
    });

    console.log('Sample DB setup complete.');
    // keep process alive briefly to allow async inserts
    setTimeout(() => db.close(), 500);
  } catch (e) {
    console.error('Setup error:', e && e.message ? e.message : e);
    db.close();
    process.exit(1);
  }
})();
