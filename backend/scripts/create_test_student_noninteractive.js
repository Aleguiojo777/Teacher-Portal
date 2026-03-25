#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

// Usage: node create_test_student_noninteractive.js adminEmail firstName lastName username password contactNo course section startTime endTime
const [,, adminEmail, firstName, lastName, username, password, contactNo, course, section, startTime, endTime] = process.argv;
if (!adminEmail || !firstName || !lastName || !username || !password || !contactNo || !course || !section || !startTime || !endTime) {
  console.error('Usage: node create_test_student_noninteractive.js adminEmail firstName lastName username password contactNo course section startTime endTime');
  process.exit(1);
}

const dbPath = path.join(__dirname, '../database/teacher_portal.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('[ERROR] Opening DB:', err.message);
    process.exit(1);
  }

  db.get('SELECT id FROM admins WHERE email = ?', [adminEmail], async (err, row) => {
    if (err) {
      console.error('[ERROR] Query failed:', err.message);
      db.close();
      process.exit(1);
    }

    if (!row) {
      console.error('[ERROR] No admin found with email', adminEmail);
      db.close();
      process.exit(1);
    }

    const createdBy = row.id;

    try {
      const hash = await bcrypt.hash(password, 10);
      const sql = 'INSERT INTO students (firstName, lastName, username, password, contactNo, course, section, startTime, endTime, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
      db.run(sql, [firstName, lastName, username, hash, contactNo, course, section, startTime, endTime, createdBy], function(insertErr) {
        if (insertErr) {
          console.error('[ERROR] Insert failed:', insertErr.message);
          db.close();
          process.exit(1);
        }
        console.log('[SUCCESS] Student Created');
        console.log('Student ID:', this.lastID);
        db.close();
        process.exit(0);
      });
    } catch (e) {
      console.error('[ERROR] Hashing failed:', e.message);
      db.close();
      process.exit(1);
    }
  });
});
