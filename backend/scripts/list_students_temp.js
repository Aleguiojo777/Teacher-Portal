const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'database.db');
console.log('Using DB:', dbPath);

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('DB open error:', err && err.message);
    process.exit(1);
  }
});

db.all('SELECT id, firstName, lastName, username FROM students ORDER BY id LIMIT 500', [], (err, rows) => {
  if (err) {
    console.error('Query error:', err && err.message);
    db.close();
    process.exit(1);
  }
  if (!rows || rows.length === 0) {
    console.log('No students found');
    db.close();
    process.exit(0);
  }

  console.log('Students:');
  rows.forEach(r => console.log(`${r.id}\t${r.username}\t${r.firstName} ${r.lastName}`));
  db.close();
});
