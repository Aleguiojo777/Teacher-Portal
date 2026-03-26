const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../database/teacher_portal.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) return console.error('DB open error:', err.message);
});

db.all('SELECT id, fullName, email, isAdmin, isMain FROM admins ORDER BY id', [], (err, rows) => {
  if (err) {
    console.error('Query error:', err.message);
    process.exit(1);
  }
  if (!rows || rows.length === 0) {
    console.log('No admins found');
    process.exit(0);
  }

  console.log('Admins:');
  rows.forEach(r => console.log(`${r.id}\t${r.email}\t${r.fullName}\tadmin=${r.isAdmin}\tmain=${r.isMain}`));
  db.close();
});
