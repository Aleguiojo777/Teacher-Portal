const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const [,, username, newPassword] = process.argv;
if (!username || !newPassword) {
  console.error('Usage: node update_student_password.js username newPassword');
  process.exit(1);
}

const dbPath = path.join(__dirname, '../database/teacher_portal.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) return console.error('DB open error:', err.message);
});

(async () => {
  try {
    const hash = await bcrypt.hash(newPassword, 10);
    db.run('UPDATE students SET password = ? WHERE username = ?', [hash, username], function(err) {
      if (err) {
        console.error('Update error:', err.message);
        process.exit(1);
      }
      if (this.changes === 0) {
        console.error('No student updated (username not found)');
        process.exit(1);
      }
      console.log('Password updated for', username);
      db.close();
      process.exit(0);
    });
  } catch (e) {
    console.error('Hash error:', e.message);
    db.close();
    process.exit(1);
  }
})();
