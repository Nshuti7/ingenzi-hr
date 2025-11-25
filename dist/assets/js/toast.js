/**
 * INGENZI HRMS - Toast Notification Service
 * Provides toast notifications for user feedback
 */

class ToastService {
  constructor() {
    this.container = null;
    this.init();
  }

  init() {
    // Create toast container if it doesn't exist
    if (!document.getElementById('toast-container')) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
      `;
      document.body.appendChild(this.container);
    } else {
      this.container = document.getElementById('toast-container');
    }
  }

  show(message, type = 'info', duration = 5000) {
    const toast = document.createElement('div');
    const toastId = 'toast-' + Date.now();
    toast.id = toastId;
    
    // Determine icon and colors based on type
    const config = {
      success: {
        icon: '✓',
        bgColor: '#10b981',
        textColor: '#ffffff',
        borderColor: '#059669'
      },
      error: {
        icon: '✕',
        bgColor: '#ef4444',
        textColor: '#ffffff',
        borderColor: '#dc2626'
      },
      warning: {
        icon: '⚠',
        bgColor: '#f59e0b',
        textColor: '#ffffff',
        borderColor: '#d97706'
      },
      info: {
        icon: 'ℹ',
        bgColor: '#3b82f6',
        textColor: '#ffffff',
        borderColor: '#2563eb'
      }
    };

    const style = config[type] || config.info;

    toast.style.cssText = `
      background-color: ${style.bgColor};
      color: ${style.textColor};
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 300px;
      max-width: 400px;
      pointer-events: auto;
      animation: slideInRight 0.3s ease-out;
      border-left: 4px solid ${style.borderColor};
    `;

    toast.innerHTML = `
      <div style="
        font-size: 20px;
        font-weight: bold;
        flex-shrink: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">${style.icon}</div>
      <div style="flex: 1; font-size: 14px; line-height: 1.5;">${message}</div>
      <button onclick="document.getElementById('${toastId}').remove()" style="
        background: none;
        border: none;
        color: ${style.textColor};
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.8;
        transition: opacity 0.2s;
      " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'">×</button>
    `;

    // Add animation styles if not already added
    if (!document.getElementById('toast-animations')) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'toast-animations';
      styleSheet.textContent = `
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(styleSheet);
    }

    this.container.appendChild(toast);

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.remove(toastId);
      }, duration);
    }

    return toastId;
  }

  remove(toastId) {
    const toast = document.getElementById(toastId);
    if (toast) {
      toast.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }
  }

  success(message, duration = 5000) {
    return this.show(message, 'success', duration);
  }

  error(message, duration = 7000) {
    return this.show(message, 'error', duration);
  }

  warning(message, duration = 6000) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration = 5000) {
    return this.show(message, 'info', duration);
  }
}

// Create global toast instance
if (typeof window.Toast === 'undefined') {
  window.Toast = new ToastService();
}

