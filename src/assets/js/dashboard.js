/**
 * INGENZI HRMS - Dashboard Module
 * Uses Backend API instead of IndexedDB
 */

document.addEventListener('DOMContentLoaded', async function() {
  // Wait for API to be ready
  if (typeof window.API === 'undefined') {
    let retries = 0;
    while (typeof window.API === 'undefined' && retries < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      retries++;
    }
  }

  if (typeof window.API === 'undefined') {
    console.error('API service not available');
    return;
  }

  await personalizeWelcomeCard();
  await loadDashboardStats();
  await loadRecentActivity();
  // Role-based UI is handled by role-based-ui.js globally
});

async function personalizeWelcomeCard() {
  try {
    const userRole = getCurrentUserRole();
    
    if (userRole === 'employee') {
      const currentUser = await window.API.getCurrentUser();
      if (currentUser && currentUser.user) {
        const welcomeTitle = document.getElementById('employeeWelcomeTitle');
        const welcomeSubtitle = document.getElementById('employeeWelcomeSubtitle');
        
        if (welcomeTitle) {
          const userName = currentUser.user.name || currentUser.user.email || 'Employee';
          welcomeTitle.textContent = `Welcome, ${userName}!`;
        }
        
        if (welcomeSubtitle && currentUser.user.employee) {
          const employee = currentUser.user.employee;
          welcomeSubtitle.textContent = `${employee.position || 'Employee'} - ${employee.department ? employee.department.name : 'Your Dashboard'}`;
        }
      }
    }
  } catch (error) {
    console.error('Error personalizing welcome card:', error);
  }
}

async function loadDashboardStats() {
  try {
    const userRole = getCurrentUserRole();
    
    if (!window.API) {
      console.error('API not available');
      return;
    }

    const stats = await window.API.getDashboardStats();
    
    // Debug: Log stats to see what we're getting
    console.log('Dashboard stats received:', stats);
    console.log('User role:', userRole);

    // Employee-specific stats
    if (userRole === 'employee') {
      if (stats.myPendingLeaves !== undefined) {
        const myPendingLeavesEl = document.getElementById('myPendingLeaves');
        if (myPendingLeavesEl) myPendingLeavesEl.textContent = stats.myPendingLeaves || 0;
      }

      if (stats.myTotalLeaves !== undefined) {
        const myTotalLeavesEl = document.getElementById('myTotalLeaves');
        if (myTotalLeavesEl) myTotalLeavesEl.textContent = stats.myTotalLeaves || 0;
      }
      
      if (stats.myPayroll !== undefined) {
        const myPayrollEl = document.getElementById('myPayroll');
        if (myPayrollEl) myPayrollEl.textContent = stats.myPayroll || 0;
      }
    } else {
      // HR Manager and Admin stats
      if (stats.totalEmployees !== undefined) {
        const totalEmployeesEl = document.getElementById('totalEmployees');
        if (totalEmployeesEl) totalEmployeesEl.textContent = stats.totalEmployees || 0;
      }

      if (stats.totalDepartments !== undefined) {
        const totalDeptsEl = document.getElementById('totalDepartments');
        if (totalDeptsEl) totalDeptsEl.textContent = stats.totalDepartments || 0;
      }

      if (stats.pendingLeaves !== undefined) {
        const pendingLeavesEl = document.getElementById('pendingLeaves');
        if (pendingLeavesEl) pendingLeavesEl.textContent = stats.pendingLeaves || 0;
      }

      if (stats.todayAttendance !== undefined) {
        const todayAttendanceEl = document.getElementById('todayAttendance');
        if (todayAttendanceEl) todayAttendanceEl.textContent = stats.todayAttendance || 0;
      }

      // Admin-only stats
      if (userRole === 'system_admin') {
        if (stats.activeRecruitments !== undefined) {
          const activeRecruitmentsEl = document.getElementById('activeRecruitments');
          if (activeRecruitmentsEl) activeRecruitmentsEl.textContent = stats.activeRecruitments || 0;
        }

        if (stats.totalUsers !== undefined) {
          const totalUsersEl = document.getElementById('totalUsers');
          if (totalUsersEl) totalUsersEl.textContent = stats.totalUsers || 0;
        }
      }
    }
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
    // Show error message on dashboard
    const errorMsg = document.createElement('div');
    errorMsg.className = 'alert alert-danger';
    errorMsg.textContent = 'Failed to load dashboard statistics. Please refresh the page.';
    const dashboardContainer = document.querySelector('.pc-content');
    if (dashboardContainer) {
      dashboardContainer.insertBefore(errorMsg, dashboardContainer.firstChild);
    }
  }
}

async function loadRecentActivity() {
  try {
    const activityContainer = document.getElementById('recentActivity');
    if (!activityContainer) return;

    if (!window.API) {
      console.error('API not available');
      return;
    }

    const activities = await window.API.getRecentActivity();

    if (!activities || activities.length === 0) {
      activityContainer.innerHTML = '<p class="text-muted">No recent activity</p>';
      return;
    }

    const activityHTML = activities.map(activity => `
      <div class="d-flex align-items-center mb-3">
        <div class="flex-shrink-0">
          <i class="${activity.icon || 'ti ti-circle'} ${activity.iconColor || 'text-primary'}"></i>
        </div>
        <div class="flex-grow-1 ms-3">
          <h6 class="mb-0">${activity.title || 'Activity'}</h6>
          <p class="text-muted mb-0 small">${activity.description || ''}</p>
          <span class="text-muted small">${activity.time || ''}</span>
        </div>
      </div>
    `).join('');

    activityContainer.innerHTML = activityHTML;
  } catch (error) {
    console.error('Error loading recent activity:', error);
    const activityContainer = document.getElementById('recentActivity');
    if (activityContainer) {
      activityContainer.innerHTML = '<p class="text-danger">Error loading activity</p>';
    }
  }
}

function applyRoleBasedDashboard() {
  const userRole = getCurrentUserRole();
  
  // Hide/show elements based on role - strict matching (no inheritance)
  const adminOnlyElements = document.querySelectorAll('[data-role="system_admin"]');
  const hrOnlyElements = document.querySelectorAll('[data-role="hr_manager"]');
  const employeeOnlyElements = document.querySelectorAll('[data-role="employee"]');
  
  // Elements that should show to both HR and Admin (explicitly marked)
  const hrAndAdminElements = document.querySelectorAll('[data-role="hr_manager system_admin"]');

  adminOnlyElements.forEach(el => {
    el.style.display = (userRole === 'system_admin') ? '' : 'none';
  });

  // HR items should ONLY show to HR managers, not admins
  hrOnlyElements.forEach(el => {
    el.style.display = (userRole === 'hr_manager') ? '' : 'none';
  });

  employeeOnlyElements.forEach(el => {
    el.style.display = (userRole === 'employee') ? '' : 'none';
  });
  
  // Items explicitly marked for both HR and Admin
  hrAndAdminElements.forEach(el => {
    const roles = el.getAttribute('data-role').split(' ');
    el.style.display = roles.includes(userRole) ? '' : 'none';
  });
}
