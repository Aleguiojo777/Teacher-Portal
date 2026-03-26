const username = process.env.TEST_USER || process.argv[2] || 'gedeon';
const password = process.env.TEST_PASS || process.argv[3] || 'testpass';
const base = process.env.BACKEND_BASE || 'http://localhost:3000';

(async () => {
  try {
    console.log('Logging in as', username);
    const res = await fetch(`${base}/api/student/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const body = await res.json().catch(() => null);
    console.log('Login status:', res.status);
    console.log('Login response:', body);
    if (!res.ok) process.exit(1);

    const token = body.token;
    if (!token) {
      console.error('No token returned');
      process.exit(1);
    }

    console.log('\nFetching attendance...');
    const att = await fetch(`${base}/api/student/attendance`, { headers: { Authorization: `Bearer ${token}` } });
    const attBody = await att.json().catch(() => null);
    console.log('Attendance status:', att.status);
    console.log('Attendance:', attBody);

    console.log('\nFetching notifications...');
    const noti = await fetch(`${base}/api/student/notifications`, { headers: { Authorization: `Bearer ${token}` } });
    const notiBody = await noti.json().catch(() => null);
    console.log('Notifications status:', noti.status);
    console.log('Notifications:', notiBody);

  } catch (e) {
    console.error('Error:', e && e.message ? e.message : e);
    process.exit(1);
  }
})();
