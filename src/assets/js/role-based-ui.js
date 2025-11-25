/**
 * INGENZI HRMS - Role-Based UI Control
 * Hides/shows features based on user role
 */

document.addEventListener('DOMContentLoaded', function() {
  applyRoleBasedUI();
  checkPageAccess();
});

function applyRoleBasedUI() {
  const user = getCurrentUser();
  if (!user) return;

  const userRole = getCurrentUserRole();

  // Process all elements with data-role attribute
  document.querySelectorAll('[data-role]').forEach(el => {
    const roles = el.getAttribute('data-role').split(' ').filter(r => r.trim());
    const isStrict = el.hasAttribute('data-strict-role') && el.getAttribute('data-strict-role') === 'true';
    
    // Strict role matching for elements marked with data-strict-role="true"
    // These elements (like welcome cards) should only show for exact role match
    // For other elements: HR managers can see items marked for employees
    const shouldShow = isStrict 
      ? roles.includes(userRole)  // Strict: exact match only
      : roles.includes(userRole) || (userRole === 'hr_manager' && roles.includes('employee')); // Normal: with inheritance
    
    if (!shouldShow) {
      el.style.display = 'none';
    } else {
      // Restore original display style if it was hidden
      if (el.style.display === 'none') {
        el.style.display = '';
      }
    }
  });

  // Hide add/edit/delete buttons for employees
  if (userRole === 'employee') {
    document.querySelectorAll('[id*="add"], [id*="Add"], [id*="generate"], [id*="mark"]').forEach(el => {
      if ((el.tagName === 'BUTTON' || el.tagName === 'A') && el.id && !el.hasAttribute('data-role')) {
        el.style.display = 'none';
      }
    });

    // Hide management columns in tables
    document.querySelectorAll('th[data-role="manager"], td[data-role="manager"], th[id*="employeeHeader"], th[id*="actionsHeader"]').forEach(el => {
      el.style.display = 'none';
    });
    
    // Hide employee column headers
    document.querySelectorAll('#employeeHeader, #actionsHeader, #attendanceEmployeeHeader, #payrollEmployeeHeader, #historyEmployeeHeader').forEach(el => {
      el.style.display = 'none';
    });
  }
}

function checkPageAccess() {
  const userRole = getCurrentUserRole();
  const currentPath = window.location.pathname;
  
  // Pages employees cannot access
  const restrictedPages = [
    'employees.html',
    'departments.html',
    'recruitment.html',
    'reports.html',
    'users.html',
    'backup.html',
    'security.html'
  ];
  
  if (userRole === 'employee') {
    const isRestricted = restrictedPages.some(page => currentPath.includes(page));
    if (isRestricted) {
      window.location.href = '../dashboard/index.html';
      return;
    }
  }
  
  // Pages only system admin can access
  const adminOnlyPages = ['users.html', 'backup.html', 'security.html'];
  if (userRole !== 'system_admin') {
    const isAdminOnly = adminOnlyPages.some(page => currentPath.includes(page));
    if (isAdminOnly) {
      window.location.href = '../dashboard/index.html';
      return;
    }
  }
}

function hasPermission(requiredRole) {
  const userRole = getCurrentUserRole();
  const roleHierarchy = {
    'employee': 1,
    'hr_manager': 2,
    'system_admin': 3
  };
  return (roleHierarchy[userRole] || 0) >= (roleHierarchy[requiredRole] || 0);
}

