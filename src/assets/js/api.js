/**
 * INGENZI HRMS - API Service Module
 * Handles all API communication with the backend
 */

// Prevent duplicate loading
if (typeof window.API === 'undefined') {
  const API_BASE_URL = window.API_BASE_URL || 'http://localhost:5000/api';

  // API Service Class
  class APIService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('authToken');
  }

  // Get authentication token
  getToken() {
    return this.token || localStorage.getItem('authToken');
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  // Clear token
  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  // Make API request
  async request(endpoint, options = {}, requireAuth = true) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(requireAuth && token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      }
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      
      // Check if response is JSON
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // If not JSON, get text
        const text = await response.text();
        throw new Error(text || `HTTP error! status: ${response.status}`);
      }

      if (!response.ok) {
        // Handle 401 Unauthorized
        if (response.status === 401) {
          this.clearToken();
          // Don't redirect here - let the auth.js handle it to avoid loops
          // Only throw the error
          throw new Error(data.error || data.message || 'Invalid credentials. Please check your email and password.');
        }

        throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      // If it's already an Error object with a message, re-throw it
      if (error instanceof Error) {
        throw error;
      }
      // Otherwise, wrap it in an Error
      throw new Error(error.message || 'An unexpected error occurred. Please try again.');
    }
  }

  // GET request
  async get(endpoint, requireAuth = true) {
    return this.request(endpoint, { method: 'GET' }, requireAuth);
  }

  // POST request
  async post(endpoint, data, requireAuth = true) {
    return this.request(endpoint, { method: 'POST', body: data }, requireAuth);
  }

  // PUT request
  async put(endpoint, data, requireAuth = true) {
    return this.request(endpoint, { method: 'PUT', body: data }, requireAuth);
  }

  // DELETE request
  async delete(endpoint, requireAuth = true) {
    return this.request(endpoint, { method: 'DELETE' }, requireAuth);
  }

  // ============================================
  // AUTHENTICATION
  // ============================================
  async login(email, password) {
    try {
      const data = await this.post('/auth/login', { email, password });
      if (data.token) {
        this.setToken(data.token);
      }
      return data;
    } catch (error) {
      // Re-throw with a more user-friendly message
      if (error.message.includes('401') || error.message.includes('Unauthorized') || error.message.includes('Invalid credentials')) {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      } else if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
        throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
      }
      throw error;
    }
  }

  async register(userData) {
    return this.post('/auth/register', userData);
  }

  // ============================================
  // USERS (Admin only)
  // ============================================
  async getUsers() {
    const data = await this.get('/users');
    return data.users || [];
  }

  async getUser(id) {
    const data = await this.get(`/users/${id}`);
    return data.user;
  }

  async updateUser(id, userData) {
    const data = await this.put(`/users/${id}`, userData);
    return data.user;
  }

  async updateUserStatus(id, status) {
    const data = await this.put(`/users/${id}/status`, { status });
    return data;
  }

  async getCurrentUser() {
    return this.get('/auth/me');
  }

  async bootstrapAdmin(adminData) {
    return this.post('/auth/bootstrap', adminData);
  }

  // ============================================
  // DEPARTMENTS
  // ============================================
  async getDepartments() {
    const data = await this.get('/departments');
    return data.departments || [];
  }

  async getDepartment(id) {
    const data = await this.get(`/departments/${id}`);
    return data.department;
  }

  async createDepartment(departmentData) {
    const data = await this.post('/departments', departmentData);
    return data.department;
  }

  async updateDepartment(id, departmentData) {
    const data = await this.put(`/departments/${id}`, departmentData);
    return data.department;
  }

  async deleteDepartment(id) {
    return this.delete(`/departments/${id}`);
  }

  // ============================================
  // EMPLOYEES
  // ============================================
  async getEmployees() {
    const data = await this.get('/employees');
    return data.employees || [];
  }

  async getEmployee(id) {
    const data = await this.get(`/employees/${id}`);
    return data.employee;
  }

  async createEmployee(employeeData) {
    const data = await this.post('/employees', employeeData);
    return data.employee;
  }

  async updateEmployee(id, employeeData) {
    const data = await this.put(`/employees/${id}`, employeeData);
    return data.employee;
  }

  async deleteEmployee(id) {
    return this.delete(`/employees/${id}`);
  }

  // ============================================
  // LEAVE
  // ============================================
  async getLeaveRequests(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/leave?${queryParams}` : '/leave';
    const data = await this.get(endpoint);
    return data.leaveRequests || [];
  }

  async getLeaveRequest(id) {
    const data = await this.get(`/leave/${id}`);
    return data.leaveRequest;
  }

  async createLeaveRequest(leaveData) {
    const data = await this.post('/leave', leaveData);
    return data.leaveRequest;
  }

  async approveLeaveRequest(id, comments) {
    const data = await this.put(`/leave/${id}/approve`, { comments });
    return data.leaveRequest;
  }

  async rejectLeaveRequest(id, comments) {
    const data = await this.put(`/leave/${id}/reject`, { comments });
    return data.leaveRequest;
  }

  async updateLeaveRequest(id, updates) {
    const data = await this.put(`/leave/${id}`, updates);
    return data.leaveRequest;
  }

  async getLeaveTypes() {
    const data = await this.get('/leave/types');
    return data.leaveTypes || [];
  }

  async createLeaveType(leaveTypeData) {
    const data = await this.post('/leave/types', leaveTypeData);
    return data.leaveType;
  }

  async updateLeaveType(id, leaveTypeData) {
    const data = await this.put(`/leave/types/${id}`, leaveTypeData);
    return data.leaveType;
  }

  async deleteLeaveType(id) {
    return this.delete(`/leave/types/${id}`);
  }

  // ============================================
  // ATTENDANCE
  // ============================================
  async getAttendance(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/attendance?${queryParams}` : '/attendance';
    const data = await this.get(endpoint);
    return data.attendance || [];
  }

  async checkIn() {
    const data = await this.post('/attendance/checkin', {});
    return data.attendance;
  }

  async checkOut() {
    const data = await this.post('/attendance/checkout', {});
    return data.attendance;
  }

  async createAttendance(attendanceData) {
    const data = await this.post('/attendance', attendanceData);
    return data.attendance;
  }

  async updateAttendance(id, attendanceData) {
    const data = await this.put(`/attendance/${id}`, attendanceData);
    return data.attendance;
  }

  // ============================================
  // RECRUITMENT - PUBLIC (No authentication required)
  // ============================================
  async getPublicJobs() {
    const data = await this.get('/recruitment/public/jobs', false); // false = no auth required
    return data.jobs || [];
  }

  async getPublicJob(id) {
    const data = await this.get(`/recruitment/public/jobs/${id}`, false); // false = no auth required
    return data.job;
  }

  async submitApplication(applicationData) {
    const data = await this.post('/recruitment/public/apply', applicationData, false); // false = no auth required
    return data;
  }

  // ============================================
  // PAYROLL
  // ============================================
  async getPayroll(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/payroll?${queryParams}` : '/payroll';
    const data = await this.get(endpoint);
    return data.payrolls || data.payroll || []; // Backend returns 'payrolls', handle both for compatibility
  }

  async getPayrollRecord(id) {
    const data = await this.get(`/payroll/${id}`);
    return data.payroll;
  }

  async generatePayroll(payrollData) {
    const data = await this.post('/payroll', payrollData);
    return data.payroll;
  }

  async markPayrollPaid(id) {
    const data = await this.put(`/payroll/${id}/paid`, {});
    return data.payroll;
  }

  async deletePayroll(id) {
    return this.delete(`/payroll/${id}`);
  }

  // ============================================
  // RECRUITMENT
  // ============================================
  async getJobVacancies(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/recruitment/jobs?${queryParams}` : '/recruitment/jobs';
    const data = await this.get(endpoint);
    return data.jobs || [];
  }

  async getJobVacancy(id) {
    const data = await this.get(`/recruitment/jobs/${id}`);
    return data.job;
  }

  async createJobVacancy(jobData) {
    const data = await this.post('/recruitment/jobs', jobData);
    return data.job;
  }

  async updateJobVacancy(id, jobData) {
    const data = await this.put(`/recruitment/jobs/${id}`, jobData);
    return data.job;
  }

  async deleteJobVacancy(id) {
    return this.delete(`/recruitment/jobs/${id}`);
  }

  async getApplicants(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/recruitment/applicants?${queryParams}` : '/recruitment/applicants';
    const data = await this.get(endpoint);
    return data.applicants || [];
  }

  async getApplicant(id) {
    const data = await this.get(`/recruitment/applicants/${id}`);
    return data.applicant;
  }

  async createApplicant(applicantData) {
    const data = await this.post('/recruitment/applicants', applicantData);
    return data.applicant;
  }

  async updateApplicantStatus(id, statusData) {
    const data = await this.put(`/recruitment/applicants/${id}/status`, statusData);
    return data.applicant;
  }

  // ============================================
  // DASHBOARD
  // ============================================
  async getDashboardStats() {
    const data = await this.get('/dashboard/stats');
    // Backend returns stats directly, not wrapped in 'stats' property
    return data || {};
  }

  async getRecentActivity() {
    const data = await this.get('/dashboard/recent-activity');
    return data.activities || [];
  }
}

  // Create global API instance
  window.API = new APIService();

  // Backward compatibility wrapper (replaces window.DB)
  window.DB = {
  getAll: async function(table) {
    const api = window.API;
    switch(table) {
      case 'departments': return await api.getDepartments();
      case 'employees': return await api.getEmployees();
      case 'leave_requests': return await api.getLeaveRequests();
      case 'attendance': return await api.getAttendance();
      case 'payroll': return await api.getPayroll();
      case 'job_vacancies': return await api.getJobVacancies();
      case 'applicants': return await api.getApplicants();
      case 'leave_types': return await api.getLeaveTypes();
      default: return [];
    }
  },
  getById: async function(table, id) {
    const api = window.API;
    switch(table) {
      case 'departments': return await api.getDepartment(id);
      case 'employees': return await api.getEmployee(id);
      case 'leave_requests': return await api.getLeaveRequest(id);
      case 'attendance': return await api.getAttendance({ id });
      case 'payroll': return await api.getPayrollRecord(id);
      case 'job_vacancies': return await api.getJobVacancy(id);
      case 'applicants': return await api.getApplicant(id);
      case 'leave_types': return (await api.getLeaveTypes()).find(lt => lt.id === id);
      default: return null;
    }
  },
  create: async function(table, item) {
    const api = window.API;
    switch(table) {
      case 'departments': return await api.createDepartment(item);
      case 'employees': return await api.createEmployee(item);
      case 'leave_requests': return await api.createLeaveRequest(item);
      case 'attendance': return await api.createAttendance(item);
      case 'payroll': return await api.generatePayroll(item);
      case 'job_vacancies': return await api.createJobVacancy(item);
      case 'applicants': return await api.createApplicant(item);
      default: return null;
    }
  },
  update: async function(table, id, updates) {
    const api = window.API;
    switch(table) {
      case 'departments': return await api.updateDepartment(id, updates);
      case 'employees': return await api.updateEmployee(id, updates);
      case 'leave_requests': 
        if (updates.status === 'approved') return await api.approveLeaveRequest(id, updates.comments);
        if (updates.status === 'rejected') return await api.rejectLeaveRequest(id, updates.comments);
        return await api.updateLeaveRequest(id, updates);
      case 'attendance': return await api.updateAttendance(id, updates);
      case 'job_vacancies': return await api.updateJobVacancy(id, updates);
      default: return null;
    }
  },
  delete: async function(table, id) {
    const api = window.API;
    switch(table) {
      case 'departments': return await api.deleteDepartment(id);
      case 'employees': return await api.deleteEmployee(id);
      case 'job_vacancies': return await api.deleteJobVacancy(id);
      default: return null;
    }
  },
  getEmployeeByEmail: async function(email) {
    const employees = await window.API.getEmployees();
    return employees.find(emp => emp.email === email) || null;
  },
  getEmployeesByDepartment: async function(departmentId) {
    const employees = await window.API.getEmployees();
    return employees.filter(emp => emp.departmentId === departmentId);
  },
  getLeaveRequestsByEmployee: async function(employeeId) {
    return await window.API.getLeaveRequests({ employeeId });
  },
  getPendingLeaveRequests: async function() {
    return await window.API.getLeaveRequests({ status: 'pending' });
  },
  getAttendanceByEmployee: async function(employeeId, startDate, endDate) {
    return await window.API.getAttendance({ employeeId, startDate, endDate });
  },
  generatePayroll: async function(employeeId, month, year) {
    return await window.API.generatePayroll({ employeeId, month, year });
  }
};

} // End of if (typeof window.API === 'undefined')


