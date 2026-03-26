const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/teacher_portal.db');

db.get('SELECT id, email, password FROM admins WHERE email = ?', ['aleguiojoaljey@gmail.com'], (err, row) => {
  if (err) { console.error('ERR', err.message); process.exit(1); }
  if (!row) { console.error('No row'); process.exit(1); }
  console.log('ID:', row.id);
  console.log('Email:', row.email);
  console.log('PasswordHash:', row.password);
  db.close();
});
