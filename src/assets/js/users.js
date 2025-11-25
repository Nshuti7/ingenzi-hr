/**
 * INGENZI HRMS - User Management Module (Admin Only)
 */

document.addEventListener('DOMContentLoaded', async function() {
  const userRole = getCurrentUserRole();
  if (userRole !== 'system_admin') {
    window.location.href = '../dashboard/index.html';
    return;
  }
  await loadUsers();
});

async function loadUsers() {
  const employees = await DB.getAll('employees');
  const container = document.getElementById('usersTableBody');
  if (!container) return;

  if (employees.length === 0) {
    container.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-muted">No users found.</td></tr>';
    return;
  }

  container.innerHTML = employees.map(emp => {
    // Determine role based on email or position
    let role = 'employee';
    if (emp.email.includes('hr@') || emp.position.toLowerCase().includes('hr')) {
      role = 'hr_manager';
    } else if (emp.email.includes('admin@')) {
      role = 'system_admin';
    }

    return `
      <tr>
        <td>${emp.email.split('@')[0]}</td>
        <td>${emp.email}</td>
        <td><span class="badge ${role === 'system_admin' ? 'bg-danger-500' : role === 'hr_manager' ? 'bg-warning-500' : 'bg-info-500'}">${role.replace('_', ' ')}</span></td>
        <td>${emp.employeeId}</td>
        <td><span class="badge ${emp.status === 'active' ? 'bg-success-500' : 'bg-danger-500'}">${emp.status}</span></td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="editUser(${emp.id})">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deactivateUser(${emp.id})">${emp.status === 'active' ? 'Deactivate' : 'Activate'}</button>
        </td>
      </tr>
    `;
  }).join('');
}

function editUser(id) {
  await showAlert('User editing functionality - to be implemented', 'Information', 'info');
}

async function deactivateUser(id) {
  const employee = await DB.getById('employees', id);
  if (!employee) return;

  const newStatus = employee.status === 'active' ? 'inactive' : 'active';
  const confirmed = await showConfirm(
    `Are you sure you want to ${newStatus === 'inactive' ? 'deactivate' : 'activate'} this user?`,
    `${newStatus === 'inactive' ? 'Deactivate' : 'Activate'} User`,
    newStatus === 'inactive' ? 'Deactivate' : 'Activate',
    'Cancel'
  );
  if (!confirmed) return;

  await DB.update('employees', id, { status: newStatus });
  await loadUsers();
  showNotification(`User ${newStatus === 'inactive' ? 'deactivated' : 'activated'} successfully`, 'success');
}

function showNotification(message, type) {
  const notification = document.createElement('div');
  notification.className = `alert alert-${type === 'success' ? 'success' : 'danger'} fixed top-4 right-4 z-50`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

window.editUser = editUser;
window.deactivateUser = deactivateUser;
