#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const [,, fullName, email, password] = process.argv;
if (!fullName || !email || !password) {
  console.error('Usage: node create_admin_direct.js "Full Name" email@example.com password');
  process.exit(1);
}

const dbPath = path.join(__dirname, '../database/teacher_portal.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('[ERROR] Opening DB:', err.message);
    process.exit(1);
  }

  // Create admins table if missing
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
  `, (createErr) => {
    if (createErr) {
      console.error('[ERROR] Creating admins table:', createErr.message);
      db.close();
      process.exit(1);
    }

    db.get('SELECT id FROM admins WHERE email = ?', [email], async (err, row) => {
      if (err) {
        console.error('[ERROR] Query failed:', err.message);
        db.close();
        process.exit(1);
      }

      if (row) {
        console.error('[ERROR] Admin with this email already exists');
        db.close();
        process.exit(1);
      }

      try {
        const hash = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO admins (fullName, email, password, isAdmin, isMain) VALUES (?, ?, ?, ?, ?)';
        db.run(sql, [fullName, email, hash, 1, 1], function(insertErr) {
          if (insertErr) {
            console.error('[ERROR] Insert failed:', insertErr.message);
            db.close();
            process.exit(1);
          }
          console.log('[SUCCESS] Main Administrator Created');
          console.log('Admin ID:', this.lastID);
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
});
