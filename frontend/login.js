// Compute API base once and attach to window to avoid redeclaration errors
window.API_BASE = window.API_BASE || (function(){
  try{
    const origin = window.location.origin;
    const host = window.location.hostname;
    if(host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3000/api';
    return origin + '/api';
  }catch(e){
    return 'http://localhost:3000/api';
  }
})();
const API_BASE_LOCAL = window.API_BASE;

// Login form handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const messageDiv = document.getElementById('message');

  try {
    messageDiv.textContent = 'Logging in...';
    messageDiv.className = 'message loading';

    const response = await fetch(`${API_BASE_LOCAL}/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      messageDiv.textContent = 'Login successful! Redirecting...';
      messageDiv.className = 'message success';

      // Normalize admin flags to numbers to avoid strict equality issues elsewhere
      if (data.admin) {
        data.admin.isAdmin = Number(data.admin.isAdmin || 0);
        data.admin.isMain = Number(data.admin.isMain || 0);
      }
      localStorage.setItem('admin', JSON.stringify(data.admin));
      localStorage.setItem('token', data.token);

      setTimeout(() => {
        window.location.href = 'portal.html';
      }, 1000);
    } else {
      messageDiv.textContent = data.error || 'Login failed';
      messageDiv.className = 'message error';
    }
  } catch (error) {
    console.error('Login error:', error);
    messageDiv.textContent = `Error: Could not connect to server. Make sure the backend is running and reachable from this device (${API_BASE_LOCAL})`;
    messageDiv.className = 'message error';
  }
});


