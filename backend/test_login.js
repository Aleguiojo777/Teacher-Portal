console.log('test_login starting');
(async () => {
  try {
    console.log('sending request...');
    const res = await fetch('http://localhost:3000/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'aleguiojoaljey@gmail.com', password: 'admin123' })
    });

    console.log('Status:', res.status);
    const body = await res.text();
    console.log('Body:', body);
  } catch (err) {
    console.error('Request error:', err);
  }
})();
