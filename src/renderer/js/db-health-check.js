/**
 * Database Health Checker
 * Utility script to detect database connectivity issues and provide fallback options
 */

(function() {
  // Default timeout value in milliseconds (15 seconds)
  const DEFAULT_TIMEOUT = 15000;
  
  // Initialize
  function init(options = {}) {
    const timeout = options.timeout || DEFAULT_TIMEOUT;
    const containerId = options.containerId || 'loading-indicator';
    const errorContainerId = options.errorContainerId || 'error-container';
    
    console.log('Database health checker initialized with timeout:', timeout);
    
    // Find the loading container
    const loadingContainer = document.getElementById(containerId);
    if (!loadingContainer) {
      console.warn('Loading container not found with ID:', containerId);
      return;
    }
    
    // Find or create the error container
    let errorContainer = document.getElementById(errorContainerId);
    if (!errorContainer) {
      console.log('Creating error container with ID:', errorContainerId);
      errorContainer = document.createElement('div');
      errorContainer.id = errorContainerId;
      errorContainer.style.display = 'none';
      loadingContainer.parentNode.insertBefore(errorContainer, loadingContainer.nextSibling);
    }
    
    // Set timeout to check if loading takes too long
    const timeoutId = setTimeout(() => {
      console.warn('Database operation timeout - possible connectivity issue');
      
      // Hide loading indicator
      loadingContainer.style.display = 'none';
      
      // Show error message
      errorContainer.style.display = 'block';
      errorContainer.innerHTML = `
        <div class="alert alert-danger">
          <div class="text-center py-3">
            <i class="fas fa-database fa-3x mb-3"></i>
            <h4>Database Connection Issue</h4>
            <p>The application is having trouble connecting to the database.</p>
            <p class="small text-muted">This may be due to a missing or incompatible SQLite module.</p>
            <div class="mt-3">
              <button class="btn btn-outline-primary" onclick="window.location.reload()">
                <i class="fas fa-sync-alt mr-2"></i> Refresh Page
              </button>
              ${options.showFallbackButton ? `
              <button class="btn btn-outline-secondary ml-2" onclick="window.showFallbackData()">
                <i class="fas fa-table mr-2"></i> Show Sample Data
              </button>
              ` : ''}
            </div>
          </div>
        </div>
      `;
      
      // Call the onTimeout callback if provided
      if (typeof options.onTimeout === 'function') {
        options.onTimeout();
      }
      
      // Dispatch a custom event that other scripts can listen for
      document.dispatchEvent(new CustomEvent('db-connection-timeout', {
        detail: { 
          timestamp: new Date(),
          message: 'Database connection timed out'
        }
      }));
      
    }, timeout);
    
    // Function to cancel the timeout (to be called when data loads successfully)
    function cancel() {
      console.log('Database health check cancelled - data loaded successfully');
      clearTimeout(timeoutId);
    }
    
    // Return the cancel function so it can be called when data loads
    return {
      cancel
    };
  }
  
  // Export to window object
  window.dbHealthCheck = {
    init
  };
})(); 