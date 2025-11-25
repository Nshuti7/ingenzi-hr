/**
 * INGENZI HRMS - Recruitment Module
 * Uses Backend API instead of IndexedDB
 */

let currentEditId = null;

document.addEventListener('DOMContentLoaded', async function() {
  if (!window.API) {
    console.error('API service not available');
    return;
  }
  
  const userRole = getCurrentUserRole();
  if (userRole === 'employee') {
    window.location.href = '../dashboard/index.html';
    return;
  }
  await loadJobVacancies();
  setupEventListeners();
});

function setupEventListeners() {
  const addBtn = document.getElementById('addJobBtn');
  if (addBtn) addBtn.addEventListener('click', showAddJobModal);

  const jobForm = document.getElementById('jobForm');
  if (jobForm) jobForm.addEventListener('submit', handleJobSubmit);

  const closeModal = document.getElementById('closeJobModal');
  if (closeModal) closeModal.addEventListener('click', closeJobModal);
}

async function loadJobVacancies() {
  try {
    const jobs = await window.API.getJobVacancies();
    const container = document.getElementById('jobsContainer');
    if (!container) return;

    if (jobs.length === 0) {
      container.innerHTML = '<div class="col-span-12 text-center py-8 text-muted">No job vacancies found. Click "Post Job Vacancy" to get started.</div>';
      return;
    }

    const departments = await window.API.getDepartments();
    const applicants = await window.API.getApplicants();

    container.innerHTML = jobs.map(job => {
      const dept = departments.find(d => d.id === job.departmentId);
      const applicantCount = applicants.filter(app => app.jobVacancyId === job.id).length;
      
      return `
        <div class="col-span-12 md:col-span-6 lg:col-span-4">
          <div class="card">
            <div class="card-body">
              <h5 class="mb-2">${job.title}</h5>
              <p class="text-muted mb-2">${dept ? dept.name : 'N/A'}</p>
              <p class="mb-2"><strong>Opening:</strong> ${new Date(job.openingDate).toLocaleDateString()}</p>
              <p class="mb-2"><strong>Closing:</strong> ${new Date(job.closingDate).toLocaleDateString()}</p>
              <p class="mb-2"><strong>Applicants:</strong> ${applicantCount}</p>
              <p class="mb-3">
                <span class="badge ${job.status === 'open' ? 'bg-success-500' : 'bg-danger-500'}">${job.status}</span>
              </p>
              <div class="flex gap-2 flex-wrap">
                <button class="btn btn-sm btn-primary" onclick="viewJob(${job.id})">View</button>
                <button class="btn btn-sm btn-secondary" onclick="editJob(${job.id})">Edit</button>
                <button class="btn btn-sm btn-info" onclick="viewApplicants(${job.id})">Applicants (${applicantCount})</button>
                ${job.status === 'open' ? `<a href="../pages/apply.html?id=${job.id}" target="_blank" class="btn btn-sm btn-success" title="Share this link for applications">
                  <i class="feather icon-link me-1"></i>Application Link
                </a>` : ''}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading job vacancies:', error);
    const container = document.getElementById('jobsContainer');
    if (container) {
      container.innerHTML = '<div class="col-span-12 text-center py-8 text-danger">Error loading job vacancies. Please refresh the page.</div>';
    }
  }
}

async function showAddJobModal() {
  currentEditId = null;
  const modal = document.getElementById('jobModal');
  const form = document.getElementById('jobForm');
  const modalTitle = document.getElementById('jobModalTitle');
  
  if (modalTitle) modalTitle.textContent = 'Post Job Vacancy';
  if (form) form.reset();
  
  await loadDepartmentsDropdown();
  
  // Set default dates
  const today = new Date().toISOString().split('T')[0];
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  document.getElementById('openingDate').value = today;
  document.getElementById('closingDate').value = nextMonth.toISOString().split('T')[0];
  
  if (modal) modal.style.display = 'block';
}

async function editJob(id) {
  try {
    currentEditId = id;
    const job = await window.API.getJobVacancy(id);
    if (!job) return;

    const modal = document.getElementById('jobModal');
    const form = document.getElementById('jobForm');
    const modalTitle = document.getElementById('jobModalTitle');
    
    if (modalTitle) modalTitle.textContent = 'Edit Job Vacancy';
    if (form) {
      document.getElementById('jobTitle').value = job.title;
      document.getElementById('jobDepartmentId').value = job.departmentId;
      document.getElementById('jobDescription').value = job.description || '';
      document.getElementById('jobRequirements').value = job.requirements || '';
      document.getElementById('openingDate').value = job.openingDate ? job.openingDate.split('T')[0] : '';
      document.getElementById('closingDate').value = job.closingDate ? job.closingDate.split('T')[0] : '';
      document.getElementById('jobStatus').value = job.status;
    }
    
    await loadDepartmentsDropdown();
    if (modal) modal.style.display = 'block';
  } catch (error) {
    console.error('Error loading job:', error);
    showNotification('Error loading job details', 'error');
  }
}

async function viewJob(id) {
  try {
    const job = await window.API.getJobVacancy(id);
    if (!job) return;

    const dept = job.department ? job.department : await window.API.getDepartment(job.departmentId);
    const details = `Title: ${job.title}\nDepartment: ${dept ? dept.name : 'N/A'}\nDescription: ${job.description || 'N/A'}\nRequirements: ${job.requirements || 'N/A'}\nOpening Date: ${new Date(job.openingDate).toLocaleDateString()}\nClosing Date: ${new Date(job.closingDate).toLocaleDateString()}\nStatus: ${job.status}`;
    await showAlert(details, 'Job Details', 'info');
  } catch (error) {
    console.error('Error viewing job:', error);
    showNotification('Error loading job details', 'error');
  }
}

async function viewApplicants(jobId) {
  try {
    const applicants = await window.API.getApplicants({ jobVacancyId: jobId });
    if (applicants.length === 0) {
      await showAlert('No applicants for this job', 'No Applicants', 'info');
      return;
    }
    
    const list = applicants.map(app => `- ${app.firstName} ${app.lastName} (${app.email}) - ${app.status}`).join('\n');
    await showAlert(`Applicants:\n\n${list}`, 'Job Applicants', 'info');
  } catch (error) {
    console.error('Error loading applicants:', error);
    showNotification('Error loading applicants', 'error');
  }
}

async function handleJobSubmit(e) {
  e.preventDefault();
  
  const formData = {
    title: document.getElementById('jobTitle').value,
    departmentId: parseInt(document.getElementById('jobDepartmentId').value),
    description: document.getElementById('jobDescription').value,
    requirements: document.getElementById('jobRequirements').value,
    openingDate: document.getElementById('openingDate').value,
    closingDate: document.getElementById('closingDate').value,
    status: document.getElementById('jobStatus').value
  };

  try {
    if (currentEditId) {
      await window.API.updateJobVacancy(currentEditId, formData);
      showNotification('Job vacancy updated successfully', 'success');
    } else {
      await window.API.createJobVacancy(formData);
      showNotification('Job vacancy posted successfully', 'success');
    }

    closeJobModal();
    await loadJobVacancies();
  } catch (error) {
    console.error('Error saving job:', error);
    showNotification(error.message || 'Error saving job vacancy', 'error');
  }
}

async function loadDepartmentsDropdown() {
  try {
    const departments = await window.API.getDepartments();
    const select = document.getElementById('jobDepartmentId');
    if (!select) return;

    select.innerHTML = '<option value="">Select Department</option>' +
      departments.map(dept => 
        `<option value="${dept.id}">${dept.name}</option>`
      ).join('');
  } catch (error) {
    console.error('Error loading departments:', error);
  }
}

function closeJobModal() {
  const modal = document.getElementById('jobModal');
  if (modal) modal.style.display = 'none';
  currentEditId = null;
  const form = document.getElementById('jobForm');
  if (form) form.reset();
}

function showNotification(message, type) {
  const notification = document.createElement('div');
  notification.className = `alert alert-${type === 'success' ? 'success' : 'danger'} fixed top-4 right-4 z-50`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

window.viewJob = viewJob;
window.editJob = editJob;
window.viewApplicants = viewApplicants;
