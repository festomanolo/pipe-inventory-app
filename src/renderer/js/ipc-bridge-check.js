/**
 * IPC Bridge Check
 * Utility for testing IPC communication with main process
 */

// Initialize checks when loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('IPC Bridge Check module loaded');
});

// Run IPC connectivity checks
async function runIPCChecks() {
  console.log('===== RUNNING IPC BRIDGE CHECKS =====');
  
  // Check if electronAPI is available
  if (!window.electronAPI) {
    console.error('❌ electronAPI not available in window object');
    return {
      success: false,
      error: 'electronAPI not available'
    };
  }
  
  console.log('✅ electronAPI found in window object');
  
  // Test basic app info methods
  const apiMethods = Object.keys(window.electronAPI);
  console.log(`Found ${apiMethods.length} methods in electronAPI:`, apiMethods);
  
  try {
    // Check database status
    if (typeof window.electronAPI.getDatabaseStatus === 'function') {
      const dbStatus = await window.electronAPI.getDatabaseStatus();
      console.log('✅ Database status check successful:', dbStatus);
    } else {
      console.warn('⚠️ getDatabaseStatus method not available');
    }
    
    // Check app version
    if (typeof window.electronAPI.getAppVersion === 'function') {
      const version = await window.electronAPI.getAppVersion();
      console.log('✅ App version:', version);
    } else {
      console.warn('⚠️ getAppVersion method not available');
    }
    
    // Check reports methods
    const reportsMethods = [
      'getReports', 'getAllReports', 'getReport', 'getReportById',
      'createReport', 'updateReport', 'deleteReport'
    ];
    
    let missingReportsMethods = reportsMethods.filter(
      method => typeof window.electronAPI[method] !== 'function'
    );
    
    if (missingReportsMethods.length === 0) {
      console.log('✅ All reports API methods available');
    } else {
      console.warn(`⚠️ Missing reports API methods: ${missingReportsMethods.join(', ')}`);
    }
    
    // Test data retrieval methods
    if (typeof window.electronAPI.getInventory === 'function') {
      const inventory = await window.electronAPI.getInventory();
      console.log(`✅ getInventory returned ${inventory?.length || 0} items`);
    }
    
    if (typeof window.electronAPI.getSales === 'function') {
      const sales = await window.electronAPI.getSales();
      console.log(`✅ getSales returned ${sales?.length || 0} records`);
    }
    
    console.log('===== IPC BRIDGE CHECKS COMPLETED =====');
    return {
      success: true,
      methods: apiMethods,
      missingReportsMethods: missingReportsMethods
    };
    
  } catch (error) {
    console.error('❌ Error during IPC checks:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Export the module
window.IPCBridgeCheck = {
  runIPCChecks
}; 