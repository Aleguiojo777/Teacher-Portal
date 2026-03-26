const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const [,, username, password] = process.argv;
if (!username || !password) {
  console.error('Usage: node set_student_password.js <username> <newPassword>');
  process.exit(1);
}

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'database.db');
console.log('Using DB:', dbPath);

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
  if (err) return console.error('DB open error:', err.message);
});

(async () => {
  try {
    const hash = await bcrypt.hash(password, 10);
    db.run('UPDATE students SET password = ? WHERE username = ?', [hash, username], function(err) {
      if (err) {
        console.error('Update error:', err.message);
        process.exit(1);
      }
      if (this.changes === 0) {
        console.error('No student found with username', username);
        process.exit(2);
      }
      console.log('Password updated for', username);
      process.exit(0);
    });
  } catch (e) {
    console.error('Hash error:', e.message);
    process.exit(1);
  }
})();
