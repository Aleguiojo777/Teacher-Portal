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
        }
    } catch(error) {
        console.error('[ERROR] Failed to load attendance:', error);
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
        list.innerHTML += `
        <tr>
            <td>${i+1}</td>
            <td>${s.firstName}</td>
            <td>${s.lastName}</td>
            <td>${s.contactNo}</td>
            <td>${s.course}</td>
            <td>${s.section}</td>
            <td>
                <button onclick="editStudent(${s.id})">Edit</button>
                <button onclick="deleteStudent(${s.id})">Delete</button>
            </td>
        </tr>
        `;
    });
}

function editStudent(id){
    const student = students.find(s => s.id === id);
    if(!student) return;

    document.getElementById("firstName").value = student.firstName;
    document.getElementById("lastName").value = student.lastName;
    document.getElementById("contactNo").value = student.contactNo;
    document.getElementById("course").value = student.course;
    document.getElementById("section").value = student.section;

    editingId = id;
    document.getElementById("studentBtn").textContent = "Update Student";
}

async function deleteStudent(id){
    if(confirm("Delete this student?")){
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/students/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + token }
            });

            if(response.ok){
                alert('Student deleted successfully!');
                loadStudents();
            } else {
                const error = await response.json();
                alert('Error: ' + error.error);
            }
        } catch(error){
            console.error('Error deleting student:', error);
            alert('Error deleting student');
        }
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
loadStudents();

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

// Wire nav links
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const sec = link.dataset.section || 'home';
        showSection(sec);
    });
});

// Default to home
showSection('home');
