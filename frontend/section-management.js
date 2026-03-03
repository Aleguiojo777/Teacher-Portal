// Compute API base once globally so multiple pages/scripts don't redeclare it
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
const API_BASE = window.API_BASE;

let sections = [];
let editingSectionId = null;

// Sidebar toggle
document.addEventListener('DOMContentLoaded', function() {
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  
  if(sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', function() {
      sidebar.classList.toggle('show');
    });
    
    sidebar.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', function() {
        if(window.innerWidth <= 600) {
          sidebar.classList.remove('show');
        }
      });
    });
    
    document.addEventListener('click', function(e) {
      if(!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
        sidebar.classList.remove('show');
      }
    });
  }

  // Load sections
  loadSections();

  // Form submission
  document.getElementById('sectionForm').addEventListener('submit', addSection);

  // Modal handlers
  document.getElementById('closeEditModal').addEventListener('click', closeEditModal);
  document.getElementById('cancelEditBtn').addEventListener('click', closeEditModal);
  document.getElementById('editSectionForm').addEventListener('submit', saveEditedSection);

  // Logout
  const logoutLink = document.getElementById('logoutLink');
  if(logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }

  // Modal close on outside click
  window.addEventListener('click', function(e) {
    const modal = document.getElementById('editSectionModal');
    if(e.target === modal) {
      closeEditModal();
    }
  });
});

function showMessage(text, type = 'success') {
  const messageEl = document.getElementById('message');
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
  setTimeout(() => {
    messageEl.className = 'message';
  }, 3000);
}

async function loadSections() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/sections`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if(response.ok){
      sections = await response.json();
      renderSections();
    } else if(response.status === 401) {
      window.location.href = 'login.html';
    }
  } catch(error){
    console.error('Error loading sections:', error);
    showMessage('Error loading sections', 'error');
  }
}

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

function renderSections() {
  const tbody = document.getElementById('sectionsList');
  tbody.innerHTML = '';

  sections.forEach((section, index) => {
    const row = tbody.insertRow();
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${escapeHtml(section.sectionName)}</td>
      <td>${escapeHtml(section.course)}</td>
      <td>${escapeHtml(section.subject)}</td>
      <td>${escapeHtml(section.scheduleTime)}</td>
      <td>${escapeHtml(section.scheduleDay)}</td>
      <td>${formatDateTime(section.createdAt)}</td>
      <td>
        <button class="action-btn edit-btn" onclick="editSection(${section.id})">Edit</button>
        <button class="action-btn delete-btn" onclick="deleteSection(${section.id})">Delete</button>
      </td>
    `;
  });
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function addSection(e) {
  e.preventDefault();

  const sectionName = document.getElementById('sectionName').value.trim();
  const course = document.getElementById('course').value.trim();
  const subject = document.getElementById('subject').value.trim();
  const scheduleTime = document.getElementById('scheduleTime').value.trim();
  const scheduleDay = document.getElementById('scheduleDay').value.trim();

  if (!sectionName || !course || !subject || !scheduleTime || !scheduleDay) {
    showMessage('All fields are required', 'error');
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/sections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({
        sectionName,
        course,
        subject,
        scheduleTime,
        scheduleDay
      })
    });

    if(response.ok){
      showMessage('Section created successfully', 'success');
      document.getElementById('sectionForm').reset();
      await loadSections();
    } else if(response.status === 401) {
      window.location.href = 'login.html';
    } else {
      const data = await response.json();
      showMessage(data.error || 'Error creating section', 'error');
    }
  } catch(error){
    console.error('Error creating section:', error);
    showMessage('Error creating section', 'error');
  }
}

function editSection(id) {
  const section = sections.find(s => s.id === id);
  if (!section) return;

  editingSectionId = id;
  document.getElementById('editSectionName').value = section.sectionName;
  document.getElementById('editCourse').value = section.course;
  document.getElementById('editSubject').value = section.subject;
  document.getElementById('editScheduleTime').value = section.scheduleTime;
  document.getElementById('editScheduleDay').value = section.scheduleDay;

  document.getElementById('editSectionModal').classList.remove('modal-hidden');
}

function closeEditModal() {
  document.getElementById('editSectionModal').classList.add('modal-hidden');
  editingSectionId = null;
}

async function saveEditedSection(e) {
  e.preventDefault();

  if (!editingSectionId) return;

  const sectionName = document.getElementById('editSectionName').value.trim();
  const course = document.getElementById('editCourse').value.trim();
  const subject = document.getElementById('editSubject').value.trim();
  const scheduleTime = document.getElementById('editScheduleTime').value.trim();
  const scheduleDay = document.getElementById('editScheduleDay').value.trim();

  if (!sectionName || !course || !subject || !scheduleTime || !scheduleDay) {
    showMessage('All fields are required', 'error');
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/sections/${editingSectionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({
        sectionName,
        course,
        subject,
        scheduleTime,
        scheduleDay
      })
    });

    if(response.ok){
      showMessage('Section updated successfully', 'success');
      closeEditModal();
      await loadSections();
    } else if(response.status === 401) {
      window.location.href = 'login.html';
    } else {
      const data = await response.json();
      showMessage(data.error || 'Error updating section', 'error');
    }
  } catch(error){
    console.error('Error updating section:', error);
    showMessage('Error updating section', 'error');
  }
}

async function deleteSection(id) {
  if (!confirm('Are you sure you want to delete this section?')) return;

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/sections/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if(response.ok){
      showMessage('Section deleted successfully', 'success');
      await loadSections();
    } else if(response.status === 401) {
      window.location.href = 'login.html';
    } else {
      const data = await response.json();
      showMessage(data.error || 'Error deleting section', 'error');
    }
  } catch(error){
    console.error('Error deleting section:', error);
    showMessage('Error deleting section', 'error');
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('adminId');
  localStorage.removeItem('admin');
  window.location.href = 'login.html';
}

// Apply user visibility for admin/teacher features
function applyUserVisibility(){
  const storedAdmin = JSON.parse(localStorage.getItem('admin') || 'null');
  const userMgmtNav = document.getElementById('userMgmtNav');
  
  if(!storedAdmin || Number(storedAdmin.isAdmin) !== 1) {
    // Only admins can access this page
    alert('Access Denied: Only administrators can manage sections.');
    window.location.href = 'portal.html';
    return;
  }
  
  if(userMgmtNav) userMgmtNav.classList.remove('hidden');
}

applyUserVisibility();

