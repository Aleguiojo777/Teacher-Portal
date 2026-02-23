const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', 'database.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
});

const email = process.argv[2] || 'aleguiojoaljey@gmail.com';
const password = process.argv[3] || 'admin123';

(async () => {
  try {
    const hash = await bcrypt.hash(password, 10);
    db.run('UPDATE admins SET password = ?, isMain = 1 WHERE email = ?', [hash, email], function(err) {
      if (err) {
        console.error('Update error:', err.message);
        process.exit(1);
      }
      console.log(`Updated rows: ${this.changes}`);
      db.close();
    });
  } catch (e) {
    console.error('Hash error:', e.message);
    db.close();
    process.exit(1);
  }
})();
