// Main application script for Eliva Hardware

// DOM Elements
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');
const minimizeBtn = document.getElementById('minimize-btn');
const maximizeBtn = document.getElementById('maximize-btn');
const closeBtn = document.getElementById('close-btn');
const currentDateEl = document.getElementById('current-date');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

// Initialize the application
function initApp() {
  // Set up navigation
  setupNavigation();
  
  // Set up window controls
  setupWindowControls();
  
  // Display current date
  displayCurrentDate();
  
  // Initialize modules
  initDashboard();
  initInventory();
  initSales();
  initReports();
  initAlerts();
  initSettings();
  
  // Check for low stock alerts
  checkLowStockAlerts();
}

// Set up navigation between pages
function setupNavigation() {
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const pageId = item.getAttribute('data-page');
      navigateToPage(pageId);
    });
  });
  
  // Handle hash navigation
  window.addEventListener('hashchange', handleHashChange);
  handleHashChange();
}

// Handle hash change for navigation
function handleHashChange() {
  const hash = window.location.hash.substring(1);
  if (hash) {
    navigateToPage(hash);
  }
}

// Navigate to a specific page
function navigateToPage(pageId) {
  // Update active nav item
  navItems.forEach(item => {
    if (item.getAttribute('data-page') === pageId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
  
  // Show the selected page
  pages.forEach(page => {
    if (page.id === pageId) {
      page.classList.add('active');
    } else {
      page.classList.remove('active');
    }
  });
  
  // Update URL hash without scrolling
  const scrollPosition = window.scrollY;
  window.location.hash = pageId;
  window.scrollTo(0, scrollPosition);
}

// Set up window control buttons
function setupWindowControls() {
  minimizeBtn.addEventListener('click', () => {
    window.api.minimizeWindow();
  });
  
  maximizeBtn.addEventListener('click', () => {
    window.api.maximizeWindow();
    toggleMaximizeIcon();
  });
  
  closeBtn.addEventListener('click', () => {
    window.api.closeWindow();
  });
}

// Toggle maximize/restore icon
function toggleMaximizeIcon() {
  const icon = maximizeBtn.querySelector('i');
  if (icon.classList.contains('fa-expand')) {
    icon.classList.replace('fa-expand', 'fa-compress');
  } else {
    icon.classList.replace('fa-compress', 'fa-expand');
  }
}

// Display current date in the dashboard
function displayCurrentDate() {
  if (currentDateEl) {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateEl.textContent = now.toLocaleDateString('en-US', options);
  }
}

// Initialize dashboard
function initDashboard() {
  // This function will be implemented in dashboard.js
  if (typeof loadDashboard === 'function') {
    loadDashboard();
  }
}

// Initialize inventory
function initInventory() {
  // This function will be implemented in inventory.js
  if (typeof loadInventory === 'function') {
    loadInventory();
  }
}

// Initialize sales
function initSales() {
  // This function will be implemented in sales.js
  if (typeof loadSales === 'function') {
    loadSales();
  }
}

// Initialize reports
function initReports() {
  // This function will be implemented in reports.js
  if (typeof loadReports === 'function') {
    loadReports();
  }
}

// Initialize alerts
function initAlerts() {
  // This function will be implemented in alerts.js
  if (typeof loadAlerts === 'function') {
    loadAlerts();
  }
}

// Initialize settings
function initSettings() {
  // This function will be implemented in settings.js
  if (typeof loadSettings === 'function') {
    loadSettings();
  }
}

// Check for low stock alerts
function checkLowStockAlerts() {
  window.api.getLowStockAlerts().then(items => {
    const alertsCount = document.getElementById('alerts-count');
    if (alertsCount) {
      alertsCount.textContent = items.length;
      if (items.length > 0) {
        alertsCount.classList.add('pulse');
      } else {
        alertsCount.classList.remove('pulse');
      }
    }
  }).catch(err => {
    console.error('Error checking low stock alerts:', err);
  });
}

// Show toast notification
function showToast(type, title, message, duration = 3000) {
  const toastContainer = document.getElementById('toast-container');
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const iconClass = {
    success: 'fa-check-circle',
    warning: 'fa-exclamation-triangle',
    error: 'fa-times-circle',
    info: 'fa-info-circle'
  };
  
  toast.innerHTML = `
    <div class="toast-icon">
      <i class="fas ${iconClass[type]}"></i>
    </div>
    <div class="toast-content">
      <p class="toast-title">${title}</p>
      <p class="toast-message">${message}</p>
    </div>
    <button class="toast-close">&times;</button>
  `;
  
  toastContainer.appendChild(toast);
  
  // Add event listener to close button
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.remove();
  });
  
  // Auto remove after duration
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);
}

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Format time
function formatTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Format date and time
function formatDateTime(dateString) {
  return `${formatDate(dateString)} ${formatTime(dateString)}`;
}

// Export utility functions
window.appUtils = {
  navigateToPage,
  showToast,
  formatCurrency,
  formatDate,
  formatTime,
  formatDateTime
}; 