// Load settings when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize settings page elements
    initGeneralSettings();
    initAppearanceSettings();
    initBackupSettings();
    initAboutModal();
    
    // Initialize cloud sync settings
    initCloudSyncSettings();
    
    // Add listener for tab changes to refresh data
    document.querySelectorAll('button[data-bs-toggle="tab"]').forEach(tab => {
        tab.addEventListener('shown.bs.tab', function(event) {
            const targetId = event.target.getAttribute('aria-controls');
            
            // Refresh data in the selected tab
            if (targetId === 'cloud-sync') {
                window.electronAPI.getSyncStatus()
                    .then(status => updateSyncStatusUI(status))
                    .catch(err => console.error('Error refreshing sync status:', err));
            }
        });
    });
});

// Save settings
document.getElementById('settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const companyName = document.getElementById('company-name').value;
        const alertThreshold = parseInt(document.getElementById('alert-threshold').value);
        const currency = document.getElementById('currency').value;
        
        await window.electronAPI.updateSettings({
            companyName,
            alertThreshold,
            currency
        });
        
        showNotification('Settings saved successfully', 'success');
    } catch (error) {
        console.error('Error saving settings:', error);
        showNotification('Error saving settings', 'error');
    }
});

// Choose directory for reports
document.getElementById('choose-directory').addEventListener('click', async () => {
    try {
        const result = await window.electronAPI.savePdf({
            defaultPath: document.getElementById('report-directory').value,
            properties: ['openDirectory', 'createDirectory']
        });
        
        if (result) {
            document.getElementById('report-directory').value = result;
        }
    } catch (error) {
        console.error('Error selecting directory:', error);
        showNotification('Error selecting directory', 'error');
    }
});

// Generate report now
document.getElementById('generate-report-now').addEventListener('click', async () => {
    try {
        // Show loading state
        const button = document.getElementById('generate-report-now');
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Generating...';
        
        // Save settings first to ensure they're up to date
        await saveDailyReportSettings();
        
        // Generate the report
        const result = await window.electronAPI.generateDailyReportNow();
        
        // Handle result
        if (result.success) {
            showNotification(`Report generated: ${result.message}`, 'success');
            
            // Ask if user wants to open the file
            if (confirm('Report generated successfully! Do you want to open it?')) {
                window.electronAPI.openFile(result.filePath);
            }
        } else {
            showNotification(result.message || 'No sales to report', 'warning');
        }
    } catch (error) {
        console.error('Error generating report:', error);
        showNotification('Error generating report', 'error');
    } finally {
        // Reset button state
        const button = document.getElementById('generate-report-now');
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-file-pdf me-2"></i> Generate Today\'s Report Now';
    }
});

// Save daily report settings
async function saveDailyReportSettings() {
    try {
        const settings = {
            enabled: document.getElementById('enable-daily-reports').checked,
            hour: parseInt(document.getElementById('report-hour').value),
            minute: parseInt(document.getElementById('report-minute').value),
            directory: document.getElementById('report-directory').value,
            showNotification: document.getElementById('show-notifications').checked
        };
        
        return await window.electronAPI.updateDailyReportSettings(settings);
    } catch (error) {
        console.error('Error saving daily report settings:', error);
        throw error;
    }
}

// Show notification
function showNotification(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(container);
    }
    
    document.getElementById('toast-container').appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // Remove toast after it's hidden
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// Add About button functionality
const aboutButton = document.getElementById('about-button');
if (aboutButton) {
    aboutButton.addEventListener('click', () => {
        const aboutModal = new bootstrap.Modal(document.getElementById('aboutModal'));
        aboutModal.show();
    });
}

// Handle Cloud Sync tab
async function initCloudSyncSettings() {
  try {
    console.log('Initializing cloud sync settings');
    
    // Get current sync status
    const syncStatus = await window.electronAPI.getSyncStatus();
    console.log('Current sync status:', syncStatus);
    
    // Update the UI with the current status
    updateSyncStatusUI(syncStatus);
    
    // Add event listeners
    document.getElementById('save-supabase-config').addEventListener('click', saveSupabaseConfig);
    document.getElementById('sync-now-button').addEventListener('click', syncAllData);
    document.getElementById('sync-inventory-button').addEventListener('click', syncInventory);
    document.getElementById('sync-sales-button').addEventListener('click', syncSales);
    
    // Add listeners for sync events
    window.electronAPI.onSyncStatusChanged(updateSyncStatusUI);
    window.electronAPI.onSyncCompleted((result) => {
      console.log('Sync completed:', result);
      showNotification(`Sync completed: ${result.message}`, result.success ? 'success' : 'warning');
      updateSyncStatusUI();
    });
    
    window.electronAPI.onSyncError((error) => {
      console.error('Sync error:', error);
      showNotification(`Sync error: ${error.message}`, 'error');
    });
  } catch (error) {
    console.error('Error initializing cloud sync settings:', error);
    showNotification('Error initializing cloud sync settings', 'error');
  }
}

// Save Supabase configuration
async function saveSupabaseConfig() {
  try {
    const supabaseUrl = document.getElementById('supabase-url').value.trim();
    const supabaseKey = document.getElementById('supabase-key').value.trim();
    
    if (!supabaseUrl || !supabaseKey) {
      showNotification('Please enter both Supabase URL and API Key', 'warning');
      return;
    }
    
    // Save configuration
    const result = await window.electronAPI.configureSupabase({
      url: supabaseUrl,
      key: supabaseKey
    });
    
    if (result.success) {
      showNotification('Supabase configuration saved successfully', 'success');
      
      // Update sync status UI
      const syncStatus = await window.electronAPI.getSyncStatus();
      updateSyncStatusUI(syncStatus);
    } else {
      showNotification(`Failed to save Supabase configuration: ${result.error}`, 'error');
    }
  } catch (error) {
    console.error('Error saving Supabase config:', error);
    showNotification(`Error saving configuration: ${error.message}`, 'error');
  }
}

// Update the sync status UI
function updateSyncStatusUI(status) {
  // If status is not provided, fetch it
  if (!status) {
    window.electronAPI.getSyncStatus()
      .then(updatedStatus => {
        updateSyncStatusUI(updatedStatus);
      })
      .catch(error => {
        console.error('Error fetching sync status:', error);
      });
    return;
  }
  
  // Update the UI with the current status
  const statusIndicator = document.getElementById('sync-status-indicator');
  const lastSyncTimestamp = document.getElementById('last-sync-timestamp');
  const syncDetailsContainer = document.getElementById('sync-details-container');
  
  // Set status indicator color
  if (status.supabaseConfigured) {
    statusIndicator.className = 'status-badge status-success';
    statusIndicator.textContent = 'Connected';
  } else {
    statusIndicator.className = 'status-badge status-warning';
    statusIndicator.textContent = 'Not Configured';
  }
  
  // Set last sync timestamp
  if (status.lastSync) {
    const lastSyncTimes = [];
    
    // Get most recent sync time across all tables
    for (const [table, timestamp] of Object.entries(status.lastSync)) {
      if (timestamp) {
        lastSyncTimes.push({ table, timestamp });
      }
    }
    
    if (lastSyncTimes.length > 0) {
      // Sort by timestamp, most recent first
      lastSyncTimes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // Format the timestamp
      const mostRecent = new Date(lastSyncTimes[0].timestamp);
      lastSyncTimestamp.textContent = mostRecent.toLocaleString();
    } else {
      lastSyncTimestamp.textContent = 'Never';
    }
  } else {
    lastSyncTimestamp.textContent = 'Never';
  }
  
  // Update sync details
  let detailsHTML = '<h6 class="mb-3">Sync Details</h6><ul class="list-group">';
  
  // Add details for each table
  for (const table of ['inventory', 'sales', 'customers']) {
    const timestamp = status.lastSync && status.lastSync[table] 
      ? new Date(status.lastSync[table]).toLocaleString()
      : 'Never';
    
    detailsHTML += `
      <li class="list-group-item d-flex justify-content-between align-items-center">
        ${table.charAt(0).toUpperCase() + table.slice(1)}
        <span>${timestamp}</span>
      </li>
    `;
  }
  
  // Add offline changes info if any
  if (status.offlineChanges > 0) {
    detailsHTML += `
      <li class="list-group-item d-flex justify-content-between align-items-center list-group-item-warning">
        Pending Offline Changes
        <span>${status.offlineChanges}</span>
      </li>
    `;
  }
  
  detailsHTML += '</ul>';
  
  // Add sync controls
  detailsHTML += `
    <div class="mt-4">
      <button id="sync-now-button" class="btn btn-primary me-2">
        <i class="fas fa-sync me-1"></i> Sync All Data
      </button>
      <button id="sync-inventory-button" class="btn btn-outline-primary me-2">
        Sync Inventory
      </button>
      <button id="sync-sales-button" class="btn btn-outline-primary">
        Sync Sales
      </button>
    </div>
  `;
  
  syncDetailsContainer.innerHTML = detailsHTML;
  
  // Re-add event listeners (since we replaced the HTML)
  document.getElementById('sync-now-button').addEventListener('click', syncAllData);
  document.getElementById('sync-inventory-button').addEventListener('click', syncInventory);
  document.getElementById('sync-sales-button').addEventListener('click', syncSales);
}

// Sync all data
async function syncAllData() {
  try {
    // Show loading state
    const syncButton = document.getElementById('sync-now-button');
    const originalHTML = syncButton.innerHTML;
    syncButton.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Syncing...';
    syncButton.disabled = true;
    
    // Perform sync
    const result = await window.electronAPI.syncAll();
    
    // Show result
    showNotification(result.message, result.success ? 'success' : 'warning');
    
    // Reset button state
    syncButton.innerHTML = originalHTML;
    syncButton.disabled = false;
    
    // Update UI
    const syncStatus = await window.electronAPI.getSyncStatus();
    updateSyncStatusUI(syncStatus);
  } catch (error) {
    console.error('Error during sync:', error);
    showNotification(`Error during sync: ${error.message}`, 'error');
    
    // Reset button state
    const syncButton = document.getElementById('sync-now-button');
    syncButton.innerHTML = '<i class="fas fa-sync me-1"></i> Sync All Data';
    syncButton.disabled = false;
  }
}

// Sync inventory
async function syncInventory() {
  try {
    // Show loading state
    const syncButton = document.getElementById('sync-inventory-button');
    const originalHTML = syncButton.innerHTML;
    syncButton.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Syncing...';
    syncButton.disabled = true;
    
    // Perform sync
    const result = await window.electronAPI.syncInventory();
    
    // Show result
    showNotification(result.message, result.success ? 'success' : 'warning');
    
    // Reset button state
    syncButton.innerHTML = originalHTML;
    syncButton.disabled = false;
    
    // Update UI
    const syncStatus = await window.electronAPI.getSyncStatus();
    updateSyncStatusUI(syncStatus);
  } catch (error) {
    console.error('Error during inventory sync:', error);
    showNotification(`Error during inventory sync: ${error.message}`, 'error');
    
    // Reset button state
    const syncButton = document.getElementById('sync-inventory-button');
    syncButton.innerHTML = 'Sync Inventory';
    syncButton.disabled = false;
  }
}

// Sync sales
async function syncSales() {
  try {
    // Show loading state
    const syncButton = document.getElementById('sync-sales-button');
    const originalHTML = syncButton.innerHTML;
    syncButton.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Syncing...';
    syncButton.disabled = true;
    
    // Perform sync
    const result = await window.electronAPI.syncSales();
    
    // Show result
    showNotification(result.message, result.success ? 'success' : 'warning');
    
    // Reset button state
    syncButton.innerHTML = originalHTML;
    syncButton.disabled = false;
    
    // Update UI
    const syncStatus = await window.electronAPI.getSyncStatus();
    updateSyncStatusUI(syncStatus);
  } catch (error) {
    console.error('Error during sales sync:', error);
    showNotification(`Error during sales sync: ${error.message}`, 'error');
    
    // Reset button state
    const syncButton = document.getElementById('sync-sales-button');
    syncButton.innerHTML = 'Sync Sales';
    syncButton.disabled = false;
  }
}

// Initialize general settings
async function initGeneralSettings() {
  try {
    console.log('Initializing general settings');
    
    // Get current settings
    const settings = await window.electronAPI.getSettings();
    
    // Update form with current settings
    document.getElementById('company-name').value = settings.companyName || '';
    document.getElementById('alert-threshold').value = settings.alertThreshold || 10;
    document.getElementById('currency').value = settings.currency || 'TZS';
    
    // Load daily report settings
    const reportSettings = await window.electronAPI.getDailyReportSettings();
    document.getElementById('enable-daily-reports').checked = reportSettings.enabled !== false;
    document.getElementById('report-hour').value = reportSettings.hour || 0;
    document.getElementById('report-minute').value = reportSettings.minute || 0;
    document.getElementById('report-directory').value = reportSettings.directory || '';
    document.getElementById('show-notifications').checked = reportSettings.showNotification !== false;
  } catch (error) {
    console.error('Error loading general settings:', error);
    showNotification('Error loading settings', 'error');
  }
}

// Initialize appearance settings
async function initAppearanceSettings() {
  try {
    console.log('Initializing appearance settings');
    
    // This would load theme settings when implemented
  } catch (error) {
    console.error('Error loading appearance settings:', error);
  }
}

// Initialize backup settings
async function initBackupSettings() {
  try {
    console.log('Initializing backup settings');
    
    // This would load backup settings when implemented
  } catch (error) {
    console.error('Error loading backup settings:', error);
  }
} 