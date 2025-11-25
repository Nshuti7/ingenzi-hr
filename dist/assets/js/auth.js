/**
 * INGENZI HRMS - Authentication Module
 * Handles login, logout, and session management using Backend API
 */

// Check if user is authenticated
function isAuthenticated() {
  const token = localStorage.getItem('authToken');
  return token !== null;
}

// Get current user from localStorage or API
async function getCurrentUser(suppressRedirect = false) {
  // First check localStorage
  const cachedUser = localStorage.getItem('currentUser');
  if (cachedUser) {
    try {
      const user = JSON.parse(cachedUser);
      // Return cached user immediately, then refresh in background if needed
      if (isAuthenticated() && window.API && !suppressRedirect) {
        // Try to refresh from API in background (non-blocking)
        window.API.getCurrentUser().then(data => {
          if (data && data.user) {
            localStorage.setItem('currentUser', JSON.stringify(data.user));
          }
        }).catch(error => {
          // If unauthorized, clear auth but don't redirect
          if (error.message.includes('Unauthorized') || error.message.includes('401')) {
            console.warn('Session expired, clearing auth data');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('authToken');
            if (window.API) {
              window.API.clearToken();
            }
          }
        });
      }
      return user;
    } catch (e) {
      // Invalid JSON, clear it
      localStorage.removeItem('currentUser');
    }
  }

  // If no cached user but we have a token, fetch from API
  if (isAuthenticated() && window.API) {
    try {
      const data = await window.API.getCurrentUser();
      if (data.user) {
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        return data.user;
      }
    } catch (error) {
      console.error('Failed to get current user:', error);
      // If unauthorized, clear token but don't redirect (let requireAuth handle it)
      if (error.message.includes('Unauthorized') || error.message.includes('401')) {
        // Clear auth data
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        if (window.API) {
          window.API.clearToken();
        }
        // Only redirect if not suppressed and not already on login page
        if (!suppressRedirect) {
          const isLoginPage = window.location.pathname.includes('login') || 
                              window.location.pathname.includes('index.html') && 
                              !window.location.pathname.includes('dashboard');
          if (!isLoginPage) {
            // Let requireAuth handle the redirect on next page load
            // Don't redirect here to avoid loops
          }
        }
      }
      // Return null instead of redirecting
      return null;
    }
  }

  return null;
}

// Get current user role
function getCurrentUserRole() {
  const user = localStorage.getItem('currentUser');
  if (user) {
    try {
      const userObj = JSON.parse(user);
      return userObj.role;
    } catch (e) {
      return null;
    }
  }
  return null;
}

// Login function
async function login(email, password) {
  try {
    if (!window.API) {
      return {
        success: false,
        message: 'API service not loaded. Please refresh the page.'
      };
    }

    const data = await window.API.login(email, password);
    
    if (data.token && data.user) {
      // Store user in localStorage
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      
      return {
        success: true,
        user: data.user,
        token: data.token
      };
    }
    
    return {
      success: false,
      message: data.error || 'Login failed'
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: error.message || 'Login failed. Please check your credentials.'
    };
  }
}

// Logout function
function logout() {
  localStorage.removeItem('currentUser');
  localStorage.removeItem('authToken');
  if (window.API) {
    window.API.clearToken();
  }
  // Use relative path to avoid issues
  const loginPath = window.location.pathname.includes('pages/') 
    ? '../pages/login.html' 
    : 'pages/login.html';
  window.location.href = loginPath;
}

// Protect routes - redirect to login if not authenticated
function requireAuth() {
  // Skip authentication for public pages
  const publicPages = ['apply.html'];
  const currentPage = window.location.pathname;
  if (publicPages.some(page => currentPage.includes(page))) {
    return true; // Allow access to public pages
  }
  
  if (!isAuthenticated()) {
    // Use relative path to avoid issues
    const loginPath = window.location.pathname.includes('dashboard/') || window.location.pathname.includes('hrms/')
      ? '../pages/login.html'
      : window.location.pathname.includes('pages/')
      ? 'login.html'
      : 'pages/login.html';
    window.location.href = loginPath;
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

// Initialize auth on page load (skip for public pages)
document.addEventListener('DOMContentLoaded', async function() {
  // Skip auth initialization for public pages
  const publicPages = ['apply.html'];
  const currentPage = window.location.pathname;
  if (publicPages.some(page => currentPage.includes(page))) {
    return; // Don't run auth checks on public pages
  }
  // Wait a bit for API to be ready
  if (typeof window.API === 'undefined') {
    let retries = 0;
    while (typeof window.API === 'undefined' && retries < 20) {
      await new Promise(resolve => setTimeout(resolve, 100));
      retries++;
    }
  }

  // If on login page, don't check auth
  const isLoginPage = window.location.pathname.includes('login') || 
                      window.location.pathname.includes('index.html') && 
                      !window.location.pathname.includes('dashboard');
  
  if (isLoginPage) {
    // If already logged in, redirect to dashboard
    if (isAuthenticated()) {
      // Use relative path
      const dashboardPath = window.location.pathname.includes('pages/')
        ? '../dashboard/index.html'
        : 'dashboard/index.html';
      // Small delay to prevent immediate redirect loop
      setTimeout(() => {
        window.location.href = dashboardPath;
      }, 100);
    }
    return;
  }
  
  // Protect all other pages
  if (!requireAuth()) {
    return;
  }
  
  // Update user profile in header if exists (don't block page load if this fails)
  try {
    // First try to get cached user (fast)
    const cachedUser = localStorage.getItem('currentUser');
    if (cachedUser) {
      try {
        const user = JSON.parse(cachedUser);
        const userNameEl = document.getElementById('userName');
        if (userNameEl) userNameEl.textContent = user.name;
        
        const userEmailEl = document.getElementById('userEmail');
        if (userEmailEl) userEmailEl.textContent = user.email;
      } catch (e) {
        console.warn('Failed to parse cached user:', e);
      }
    }
    
    // Then try to refresh from API (async, non-blocking, suppress redirects)
    if (window.API) {
      getCurrentUser(true).then(user => {
        if (user) {
          const userNameEl = document.getElementById('userName');
          if (userNameEl) userNameEl.textContent = user.name;
          
          const userEmailEl = document.getElementById('userEmail');
          if (userEmailEl) userEmailEl.textContent = user.email;
        }
      }).catch(error => {
        console.error('Error refreshing user from API:', error);
        // Don't redirect on error - just log it
      });
    }
  } catch (error) {
    console.error('Error loading user:', error);
    // Don't redirect on error - page should still load
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
