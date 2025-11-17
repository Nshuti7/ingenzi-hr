/**
 * INGENZI HRMS - Authentication Module
 * Handles login, logout, and session management
 */

// Check if user is authenticated
function isAuthenticated() {
  const user = localStorage.getItem('hrms_user');
  const token = localStorage.getItem('hrms_token');
  return user && token;
}

// Get current user
function getCurrentUser() {
  const user = localStorage.getItem('hrms_user');
  return user ? JSON.parse(user) : null;
}

// Get current user role
function getCurrentUserRole() {
  const user = getCurrentUser();
  return user ? user.role : null;
}

// Login function
function login(email, password) {
  // Demo users for testing (in production, this would be an API call)
  const users = {
    'employee@ingenzi.com': {
      id: 1,
      email: 'employee@ingenzi.com',
      password: 'employee123',
      name: 'John Doe',
      role: 'employee',
      employeeId: 'EMP001'
    },
    'hr@ingenzi.com': {
      id: 2,
      email: 'hr@ingenzi.com',
      password: 'hr123',
      name: 'Jane Smith',
      role: 'hr_manager',
      employeeId: 'HR001'
    },
    'admin@ingenzi.com': {
      id: 3,
      email: 'admin@ingenzi.com',
      password: 'admin123',
      name: 'Admin User',
      role: 'system_admin',
      employeeId: 'ADM001'
    }
  };

  const user = users[email.toLowerCase()];
  
  if (user && user.password === password) {
    // Create token (in production, this would come from the server)
    const token = 'hrms_token_' + Date.now();
    
    // Store user and token
    localStorage.setItem('hrms_user', JSON.stringify(user));
    localStorage.setItem('hrms_token', token);
    
    return {
      success: true,
      user: user
    };
  }
  
  return {
    success: false,
    message: 'Invalid email or password'
  };
}

// Logout function
function logout() {
  localStorage.removeItem('hrms_user');
  localStorage.removeItem('hrms_token');
  window.location.href = '../pages/login.html';
}

// Protect routes - redirect to login if not authenticated
function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = '../pages/login.html';
    return false;
  }
  return true;
}

// Check if user has permission for a role
function hasRole(requiredRole) {
  const userRole = getCurrentUserRole();
  
  // Role hierarchy: system_admin > hr_manager > employee
  const roleHierarchy = {
    'employee': 1,
    'hr_manager': 2,
    'system_admin': 3
  };
  
  const userLevel = roleHierarchy[userRole] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;
  
  return userLevel >= requiredLevel;
}

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', function() {
  // If on login page, don't check auth
  if (window.location.pathname.includes('login.html')) {
    // If already logged in, redirect to dashboard
    if (isAuthenticated()) {
      window.location.href = '../dashboard/index.html';
    }
    return;
  }
  
  // Protect all other pages
  requireAuth();
  
  // Update user profile in header if exists
  const user = getCurrentUser();
  if (user) {
    // Update user name in header dropdown
    const userNameEl = document.getElementById('userName');
    if (userNameEl) userNameEl.textContent = user.name;
    
    const userEmailEl = document.getElementById('userEmail');
    if (userEmailEl) userEmailEl.textContent = user.email;
    
    // Hide role-based menu items
    const userRole = getCurrentUserRole();
    if (userRole !== 'system_admin') {
      const adminMenuItems = document.querySelectorAll('[data-role="system_admin"]');
      adminMenuItems.forEach(item => item.style.display = 'none');
    }
  }
  
  // Add logout functionality to logout buttons
  const logoutButtons = document.querySelectorAll('[data-logout]');
  logoutButtons.forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      logout();
    });
  });
  
  // Also handle logout buttons with power icon
  const powerIconButtons = document.querySelectorAll('.ti-power');
  powerIconButtons.forEach(icon => {
    const btn = icon.closest('a, button');
    if (btn && !btn.hasAttribute('data-logout')) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        logout();
      });
    }
  });
});

