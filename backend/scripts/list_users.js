const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
});

db.all('SELECT id, fullName, email, isAdmin, isMain, createdAt FROM admins ORDER BY id DESC', (err, rows) => {
  if (err) {
    console.error('Query error:', err.message);
    db.close();
    process.exit(1);
  }

  if (!rows || rows.length === 0) {
    console.log('No admin/user records found in the database.');
  } else {
    console.log('Admins/Users:');
    rows.forEach(r => {
      console.log(`- id:${r.id} | ${r.fullName} | ${r.email} | isAdmin:${r.isAdmin} | isMain:${r.isMain} | createdAt:${r.createdAt}`);
    });
  }

  db.close();
});
