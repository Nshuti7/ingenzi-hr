/**
 * INGENZI HRMS - Leave Types Management Module
 * Handles CRUD operations for leave types
 */

let currentEditId = null;
let isSubmitting = false; // Flag to prevent duplicate submissions

document.addEventListener('DOMContentLoaded', async function() {
  const userRole = getCurrentUserRole();
  
  // Only HR Managers and Admins can access this page
  if (userRole !== 'hr_manager' && userRole !== 'system_admin') {
    window.location.href = '../dashboard/index.html';
    return;
  }

  if (!window.API) {
    console.error('API service not available');
    return;
  }

  await loadLeaveTypes();
  setupEventListeners();
});

function setupEventListeners() {
  const addBtn = document.getElementById('addLeaveTypeBtn');
  if (addBtn) {
    addBtn.addEventListener('click', showAddLeaveTypeModal);
  }

  const form = document.getElementById('leaveTypeForm');
  if (form) {
    form.addEventListener('submit', handleLeaveTypeSubmit);
  }

  const closeModal = document.getElementById('closeLeaveTypeModal');
  if (closeModal) {
    closeModal.addEventListener('click', closeLeaveTypeModal);
  }
}

async function loadLeaveTypes() {
  try {
    const leaveTypes = await window.API.getLeaveTypes();
    const tbody = document.getElementById('leaveTypesTableBody');
    
    if (!tbody) return;

    if (leaveTypes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center py-8 text-muted">No leave types found. Click "Add Leave Type" to get started.</td></tr>';
      return;
    }

    const userRole = getCurrentUserRole();
    const canDelete = userRole === 'system_admin' || userRole === 'hr_manager';

    tbody.innerHTML = leaveTypes.map(lt => `
      <tr>
        <td><strong>${lt.name}</strong></td>
        <td>${lt.days} day${lt.days !== 1 ? 's' : ''}</td>
        <td>${lt.description || '<span class="text-muted">No description</span>'}</td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="editLeaveType(${lt.id})">Edit</button>
          ${canDelete ? `<button class="btn btn-sm btn-danger" onclick="deleteLeaveType(${lt.id})">Delete</button>` : ''}
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading leave types:', error);
    const tbody = document.getElementById('leaveTypesTableBody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center py-8 text-danger">Error loading leave types. Please refresh the page.</td></tr>';
    }
  }
}

function showAddLeaveTypeModal() {
  currentEditId = null;
  const modal = document.getElementById('leaveTypeModal');
  const form = document.getElementById('leaveTypeForm');
  const modalTitle = document.getElementById('leaveTypeModalTitle');
  
  if (modalTitle) modalTitle.textContent = 'Add Leave Type';
  if (form) form.reset();
  
  if (modal) modal.style.display = 'block';
}

async function editLeaveType(id) {
  try {
    currentEditId = id;
    const leaveTypes = await window.API.getLeaveTypes();
    const leaveType = leaveTypes.find(lt => lt.id === id);
    
    if (!leaveType) {
      showNotification('Leave type not found', 'error');
      return;
    }

    const modal = document.getElementById('leaveTypeModal');
    const form = document.getElementById('leaveTypeForm');
    const modalTitle = document.getElementById('leaveTypeModalTitle');
    
    if (modalTitle) modalTitle.textContent = 'Edit Leave Type';
    if (form) {
      document.getElementById('leaveTypeName').value = leaveType.name;
      document.getElementById('leaveTypeDays').value = leaveType.days;
      document.getElementById('leaveTypeDescription').value = leaveType.description || '';
    }
    
    if (modal) modal.style.display = 'block';
  } catch (error) {
    console.error('Error loading leave type:', error);
    showNotification('Error loading leave type details', 'error');
  }
}

async function deleteLeaveType(id) {
  const confirmed = await showConfirm(
    'Are you sure you want to delete this leave type? This action cannot be undone.',
    'Delete Leave Type',
    'Delete',
    'Cancel'
  );
  if (!confirmed) return;
  
  try {
    await window.API.deleteLeaveType(id);
    await loadLeaveTypes();
    showNotification('Leave type deleted successfully', 'success');
    if (window.Toast) {
      window.Toast.success('Leave type deleted successfully');
    }
  } catch (error) {
    console.error('Error deleting leave type:', error);
    const errorMessage = error.message || 'Error deleting leave type';
    showNotification(errorMessage, 'error');
    if (window.Toast) {
      window.Toast.error(errorMessage);
    }
  }
}

async function handleLeaveTypeSubmit(e) {
  e.preventDefault();
  
  // Prevent duplicate submissions
  if (isSubmitting) {
    console.log('Submission already in progress, ignoring duplicate request');
    return;
  }

  const formData = {
    name: document.getElementById('leaveTypeName').value.trim(),
    days: parseInt(document.getElementById('leaveTypeDays').value),
    description: document.getElementById('leaveTypeDescription').value.trim() || null
  };

  // Validate
  if (!formData.name || !formData.days || formData.days < 1) {
    showNotification('Please fill in all required fields correctly', 'error');
    if (window.Toast) {
      window.Toast.error('Please fill in all required fields correctly');
    }
    return;
  }

  // Disable submit button and set submitting flag
  isSubmitting = true;
  const submitButton = e.target.querySelector('button[type="submit"]');
  const originalButtonText = submitButton ? submitButton.textContent : '';
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Saving...';
  }

  try {
    if (currentEditId) {
      await window.API.updateLeaveType(currentEditId, formData);
      showNotification('Leave type updated successfully', 'success');
      if (window.Toast) {
        window.Toast.success('Leave type updated successfully');
      }
    } else {
      await window.API.createLeaveType(formData);
      showNotification('Leave type added successfully', 'success');
      if (window.Toast) {
        window.Toast.success('Leave type added successfully');
      }
    }

    closeLeaveTypeModal();
    await loadLeaveTypes();
  } catch (error) {
    console.error('Error saving leave type:', error);
    const errorMessage = error.message || 'Error saving leave type';
    showNotification(errorMessage, 'error');
    if (window.Toast) {
      window.Toast.error(errorMessage);
    }
  } finally {
    // Re-enable submit button and reset flag
    isSubmitting = false;
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  }
}

function closeLeaveTypeModal() {
  const modal = document.getElementById('leaveTypeModal');
  if (modal) modal.style.display = 'none';
  currentEditId = null;
  isSubmitting = false; // Reset submitting flag
  const form = document.getElementById('leaveTypeForm');
  if (form) {
    form.reset();
    // Re-enable submit button if it was disabled
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = 'Save Leave Type';
    }
  }
}

function showNotification(message, type) {
  const notification = document.createElement('div');
  notification.className = `alert alert-${type === 'success' ? 'success' : 'danger'} fixed top-4 right-4 z-50`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

window.editLeaveType = editLeaveType;
window.deleteLeaveType = deleteLeaveType;

