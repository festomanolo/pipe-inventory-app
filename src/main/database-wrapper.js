/**
 * Database Wrapper
 * Provides a consistent API for database operations with fallback to electron-store
 */

const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const electron = require('electron');
const Store = require('electron-store');
const log = require('electron-log');

// Initialize persistent storage for fallback
const store = new Store();

// Try to load SQLite module with better compatibility
let sqlite3;
try {
  const { sqlite3: sqliteAdapter } = require('../db/sqlite-adapter');
  sqlite3 = sqliteAdapter;
} catch (e) {
  console.error('Error loading SQLite adapter:', e);
  // Fallback to directly trying to load sqlite3 if adapter fails
  try {
    sqlite3 = require('sqlite3').verbose();
  } catch (sqliteErr) {
    console.error('SQLite module not available:', sqliteErr);
  }
}

class DatabaseWrapper {
  constructor() {
    this.db = null;
    this.usingSqlite = false;
    this.log = log;
    this.log.info('Initializing DatabaseWrapper');
    
    // Try to load the SQLite database
    try {
      // First check if the sqlite3 module is available
      try {
        require('sqlite3').verbose();
        this.log.info('SQLite3 module is available');
      } catch (sqliteModuleError) {
        this.log.warn('SQLite3 module not available:', sqliteModuleError.message);
        throw new Error('SQLite3 module not available');
      }
      
      try {
        // Import the database class directly
      const Database = require('./database');
        
        // Verify it's a class that can be instantiated
        if (typeof Database === 'function') {
      this.db = new Database();
      this.usingSqlite = true;
      this.log.info('Using SQLite database');
        } else {
          throw new Error('Database module does not export a constructor');
        }
      } catch (dbError) {
        this.log.error('Failed to load SQLite database:', dbError.message);
        throw dbError;
      }
    } catch (error) {
      this.log.warn('Failed to load SQLite database:', error.message);
      this.log.info('Falling back to electron-store for data persistence');
      this.usingSqlite = false;
    }
  }
  
  /**
   * Initialize the database
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    try {
      if (this.usingSqlite && this.db) {
        const result = await this.db.initialize();
        
        // Migrate data from electron-store to SQLite if we have SQLite available
        // and the SQLite database was successfully initialized
        if (result) {
          await this.migrateFromElectronStore();
        }
        
        // Ensure product types are available
        await this.ensureProductTypes();
        
        return result;
      } else {
        // Initialize defaults for electron-store
        if (!store.has('inventory')) {
          store.set('inventory', []);
        }
        if (!store.has('sales')) {
          store.set('sales', []);
        }
        if (!store.has('reports')) {
          store.set('reports', []);
        }
        if (!store.has('customers')) {
          store.set('customers', []);
        }
        if (!store.has('product_types')) {
          this.setupDefaultProductTypes();
        }
        if (!store.has('settings')) {
          store.set('settings', {
            companyName: 'Pipe Inventory Management',
            currency: 'TZS',
            taxRate: 0.18
          });
        }
        
        // Ensure product types are available even in electron-store mode
        await this.ensureProductTypes();
        
        return true;
      }
    } catch (error) {
      this.log.error('Database initialization error:', error);
      return false;
    }
  }
  
  /**
   * Set up default product types
   */
  setupDefaultProductTypes() {
    const defaultProductTypes = [
      {
        id: 'pipe',
        name: 'Pipes',
        attributes: ['diameter', 'length', 'material', 'brand'],
        defaultUnit: 'piece'
      },
      {
        id: 'fitting',
        name: 'Fittings',
        attributes: ['type', 'diameter', 'material', 'brand'],
        defaultUnit: 'piece'
      },
      {
        id: 'valve',
        name: 'Valves',
        attributes: ['type', 'diameter', 'material', 'brand'],
        defaultUnit: 'piece'
      },
      {
        id: 'tool',
        name: 'Tools',
        attributes: ['brand', 'model', 'condition'],
        defaultUnit: 'piece'
      },
      {
        id: 'accessory',
        name: 'Accessories',
        attributes: ['type', 'brand', 'material'],
        defaultUnit: 'piece'
      }
    ];
    
    store.set('product_types', defaultProductTypes);
    this.log.info('Default product types set up in electron-store');
    return defaultProductTypes;
  }
  
  /**
   * Ensure product types are available
   * This will check both SQLite and electron-store and make sure product types exist
   */
  async ensureProductTypes() {
    try {
      let productTypes = [];
      
      // Check if product types exist in electron-store
      const storeProductTypes = store.get('product_types') || [];
      
      if (storeProductTypes.length === 0) {
        // If not in store, set up defaults
        productTypes = this.setupDefaultProductTypes();
      } else {
        productTypes = storeProductTypes;
      }
      
      // If using SQLite, make sure product types are in SQLite too
      if (this.usingSqlite && this.db) {
        try {
          // Check if SQLite has product types table, if not, create it
          if (this.db.createProductTypesTable) {
            await this.db.createProductTypesTable();
          }
          
          // Check if there are product types in SQLite
          let sqliteProductTypes = [];
          if (this.db.getProductTypes) {
            sqliteProductTypes = await this.db.getProductTypes();
          }
          
          // If no product types in SQLite, add them from store or defaults
          if (!sqliteProductTypes || sqliteProductTypes.length === 0) {
            if (this.db.addProductTypes) {
              await this.db.addProductTypes(productTypes);
              this.log.info(`Added ${productTypes.length} product types to SQLite`);
            }
          }
        } catch (error) {
          this.log.error('Error ensuring product types in SQLite:', error);
        }
      }
      
      return productTypes;
    } catch (error) {
      this.log.error('Error ensuring product types:', error);
      return [];
    }
  }
  
  /**
   * Get all product types
   * @returns {Promise<Array>} Product types
   */
  async getProductTypes() {
    try {
      // If using SQLite and it has the method, get from SQLite
      if (this.usingSqlite && this.db && this.db.getProductTypes) {
        try {
          const sqliteProductTypes = await this.db.getProductTypes();
          if (sqliteProductTypes && sqliteProductTypes.length > 0) {
            return sqliteProductTypes;
          }
        } catch (error) {
          this.log.error('Error getting product types from SQLite:', error);
        }
      }
      
      // Otherwise get from electron-store
      const storeProductTypes = store.get('product_types') || [];
      
      // If still no product types, set up defaults
      if (storeProductTypes.length === 0) {
        return this.setupDefaultProductTypes();
      }
      
      return storeProductTypes;
    } catch (error) {
      this.log.error('Error getting product types:', error);
      
      // Return defaults if all else fails
      return [
        {
          id: 'pipe',
          name: 'Pipes',
          attributes: ['diameter', 'length', 'material', 'brand'],
          defaultUnit: 'piece'
        },
        {
          id: 'fitting',
          name: 'Fittings',
          attributes: ['type', 'diameter', 'material', 'brand'],
          defaultUnit: 'piece'
        },
        {
          id: 'valve',
          name: 'Valves',
          attributes: ['type', 'diameter', 'material', 'brand'],
          defaultUnit: 'piece'
        },
        {
          id: 'tool',
          name: 'Tools',
          attributes: ['brand', 'model', 'condition'],
          defaultUnit: 'piece'
        },
        {
          id: 'accessory',
          name: 'Accessories',
          attributes: ['type', 'brand', 'material'],
          defaultUnit: 'piece'
        }
      ];
    }
  }
  
  /**
   * Migrate data from electron-store to SQLite database
   * @returns {Promise<void>}
   */
  async migrateFromElectronStore() {
    this.log.info('Checking if data migration from electron-store to SQLite is needed...');
    
    try {
      // Check if migration has already been done
      const migrationFlag = store.get('migration_completed');
      if (migrationFlag) {
        this.log.info('Data migration already completed previously');
        return;
      }
      
      // Get data from electron-store
      const inventory = store.get('inventory') || [];
      const sales = store.get('sales') || [];
      const reports = store.get('reports') || [];
      const customers = store.get('customers') || [];
      
      this.log.info(`Found ${inventory.length} inventory items, ${sales.length} sales, ${reports.length} reports, and ${customers.length} customers in electron-store`);
      
      // Skip migration if there's no data
      if (inventory.length === 0 && sales.length === 0 && reports.length === 0 && customers.length === 0) {
        this.log.info('No data to migrate from electron-store');
        store.set('migration_completed', true);
        return;
      }
      
      this.log.info('Starting data migration from electron-store to SQLite...');
      
      // Migrate inventory
      if (inventory.length > 0) {
        this.log.info(`Migrating ${inventory.length} inventory items...`);
        for (const item of inventory) {
          try {
            await this.db.addInventoryItem(item);
          } catch (error) {
            this.log.error(`Error migrating inventory item ${item.id}:`, error);
          }
        }
      }
      
      // Migrate sales
      if (sales.length > 0) {
        this.log.info(`Migrating ${sales.length} sales...`);
        for (const sale of sales) {
          try {
            await this.db.addSale(sale);
          } catch (error) {
            this.log.error(`Error migrating sale ${sale.id}:`, error);
          }
        }
      }
      
      // Migrate reports
      if (reports.length > 0) {
        this.log.info(`Migrating ${reports.length} reports...`);
        for (const report of reports) {
          try {
            await this.db.addReport(report);
          } catch (error) {
            this.log.error(`Error migrating report ${report.id}:`, error);
          }
        }
      }
      
      // Migrate customers
      if (customers.length > 0) {
        this.log.info(`Migrating ${customers.length} customers...`);
        for (const customer of customers) {
          try {
            if (this.db.addCustomer) {
              await this.db.addCustomer(customer);
            }
          } catch (error) {
            this.log.error(`Error migrating customer ${customer.id}:`, error);
          }
        }
      }
      
      // Mark migration as completed
      store.set('migration_completed', true);
      this.log.info('Data migration from electron-store to SQLite completed successfully');
      // After migration, clear all data from electron-store
      store.set('inventory', []);
      store.set('sales', []);
      store.set('reports', []);
      store.set('customers', []);
      store.set('product_types', []);
      store.set('migration_completed', true);
      this.log.info('Cleared all data from electron-store after migration');
    } catch (error) {
      this.log.error('Error during migration from electron-store:', error);
    }
  }
  
  /**
   * Get all inventory items
   * @returns {Promise<Array>} Inventory items
   */
  async getInventory() {
    try {
      let items = [];
      
      // Always check electron-store first to ensure we don't lose existing data
      const storeItems = store.get('inventory') || [];
      
      if (this.usingSqlite && this.db) {
        try {
          // Get items from SQLite
          const sqliteItems = await this.db.getInventory();
          
          if (sqliteItems && sqliteItems.length > 0) {
            // If we have SQLite items, use those
            items = sqliteItems;
            
            // Make sure we don't have duplicate items in electron-store and SQLite
            // by checking IDs
            const sqliteIds = new Set(sqliteItems.map(item => item.id));
            const missingItems = storeItems.filter(item => !sqliteIds.has(item.id));
            
            // If there are items in electron-store that aren't in SQLite,
            // add them to the result and also to SQLite
            if (missingItems.length > 0) {
              this.log.info(`Found ${missingItems.length} items in electron-store that aren't in SQLite, adding them to the result and to SQLite`);
              items = [...items, ...missingItems];
              
              // Add the missing items to SQLite asynchronously
              for (const item of missingItems) {
                this.db.addInventoryItem(item).catch(error => {
                  this.log.error(`Error adding missing item ${item.id} to SQLite:`, error);
                });
              }
            }
          } else {
            // If no items in SQLite, use the electron-store items
            items = storeItems;
          }
        } catch (error) {
          this.log.error('Error getting inventory from SQLite:', error);
          // Fall back to electron-store
          items = storeItems;
        }
      } else {
        // If SQLite is not available, just use electron-store
        items = storeItems;
      }
      
      return items;
    } catch (error) {
      this.log.error('Error getting inventory:', error);
      return store.get('inventory') || [];
    }
  }
  
  /**
   * Add an inventory item
   * @param {Object} item - The inventory item to add
   * @returns {Promise<Object>} The added item
   */
  async addInventoryItem(item) {
    try {
      if (this.usingSqlite && this.db) {
        return await this.db.addInventoryItem(item);
      } else {
        const now = new Date().toISOString();
        const newItem = {
          ...item,
          createdAt: now,
          updatedAt: now
        };
        const inventory = store.get('inventory') || [];
        inventory.push(newItem);
        store.set('inventory', inventory);
        this.log.info(`Added new item with ID ${item.id} to electron-store`);
        return { success: true, id: item.id, item: newItem };
      }
    } catch (error) {
      this.log.error('Error adding inventory item:', error);
      throw error;
    }
  }
  
  /**
   * Update an inventory item
   * @param {Object} item - The inventory item to update
   * @returns {Promise<Object>} The updated item
   */
  async updateInventoryItem(item) {
    try {
      if (this.usingSqlite && this.db) {
        return await this.db.updateInventoryItem(item);
      } else {
        const now = new Date().toISOString();
        const inventory = store.get('inventory') || [];
        const index = inventory.findIndex(i => i.id === item.id);
        
        if (index === -1) {
          throw new Error(`Item with ID ${item.id} not found`);
        }
        
        const updatedItem = {
          ...inventory[index],
          ...item,
          updatedAt: now
        };
        
        inventory[index] = updatedItem;
        store.set('inventory', inventory);
        return { success: true, id: item.id, item: updatedItem };
      }
    } catch (error) {
      this.log.error('Error updating inventory item:', error);
      throw error;
    }
  }
  
  /**
   * Delete an inventory item
   * @param {string} itemId - The ID of the item to delete
   * @returns {Promise<Object>} Success status
   */
  async deleteInventoryItem(itemId) {
    try {
      if (this.usingSqlite && this.db) {
        return await this.db.deleteInventoryItem(itemId);
      } else {
        const inventory = store.get('inventory') || [];
        const newInventory = inventory.filter(item => item.id !== itemId);
        store.set('inventory', newInventory);
        return { success: true, id: itemId };
      }
    } catch (error) {
      this.log.error('Error deleting inventory item:', error);
      throw error;
    }
  }
  
  /**
   * Get all sales
   * @returns {Promise<Array>} Sales
   */
  async getSales() {
    try {
      let sales = [];
      
      // Always check electron-store first to ensure we don't lose existing data
      const storeSales = store.get('sales') || [];
      
      if (this.usingSqlite && this.db) {
        try {
          // Get sales from SQLite
          const sqliteSales = await this.db.getSales();
          
          if (sqliteSales && sqliteSales.length > 0) {
            // If we have SQLite sales, use those
            sales = sqliteSales;
            
            // Make sure we don't have duplicate sales in electron-store and SQLite
            // by checking IDs
            const sqliteIds = new Set(sqliteSales.map(sale => sale.id));
            const missingSales = storeSales.filter(sale => !sqliteIds.has(sale.id));
            
            // If there are sales in electron-store that aren't in SQLite,
            // add them to the result and also to SQLite
            if (missingSales.length > 0) {
              this.log.info(`Found ${missingSales.length} sales in electron-store that aren't in SQLite, adding them to the result and to SQLite`);
              sales = [...sales, ...missingSales];
              
              // Add the missing sales to SQLite asynchronously
              for (const sale of missingSales) {
                this.db.addSale(sale).catch(error => {
                  this.log.error(`Error adding missing sale ${sale.id} to SQLite:`, error);
                });
              }
            }
          } else {
            // If no sales in SQLite, use the electron-store sales
            sales = storeSales;
          }
        } catch (error) {
          this.log.error('Error getting sales from SQLite:', error);
          // Fall back to electron-store
          sales = storeSales;
        }
      } else {
        // If SQLite is not available, just use electron-store
        sales = storeSales;
      }
      
      return sales;
    } catch (error) {
      this.log.error('Error getting sales:', error);
      return store.get('sales') || [];
    }
  }
  
  /**
   * Add a sale
   * @param {Object} sale - The sale to add
   * @returns {Promise<Object>} The added sale
   */
  async addSale(sale) {
    try {
      if (this.usingSqlite && this.db) {
        return await this.db.addSale(sale);
      } else {
        const now = new Date().toISOString();
        const newSale = {
          ...sale,
          createdAt: now,
          updatedAt: now
        };
        const sales = store.get('sales') || [];
        sales.push(newSale);
        store.set('sales', sales);
        
        // Update inventory
        this.updateInventoryAfterSale(sale.items);
        
        return { success: true, id: sale.id, sale: newSale };
      }
    } catch (error) {
      this.log.error('Error adding sale:', error);
      throw error;
    }
  }
  
  /**
   * Update inventory after a sale
   * @param {Array} items - The items sold
   */
  async updateInventoryAfterSale(items) {
    if (!items || !Array.isArray(items) || items.length === 0) return;
    
    try {
      const inventory = store.get('inventory') || [];
      let updated = false;
      
      for (const item of items) {
        const itemId = item.id || item.itemId;
        if (!itemId) continue;
        
        const index = inventory.findIndex(i => i.id === itemId);
        if (index !== -1) {
          const quantity = parseInt(item.quantity) || 0;
          inventory[index].quantity = Math.max(0, inventory[index].quantity - quantity);
          inventory[index].updatedAt = new Date().toISOString();
          updated = true;
        }
      }
      
      if (updated) {
        store.set('inventory', inventory);
      }
    } catch (error) {
      this.log.error('Error updating inventory after sale:', error);
    }
  }
  
  /**
   * Get all reports
   * @returns {Promise<Array>} Reports
   */
  async getReports() {
    try {
      let reports = [];
      
      // Always check electron-store first to ensure we don't lose existing data
      const storeReports = store.get('reports') || [];
      
      if (this.usingSqlite && this.db) {
        try {
          // Get reports from SQLite
          const sqliteReports = await this.db.getReports();
          
          if (sqliteReports && sqliteReports.length > 0) {
            // If we have SQLite reports, use those
            reports = sqliteReports;
            
            // Make sure we don't have duplicate reports in electron-store and SQLite
            // by checking IDs
            const sqliteIds = new Set(sqliteReports.map(report => report.id));
            const missingReports = storeReports.filter(report => !sqliteIds.has(report.id));
            
            // If there are reports in electron-store that aren't in SQLite,
            // add them to the result and also to SQLite
            if (missingReports.length > 0) {
              this.log.info(`Found ${missingReports.length} reports in electron-store that aren't in SQLite, adding them to the result and to SQLite`);
              reports = [...reports, ...missingReports];
              
              // Add the missing reports to SQLite asynchronously
              for (const report of missingReports) {
                this.db.addReport(report).catch(error => {
                  this.log.error(`Error adding missing report ${report.id} to SQLite:`, error);
                });
              }
            }
          } else {
            // If no reports in SQLite, use the electron-store reports
            reports = storeReports;
          }
        } catch (error) {
          this.log.error('Error getting reports from SQLite:', error);
          // Fall back to electron-store
          reports = storeReports;
        }
      } else {
        // If SQLite is not available, just use electron-store
        reports = storeReports;
      }
      
      return reports;
    } catch (error) {
      this.log.error('Error getting reports:', error);
      return store.get('reports') || [];
    }
  }
  
  /**
   * Get a report by ID
   * @param {string} reportId - The ID of the report to get
   * @returns {Promise<Object>} The report
   */
  async getReportById(reportId) {
    try {
      if (this.usingSqlite && this.db) {
        return await this.db.getReportById(reportId);
      } else {
        const reports = store.get('reports') || [];
        return reports.find(r => r.id === reportId);
      }
    } catch (error) {
      this.log.error('Error getting report by ID:', error);
      return null;
    }
  }
  
  /**
   * Add a report
   * @param {Object} report - The report to add
   * @returns {Promise<Object>} The added report
   */
  async addReport(report) {
    try {
      if (this.usingSqlite && this.db) {
        return await this.db.addReport(report);
      } else {
        const now = new Date().toISOString();
        const newReport = {
          ...report,
          createdAt: now,
          updatedAt: now
        };
        const reports = store.get('reports') || [];
        reports.push(newReport);
        store.set('reports', reports);
        return newReport;
      }
    } catch (error) {
      this.log.error('Error adding report:', error);
      throw error;
    }
  }
  
  /**
   * Get all customers
   * @returns {Promise<Array>} Customers
   */
  async getCustomers() {
    try {
      let customers = [];
      
      // Always check electron-store first to ensure we don't lose existing data
      const storeCustomers = store.get('customers') || [];
      
      if (this.usingSqlite && this.db && this.db.getCustomers) {
        try {
          // Get customers from SQLite
          const sqliteCustomers = await this.db.getCustomers();
          
          if (sqliteCustomers && sqliteCustomers.length > 0) {
            // If we have SQLite customers, use those
            customers = sqliteCustomers;
            
            // Make sure we don't have duplicate customers in electron-store and SQLite
            // by checking IDs
            const sqliteIds = new Set(sqliteCustomers.map(customer => customer.id));
            const missingCustomers = storeCustomers.filter(customer => !sqliteIds.has(customer.id));
            
            // If there are customers in electron-store that aren't in SQLite,
            // add them to the result and also to SQLite
            if (missingCustomers.length > 0) {
              this.log.info(`Found ${missingCustomers.length} customers in electron-store that aren't in SQLite, adding them to the result and to SQLite`);
              customers = [...customers, ...missingCustomers];
              
              // Add the missing customers to SQLite asynchronously
              for (const customer of missingCustomers) {
                if (this.db.addCustomer) {
                  this.db.addCustomer(customer).catch(error => {
                    this.log.error(`Error adding missing customer ${customer.id} to SQLite:`, error);
                  });
                }
              }
            }
          } else {
            // If no customers in SQLite, use the electron-store customers
            customers = storeCustomers;
          }
        } catch (error) {
          this.log.error('Error getting customers from SQLite:', error);
          // Fall back to electron-store
          customers = storeCustomers;
        }
      } else {
        // If SQLite is not available, just use electron-store
        customers = storeCustomers;
      }
      
      return customers;
    } catch (error) {
      this.log.error('Error getting customers:', error);
      return store.get('customers') || [];
    }
  }
  
  /**
   * Get a customer by ID
   * @param {string} id - Customer ID
   * @returns {Promise<Object>} Customer
   */
  async getCustomerById(id) {
    try {
      if (this.usingSqlite && this.db && this.db.getCustomerById) {
        try {
          const customer = await this.db.getCustomerById(id);
          if (customer) {
            return customer;
          }
        } catch (error) {
          this.log.error(`Error getting customer ${id} from SQLite:`, error);
        }
      }
      
      // Fallback to electron-store
      const customers = store.get('customers') || [];
      const customer = customers.find(c => c.id === id);
      return customer || null;
    } catch (error) {
      this.log.error(`Error getting customer ${id}:`, error);
      return null;
    }
  }
  
  /**
   * Add a new customer
   * @param {Object} customer - Customer object
   * @returns {Promise<Object>} Result object
   */
  async addCustomer(customer) {
    try {
      if (this.usingSqlite && this.db && this.db.addCustomer) {
        return await this.db.addCustomer(customer);
      } else {
        // Fallback to electron-store
        const now = new Date().toISOString();
        const newCustomer = {
          ...customer,
          totalPurchases: customer.totalPurchases || 0,
          purchaseCount: customer.purchaseCount || 0,
          lastPurchaseDate: customer.lastPurchaseDate || null,
          createdAt: customer.createdAt || now,
          updatedAt: now
        };
        
        const customers = store.get('customers') || [];
        customers.push(newCustomer);
        store.set('customers', customers);
        return { success: true, id: customer.id, customer: newCustomer };
      }
    } catch (error) {
      this.log.error('Error adding customer:', error);
      throw error;
    }
  }
  
  /**
   * Update a customer
   * @param {Object} customer - Updated customer object
   * @returns {Promise<Object>} Result object
   */
  async updateCustomer(customer) {
    try {
      if (this.usingSqlite && this.db && this.db.updateCustomer) {
        return await this.db.updateCustomer(customer);
      } else {
        // Fallback to electron-store
        const now = new Date().toISOString();
        const customers = store.get('customers') || [];
        const index = customers.findIndex(c => c.id === customer.id);
        
        if (index === -1) {
          throw new Error(`Customer with ID ${customer.id} not found`);
        }
        
        const updatedCustomer = {
          ...customers[index],
          ...customer,
          updatedAt: now
        };
        
        customers[index] = updatedCustomer;
        store.set('customers', customers);
        return { success: true, id: customer.id, customer: updatedCustomer };
      }
    } catch (error) {
      this.log.error(`Error updating customer ${customer.id}:`, error);
      throw error;
    }
  }
  
  /**
   * Delete a customer
   * @param {string} id - Customer ID
   * @returns {Promise<Object>} Result object
   */
  async deleteCustomer(id) {
    try {
      if (this.usingSqlite && this.db && this.db.deleteCustomer) {
        return await this.db.deleteCustomer(id);
      } else {
        // Fallback to electron-store
        const customers = store.get('customers') || [];
        const index = customers.findIndex(c => c.id === id);
        
        if (index === -1) {
          throw new Error(`Customer with ID ${id} not found`);
        }
        
        customers.splice(index, 1);
        store.set('customers', customers);
        return { success: true, id };
      }
    } catch (error) {
      this.log.error(`Error deleting customer ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Update customer purchase statistics
   * @param {string} customerId - Customer ID
   * @param {number} purchaseAmount - Amount of the purchase
   * @returns {Promise<Object>} Updated customer
   */
  async updateCustomerPurchaseStats(customerId, purchaseAmount) {
    try {
      if (this.usingSqlite && this.db && this.db.updateCustomerPurchaseStats) {
        return await this.db.updateCustomerPurchaseStats(customerId, purchaseAmount);
      } else {
        // Fallback to electron-store
        const customers = store.get('customers') || [];
        const customerIndex = customers.findIndex(c => c.id === customerId);
        
        if (customerIndex === -1) {
          throw new Error(`Customer with ID ${customerId} not found`);
        }
        
        const customer = customers[customerIndex];
        const now = new Date().toISOString();
        
        // Update purchase stats
        customer.totalPurchases = (customer.totalPurchases || 0) + purchaseAmount;
        customer.purchaseCount = (customer.purchaseCount || 0) + 1;
        customer.lastPurchaseDate = now;
        customer.updatedAt = now;
        
        customers[customerIndex] = customer;
        store.set('customers', customers);
        
        return customer;
      }
    } catch (error) {
      this.log.error(`Error updating purchase stats for customer ${customerId}:`, error);
      throw error;
    }
  }
  
  /**
   * Close database connection
   */
  close() {
    if (this.usingSqlite && this.db) {
      this.db.close();
    }
  }
}

// Export a singleton instance
module.exports = new DatabaseWrapper(); 