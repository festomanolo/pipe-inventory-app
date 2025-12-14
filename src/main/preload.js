console.log('Preload script loaded');
const { contextBridge, ipcRenderer } = require('electron');

/**
 * Expose protected methods that allow the renderer process to use
 * the ipcRenderer without exposing the entire object
 * 
 * This preload script provides secure access to:
 * 1. SQLite database operations (inventory, sales, reports, settings)
 * 2. Window/app management
 * 3. Real-time data update events
 * 4. File system operations
 */

// Error handling wrapper for IPC calls
const safeIpc = (channel, ...args) => {
  console.log(`Making IPC call to '${channel}' with args:`, args);
  return ipcRenderer.invoke(channel, ...args)
    .catch(error => {
      console.error(`Error in IPC call to '${channel}':`, error);
      throw new Error(`Failed to execute '${channel}': ${error.message}`);
    });
};

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electronAPI', 
  {
    // Database initialization and status
    initializeDatabase: () => safeIpc('initialize-database'),
    getDatabaseStatus: () => safeIpc('get-database-status'),
    backupDatabase: (backupPath) => safeIpc('backup-database', backupPath),
    restoreDatabase: (restorePath) => safeIpc('restore-database', restorePath),
    
    // SQLite specific functions
    optimizeDatabase: () => safeIpc('optimize-database'),
    repairDatabase: () => safeIpc('repair-database'),
    getDatabaseMetrics: () => safeIpc('get-database-metrics'),
    
    // Transaction handling
    beginTransaction: () => safeIpc('begin-transaction'),
    commitTransaction: () => safeIpc('commit-transaction'),
    rollbackTransaction: () => safeIpc('rollback-transaction'),
    
    // General app functions
    getAppVersion: () => safeIpc('get-app-version'),
    getAppPath: () => safeIpc('get-app-path'),
    getPlatform: () => process.platform,
    getOsInfo: () => ({
      platform: process.platform,
      arch: process.arch,
      version: os.release(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem()
    }),
    
    // Window management
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    maximizeWindow: () => ipcRenderer.send('maximize-window'),
    closeWindow: () => ipcRenderer.send('close-window'),
    
    // Inventory operations
    getInventory: () => {
      console.log('Calling getInventory from preload');
      return safeIpc('get-inventory');
    },
    addInventoryItem: (item) => {
      console.log('Calling addInventoryItem from preload with item:', item);
      return safeIpc('add-inventory-item', item);
    },
    getInventoryItem: (itemId) => safeIpc('get-inventory-item', itemId),
    updateInventoryItem: (item) => safeIpc('update-inventory-item', item),
    deleteInventoryItem: (itemId) => {
      console.log('Calling deleteInventoryItem from preload with itemId:', itemId);
      return safeIpc('delete-inventory-item', itemId);
    },
    searchInventory: (criteria) => safeIpc('search-inventory', criteria),
    getLowStockItems: () => safeIpc('get-low-stock-items'),
    bulkUpdateInventory: (items) => safeIpc('bulk-update-inventory', items),
    
    // Sales operations
    getSales: () => ipcRenderer.invoke('get-sales'),
    addSale: (sale) => ipcRenderer.invoke('add-sale', sale),
    getSaleById: (saleId) => safeIpc('get-sale-by-id', saleId),
    searchSales: (criteria) => safeIpc('search-sales', criteria),
    getSalesByPeriod: (period, customRange) => safeIpc('get-sales-by-period', period, customRange),
    getSaleItems: (saleId) => safeIpc('get-sale-items', saleId),
    
    // Customer operations
    getCustomers: () => {
      console.log('Calling getCustomers from preload');
      return safeIpc('get-customers');
    },
    getCustomerById: (customerId) => {
      console.log('Calling getCustomerById from preload with customerId:', customerId);
      return safeIpc('get-customer-by-id', customerId);
    },
    addCustomer: (customer) => {
      console.log('Calling addCustomer from preload with customer:', customer);
      return safeIpc('add-customer', customer);
    },
    updateCustomer: (customer) => {
      console.log('Calling updateCustomer from preload with customer:', customer);
      return safeIpc('update-customer', customer);
    },
    deleteCustomer: (customerId) => {
      console.log('Calling deleteCustomer from preload with customerId:', customerId);
      return safeIpc('delete-customer', customerId);
    },
    updateCustomerPurchaseStats: (customerId, purchaseAmount) => {
      console.log('Calling updateCustomerPurchaseStats from preload');
      return safeIpc('update-customer-purchase-stats', { customerId, purchaseAmount });
    },
    searchCustomers: (criteria) => safeIpc('search-customers', criteria),
    
  // Reports operations
    getReports: () => ipcRenderer.invoke('get-reports'),
    addReport: (report) => ipcRenderer.invoke('add-report', report),
  getAllReports: () => safeIpc('get-reports'),
  getReport: (reportId) => safeIpc('get-report-by-id', reportId),
  getReportById: (reportId) => safeIpc('get-report-by-id', reportId),
  updateReport: (report) => safeIpc('update-report', report),
  deleteReport: (reportId) => safeIpc('delete-report', reportId),
  repairReportsData: (validReports) => safeIpc('repair-reports-data', validReports),
  getSalesReport: (period) => ipcRenderer.invoke('get-sales-report', period),
  generateInventoryReport: () => safeIpc('generate-inventory-report'),
  generateProfitReport: (startDate, endDate) => safeIpc('generate-profit-report', startDate, endDate),
    
    // Settings operations
    getSettings: () => safeIpc('get-settings'),
    updateSettings: (settings) => safeIpc('update-settings', settings),
    getSettingByKey: (key) => safeIpc('get-setting-by-key', key),
    setSettingValue: (key, value) => safeIpc('set-setting-value', key, value),
  
  // Daily report operations
  getDailyReportSettings: () => ipcRenderer.invoke('get-daily-report-settings'),
  updateDailyReportSettings: (settings) => ipcRenderer.invoke('update-daily-report-settings', settings),
  generateDailyReportNow: () => ipcRenderer.invoke('generate-daily-report-now'),
  
  // Export/Import operations
  importData: (filePath) => safeIpc('import-data', filePath),
  generateReceipt: (saleId) => safeIpc('generate-receipt', saleId),
  generateInvoice: (filePath, sale) => safeIpc('generate-invoice', filePath, sale),
  openFile: (filePath) => safeIpc('open-file', filePath),
  exportDatabaseToJson: () => safeIpc('export-database-to-json'),
  importDatabaseFromJson: (filePath) => safeIpc('import-database-from-json', filePath),
  showSaveDialog: (options) => safeIpc('show-save-dialog', options),
  showOpenDialog: (options) => safeIpc('show-open-dialog', options),
    printToPdf: (options) => ipcRenderer.invoke('print-to-pdf', options),
    exportData: (options) => ipcRenderer.invoke('export-data', options),
  
  // Event listeners for real-time database updates
  onInventoryUpdate: (callback) => {
    ipcRenderer.on('inventory-updated', (_, item) => callback(item));
    return () => ipcRenderer.removeListener('inventory-updated', callback);
  },
  
  onSaleCreated: (callback) => {
    ipcRenderer.on('sale-created', (_, sale) => callback(sale));
    return () => ipcRenderer.removeListener('sale-created', callback);
  },
  
  onDatabaseError: (callback) => {
    ipcRenderer.on('database-error', (_, error) => callback(error));
    return () => ipcRenderer.removeListener('database-error', callback);
  },
  
  // Customer event listeners
  onCustomerCreated: (callback) => {
    ipcRenderer.on('customer-created', (_, customer) => callback(customer));
    return () => ipcRenderer.removeListener('customer-created', callback);
  },
  
  onCustomerUpdated: (callback) => {
    ipcRenderer.on('customer-updated', (_, customer) => callback(customer));
    return () => ipcRenderer.removeListener('customer-updated', callback);
  },
  
  onCustomerDeleted: (callback) => {
    ipcRenderer.on('customer-deleted', (_, customerId) => callback(customerId));
    return () => ipcRenderer.removeListener('customer-deleted', callback);
  },
  
  onCustomerStatsUpdated: (callback) => {
    ipcRenderer.on('customer-stats-updated', (_, stats) => callback(stats));
    return () => ipcRenderer.removeListener('customer-stats-updated', callback);
  },

  // App information
  isPackaged: process.env.NODE_ENV === 'production',
  
    // Analytics
    invoke: (channel, data) => {
      const validChannels = [
        'get-sales-data',
        'get-inventory-data',
        'get-report-data',
        'export-report'
      ];
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, data);
      }
    },

  // Report event listeners
  onReportCreated: (callback) => {
    ipcRenderer.on('report-created', (_, report) => callback(report));
    return () => ipcRenderer.removeListener('report-created', callback);
  },
  
  onReportUpdated: (callback) => {
    ipcRenderer.on('report-updated', (_, report) => callback(report));
    return () => ipcRenderer.removeListener('report-updated', callback);
  },
  
  onReportDeleted: (callback) => {
    ipcRenderer.on('report-deleted', (_, reportId) => callback(reportId));
    return () => ipcRenderer.removeListener('report-deleted', callback);
  },

  // Add cloud sync-related functions
  configureSupabase: (config) => safeIpc('configure-supabase', config),
  getSyncStatus: () => safeIpc('get-sync-status'),
  syncInventory: () => safeIpc('sync-inventory'),
  syncSales: () => safeIpc('sync-sales'),
  syncAll: () => safeIpc('sync-all'),
  processOfflineChanges: () => safeIpc('process-offline-changes'),
  
  // Sync event listeners
  onSyncStatusChanged: (callback) => {
    ipcRenderer.on('sync-status-changed', (_, status) => callback(status));
    return () => ipcRenderer.removeListener('sync-status-changed', callback);
  },
  
  onSyncCompleted: (callback) => {
    ipcRenderer.on('sync-completed', (_, result) => callback(result));
    return () => ipcRenderer.removeListener('sync-completed', callback);
  },
  
  onSyncError: (callback) => {
    ipcRenderer.on('sync-error', (_, error) => callback(error));
    return () => ipcRenderer.removeListener('sync-error', callback);
  },

  // Logs operations
  getLogs: (filters) => safeIpc('get-logs', filters),
  clearLogs: () => safeIpc('clear-logs'),
  getLoggerSettings: () => safeIpc('get-logger-settings'),
  updateLoggerSettings: (settings) => safeIpc('update-logger-settings', settings),
  exportLogs: (options) => safeIpc('export-logs', options),
  saveFile: (options) => safeIpc('save-file', options),
  
  // Log event listeners
  onNewLog: (callback) => {
    ipcRenderer.on('new-log', (_, log) => callback(_, log));
    return () => ipcRenderer.removeListener('new-log', callback);
  },

  // Session management functions
  getUserSession: () => safeIpc('get-user-session'),
  setUserSession: (session) => safeIpc('set-user-session', session),
  clearUserSession: () => safeIpc('clear-user-session'),
  }
);

// Expose sales handlers
contextBridge.exposeInMainWorld('SalesHandlers', {
    getAllSales: async () => {
        return await ipcRenderer.invoke('get-all-sales');
    },
    getInventoryItems: async () => {
        return await ipcRenderer.invoke('get-inventory-items');
    },
    createSale: async (saleData) => {
        return await ipcRenderer.invoke('create-sale', saleData);
    },
    getSaleById: async (saleId) => {
        return await ipcRenderer.invoke('get-sale-by-id', saleId);
    },
    getSalesByPeriod: async (period, customRange) => {
        return await ipcRenderer.invoke('get-sales-by-period', { period, customRange });
    },
    getSalesSummary: async (sales) => {
        return await ipcRenderer.invoke('get-sales-summary', sales);
    },
    deleteSale: async (saleId) => {
        return await ipcRenderer.invoke('delete-sale', saleId);
    }
});

// Note: electronAPI is not accessible here since it's exposed to the main world
// These methods are already defined in the main electronAPI object above

// Add direct electron.ipcRenderer exposure for reports
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel, ...args) => {
      // Whitelist channels that can be invoked from renderer
      const validChannels = [
        'get-store-value',
        'get-all-sales',
        'get-sales',
        'get-inventory',
        'get-inventory-items',
        'get-reports',
        'debug-store-keys'
      ];
      
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args);
      }
      
      console.error(`Invalid channel: ${channel}`);
      return Promise.reject(new Error(`Invalid channel: ${channel}`));
    }
  }
});

console.log('Preload script completed');
