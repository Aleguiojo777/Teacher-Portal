const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
});

const email = 'aleguiojoaljey@gmail.com';

db.run('UPDATE admins SET isMain = 1 WHERE email = ?', [email], function(err) {
  if (err) {
    console.error('Update error:', err.message);
  } else {
    console.log(`Updated rows: ${this.changes}`);
  }
  db.close();
});
