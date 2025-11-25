/**
 * INGENZI HRMS - Attendance Management Module
 * Uses Backend API instead of IndexedDB
 */

document.addEventListener('DOMContentLoaded', async function() {
  if (!window.API) {
    console.error('API service not available');
    return;
  }
  await loadAttendance();
  setupEventListeners();
});

function setupEventListeners() {
  const markBtn = document.getElementById('markAttendanceBtn');
  if (markBtn) markBtn.addEventListener('click', showMarkAttendanceModal);

  const attendanceForm = document.getElementById('attendanceForm');
  if (attendanceForm) attendanceForm.addEventListener('submit', handleAttendanceSubmit);

  const closeModal = document.getElementById('closeAttendanceModal');
  if (closeModal) closeModal.addEventListener('click', closeAttendanceModal);

  // Check-in/Check-out buttons for employees
  const checkInBtn = document.getElementById('checkInBtn');
  if (checkInBtn) checkInBtn.addEventListener('click', handleCheckIn);

  const checkOutBtn = document.getElementById('checkOutBtn');
  if (checkOutBtn) checkOutBtn.addEventListener('click', handleCheckOut);

  // Reload employee list when date changes in modal
  const dateInput = document.getElementById('attendanceDate');
  if (dateInput) {
    dateInput.addEventListener('change', async () => {
      // Only reload if modal is open and employee dropdown exists
      const modal = document.getElementById('attendanceModal');
      const select = document.getElementById('attendanceEmployeeId');
      if (modal && modal.style.display !== 'none' && select) {
        const currentValue = select.value;
        // Reload employee list based on new date
        await showMarkAttendanceModal();
        // Restore selection if still available
        if (select.querySelector(`option[value="${currentValue}"]`)) {
          select.value = currentValue;
        } else {
          select.value = '';
        }
      }
    });
  }
}

async function loadAttendance() {
  try {
    const user = await getCurrentUser();
    const userRole = getCurrentUserRole();
    const container = document.getElementById('attendanceTableBody');
    if (!container) return;

    // Hide mark attendance button for employees
    if (userRole === 'employee') {
      const markBtn = document.getElementById('markAttendanceBtn');
      if (markBtn) markBtn.style.display = 'none';
    }

    let attendance;
    if (userRole === 'employee') {
      const currentUser = await window.API.getCurrentUser();
      if (currentUser.user && currentUser.user.employee && currentUser.user.employee.id) {
        attendance = await window.API.getAttendance({ employeeId: currentUser.user.employee.id });
      } else {
        attendance = [];
      }
    } else {
      attendance = await window.API.getAttendance();
    }

    if (attendance.length === 0) {
      container.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-muted">No attendance records found.</td></tr>';
      return;
    }

    const employees = userRole !== 'employee' ? await window.API.getEmployees() : [];

    container.innerHTML = attendance.map(att => {
      const employee = employees.find(emp => emp.id === att.employeeId);
      
      // Format hours worked - handle Decimal type from Prisma
      let hoursWorkedDisplay = '-';
      if (att.hoursWorked !== null && att.hoursWorked !== undefined) {
        // Convert to number if it's a Decimal object or string
        const hours = typeof att.hoursWorked === 'number' 
          ? att.hoursWorked 
          : parseFloat(att.hoursWorked.toString());
        hoursWorkedDisplay = !isNaN(hours) ? hours.toFixed(2) : '-';
      }
      
      // Format check-in and check-out times
      const timeIn = att.checkIn 
        ? new Date(att.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : '-';
      const timeOut = att.checkOut 
        ? new Date(att.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : '-';
      
      return `
        <tr>
          ${userRole !== 'employee' ? `<td>${employee ? `${employee.firstName} ${employee.lastName}` : 'N/A'}</td>` : ''}
          <td>${new Date(att.date).toLocaleDateString()}</td>
          <td>${timeIn}</td>
          <td>${timeOut}</td>
          <td>${hoursWorkedDisplay}</td>
          <td>
            <span class="badge ${att.status === 'present' ? 'bg-success-500' : 'bg-danger-500'}">${att.status}</span>
          </td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading attendance:', error);
    const container = document.getElementById('attendanceTableBody');
    if (container) {
      container.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-danger">Error loading attendance. Please refresh the page.</td></tr>';
    }
  }
}

async function showMarkAttendanceModal() {
  try {
    const employees = await window.API.getEmployees();
    const select = document.getElementById('attendanceEmployeeId');
    if (!select) return;

    // Get selected date (default to today)
    const dateInput = document.getElementById('attendanceDate');
    const selectedDate = dateInput ? dateInput.value || new Date().toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    
    // Get all approved leave requests for the selected date
    const leaveRequests = await window.API.getLeaveRequests();
    const selectedDateObj = new Date(selectedDate);
    
    // Filter employees who are on approved leave for the selected date
    const employeesOnLeave = new Set();
    leaveRequests.forEach(leave => {
      if (leave.status === 'approved') {
        const startDate = new Date(leave.startDate);
        const endDate = new Date(leave.endDate);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        selectedDateObj.setHours(0, 0, 0, 0);
        
        if (selectedDateObj >= startDate && selectedDateObj <= endDate) {
          employeesOnLeave.add(leave.employeeId);
        }
      }
    });

    // Filter out employees on leave and inactive employees
    const availableEmployees = employees.filter(emp => 
      emp.status === 'active' && !employeesOnLeave.has(emp.id)
    );

    if (availableEmployees.length === 0) {
      select.innerHTML = '<option value="">No available employees</option>';
      showNotification('No employees available for attendance marking on this date', 'warning');
    } else {
      select.innerHTML = '<option value="">Select Employee</option>' +
        availableEmployees.map(emp => 
          `<option value="${emp.id}">${emp.firstName} ${emp.lastName} (${emp.employeeId})</option>`
        ).join('');
    }

    // Set today's date if not already set
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }
    
    const timeInInput = document.getElementById('timeIn');
    const timeOutInput = document.getElementById('timeOut');
    if (timeInInput && !timeInInput.value) timeInInput.value = '09:00';
    if (timeOutInput && !timeOutInput.value) timeOutInput.value = '18:00';

    const modal = document.getElementById('attendanceModal');
    if (modal) modal.style.display = 'block';
  } catch (error) {
    console.error('Error loading attendance modal:', error);
    showNotification('Error loading attendance form', 'error');
  }
}

async function handleAttendanceSubmit(e) {
  e.preventDefault();
  
  try {
    const employeeId = parseInt(document.getElementById('attendanceEmployeeId').value);
    const date = document.getElementById('attendanceDate').value;
    const timeIn = document.getElementById('timeIn').value;
    const timeOut = document.getElementById('timeOut').value;
    const notes = document.getElementById('attendanceNotes').value || '';
    
    // Validate required fields
    if (!employeeId || !date || !timeIn || !timeOut) {
      showNotification('Please fill in all required fields', 'error');
      if (window.Toast) window.Toast.error('Please fill in all required fields');
      return;
    }

    // Combine date and time for checkIn and checkOut
    const checkInDateTime = `${date}T${timeIn}:00`;
    const checkOutDateTime = `${date}T${timeOut}:00`;
    
    // Validate that check-out is after check-in
    const checkInTime = new Date(checkInDateTime);
    const checkOutTime = new Date(checkOutDateTime);
    if (checkOutTime <= checkInTime) {
      showNotification('Check-out time must be after check-in time', 'error');
      if (window.Toast) window.Toast.error('Check-out time must be after check-in time');
      return;
    }
    
    const attendance = {
      employeeId: employeeId,
      date: date,
      checkIn: checkInDateTime,
      checkOut: checkOutDateTime,
      status: 'present', // Default status
      notes: notes
    };

    await window.API.createAttendance(attendance);
    showNotification('Attendance marked successfully', 'success');
    if (window.Toast) window.Toast.success('Attendance marked successfully');
    closeAttendanceModal();
    await loadAttendance();
  } catch (error) {
    console.error('Error saving attendance:', error);
    const errorMessage = error.message || 'Error saving attendance';
    showNotification(errorMessage, 'error');
    if (window.Toast) window.Toast.error(errorMessage);
  }
}

async function handleCheckIn() {
  try {
    await window.API.checkIn();
    showNotification('Checked in successfully', 'success');
    await loadAttendance();
  } catch (error) {
    console.error('Error checking in:', error);
    showNotification(error.message || 'Error checking in', 'error');
  }
}

async function handleCheckOut() {
  try {
    await window.API.checkOut();
    showNotification('Checked out successfully', 'success');
    await loadAttendance();
  } catch (error) {
    console.error('Error checking out:', error);
    showNotification(error.message || 'Error checking out', 'error');
  }
}

function closeAttendanceModal() {
  const modal = document.getElementById('attendanceModal');
  if (modal) modal.style.display = 'none';
  const form = document.getElementById('attendanceForm');
  if (form) form.reset();
}

function showNotification(message, type) {
  const notification = document.createElement('div');
  notification.className = `alert alert-${type === 'success' ? 'success' : 'danger'} fixed top-4 right-4 z-50`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}
