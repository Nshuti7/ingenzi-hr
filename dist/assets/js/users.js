/**
 * INGENZI HRMS - User Management Module (Admin Only)
 */

document.addEventListener('DOMContentLoaded', async function() {
  const userRole = getCurrentUserRole();
  if (userRole !== 'system_admin') {
    window.location.href = '../dashboard/index.html';
    return;
  }
  
  // Initialize modal handlers
  const modal = document.getElementById('userModal');
  const form = document.getElementById('userForm');
  const closeBtn = document.getElementById('closeUserModal');
  const cancelBtn = document.getElementById('cancelUserModal');
  
  if (modal && form) {
    // Close modal function
    const closeModal = () => {
      if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
      }
    };

    // Close button handlers
    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', closeModal);
    }

    // Form submission handler
    const handleFormSubmit = async (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      // Get form reference
      const formElement = document.getElementById('userForm');
      if (!formElement) {
        showAlert('Form not found. Please refresh the page.', 'Error', 'error');
        return;
      }
      
      // Use FormData API for reliable form value extraction (requires name attributes)
      const formData = new FormData(formElement);
      
      // Get values from FormData
      const finalName = (formData.get('userName') || '').trim();
      const finalEmail = (formData.get('userEmail') || '').trim();
      const finalPassword = formData.get('userPassword') || '';
      const finalRole = formData.get('userRole') || '';
      
      const userData = {
        name: finalName,
        email: finalEmail,
        password: finalPassword,
        role: finalRole
      };

      // Validate with better error messages
      if (!finalName || finalName.length === 0) {
        showAlert('Full name is required. Please enter a name.', 'Validation Error', 'error');
        const nameField = formElement.querySelector('#userName') || document.getElementById('userName');
        if (nameField) nameField.focus();
        return;
      }
      
      if (!finalEmail || finalEmail.length === 0) {
        showAlert('Email address is required. Please enter an email.', 'Validation Error', 'error');
        const emailField = formElement.querySelector('#userEmail') || document.getElementById('userEmail');
        if (emailField) emailField.focus();
        return;
      }
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(finalEmail)) {
        showAlert('Please enter a valid email address.', 'Validation Error', 'error');
        const emailField = formElement.querySelector('#userEmail') || document.getElementById('userEmail');
        if (emailField) emailField.focus();
        return;
      }
      
      if (!finalPassword || finalPassword.length < 6) {
        showAlert('Password must be at least 6 characters long.', 'Validation Error', 'error');
        const passwordField = formElement.querySelector('#userPassword') || document.getElementById('userPassword');
        if (passwordField) passwordField.focus();
        return;
      }
      
      if (!finalRole) {
        showAlert('Please select a role.', 'Validation Error', 'error');
        const roleField = formElement.querySelector('#userRole') || document.getElementById('userRole');
        if (roleField) roleField.focus();
        return;
      }

      try {
        await window.API.register(userData);
        showNotification('User created successfully', 'success');
        closeModal();
        await loadUsers();
      } catch (error) {
        console.error('Error creating user:', error);
        showAlert(error.message || 'Failed to create user', 'Error', 'error');
      }
    };
    
    // Attach form submit handler
    form.addEventListener('submit', handleFormSubmit);
    
    // Also handle the submit button click directly
    const submitButton = document.querySelector('button[form="userForm"]');
    if (submitButton) {
      submitButton.addEventListener('click', (e) => {
        e.preventDefault();
        handleFormSubmit(e);
      });
    }
  }
  
  await loadUsers();
});

async function loadUsers() {
  try {
    const users = await window.API.getUsers();
    const container = document.getElementById('usersTableBody');
    if (!container) return;

    if (users.length === 0) {
      container.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-muted">No users found.</td></tr>';
      return;
    }

    container.innerHTML = users.map(user => {
      const roleBadgeClass = user.role === 'system_admin' ? 'bg-danger-500' : 
                            user.role === 'hr_manager' ? 'bg-warning-500' : 'bg-info-500';
      const roleDisplay = user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      const employeeStatus = user.employee?.status || 'N/A';
      const statusBadgeClass = employeeStatus === 'active' ? 'bg-success-500' : 'bg-danger-500';
      
      return `
        <tr>
          <td>${user.name || user.email.split('@')[0]}</td>
          <td>${user.email}</td>
          <td><span class="badge ${roleBadgeClass}">${roleDisplay}</span></td>
          <td>${user.employeeId || 'N/A'}</td>
          <td><span class="badge ${statusBadgeClass}">${employeeStatus}</span></td>
          <td>
            <button class="btn btn-sm btn-secondary" onclick="editUser(${user.id})">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="toggleUserStatus(${user.id}, '${employeeStatus}')">
              ${employeeStatus === 'active' ? 'Deactivate' : 'Activate'}
            </button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading users:', error);
    const container = document.getElementById('usersTableBody');
    if (container) {
      container.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-danger">Error loading users. Please try again.</td></tr>';
    }
    showAlert(error.message || 'Failed to load users', 'Error', 'error');
  }
}

async function editUser(id) {
  try {
    const user = await window.API.getUser(id);
    
    // Show edit modal with user data
    const result = await showPrompt(
      `Edit User: ${user.email}`,
      'Update User Information',
      JSON.stringify({
        name: user.name,
        role: user.role,
        employeeId: user.employeeId || ''
      }, null, 2),
      'Enter user data as JSON',
      'textarea'
    );

    if (!result) return;

    try {
      const updateData = JSON.parse(result);
      await window.API.updateUser(id, updateData);
      showNotification('User updated successfully', 'success');
      await loadUsers();
    } catch (parseError) {
      showAlert('Invalid JSON format. Please try again.', 'Error', 'error');
    }
  } catch (error) {
    console.error('Error editing user:', error);
    showAlert(error.message || 'Failed to edit user', 'Error', 'error');
  }
}

async function toggleUserStatus(id, currentStatus) {
  try {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const confirmed = await showConfirm(
      `Are you sure you want to ${newStatus === 'inactive' ? 'deactivate' : 'activate'} this user?`,
      `${newStatus === 'inactive' ? 'Deactivate' : 'Activate'} User`,
      newStatus === 'inactive' ? 'Deactivate' : 'Activate',
      'Cancel'
    );
    
    if (!confirmed) return;

    await window.API.updateUserStatus(id, newStatus);
    showNotification(`User ${newStatus === 'inactive' ? 'deactivated' : 'activated'} successfully`, 'success');
    await loadUsers();
  } catch (error) {
    console.error('Error updating user status:', error);
    showAlert(error.message || 'Failed to update user status', 'Error', 'error');
  }
}

function showCreateUserModal() {
  const modal = document.getElementById('userModal');
  const form = document.getElementById('userForm');
  const modalTitle = document.getElementById('userModalTitle');
  
  if (!modal || !form) {
    showAlert('Modal elements not found', 'Error', 'error');
    return;
  }

  // Reset form
  if (form) form.reset();
  if (modalTitle) modalTitle.textContent = 'Create User Account';
  
  // Show modal
  if (modal) {
    modal.style.display = 'block';
    modal.classList.add('show');
  }
}


async function createUser() {
  showCreateUserModal();
}

function showNotification(message, type) {
  // Use toast notification if available, otherwise create a simple alert
  if (typeof showToast === 'function') {
    showToast(message, type);
  } else {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'success' ? 'success' : 'danger'} fixed top-4 right-4 z-50 p-4 rounded shadow-lg`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }
}

// Make functions globally available
window.editUser = editUser;
window.toggleUserStatus = toggleUserStatus;
window.createUser = createUser;
