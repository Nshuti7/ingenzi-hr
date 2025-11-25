/**
 * INGENZI HRMS - Reports Module
 */

document.addEventListener('DOMContentLoaded', function() {
  const userRole = getCurrentUserRole();
  if (userRole === 'employee') {
    window.location.href = '../dashboard/index.html';
    return;
  }
  setupEventListeners();
});

function setupEventListeners() {
  const generateBtns = document.querySelectorAll('[data-report]');
  generateBtns.forEach(btn => {
    btn.addEventListener('click', async function() {
      const reportType = this.getAttribute('data-report');
      await generateReport(reportType);
    });
  });
}

async function generateReport(type) {
  let reportData = '';
  let reportTitle = '';

  switch(type) {
    case 'employee':
      reportTitle = 'Employee Report';
      const employees = await window.API.getEmployees();
      const departments = await window.API.getDepartments();
      reportData = employees.map(emp => {
        const dept = departments.find(d => d.id === emp.departmentId);
        const salary = typeof emp.salary === 'number' ? emp.salary : parseFloat(emp.salary.toString());
        const formattedSalary = salary ? `RWF ${salary.toFixed(2)}` : 'N/A';
        return `${emp.employeeId}, ${emp.firstName} ${emp.lastName}, ${emp.email}, ${dept ? dept.name : 'N/A'}, ${emp.position}, ${formattedSalary}, ${emp.status}`;
      }).join('\n');
      reportData = 'Employee ID, Name, Email, Department, Position, Salary (RWF), Status\n' + reportData;
      break;

    case 'leave':
      reportTitle = 'Leave Report';
      const leaves = await window.API.getLeaveRequests();
      const leaveTypes = await window.API.getLeaveTypes();
      const empList = await window.API.getEmployees();
      reportData = leaves.map(leave => {
        const leaveType = leaveTypes.find(lt => lt.id === leave.leaveTypeId);
        const employee = empList.find(e => e.id === leave.employeeId);
        return `${employee ? employee.employeeId : 'N/A'}, ${employee ? `${employee.firstName} ${employee.lastName}` : 'N/A'}, ${leaveType ? leaveType.name : 'N/A'}, ${new Date(leave.startDate).toLocaleDateString()}, ${new Date(leave.endDate).toLocaleDateString()}, ${leave.days}, ${leave.status}`;
      }).join('\n');
      reportData = 'Employee ID, Name, Leave Type, Start Date, End Date, Days, Status\n' + reportData;
      break;

    case 'payroll':
      reportTitle = 'Payroll Report';
      const payroll = await window.API.getPayroll();
      const employeesList = await window.API.getEmployees();
      reportData = payroll.map(p => {
        const employee = employeesList.find(e => e.id === p.employeeId);
        const basicSalary = typeof p.basicSalary === 'number' ? p.basicSalary : parseFloat(p.basicSalary.toString());
        const allowances = typeof p.allowances === 'number' ? p.allowances : parseFloat(p.allowances.toString());
        const deductions = typeof p.deductions === 'number' ? p.deductions : parseFloat(p.deductions.toString());
        const netSalary = typeof p.netSalary === 'number' ? p.netSalary : parseFloat(p.netSalary.toString());
        return `${employee ? employee.employeeId : 'N/A'}, ${employee ? `${employee.firstName} ${employee.lastName}` : 'N/A'}, ${p.month}/${p.year}, RWF ${basicSalary.toFixed(2)}, RWF ${allowances.toFixed(2)}, RWF ${deductions.toFixed(2)}, RWF ${netSalary.toFixed(2)}, ${p.status}`;
      }).join('\n');
      reportData = 'Employee ID, Name, Period, Basic Salary (RWF), Allowances (RWF), Deductions (RWF), Net Salary (RWF), Status\n' + reportData;
      break;

    case 'attendance':
      reportTitle = 'Attendance Report';
      const attendance = await window.API.getAttendance();
      const employeesAtt = await window.API.getEmployees();
      reportData = attendance.map(att => {
        const employee = employeesAtt.find(e => e.id === att.employeeId);
        const timeIn = att.checkIn ? new Date(att.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-';
        const timeOut = att.checkOut ? new Date(att.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-';
        const hours = att.hoursWorked !== null && att.hoursWorked !== undefined 
          ? (typeof att.hoursWorked === 'number' ? att.hoursWorked : parseFloat(att.hoursWorked.toString())).toFixed(2)
          : '-';
        return `${employee ? employee.employeeId : 'N/A'}, ${employee ? `${employee.firstName} ${employee.lastName}` : 'N/A'}, ${new Date(att.date).toLocaleDateString()}, ${timeIn}, ${timeOut}, ${hours}, ${att.status}`;
      }).join('\n');
      reportData = 'Employee ID, Name, Date, Time In, Time Out, Hours, Status\n' + reportData;
      break;
  }

  // Download as CSV
  downloadCSV(reportData, reportTitle);
}

function downloadCSV(data, filename) {
  const blob = new Blob([data], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  showNotification('Report generated and downloaded', 'success');
}

function showNotification(message, type) {
  const notification = document.createElement('div');
  notification.className = `alert alert-${type === 'success' ? 'success' : 'danger'} fixed top-4 right-4 z-50`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}
