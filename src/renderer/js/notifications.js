/**
 * Notifications and Sound Alert System
 * Provides standardized notification handling with sound effects
 */

// Audio players for different notification types
const audioPlayers = {
  success: new Audio('../../public/assets/sounds/success.mp3'),
  error: new Audio('../../public/assets/sounds/error.mp3'),
  warning: new Audio('../../public/assets/sounds/warning.mp3'),
  info: new Audio('../../public/assets/sounds/info.mp3'),
  alert: new Audio('../../public/assets/sounds/alert.mp3')
};

// Notification colors for different types
const notificationColors = {
  success: '#10b981', // Green
  error: '#ef4444',   // Red
  warning: '#f59e0b', // Amber
  info: '#3b82f6',    // Blue
  alert: '#8b5cf6'    // Purple
};

// Icon classes for different notification types
const notificationIcons = {
  success: 'fas fa-check-circle',
  error: 'fas fa-exclamation-circle',
  warning: 'fas fa-exclamation-triangle',
  info: 'fas fa-info-circle',
  alert: 'fas fa-bell'
};

// Initialize notification system
function initNotificationSystem() {
  // Create toast container if it doesn't exist
  if (!document.getElementById('toast-container')) {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    container.style.zIndex = "9999";
    document.body.appendChild(container);
  }
  
  // Preload sounds and ensure they exist
  Object.entries(audioPlayers).forEach(([type, audio]) => {
    // Check if the audio source exists
    const testAudio = new Audio(audio.src);
    testAudio.addEventListener('error', () => {
      console.error(`Could not load sound file for ${type} notification. Please check that the file exists.`);
    });
    
    // Preload the audio
    audio.load();
    audio.volume = 0.7; // Set slightly higher default volume
    
    // Log successful loading
    audio.addEventListener('canplaythrough', () => {
      console.log(`Sound loaded successfully: ${type}`);
    }, { once: true });
  });
  
  // Add a test notification to verify the system is working
  console.log('Notification system initialized successfully');
}

// Show a notification with optional sound
function showNotification(message, options = {}) {
  // Default options
  const defaults = {
    type: 'info',           // success, error, warning, info, alert
    title: null,            // Optional title
    duration: 4000,         // Duration in ms
    playSound: false,       // Whether to play sound (disabled by default)
    hasProgress: true,      // Show progress bar
    isHTML: false,          // Whether message contains HTML
    onClose: null,          // Callback function when notification is closed
    position: 'bottom-right', // Position: top-right, top-left, bottom-right, bottom-left, top-center, bottom-center
    silent: true            // Always keep notifications silent
  };
  
  // Merge options
  const settings = { ...defaults, ...options, silent: true };
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = 'toast notification-toast my-2';
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.setAttribute('aria-atomic', 'true');
  
  // Add animation
  toast.style.animation = 'fadeInUp 0.3s ease forwards';
  
  // Set toast content
  const icon = notificationIcons[settings.type] || notificationIcons.info;
  const color = notificationColors[settings.type] || notificationColors.info;
  
  // Build toast inner HTML with black text color
  let toastHTML = `
    <div class="toast-header" style="background-color: ${color}; color: black !important;">
      <i class="${icon} me-2" style="color: black !important;"></i>
      <strong class="me-auto" style="color: black !important;">${settings.title || settings.type.charAt(0).toUpperCase() + settings.type.slice(1)}</strong>
      <small style="color: black !important;">${new Date().toLocaleTimeString()}</small>
      <button type="button" class="btn-close ms-2" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
    <div class="toast-body" style="color: black !important;">
      ${settings.isHTML ? message : escapeHTML(message)}
    </div>
  `;
  
  // Add progress bar if enabled
  if (settings.hasProgress) {
    toastHTML += `
      <div class="toast-progress" style="height: 3px; background-color: rgba(0,0,0,0.1); position: relative; overflow: hidden;">
        <div class="progress-bar" style="background-color: ${color}; height: 100%; width: 100%; position: absolute; left: 0; top: 0;"></div>
      </div>
    `;
  }
  
  toast.innerHTML = toastHTML;
  
  // Get the toast container and append the new toast
  const toastContainer = document.getElementById('toast-container');
  toastContainer.appendChild(toast);
  
  // Initialize Bootstrap toast
  const bsToast = new bootstrap.Toast(toast, {
    autohide: true,
    delay: settings.duration
  });
  
  // Play sound if enabled and not silenced
  if (settings.playSound && !settings.silent && audioPlayers[settings.type]) {
    try {
      // Restart the audio if it's already playing
      const audio = audioPlayers[settings.type];
      audio.pause();
      audio.currentTime = 0;
      
      // Force user interaction to allow sound to play
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log(`Playing ${settings.type} sound`);
        }).catch(err => {
          console.error('Error playing notification sound:', err);
          // If autoplay is prevented, try again with user interaction
          document.addEventListener('click', () => {
            audio.play().catch(e => console.error('Still could not play sound:', e));
          }, { once: true });
        });
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }
  
  // Animate progress bar
  if (settings.hasProgress) {
    const progressBar = toast.querySelector('.progress-bar');
    if (progressBar) {
      progressBar.style.transition = `width ${settings.duration}ms linear`;
      setTimeout(() => {
        progressBar.style.width = '0%';
      }, 10);
    }
  }
  
  // Show the toast
  bsToast.show();
  
  // Remove toast after it's hidden and execute callback
  toast.addEventListener('hidden.bs.toast', () => {
    toast.remove();
    if (typeof settings.onClose === 'function') {
      settings.onClose();
    }
  });
  
  // Return the toast element
  return toast;
}

// Show low stock alert notification with item details
function showLowStockAlert(items) {
  if (!items || !items.length) return;
  
  // Create list of items
  let itemsList = '';
  items.forEach(item => {
    const itemType = item.type || item.category || 'Uncategorized';
    const dimension = item.dimension || item.size || '';
    const dimensionInfo = dimension ? ` - ${dimension}` : '';
    
    itemsList += `<li><strong style="color: #000000 !important;">${item.description}</strong><span style="color: #000000 !important;">${dimensionInfo} (${itemType}) - Current stock: ${item.quantity} (Threshold: ${item.alertThreshold})</span></li>`;
  });
  
  // Create message
  const message = `
    <div class="low-stock-alert" style="color: #000000 !important;">
      <p style="color: #000000 !important;"><strong style="color: #000000 !important;">${items.length} item${items.length > 1 ? 's' : ''} below threshold:</strong></p>
      <ul class="ps-3" style="color: #000000 !important;">
        ${itemsList}
      </ul>
      <p class="mb-0" style="color: #000000 !important;">Please consider restocking these items soon.</p>
    </div>
  `;
  
  // Show notification
  return showNotification(message, {
    type: 'alert',
    title: 'Low Stock Alert',
    duration: 8000,
    isHTML: true,
    playSound: false,
    silent: true
  });
}

// Utility function to safely escape HTML
function escapeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Export the API
window.NotificationSystem = {
  init: initNotificationSystem,
  show: showNotification,
  showLowStockAlert: showLowStockAlert
};

// Add an alias for backwards compatibility with code that uses 'Notifications'
window.Notifications = window.NotificationSystem;

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize the notification system
  initNotificationSystem();
  
  // Test notification (disabled)
  /* 
  setTimeout(() => {
    // Test notification to verify the system is working
    showNotification('Notification system is working correctly', {
      type: 'success',
      title: 'System Ready',
      playSound: false,
      duration: 4000,
      silent: true
    });
  }, 2000);
  */
}); 

/**
 * Show activity log notification with enhanced reveal animation
 * @param {Object} logEntry - The log entry to display
 * @param {string} logEntry.type - Log type (info, warning, error, success)
 * @param {string} logEntry.description - Description of the activity
 * @param {string} logEntry.category - Category of the log
 * @param {string} [logEntry.user] - User who performed the action
 * @param {Object} [options] - Additional options
 */
function showActivityLog(logEntry, options = {}) {
  // Default options
  const defaults = {
    autoHide: true,
    duration: 5000,
    position: 'top-right'
  };
  
  // Merge options
  const settings = { ...defaults, ...options };
  
  // Create toast container if it doesn't exist
  let container = document.querySelector('.activity-logs-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'activity-logs-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '1090';
    document.body.appendChild(container);
  }
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast activity-log-toast activity-log-${logEntry.type} show`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.setAttribute('aria-atomic', 'true');
  
  // Add reveal animation
  toast.style.animation = 'fadeInRight 0.5s ease forwards';
  
  // Configure toast appearance based on log type
  let iconClass = 'info-circle';
  let bgColorClass = 'bg-info';
  
  switch(logEntry.type) {
    case 'success':
      iconClass = 'check-circle';
      bgColorClass = 'bg-success';
      break;
    case 'warning':
      iconClass = 'exclamation-triangle';
      bgColorClass = 'bg-warning';
      break;
    case 'error':
      iconClass = 'exclamation-circle';
      bgColorClass = 'bg-danger';
      break;
    case 'info':
    default:
      iconClass = 'info-circle';
      bgColorClass = 'bg-info';
      break;
  }
  
  // Create toast content with enhanced styling
  toast.innerHTML = `
    <style>
      @keyframes fadeInRight {
        from {
          opacity: 0;
          transform: translateX(100px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      @keyframes fadeOut {
        from {
          opacity: 1;
        }
        to {
          opacity: 0;
        }
      }
      
      .activity-log-toast {
        background-color: #212529 !important;
        border-left: 4px solid #3b82f6;
        color: #000000 !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        overflow: hidden;
        margin-bottom: 10px;
        max-width: 350px;
      }
      
      .activity-log-toast.activity-log-success {
        border-left-color: #10b981;
      }
      
      .activity-log-toast.activity-log-warning {
        border-left-color: #f59e0b;
      }
      
      .activity-log-toast.activity-log-error {
        border-left-color: #ef4444;
      }
      
      .activity-log-toast.activity-log-info {
        border-left-color: #3b82f6;
      }
      
      .activity-log-toast .toast-header {
        background-color: transparent;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        color: #000000 !important;
      }
      
      .activity-log-toast .toast-body {
        padding: 12px;
        color: #000000 !important;
      }
      
      .activity-log-toast .activity-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        margin-right: 8px;
        font-size: 14px;
      }
      
      .activity-log-toast .category-badge {
        font-size: 0.75rem;
        padding: 2px 6px;
        border-radius: 4px;
        margin-left: auto;
      }
    </style>
    <div class="toast-header">
      <div class="activity-icon ${bgColorClass} text-white">
        <i class="fas fa-${iconClass}"></i>
      </div>
      <strong class="me-auto" style="color: #000000 !important;">${capitalizeFirstLetter(logEntry.type)} Activity</strong>
      <small class="category-badge bg-dark text-white">${capitalizeFirstLetter(logEntry.category)}</small>
      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
    <div class="toast-body">
      <div style="color: #000000 !important;">${logEntry.description}</div>
      ${logEntry.user ? `<small class="text-muted" style="color: #6c757d !important;">By: ${logEntry.user}</small>` : ''}
    </div>
  `;
  
  // Add to container
  container.appendChild(toast);
  
  // Set up auto-hide
  if (settings.autoHide) {
    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.5s ease forwards';
      setTimeout(() => {
        container.removeChild(toast);
      }, 500);
    }, settings.duration);
  }
  
  // Add click handler to close button
  const closeButton = toast.querySelector('.btn-close');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      toast.style.animation = 'fadeOut 0.5s ease forwards';
      setTimeout(() => {
        container.removeChild(toast);
      }, 500);
    });
  }
  
  return toast;
}

/**
 * Capitalize the first letter of a string
 * @param {string} string - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalizeFirstLetter(string) {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Initialize an event listener for new logs if electronAPI is available
function setupLogEventListener() {
  if (window.electronAPI && typeof window.electronAPI.onNewLog === 'function') {
    window.electronAPI.onNewLog((event, log) => {
      // For important logs, show a notification
      if (log.type === 'error' || log.type === 'warning') {
        // Always show errors and warnings
        showActivityLog(log, { duration: 8000 });
      } else if (log.type === 'success') {
        // Show success notifications but for a shorter time
        showActivityLog(log, { duration: 4000 });
      } else if (log.category === 'inventory' || log.category === 'sales') {
        // Only show info logs for inventory and sales
        showActivityLog(log, { duration: 3000 });
      }
    });
  }
}

// Call setupLogEventListener when NotificationSystem is initialized
const originalInit = NotificationSystem.init;
NotificationSystem.init = function(...args) {
  const result = originalInit.apply(this, args);
  setupLogEventListener();
  return result;
};

// Add the new function to the NotificationSystem
NotificationSystem.showActivityLog = showActivityLog;

// Export notification system
window.NotificationSystem = NotificationSystem; 