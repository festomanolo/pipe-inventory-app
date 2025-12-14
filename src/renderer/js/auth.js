/**
 * Authentication System for Eliva Hardware
 * Handles login checks, session management, and timeout
 */

// Default session timeout (3 hours in milliseconds)
let SESSION_TIMEOUT = 3 * 60 * 60 * 1000; // 3 hours
let activityTimer;
let warningTimer;

// Load session timeout setting
function loadSessionTimeout() {
  const savedTimeout = localStorage.getItem('sessionTimeoutHours');
  if (savedTimeout) {
    SESSION_TIMEOUT = parseInt(savedTimeout) * 60 * 60 * 1000;
  }
}

// Check if session has expired
function isSessionExpired(session) {
  if (!session.lastActivity) return false;
  
  const lastActivity = new Date(session.lastActivity);
  const now = new Date();
  const timeDiff = now - lastActivity;
  
  return timeDiff > SESSION_TIMEOUT;
}

// Update last activity timestamp
function updateLastActivity() {
  try {
    const userSession = JSON.parse(localStorage.getItem('userSession') || '{}');
    if (userSession.username) {
      userSession.lastActivity = new Date().toISOString();
      localStorage.setItem('userSession', JSON.stringify(userSession));
    }
  } catch (error) {
    console.error('Error updating last activity:', error);
  }
}

// Setup activity tracking
function setupActivityTracking() {
  const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
  
  function resetActivityTimer() {
    updateLastActivity();
    
    // Clear existing timers
    if (activityTimer) clearTimeout(activityTimer);
    if (warningTimer) clearTimeout(warningTimer);
    
    // Set warning timer (30 minutes before timeout)
    warningTimer = setTimeout(() => {
      showSessionWarning();
    }, SESSION_TIMEOUT - (30 * 60 * 1000)); // 30 minutes before timeout
    
    // Set logout timer
    activityTimer = setTimeout(() => {
      handleSessionTimeout();
    }, SESSION_TIMEOUT);
  }
  
  // Add event listeners
  events.forEach(event => {
    document.addEventListener(event, resetActivityTimer, true);
  });
  
  // Initial timer setup
  resetActivityTimer();
}

// Show session warning
function showSessionWarning() {
  if (confirm('Your session will expire in 30 minutes due to inactivity. Click OK to continue working.')) {
    updateLastActivity();
  }
}

// Handle session timeout
function handleSessionTimeout() {
  console.log('Session expired due to inactivity');
  localStorage.setItem('sessionTimeout', 'true');
  logout();
}

// Check if user is authenticated
function checkAuthentication() {
  // Skip authentication check for login page
  if (window.location.pathname.includes('login.html')) {
    return true;
  }

  loadSessionTimeout();

  try {
    // Always check localStorage first since that's where login stores the session
    let userSession = JSON.parse(localStorage.getItem('userSession') || '{}');
    
    // Also check the backup session storage
    if (!userSession.username) {
      const backupSession = JSON.parse(localStorage.getItem('eliva_session') || '{}');
      if (backupSession.username && backupSession.loggedIn) {
        userSession = {
          username: backupSession.username,
          role: backupSession.username === 'festomanolo' ? 'admin' : 'user',
          name: backupSession.username === 'festomanolo' ? 'System Administrator' : 'Hardware Manager',
          loginTime: backupSession.loginTime,
          lastActivity: new Date().toISOString()
        };
        // Update the main session storage
        localStorage.setItem('userSession', JSON.stringify(userSession));
      }
    }
    
    // Check if session exists and is valid
    if (!userSession.username || isSessionExpired(userSession)) {
      console.log('No valid session found or session expired');
      if (isSessionExpired(userSession)) {
        localStorage.setItem('sessionTimeout', 'true');
      }
      redirectToLogin();
      return;
    }
    
    console.log('User authenticated:', userSession.username);
    updateUIForUser(userSession);
    setupActivityTracking();
    
    // Try to sync with Electron API in the background (non-blocking)
    if (typeof window.electronAPI !== 'undefined' && window.electronAPI.setUserSession) {
      window.electronAPI.setUserSession(userSession).catch(error => {
        console.warn('Failed to sync session with Electron API:', error);
        // Don't redirect on this error, just log it
      });
    }
    
  } catch (error) {
    console.error('Authentication check failed:', error);
    redirectToLogin();
  }
}

// Redirect to login page
function redirectToLogin() {
  console.log('Redirecting to login page');
  window.location.href = 'login.html';
}

// Update UI based on user role
function updateUIForUser(userSession) {
  // Add user info to the page if needed
  const userElements = document.querySelectorAll('.user-name');
  userElements.forEach(element => {
    element.textContent = userSession.name || userSession.username;
  });

  // Hide admin-only features for regular users
  if (userSession.role !== 'admin') {
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(element => {
      element.style.display = 'none';
    });
  }

  // Hide password tab for admin users
  if (userSession.role === 'admin') {
    const passwordTab = document.getElementById('password-tab-item');
    if (passwordTab) {
      passwordTab.style.display = 'none';
    }
  }
}

// Logout function
function logout() {
  try {
    console.log('Starting logout process...');
    
    // Clear activity tracking timers first
    if (activityTimer) {
      clearTimeout(activityTimer);
      activityTimer = null;
    }
    if (warningTimer) {
      clearTimeout(warningTimer);
      warningTimer = null;
    }
    
    // Clear SessionManager but be more careful about listeners
    if (window.SessionManager) {
      window.SessionManager.clearSession();
      // Only clear session tracking, not all listeners
      if (window.SessionManager.clearSessionTracking) {
        window.SessionManager.clearSessionTracking();
      }
    }
    
    // Clear Electron API session if available
    if (typeof window.electronAPI !== 'undefined' && window.electronAPI.clearUserSession) {
      window.electronAPI.clearUserSession();
    }
    
    // Clear localStorage sessions
    localStorage.removeItem('userSession');
    localStorage.removeItem('eliva_session');
    // Don't remove the password - it should persist for future logins
    // localStorage.removeItem('eliva-hardware-password');
    
    // Set a flag to indicate we're logging out
    localStorage.setItem('isLoggingOut', 'true');
    
    console.log('User logged out - sessions cleared');
    
    // Use a more immediate redirect to prevent interference
    window.location.replace('login.html');
    
  } catch (error) {
    console.error('Logout failed:', error);
    // Force redirect anyway
    localStorage.setItem('isLoggingOut', 'true');
    window.location.replace('login.html');
  }
}

// Add logout button functionality
document.addEventListener('DOMContentLoaded', function() {
  // Skip authentication check for login page
  if (window.location.pathname.includes('login.html')) {
    console.log('Skipping authentication check on login page');
    return;
  }
  
  // Check authentication when page loads
  console.log('Checking authentication...');
  checkAuthentication();

  // Add logout functionality to any logout buttons
  const logoutButtons = document.querySelectorAll('.logout-btn, [data-action="logout"], #logout-link');
  logoutButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      if (confirm('Are you sure you want to logout?')) {
        logout();
      }
    });
  });


});



// Export functions for use in other scripts
if (typeof window !== 'undefined') {
  window.AuthSystem = {
    checkAuthentication,
    logout,
    updateUIForUser
  };
} 