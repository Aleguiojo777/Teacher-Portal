/* ===========================
   STUDENT DATA (FROM API)
=========================== */

let students = [];
let editingId = null;
const API_BASE = 'http://localhost:3000/api';

/* ===========================
   LOAD STUDENTS FROM API
=========================== */

async function loadStudents(){
    try {
        const response = await fetch(`${API_BASE}/students`);
        if(response.ok){
            students = await response.json();
            renderStudents();
            loadSections();
        }
    } catch(error){
        console.error('Error loading students:', error);
        alert('Error loading students');
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
            response = await fetch(`${API_BASE}/students`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
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
            response = await fetch(`${API_BASE}/students/${editingId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
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
            const response = await fetch(`${API_BASE}/students/${id}`, {
                method: 'DELETE'
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

    if(!sec){
        list.innerHTML = "";
        return;
    }

    list.innerHTML = "";

    students.forEach((s, index)=>{
        if(s.section === sec){
            const fullName = `${s.firstName} ${s.lastName}`;
            list.innerHTML += `
            <tr>
                <td>${index+1}</td>
                <td>${fullName}</td>
                <td>${s.course}</td>
                <td class="${s.status === "Present" ? "present" : "absent"}">
                    ${s.status || "Absent"}
                </td>
                <td>
                    <button onclick="toggleStatus(${s.id})">Toggle</button>
                </td>
            </tr>
            `;
        }
    });
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

loadStudents();
