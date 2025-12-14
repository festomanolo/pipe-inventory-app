/**
 * Enhanced Notification System with Sound Effects
 * This script provides a comprehensive notification system with sound effects
 * for the Pipe Inventory Management System
 */

// Define notification sounds
const notificationSounds = {
  success: new Audio('../../public/assets/sounds/success.mp3'),
  error: new Audio('../../public/assets/sounds/error.mp3'),
  warning: new Audio('../../public/assets/sounds/warning.mp3'),
  info: new Audio('../../public/assets/sounds/info.mp3')
};

// Preload sounds
Object.values(notificationSounds).forEach(sound => {
  sound.load();
});

/**
 * Show a notification with optional sound
 * @param {string} message - The notification message
 * @param {string} type - The type of notification (success, error, warning, info)
 * @param {Object} options - Additional options
 * @param {string} options.title - Optional title for the notification
 * @param {boolean} options.playSound - Whether to play a sound (default: true)
 * @param {number} options.duration - Duration in ms to show the notification (default: 5000)
 */
function showNotification(message, type = 'info', options = {}) {
  // Default options
  const defaults = {
    title: getDefaultTitle(type),
    playSound: true,
    duration: 5000
  };
  
  // Merge options with defaults
  const settings = { ...defaults, ...options };
  
  // Play sound if enabled
  if (settings.playSound && notificationSounds[type]) {
    notificationSounds[type].currentTime = 0;
    notificationSounds[type].play().catch(err => {
      console.warn('Could not play notification sound:', err);
    });
  }
  
  // Create or get notification container
  let notificationContainer = document.getElementById('notification-container');
  if (!notificationContainer) {
    notificationContainer = document.createElement('div');
    notificationContainer.id = 'notification-container';
    notificationContainer.style.position = 'fixed';
    notificationContainer.style.top = '20px';
    notificationContainer.style.right = '20px';
    notificationContainer.style.zIndex = '9999';
    document.body.appendChild(notificationContainer);
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type} animate-fade-in`;
  notification.style.backgroundColor = getBackgroundColor(type);
  notification.style.color = '#fff';
  notification.style.padding = '15px 20px';
  notification.style.borderRadius = '5px';
  notification.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
  notification.style.marginBottom = '10px';
  notification.style.minWidth = '300px';
  notification.style.position = 'relative';
  notification.style.opacity = '0';
  notification.style.transform = 'translateX(50px)';
  notification.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  
  // Create title if provided
  if (settings.title) {
    const title = document.createElement('h4');
    title.textContent = settings.title;
    title.style.margin = '0 0 5px 0';
    title.style.fontWeight = 'bold';
    notification.appendChild(title);
  }
  
  // Add message
  const messageElement = document.createElement('p');
  messageElement.textContent = message;
  messageElement.style.margin = '0';
  notification.appendChild(messageElement);
  
  // Add close button
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '&times;';
  closeButton.style.position = 'absolute';
  closeButton.style.top = '5px';
  closeButton.style.right = '10px';
  closeButton.style.background = 'none';
  closeButton.style.border = 'none';
  closeButton.style.color = '#fff';
  closeButton.style.fontSize = '20px';
  closeButton.style.cursor = 'pointer';
  closeButton.style.opacity = '0.7';
  closeButton.style.transition = 'opacity 0.2s';
  closeButton.addEventListener('mouseover', () => {
    closeButton.style.opacity = '1';
  });
  closeButton.addEventListener('mouseout', () => {
    closeButton.style.opacity = '0.7';
  });
  closeButton.addEventListener('click', () => {
    removeNotification(notification);
  });
  notification.appendChild(closeButton);
  
  // Add icon based on notification type
  const icon = document.createElement('i');
  icon.className = getIconClass(type);
  icon.style.marginRight = '10px';
  icon.style.fontSize = '18px';
  messageElement.prepend(icon);
  
  // Add to container
  notificationContainer.appendChild(notification);
  
  // Trigger animation
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(0)';
  }, 10);
  
  // Auto-remove after duration
  const timeoutId = setTimeout(() => {
    removeNotification(notification);
  }, settings.duration);
  
  // Store timeout ID for potential early removal
  notification.dataset.timeoutId = timeoutId;
  
  // Return the notification element for potential manipulation
  return notification;
}

/**
 * Remove a notification with animation
 * @param {HTMLElement} notification - The notification element to remove
 */
function removeNotification(notification) {
  // Clear any existing timeout
  if (notification.dataset.timeoutId) {
    clearTimeout(parseInt(notification.dataset.timeoutId));
  }
  
  // Animate out
  notification.style.opacity = '0';
  notification.style.transform = 'translateX(50px)';
  
  // Remove after animation completes
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 300);
}

/**
 * Get default title based on notification type
 * @param {string} type - Notification type
 * @returns {string} Default title
 */
function getDefaultTitle(type) {
  switch (type) {
    case 'success': return 'Success';
    case 'error': return 'Error';
    case 'warning': return 'Warning';
    case 'info': return 'Information';
    default: return 'Notification';
  }
}

/**
 * Get background color based on notification type
 * @param {string} type - Notification type
 * @returns {string} CSS color
 */
function getBackgroundColor(type) {
  switch (type) {
    case 'success': return '#28a745';
    case 'error': return '#dc3545';
    case 'warning': return '#ffc107';
    case 'info': return '#17a2b8';
    default: return '#6c757d';
  }
}

/**
 * Get Font Awesome icon class based on notification type
 * @param {string} type - Notification type
 * @returns {string} Font Awesome class
 */
function getIconClass(type) {
  switch (type) {
    case 'success': return 'fas fa-check-circle';
    case 'error': return 'fas fa-exclamation-circle';
    case 'warning': return 'fas fa-exclamation-triangle';
    case 'info': return 'fas fa-info-circle';
    default: return 'fas fa-bell';
  }
}

// Expose the notification functions globally
window.showNotification = showNotification;
window.removeNotification = removeNotification;
