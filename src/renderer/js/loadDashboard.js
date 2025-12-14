/**
 * loadDashboard.js - Dashboard data loading functionality
 * This file contains the function to load dashboard data asynchronously
 */

console.log('Loading dashboard.js module');

// Load dashboard data and return a Promise
window.loadDashboardData = function() {
  console.log('loadDashboardData function called');
  return new Promise(async (resolve, reject) => {
    try {
      console.log('Inside loadDashboardData Promise');
      
      // Get current date
      const currentDate = document.getElementById('current-date');
      if (currentDate) {
        currentDate.textContent = new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
      
      // Add retry mechanism for data fetching
      let inventory = [];
      let sales = [];
      let settings = {};
      let retryCount = 0;
      const maxRetries = 3;
      
      async function fetchData() {
        try {
          console.log(`Fetching data from electronAPI... (attempt ${retryCount + 1}/${maxRetries})`);
          // Load inventory, sales, and settings data
          [inventory, sales, settings] = await Promise.all([
            window.electronAPI.getInventory(),
            window.electronAPI.getSales(),
            window.electronAPI.getSettings()
          ]);
          
          console.log('Data fetched successfully:', { 
            inventoryCount: inventory?.length || 0,
            salesCount: sales?.length || 0,
            settings: settings ? 'loaded' : 'not loaded'
          });
          
          return true;
        } catch (error) {
          console.error(`Error fetching data (attempt ${retryCount + 1}/${maxRetries}):`, error);
          retryCount++;
          
          if (retryCount < maxRetries) {
            console.log(`Retrying in ${retryCount * 1000}ms...`);
            await new Promise(r => setTimeout(r, retryCount * 1000));
            return fetchData();
          }
          
          // Use fallback data if all retries fail
          console.log('Using fallback data after all retries failed');
          inventory = localStorage.getItem('inventory_backup') ? 
            JSON.parse(localStorage.getItem('inventory_backup')) : [];
          sales = localStorage.getItem('sales_backup') ? 
            JSON.parse(localStorage.getItem('sales_backup')) : [];
          settings = localStorage.getItem('settings_backup') ? 
            JSON.parse(localStorage.getItem('settings_backup')) : {};
            
          if (Dashboard && Dashboard.showNotification) {
            Dashboard.showNotification('Using cached data - some information may be outdated', 'warning');
          }
          
          return inventory.length > 0 || sales.length > 0;
        }
      }
      
      // Fetch data with retry mechanism
      const dataFetched = await fetchData();
      
      // Validate data before proceeding
      if (!Array.isArray(inventory)) {
        console.error('Invalid inventory data:', inventory);
        inventory = [];
      }
      
      if (!Array.isArray(sales)) {
        console.error('Invalid sales data:', sales);
        sales = [];
      }
      
      if (!settings || typeof settings !== 'object') {
        console.error('Invalid settings data:', settings);
        settings = {};
      }
      
      // Store backup of data in localStorage for offline/recovery use
      try {
        localStorage.setItem('inventory_backup', JSON.stringify(inventory));
        localStorage.setItem('sales_backup', JSON.stringify(sales));
        localStorage.setItem('settings_backup', JSON.stringify(settings));
        localStorage.setItem('dashboard_last_updated', new Date().toISOString());
      } catch (storageError) {
        console.warn('Failed to save data backup to localStorage:', storageError);
      }
      
      // Get today's sales
      const todaySales = sales.filter(sale => {
        try {
          const today = new Date();
          const saleDate = new Date(sale.date);
          return saleDate.setHours(0,0,0,0) === today.setHours(0,0,0,0);
        } catch (error) {
          console.warn('Error processing sale date:', error);
          return false;
        }
      });
      
      console.log('Updating dashboard components...');
      
      // Check if Dashboard object is available before updating components
      if (!Dashboard) {
        console.error('Dashboard object is not available');
        if (typeof window.initializeDashboardComponents === 'function') {
          console.log('Attempting to initialize dashboard components...');
          window.initializeDashboardComponents();
        } else {
          throw new Error('Dashboard initialization failed - required objects not available');
        }
      }
      
      // Safely update dashboard components with try/catch for each component
      try {
        // Update dashboard stats
        Dashboard.updateDashboardStats(inventory, todaySales, sales);
      } catch (statsError) {
        console.error('Error updating dashboard stats:', statsError);
      }
      
      try {
        // Update charts
        Dashboard.updateCharts(inventory, sales);
      } catch (chartsError) {
        console.error('Error updating charts:', chartsError);
      }
      
      try {
        // Update recent sales table
        Dashboard.updateRecentSales(sales, settings.currency);
      } catch (salesError) {
        console.error('Error updating recent sales:', salesError);
      }
      
      try {
        // Update low stock items
        Dashboard.updateLowStockItems(inventory);
      } catch (stockError) {
        console.error('Error updating low stock items:', stockError);
      }
      
      try {
        // Generate recommendations
        Dashboard.updateRecommendations(inventory, sales);
      } catch (recError) {
        console.error('Error updating recommendations:', recError);
      }
      
      try {
        // Check for low stock alerts
        Dashboard.checkLowStockAlerts(inventory);
      } catch (alertError) {
        console.error('Error checking low stock alerts:', alertError);
      }
      
      // Initialize alert modal trigger
      const viewAlertsBtn = document.getElementById('view-alerts');
      if (viewAlertsBtn) {
        viewAlertsBtn.addEventListener('click', function(e) {
          e.preventDefault();
          try {
            Dashboard.loadAlertItems();
            new bootstrap.Modal(document.getElementById('alertsModal')).show();
          } catch (error) {
            console.error('Error showing alerts modal:', error);
            Dashboard.showNotification('Could not show alerts. Please try again.', 'error');
          }
        });
      }
      
      // Add event listener for refresh recommendations button
      const refreshRecommendationsBtn = document.getElementById('refresh-recommendations');
      if (refreshRecommendationsBtn) {
        refreshRecommendationsBtn.addEventListener('click', async function() {
          try {
            this.disabled = true;
            this.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Refreshing...';
            await Dashboard.generateRecommendations();
            this.disabled = false;
            this.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
          } catch (error) {
            console.error('Error refreshing recommendations:', error);
            this.disabled = false;
            this.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
            Dashboard.showNotification('Error refreshing recommendations', 'error');
          }
        });
      }
      
      // Add event listener for dashboard refresh button
      const refreshDashboardBtn = document.getElementById('refresh-dashboard');
      if (refreshDashboardBtn) {
        refreshDashboardBtn.addEventListener('click', async function() {
          try {
            // Show loading state
            this.disabled = true;
            this.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Refreshing...';
            
            // Refresh the dashboard data
            await window.loadDashboardData();
            
            // Restore button state
            this.disabled = false;
            this.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
            
            // Show success notification
            if (Dashboard && Dashboard.showNotification) {
              Dashboard.showNotification('Dashboard refreshed successfully');
            }
          } catch (error) {
            console.error('Error refreshing dashboard:', error);
            
            // Restore button state
            this.disabled = false;
            this.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
            
            // Show error notification
            if (Dashboard && Dashboard.showNotification) {
              Dashboard.showNotification('Error refreshing dashboard data', 'error');
            }
          }
        });
      }
      
      console.log('Dashboard data loaded successfully');
      // Resolve the promise when everything is loaded
      resolve({ success: true, dataFetched });
    } catch (error) {
      console.error('Error in loadDashboardData:', error);
      if (Dashboard && Dashboard.showNotification) {
        Dashboard.showNotification('Error loading dashboard data. Please refresh the page.', 'error');
      }
      reject(error);
    }
  });
};

console.log('loadDashboardData function defined on window object');

// Apply blue header styling to all tables
function applyBlueHeadersToTables() {
  console.log('Applying blue headers to all tables');
  
  // Find all tables with headers
  const tables = document.querySelectorAll('table');
  
  tables.forEach(table => {
    const header = table.querySelector('thead');
    if (header) {
      // Apply styles directly to the element
      header.style.backgroundColor = '#3b82f6';
      
      const headerRows = header.querySelectorAll('tr');
      headerRows.forEach(row => {
        row.style.backgroundColor = '#3b82f6';
        row.style.color = 'white';
      });
      
      const headerCells = header.querySelectorAll('th');
      headerCells.forEach(cell => {
        cell.style.backgroundColor = '#3b82f6';
        cell.style.color = 'white';
        cell.style.fontWeight = 'bold';
        cell.style.borderColor = 'rgba(255, 255, 255, 0.2)';
      });
    }
  });
}

// Call the function when the document is ready
document.addEventListener('DOMContentLoaded', () => {
  // Apply blue headers immediately
  applyBlueHeadersToTables();
  
  // Also apply after a short delay to catch dynamically loaded tables
  setTimeout(applyBlueHeadersToTables, 500);
  setTimeout(applyBlueHeadersToTables, 1500);
});

