/**
 * Test Script for Reports Database Connectivity
 * This script validates the connection between reports and the database
 */

// Run when document is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Reports Database Test initialized');
  
  // Add a test button if it doesn't exist
  addTestButton();
});

// Add a test button to the page
function addTestButton() {
  // Check if we're on the reports page
  if (!window.location.pathname.includes('reports.html')) {
    console.log('Not on reports page, skipping test button');
    return;
  }
  
  // Create button if it doesn't exist
  if (!document.getElementById('testReportsDbBtn')) {
    const btn = document.createElement('button');
    btn.id = 'testReportsDbBtn';
    btn.className = 'btn btn-secondary ms-2';
    btn.innerHTML = '<i class="fas fa-database me-1"></i> Test DB';
    btn.title = 'Test database connectivity for reports';
    btn.addEventListener('click', testReportsDatabase);
    
    // Find the parent container
    const toolbar = document.querySelector('.content-header .btn-toolbar');
    if (toolbar) {
      toolbar.appendChild(btn);
    }
  }
}

// Test database connectivity for reports
async function testReportsDatabase() {
  console.log('Testing reports database connectivity...');
  showTestStatus('Testing database connectivity...', 'info');
  
  try {
    // Check inventory data retrieval
    console.log('Testing inventory data retrieval...');
    const inventory = await getInventoryData();
    console.log(`Retrieved ${inventory.length} inventory items`);
    
    // Check sales data retrieval
    console.log('Testing sales data retrieval...');
    const sales = await getSalesData();
    console.log(`Retrieved ${sales.length} sales records`);
    
    // Check reports data
    console.log('Testing reports data retrieval...');
    const reports = await getReportsData();
    console.log(`Retrieved ${reports.length} reports`);
    
    // Generate a test report
    console.log('Testing report generation...');
    const testReport = await generateTestReport();
    console.log('Test report generated:', testReport);
    
    showTestStatus('Database test successful!', 'success');
    return true;
  } catch (error) {
    console.error('Database test failed:', error);
    showTestStatus(`Test failed: ${error.message}`, 'danger');
    return false;
  }
}

// Get inventory data
async function getInventoryData() {
  if (window.electronAPI && typeof window.electronAPI.getInventory === 'function') {
    const inventory = await window.electronAPI.getInventory() || [];
    return inventory;
  } else {
    throw new Error('Cannot access inventory data: API not available');
  }
}

// Get sales data
async function getSalesData() {
  if (window.electronAPI && typeof window.electronAPI.getSales === 'function') {
    const sales = await window.electronAPI.getSales() || [];
    return sales;
  } else {
    throw new Error('Cannot access sales data: API not available');
  }
}

// Get reports data
async function getReportsData() {
  if (window.electronAPI && typeof window.electronAPI.getReports === 'function') {
    const reports = await window.electronAPI.getReports() || [];
    return reports;
  } else {
    throw new Error('Cannot access reports data: API not available');
  }
}

// Generate a test report
async function generateTestReport() {
  if (window.ReportsHandlers && typeof window.ReportsHandlers.generateReport === 'function') {
    const report = await window.ReportsHandlers.generateReport('inventory');
    return report;
  } else {
    throw new Error('Cannot generate test report: ReportsHandlers not available');
  }
}

// Show test status message
function showTestStatus(message, type = 'info') {
  if (window.showNotification) {
    window.showNotification(message, type);
  } else {
    alert(message);
  }
  
  // Also log to console
  if (type === 'success') {
    console.log('%c' + message, 'color: green; font-weight: bold');
  } else if (type === 'danger') {
    console.error('%c' + message, 'color: red; font-weight: bold');
  } else {
    console.log('%c' + message, 'color: blue; font-weight: bold');
  }
}

// Export test functions
window.TestReportsDB = {
  testReportsDatabase,
  getInventoryData,
  getSalesData,
  getReportsData,
  generateTestReport
}; 