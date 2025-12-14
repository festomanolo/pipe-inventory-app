const Store = require('electron-store');
const moment = require('moment');

// Initialize store with schema
const store = new Store({
  schema: {
    inventory: {
      type: 'array',
      default: []
    },
    sales: {
      type: 'array',
      default: []
    },
    reports: {
      type: 'array',
      default: []
    },
    nextInvoiceNumber: {
      type: 'number',
      default: 1000
    },
    settings: {
      type: 'object',
      default: {
        companyName: 'Pipe Inventory Management',
        alertThreshold: 10,
        currency: 'TZS',
        currencySymbol: 'TSh',
        exchangeRates: {
          USD: 2500,  // 1 USD = 2500 TZS (example rate)
          EUR: 2700,  // 1 EUR = 2700 TZS (example rate)
          TZS: 1      // Base currency
        },
        dateFormat: 'DD/MM/YYYY',
        language: 'en'
      }
    }
  }
});

// Helper functions for inventory management
const InventoryManager = {
  /**
   * Get all inventory items
   * @returns {Array} - All inventory items
   */
  getAllItems() {
    try {
      return store.get('inventory') || [];
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      return [];
    }
  },

  /**
   * Get a single inventory item by ID
   * @param {string} itemId - ID of the item to find
   * @returns {Object|null} - The item or null if not found
   */
  getItemById(itemId) {
    try {
      const inventory = store.get('inventory') || [];
      return inventory.find(item => item.id === itemId) || null;
    } catch (error) {
      console.error(`Error fetching item with ID ${itemId}:`, error);
      return null;
    }
  },

  /**
   * Add a new inventory item
   * @param {Object} item - Item data
   * @returns {Object} - The added item with ID
   */
  addItem(item) {
    try {
      const inventory = store.get('inventory') || [];
      
      // Generate a unique ID
      const newItem = {
        id: Date.now().toString(),
        ...item,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        alertThreshold: item.alertThreshold || store.get('settings.alertThreshold')
      };
      
      inventory.push(newItem);
      store.set('inventory', inventory);
      
      return newItem;
    } catch (error) {
      console.error('Error adding inventory item:', error);
      throw new Error('Failed to add inventory item');
    }
  },

  /**
   * Update an existing inventory item
   * @param {string} itemId - ID of the item to update
   * @param {Object} updates - Fields to update
   * @returns {Object|null} - Updated item or null if not found
   */
  updateItem(itemId, updates) {
    try {
      const inventory = store.get('inventory') || [];
      const index = inventory.findIndex(item => item.id === itemId);
      
      if (index === -1) {
        return null;
      }
      
      inventory[index] = {
        ...inventory[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      store.set('inventory', inventory);
      return inventory[index];
    } catch (error) {
      console.error(`Error updating item with ID ${itemId}:`, error);
      throw new Error('Failed to update inventory item');
    }
  },

  /**
   * Delete an inventory item
   * @param {string} itemId - ID of the item to delete
   * @returns {boolean} - Success status
   */
  deleteItem(itemId) {
    try {
      const inventory = store.get('inventory') || [];
      const newInventory = inventory.filter(item => item.id !== itemId);
      
      if (newInventory.length === inventory.length) {
        return false;
      }
      
      store.set('inventory', newInventory);
      return true;
    } catch (error) {
      console.error(`Error deleting item with ID ${itemId}:`, error);
      throw new Error('Failed to delete inventory item');
    }
  },

  /**
   * Get items with quantity below their alert threshold
   * @returns {Array} - Array of items below threshold
   */
  getLowStockItems() {
    try {
      const inventory = store.get('inventory') || [];
      return inventory.filter(item => item.quantity <= item.alertThreshold);
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      return [];
    }
  },

  /**
   * Search inventory items by various criteria
   * @param {Object} criteria - Search criteria
   * @returns {Array} - Matching items
   */
  searchItems(criteria) {
    try {
      const inventory = store.get('inventory') || [];
      
      return inventory.filter(item => {
        // Match all provided criteria
        for (const [key, value] of Object.entries(criteria)) {
          if (!value) continue; // Skip empty criteria
          
          if (key === 'type' && item.type && item.type.toLowerCase() !== value.toLowerCase()) {
            return false;
          }
          if (key === 'color' && item.color && item.color.toLowerCase() !== value.toLowerCase()) {
            return false;
          }
          if (key === 'diameter' && item.diameter !== value) {
            return false;
          }
          if (key === 'query') {
            const query = value.toLowerCase();
            const matchesDescription = item.description && item.description.toLowerCase().includes(query);
            const matchesType = item.type && item.type.toLowerCase().includes(query);
            const matchesId = item.id && item.id.toLowerCase().includes(query);
            
            if (!matchesDescription && !matchesType && !matchesId) {
              return false;
            }
          }
        }
        
        return true;
      });
    } catch (error) {
      console.error('Error searching inventory items:', error);
      return [];
    }
  }
};

// Helper functions for sales management
const SalesManager = {
  /**
   * Get all sales records
   * @returns {Array} - All sales
   */
  getAllSales() {
    try {
      return store.get('sales') || [];
    } catch (error) {
      console.error('Error fetching sales records:', error);
      return [];
    }
  },

  /**
   * Get a single sale by ID
   * @param {string} saleId - ID of the sale to find
   * @returns {Object|null} - The sale or null if not found
   */
  getSaleById(saleId) {
    try {
      const sales = store.get('sales') || [];
      return sales.find(sale => sale.id === saleId) || null;
    } catch (error) {
      console.error(`Error fetching sale with ID ${saleId}:`, error);
      return null;
    }
  },

  /**
   * Create a new sale
   * @param {Object} saleData - Sale data including buyer and items
   * @returns {Object} - The created sale
   */
  createSale(saleData) {
    try {
      const sales = store.get('sales') || [];
      
      // Get next invoice number
      const nextInvoiceNumber = store.get('nextInvoiceNumber');
      
      // Create sale object
      const newSale = {
        id: Date.now().toString(),
        invoiceNumber: `INV-${nextInvoiceNumber}`,
        ...saleData,
        createdAt: new Date().toISOString(),
        status: saleData.status || 'completed'
      };
      
      // Update inventory quantities
      const inventory = store.get('inventory') || [];
      let inventoryUpdated = false;
      
      saleData.items.forEach(saleItem => {
        const index = inventory.findIndex(item => item.id === saleItem.itemId);
        if (index !== -1) {
          // Ensure we don't go below 0
          const newQuantity = Math.max(0, inventory[index].quantity - saleItem.quantity);
          inventory[index].quantity = newQuantity;
          inventoryUpdated = true;
        }
      });
      
      // Save updated inventory, sales, and increment invoice number
      if (inventoryUpdated) {
        store.set('inventory', inventory);
      }
      
      sales.push(newSale);
      store.set('sales', sales);
      store.set('nextInvoiceNumber', nextInvoiceNumber + 1);
      
      return newSale;
    } catch (error) {
      console.error('Error creating sale:', error);
      throw new Error('Failed to create sale');
    }
  },

  /**
   * Delete a sale record and restore inventory
   * @param {string} saleId - ID of the sale to delete
   * @returns {boolean} - Success status
   */
  deleteSale(saleId) {
    try {
      const sales = store.get('sales') || [];
      const saleIndex = sales.findIndex(sale => sale.id === saleId);
      
      if (saleIndex === -1) {
        return false;
      }
      
      const sale = sales[saleIndex];
      const inventory = store.get('inventory') || [];
      
      // Restore inventory quantities
      sale.items.forEach(saleItem => {
        const itemIndex = inventory.findIndex(item => item.id === saleItem.itemId);
        if (itemIndex !== -1) {
          inventory[itemIndex].quantity += saleItem.quantity;
        }
      });
      
      // Remove the sale
      sales.splice(saleIndex, 1);
      
      // Save updated data
      store.set('inventory', inventory);
      store.set('sales', sales);
      
      return true;
    } catch (error) {
      console.error(`Error deleting sale with ID ${saleId}:`, error);
      throw new Error('Failed to delete sale');
    }
  },

  /**
   * Get sales for a specific time period
   * @param {string} period - 'day', 'week', 'month', 'year', or 'custom'
   * @param {Object} customRange - For custom periods, provide startDate and endDate
   * @returns {Array} - Sales within the specified period
   */
  getSalesByPeriod(period, customRange = {}) {
    try {
      const sales = store.get('sales') || [];
      const now = new Date();
      let startDate;
      let endDate = now;
      
      switch(period) {
        case 'day':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
          
        case 'week':
          const day = now.getDay();
          startDate = new Date(now.setDate(now.getDate() - day));
          startDate.setHours(0, 0, 0, 0);
          break;
          
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
          
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
          
        case 'custom':
          startDate = new Date(customRange.startDate);
          endDate = new Date(customRange.endDate);
          break;
          
        default:
          startDate = new Date(0); // Beginning of time
      }
      
      return sales.filter(sale => {
        const saleDate = new Date(sale.createdAt);
        return saleDate >= startDate && saleDate <= endDate;
      });
    } catch (error) {
      console.error(`Error fetching sales for period ${period}:`, error);
      return [];
    }
  },

  /**
   * Get a summary of sales data
   * @param {Array} sales - Array of sales to summarize (or all sales if not provided)
   * @returns {Object} - Sales summary data
   */
  getSalesSummary(sales) {
    try {
      const salesToSummarize = sales || this.getAllSales();
      const settings = SettingsManager.getSettings();
      const currencySymbol = settings.currencySymbol || 'TSh';
      
      let totalRevenue = 0;
      let totalItems = 0;
      const itemTypes = {};
      const dailyRevenue = {};
      
      salesToSummarize.forEach(sale => {
        // Calculate total revenue
        totalRevenue += parseFloat(sale.totalAmount || 0);
        
        // Calculate total items sold
        sale.items.forEach(item => {
          totalItems += parseInt(item.quantity);
          
          // Track item types
          const itemType = item.type || 'Unknown';
          itemTypes[itemType] = (itemTypes[itemType] || 0) + parseInt(item.quantity);
        });
        
        // Track daily revenue
        const saleDate = moment(sale.createdAt).format('YYYY-MM-DD');
        dailyRevenue[saleDate] = (dailyRevenue[saleDate] || 0) + parseFloat(sale.totalAmount || 0);
      });
      
      // Format daily revenue for charts
      const formattedDailyRevenue = Object.keys(dailyRevenue).map(date => ({
        date,
        amount: dailyRevenue[date],
        formatted: `${currencySymbol} ${dailyRevenue[date].toLocaleString()}`
      })).sort((a, b) => moment(a.date).diff(moment(b.date)));
      
      return {
        totalSales: salesToSummarize.length,
        totalRevenue,
        formattedTotalRevenue: `${currencySymbol} ${totalRevenue.toLocaleString()}`,
        totalItems,
        itemTypes,
        dailyRevenue: formattedDailyRevenue
      };
    } catch (error) {
      console.error('Error generating sales summary:', error);
      return {
        totalSales: 0,
        totalRevenue: 0,
        formattedTotalRevenue: `${currencySymbol} 0`,
        totalItems: 0,
        itemTypes: {},
        dailyRevenue: []
      };
    }
  }
};

// Helper functions for settings management
const SettingsManager = {
  /**
   * Get all settings
   * @returns {Object} - Application settings
   */
  getSettings() {
    try {
      return store.get('settings');
    } catch (error) {
      console.error('Error fetching settings:', error);
      return {
        companyName: 'Pipe Inventory Management',
        alertThreshold: 10,
        currency: 'TZS',
        currencySymbol: 'TSh'
      };
    }
  },

  /**
   * Update application settings
   * @param {Object} updates - Settings to update
   * @returns {Object} - Updated settings
   */
  updateSettings(updates) {
    try {
      const currentSettings = store.get('settings');
      const newSettings = { ...currentSettings, ...updates };
      store.set('settings', newSettings);
      return newSettings;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw new Error('Failed to update settings');
    }
  },
  
  /**
   * Format currency based on current settings
   * @param {number} amount - Amount to format
   * @returns {string} - Formatted currency string
   */
  formatCurrency(amount) {
    try {
      const settings = this.getSettings();
      const symbol = settings.currencySymbol || 'TSh';
      return `${symbol} ${parseFloat(amount).toLocaleString()}`;
    } catch (error) {
      console.error('Error formatting currency:', error);
      return `TSh ${parseFloat(amount).toLocaleString()}`;
    }
  },
  
  /**
   * Convert currency to TZS or from TZS to another currency
   * @param {number} amount - Amount to convert
   * @param {string} fromCurrency - Source currency code
   * @param {string} toCurrency - Target currency code
   * @returns {number} - Converted amount
   */
  convertCurrency(amount, fromCurrency, toCurrency) {
    try {
      const settings = this.getSettings();
      const rates = settings.exchangeRates || { TZS: 1, USD: 2500, EUR: 2700 };
      
      if (fromCurrency === toCurrency) {
        return amount;
      }
      
      // Convert to TZS first (base currency)
      const amountInTZS = fromCurrency === 'TZS' 
        ? amount 
        : amount * rates[fromCurrency];
      
      // Convert from TZS to target currency
      return toCurrency === 'TZS' 
        ? amountInTZS 
        : amountInTZS / rates[toCurrency];
    } catch (error) {
      console.error('Error converting currency:', error);
      return amount; // Return original amount on error
    }
  }
};

// Helper functions for reports management
const ReportsManager = {
  /**
   * Get all saved reports
   * @returns {Array} - All reports
   */
  getAllReports() {
    try {
      return store.get('reports') || [];
    } catch (error) {
      console.error('Error fetching reports:', error);
      return [];
    }
  },
  
  /**
   * Get a single report by ID
   * @param {string} reportId - ID of the report to find
   * @returns {Object|null} - The report or null if not found
   */
  getReportById(reportId) {
    try {
      const reports = store.get('reports') || [];
      return reports.find(report => report.id === reportId) || null;
    } catch (error) {
      console.error(`Error fetching report with ID ${reportId}:`, error);
      return null;
    }
  },
  
  /**
   * Create a new report
   * @param {Object} reportData - Report data
   * @returns {Object} - The created report
   */
  createReport(reportData) {
    try {
      const reports = store.get('reports') || [];
      
      // Create report object
      const newReport = {
        id: Date.now().toString(),
        ...reportData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      reports.push(newReport);
      store.set('reports', reports);
      
      return newReport;
    } catch (error) {
      console.error('Error creating report:', error);
      throw new Error('Failed to create report');
    }
  },
  
  /**
   * Update an existing report
   * @param {string} reportId - ID of the report to update
   * @param {Object} updates - Fields to update
   * @returns {Object|null} - Updated report or null if not found
   */
  updateReport(reportId, updates) {
    try {
      const reports = store.get('reports') || [];
      const index = reports.findIndex(report => report.id === reportId);
      
      if (index === -1) {
        return null;
      }
      
      reports[index] = {
        ...reports[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      store.set('reports', reports);
      return reports[index];
    } catch (error) {
      console.error(`Error updating report with ID ${reportId}:`, error);
      throw new Error('Failed to update report');
    }
  },
  
  /**
   * Delete a report
   * @param {string} reportId - ID of the report to delete
   * @returns {boolean} - Success status
   */
  deleteReport(reportId) {
    try {
      const reports = store.get('reports') || [];
      const newReports = reports.filter(report => report.id !== reportId);
      
      if (newReports.length === reports.length) {
        return false;
      }
      
      store.set('reports', newReports);
      return true;
    } catch (error) {
      console.error(`Error deleting report with ID ${reportId}:`, error);
      throw new Error('Failed to delete report');
    }
  }
};

// Export the managers for use in the renderer process
module.exports = {
  InventoryManager,
  SalesManager,
  SettingsManager,
  ReportsManager
};
