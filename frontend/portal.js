/* ===========================
   STUDENT DATA (PERSISTENT)
=========================== */

let students = JSON.parse(localStorage.getItem("students")) || [];
let editIndex = -1;


/* ===========================
   SAVE TO STORAGE
=========================== */

function persist(){
    localStorage.setItem("students", JSON.stringify(students));
    loadSections();   // refresh attendance dropdown
}


/* ===========================
   MANAGE STUDENTS (CRUD)
=========================== */

function saveStudent(){
    const name = document.getElementById("name").value;
    const course = document.getElementById("course").value;
    const section = document.getElementById("section").value;
    const btn = document.getElementById("studentBtn");

    if(!name || !course || !section){
        alert("Fill all fields");
        return;
    }

    if(editIndex === -1){
        // ADD STUDENT
        students.push({
            name,
            course,
            section,
            status: "Absent"
        });
    } else {
        // UPDATE STUDENT
        students[editIndex].name = name;
        students[editIndex].course = course;
        students[editIndex].section = section;

        editIndex = -1;
        btn.textContent = "Add Student";
    }

    persist();
    renderStudents();
    clearForm();
}

function renderStudents(){
    const list = document.getElementById("studentList");
    if(!list) return;

    list.innerHTML = "";

    students.forEach((s,i)=>{
        list.innerHTML += `
        <tr>
            <td>${i+1}</td>
            <td>${s.name}</td>
            <td>${s.course}</td>
            <td>${s.section}</td>
            <td>
                <button onclick="editStudent(${i})">Edit</button>
                <button onclick="deleteStudent(${i})">Delete</button>
            </td>
        </tr>
        `;
    });
}

function editStudent(i){
    document.getElementById("name").value = students[i].name;
    document.getElementById("course").value = students[i].course;
    document.getElementById("section").value = students[i].section;

    editIndex = i;
    document.getElementById("studentBtn").textContent = "Update Student";
}

function deleteStudent(i){
    if(confirm("Delete student?")){
        students.splice(i,1);
        persist();
        renderStudents();
    }
}

function clearForm(){
    document.getElementById("name").value = "";
    document.getElementById("course").value = "";
    document.getElementById("section").value = "";

    editIndex = -1;
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

    students.forEach((s,index)=>{
        if(s.section === sec){
            list.innerHTML += `
            <tr>
                <td>${index+1}</td>
                <td>${s.name}</td>
                <td>${s.course}</td>
                <td class="${s.status === "Present" ? "present" : "absent"}">
                    ${s.status}
                </td>
                <td>
                    <button onclick="toggleStatus(${index})">Toggle</button>
                </td>
            </tr>
            `;
        }
    });
}

function toggleStatus(index){
    students[index].status =
        students[index].status === "Present" ? "Absent" : "Present";

    // ONLY refresh table — NOT sections
    loadAttendance();
}



/* ===========================
   AUTO LOAD WHEN PAGE OPENS
=========================== */

renderStudents();
loadSections();
