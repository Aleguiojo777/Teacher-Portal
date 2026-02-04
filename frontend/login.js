// Login form handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const messageDiv = document.getElementById('message');

  try {
    // Show loading state
    messageDiv.textContent = 'Logging in...';
    messageDiv.className = 'message loading';

    // Send login request to backend
    const response = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Login successful
      messageDiv.textContent = 'Login successful! Redirecting...';
      messageDiv.className = 'message success';

      // Store user info in localStorage
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect to portal after 1 second
      setTimeout(() => {
        window.location.href = 'portal.html';
      }, 1000);
    } else {
      // Login failed
      messageDiv.textContent = data.error || 'Login failed';
      messageDiv.className = 'message error';
    }
  } catch (error) {
    console.error('Login error:', error);
    messageDiv.textContent = 'Error: Could not connect to server. Make sure the backend is running on http://localhost:3000';
    messageDiv.className = 'message error';
  }
});
