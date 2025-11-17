# INGENZI HRMS - Setup Guide

## ✅ What's Been Implemented

### 1. **Authentication System**
- ✅ Login page with working authentication (`src/html/pages/login.html`)
- ✅ Session management using localStorage
- ✅ Route protection (redirects to login if not authenticated)
- ✅ Logout functionality
- ✅ Role-based access control

### 2. **Dashboard**
- ✅ Main dashboard page (`src/html/dashboard/index.html`)
- ✅ Statistics cards (Employees, Departments, Leaves, Recruitments)
- ✅ Quick action cards
- ✅ Recent activity feed

### 3. **Navigation Menu**
- ✅ Complete HRMS navigation structure
- ✅ All modules accessible from sidebar
- ✅ Role-based menu visibility (System Admin menu hidden for non-admins)

### 4. **HRMS Modules (Placeholder Pages)**
All pages are created and ready for functionality implementation:

- ✅ **Employee Management** (`src/html/hrms/employees.html`)
- ✅ **Departments** (`src/html/hrms/departments.html`)
- ✅ **Attendance** (`src/html/hrms/attendance.html`)
- ✅ **Leave Management** (`src/html/hrms/leave.html`)
- ✅ **Payroll** (`src/html/hrms/payroll.html`)
- ✅ **Recruitment** (`src/html/hrms/recruitment.html`)
- ✅ **Reports** (`src/html/hrms/reports.html`)
- ✅ **User Accounts** (`src/html/hrms/users.html`) - Admin only
- ✅ **Backup & Restore** (`src/html/hrms/backup.html`) - Admin only
- ✅ **Security Settings** (`src/html/hrms/security.html`) - Admin only

## 🚀 How to Use

### 1. Start the Development Server
```bash
npm start
```

This will:
- Build the project
- Start BrowserSync
- Open the app in your browser

### 2. Login Credentials

**Employee:**
- Email: `employee@ingenzi.com`
- Password: `employee123`

**HR Manager:**
- Email: `hr@ingenzi.com`
- Password: `hr123`

**System Administrator:**
- Email: `admin@ingenzi.com`
- Password: `admin123`

### 3. Access Points

- **Login Page:** `http://localhost:3000/pages/login.html`
- **Dashboard:** `http://localhost:3000/dashboard/index.html` (requires login)

## 📁 File Structure

```
src/
├── assets/
│   └── js/
│       └── auth.js          # Authentication logic
├── html/
│   ├── pages/
│   │   └── login.html       # Login page
│   ├── dashboard/
│   │   └── index.html       # Main dashboard
│   ├── hrms/                # All HRMS module pages
│   │   ├── employees.html
│   │   ├── departments.html
│   │   ├── attendance.html
│   │   ├── leave.html
│   │   ├── payroll.html
│   │   ├── recruitment.html
│   │   ├── reports.html
│   │   ├── users.html
│   │   ├── backup.html
│   │   └── security.html
│   └── layouts/
│       ├── menu-list.html   # Navigation menu
│       └── header-content.html  # Header with user info
```

## 🔐 Authentication Features

### Session Management
- Uses `localStorage` to store user session
- Automatically redirects to login if not authenticated
- Session persists across page refreshes

### Role-Based Access
- **Employee:** Can view own data, apply for leave, view payslip
- **HR Manager:** Full HR operations access
- **System Admin:** System-level administration only

### Logout
- Click logout button in header dropdown
- Clears session and redirects to login

## 🎯 Next Steps

1. **Connect to Backend API**
   - Replace demo authentication with real API calls
   - Implement CRUD operations for each module

2. **Add Functionality**
   - Employee CRUD operations
   - Leave approval workflow
   - Payroll calculation
   - Attendance tracking
   - Recruitment workflow

3. **Enhance UI**
   - Add data tables with sorting/filtering
   - Add forms for creating/editing records
   - Add modals for quick actions
   - Add charts and graphs for analytics

4. **Add Validation**
   - Form validation
   - Input sanitization
   - Error handling

## 📝 Notes

- All authentication is currently client-side (localStorage)
- For production, implement server-side authentication
- All module pages are placeholders ready for functionality
- Navigation is fully functional
- User profile updates automatically in header

## 🐛 Troubleshooting

**Login not working?**
- Check browser console for errors
- Ensure `auth.js` is loaded
- Clear browser localStorage and try again

**Pages not loading?**
- Run `npm start` to build the project
- Check that all files are in the correct directories
- Verify paths in HTML files

**Navigation not working?**
- Ensure `script.js` is loaded
- Check that menu structure is correct
- Verify Feather icons are loaded


