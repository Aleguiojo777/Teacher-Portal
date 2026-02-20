// Ensure a single global API_BASE is used to avoid redeclaration errors when pages
// load multiple scripts (portal.js + user-management.js)
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
const UM_API_BASE = API_BASE_LOCAL;

/* Sidebar toggle for user management page */
document.addEventListener('DOMContentLoaded', function() {
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  
  if(sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', function() {
      sidebar.classList.toggle('show');
    });
    
    // Close sidebar when clicking a link
    sidebar.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', function() {
        if(window.innerWidth <= 600) {
          sidebar.classList.remove('show');
        }
      });
    });
    
    // Close sidebar when clicking outside
    document.addEventListener('click', function(e) {
      if(!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
        sidebar.classList.remove('show');
      }
    });
  }
});

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
      // If logged-in admin is the main administrator
      if (storedAdmin && Number(storedAdmin.isMain) === 1) {
        // Main admin can edit any user (including the main account itself)
        actions = `<button class="edit-user" data-id="${u.id}" data-user='${JSON.stringify(u)}'>Edit</button>`;
        // Only allow delete for non-main users and not deleting self
        if (Number(u.isMain) !== 1 && Number(u.id) !== Number(storedAdmin.id)) {
          actions += `<button class="delete-user" data-id="${u.id}">Delete</button>`;
        }
      } else if (storedAdmin && Number(storedAdmin.id) === Number(u.id)) {
        // Non-main admins may edit their own account
        actions = `<button class="edit-user" data-id="${u.id}" data-user='${JSON.stringify(u)}'>Edit</button>`;
      }

      const row = document.createElement('tr');
      row.innerHTML = `<td>${i+1}</td><td>${escapeHtml(u.fullName)}</td><td>${escapeHtml(u.email)}</td><td>${role}</td><td>${formatDateTime(u.createdAt)}</td><td>${actions}</td>`;
      body.appendChild(row);
    });

    // Use event delegation for edit and delete buttons
    const usersBody = document.getElementById('usersBody');
    usersBody.removeEventListener('click', handleUserAction);
    usersBody.addEventListener('click', handleUserAction);

    setMessage('Users loaded', '');
  } catch(err){
    console.error(err);
    setMessage('Error loading users', 'error');
  }
}

// Handle user action (edit or delete)
async function handleUserAction(e) {
  if(e.target.classList.contains('edit-user')) {
    const userData = JSON.parse(e.target.dataset.user);
    openEditModal(userData);
  } else if(e.target.classList.contains('delete-user')) {
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
  }
}

// Basic XSS escape for names/emails
function escapeHtml(s){
  if(!s) return '';
  return String(s).replace(/[&<>\"']/g, (c)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
}

// Format timestamp string into readable local datetime
function formatDateTime(ts){
  if(!ts) return '';
  try{
    const iso = String(ts).trim().replace(' ', 'T');
    const d = new Date(iso);
    if(isNaN(d.getTime())) return ts;
    return d.toLocaleString();
  }catch(e){
    return ts;
  }
}

// Modal functions
let currentEditingUserId = null;

function openEditModal(userData) {
  currentEditingUserId = userData.id;
  document.getElementById('editUserFullName').value = userData.fullName;
  document.getElementById('editUserEmail').value = userData.email;
  document.getElementById('editUserPassword').value = '';
  document.getElementById('editUserRole').value = Number(userData.isAdmin) === 1 ? 'admin' : 'teacher';
  document.getElementById('editMessage').textContent = '';
  document.getElementById('editUserModal').classList.remove('modal-hidden');
}

function closeEditModal() {
  document.getElementById('editUserModal').classList.add('modal-hidden');
  currentEditingUserId = null;
  document.getElementById('userEditForm').reset();
}

function setEditMessage(text, type) {
  const el = document.getElementById('editMessage');
  if(!el) return;
  el.textContent = text;
  el.className = 'message ' + (type || '');
}

// Handle edit form submission
function handleEditFormSubmit(e) {
  e.preventDefault();
  
  if(!currentEditingUserId) {
    setEditMessage('Error: No user selected', 'error');
    return;
  }

  const fullName = document.getElementById('editUserFullName').value.trim();
  const email = document.getElementById('editUserEmail').value.trim();
  const password = document.getElementById('editUserPassword').value;
  const role = document.getElementById('editUserRole').value;
  const isAdmin = role === 'admin' ? 1 : 0;
  const token = localStorage.getItem('token');

  console.log('[DEBUG] Edit form submitted - userId:', currentEditingUserId, 'fullName:', fullName, 'email:', email);

  if(!token) {
    setEditMessage('Unauthorized: Please login', 'error');
    return;
  }
  if(!fullName || !email) {
    setEditMessage('Full name and email are required', 'error');
    return;
  }

  submitEditForm(fullName, email, password, isAdmin, token, currentEditingUserId);
}

async function submitEditForm(fullName, email, password, isAdmin, token, userId) {
  try {
    setEditMessage('Updating user...', 'loading');
    
    const body = { fullName, email, isAdmin };
    if(password && password.length > 0) {
      body.password = password;
    }

    console.log('[DEBUG] Sending PUT request to:', `${UM_API_BASE}/users/${userId}`, 'body:', body);

    const res = await fetch(`${UM_API_BASE}/users/${userId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': 'Bearer ' + token 
      },
      body: JSON.stringify(body)
    });

    const data = await res.json().catch(() => ({ error: 'Failed to parse response' }));
    
    console.log('[DEBUG] Response status:', res.status, 'data:', data);

    if(res.ok) {
      setEditMessage('User updated successfully', 'success');
      setTimeout(() => {
        closeEditModal();
        loadUsers();
      }, 500);
    } else {
      setEditMessage(data.error || data.message || 'Failed to update user', 'error');
    }
  } catch(err) {
    console.error('[ERROR] Edit user error:', err);
    setEditMessage('Error: ' + err.message, 'error');
  }
}

// Setup form event listener after DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  const editForm = document.getElementById('userEditForm');
  if(editForm) {
    editForm.removeEventListener('submit', handleEditFormSubmit);
    editForm.addEventListener('submit', handleEditFormSubmit);
  } else {
    console.warn('[WARN] userEditForm not found in DOM');
  }

  const closeModal = document.getElementById('closeEditModal');
  if(closeModal) {
    closeModal.removeEventListener('click', closeEditModal);
    closeModal.addEventListener('click', closeEditModal);
  }

  const cancelBtn = document.getElementById('cancelEditBtn');
  if(cancelBtn) {
    cancelBtn.removeEventListener('click', closeEditModal);
    cancelBtn.addEventListener('click', closeEditModal);
  }
});

// Close modal when clicking outside of it
document.addEventListener('DOMContentLoaded', function() {
  window.removeEventListener('click', handleOutsideClick);
  window.addEventListener('click', handleOutsideClick);
});

function handleOutsideClick(e) {
  const modal = document.getElementById('editUserModal');
  if(e.target === modal) {
    closeEditModal();
  }
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
