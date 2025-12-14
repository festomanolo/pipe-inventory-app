/**
 * Debug Reports Module
 * Provides tools for diagnosing and fixing issues with reports functionality
 */

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('Debug Reports module initialized');
  
  // Initialize handlers
  initializeReportsHandlers();
  
  // Setup event listeners
  setupDebugListeners();
});

/**
 * Initialize the ReportsHandlers object if it doesn't exist
 * This is a fallback mechanism to ensure the reports functionality works
 * even if the main reports-handlers.js file fails to load
 */
function initializeReportsHandlers() {
  console.log('=== INITIALIZING REPORTS HANDLERS ===');
  
  try {
    // Check if ReportsHandlers exists, create if not
    if (!window.ReportsHandlers) {
      console.log('Creating ReportsHandlers object');
      window.ReportsHandlers = {};
    }
    
    // Create loadReportsData if it doesn't exist
    if (!window.ReportsHandlers.loadReportsData) {
      console.log('Creating fallback loadReportsData function');
      window.ReportsHandlers.loadReportsData = async function() {
        console.log('Using fallback loadReportsData implementation');
        
        // Try to get reports from various sources
        let reports = [];
        
        // Try electronAPI first
        if (window.electronAPI) {
          if (typeof window.electronAPI.getReports === 'function') {
            try {
              reports = await window.electronAPI.getReports();
              console.log(`Got ${reports.length} reports from electronAPI.getReports`);
              return reports;
            } catch (error) {
              console.error('Error getting reports from electronAPI.getReports:', error);
            }
          } else if (typeof window.electronAPI.getAllReports === 'function') {
            try {
              reports = await window.electronAPI.getAllReports();
              console.log(`Got ${reports.length} reports from electronAPI.getAllReports`);
              return reports;
            } catch (error) {
              console.error('Error getting reports from electronAPI.getAllReports:', error);
            }
          }
        }
        
        // Try LocalDatabase
        if (window.LocalDatabase && typeof window.LocalDatabase.getReports === 'function') {
          try {
            reports = window.LocalDatabase.getReports();
            console.log(`Got ${reports.length} reports from LocalDatabase`);
            return reports;
          } catch (error) {
            console.error('Error getting reports from LocalDatabase:', error);
          }
        }
        
        // Fallback to localStorage
        try {
          const storedReports = localStorage.getItem('reports');
          if (storedReports) {
            reports = JSON.parse(storedReports);
            console.log(`Got ${reports.length} reports from localStorage`);
            return reports;
          }
        } catch (error) {
          console.error('Error getting reports from localStorage:', error);
        }
        
        console.log('No reports found in any data source');
        return [];
      };
    }
    
    // Create generateReport if it doesn't exist
    if (!window.ReportsHandlers.generateReport) {
      console.log('Creating fallback generateReport function');
      window.ReportsHandlers.generateReport = async function(type, params = {}) {
        console.log(`Using fallback generateReport implementation for ${type} report`);
        
        // Try electronAPI first
        if (window.electronAPI) {
          if (type === 'inventory' && typeof window.electronAPI.generateInventoryReport === 'function') {
            return await window.electronAPI.generateInventoryReport();
          } else if (type === 'sales' && typeof window.electronAPI.getSalesReport === 'function') {
            return await window.electronAPI.getSalesReport(params.period);
          } else if (type === 'profit' && typeof window.electronAPI.generateProfitReport === 'function') {
            return await window.electronAPI.generateProfitReport(params.startDate, params.endDate);
          }
        }
        
        // Create a simple report if API methods not available
        const reportData = {
          id: Date.now().toString(),
          title: `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
          type: type,
          period: params.period || 'all',
          createdAt: new Date().toISOString(),
          data: createMockReportData(type)
        };
        
        // Save the report
        if (window.electronAPI && typeof window.electronAPI.createReport === 'function') {
          await window.electronAPI.createReport(reportData);
        } else {
          // Save to localStorage
          const reports = await this.loadReportsData();
          reports.push(reportData);
          localStorage.setItem('reports', JSON.stringify(reports));
        }
        
        return reportData;
      };
    }
    
    // Create getReportById if it doesn't exist
    if (!window.ReportsHandlers.getReportById) {
      console.log('Creating fallback getReportById function');
      window.ReportsHandlers.getReportById = async function(reportId) {
        console.log(`Using fallback getReportById implementation for ID: ${reportId}`);
        
        // Try electronAPI first
        if (window.electronAPI) {
          if (typeof window.electronAPI.getReportById === 'function') {
            try {
              const report = await window.electronAPI.getReportById(reportId);
              if (report) return report;
            } catch (error) {
              console.error('Error getting report from electronAPI.getReportById:', error);
            }
          } else if (typeof window.electronAPI.getReport === 'function') {
            try {
              const report = await window.electronAPI.getReport(reportId);
              if (report) return report;
            } catch (error) {
              console.error('Error getting report from electronAPI.getReport:', error);
            }
          }
        }
        
        // Fallback to localStorage
        try {
          const reports = await this.loadReportsData();
          return reports.find(report => report.id === reportId);
        } catch (error) {
          console.error('Error getting report from loadReportsData:', error);
          return null;
        }
      };
    }
    
    // Create deleteReport if it doesn't exist
    if (!window.ReportsHandlers.deleteReport) {
      console.log('Creating fallback deleteReport function');
      window.ReportsHandlers.deleteReport = async function(reportId) {
        console.log(`Using fallback deleteReport implementation for ID: ${reportId}`);
        
        if (window.electronAPI && typeof window.electronAPI.deleteReport === 'function') {
          try {
            const result = await window.electronAPI.deleteReport(reportId);
            return result.success || result === true;
          } catch (error) {
            console.error('Error deleting report with electronAPI:', error);
          }
        }
        
        // Fallback to localStorage
        try {
          const reports = await this.loadReportsData();
          const updatedReports = reports.filter(report => report.id !== reportId);
          
          if (updatedReports.length === reports.length) {
            return false; // No report was removed
          }
          
          localStorage.setItem('reports', JSON.stringify(updatedReports));
          return true;
        } catch (error) {
          console.error('Error deleting report from localStorage:', error);
          return false;
        }
      };
    }
    
    console.log('ReportsHandlers initialized with methods:', Object.keys(window.ReportsHandlers));
    return true;
  } catch (error) {
    console.error('Failed to initialize ReportsHandlers:', error);
    return false;
  }
}

// Create mock report data for testing
function createMockReportData(type) {
  switch (type) {
    case 'inventory':
      return {
        totalItems: 25,
        totalValue: '2500.00',
        lowStockItems: 3,
        categories: [
          { name: 'Pipes', count: 10, value: '1200.00' },
          { name: 'Fittings', count: 8, value: '800.00' },
          { name: 'Tools', count: 7, value: '500.00' }
        ]
      };
    case 'sales':
      return {
        totalRevenue: '1800.00',
        totalTransactions: 12,
        averageTransaction: '150.00',
        topProducts: [
          { name: 'PVC Pipe 1/2"', quantity: 20, revenue: '500.00' },
          { name: 'Copper Pipe 3/4"', quantity: 10, revenue: '400.00' },
          { name: 'Pipe Cutter', quantity: 5, revenue: '300.00' }
        ]
      };
    case 'profit':
      return {
        totalRevenue: '1800.00',
        totalCost: '1200.00',
        grossProfit: '600.00',
        profitMargin: '33.33',
        productProfits: [
          { name: 'PVC Pipe 1/2"', revenue: '500.00', cost: '300.00', profit: '200.00', margin: '40.00' },
          { name: 'Copper Pipe 3/4"', revenue: '400.00', cost: '250.00', profit: '150.00', margin: '37.50' },
          { name: 'Pipe Cutter', revenue: '300.00', cost: '200.00', profit: '100.00', margin: '33.33' }
        ]
      };
    default:
      return {};
  }
}

// Setup debug listeners
function setupDebugListeners() {
  // Diagnostics button
  const diagnosticsBtn = document.getElementById('runDiagnosticsBtn');
  if (diagnosticsBtn) {
    diagnosticsBtn.addEventListener('click', runDiagnostics);
  }
  
  // Repair button
  const repairBtn = document.getElementById('repairReportsBtn');
  if (repairBtn) {
    repairBtn.addEventListener('click', repairReportsData);
  }
}

// Run diagnostics on reports functionality
async function runDiagnostics() {
  console.log('Running reports diagnostics...');
  showInfo('Running reports diagnostics...');
  
  try {
    // Check database connection
    if (window.electronAPI && typeof window.electronAPI.getDatabaseStatus === 'function') {
      const dbStatus = await window.electronAPI.getDatabaseStatus();
      console.log('Database status:', dbStatus);
      
      if (!dbStatus.initialized) {
        console.warn('Database not initialized!');
        showWarning('Database not initialized. Some features may not work properly.');
      }
    } else {
      console.warn('Unable to check database status');
    }
    
    // Test report loading
    const reports = await window.ReportsHandlers.loadReportsData();
    console.log(`Loaded ${reports.length} reports from database`);
    
    // Check if we can create a report
    if (reports.length === 0) {
      console.log('No reports found, attempting to create a test report...');
      try {
        const testReport = await window.ReportsHandlers.generateReport('inventory');
        console.log('Test report created:', testReport);
        showSuccess('Diagnostics completed successfully. Test report generated.');
      } catch (createError) {
        console.error('Failed to create test report:', createError);
        showError('Test report creation failed: ' + createError.message);
      }
    } else {
      showSuccess('Diagnostics completed successfully.');
    }
    
    return true;
  } catch (error) {
    console.error('Diagnostics failed:', error);
    showError('Diagnostics failed: ' + error.message);
    return false;
  }
}

// Repair reports data
async function repairReportsData() {
  showInfo('Repairing reports data...');
  
  try {
    // Get valid reports
    const reports = await window.ReportsHandlers.loadReportsData();
    const validReports = Array.isArray(reports) ? reports.filter(r => r && r.id && r.type) : [];
    
    console.log(`Found ${validReports.length} valid reports out of ${reports.length} total`);
    
    // Call API repair function if available
    if (window.electronAPI && typeof window.electronAPI.repairReportsData === 'function') {
      const result = await window.electronAPI.repairReportsData(validReports);
      console.log('Repair result:', result);
      
      if (result.success) {
        showSuccess(`Reports data repaired successfully. ${result.count} valid reports retained.`);
      } else {
        showWarning(`Partial repair completed: ${result.error}`);
      }
    } else {
      // Fallback to localStorage
      localStorage.setItem('reports', JSON.stringify(validReports));
      showSuccess(`Reports data repaired in localStorage. ${validReports.length} valid reports retained.`);
    }
    
    // Reload reports
    window.Reports.loadReports();
    return true;
  } catch (error) {
    console.error('Error repairing reports data:', error);
    showError('Failed to repair reports data: ' + error.message);
    return false;
  }
}

// Helper functions for notifications (if the notification module isn't loaded)
function showSuccess(message) {
  if (window.showNotification) {
    window.showNotification(message, 'success');
  } else if (window.Reports && window.Reports.showSuccess) {
    window.Reports.showSuccess(message);
  } else {
    alert(message);
  }
}

function showError(message) {
  if (window.showNotification) {
    window.showNotification(message, 'danger');
  } else if (window.Reports && window.Reports.showError) {
    window.Reports.showError(message);
  } else {
    alert('Error: ' + message);
  }
}

function showWarning(message) {
  if (window.showNotification) {
    window.showNotification(message, 'warning');
  } else if (window.Reports && window.Reports.showWarning) {
    window.Reports.showWarning(message);
  } else {
    alert('Warning: ' + message);
  }
}

function showInfo(message) {
  if (window.showNotification) {
    window.showNotification(message, 'info');
  } else if (window.Reports && window.Reports.showInfo) {
    window.Reports.showInfo(message);
  } else {
    alert('Info: ' + message);
  }
}

// Expose the debug module globally
window.ReportsDebug = {
  initializeReportsHandlers,
  runDiagnostics,
  repairReportsData
}; 