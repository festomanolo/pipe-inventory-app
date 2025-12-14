/**
 * Session Manager for Eliva Hardware
 * Handles user sessions, authentication, and timeout management
 */

class SessionManager {
  constructor() {
    this.SESSION_KEY = 'userSession';
    this.TIMEOUT_KEY = 'sessionTimeoutHours';
    this.PASSWORD_KEY = 'eliva-hardware-password';
    this.defaultTimeout = 3; // 3 hours
    this.activityTimer = null;
    this.warningTimer = null;
  }

  // Get current user session
  getCurrentSession() {
    try {
      let sessionData = localStorage.getItem(this.SESSION_KEY);
      
      // If no main session, check backup session
      if (!sessionData) {
        const backupSession = localStorage.getItem('eliva_session');
        if (backupSession) {
          const backup = JSON.parse(backupSession);
          if (backup.username && backup.loggedIn) {
            // Convert backup session to main session format
            const session = {
              username: backup.username,
              role: backup.username === 'festomanolo' ? 'admin' : 'user',
              name: backup.username === 'festomanolo' ? 'System Administrator' : 'Hardware Manager',
              loginTime: backup.loginTime,
              lastActivity: new Date().toISOString()
            };
            // Store as main session
            localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
            return session;
          }
        }
        return null;
      }
      
      const session = JSON.parse(sessionData);
      
      // Check if session is expired
      if (this.isSessionExpired(session)) {
        this.clearSession();
        return null;
      }
      
      return session;
    } catch (error) {
      console.error('Error getting current session:', error);
      return null;
    }
  }

  // Set user session
  setSession(userData) {
    try {
      const sessionData = {
        username: userData.username,
        role: userData.role,
        name: userData.name,
        loginTime: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      };
      
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
      this.setupActivityTracking();
      return true;
    } catch (error) {
      console.error('Error setting session:', error);
      return false;
    }
  }

  // Clear session
  clearSession() {
    try {
      localStorage.removeItem(this.SESSION_KEY);
      this.clearSessionTracking();
      // Force clear any remaining event listeners that might interfere with input fields
      this.forceClearAllListeners();
      return true;
    } catch (error) {
      console.error('Error clearing session:', error);
      return false;
    }
  }

  // Force clear all event listeners and timers to prevent input field interference
  forceClearAllListeners() {
    try {
      console.log('Force clearing session listeners...');
      
      // Clear all timers first
      this.clearActivityTimers();
      
      // Remove all activity listeners
      this.removeActivityListeners();
      
      // Only remove our specific listeners, not all listeners
      if (this.resetTimersFunction && this.trackedEvents) {
        this.trackedEvents.forEach(event => {
          document.removeEventListener(event, this.resetTimersFunction, false);
          document.removeEventListener(event, this.resetTimersFunction, true);
        });
      }
      
      // Clear any stored references
      this.trackedEvents = null;
      this.resetTimersFunction = null;
      this.activityTimer = null;
      this.warningTimer = null;
      
      console.log('Session listeners and timers cleared (targeted approach)');
    } catch (error) {
      console.error('Error force clearing listeners:', error);
    }
  }

  // Update last activity
  updateActivity() {
    try {
      const session = this.getCurrentSession();
      if (session) {
        session.lastActivity = new Date().toISOString();
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      }
    } catch (error) {
      console.error('Error updating activity:', error);
    }
  }

  // Check if session is expired
  isSessionExpired(session) {
    if (!session || !session.lastActivity) return true;
    
    const timeoutHours = this.getSessionTimeout();
    const timeoutMs = timeoutHours * 60 * 60 * 1000;
    const lastActivity = new Date(session.lastActivity);
    const now = new Date();
    
    return (now - lastActivity) > timeoutMs;
  }

  // Get session timeout setting
  getSessionTimeout() {
    try {
      const timeout = localStorage.getItem(this.TIMEOUT_KEY);
      return timeout ? parseInt(timeout) : this.defaultTimeout;
    } catch (error) {
      console.error('Error getting session timeout:', error);
      return this.defaultTimeout;
    }
  }

  // Set session timeout
  setSessionTimeout(hours) {
    try {
      localStorage.setItem(this.TIMEOUT_KEY, hours.toString());
      this.setupActivityTracking(); // Restart with new timeout
      return true;
    } catch (error) {
      console.error('Error setting session timeout:', error);
      return false;
    }
  }

  // Setup activity tracking
  setupActivityTracking() {
    this.clearActivityTimers();
    
    const timeoutMs = this.getSessionTimeout() * 60 * 60 * 1000;
    const warningMs = timeoutMs - (30 * 60 * 1000); // 30 minutes before timeout
    
    // Activity events to track (removed keypress to avoid input interference)
    const events = ['mousedown', 'mousemove', 'scroll', 'touchstart', 'click'];
    
    // Store reference to the reset function for cleanup
    this.resetTimersFunction = (event) => {
      // Completely avoid interfering with input field events
      if (event && event.target) {
        const tagName = event.target.tagName.toLowerCase();
        const inputTypes = ['input', 'textarea', 'select', 'button'];
        const isInputField = inputTypes.includes(tagName);
        const isContentEditable = event.target.contentEditable === 'true';
        const hasInputRole = event.target.getAttribute('role') === 'textbox';
        
        if (isInputField || isContentEditable || hasInputRole) {
          // Just update activity silently, don't reset timers or interfere
          this.updateActivity();
          return;
        }
        
        // Also check if the event is happening inside an input container
        let parent = event.target.parentElement;
        while (parent && parent !== document.body) {
          if (parent.tagName && inputTypes.includes(parent.tagName.toLowerCase())) {
            this.updateActivity();
            return;
          }
          parent = parent.parentElement;
        }
      }
      
      this.updateActivity();
      this.clearActivityTimers();
      
      // Set warning timer
      this.warningTimer = setTimeout(() => {
        this.showSessionWarning();
      }, warningMs);
      
      // Set logout timer
      this.activityTimer = setTimeout(() => {
        this.handleSessionTimeout();
      }, timeoutMs);
    };
    
    // Remove existing listeners first
    this.removeActivityListeners();
    
    // Add event listeners without capture to avoid input interference
    events.forEach(event => {
      document.addEventListener(event, this.resetTimersFunction, false);
    });
    
    // Store events for cleanup
    this.trackedEvents = events;
    
    // Initial timer setup
    this.resetTimersFunction();
  }

  // Remove activity listeners
  removeActivityListeners() {
    if (this.trackedEvents && this.resetTimersFunction) {
      this.trackedEvents.forEach(event => {
        document.removeEventListener(event, this.resetTimersFunction, false);
      });
    }
  }

  // Clear activity timers
  clearActivityTimers() {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
      this.activityTimer = null;
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
  }

  // Clear all session tracking
  clearSessionTracking() {
    this.clearActivityTimers();
    this.removeActivityListeners();
  }

  // Show session warning
  showSessionWarning() {
    const result = confirm('Your session will expire in 30 minutes due to inactivity. Click OK to continue working.');
    if (result) {
      this.updateActivity();
      this.setupActivityTracking();
    }
  }

  // Handle session timeout
  handleSessionTimeout() {
    console.log('Session expired due to inactivity');
    localStorage.setItem('sessionTimeout', 'true');
    this.clearSession();
    window.location.href = 'login.html';
  }

  // Change password for eliva-hardware user
  changePassword(currentPassword, newPassword) {
    try {
      const session = this.getCurrentSession();
      if (!session) {
        throw new Error('No active session found');
      }

      if (session.role === 'admin') {
        throw new Error('Admin password cannot be changed');
      }

      if (session.username !== 'eliva-hardware') {
        throw new Error('Password change only available for eliva-hardware user');
      }

      // Get current password
      const storedPassword = localStorage.getItem(this.PASSWORD_KEY) || 'eliva2011';
      
      if (storedPassword !== currentPassword) {
        throw new Error('Current password is incorrect');
      }

      if (newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters long');
      }

      // Save new password
      localStorage.setItem(this.PASSWORD_KEY, newPassword);
      console.log('Password changed successfully for user:', session.username);
      
      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      console.error('Error changing password:', error);
      return { success: false, message: error.message };
    }
  }

  // Get user password (for login verification)
  getUserPassword(username) {
    if (username === 'eliva-hardware') {
      return localStorage.getItem(this.PASSWORD_KEY) || 'eliva2011';
    } else if (username === 'festomanolo') {
      return 'festomanolo';
    }
    return null;
  }

  // Initialize session manager
  init() {
    // Check for session timeout flag
    if (localStorage.getItem('sessionTimeout') === 'true') {
      localStorage.removeItem('sessionTimeout');
      // Show timeout notification if on login page
      if (window.location.pathname.includes('login.html')) {
        const timeoutNotification = document.getElementById('sessionTimeout');
        if (timeoutNotification) {
          timeoutNotification.style.display = 'block';
          setTimeout(() => {
            timeoutNotification.style.display = 'none';
          }, 5000);
        }
      }
    }

    // Setup activity tracking if user is logged in AND not on login page
    const session = this.getCurrentSession();
    if (session && !window.location.pathname.includes('login.html')) {
      this.setupActivityTracking();
    } else if (window.location.pathname.includes('login.html')) {
      // Ensure no activity tracking on login page to prevent input interference
      this.clearSessionTracking();
    }
  }
}

// Create global instance
window.SessionManager = new SessionManager();

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  window.SessionManager.init();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SessionManager;
}