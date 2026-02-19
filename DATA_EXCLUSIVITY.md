# Data Exclusivity Implementation

## Overview
This document describes the data exclusivity feature implemented in the Teacher Portal. Teachers now only see and manipulate data from students they created, while administrators have full access to all data.

## User Role Classification

### Teachers (isAdmin = 0)
- Can see and manipulate data from students they created
- Can view, create, update, and delete their own students
- Can record and view attendance only for their own students
- Can access attendance reports only for their own students
- **Cannot** access User Management functionality

### Administrators (isAdmin = 1)
- Can see and manipulate data from all students
- Can view all students
- Can view all attendance records
- Can access attendance reports for all students
- Can access User Management to view all users

### Main Administrator (isMain = 1)
- Has all admin privileges
- Can delete and edit other administrator accounts
- Cannot be edited or deleted by other administrators

## API Endpoints Changes

### Student Management

#### GET /api/students
**Before:** Returned all students regardless of user role
**After:** 
- **Teachers:** Returns only students where `createdBy = currentUserId`
- **Admins:** Returns all students

#### GET /api/students/:id
**Before:** Returned any student if they existed
**After:**
- **Teachers:** Returns student only if `createdBy = currentUserId`, otherwise returns 404
- **Admins:** Returns any student

#### PUT /api/students/:id
**Before:** Could update any student
**After:**
- **Teachers:** Can only update students where `createdBy = currentUserId`
- **Admins:** Can update any student
- Returns 404 with message "access denied" if teacher tries to update student they don't own

#### DELETE /api/students/:id
**Before:** Could delete any student
**After:**
- **Teachers:** Can only delete students where `createdBy = currentUserId`
- **Admins:** Can delete any student
- Returns 404 with message "access denied" if teacher tries to delete student they don't own

### Attendance Management

#### POST /api/attendance
**Before:** Could record attendance for any student
**After:**
- **Teachers:** Can only record attendance for students where `createdBy = currentUserId`
- **Admins:** Can record attendance for any student
- Returns 403 error with message "Access denied" if teacher tries to record attendance for student they don't own

#### GET /api/attendance/:date
**Before:** Returned all attendance records for a date
**After:**
- **Teachers:** Returns only attendance records for students where `createdBy = currentUserId`
- **Admins:** Returns all attendance records for the date
- Uses LEFT JOIN to filter by student ownership

### Reports

#### GET /api/reports/attendance (NEW)
This new endpoint provides attendance reports for date ranges:
- **Query Parameters:**
  - `startDate`: Starting date (YYYY-MM-DD format)
  - `endDate`: Ending date (YYYY-MM-DD format)
- **Teachers:** Returns attendance records only for students they created within the date range
- **Admins:** Returns all attendance records within the date range
- **Response:** Array of attendance records sorted by date (DESC) and student section/name

### User Management

#### GET /api/users
- **Teachers:** Cannot access (returns 403 Forbidden)
- **Admins:** Can see all users
- **Main Admin:** Can see all users

#### POST /api/users
- **Teachers:** Cannot access (returns 403 Forbidden)
- **Admins:** Can create new users
- **Main Admin:** Can create new users

#### PUT /api/users/:id
- **Teachers:** Cannot access (returns 403 Forbidden)
- **Admins:** Can edit users (except Main Admin)
- **Main Admin:** Can edit other admins (except self and other Main Admins)

#### DELETE /api/users/:id
- **Teachers:** Cannot access (returns 403 Forbidden)
- **Admins:** Cannot delete (returns 403 Forbidden - "Only the main administrator can delete users")
- **Main Admin:** Can delete other administrators (except self and other Main Admins)

## Database Schema

### Students Table
```sql
CREATE TABLE students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  contactNo TEXT NOT NULL,
  course TEXT NOT NULL,
  section TEXT NOT NULL,
  createdBy INTEGER,  -- FOREIGN KEY to admins.id (identifies which teacher/admin created this student)
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(createdBy) REFERENCES admins(id)
)
```

**Key Field:** `createdBy` - Used to determine ownership and control data visibility

### Attendance Table
```sql
CREATE TABLE attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  studentId INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'Absent',
  attendanceDate DATE NOT NULL,
  recordedBy INTEGER,  -- FOREIGN KEY to admins.id (identifies who recorded the attendance)
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(studentId) REFERENCES students(id),
  FOREIGN KEY(recordedBy) REFERENCES admins(id),
  UNIQUE(studentId, attendanceDate)
)
```

### Admins Table
```sql
CREATE TABLE admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fullName TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  isAdmin BOOLEAN DEFAULT 1,  -- 1 = administrator/teacher role, 0 would be regular user (not used currently)
  isMain INTEGER DEFAULT 0,   -- 1 = main administrator with special privileges
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

## Authorization Flow

### For Student Data Access:
1. Request arrives with Authorization token
2. `verifyToken` middleware extracts `adminId` from token
3. Query user's `isAdmin` flag from database
4. If `isAdmin = 1` (admin): Apply no filters to query
5. If `isAdmin = 0` (teacher): Filter results where `createdBy = adminId`

### For User Management Access:
1. Request arrives with Authorization token
2. Verify `isAdmin = 1` (must be admin)
3. For delete operations, additionally verify `isMain = 1` (must be main admin)

## Error Messages

### Access Denied Scenarios:
- **"Student not found or access denied"** - Teacher trying to access/modify student they didn't create
- **"Access denied: Student not found or does not belong to you"** - Teacher trying to record attendance for student they didn't create
- **"Forbidden"** - Teacher trying to access User Management (admins only)
- **"Only the main administrator can delete users"** - Non-main admin trying to delete a user

## Frontend Considerations

The frontend should:
1. Store user's `isAdmin` and `isMain` flags from login response
2. Hide/disable sections based on user role:
   - Hide "User Management" link for non-admins
   - Only show students created by current user (teachers only)
   - Show all students (admins only)
3. Handle 403/404 errors appropriately when attempting unauthorized data access
4. Use the new `/api/reports/attendance` endpoint for generating attendance reports

## Security Notes

1. **Token-based Authorization:** All endpoints verify the Authorization token and extract the user's ID
2. **Role-based Access Control:** Three levels of access (Teacher, Admin, Main Admin)
3. **Data Ownership:** Teachers' data is strictly limited to records they created (`createdBy` field)
4. **Main Admin Protection:** Main administrator account cannot be edited or deleted by other admins
5. **Database Constraints:** The `UNIQUE(studentId, attendanceDate)` constraint prevents duplicate attendance records

## Testing Recommendations

1. **Teacher Account:**
   - Create a teacher account (isAdmin = 0)
   - Create students and verify only those students appear in list
   - Create attendance records and verify they only affect own students
   - Attempt to access User Management (should fail with 403)
   - Attempt to access other teachers' students (should fail with 404)

2. **Admin Account:**
   - Create an admin account (isAdmin = 1, isMain = 0)
   - Verify all students appear in list
   - Verify access to User Management
   - Attempt to delete a user (should fail with message about main admin only)

3. **Main Admin Account:**
   - Verify all privileges
   - Test deleting/editing other admin accounts
   - Verify cannot delete self
   - Verify cannot delete other main admins (if more than one exists)
