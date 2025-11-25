/**
 * INGENZI HRMS - Leave Management Module
 * Uses Backend API instead of IndexedDB
 */

let currentView = 'requests'; // 'requests', 'apply', 'history'

document.addEventListener('DOMContentLoaded', async function() {
  if (!window.API) {
    console.error('API service not available');
    return;
  }
  
  const user = await getCurrentUser();
  const userRole = getCurrentUserRole();
  
  setupEventListeners();
  
  // Employees see history first, managers see requests
  if (userRole === 'employee') {
    await checkPendingLeaves();
    await showView('history');
    const requestsTab = document.getElementById('requestsTab');
    if (requestsTab) requestsTab.style.display = 'none';
  } else {
    await showView('requests');
  }
});

async function checkPendingLeaves() {
  try {
    const userRole = getCurrentUserRole();
    if (userRole !== 'employee') return;

    const currentUser = await window.API.getCurrentUser();
    if (!currentUser.user || !currentUser.user.employee || !currentUser.user.employee.id) {
      return;
    }

    // Get all leaves to check for active ones
    const allRequests = await window.API.getLeaveRequests({ 
      employeeId: currentUser.user.employee.id
    });

    // Filter for pending leaves for the alert
    const requests = allRequests.filter(req => req.status === 'pending');

    const alertDiv = document.getElementById('leaveStatusAlert');
    if (!alertDiv) return;

    if (requests.length > 0) {
      // Show pending leave alert
      const pendingLeave = requests[0];
      const leaveTypes = await window.API.getLeaveTypes();
      const leaveType = leaveTypes.find(lt => lt.id === pendingLeave.leaveTypeId);
      const startDate = new Date(pendingLeave.startDate).toLocaleDateString();
      const endDate = new Date(pendingLeave.endDate).toLocaleDateString();

      alertDiv.innerHTML = `
        <div class="alert alert-warning">
          <div class="flex items-center gap-3">
            <i class="feather icon-clock text-warning-500 text-2xl"></i>
            <div class="flex-grow">
              <h6 class="mb-1">You have a pending leave request</h6>
              <p class="mb-0 text-sm">
                <strong>${leaveType ? leaveType.name : 'Leave'}</strong> from ${startDate} to ${endDate} 
                is currently pending approval. You cannot apply for another leave until this request is processed.
              </p>
            </div>
          </div>
        </div>
      `;
      alertDiv.style.display = 'block';

      // Hide apply tab and button
      const applyTab = document.getElementById('applyTab');
      const applyBtn = document.getElementById('applyLeaveBtn');
      if (applyTab) applyTab.style.display = 'none';
      if (applyBtn) applyBtn.style.display = 'none';
    } else {
      // Check for recent approved/rejected leaves to show status
      const allRequests = await window.API.getLeaveRequests({ 
        employeeId: currentUser.user.employee.id
      });
      
      const recentRequests = allRequests
        .filter(req => req.status === 'approved' || req.status === 'rejected')
        .sort((a, b) => new Date(b.approvedDate || b.appliedDate) - new Date(a.approvedDate || a.appliedDate))
        .slice(0, 1);

      if (recentRequests.length > 0) {
        const recent = recentRequests[0];
        const leaveTypes = await window.API.getLeaveTypes();
        const leaveType = leaveTypes.find(lt => lt.id === recent.leaveTypeId);
        const startDate = new Date(recent.startDate).toLocaleDateString();
        const endDate = new Date(recent.endDate).toLocaleDateString();
        const isApproved = recent.status === 'approved';

        alertDiv.innerHTML = `
          <div class="alert alert-${isApproved ? 'success' : 'danger'}">
            <div class="flex items-center gap-3">
              <i class="feather icon-${isApproved ? 'check-circle' : 'x-circle'} text-${isApproved ? 'success' : 'danger'}-500 text-2xl"></i>
              <div class="flex-grow">
                <h6 class="mb-1">Your leave request has been ${recent.status}</h6>
                <p class="mb-0 text-sm">
                  <strong>${leaveType ? leaveType.name : 'Leave'}</strong> from ${startDate} to ${endDate} 
                  has been ${recent.status}${recent.approvedDate ? ' on ' + new Date(recent.approvedDate).toLocaleDateString() : ''}.
                </p>
              </div>
            </div>
          </div>
        `;
        alertDiv.style.display = 'block';
      } else {
        alertDiv.style.display = 'none';
      }

      // Show apply tab and button if no pending leaves
      const applyTab = document.getElementById('applyTab');
      const applyBtn = document.getElementById('applyLeaveBtn');
      if (applyTab) applyTab.style.display = 'block';
      if (applyBtn) applyBtn.style.display = 'block';
    }
  } catch (error) {
    console.error('Error checking pending leaves:', error);
  }
}

function setupEventListeners() {
  const applyBtn = document.getElementById('applyLeaveBtn');
  if (applyBtn) applyBtn.addEventListener('click', async () => await showView('apply'));

  const requestsTab = document.getElementById('requestsTab');
  if (requestsTab) requestsTab.addEventListener('click', async () => await showView('requests'));

  const applyTab = document.getElementById('applyTab');
  if (applyTab) applyTab.addEventListener('click', async () => await showView('apply'));

  const historyTab = document.getElementById('historyTab');
  if (historyTab) historyTab.addEventListener('click', async () => await showView('history'));

  const leaveForm = document.getElementById('leaveForm');
  if (leaveForm) leaveForm.addEventListener('submit', handleLeaveSubmit);
}

async function showView(view) {
  currentView = view;
  
  // Hide all views
  const requestsView = document.getElementById('requestsView');
  const applyView = document.getElementById('applyView');
  const historyView = document.getElementById('historyView');
  
  if (requestsView) requestsView.style.display = 'none';
  if (applyView) applyView.style.display = 'none';
  if (historyView) historyView.style.display = 'none';
  
  // Update tab styles
  document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
  
  if (view === 'requests') {
    if (requestsView) requestsView.style.display = 'block';
    const requestsTab = document.getElementById('requestsTab');
    if (requestsTab) requestsTab.classList.add('active');
    await loadLeaveRequests();
  } else if (view === 'apply') {
    if (applyView) applyView.style.display = 'block';
    const applyTab = document.getElementById('applyTab');
    if (applyTab) applyTab.classList.add('active');
    await loadLeaveForm();
  } else if (view === 'history') {
    if (historyView) historyView.style.display = 'block';
    const historyTab = document.getElementById('historyTab');
    if (historyTab) historyTab.classList.add('active');
    await loadLeaveHistory();
    // Refresh pending leaves check when viewing history
    if (getCurrentUserRole() === 'employee') {
      await checkPendingLeaves();
    }
  }
}

// Make showView available globally for onclick handlers
window.showView = showView;

async function loadLeaveRequests() {
  try {
    const user = await getCurrentUser();
    const userRole = getCurrentUserRole();
    const container = document.getElementById('leaveRequestsContainer');
    if (!container) return;

    let requests;
    if (userRole === 'employee') {
      // Get current user's employee record
      const currentUser = await window.API.getCurrentUser();
      if (currentUser.user && currentUser.user.employee && currentUser.user.employee.id) {
        requests = await window.API.getLeaveRequests({ employeeId: currentUser.user.employee.id });
      } else {
        requests = [];
      }
    } else {
      requests = await window.API.getLeaveRequests();
    }

    if (requests.length === 0) {
      container.innerHTML = '<div class="text-center py-8 text-muted">No leave requests found.</div>';
      return;
    }

    const leaveTypes = await window.API.getLeaveTypes();
    const employees = userRole !== 'employee' ? await window.API.getEmployees() : [];

    container.innerHTML = requests.map(req => {
      const leaveType = leaveTypes.find(lt => lt.id === req.leaveTypeId);
      const employee = employees.find(emp => emp.id === req.employeeId);
      const startDate = new Date(req.startDate);
      const endDate = new Date(req.endDate);
      const days = req.days || Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

      return `
        <tr>
          ${userRole !== 'employee' ? `<td>${employee ? `${employee.firstName} ${employee.lastName}` : 'N/A'}</td>` : ''}
          <td>${leaveType ? leaveType.name : 'N/A'}</td>
          <td>${startDate.toLocaleDateString()}</td>
          <td>${endDate.toLocaleDateString()}</td>
          <td>${days}</td>
          <td>${req.reason || ''}</td>
          <td>
            <span class="badge ${
              req.status === 'approved' ? 'bg-success-500' : 
              req.status === 'rejected' ? 'bg-danger-500' : 
              'bg-warning-500'
            }">${req.status}</span>
          </td>
          ${userRole !== 'employee' ? `
            <td>
              ${req.status === 'pending' ? `
                <button class="btn btn-sm btn-success" onclick="approveLeave(${req.id})">Approve</button>
                <button class="btn btn-sm btn-danger" onclick="rejectLeave(${req.id})">Reject</button>
              ` : `
                <button class="btn btn-sm btn-primary" onclick="viewLeave(${req.id})">View</button>
              `}
            </td>
          ` : ''}
        </tr>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading leave requests:', error);
    const container = document.getElementById('leaveRequestsContainer');
    if (container) {
      container.innerHTML = '<div class="text-center py-8 text-danger">Error loading leave requests. Please refresh the page.</div>';
    }
  }
}

// Helper function to check if two date ranges overlap
function datesOverlap(start1, end1, start2, end2) {
  const s1 = new Date(start1);
  const e1 = new Date(end1);
  const s2 = new Date(start2);
  const e2 = new Date(end2);
  
  // Check if dates overlap (inclusive of boundaries)
  return (s1 <= e2 && e1 >= s2);
}

async function loadLeaveForm() {
  try {
    // Check for overlapping leaves before showing form
    const userRole = getCurrentUserRole();
    if (userRole === 'employee') {
      const currentUser = await window.API.getCurrentUser();
      if (currentUser.user && currentUser.user.employee && currentUser.user.employee.id) {
        // Get all existing leaves (pending and approved)
        const existingLeaves = await window.API.getLeaveRequests({ 
          employeeId: currentUser.user.employee.id
        });

        // Filter for pending or approved leaves (rejected leaves don't block new requests)
        const activeLeaves = existingLeaves.filter(leave => 
          leave.status === 'pending' || leave.status === 'approved'
        );

        if (activeLeaves.length > 0) {
          const applyView = document.getElementById('applyView');
          if (applyView) {
            const leaveTypes = await window.API.getLeaveTypes();
            const leaveList = activeLeaves.map(leave => {
              const leaveType = leaveTypes.find(lt => lt.id === leave.leaveTypeId);
              const startDate = new Date(leave.startDate).toLocaleDateString();
              const endDate = new Date(leave.endDate).toLocaleDateString();
              return `${leaveType ? leaveType.name : 'Leave'} (${startDate} - ${endDate}) - ${leave.status}`;
            }).join('<br>');

            applyView.innerHTML = `
              <div class="alert alert-warning">
                <div class="flex items-center gap-3">
                  <i class="feather icon-alert-circle text-warning-500 text-2xl"></i>
                  <div>
                    <h6 class="mb-1">Cannot Apply for Leave</h6>
                    <p class="mb-0">
                      You have active leave requests that may overlap with a new request. Please ensure your new leave dates don't conflict with existing leaves.
                    </p>
                    <div class="mt-2">
                      <strong>Active Leaves:</strong>
                      <div class="mt-1">${leaveList}</div>
                    </div>
                    <button class="btn btn-sm btn-primary mt-2" onclick="window.showView('history')">View Leave History</button>
                  </div>
                </div>
              </div>
            `;
          }
          // Don't return - still show the form but validation will prevent submission
        }
      }
    }

    const leaveTypes = await window.API.getLeaveTypes();
    const select = document.getElementById('leaveTypeId');
    if (!select) {
      console.error('Leave type select element not found');
      return;
    }

    if (leaveTypes.length === 0) {
      select.innerHTML = '<option value="">No leave types available. Please contact HR.</option>';
      return;
    }

    select.innerHTML = '<option value="">Select Leave Type</option>' +
      leaveTypes.map(lt => 
        `<option value="${lt.id}">${lt.name} (${lt.days} days available)</option>`
      ).join('');

    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    const startDateEl = document.getElementById('startDate');
    const endDateEl = document.getElementById('endDate');
    if (startDateEl) startDateEl.value = today;
    if (endDateEl) endDateEl.value = today;
  } catch (error) {
    console.error('Error loading leave form:', error);
    const select = document.getElementById('leaveTypeId');
    if (select) {
      select.innerHTML = '<option value="">Error loading leave types</option>';
    }
  }
}

async function loadLeaveHistory() {
  try {
    const user = await getCurrentUser();
    const userRole = getCurrentUserRole();
    const container = document.getElementById('leaveHistoryContainer');
    if (!container) return;

    let requests;
    if (userRole === 'employee') {
      const currentUser = await window.API.getCurrentUser();
      if (currentUser.user && currentUser.user.employee && currentUser.user.employee.id) {
        requests = await window.API.getLeaveRequests({ employeeId: currentUser.user.employee.id });
      } else {
        requests = [];
      }
    } else {
      requests = await window.API.getLeaveRequests();
    }

    // Sort by status priority (pending first, then by date)
    requests = requests.sort((a, b) => {
      const statusOrder = { 'pending': 0, 'approved': 1, 'rejected': 2 };
      const statusDiff = (statusOrder[a.status] || 3) - (statusOrder[b.status] || 3);
      if (statusDiff !== 0) return statusDiff;
      return new Date(b.appliedDate || b.createdAt) - new Date(a.appliedDate || a.createdAt);
    });

    if (requests.length === 0) {
      container.innerHTML = '<div class="text-center py-8 text-muted">No leave history found.</div>';
      return;
    }

    const leaveTypes = await window.API.getLeaveTypes();
    const employees = userRole !== 'employee' ? await window.API.getEmployees() : [];

    container.innerHTML = requests.map(req => {
      const leaveType = leaveTypes.find(lt => lt.id === req.leaveTypeId);
      const employee = employees.find(emp => emp.id === req.employeeId);
      const startDate = new Date(req.startDate);
      const endDate = new Date(req.endDate);
      const days = req.days || Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      const statusClass = req.status === 'approved' ? 'bg-success-500' : 
                         req.status === 'rejected' ? 'bg-danger-500' : 
                         'bg-warning-500';
      const statusText = req.status.charAt(0).toUpperCase() + req.status.slice(1);

      return `
        <tr class="${req.status === 'pending' ? 'bg-warning-50' : ''}">
          ${userRole !== 'employee' ? `<td>${employee ? `${employee.firstName} ${employee.lastName}` : 'N/A'}</td>` : ''}
          <td><strong>${leaveType ? leaveType.name : 'N/A'}</strong></td>
          <td>${startDate.toLocaleDateString()}</td>
          <td>${endDate.toLocaleDateString()}</td>
          <td>${days} day${days !== 1 ? 's' : ''}</td>
          <td>${req.reason || '<span class="text-muted">No reason provided</span>'}</td>
          <td>
            <span class="badge ${statusClass}">${statusText}</span>
            ${req.status === 'pending' ? '<br><small class="text-muted">Awaiting approval</small>' : ''}
          </td>
          <td>
            ${req.approvedDate ? new Date(req.approvedDate).toLocaleDateString() : 
              req.status === 'pending' ? '<span class="text-muted">-</span>' : 
              req.appliedDate ? new Date(req.appliedDate).toLocaleDateString() : '-'}
          </td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading leave history:', error);
    const container = document.getElementById('leaveHistoryContainer');
    if (container) {
      container.innerHTML = '<div class="text-center py-8 text-danger">Error loading leave history. Please refresh the page.</div>';
    }
  }
}

async function handleLeaveSubmit(e) {
  e.preventDefault();
  
  try {
    const user = await getCurrentUser();
    if (!user) {
      showNotification('Please log in first', 'error');
      if (window.Toast) window.Toast.error('Please log in first');
      return;
    }

    // Get current user's employee record
    const currentUser = await window.API.getCurrentUser();
    if (!currentUser.user || !currentUser.user.employee || !currentUser.user.employee.id) {
      showNotification('Employee record not found. Please contact HR to set up your employee profile.', 'error');
      if (window.Toast) window.Toast.error('Employee record not found. Please contact HR.');
      return;
    }

    // Check for overlapping leaves before submitting
    const userRole = getCurrentUserRole();
    if (userRole === 'employee') {
      // Get all existing leaves (pending and approved only - rejected don't block)
      const existingLeaves = await window.API.getLeaveRequests({ 
        employeeId: currentUser.user.employee.id
      });

      const activeLeaves = existingLeaves.filter(leave => 
        leave.status === 'pending' || leave.status === 'approved'
      );

      // Check for date overlaps
      const newStartDate = document.getElementById('startDate').value;
      const newEndDate = document.getElementById('endDate').value;

      const overlappingLeave = activeLeaves.find(leave => {
        return datesOverlap(
          newStartDate, 
          newEndDate, 
          leave.startDate, 
          leave.endDate
        );
      });

      if (overlappingLeave) {
        const leaveTypes = await window.API.getLeaveTypes();
        const leaveType = leaveTypes.find(lt => lt.id === overlappingLeave.leaveTypeId);
        const existingStart = new Date(overlappingLeave.startDate).toLocaleDateString();
        const existingEnd = new Date(overlappingLeave.endDate).toLocaleDateString();
        
        const errorMsg = `Your requested leave dates overlap with an existing ${overlappingLeave.status} leave: ${leaveType ? leaveType.name : 'Leave'} from ${existingStart} to ${existingEnd}. Please choose different dates.`;
        
        showNotification(errorMsg, 'error');
        if (window.Toast) window.Toast.error(errorMsg);
        await showView('history');
        return;
      }
    }

    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    if (days <= 0) {
      showNotification('End date must be after start date', 'error');
      if (window.Toast) window.Toast.error('End date must be after start date');
      return;
    }

    const leaveRequest = {
      employeeId: currentUser.user.employee.id,
      leaveTypeId: parseInt(document.getElementById('leaveTypeId').value),
      startDate: document.getElementById('startDate').value,
      endDate: document.getElementById('endDate').value,
      reason: document.getElementById('reason').value
    };

    await window.API.createLeaveRequest(leaveRequest);
    showNotification('Leave request submitted successfully', 'success');
    if (window.Toast) window.Toast.success('Leave request submitted successfully');
    document.getElementById('leaveForm').reset();
    
    // Refresh pending leaves check
    if (userRole === 'employee') {
      await checkPendingLeaves();
    }
    
    if (getCurrentUserRole() === 'employee') {
      await showView('history');
    } else {
      await showView('requests');
    }
  } catch (error) {
    console.error('Error submitting leave request:', error);
    const errorMessage = error.message || 'Error submitting leave request';
    showNotification(errorMessage, 'error');
    if (window.Toast) window.Toast.error(errorMessage);
  }
}

async function approveLeave(id) {
  try {
    const comments = await showPrompt(
      'Add approval comments (optional):',
      'Approve Leave Request',
      '',
      'Enter comments...',
      'textarea'
    );
    if (comments === null) return; // User cancelled
    
    await window.API.approveLeaveRequest(id, comments || '');
    showNotification('Leave request approved', 'success');
    await loadLeaveRequests();
  } catch (error) {
    console.error('Error approving leave:', error);
    showNotification(error.message || 'Error approving leave request', 'error');
  }
}

async function rejectLeave(id) {
  const confirmed = await showConfirm(
    'Are you sure you want to reject this leave request?',
    'Reject Leave Request',
    'Reject',
    'Cancel'
  );
  if (!confirmed) return;
  
  try {
    const comments = await showPrompt(
      'Add rejection reason (optional):',
      'Reject Leave Request',
      '',
      'Enter reason...',
      'textarea'
    );
    if (comments === null) return; // User cancelled
    
    await window.API.rejectLeaveRequest(id, comments || '');
    showNotification('Leave request rejected', 'success');
    await loadLeaveRequests();
  } catch (error) {
    console.error('Error rejecting leave:', error);
    showNotification(error.message || 'Error rejecting leave request', 'error');
  }
}

async function viewLeave(id) {
  try {
    const req = await window.API.getLeaveRequest(id);
    if (!req) return;

    const leaveType = (await window.API.getLeaveTypes()).find(lt => lt.id === req.leaveTypeId);
    const employee = req.employee ? req.employee : await window.API.getEmployee(req.employeeId);
    
    const details = `Employee: ${employee ? `${employee.firstName} ${employee.lastName}` : 'N/A'}\nLeave Type: ${leaveType ? leaveType.name : 'N/A'}\nStart Date: ${new Date(req.startDate).toLocaleDateString()}\nEnd Date: ${new Date(req.endDate).toLocaleDateString()}\nDays: ${req.days}\nReason: ${req.reason || 'N/A'}\nStatus: ${req.status}`;
    await showAlert(details, 'Leave Request Details', 'info');
  } catch (error) {
    console.error('Error viewing leave:', error);
    showNotification('Error loading leave details', 'error');
  }
}

function showNotification(message, type) {
  const notification = document.createElement('div');
  notification.className = `alert alert-${type === 'success' ? 'success' : 'danger'} fixed top-4 right-4 z-50`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

window.approveLeave = approveLeave;
window.rejectLeave = rejectLeave;
window.viewLeave = viewLeave;
