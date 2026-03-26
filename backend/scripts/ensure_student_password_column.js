const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../database/teacher_portal.db');
const db = new sqlite3.Database(dbPath, (err) => { if (err) return console.error('DB open error:', err.message); });

db.all("PRAGMA table_info(students)", [], (err, cols) => {
  if (err) { console.error('PRAGMA error:', err.message); process.exit(1); }
  const hasPassword = cols && cols.some(c => c.name === 'password');
  if (hasPassword) {
    console.log('students table already has password column');
    db.close();
    process.exit(0);
  }

  db.run("ALTER TABLE students ADD COLUMN password TEXT", (alterErr) => {
    if (alterErr) { console.error('ALTER TABLE error:', alterErr.message); process.exit(1); }
    console.log('Added password column to students table');
    db.close();
    process.exit(0);
  });
});
