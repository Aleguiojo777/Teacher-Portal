/* ===========================
   STUDENT DATA (FROM API)
=========================== */

let students = [];
let sections = [];
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

  // ensure an overlay exists to capture outside clicks on mobile
  let overlay = document.getElementById('sidebarOverlay');
  if(!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'sidebarOverlay';
    document.body.appendChild(overlay);
  }

  function closeSidebar() {
    if(sidebar) sidebar.classList.remove('show');
    if(overlay) overlay.classList.remove('show');
    if(sidebarToggle) sidebarToggle.setAttribute('aria-expanded', 'false');
  }

  function openSidebar() {
    if(sidebar) sidebar.classList.add('show');
    if(overlay) overlay.classList.add('show');
    if(sidebarToggle) sidebarToggle.setAttribute('aria-expanded', 'true');
  }

  if(sidebarToggle && sidebar) {
    sidebarToggle.setAttribute('aria-controls', 'sidebar');
    sidebarToggle.setAttribute('aria-expanded', 'false');

    sidebarToggle.addEventListener('click', function(e) {
      e.stopPropagation();
      if(sidebar.classList.contains('show')) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });

    // Close sidebar when clicking a link (mobile only)
    sidebar.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', function() {
        if(window.innerWidth <= 900) {
          closeSidebar();
        }
      });
    });

    // Close when overlay clicked
    overlay.addEventListener('click', function() { closeSidebar(); });

    // Escape key closes sidebar
    document.addEventListener('keydown', function(e) {
      if(e.key === 'Escape') closeSidebar();
    });
  }
});

// Remove stray single-character text nodes containing only "(" which
// sometimes appear due to previous edits or accidental paste. This is
// defensive — it only removes text nodes whose trimmed content is exactly "(".
document.addEventListener('DOMContentLoaded', function() {
  try {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    const remove = [];
    let node;
    while(node = walker.nextNode()) {
      if(node && node.nodeValue && node.nodeValue.trim() === '(') {
        remove.push(node);
      }
    }
    remove.forEach(n => n.parentNode && n.parentNode.removeChild(n));
    if(remove.length) console.debug('[CLEANUP] Removed', remove.length, 'stray "(" text nodes');
  } catch(e) {
    console.error('[CLEANUP] Failed to remove stray parentheses:', e);
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
            
            // Load attendance for selected date (Home date picker) or today by default
            const dateInput = document.getElementById('homeReportDate');
            const dateToLoad = dateInput && dateInput.value ? dateInput.value : new Date().toISOString().split('T')[0];
            await loadAttendanceForDate(dateToLoad);
            renderStudents();
            loadSections();
        }
    } catch(error){
        console.error('Error loading students:', error);
        alert('Error loading students');
    }
}

// Load attendance for a specific date (format: YYYY-MM-DD)
async function loadAttendanceForDate(dateStr){
  try {
    const token = localStorage.getItem('token');
    const date = dateStr || new Date().toISOString().split('T')[0];
    const response = await fetch(`${API_BASE}/attendance/${date}`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });

    if(response.ok) {
      const attendanceRecords = await response.json();
      console.log('[DEBUG] Attendance records loaded for', date, attendanceRecords);

      // Update student statuses from attendance records
      attendanceRecords.forEach(record => {
        const student = students.find(s => s.id === record.studentId);
        if(student) {
          student.status = record.status;
          // Preserve the timestamp when this status was recorded
          student.markedAt = record.createdAt || record.updatedAt || record.timestamp || null;
          console.log('[DEBUG] Updated student', student.id, 'to status:', record.status, 'at', student.markedAt);
        }
      });

      // Update home page statistics
      updateHomeStatistics(attendanceRecords);
    } else {
      // If no records or error, clear statuses for students
      students.forEach(s => { s.status = s.status || 'Absent'; s.markedAt = null; });
      updateHomeStatistics([]);
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
        
        // Update UI - only when the home statistics elements exist (some pages don't include them)
        const presentEl = document.getElementById("presentCount");
        const presentPctEl = document.getElementById("presentPercentage");
        const absentEl = document.getElementById("absentCount");
        const absentPctEl = document.getElementById("absentPercentage");
        const lateEl = document.getElementById("lateCount");
        const latePctEl = document.getElementById("latePercentage");
        const totalEl = document.getElementById("totalCount");
        const totalPctEl = document.getElementById("totalPercentage");

        // If none of the expected elements exist, skip updating the DOM.
        if(!(presentEl || presentPctEl || absentEl || absentPctEl || lateEl || latePctEl || totalEl || totalPctEl)) {
          console.debug('[DEBUG] Home stats elements not present on this page; skipping DOM update');
          return;
        }

        if(presentEl) presentEl.textContent = presentCount;
        if(presentPctEl) presentPctEl.textContent = presentPct + "%";
        if(absentEl) absentEl.textContent = absentCount;
        if(absentPctEl) absentPctEl.textContent = absentPct + "%";
        if(lateEl) lateEl.textContent = lateCount;
        if(latePctEl) latePctEl.textContent = latePct + "%";
        if(totalEl) totalEl.textContent = total;
        if(totalPctEl) totalPctEl.textContent = "100%";
        
        console.log('[DEBUG] Home stats updated - Present:', presentCount, 'Late:', lateCount, 'Absent:', absentCount);
    } catch(error) {
        console.error('[ERROR] Failed to update home statistics:', error);
    }
}

// Handle home date picker changes
function handleHomeDateChange(e){
  const d = e.target.value;
  loadAttendanceForDate(d).then(()=>{
    renderStudents();
  });
}


/* ===========================
   MANAGE STUDENTS (CRUD)
=========================== */

// Normalize various common time inputs to "hh:mm AM/PM"
function normalizeTime(input) {
  if (!input || String(input).trim() === '') return null;
  const s = String(input).trim();

  // 1) Explicit AM/PM with or without colon: "9am", "9:00am", "09:00 AM"
  const ampmRegex = /^\s*(\d{1,2})(?::([0-5]\d))?\s*([AaPp][Mm])\s*$/;
  let m = s.match(ampmRegex);
  if (m) {
    let h = parseInt(m[1], 10);
    const mm = m[2] ? m[2] : '00';
    if (h < 1 || h > 12) return null;
    const period = m[3].toUpperCase();
    const hh = (h < 10 ? '0' + h : String(h));
    return `${hh}:${mm} ${period}`;
  }

  // 2) 24-hour or plain hh:mm -> convert to 12-hour with AM/PM
  const hmRegex = /^\s*(\d{1,2}):(\d{2})\s*$/;
  m = s.match(hmRegex);
  if (m) {
    let h = parseInt(m[1], 10);
    const mm = m[2];
    if (h < 0 || h > 23) return null;
    const period = h >= 12 ? 'PM' : 'AM';
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;
    const hh = (h12 < 10 ? '0' + h12 : String(h12));
    return `${hh}:${mm} ${period}`;
  }

  // 3) Bare hour like "9" -> assume on-the-hour, treat as 24-hour hour then convert
  const hOnly = /^\s*(\d{1,2})\s*$/;
  m = s.match(hOnly);
  if (m) {
    let h = parseInt(m[1], 10);
    if (h < 0 || h > 23) return null;
    const period = h >= 12 ? 'PM' : 'AM';
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;
    const hh = (h12 < 10 ? '0' + h12 : String(h12));
    return `${hh}:00 ${period}`;
  }

  return null;
}


async function saveStudent(){
    const firstName = document.getElementById("firstName").value;
    const lastName = document.getElementById("lastName").value;
    const contactNo = document.getElementById("contactNo").value;
    const course = document.getElementById("course").value;
    const section = document.getElementById("section").value;
    const startTime = document.getElementById("startTime").value;
    const endTime = document.getElementById("endTime").value;
    const btn = document.getElementById("studentBtn");

  if(!firstName || !lastName || !contactNo || !course || !section || !startTime || !endTime){
        alert("Fill all fields");
        return;
    }
  // Normalize and validate times (accept common inputs like "9:00", "9am", "13:00")
  const normalizedStart = normalizeTime(startTime);
  const normalizedEnd = normalizeTime(endTime);
  if(!normalizedStart || !normalizedEnd){
    alert('Start and End times must be in format hh:mm AM or hh:mm PM (e.g. 09:00 AM)');
    return;
  }

  // write normalized values back to inputs so users see the canonical format
  document.getElementById('startTime').value = normalizedStart;
  document.getElementById('endTime').value = normalizedEnd;

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
                  section,
                  startTime: normalizedStart,
                  endTime: normalizedEnd
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
                  section,
                  startTime,
                  endTime
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
      // Keep columns consistent with the table header: index, first, last, contact, course, section, registered(createdAt), action
      row.innerHTML = `
        <td>${i+1}</td>
        <td>${s.firstName}</td>
        <td>${s.lastName}</td>
        <td>${s.contactNo}</td>
        <td>${s.course}</td>
        <td>${s.section}</td>
        <td>${s.startTime || ''}</td>
        <td>${s.endTime || ''}</td>
        <td>${formatDateTime(s.createdAt)}</td>
        <td>
            <button class="edit-user" data-id="${s.id}">Edit</button>
          <button class="delete-user" data-id="${s.id}">Delete</button>
        </td>
      `;
      list.appendChild(row);

      // Attach direct handlers to buttons to avoid delegation/order issues
      const editBtn = row.querySelector('.edit-user');
      if(editBtn){
        editBtn.addEventListener('click', (ev) => { ev.preventDefault(); openEditStudentModal(s); });
      }
      const delBtn = row.querySelector('.delete-user');
      if(delBtn){
        delBtn.addEventListener('click', (ev) => { ev.preventDefault(); handleStudentAction({ target: delBtn }); });
      }
    });

    // Use event delegation for edit and delete buttons
    const studentList = document.getElementById('studentList');
    studentList.removeEventListener('click', handleStudentAction);
    studentList.addEventListener('click', handleStudentAction);
}

// Handle student action (edit or delete)
async function handleStudentAction(e) {
  // Support both legacy classes and the newer button classes
  if(e.target.classList.contains('edit-student') || e.target.classList.contains('edit-user')) {
    const id = e.target.dataset.id;
    const studentData = students.find(s => String(s.id) === String(id));
    if(studentData) openEditStudentModal(studentData);
  } else if(e.target.classList.contains('delete-student') || e.target.classList.contains('delete-user')) {
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
  document.getElementById('editStudentStartTime').value = studentData.startTime || '';
  document.getElementById('editStudentEndTime').value = studentData.endTime || '';
  document.getElementById('editStudentMessage').textContent = '';
  
  // Find and select the matching section in the dropdown
  const editSectionDropdown = document.getElementById('editSectionDropdown');
  if(editSectionDropdown && studentData.course && studentData.section) {
    const matchingSection = sections.find(s => s.course === studentData.course && s.sectionName === studentData.section);
    if(matchingSection) {
      editSectionDropdown.value = matchingSection.id;
    }
  }
  
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
  const startTime = document.getElementById('editStudentStartTime').value.trim();
  const endTime = document.getElementById('editStudentEndTime').value.trim();
  const token = localStorage.getItem('token');

  if(!token) {
    setEditStudentMessage('Unauthorized: Please login', 'error');
    return;
  }
  if(!firstName || !lastName || !contactNo || !course || !section || !startTime || !endTime) {
    setEditStudentMessage('All fields are required', 'error');
    return;
  }

  // Normalize times for edit form
  const normalizedStart = normalizeTime(startTime);
  const normalizedEnd = normalizeTime(endTime);
  if(!normalizedStart || !normalizedEnd){
    setEditStudentMessage('Start and End times must be in format hh:mm AM/PM', 'error');
    return;
  }

  // update inputs to canonical form so user sees normalized value
  document.getElementById('editStudentStartTime').value = normalizedStart;
  document.getElementById('editStudentEndTime').value = normalizedEnd;

  submitEditStudentForm(firstName, lastName, contactNo, course, section, token, currentEditingStudentId, normalizedStart, normalizedEnd);
}

async function submitEditStudentForm(firstName, lastName, contactNo, course, section, token, studentId) {
  try {
    setEditStudentMessage('Updating student...', 'loading');
    
    const startTime = document.getElementById('editStudentStartTime').value.trim();
    const endTime = document.getElementById('editStudentEndTime').value.trim();
    const body = { firstName, lastName, contactNo, course, section, startTime, endTime };

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
  document.getElementById("startTime").value = "";
  document.getElementById("endTime").value = "";

    editingId = null;
    document.getElementById("studentBtn").textContent = "Add Student";
}


/* ===========================
   ATTENDANCE SYSTEM
=========================== */

function loadSections(){
    const token = localStorage.getItem('token');
    
    fetch(`${API_BASE}/sections`, {
        headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(r => r.json())
    .then(data => {
        sections = data || [];
        populateSectionDropdowns();
    })
    .catch(e => console.error('Error loading sections:', e));
}

function populateSectionDropdowns(){
    const selects = [
        document.getElementById('sectionDropdown'),
        document.getElementById('editSectionDropdown'),
        document.getElementById('attendanceSection')
    ];

    selects.forEach(select => {
        if(!select) return;
        
        const selectedValue = select.value;
        select.innerHTML = `<option value="">Select Section</option>`;
        
        sections.forEach(sec => {
            const opt = document.createElement('option');
            // Use sectionName as value since students are stored with section name
            opt.value = sec.sectionName;
            opt.textContent = `${sec.sectionName} - ${sec.course} (${sec.scheduleDay})`;
            opt.dataset.sectionId = sec.id;
            opt.dataset.course = sec.course;
            opt.dataset.sectionName = sec.sectionName;
            opt.dataset.subject = sec.subject;
            opt.dataset.scheduleTime = sec.scheduleTime;
            select.appendChild(opt);
        });
        
        // Restore previous selection or select the first section
        if(selectedValue) {
            select.value = selectedValue;
        } else if(sections.length > 0) {
            // Auto-select first section if none was previously selected
            select.value = sections[0].sectionName;
        }
        
        // Trigger change event to populate dependent fields
        select.dispatchEvent(new Event('change'));
    });

    // After populating, call loadAttendance if on attendance page
    const attendanceSelect = document.getElementById('attendanceSection');
    if(attendanceSelect && attendanceSelect.value) {
        loadAttendance();
    }

    // Add change event listeners
    const mainSectionDropdown = document.getElementById('sectionDropdown');
    const editSectionDropdown = document.getElementById('editSectionDropdown');
    
    if(mainSectionDropdown) {
        mainSectionDropdown.addEventListener('change', () => {
            fillStudentDetailsFromSection('sectionDropdown');
        });
    }
    
    if(editSectionDropdown) {
        editSectionDropdown.addEventListener('change', () => {
            fillStudentDetailsFromSection('editSectionDropdown');
        });
    }
}

function fillStudentDetailsFromSection(dropdownId){
    const dropdown = document.getElementById(dropdownId);
    if(!dropdown || !dropdown.value) return;

    const selectedOption = dropdown.options[dropdown.selectedIndex];
    const course = selectedOption.dataset.course;
    const sectionName = selectedOption.dataset.sectionName;
    const subject = selectedOption.dataset.subject;
    const scheduleTime = selectedOption.dataset.scheduleTime;
    
    // Parse schedule time into start and end times
    // Expected format: "09:00 AM - 10:30 AM" or "09:00-10:30"
    let startTime = '', endTime = '';
    if(scheduleTime) {
        const parts = scheduleTime.split('-').map(p => p.trim());
        if(parts.length === 2) {
            startTime = parts[0];
            endTime = parts[1];
        }
    }

    if(dropdownId === 'sectionDropdown') {
        document.getElementById('course').value = course;
        document.getElementById('section').value = sectionName;
        document.getElementById('subject').value = subject;
        document.getElementById('startTime').value = startTime;
        document.getElementById('endTime').value = endTime;
    } else if(dropdownId === 'editSectionDropdown') {
        document.getElementById('editStudentCourse').value = course;
        document.getElementById('editStudentSection').value = sectionName;
        document.getElementById('editStudentSubject').value = subject;
        document.getElementById('editStudentStartTime').value = startTime;
        document.getElementById('editStudentEndTime').value = endTime;
    }
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

  // Determine if editing is allowed (only for today's date)
  const homeDateEl = document.getElementById('homeReportDate');
  const selectedDate = homeDateEl && homeDateEl.value ? homeDateEl.value : new Date().toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];
  const allowEdit = selectedDate === today;

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
              <td>
                <span class="status-badge ${statusClass}">${s.status || "Absent"}</span>
              </td>
              <td>${s.markedAt ? formatDateTime(s.markedAt) : ''}</td>
              <td>
                ${allowEdit ? `<button class="btn-present" onclick="setStatus(${s.id}, 'Present')">Present</button>
                <button class="btn-late" onclick="setStatus(${s.id}, 'Late')">Late</button>
                <button class="btn-absent" onclick="setStatus(${s.id}, 'Absent')">Absent</button>` : '<em>Read-only</em>'}
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
    const manageSectionsNav = document.getElementById('manageSectionsNav');
    const manageSectionCard = document.getElementById('manageSectionCard');
    const welcomeTitle = document.getElementById('welcomeTitle');
    const welcomeText = document.getElementById('welcomeText');
    const logoutNav = document.getElementById('logoutNav');
    const logoutLink = document.getElementById('logoutLink');

    if(storedAdmin){
        const role = Number(storedAdmin.isAdmin) === 1 ? 'Administrator' : 'Teacher';
        if(welcomeTitle) welcomeTitle.textContent = `Welcome ${storedAdmin.fullName || '' } 👋`;
        if(welcomeText) welcomeText.textContent = `Signed in as ${role}`;
        const isAdmin = Number(storedAdmin.isAdmin) === 1;
        
        // Show/hide admin-only features
        if(userMgmtNav) {
            if(isAdmin) {
                userMgmtNav.classList.remove('hidden');
            } else {
                userMgmtNav.classList.add('hidden');
            }
        }
        
        if(manageSectionsNav) {
            if(isAdmin) {
                manageSectionsNav.classList.remove('hidden');
            } else {
                manageSectionsNav.classList.add('hidden');
            }
        }

        if(manageSectionCard) {
            if(isAdmin) {
                manageSectionCard.classList.add('visible');
            } else {
                manageSectionCard.classList.remove('visible');
            }
        }
        
        if(logoutNav) logoutNav.classList.remove('hidden');
        if(logoutLink) {
            logoutLink.addEventListener('click', (e) => { e.preventDefault(); logout(); });
        }
    } else {
        if(welcomeTitle) welcomeTitle.textContent = 'Welcome';
        if(welcomeText) welcomeText.textContent = 'Please login.';
        if(userMgmtNav) userMgmtNav.classList.add('hidden');
        if(manageSectionsNav) manageSectionsNav.classList.add('hidden');
        if(manageSectionCard) manageSectionCard.classList.remove('visible');
        if(logoutNav) logoutNav.classList.add('hidden');
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
        if(s === name) {
            el.classList.remove('hidden-section');
            el.style.display = '';
        } else {
            el.classList.add('hidden-section');
            el.style.display = 'none';
        }
    });

    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        if(link.dataset.section === name) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
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

  // Wire nav links - use event delegation for reliability
  const sidebar = document.getElementById('sidebar');
  if(sidebar) {
    sidebar.addEventListener('click', (e) => {
      if(e.target.classList.contains('nav-link')) {
        // Only prevent default if this is an internal section navigation (has data-section)
        if(e.target.dataset.section) {
          e.preventDefault();
          e.stopPropagation();
          const sec = e.target.dataset.section || 'home';
          showSection(sec);
        }
        // Otherwise let the link navigate normally (for external page links like section-management.html)
      }
    });
  }
  
  // Also attach direct listeners to all nav-links for backwards compatibility
  document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
          // Only handle internal section navigation (must have data-section attribute)
          if(link.dataset.section) {
              e.preventDefault();
              e.stopPropagation();
              const sec = link.dataset.section || 'home';
              showSection(sec);
          }
          // Otherwise let the link navigate normally
      });
  });

  // Setup student edit form event listeners
  const studentEditForm = document.getElementById('studentEditForm');
  if(studentEditForm) {
    studentEditForm.removeEventListener('submit', handleEditStudentFormSubmit);
    studentEditForm.addEventListener('submit', handleEditStudentFormSubmit);
  } else {
    // Not all pages include the student edit form (e.g., section-management.html).
    // Use debug-level logging to avoid noisy warnings in the console.
    console.debug('[DEBUG] studentEditForm not present on this page');
  }

  // Setup home date picker to default to today and listen for changes
  const homeDate = document.getElementById('homeReportDate');
  if(homeDate){
    const today = new Date().toISOString().split('T')[0];
    if(!homeDate.value) homeDate.value = today;
    homeDate.removeEventListener('change', handleHomeDateChange);
    homeDate.addEventListener('change', handleHomeDateChange);
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

// Ensure critical student edit handlers are attached even if the
// script is loaded after DOMContentLoaded (some pages load scripts
// in different orders). This makes the edit modal reliably open.
(function ensureStudentHandlers(){
  const attach = () => {
    const studentEditForm = document.getElementById('studentEditForm');
    if(studentEditForm) {
      studentEditForm.removeEventListener('submit', handleEditStudentFormSubmit);
      studentEditForm.addEventListener('submit', handleEditStudentFormSubmit);
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

    // Global outside click handler
    window.removeEventListener('click', handleEditStudentOutsideClick);
    window.addEventListener('click', handleEditStudentOutsideClick);

    // Ensure the student list has the delegated click handler
    const studentList = document.getElementById('studentList');
    if(studentList) {
      studentList.removeEventListener('click', handleStudentAction);
      studentList.addEventListener('click', handleStudentAction);
    }

    // Load students on pages that show the manage list if not loaded yet
    if(document.getElementById('studentList') && (!students || students.length === 0)){
      loadStudents();
    }
  };

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach);
  else attach();
})();
