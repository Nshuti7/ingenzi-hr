/**
 * INGENZI HRMS - Database Module
 * Uses localStorage as the database
 */

const DB = {
  // Initialize database with default data
  init: function() {
    if (!localStorage.getItem('hrms_initialized')) {
      this.seedData();
      localStorage.setItem('hrms_initialized', 'true');
    }
  },

  // Seed initial data
  seedData: function() {
    // Departments
    const departments = [
      { id: 1, name: 'IT Department', description: 'Information Technology', status: 'active', createdAt: new Date().toISOString() },
      { id: 2, name: 'HR Department', description: 'Human Resources', status: 'active', createdAt: new Date().toISOString() },
      { id: 3, name: 'Finance Department', description: 'Finance & Accounting', status: 'active', createdAt: new Date().toISOString() },
      { id: 4, name: 'Marketing Department', description: 'Marketing & Sales', status: 'active', createdAt: new Date().toISOString() },
      { id: 5, name: 'Operations Department', description: 'Operations', status: 'active', createdAt: new Date().toISOString() }
    ];
    localStorage.setItem('hrms_departments', JSON.stringify(departments));

    // Employees
    const employees = [
      {
        id: 1,
        employeeId: 'EMP001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@ingenzi.com',
        phone: '+1234567890',
        departmentId: 1,
        position: 'Software Developer',
        salary: 5000,
        hireDate: '2023-01-15',
        status: 'active',
        address: '123 Main St, City, Country',
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        employeeId: 'EMP002',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@ingenzi.com',
        phone: '+1234567891',
        departmentId: 2,
        position: 'HR Manager',
        salary: 6000,
        hireDate: '2022-06-01',
        status: 'active',
        address: '456 Oak Ave, City, Country',
        createdAt: new Date().toISOString()
      },
      {
        id: 3,
        employeeId: 'EMP003',
        firstName: 'Mike',
        lastName: 'Johnson',
        email: 'mike.johnson@ingenzi.com',
        phone: '+1234567892',
        departmentId: 3,
        position: 'Finance Manager',
        salary: 5500,
        hireDate: '2023-03-10',
        status: 'active',
        address: '789 Pine Rd, City, Country',
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem('hrms_employees', JSON.stringify(employees));

    // Leave Types
    const leaveTypes = [
      { id: 1, name: 'Annual Leave', days: 20, description: 'Annual vacation leave' },
      { id: 2, name: 'Sick Leave', days: 10, description: 'Medical leave' },
      { id: 3, name: 'Personal Leave', days: 5, description: 'Personal time off' },
      { id: 4, name: 'Maternity Leave', days: 90, description: 'Maternity leave' },
      { id: 5, name: 'Paternity Leave', days: 14, description: 'Paternity leave' }
    ];
    localStorage.setItem('hrms_leave_types', JSON.stringify(leaveTypes));

    // Leave Requests
    const leaveRequests = [
      {
        id: 1,
        employeeId: 1,
        leaveTypeId: 1,
        startDate: '2024-02-01',
        endDate: '2024-02-05',
        days: 5,
        reason: 'Family vacation',
        status: 'pending',
        appliedDate: new Date().toISOString(),
        approvedBy: null,
        approvedDate: null
      }
    ];
    localStorage.setItem('hrms_leave_requests', JSON.stringify(leaveRequests));

    // Attendance
    const attendance = [
      {
        id: 1,
        employeeId: 1,
        date: new Date().toISOString().split('T')[0],
        timeIn: '09:00',
        timeOut: '18:00',
        hours: 9,
        status: 'present',
        notes: ''
      }
    ];
    localStorage.setItem('hrms_attendance', JSON.stringify(attendance));

    // Payroll
    const payroll = [];
    localStorage.setItem('hrms_payroll', JSON.stringify(payroll));

    // Job Vacancies
    const jobVacancies = [
      {
        id: 1,
        title: 'Senior Software Developer',
        departmentId: 1,
        description: 'We are looking for an experienced software developer...',
        requirements: '5+ years experience, JavaScript, React, Node.js',
        openingDate: '2024-01-01',
        closingDate: '2024-02-01',
        status: 'open',
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem('hrms_job_vacancies', JSON.stringify(jobVacancies));

    // Applicants
    const applicants = [];
    localStorage.setItem('hrms_applicants', JSON.stringify(applicants));
  },

  // Generic CRUD operations
  getAll: function(table) {
    const data = localStorage.getItem(`hrms_${table}`);
    return data ? JSON.parse(data) : [];
  },

  getById: function(table, id) {
    const items = this.getAll(table);
    return items.find(item => item.id === parseInt(id));
  },

  create: function(table, item) {
    const items = this.getAll(table);
    const newId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
    const newItem = {
      ...item,
      id: newId,
      createdAt: new Date().toISOString()
    };
    items.push(newItem);
    localStorage.setItem(`hrms_${table}`, JSON.stringify(items));
    return newItem;
  },

  update: function(table, id, updates) {
    const items = this.getAll(table);
    const index = items.findIndex(item => item.id === parseInt(id));
    if (index !== -1) {
      items[index] = {
        ...items[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(`hrms_${table}`, JSON.stringify(items));
      return items[index];
    }
    return null;
  },

  delete: function(table, id) {
    const items = this.getAll(table);
    const filtered = items.filter(item => item.id !== parseInt(id));
    localStorage.setItem(`hrms_${table}`, JSON.stringify(filtered));
    return true;
  },

  // Employee specific methods
  getEmployeesByDepartment: function(departmentId) {
    const employees = this.getAll('employees');
    return employees.filter(emp => emp.departmentId === parseInt(departmentId));
  },

  getEmployeeByEmail: function(email) {
    const employees = this.getAll('employees');
    return employees.find(emp => emp.email === email);
  },

  // Leave specific methods
  getLeaveRequestsByEmployee: function(employeeId) {
    const requests = this.getAll('leave_requests');
    return requests.filter(req => req.employeeId === parseInt(employeeId));
  },

  getPendingLeaveRequests: function() {
    const requests = this.getAll('leave_requests');
    return requests.filter(req => req.status === 'pending');
  },

  // Attendance specific methods
  getAttendanceByEmployee: function(employeeId, startDate, endDate) {
    let attendance = this.getAll('attendance');
    attendance = attendance.filter(att => att.employeeId === parseInt(employeeId));
    if (startDate) {
      attendance = attendance.filter(att => att.date >= startDate);
    }
    if (endDate) {
      attendance = attendance.filter(att => att.date <= endDate);
    }
    return attendance.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  // Payroll specific methods
  generatePayroll: function(employeeId, month, year) {
    const employee = this.getById('employees', employeeId);
    if (!employee) return null;

    const attendance = this.getAttendanceByEmployee(employeeId);
    const workingDays = attendance.filter(att => {
      const attDate = new Date(att.date);
      return attDate.getMonth() === month - 1 && attDate.getFullYear() === year;
    }).length;

    const basicSalary = employee.salary;
    const allowances = basicSalary * 0.1; // 10% allowances
    const deductions = basicSalary * 0.05; // 5% deductions
    const netSalary = basicSalary + allowances - deductions;

    const payrollEntry = {
      employeeId: employeeId,
      month: month,
      year: year,
      basicSalary: basicSalary,
      allowances: allowances,
      deductions: deductions,
      netSalary: netSalary,
      workingDays: workingDays,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    return this.create('payroll', payrollEntry);
  },

  // Backup and Restore
  backup: function() {
    const backup = {
      timestamp: new Date().toISOString(),
      departments: this.getAll('departments'),
      employees: this.getAll('employees'),
      leaveTypes: this.getAll('leave_types'),
      leaveRequests: this.getAll('leave_requests'),
      attendance: this.getAll('attendance'),
      payroll: this.getAll('payroll'),
      jobVacancies: this.getAll('job_vacancies'),
      applicants: this.getAll('applicants')
    };
    return JSON.stringify(backup);
  },

  restore: function(backupData) {
    try {
      const backup = JSON.parse(backupData);
      localStorage.setItem('hrms_departments', JSON.stringify(backup.departments || []));
      localStorage.setItem('hrms_employees', JSON.stringify(backup.employees || []));
      localStorage.setItem('hrms_leave_types', JSON.stringify(backup.leaveTypes || []));
      localStorage.setItem('hrms_leave_requests', JSON.stringify(backup.leaveRequests || []));
      localStorage.setItem('hrms_attendance', JSON.stringify(backup.attendance || []));
      localStorage.setItem('hrms_payroll', JSON.stringify(backup.payroll || []));
      localStorage.setItem('hrms_job_vacancies', JSON.stringify(backup.jobVacancies || []));
      localStorage.setItem('hrms_applicants', JSON.stringify(backup.applicants || []));
      return true;
    } catch (e) {
      console.error('Restore failed:', e);
      return false;
    }
  },

  // Clear all data
  clearAll: function() {
    localStorage.removeItem('hrms_departments');
    localStorage.removeItem('hrms_employees');
    localStorage.removeItem('hrms_leave_types');
    localStorage.removeItem('hrms_leave_requests');
    localStorage.removeItem('hrms_attendance');
    localStorage.removeItem('hrms_payroll');
    localStorage.removeItem('hrms_job_vacancies');
    localStorage.removeItem('hrms_applicants');
    localStorage.removeItem('hrms_initialized');
  }
};

// Initialize database on load
if (typeof window !== 'undefined') {
  DB.init();
}

