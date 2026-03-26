const http = require('http');
const https = require('https');
const fetch = global.fetch || require('node-fetch');

const BACKEND = 'http://localhost:3000';
const username = process.env.USERNAME || process.argv[2] || 'gedeon';
const password = process.env.PASSWORD || process.argv[3] || 'test1234';

(async () => {
  try {
    console.log('Logging in as', username);
    const res = await fetch(`${BACKEND}/api/student/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const body = await res.json().catch(()=>null);
    console.log('Login status:', res.status);
    console.log('Login response:', body);
    if (!res.ok) process.exit(1);

    const token = body.token;
    if (!token) {
      console.error('No token returned');
      process.exit(1);
    }

    console.log('\nFetching attendance...');
    const att = await fetch(`${BACKEND}/api/student/attendance`, { headers: { Authorization: `Bearer ${token}` } });
    const attBody = await att.json().catch(()=>null);
    console.log('Attendance status:', att.status);
    console.log('Attendance:', attBody);

    console.log('\nFetching notifications...');
    const noti = await fetch(`${BACKEND}/api/student/notifications`, { headers: { Authorization: `Bearer ${token}` } });
    const notiBody = await noti.json().catch(()=>null);
    console.log('Notifications status:', noti.status);
    console.log('Notifications:', notiBody);

  } catch (e) {
    console.error('Error:', e && e.message ? e.message : e);
    process.exit(1);
  }
})();
