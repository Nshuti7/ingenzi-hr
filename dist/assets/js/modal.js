/**
 * INGENZI HRMS - Modal Service
 * Replaces browser confirm(), alert(), and prompt() with custom modals
 */

(function() {
  'use strict';

  // Create modal container if it doesn't exist
  function getModalContainer() {
    let container = document.getElementById('modalServiceContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'modalServiceContainer';
      container.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9999; display: none;';
      container.innerHTML = '<div class="modal-backdrop" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5);"></div>';
      document.body.appendChild(container);
    }
    return container;
  }

  // Remove modal from DOM
  function removeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.remove();
    }
    const container = getModalContainer();
    if (container.querySelectorAll('.modal').length === 0) {
      container.style.display = 'none';
    }
  }

  // Show modal with animation
  function showModal(modalId) {
    const container = getModalContainer();
    const modal = document.getElementById(modalId);
    if (modal) {
      container.style.display = 'block';
      setTimeout(() => {
        modal.classList.add('show');
        modal.style.display = 'block';
      }, 10);
    }
  }

  // Hide modal with animation
  function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('show');
      setTimeout(() => {
        removeModal(modalId);
      }, 300);
    }
  }

  /**
   * Show a confirmation dialog
   * @param {string} message - The message to display
   * @param {string} title - The title of the dialog (default: 'Confirm')
   * @param {string} confirmText - Text for confirm button (default: 'Yes')
   * @param {string} cancelText - Text for cancel button (default: 'No')
   * @returns {Promise<boolean>} - Resolves to true if confirmed, false if cancelled
   */
  window.showConfirm = function(message, title = 'Confirm', confirmText = 'Yes', cancelText = 'No') {
    return new Promise((resolve) => {
      const modalId = 'modal_' + Date.now();
      const container = getModalContainer();
      
      const modalHTML = `
        <div id="${modalId}" class="modal" style="display: none; position: relative; z-index: 10000;">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">${escapeHtml(title)}</h5>
                <button type="button" class="btn-close" data-dismiss="modal">&times;</button>
              </div>
              <div class="modal-body">
                <p>${escapeHtml(message)}</p>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-action="cancel">${escapeHtml(cancelText)}</button>
                <button type="button" class="btn btn-primary" data-action="confirm">${escapeHtml(confirmText)}</button>
              </div>
            </div>
          </div>
        </div>
      `;
      
      container.insertAdjacentHTML('beforeend', modalHTML);
      const modal = document.getElementById(modalId);
      
      // Handle button clicks
      modal.querySelector('[data-action="confirm"]').addEventListener('click', () => {
        hideModal(modalId);
        resolve(true);
      });
      
      modal.querySelector('[data-action="cancel"]').addEventListener('click', () => {
        hideModal(modalId);
        resolve(false);
      });
      
      modal.querySelector('[data-dismiss="modal"]').addEventListener('click', () => {
        hideModal(modalId);
        resolve(false);
      });
      
      // Close on backdrop click (only for this modal)
      const backdropClickHandler = (e) => {
        if (e.target === e.currentTarget && document.getElementById(modalId)) {
          hideModal(modalId);
          resolve(false);
          container.querySelector('.modal-backdrop').removeEventListener('click', backdropClickHandler);
        }
      };
      container.querySelector('.modal-backdrop').addEventListener('click', backdropClickHandler);
      
      // Close on Escape key
      const escapeHandler = (e) => {
        if (e.key === 'Escape') {
          hideModal(modalId);
          resolve(false);
          document.removeEventListener('keydown', escapeHandler);
        }
      };
      document.addEventListener('keydown', escapeHandler);
      
      showModal(modalId);
    });
  };

  /**
   * Show an alert dialog
   * @param {string} message - The message to display
   * @param {string} title - The title of the dialog (default: 'Alert')
   * @param {string} type - Type of alert: 'info', 'success', 'warning', 'error' (default: 'info')
   * @returns {Promise<void>} - Resolves when dialog is closed
   */
  window.showAlert = function(message, title = 'Alert', type = 'info') {
    return new Promise((resolve) => {
      const modalId = 'modal_' + Date.now();
      const container = getModalContainer();
      
      const iconMap = {
        info: '<i class="feather icon-info text-primary"></i>',
        success: '<i class="feather icon-check-circle text-success"></i>',
        warning: '<i class="feather icon-alert-triangle text-warning"></i>',
        error: '<i class="feather icon-alert-circle text-danger"></i>'
      };
      
      const icon = iconMap[type] || iconMap.info;
      
      const modalHTML = `
        <div id="${modalId}" class="modal" style="display: none; position: relative; z-index: 10000;">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">${icon} ${escapeHtml(title)}</h5>
                <button type="button" class="btn-close" data-dismiss="modal">&times;</button>
              </div>
              <div class="modal-body">
                <p>${escapeHtml(message)}</p>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-primary" data-action="ok">OK</button>
              </div>
            </div>
          </div>
        </div>
      `;
      
      container.insertAdjacentHTML('beforeend', modalHTML);
      const modal = document.getElementById(modalId);
      
      // Handle button click
      modal.querySelector('[data-action="ok"]').addEventListener('click', () => {
        hideModal(modalId);
        resolve();
      });
      
      modal.querySelector('[data-dismiss="modal"]').addEventListener('click', () => {
        hideModal(modalId);
        resolve();
      });
      
      // Close on backdrop click (only for this modal)
      const backdropClickHandler = (e) => {
        if (e.target === e.currentTarget && document.getElementById(modalId)) {
          hideModal(modalId);
          resolve();
          container.querySelector('.modal-backdrop').removeEventListener('click', backdropClickHandler);
        }
      };
      container.querySelector('.modal-backdrop').addEventListener('click', backdropClickHandler);
      
      // Close on Escape key
      const escapeHandler = (e) => {
        if (e.key === 'Escape') {
          hideModal(modalId);
          resolve();
          document.removeEventListener('keydown', escapeHandler);
        }
      };
      document.addEventListener('keydown', escapeHandler);
      
      showModal(modalId);
    });
  };

  /**
   * Show a prompt dialog (input field)
   * @param {string} message - The message to display
   * @param {string} title - The title of the dialog (default: 'Input')
   * @param {string} defaultValue - Default value for input (default: '')
   * @param {string} placeholder - Placeholder text (default: '')
   * @param {string} inputType - Input type: 'text', 'textarea', 'number', etc. (default: 'text')
   * @returns {Promise<string|null>} - Resolves to input value if confirmed, null if cancelled
   */
  window.showPrompt = function(message, title = 'Input', defaultValue = '', placeholder = '', inputType = 'text') {
    return new Promise((resolve) => {
      const modalId = 'modal_' + Date.now();
      const container = getModalContainer();
      
      const inputHTML = inputType === 'textarea' 
        ? `<textarea class="form-control" id="${modalId}_input" placeholder="${escapeHtml(placeholder)}" rows="4">${escapeHtml(defaultValue)}</textarea>`
        : `<input type="${escapeHtml(inputType)}" class="form-control" id="${modalId}_input" placeholder="${escapeHtml(placeholder)}" value="${escapeHtml(defaultValue)}">`;
      
      const modalHTML = `
        <div id="${modalId}" class="modal" style="display: none; position: relative; z-index: 10000;">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">${escapeHtml(title)}</h5>
                <button type="button" class="btn-close" data-dismiss="modal">&times;</button>
              </div>
              <div class="modal-body">
                <p>${escapeHtml(message)}</p>
                ${inputHTML}
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-action="cancel">Cancel</button>
                <button type="button" class="btn btn-primary" data-action="confirm">OK</button>
              </div>
            </div>
          </div>
        </div>
      `;
      
      container.insertAdjacentHTML('beforeend', modalHTML);
      const modal = document.getElementById(modalId);
      const input = document.getElementById(modalId + '_input');
      
      // Focus input
      setTimeout(() => input.focus(), 100);
      
      // Handle Enter key on input
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && inputType !== 'textarea') {
          e.preventDefault();
          modal.querySelector('[data-action="confirm"]').click();
        }
      });
      
      // Handle button clicks
      modal.querySelector('[data-action="confirm"]').addEventListener('click', () => {
        const value = input.value.trim();
        hideModal(modalId);
        resolve(value || null);
      });
      
      modal.querySelector('[data-action="cancel"]').addEventListener('click', () => {
        hideModal(modalId);
        resolve(null);
      });
      
      modal.querySelector('[data-dismiss="modal"]').addEventListener('click', () => {
        hideModal(modalId);
        resolve(null);
      });
      
      // Close on backdrop click
      container.querySelector('.modal-backdrop').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
          hideModal(modalId);
          resolve(null);
        }
      });
      
      // Close on Escape key
      const escapeHandler = (e) => {
        if (e.key === 'Escape') {
          hideModal(modalId);
          resolve(null);
          document.removeEventListener('keydown', escapeHandler);
        }
      };
      document.addEventListener('keydown', escapeHandler);
      
      showModal(modalId);
    });
  };

  // Helper function to escape HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Add CSS for modal animations
  if (!document.getElementById('modalServiceStyles')) {
    const style = document.createElement('style');
    style.id = 'modalServiceStyles';
    style.textContent = `
      #modalServiceContainer .modal {
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      #modalServiceContainer .modal.show {
        opacity: 1;
      }
      #modalServiceContainer .modal-dialog {
        transform: scale(0.9);
        transition: transform 0.3s ease;
      }
      #modalServiceContainer .modal.show .modal-dialog {
        transform: scale(1);
      }
    `;
    document.head.appendChild(style);
  }
})();

