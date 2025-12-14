/**
 * localDatabase.js
 * Provides a robust local database implementation using localStorage
 * with fallback mechanisms and data synchronization
 */

// Storage keys
const STORAGE_KEYS = {
  INVENTORY: 'pipe_inventory_items',
  SALES: 'pipe_inventory_sales',
  REPORTS: 'pipe_inventory_reports',
  SETTINGS: 'pipe_inventory_settings',
  DAILY_REPORT_SETTINGS: 'pipe_inventory_daily_report_settings',
  LAST_SYNC: 'pipe_inventory_last_sync',
  SESSION: 'eliva_session'
};

// Default data
const DEFAULT_DATA = {
  inventory: [
    {
      id: '1',
      description: 'PVC Pipe 1/2"',
      category: 'Pipes',
      type: 'PVC Pipe',
      size: '1/2 inch',
      brand: 'SuperPipe',
      dimension: '1/2 inch',
      color: 'White',
      unit: 'Piece',
      quantity: 25,
      price: 5.99,
      alertThreshold: 10,
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      description: 'Copper Pipe 3/4"',
      category: 'Pipes',
      type: 'Copper Pipe',
      size: '3/4 inch',
      brand: 'CopperKing',
      dimension: '3/4 inch',
      color: 'Copper',
      unit: 'Piece',
      quantity: 10,
      price: 12.99,
      alertThreshold: 5,
      createdAt: new Date().toISOString()
    },
    {
      id: '3',
      description: 'PVC Pipe 3/4"',
      category: 'Pipes',
      type: 'PVC Pipe',
      size: '3/4 inch',
      brand: 'SuperPipe',
      dimension: '3/4 inch',
      color: 'White',
      unit: 'Piece',
      quantity: 30,
      price: 7.99,
      alertThreshold: 10,
      createdAt: new Date().toISOString()
    },
    {
      id: '4',
      description: 'Steel Pipe 1"',
      category: 'Pipes',
      type: 'Steel Pipe',
      size: '1 inch',
      brand: 'SteelMax',
      dimension: '1 inch',
      color: 'Silver',
      unit: 'Piece',
      quantity: 15,
      price: 15.99,
      alertThreshold: 5,
      createdAt: new Date().toISOString()
    },
    {
      id: '5',
      description: 'PEX Pipe 3/4"',
      category: 'Pipes',
      type: 'PEX Pipe',
      size: '3/4 inch',
      brand: 'FlexiPipe',
      dimension: '3/4 inch',
      color: 'Red',
      unit: 'Meter',
      quantity: 40,
      price: 9.99,
      alertThreshold: 8,
      createdAt: new Date().toISOString()
    }
  ],
  sales: [
    {
      id: '1',
      invoiceNumber: 'INV-001',
      buyer: { name: 'John Construction Co.' },
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      items: [
        { id: '1', description: 'PVC Pipe 1/2"', quantity: 10, price: 5.99 },
        { id: '3', description: 'PVC Pipe 3/4"', quantity: 5, price: 7.99 }
      ],
      total: 99.85,
      paymentMethod: 'Cash',
      status: 'Completed',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: '2',
      invoiceNumber: 'INV-002',
      buyer: { name: 'Smith Plumbing' },
      date: new Date(Date.now() - 86400000).toISOString(),
      items: [
        { id: '2', description: 'Copper Pipe 3/4"', quantity: 3, price: 12.99 },
        { id: '5', description: 'PEX Pipe 3/4"', quantity: 2, price: 9.99 }
      ],
      total: 58.95,
      paymentMethod: 'Credit Card',
      status: 'Completed',
      createdAt: new Date(Date.now() - 86400000).toISOString()
    }
  ],
  reports: [
    {
      id: '1',
      title: 'Monthly Sales Report',
      type: 'sales',
      period: 'monthly',
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      data: {
        totalSales: 15,
        totalRevenue: 2500.75,
        topSellingItems: [
          { name: 'PVC Pipe 1/2"', quantity: 45, revenue: 269.55 },
          { name: 'Copper Pipe 1/2"', quantity: 20, revenue: 259.80 },
          { name: 'PVC Pipe 3/4"', quantity: 18, revenue: 143.82 }
        ]
      }
    },
    {
      id: '2',
      title: 'Inventory Status Report',
      type: 'inventory',
      date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      data: {
        totalItems: 5,
        totalValue: 1250.45,
        lowStockItems: 2,
        categories: [
          { name: 'PVC', count: 2, value: 450.25 },
          { name: 'Copper', count: 1, value: 350.75 },
          { name: 'Steel', count: 1, value: 275.50 },
          { name: 'PEX', count: 1, value: 174.95 }
        ]
      }
    }
  ],
  settings: {
    companyName: 'Pipe Inventory Management',
    alertThreshold: 10,
    currency: 'TZS',
    currencySymbol: 'TZsh',
    dateFormat: 'DD/MM/YYYY',
    language: 'en'
  },
  dailyReportSettings: {
    enabled: true,
    hour: 0,
    minute: 0,
    directory: 'Reports',
    showNotification: true
  }
};

/**
 * Local Database class to handle localStorage operations
 */
class LocalDatabase {
  /**
   * Initialize the local database
   */
  static init() {
    console.log('Initializing local database');
    
    // Check if localStorage is available
    if (!this.isLocalStorageAvailable()) {
      console.error('localStorage is not available');
      return false;
    }
    
    // Initialize default data if not already present
    this.initializeDefaultData();
    
    return true;
  }
  
  /**
   * Check if localStorage is available
   * @returns {boolean} True if localStorage is available
   */
  static isLocalStorageAvailable() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Initialize default data if not already present
   */
  static initializeDefaultData() {
    // Initialize inventory
    if (!localStorage.getItem(STORAGE_KEYS.INVENTORY)) {
      this.setInventory(DEFAULT_DATA.inventory);
    }
    
    // Initialize sales
    if (!localStorage.getItem(STORAGE_KEYS.SALES)) {
      this.setSales(DEFAULT_DATA.sales);
    }
    
    // Initialize reports
    if (!localStorage.getItem(STORAGE_KEYS.REPORTS)) {
      this.setReports(DEFAULT_DATA.reports);
    }
    
    // Initialize settings
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      this.setSettings(DEFAULT_DATA.settings);
    }
    
    // Initialize daily report settings
    if (!localStorage.getItem(STORAGE_KEYS.DAILY_REPORT_SETTINGS)) {
      this.setDailyReportSettings(DEFAULT_DATA.dailyReportSettings);
    }
  }
  
  /**
   * Get inventory data
   * @returns {Array} Inventory data
   */
  static getInventory() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INVENTORY);
      return data ? JSON.parse(data) : DEFAULT_DATA.inventory;
    } catch (error) {
      console.error('Error getting inventory from localStorage:', error);
      return DEFAULT_DATA.inventory;
    }
  }
  
  /**
   * Set inventory data
   * @param {Array} inventory - Inventory data
   */
  static setInventory(inventory) {
    try {
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
      return true;
    } catch (error) {
      console.error('Error setting inventory in localStorage:', error);
      return false;
    }
  }
  
  /**
   * Add inventory item
   * @param {Object} item - Inventory item
   * @returns {Object} Added item
   */
  static addInventoryItem(item) {
    try {
      const inventory = this.getInventory();
      
      // Create a new item with ID if not provided
      const newItem = {
        id: item.id || Date.now().toString(),
        ...item,
        createdAt: item.createdAt || new Date().toISOString()
      };
      
      // Add to inventory
      inventory.push(newItem);
      
      // Save inventory
      this.setInventory(inventory);
      
      return newItem;
    } catch (error) {
      console.error('Error adding inventory item:', error);
      return null;
    }
  }
  
  /**
   * Update inventory item
   * @param {Object} item - Inventory item
   * @returns {Object} Updated item
   */
  static updateInventoryItem(item) {
    try {
      const inventory = this.getInventory();
      
      // Find item index
      const index = inventory.findIndex(i => i.id === item.id);
      
      // If item not found, return null
      if (index === -1) {
        return null;
      }
      
      // Update item
      inventory[index] = {
        ...inventory[index],
        ...item,
        updatedAt: new Date().toISOString()
      };
      
      // Save inventory
      this.setInventory(inventory);
      
      return inventory[index];
    } catch (error) {
      console.error('Error updating inventory item:', error);
      return null;
    }
  }
  
  /**
   * Delete inventory item
   * @param {string} itemId - Inventory item ID
   * @returns {boolean} True if item was deleted
   */
  static deleteInventoryItem(itemId) {
    try {
      const inventory = this.getInventory();
      
      // Filter out item
      const newInventory = inventory.filter(item => item.id !== itemId);
      
      // If no items were removed, return false
      if (newInventory.length === inventory.length) {
        return false;
      }
      
      // Save inventory
      this.setInventory(newInventory);
      
      return true;
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      return false;
    }
  }
  
  /**
   * Get sales data
   * @returns {Array} Sales data
   */
  static getSales() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SALES);
      return data ? JSON.parse(data) : DEFAULT_DATA.sales;
    } catch (error) {
      console.error('Error getting sales from localStorage:', error);
      return DEFAULT_DATA.sales;
    }
  }
  
  /**
   * Set sales data
   * @param {Array} sales - Sales data
   */
  static setSales(sales) {
    try {
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
      return true;
    } catch (error) {
      console.error('Error setting sales in localStorage:', error);
      return false;
    }
  }
  
  /**
   * Add sale
   * @param {Object} sale - Sale object
   * @returns {Object} Added sale
   */
  static addSale(sale) {
    try {
      const sales = this.getSales();
      
      // Create a new sale with ID if not provided
      const newSale = {
        id: sale.id || Date.now().toString(),
        ...sale,
        createdAt: sale.createdAt || new Date().toISOString()
      };
      
      // Add to sales
      sales.push(newSale);
      
      // Save sales
      this.setSales(sales);
      
      // Update inventory quantities
      this.updateInventoryAfterSale(newSale.items);
      
      return newSale;
    } catch (error) {
      console.error('Error adding sale:', error);
      return null;
    }
  }
  
  /**
   * Update inventory after a sale
   * @param {Array} items - Sale items
   */
  static updateInventoryAfterSale(items) {
    try {
      const inventory = this.getInventory();
      let updated = false;
      
      // Update inventory quantities
      items.forEach(soldItem => {
        const inventoryItem = inventory.find(item => item.id === soldItem.id || item.id === soldItem.itemId);
        if (inventoryItem) {
          inventoryItem.quantity -= soldItem.quantity;
          updated = true;
        }
      });
      
      // Save inventory if updated
      if (updated) {
        this.setInventory(inventory);
      }
      
      return true;
    } catch (error) {
      console.error('Error updating inventory after sale:', error);
      return false;
    }
  }
  
  /**
   * Delete sale
   * @param {string} saleId - Sale ID
   * @returns {boolean} True if sale was deleted
   */
  static deleteSale(saleId) {
    try {
      const sales = this.getSales();
      
      // Filter out sale
      const newSales = sales.filter(sale => sale.id !== saleId);
      
      // If no sales were removed, return false
      if (newSales.length === sales.length) {
        return false;
      }
      
      // Save sales
      this.setSales(newSales);
      
      return true;
    } catch (error) {
      console.error('Error deleting sale:', error);
      return false;
    }
  }
  
  /**
   * Get reports data
   * @returns {Array} Reports data
   */
  static getReports() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REPORTS);
      return data ? JSON.parse(data) : DEFAULT_DATA.reports;
    } catch (error) {
      console.error('Error getting reports from localStorage:', error);
      return DEFAULT_DATA.reports;
    }
  }
  
  /**
   * Set reports data
   * @param {Array} reports - Reports data
   */
  static setReports(reports) {
    try {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
      return true;
    } catch (error) {
      console.error('Error setting reports in localStorage:', error);
      return false;
    }
  }
  
  /**
   * Add report
   * @param {Object} report - Report object
   * @returns {Object} Added report
   */
  static addReport(report) {
    try {
      const reports = this.getReports();
      
      // Create a new report with ID if not provided
      const newReport = {
        id: report.id || Date.now().toString(),
        ...report,
        createdAt: report.createdAt || new Date().toISOString()
      };
      
      // Add to reports
      reports.push(newReport);
      
      // Save reports
      this.setReports(reports);
      
      return newReport;
    } catch (error) {
      console.error('Error adding report:', error);
      return null;
    }
  }
  
  /**
   * Get report by ID
   * @param {string} reportId - Report ID
   * @returns {Object} Report
   */
  static getReportById(reportId) {
    try {
      const reports = this.getReports();
      return reports.find(report => report.id === reportId) || null;
    } catch (error) {
      console.error('Error getting report by ID:', error);
      return null;
    }
  }
  
  /**
   * Delete report
   * @param {string} reportId - Report ID
   * @returns {boolean} True if report was deleted
   */
  static deleteReport(reportId) {
    try {
      const reports = this.getReports();
      
      // Filter out report
      const newReports = reports.filter(report => report.id !== reportId);
      
      // If no reports were removed, return false
      if (newReports.length === reports.length) {
        return false;
      }
      
      // Save reports
      this.setReports(newReports);
      
      return true;
    } catch (error) {
      console.error('Error deleting report:', error);
      return false;
    }
  }
  
  /**
   * Get settings
   * @returns {Object} Settings
   */
  static getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : DEFAULT_DATA.settings;
    } catch (error) {
      console.error('Error getting settings from localStorage:', error);
      return DEFAULT_DATA.settings;
    }
  }
  
  /**
   * Set settings
   * @param {Object} settings - Settings
   */
  static setSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Error setting settings in localStorage:', error);
      return false;
    }
  }
  
  /**
   * Update settings
   * @param {Object} settings - Settings to update
   * @returns {Object} Updated settings
   */
  static updateSettings(settings) {
    try {
      const currentSettings = this.getSettings();
      
      // Update settings
      const updatedSettings = {
        ...currentSettings,
        ...settings
      };
      
      // Save settings
      this.setSettings(updatedSettings);
      
      return updatedSettings;
    } catch (error) {
      console.error('Error updating settings:', error);
      return null;
    }
  }
  
  /**
   * Get daily report settings
   * @returns {Object} Daily report settings
   */
  static getDailyReportSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DAILY_REPORT_SETTINGS);
      return data ? JSON.parse(data) : DEFAULT_DATA.dailyReportSettings;
    } catch (error) {
      console.error('Error getting daily report settings from localStorage:', error);
      return DEFAULT_DATA.dailyReportSettings;
    }
  }
  
  /**
   * Set daily report settings
   * @param {Object} settings - Daily report settings
   */
  static setDailyReportSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.DAILY_REPORT_SETTINGS, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Error setting daily report settings in localStorage:', error);
      return false;
    }
  }
  
  /**
   * Update daily report settings
   * @param {Object} settings - Settings to update
   * @returns {Object} Updated settings
   */
  static updateDailyReportSettings(settings) {
    try {
      const currentSettings = this.getDailyReportSettings();
      
      // Update settings
      const updatedSettings = {
        ...currentSettings,
        ...settings
      };
      
      // Save settings
      this.setDailyReportSettings(updatedSettings);
      
      return updatedSettings;
    } catch (error) {
      console.error('Error updating daily report settings:', error);
      return null;
    }
  }
  
  /**
   * Get session data
   * @returns {Object} Session data
   */
  static getSession() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSION);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting session from localStorage:', error);
      return null;
    }
  }
  
  /**
   * Set session data
   * @param {Object} session - Session data
   */
  static setSession(session) {
    try {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
      return true;
    } catch (error) {
      console.error('Error setting session in localStorage:', error);
      return false;
    }
  }
  
  /**
   * Clear session data
   */
  static clearSession() {
    try {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
      return true;
    } catch (error) {
      console.error('Error clearing session from localStorage:', error);
      return false;
    }
  }
  
  /**
   * Set last sync time
   * @param {string} timestamp - ISO timestamp
   */
  static setLastSync(timestamp) {
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp || new Date().toISOString());
      return true;
    } catch (error) {
      console.error('Error setting last sync time in localStorage:', error);
      return false;
    }
  }
  
  /**
   * Get last sync time
   * @returns {string} ISO timestamp
   */
  static getLastSync() {
    try {
      return localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    } catch (error) {
      console.error('Error getting last sync time from localStorage:', error);
      return null;
    }
  }
  
  /**
   * Clear all data
   */
  static clearAll() {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Error clearing all data from localStorage:', error);
      return false;
    }
  }
}

// Export the LocalDatabase class
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LocalDatabase, STORAGE_KEYS, DEFAULT_DATA };
} else {
  window.LocalDatabase = LocalDatabase;
}
