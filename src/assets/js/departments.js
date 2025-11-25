/**
 * INGENZI HRMS - Department Management Module
 * Uses Backend API instead of IndexedDB
 */

let currentEditId = null;

document.addEventListener('DOMContentLoaded', async function() {
  if (!window.API) {
    console.error('API service not available');
    return;
  }
  await loadDepartments();
  setupEventListeners();
});

function setupEventListeners() {
  const addBtn = document.getElementById('addDepartmentBtn');
  if (addBtn) addBtn.addEventListener('click', showAddDepartmentModal);

  const form = document.getElementById('departmentForm');
  if (form) form.addEventListener('submit', handleDepartmentSubmit);

  const closeModal = document.getElementById('closeDepartmentModal');
  if (closeModal) closeModal.addEventListener('click', closeDepartmentModal);
}

async function loadDepartments() {
  const userRole = getCurrentUserRole();
  if (userRole === 'employee') {
    window.location.href = '../dashboard/index.html';
    return;
  }

  try {
    const departments = await window.API.getDepartments();
    const employees = await window.API.getEmployees();
    const container = document.getElementById('departmentsContainer');
    
    if (!container) return;

    if (departments.length === 0) {
      container.innerHTML = '<div class="col-span-12 text-center py-8 text-muted">No departments found. Click "Add Department" to get started.</div>';
      return;
    }

    container.innerHTML = departments.map(dept => {
      const empCount = employees.filter(emp => emp.departmentId === dept.id).length;
      return `
        <div class="col-span-12 md:col-span-6 lg:col-span-4">
          <div class="card">
            <div class="card-body">
              <div class="flex items-center justify-between mb-3">
                <h5 class="mb-0">${dept.name}</h5>
                <div class="flex gap-2">
                  <button class="btn btn-sm btn-secondary" onclick="editDepartment(${dept.id})">Edit</button>
                  <button class="btn btn-sm btn-danger" onclick="deleteDepartment(${dept.id})">Delete</button>
                </div>
              </div>
              <p class="text-muted mb-2">${dept.description || ''}</p>
              <p class="mb-0"><strong>Employees:</strong> ${empCount}</p>
              <p class="mb-0">
                <span class="badge ${dept.status === 'active' ? 'bg-success-500' : 'bg-danger-500'}">${dept.status}</span>
              </p>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading departments:', error);
    const container = document.getElementById('departmentsContainer');
    if (container) {
      container.innerHTML = '<div class="col-span-12 text-center py-8 text-danger">Error loading departments. Please refresh the page.</div>';
    }
  }
}

function showAddDepartmentModal() {
  currentEditId = null;
  const modal = document.getElementById('departmentModal');
  const form = document.getElementById('departmentForm');
  const modalTitle = document.getElementById('departmentModalTitle');
  
  if (modalTitle) modalTitle.textContent = 'Add Department';
  if (form) form.reset();
  if (modal) modal.style.display = 'block';
}

async function editDepartment(id) {
  try {
    currentEditId = id;
    const dept = await window.API.getDepartment(id);
    if (!dept) return;

    const modal = document.getElementById('departmentModal');
    const form = document.getElementById('departmentForm');
    const modalTitle = document.getElementById('departmentModalTitle');
    
    if (modalTitle) modalTitle.textContent = 'Edit Department';
    if (form) {
      document.getElementById('deptName').value = dept.name;
      document.getElementById('deptDescription').value = dept.description || '';
      document.getElementById('deptStatus').value = dept.status;
    }
    if (modal) modal.style.display = 'block';
  } catch (error) {
    console.error('Error loading department:', error);
    showNotification('Error loading department details', 'error');
  }
}

async function deleteDepartment(id) {
  try {
    // Check if department has employees
    const allEmployees = await window.API.getEmployees();
    const employees = allEmployees.filter(emp => emp.departmentId === id);
    if (employees.length > 0) {
      await showAlert(
        `Cannot delete department. It has ${employees.length} employee(s). Please reassign employees first.`,
        'Cannot Delete Department',
        'warning'
      );
      return;
    }

    const confirmed = await showConfirm(
      'Are you sure you want to delete this department?',
      'Delete Department',
      'Delete',
      'Cancel'
    );
    if (!confirmed) return;
    
    await window.API.deleteDepartment(id);
    await loadDepartments();
    showNotification('Department deleted successfully', 'success');
  } catch (error) {
    console.error('Error deleting department:', error);
    showNotification(error.message || 'Error deleting department', 'error');
  }
}

async function handleDepartmentSubmit(e) {
  e.preventDefault();
  
  const formData = {
    name: document.getElementById('deptName').value,
    description: document.getElementById('deptDescription').value,
    status: document.getElementById('deptStatus').value
  };

  try {
    if (currentEditId) {
      await window.API.updateDepartment(currentEditId, formData);
      showNotification('Department updated successfully', 'success');
    } else {
      await window.API.createDepartment(formData);
      showNotification('Department added successfully', 'success');
    }

    closeDepartmentModal();
    await loadDepartments();
  } catch (error) {
    console.error('Error saving department:', error);
    showNotification(error.message || 'Error saving department', 'error');
  }
}

function closeDepartmentModal() {
  const modal = document.getElementById('departmentModal');
  if (modal) modal.style.display = 'none';
  currentEditId = null;
  const form = document.getElementById('departmentForm');
  if (form) form.reset();
}

function showNotification(message, type) {
  const notification = document.createElement('div');
  notification.className = `alert alert-${type === 'success' ? 'success' : 'danger'} fixed top-4 right-4 z-50`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

window.editDepartment = editDepartment;
window.deleteDepartment = deleteDepartment;
