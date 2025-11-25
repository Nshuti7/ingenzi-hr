/**
 * INGENZI HRMS - Backup & Restore Module (Admin Only)
 */

document.addEventListener('DOMContentLoaded', function() {
  const userRole = getCurrentUserRole();
  if (userRole !== 'system_admin') {
    window.location.href = '../dashboard/index.html';
    return;
  }
  setupEventListeners();
});

function setupEventListeners() {
  const backupBtn = document.getElementById('backupBtn');
  if (backupBtn) backupBtn.addEventListener('click', createBackup);

  const restoreBtn = document.getElementById('restoreBtn');
  if (restoreBtn) restoreBtn.addEventListener('click', showRestoreModal);

  const restoreForm = document.getElementById('restoreForm');
  if (restoreForm) restoreForm.addEventListener('submit', handleRestore);
}

async function createBackup() {
  const backupData = await DB.backup();
  const blob = new Blob([backupData], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hrms_backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  showNotification('Backup created and downloaded successfully', 'success');
}

function showRestoreModal() {
  const modal = document.getElementById('restoreModal');
  if (modal) modal.style.display = 'block';
}

async function handleRestore(e) {
  e.preventDefault();
  const fileInput = document.getElementById('backupFile');
  const file = fileInput.files[0];
  
  if (!file) {
    await showAlert('Please select a backup file', 'No File Selected', 'warning');
    return;
  }

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const backupData = e.target.result;
      if (await DB.restore(backupData)) {
        showNotification('Data restored successfully. Please refresh the page.', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        showNotification('Failed to restore backup. Please check the file format.', 'error');
      }
    } catch (error) {
      showNotification('Error reading backup file: ' + error.message, 'error');
    }
  };
  reader.readAsText(file);
  
  closeRestoreModal();
}

function closeRestoreModal() {
  const modal = document.getElementById('restoreModal');
  if (modal) modal.style.display = 'none';
  const form = document.getElementById('restoreForm');
  if (form) form.reset();
}

function showNotification(message, type) {
  const notification = document.createElement('div');
  notification.className = `alert alert-${type === 'success' ? 'success' : 'danger'} fixed top-4 right-4 z-50`;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

window.closeRestoreModal = closeRestoreModal;
