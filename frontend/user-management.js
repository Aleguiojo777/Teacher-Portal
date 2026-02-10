const UM_API_BASE = (typeof API_BASE !== 'undefined') ? API_BASE : 'http://localhost:3000/api';

// Simple helper to set message
function setMessage(text, type){
  const el = document.getElementById('message');
  if(!el) return;
  el.textContent = text;
  el.className = 'message ' + (type || '');
}

async function loadUsers(){
  const token = localStorage.getItem('token');
  console.debug('[UI] loadUsers token=', !!token);
  if(!token){ setMessage('Unauthorized: Please login as admin', 'error'); return; }

  try{
    const res = await fetch(`${UM_API_BASE}/users`, { headers: { 'Authorization': 'Bearer ' + token } });
    if(!res.ok){
      const err = await res.json().catch(()=>({ error: 'Failed to load users' }));
      setMessage(err.error || 'Failed to load users', 'error');
      return;
    }

    const users = await res.json();
    const body = document.getElementById('usersBody');
    body.innerHTML = '';
    const storedAdmin = JSON.parse(localStorage.getItem('admin') || 'null');

    users.forEach((u, i) => {
      const role = Number(u.isAdmin) === 1 ? 'Administrator' : 'Teacher';
      let actions = '';
      if(storedAdmin && Number(storedAdmin.isMain) === 1 && Number(u.isMain) !== 1){
        actions = `<button class="delete-user" data-id="${u.id}">Delete</button>`;
      }
      const row = document.createElement('tr');
      row.innerHTML = `<td>${i+1}</td><td>${escapeHtml(u.fullName)}</td><td>${escapeHtml(u.email)}</td><td>${role}</td><td>${u.createdAt}</td><td>${actions}</td>`;
      body.appendChild(row);
    });

    // Use event delegation for delete buttons
    const usersBody = document.getElementById('usersBody');
    usersBody.addEventListener('click', async (e) => {
      if(!e.target.classList.contains('delete-user')) return;
      const id = e.target.dataset.id;
      if(!confirm('Delete this user?')) return;
      try{
        const token = localStorage.getItem('token');
        const resp = await fetch(`${UM_API_BASE}/users/${id}`, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
        const d = await resp.json().catch(()=>({}));
        if(resp.ok){
          setMessage('User deleted', 'success');
          loadUsers();
        } else {
          setMessage(d.error || 'Failed to delete user', 'error');
        }
      } catch(err){
        console.error(err);
        setMessage('Error deleting user', 'error');
      }
    });

    setMessage('Users loaded', '');
  } catch(err){
    console.error(err);
    setMessage('Error loading users', 'error');
  }
}

// Basic XSS escape for names/emails
function escapeHtml(s){
  if(!s) return '';
  return String(s).replace(/[&<>"']/g, (c)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// Handle create user
document.getElementById('userCreateForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const fullName = document.getElementById('userFullName').value.trim();
  const email = document.getElementById('userEmail').value.trim();
  const password = document.getElementById('userPassword').value;
  const role = document.getElementById('userRole').value;
  const isAdmin = role === 'admin' ? 1 : 0;
  const token = localStorage.getItem('token');

  if(!token){ setMessage('Unauthorized: Please login', 'error'); return; }
  if(!fullName || !email || !password){ setMessage('All fields are required', 'error'); return; }

  try{
    setMessage('Creating user...', 'loading');
    const res = await fetch(`${UM_API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ fullName, email, password, isAdmin })
    });

    const data = await res.json().catch(()=>({}));
    if(res.ok){
      setMessage('User created', 'success');
      document.getElementById('userCreateForm').reset();
      await loadUsers();
    } else {
      setMessage(data.error || data.message || 'Failed to create user', 'error');
    }
  } catch(err){
    console.error(err);
    setMessage('Error creating user', 'error');
  }
});

// On load: ensure admin
(function(){
  const storedAdmin = JSON.parse(localStorage.getItem('admin') || 'null');
  if(!storedAdmin || Number(storedAdmin.isAdmin) !== 1){
    setMessage('Forbidden: Only administrators can access this page.', 'error');
    document.getElementById('userCreateForm').querySelectorAll('input,select,button').forEach(el=>el.disabled=true);
    return;
  }
  loadUsers();
})();
