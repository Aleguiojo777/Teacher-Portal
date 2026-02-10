const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to open DB', err.message);
    process.exit(1);
  }
});

console.log('This script will remove all non-main admin accounts from', dbPath);

db.run('DELETE FROM admins WHERE isMain = 0', function(err) {
  if (err) {
    console.error('Error truncating users:', err.message);
    process.exit(1);
  }
  console.log('Deleted rows:', this.changes);
  db.close();
});
