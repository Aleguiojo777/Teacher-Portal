/* ===========================
   STUDENT DATA (FROM API)
=========================== */

let students = [];
let editingId = null;
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

/* ===========================
   SIDEBAR TOGGLE
=========================== */
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

/* ===========================
   LOAD STUDENTS FROM API
=========================== */

// Helper to format timestamp strings to a readable local datetime
function formatDateTime(ts){
  if(!ts) return '';
  try{
    // Normalize common SQLite datetime format "YYYY-MM-DD HH:MM:SS" to ISO
    const iso = String(ts).trim().replace(' ', 'T');
    const d = new Date(iso);
    if(isNaN(d.getTime())) return ts;
    return d.toLocaleString();
  }catch(e){
    return ts;
  }
}

async function loadStudents(){
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/students`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if(response.ok){
            students = await response.json();
            // Initialize status property for all students (default to "Absent")
            students.forEach(s => {
                if(!s.status) {
                    s.status = "Absent";
                }
            });
            
            // Load attendance for today
            await loadTodayAttendance();
            renderStudents();
            loadSections();
        }
    } catch(error){
        console.error('Error loading students:', error);
        alert('Error loading students');
    }
}

async function loadTodayAttendance() {
    try {
        const token = localStorage.getItem('token');
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(`${API_BASE}/attendance/${today}`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        if(response.ok) {
            const attendanceRecords = await response.json();
            console.log('[DEBUG] Attendance records loaded:', attendanceRecords);
            
            // Update student statuses from attendance records
            attendanceRecords.forEach(record => {
                const student = students.find(s => s.id === record.studentId);
                if(student) {
                    student.status = record.status;
                    console.log('[DEBUG] Updated student', student.id, 'to status:', record.status);
                }
            });

            // Update home page statistics
            updateHomeStatistics(attendanceRecords);
        }
    } catch(error) {
        console.error('[ERROR] Failed to load attendance:', error);
    }
}

function updateHomeStatistics(attendanceRecords) {
    try {
        let presentCount = 0, absentCount = 0, lateCount = 0;
        
        if(students.length === 0) {
            // No students, set all to 0
            document.getElementById("presentCount").textContent = 0;
            document.getElementById("presentPercentage").textContent = "0%";
            document.getElementById("absentCount").textContent = 0;
            document.getElementById("absentPercentage").textContent = "0%";
            document.getElementById("lateCount").textContent = 0;
            document.getElementById("latePercentage").textContent = "0%";
            document.getElementById("totalCount").textContent = 0;
            document.getElementById("totalPercentage").textContent = "0%";
            return;
        }

        // Count attendance status for each student
        students.forEach(student => {
            const attendance = attendanceRecords.find(a => a.studentId === student.id);
            const status = attendance ? attendance.status : 'Absent';
            
            if(status === "Present") presentCount++;
            else if(status === "Late") lateCount++;
            else absentCount++;
        });
        
        const total = students.length;
        const presentPct = total > 0 ? Math.round((presentCount / total) * 100) : 0;
        const absentPct = total > 0 ? Math.round((absentCount / total) * 100) : 0;
        const latePct = total > 0 ? Math.round((lateCount / total) * 100) : 0;
        
        // Update UI
        document.getElementById("presentCount").textContent = presentCount;
        document.getElementById("presentPercentage").textContent = presentPct + "%";
        document.getElementById("absentCount").textContent = absentCount;
        document.getElementById("absentPercentage").textContent = absentPct + "%";
        document.getElementById("lateCount").textContent = lateCount;
        document.getElementById("latePercentage").textContent = latePct + "%";
        document.getElementById("totalCount").textContent = total;
        document.getElementById("totalPercentage").textContent = "100%";
        
        console.log('[DEBUG] Home stats updated - Present:', presentCount, 'Late:', lateCount, 'Absent:', absentCount);
    } catch(error) {
        console.error('[ERROR] Failed to update home statistics:', error);
    }
}


/* ===========================
   MANAGE STUDENTS (CRUD)
=========================== */

async function saveStudent(){
    const firstName = document.getElementById("firstName").value;
    const lastName = document.getElementById("lastName").value;
    const contactNo = document.getElementById("contactNo").value;
    const course = document.getElementById("course").value;
    const section = document.getElementById("section").value;
    const btn = document.getElementById("studentBtn");

    if(!firstName || !lastName || !contactNo || !course || !section){
        alert("Fill all fields");
        return;
    }

    try {
        let response;
        
        if(editingId === null){
            // ADD NEW STUDENT
            const token = localStorage.getItem('token');
            response = await fetch(`${API_BASE}/students`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    contactNo,
                    course,
                    section
                })
            });
        } else {
            // UPDATE STUDENT
            const token = localStorage.getItem('token');
            response = await fetch(`${API_BASE}/students/${editingId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    contactNo,
                    course,
                    section
                })
            });
        }

        if(response.ok){
            alert(editingId === null ? 'Student added successfully!' : 'Student updated successfully!');
            editingId = null;
            btn.textContent = "Add Student";
            clearForm();
            loadStudents();
        } else {
            const error = await response.json();
            alert('Error: ' + error.error);
        }
    } catch(error){
        console.error('Error saving student:', error);
        alert('Error saving student');
    }
}

function renderStudents(){
    const list = document.getElementById("studentList");
    if(!list) return;

    list.innerHTML = "";

    students.forEach((s, i)=>{
      const row = document.createElement('tr');
      row.innerHTML = `<td>${i+1}</td><td>${s.firstName}</td><td>${s.lastName}</td><td>${s.contactNo}</td><td>${s.course}</td><td>${s.section}</td><td>${formatDateTime(s.createdAt)}</td><td><button class="edit-student" data-id="${s.id}" data-student='${JSON.stringify(s)}'>Edit</button>
            <button class="delete-student" data-id="${s.id}">Delete</button></td></tr>`;
      list.appendChild(row);
    });

    // Use event delegation for edit and delete buttons
    const studentList = document.getElementById('studentList');
    studentList.removeEventListener('click', handleStudentAction);
    studentList.addEventListener('click', handleStudentAction);
}

// Handle student action (edit or delete)
async function handleStudentAction(e) {
  if(e.target.classList.contains('edit-student')) {
    const studentData = JSON.parse(e.target.dataset.student);
    openEditStudentModal(studentData);
  } else if(e.target.classList.contains('delete-student')) {
    const id = e.target.dataset.id;
    if(!confirm('Delete this student?')) return;
    try{
      const token = localStorage.getItem('token');
      const resp = await fetch(`${API_BASE}/students/${id}`, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
      const d = await resp.json().catch(()=>({}));
      if(resp.ok){
        alert('Student deleted');
        loadStudents();
      } else {
        alert(d.error || 'Failed to delete student');
      }
    } catch(err){
      console.error(err);
      alert('Error deleting student');
    }
  }
}

let currentEditingStudentId = null;

function openEditStudentModal(studentData) {
  currentEditingStudentId = studentData.id;
  document.getElementById('editStudentFirstName').value = studentData.firstName;
  document.getElementById('editStudentLastName').value = studentData.lastName;
  document.getElementById('editStudentContactNo').value = studentData.contactNo;
  document.getElementById('editStudentCourse').value = studentData.course;
  document.getElementById('editStudentSection').value = studentData.section;
  document.getElementById('editStudentMessage').textContent = '';
  document.getElementById('editStudentModal').classList.remove('modal-hidden');
}

function closeEditStudentModal() {
  document.getElementById('editStudentModal').classList.add('modal-hidden');
  currentEditingStudentId = null;
  document.getElementById('studentEditForm').reset();
}

function setEditStudentMessage(text, type) {
  const el = document.getElementById('editStudentMessage');
  if(!el) return;
  el.textContent = text;
  el.className = 'message ' + (type || '');
}

function editStudent(id){
    const student = students.find(s => s.id === id);
    if(!student) return;
    openEditStudentModal(student);
}

function handleEditStudentFormSubmit(e) {
  e.preventDefault();
  
  if(!currentEditingStudentId) {
    setEditStudentMessage('Error: No student selected', 'error');
    return;
  }

  const firstName = document.getElementById('editStudentFirstName').value.trim();
  const lastName = document.getElementById('editStudentLastName').value.trim();
  const contactNo = document.getElementById('editStudentContactNo').value.trim();
  const course = document.getElementById('editStudentCourse').value.trim();
  const section = document.getElementById('editStudentSection').value.trim();
  const token = localStorage.getItem('token');

  if(!token) {
    setEditStudentMessage('Unauthorized: Please login', 'error');
    return;
  }
  if(!firstName || !lastName || !contactNo || !course || !section) {
    setEditStudentMessage('All fields are required', 'error');
    return;
  }

  submitEditStudentForm(firstName, lastName, contactNo, course, section, token, currentEditingStudentId);
}

async function submitEditStudentForm(firstName, lastName, contactNo, course, section, token, studentId) {
  try {
    setEditStudentMessage('Updating student...', 'loading');
    
    const body = { firstName, lastName, contactNo, course, section };

    const res = await fetch(`${API_BASE}/students/${studentId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': 'Bearer ' + token 
      },
      body: JSON.stringify(body)
    });

    const data = await res.json().catch(() => ({ error: 'Failed to parse response' }));

    if(res.ok) {
      setEditStudentMessage('Student updated successfully', 'success');
      setTimeout(() => {
        closeEditStudentModal();
        loadStudents();
      }, 500);
    } else {
      setEditStudentMessage(data.error || data.message || 'Failed to update student', 'error');
    }
  } catch(err) {
    console.error('[ERROR] Edit student error:', err);
    setEditStudentMessage('Error: ' + err.message, 'error');
  }
}

function clearForm(){
    document.getElementById("firstName").value = "";
    document.getElementById("lastName").value = "";
    document.getElementById("contactNo").value = "";
    document.getElementById("course").value = "";
    document.getElementById("section").value = "";

    editingId = null;
    document.getElementById("studentBtn").textContent = "Add Student";
}


/* ===========================
   ATTENDANCE SYSTEM
=========================== */

function loadSections(){
    const select = document.getElementById("attendanceSection");
    if(!select) return;

    select.innerHTML = `<option value="">Select Section</option>`;

    const sections = [...new Set(students.map(s => s.section))];

    sections.forEach(sec=>{
        const opt = document.createElement("option");
        opt.value = sec;
        opt.textContent = sec;
        select.appendChild(opt);
    });
}

function loadAttendance(){
    const secSelect = document.getElementById("attendanceSection");
    const sec = secSelect.value;
    const list = document.getElementById("attendanceList");
    
    console.log('[DEBUG] loadAttendance called - section:', sec);

    if(!sec){
        list.innerHTML = "";
        return;
    }

    list.innerHTML = "";
    let count = 0;

    students.forEach((s, index)=>{
        if(s.section === sec){
            count++;
            const fullName = `${s.firstName} ${s.lastName}`;
            const statusClass = s.status === "Present" ? "present" : (s.status === "Late" ? "late" : "absent");
            console.log('[DEBUG] Student:', s.firstName, 'Status:', s.status, 'Class:', statusClass);
            list.innerHTML += `
            <tr>
                <td>${count}</td>
                <td>${fullName}</td>
                <td>${s.course}</td>
                <td class="${statusClass}">
                    ${s.status || "Absent"}
                </td>
                <td>
                    <button class="btn-present" onclick="setStatus(${s.id}, 'Present')">Present</button>
                    <button class="btn-late" onclick="setStatus(${s.id}, 'Late')">Late</button>
                    <button class="btn-absent" onclick="setStatus(${s.id}, 'Absent')">Absent</button>
                </td>
            </tr>
            `;
        }
    });
    console.log('[DEBUG] loadAttendance complete - students shown:', count);
}

function setStatus(id, status){
    console.log('[DEBUG] setStatus called - id:', id, 'status:', status);
    const student = students.find(s => s.id === id);
    console.log('[DEBUG] student found:', student);
    if(!student) {
        console.warn('[WARN] Student not found with id:', id);
        return;
    }
    
    student.status = status;
    console.log('[DEBUG] Status updated to:', student.status);
    
    // Save to backend
    saveAttendanceToBackend(id, status);
    
    loadAttendance();
}

async function saveAttendanceToBackend(studentId, status) {
    try {
        const token = localStorage.getItem('token');
        const today = new Date().toISOString().split('T')[0];
        
        console.log('[DEBUG] Saving attendance - studentId:', studentId, 'status:', status, 'date:', today);
        
        const response = await fetch(`${API_BASE}/attendance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
                studentId: studentId,
                status: status,
                attendanceDate: today
            })
        });
        
        const data = await response.json();
        if(response.ok) {
            console.log('[DEBUG] Attendance saved successfully:', data);
        } else {
            console.error('[ERROR] Failed to save attendance:', data.error);
        }
    } catch(error) {
        console.error('[ERROR] Error saving attendance:', error);
    }
}

function toggleStatus(id){
    const student = students.find(s => s.id === id);
    if(!student) return;
    
    student.status = student.status === "Present" ? "Absent" : "Present";

    // ONLY refresh table — NOT sections
    loadAttendance();
}



/* ===========================
   AUTO LOAD WHEN PAGE OPENS
=========================== */
// Show/hide User Management link and welcome message based on logged-in user
function applyUserVisibility(){
    const storedAdmin = JSON.parse(localStorage.getItem('admin') || 'null');
    const userMgmtNav = document.getElementById('userMgmtNav');
    const welcomeTitle = document.getElementById('welcomeTitle');
    const welcomeText = document.getElementById('welcomeText');
    const logoutNav = document.getElementById('logoutNav');
    const logoutLink = document.getElementById('logoutLink');

    if(storedAdmin){
        const role = Number(storedAdmin.isAdmin) === 1 ? 'Administrator' : 'Teacher';
        if(welcomeTitle) welcomeTitle.textContent = `Welcome ${storedAdmin.fullName || '' } 👋`;
        if(welcomeText) welcomeText.textContent = `Signed in as ${role}`;
        if(userMgmtNav) userMgmtNav.style.display = Number(storedAdmin.isAdmin) === 1 ? 'list-item' : 'none';
        if(logoutNav) logoutNav.style.display = 'list-item';
        if(logoutLink) {
            logoutLink.addEventListener('click', (e) => { e.preventDefault(); logout(); });
        }
    } else {
        if(welcomeTitle) welcomeTitle.textContent = 'Welcome';
        if(welcomeText) welcomeText.textContent = 'Please login.';
        if(userMgmtNav) userMgmtNav.style.display = 'none';
        if(logoutNav) logoutNav.style.display = 'none';
    }
}

function logout(){
    localStorage.removeItem('admin');
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

applyUserVisibility();

// Section switching (show/hide in-page sections)
function showSection(name){
    const sections = ['home','manage','attendance','users'];
    sections.forEach(s => {
        const el = document.getElementById('section-' + s);
        if(!el) return;
        el.style.display = (s === name) ? '' : 'none';
    });

    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        if(link.dataset.section === name) link.classList.add('active'); else link.classList.remove('active');
    });

    // Load data for specific sections
    if(name === 'manage') loadStudents();
    if(name === 'attendance') { loadSections(); }
    if(name === 'users' && typeof loadUsers === 'function') loadUsers();
}

document.addEventListener('DOMContentLoaded', function() {
  // Load students if on a page that needs it (manage.html, attendance.html, or portal.html)
  const studentList = document.getElementById('studentList');
  const attendanceSection = document.getElementById('attendanceSection');
  const sectionHome = document.getElementById('section-home');
  
  if(studentList || attendanceSection || sectionHome) {
    loadStudents();
  }

  // Wire nav links
  document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
          e.preventDefault();
          const sec = link.dataset.section || 'home';
          showSection(sec);
      });
  });

  // Setup student edit form event listeners
  const studentEditForm = document.getElementById('studentEditForm');
  if(studentEditForm) {
    studentEditForm.removeEventListener('submit', handleEditStudentFormSubmit);
    studentEditForm.addEventListener('submit', handleEditStudentFormSubmit);
  } else {
    console.warn('[WARN] studentEditForm not found in DOM');
  }

  const closeEditStudentModalBtn = document.getElementById('closeEditStudentModal');
  if(closeEditStudentModalBtn) {
    closeEditStudentModalBtn.removeEventListener('click', closeEditStudentModal);
    closeEditStudentModalBtn.addEventListener('click', closeEditStudentModal);
  }

  const cancelEditStudentBtn = document.getElementById('cancelEditStudentBtn');
  if(cancelEditStudentBtn) {
    cancelEditStudentBtn.removeEventListener('click', closeEditStudentModal);
    cancelEditStudentBtn.addEventListener('click', closeEditStudentModal);
  }

  // Close modal when clicking outside of it
  window.removeEventListener('click', handleEditStudentOutsideClick);
  window.addEventListener('click', handleEditStudentOutsideClick);

  // Only use showSection if on multi-section page (portal.html)
  // Don't call showSection on standalone pages like manage.html
  if(document.getElementById('section-home')) {
    showSection('home');
  }
});

function handleEditStudentOutsideClick(e) {
  const modal = document.getElementById('editStudentModal');
  if(e.target === modal) {
    closeEditStudentModal();
  }
}
