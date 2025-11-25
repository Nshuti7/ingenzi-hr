/**
 * INGENZI HRMS - Payroll Management Module
 * Uses Backend API instead of IndexedDB
 */

document.addEventListener('DOMContentLoaded', async function() {
  if (!window.API) {
    console.error('API service not available');
    return;
  }
  await loadPayroll();
  setupEventListeners();
});

function setupEventListeners() {
  const generateBtn = document.getElementById('generatePayrollBtn');
  if (generateBtn) generateBtn.addEventListener('click', showGeneratePayrollModal);

  const payrollForm = document.getElementById('payrollForm');
  if (payrollForm) payrollForm.addEventListener('submit', handlePayrollSubmit);

  const closeModal = document.getElementById('closePayrollModal');
  if (closeModal) closeModal.addEventListener('click', closePayrollModal);
}

async function loadPayroll() {
  try {
    const user = await getCurrentUser();
    const userRole = getCurrentUserRole();
    const container = document.getElementById('payrollTableBody');
    if (!container) return;

    // Hide generate button for employees
    if (userRole === 'employee') {
      const generateBtn = document.getElementById('generatePayrollBtn');
      if (generateBtn) generateBtn.style.display = 'none';
    }

    let payroll;
    if (userRole === 'employee') {
      const currentUser = await window.API.getCurrentUser();
      if (currentUser.user && currentUser.user.employee && currentUser.user.employee.id) {
        payroll = await window.API.getPayroll({ employeeId: currentUser.user.employee.id });
      } else {
        payroll = [];
      }
      
      // Load current payroll summary for employees
      await loadCurrentPayrollSummary(payroll);
    } else {
      payroll = await window.API.getPayroll();
    }

    if (payroll.length === 0) {
      container.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-muted">No payroll records found.</td></tr>';
      return;
    }

    const employees = userRole !== 'employee' ? await window.API.getEmployees() : [];

    // Sort payroll by year and month (most recent first)
    payroll.sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return b.month - a.month;
    });

    container.innerHTML = payroll.map(p => {
      const employee = employees.find(emp => emp.id === p.employeeId);
      
      // Handle Decimal types from Prisma
      const basicSalary = typeof p.basicSalary === 'number' ? p.basicSalary : parseFloat(p.basicSalary.toString());
      const allowances = typeof p.allowances === 'number' ? p.allowances : parseFloat(p.allowances.toString());
      const deductions = typeof p.deductions === 'number' ? p.deductions : parseFloat(p.deductions.toString());
      const netSalary = typeof p.netSalary === 'number' ? p.netSalary : parseFloat(p.netSalary.toString());
      
      return `
        <tr>
          ${userRole !== 'employee' ? `<td>${employee ? `${employee.firstName} ${employee.lastName}` : 'N/A'}</td>` : ''}
          <td>${p.month}/${p.year}</td>
          <td>RWF ${basicSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td>RWF ${allowances.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td>RWF ${deductions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td>RWF ${netSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td>
            <span class="badge ${p.status === 'paid' ? 'bg-success-500' : 'bg-warning-500'}">${p.status}</span>
          </td>
          <td>
            <button class="btn btn-sm btn-primary" onclick="viewPayslip(${p.id})">View Payslip</button>
            ${userRole !== 'employee' && p.status !== 'paid' ? `
              <button class="btn btn-sm btn-success" onclick="markPaid(${p.id})">Mark Paid</button>
              <button class="btn btn-sm btn-danger" onclick="deletePayroll(${p.id})">Delete</button>
            ` : ''}
            ${userRole !== 'employee' && p.status === 'paid' ? `
              <button class="btn btn-sm btn-danger" onclick="deletePayroll(${p.id})">Delete</button>
            ` : ''}
          </td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading payroll:', error);
    const container = document.getElementById('payrollTableBody');
    if (container) {
      container.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-danger">Error loading payroll. Please refresh the page.</td></tr>';
    }
  }
}

async function loadCurrentPayrollSummary(payroll) {
  try {
    const userRole = getCurrentUserRole();
    if (userRole !== 'employee') return;

    const currentPayrollCard = document.getElementById('currentPayrollCard');
    const currentPayrollContent = document.getElementById('currentPayrollContent');
    
    if (!currentPayrollCard || !currentPayrollContent) return;

    // Get current month and year
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Find current month's payroll or most recent payroll
    let currentPayroll = payroll.find(p => p.month === currentMonth && p.year === currentYear);
    
    // If no current month payroll, get the most recent one
    if (!currentPayroll && payroll.length > 0) {
      currentPayroll = payroll.sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year;
        return b.month - a.month;
      })[0];
    }

    if (!currentPayroll) {
      currentPayrollCard.style.display = 'none';
      return;
    }

    // Handle Decimal types
    const basicSalary = typeof currentPayroll.basicSalary === 'number' 
      ? currentPayroll.basicSalary 
      : parseFloat(currentPayroll.basicSalary.toString());
    const allowances = typeof currentPayroll.allowances === 'number' 
      ? currentPayroll.allowances 
      : parseFloat(currentPayroll.allowances.toString());
    const deductions = typeof currentPayroll.deductions === 'number' 
      ? currentPayroll.deductions 
      : parseFloat(currentPayroll.deductions.toString());
    const netSalary = typeof currentPayroll.netSalary === 'number' 
      ? currentPayroll.netSalary 
      : parseFloat(currentPayroll.netSalary.toString());

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const periodName = `${monthNames[currentPayroll.month - 1]} ${currentPayroll.year}`;
    const isCurrentMonth = currentPayroll.month === currentMonth && currentPayroll.year === currentYear;

    currentPayrollContent.innerHTML = `
      <div class="grid grid-cols-12 gap-4">
        <div class="col-span-12 md:col-span-8">
          <div class="mb-4">
            <h6 class="text-muted mb-1">Pay Period</h6>
            <h4 class="mb-0">${periodName} ${isCurrentMonth ? '<span class="badge bg-info-500">Current</span>' : ''}</h4>
          </div>
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <h6 class="text-muted mb-1">Basic Salary</h6>
              <h5 class="mb-0">RWF ${basicSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h5>
            </div>
            <div>
              <h6 class="text-muted mb-1">Allowances</h6>
              <h5 class="mb-0 text-success-500">+ RWF ${allowances.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h5>
            </div>
            <div>
              <h6 class="text-muted mb-1">Deductions</h6>
              <h5 class="mb-0 text-danger-500">- RWF ${deductions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h5>
            </div>
            <div>
              <h6 class="text-muted mb-1">Working Days</h6>
              <h5 class="mb-0">${currentPayroll.workingDays || 0} days</h5>
            </div>
          </div>
        </div>
        <div class="col-span-12 md:col-span-4">
          <div class="card bg-primary-50 border-primary-200">
            <div class="card-body text-center">
              <h6 class="text-muted mb-2">Net Salary</h6>
              <h2 class="mb-3 text-primary-600">RWF ${netSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
              <span class="badge ${currentPayroll.status === 'paid' ? 'bg-success-500' : 'bg-warning-500'} mb-3">
                ${currentPayroll.status === 'paid' ? 'Paid' : 'Pending'}
              </span>
              ${currentPayroll.paidDate ? `
                <p class="text-muted small mb-0">Paid on ${new Date(currentPayroll.paidDate).toLocaleDateString()}</p>
              ` : ''}
              <div class="mt-3">
                <button class="btn btn-primary btn-sm" onclick="viewPayslip(${currentPayroll.id})">
                  <i class="feather icon-file-text me-1"></i>View Payslip
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    currentPayrollCard.style.display = 'block';
  } catch (error) {
    console.error('Error loading current payroll summary:', error);
    const currentPayrollCard = document.getElementById('currentPayrollCard');
    if (currentPayrollCard) currentPayrollCard.style.display = 'none';
  }
}

async function showGeneratePayrollModal() {
  try {
    const employees = await window.API.getEmployees();
    const select = document.getElementById('payrollEmployeeId');
    if (!select) return;

    select.innerHTML = '<option value="">Select Employee</option>' +
      employees.map(emp => 
        `<option value="${emp.id}">${emp.firstName} ${emp.lastName} (${emp.employeeId})</option>`
      ).join('');

    // Set current month/year
    const now = new Date();
    document.getElementById('payrollMonth').value = now.getMonth() + 1;
    document.getElementById('payrollYear').value = now.getFullYear();

    const modal = document.getElementById('payrollModal');
    if (modal) modal.style.display = 'block';
  } catch (error) {
    console.error('Error loading payroll modal:', error);
    showNotification('Error loading payroll form', 'error');
  }
}

async function handlePayrollSubmit(e) {
  e.preventDefault();
  
  try {
    const employeeId = parseInt(document.getElementById('payrollEmployeeId').value);
    const month = parseInt(document.getElementById('payrollMonth').value);
    const year = parseInt(document.getElementById('payrollYear').value);

    // Validate inputs
    if (!employeeId || !month || !year) {
      showNotification('Please fill in all required fields', 'error');
      if (window.Toast) window.Toast.error('Please fill in all required fields');
      return;
    }

    if (month < 1 || month > 12) {
      showNotification('Please select a valid month', 'error');
      if (window.Toast) window.Toast.error('Please select a valid month');
      return;
    }

    if (year < 2000 || year > 2100) {
      showNotification('Please enter a valid year', 'error');
      if (window.Toast) window.Toast.error('Please enter a valid year');
      return;
    }

    // Disable submit button during processing
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Generating...';
    }

    await window.API.generatePayroll({ employeeId, month, year });
    showNotification('Payroll generated successfully', 'success');
    if (window.Toast) window.Toast.success('Payroll generated successfully');
    closePayrollModal();
    await loadPayroll();
  } catch (error) {
    console.error('Error generating payroll:', error);
    const errorMessage = error.message || 'Error generating payroll';
    showNotification(errorMessage, 'error');
    if (window.Toast) window.Toast.error(errorMessage);
  } finally {
    // Re-enable submit button
    const submitBtn = document.querySelector('#payrollForm button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Generate Payroll';
    }
  }
}

async function markPaid(id) {
  try {
    await window.API.markPayrollPaid(id);
    showNotification('Payroll marked as paid', 'success');
    if (window.Toast) window.Toast.success('Payroll marked as paid');
    await loadPayroll();
  } catch (error) {
    console.error('Error marking payroll as paid:', error);
    const errorMessage = error.message || 'Error updating payroll status';
    showNotification(errorMessage, 'error');
    if (window.Toast) window.Toast.error(errorMessage);
  }
}

async function deletePayroll(id) {
  const confirmed = await showConfirm(
    'Are you sure you want to delete this payroll record? This action cannot be undone.',
    'Delete Payroll Record',
    'Delete',
    'Cancel'
  );
  if (!confirmed) return;
  
  try {
    await window.API.deletePayroll(id);
    showNotification('Payroll record deleted successfully', 'success');
    if (window.Toast) window.Toast.success('Payroll record deleted successfully');
    await loadPayroll();
  } catch (error) {
    console.error('Error deleting payroll:', error);
    const errorMessage = error.message || 'Error deleting payroll record';
    showNotification(errorMessage, 'error');
    if (window.Toast) window.Toast.error(errorMessage);
  }
}

async function viewPayslip(id) {
  try {
    const payroll = await window.API.getPayrollRecord(id);
    if (!payroll) return;

    const employee = payroll.employee ? payroll.employee : await window.API.getEmployee(payroll.employeeId);
    
    // Handle Decimal types from Prisma
    const basicSalary = typeof payroll.basicSalary === 'number' ? payroll.basicSalary : parseFloat(payroll.basicSalary.toString());
    const allowances = typeof payroll.allowances === 'number' ? payroll.allowances : parseFloat(payroll.allowances.toString());
    const deductions = typeof payroll.deductions === 'number' ? payroll.deductions : parseFloat(payroll.deductions.toString());
    const netSalary = typeof payroll.netSalary === 'number' ? payroll.netSalary : parseFloat(payroll.netSalary.toString());
    
    const payslipContent = `
      PAYSLIP
      ====================
      Employee: ${employee ? `${employee.firstName} ${employee.lastName}` : 'N/A'}
      Employee ID: ${employee ? employee.employeeId : 'N/A'}
      Period: ${payroll.month}/${payroll.year}
      
      Basic Salary: RWF ${basicSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      Allowances: RWF ${allowances.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      Deductions: RWF ${deductions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      --------------------
      Net Salary: RWF ${netSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      
      Working Days: ${payroll.workingDays || 'N/A'}
      Status: ${payroll.status}
    `;
    
    // Open in new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>Payslip</title></head>
        <body style="font-family: monospace; padding: 20px;">
          <pre>${payslipContent}</pre>
          <button onclick="window.print()">Print</button>
        </body>
      </html>
    `);
    printWindow.document.close();
  } catch (error) {
    console.error('Error viewing payslip:', error);
    showNotification('Error loading payslip', 'error');
  }
}

function closePayrollModal() {
  const modal = document.getElementById('payrollModal');
  if (modal) modal.style.display = 'none';
  const form = document.getElementById('payrollForm');
  if (form) form.reset();
}

function showNotification(message, type) {
  const notification = document.createElement('div');
  notification.className = `alert alert-${type === 'success' ? 'success' : 'danger'} fixed top-4 right-4 z-50`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

window.viewPayslip = viewPayslip;
window.markPaid = markPaid;
window.deletePayroll = deletePayroll;
