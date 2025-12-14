/**
 * SQLite Database Module
 * Provides database operations using sqlite3
 */

const { sqlite3 } = require('../db/sqlite-adapter');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const { v4: uuidv4 } = require('uuid');
const log = require('electron-log');
const EventEmitter = require('events');

// Database event emitter for real-time updates
class DBEvents extends EventEmitter {}
const dbEvents = new DBEvents();

class Database {
  constructor() {
    this.db = null;
    this.dbPath = path.join(app.getPath('userData'), 'inventory.db');
    this.inTransaction = false;
    log.info('Database constructor initialized with path:', this.dbPath);
    
    try {
      // Create the database directory if it doesn't exist
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Open the database (will create if it doesn't exist)
      this.db = new sqlite3.Database(
        this.dbPath, 
        sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, 
        (err) => {
        if (err) {
            log.error('Error opening database:', err.message);
          throw err;
        }
          log.info('Connected to the SQLite database');
          this.createTables();
        }
      );
    } catch (error) {
      log.error('Error initializing database:', error);
      throw new Error(`Database initialization failed: ${error.message}`);
    }
  }
  
  /**
   * Begin a transaction
   * @returns {Promise<boolean>} Success status
   */
  beginTransaction() {
    return new Promise((resolve, reject) => {
      if (this.inTransaction) {
        log.warn('Transaction already in progress, cannot start a new one');
        resolve(false);
        return;
      }

      this.db.run('BEGIN TRANSACTION', (err) => {
        if (err) {
          log.error('Error beginning transaction:', err.message);
          reject(err);
        } else {
          this.inTransaction = true;
          log.info('Transaction started');
          resolve(true);
        }
      });
    });
  }

  /**
   * Commit a transaction
   * @returns {Promise<boolean>} Success status
   */
  commitTransaction() {
    return new Promise((resolve, reject) => {
      if (!this.inTransaction) {
        log.warn('No transaction in progress, cannot commit');
        resolve(false);
        return;
      }

      this.db.run('COMMIT', (err) => {
        if (err) {
          log.error('Error committing transaction:', err.message);
          reject(err);
        } else {
          this.inTransaction = false;
          log.info('Transaction committed');
          resolve(true);
        }
      });
    });
  }

  /**
   * Rollback a transaction
   * @returns {Promise<boolean>} Success status
   */
  rollbackTransaction() {
    return new Promise((resolve, reject) => {
      if (!this.inTransaction) {
        log.warn('No transaction in progress, cannot rollback');
        resolve(false);
        return;
      }

      this.db.run('ROLLBACK', (err) => {
        if (err) {
          log.error('Error rolling back transaction:', err.message);
          reject(err);
        } else {
          this.inTransaction = false;
          log.info('Transaction rolled back');
          resolve(true);
        }
      });
    });
  }

  /**
   * Safely execute a function within a transaction
   * @param {Function} callback - Function to execute within the transaction
   * @returns {Promise<any>} Result of the callback function
   */
  async executeTransaction(callback) {
    const startTransaction = !this.inTransaction;
    
    try {
      // Only start a new transaction if one isn't already in progress
      if (startTransaction) {
        await this.beginTransaction();
      }
      
      // Execute the callback
      const result = await callback();
      
      // Only commit if we started the transaction
      if (startTransaction) {
        await this.commitTransaction();
      }
      
      return result;
    } catch (error) {
      // Only rollback if we started the transaction
      if (startTransaction && this.inTransaction) {
        await this.rollbackTransaction();
      }
      throw error;
    }
  }
  
  /**
   * Initialize the database - called from the database wrapper
   * @returns {Promise<boolean>} Success status
   */
  initialize() {
    return new Promise((resolve) => {
      // Database is already initialized in constructor
      resolve(true);
    });
  }
  
  /**
   * Create database tables if they don't exist
   */
  createTables() {
    log.info('Creating tables if needed...');
    
    const tables = [
      `CREATE TABLE IF NOT EXISTS inventory (
        id TEXT PRIMARY KEY,
        type TEXT,
        description TEXT,
        quantity INTEGER DEFAULT 0,
        cost_price REAL DEFAULT 0,
        selling_price REAL DEFAULT 0,
        color TEXT,
        diameter TEXT,
        brand TEXT,
        dimensions TEXT,
        buying_price REAL DEFAULT 0,
        alert_threshold INTEGER DEFAULT 10,
        created_at TEXT,
        updated_at TEXT,
        created_by TEXT,
        updated_by TEXT,
        additional_data TEXT
      )`,
      
      `CREATE TABLE IF NOT EXISTS sales (
        id TEXT PRIMARY KEY,
        invoice_number TEXT UNIQUE,
        customer_name TEXT,
        customer_id TEXT,
        customer_contact TEXT,
        total_amount REAL DEFAULT 0,
        payment_method TEXT,
        status TEXT DEFAULT 'completed',
        created_at TEXT,
        created_by TEXT,
        notes TEXT,
        additional_data TEXT
      )`,
      
      `CREATE TABLE IF NOT EXISTS sale_items (
        id TEXT PRIMARY KEY,
        sale_id TEXT,
        product_id TEXT,
        product_name TEXT,
        quantity INTEGER,
        unit_price REAL,
        total_price REAL,
        cost_price REAL,
        FOREIGN KEY(sale_id) REFERENCES sales(id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE,
        description TEXT,
        created_at TEXT,
        updated_at TEXT
      )`,
      
      `CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        business TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        tin TEXT,
        type TEXT DEFAULT 'regular',
        notes TEXT,
        totalPurchases REAL DEFAULT 0,
        purchaseCount INTEGER DEFAULT 0,
        lastPurchaseDate TEXT,
        createdAt TEXT,
        updatedAt TEXT
      )`,
      
      `CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        name TEXT,
        description TEXT,
        data TEXT,
        parameters TEXT,
        charts TEXT,
        createdAt TEXT,
        updatedAt TEXT
      )`,
      
      `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        description TEXT,
        updated_at TEXT
      )`
    ];
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_inventory_type ON inventory(type)',
      'CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id)',
      'CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id)'
    ];
    
    // Enable foreign keys
    this.db.run('PRAGMA foreign_keys = ON', (err) => {
      if (err) log.error('Error enabling foreign keys:', err.message);
    });
    
    // Create tables
    this.db.serialize(() => {
      tables.forEach(sql => {
        this.db.run(sql, (err) => {
          if (err) log.error('Error creating table:', err.message);
        });
      });
      
      // Create indexes
      indexes.forEach(sql => {
        this.db.run(sql, (err) => {
          if (err) log.error('Error creating index:', err.message);
        });
      });
      
      log.info('Database tables and indexes created or verified');
    });
  }
  
  /**
   * Get all inventory items
   * @returns {Promise<Array>} Array of inventory items
   */
  getInventory() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM inventory', (err, rows) => {
        if (err) {
          log.error('Error getting inventory:', err.message);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  /**
   * Get inventory items with a specific type filter
   * @param {string} type - Type to filter by
   * @returns {Promise<Array>} Array of inventory items
   */
  getInventoryByType(type) {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM inventory WHERE type = ?', [type], (err, rows) => {
        if (err) {
          log.error(`Error getting inventory by type ${type}:`, err.message);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  /**
   * Get a single inventory item by ID
   * @param {string} id - Item ID
   * @returns {Promise<Object>} Inventory item
   */
  getItemById(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM inventory WHERE id = ?', [id], (err, row) => {
        if (err) {
          log.error(`Error getting item ${id}:`, err.message);
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  /**
   * Add a new inventory item
   * @param {Object} item - Inventory item to add
   * @returns {Promise<Object>} Result object
   */
  addInventoryItem(item) {
    return new Promise((resolve, reject) => {
      // Ensure item has an ID
      if (!item.id) {
        item.id = uuidv4();
      }
      
    const now = new Date().toISOString();
      item.created_at = item.created_at || now;
      item.updated_at = now;
      
      const sql = `
        INSERT INTO inventory (
          id, type, description, quantity, cost_price, selling_price,
          color, diameter, brand, dimensions, buying_price, alert_threshold,
          created_at, updated_at, created_by, updated_by, additional_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
      item.id,
      item.type || '',
        item.description || '',
        item.quantity || 0,
        item.cost_price || 0,
        item.selling_price || 0,
        item.color || '',
        item.diameter || '',
        item.brand || '',
        item.dimensions || '',
        item.buying_price || 0,
        item.alert_threshold || 10,
        item.created_at,
        item.updated_at,
        item.created_by || 'system',
        item.updated_by || 'system',
        item.additional_data ? JSON.stringify(item.additional_data) : null
      ];
      
      this.db.run(sql, params, function(err) {
        if (err) {
          log.error('Error adding inventory item:', err.message);
          reject(err);
        } else {
          log.info(`Added new item with ID ${item.id}`);
          
          // Emit event for real-time updates
          dbEvents.emit('inventory-created', item);
          
          resolve({ success: true, id: item.id, item });
        }
      });
    });
  }
  
  /**
   * Update an inventory item
   * @param {Object} item - Updated inventory item
   * @returns {Promise<Object>} Result object
   */
  updateInventoryItem(item) {
    return new Promise((resolve, reject) => {
      if (!item.id) {
        reject(new Error('Item ID is required for update'));
        return;
      }
      
      // Get the original item first for comparison
      this.getItemById(item.id)
        .then(originalItem => {
          if (!originalItem) {
            reject(new Error(`Item with ID ${item.id} not found`));
            return;
          }
          
          const now = new Date().toISOString();
          item.updated_at = now;
          
          const sql = `
            UPDATE inventory SET
              type = ?,
        description = ?,
        quantity = ?,
              cost_price = ?,
              selling_price = ?,
              color = ?,
              diameter = ?,
        brand = ?,
        dimensions = ?,
              buying_price = ?,
              alert_threshold = ?,
              updated_at = ?,
              updated_by = ?,
              additional_data = ?
      WHERE id = ?
    `;
    
          const params = [
            item.type || originalItem.type || '',
            item.description || originalItem.description || '',
            item.quantity !== undefined ? item.quantity : originalItem.quantity || 0,
            item.cost_price !== undefined ? item.cost_price : originalItem.cost_price || 0,
            item.selling_price !== undefined ? item.selling_price : originalItem.selling_price || 0,
            item.color || originalItem.color || '',
            item.diameter || originalItem.diameter || '',
            item.brand || originalItem.brand || '',
            item.dimensions || originalItem.dimensions || '',
            item.buying_price !== undefined ? item.buying_price : originalItem.buying_price || 0,
            item.alert_threshold !== undefined ? item.alert_threshold : originalItem.alert_threshold || 10,
            item.updated_at,
            item.updated_by || 'system',
            item.additional_data ? JSON.stringify(item.additional_data) : 
              (originalItem.additional_data ? originalItem.additional_data : null),
            item.id
          ];
          
          this.db.run(sql, params, function(err) {
            if (err) {
              log.error(`Error updating item ${item.id}:`, err.message);
              reject(err);
            } else {
              log.info(`Updated item ${item.id}`);
              
              // Merge with original to ensure all properties are preserved
              const updatedItem = { ...originalItem, ...item };
              
              // Emit event for real-time updates
              dbEvents.emit('inventory-updated', updatedItem);
              
              resolve({ success: true, id: item.id, item: updatedItem });
            }
          });
        })
        .catch(err => {
          log.error(`Error getting original item ${item.id} for update:`, err.message);
          reject(err);
        });
    });
  }
  
  /**
   * Delete an inventory item
   * @param {string} id - Item ID to delete
   * @returns {Promise<Object>} Result object
   */
  deleteInventoryItem(id) {
    return new Promise((resolve, reject) => {
      if (!id) {
        reject(new Error('Item ID is required for deletion'));
        return;
      }
      
      // First get the item to be deleted (for event emission)
      this.getItemById(id)
        .then(item => {
          if (!item) {
            reject(new Error(`Item with ID ${id} not found`));
            return;
          }
          
          this.db.run('DELETE FROM inventory WHERE id = ?', [id], function(err) {
            if (err) {
              log.error(`Error deleting item ${id}:`, err.message);
              reject(err);
            } else {
              log.info(`Deleted item ${id}`);
              
              // Emit event for real-time updates
              dbEvents.emit('inventory-deleted', id);
              
              resolve({ success: true, id });
            }
          });
        })
        .catch(err => {
          log.error(`Error getting item ${id} for deletion:`, err.message);
          reject(err);
        });
    });
  }
  
  /**
   * Get low stock items
   * @param {number} threshold - Optional override threshold
   * @returns {Promise<Array>} Array of low stock items
   */
  getLowStockItems(threshold) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM inventory
        WHERE quantity <= COALESCE(alert_threshold, ?)
      `;
      
      this.db.all(sql, [threshold || 10], (err, rows) => {
        if (err) {
          log.error('Error getting low stock items:', err.message);
          reject(err);
          } else {
          resolve(rows || []);
        }
      });
    });
  }
  
  /**
   * Get all sales
   * @returns {Promise<Array>} Array of sales
   */
  getSales() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM sales ORDER BY created_at DESC', (err, rows) => {
        if (err) {
          log.error('Error getting sales:', err.message);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }
  
  /**
   * Get a sale by ID with its items
   * @param {string} id - Sale ID
   * @returns {Promise<Object>} Sale with items
   */
  getSaleById(id) {
    return new Promise((resolve, reject) => {
      // Get the sale
      this.db.get('SELECT * FROM sales WHERE id = ?', [id], (err, sale) => {
        if (err) {
          log.error(`Error getting sale ${id}:`, err.message);
          reject(err);
          return;
        }
        
        if (!sale) {
          resolve(null);
          return;
        }
        
        // Get the sale items
        this.db.all('SELECT * FROM sale_items WHERE sale_id = ?', [id], (err, items) => {
          if (err) {
            log.error(`Error getting items for sale ${id}:`, err.message);
            reject(err);
            return;
          }
          
          // Attach items to sale
          sale.items = items || [];
          resolve(sale);
        });
      });
    });
  }
  
  /**
   * Add a new sale
   * @param {Object} sale - Sale object with items
   * @returns {Promise<Object>} Result object
   */
  addSale(sale) {
    return new Promise((resolve, reject) => {
      if (!sale) {
        reject(new Error('Invalid sale data'));
        return;
      }
      
      // Ensure sale has an ID
      if (!sale.id) {
        sale.id = uuidv4();
      }
      
      const now = new Date().toISOString();
      sale.created_at = sale.created_at || now;
      
      // Begin transaction with our transaction management
      this.executeTransaction(async () => {
        try {
          // Insert sale
          const saleSql = `
        INSERT INTO sales (
              id, invoice_number, customer_name, customer_id, customer_contact,
              total_amount, payment_method, status, created_at, created_by, notes, additional_data
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          
          const saleParams = [
        sale.id,
            sale.invoice_number || '',
            sale.customer_name || '',
            sale.customer_id || null,
            sale.customer_contact || '',
            sale.total_amount || 0,
            sale.payment_method || '',
        sale.status || 'completed',
            sale.created_at,
            sale.created_by || 'system',
            sale.notes || '',
            sale.additional_data ? JSON.stringify(sale.additional_data) : null
          ];
          
          await new Promise((resolveSale, rejectSale) => {
            this.db.run(saleSql, saleParams, function(err) {
              if (err) {
                log.error('Error adding sale:', err.message);
                rejectSale(err);
              } else {
                resolveSale();
              }
            });
          });
          
          // If no items, return early
          if (!sale.items || sale.items.length === 0) {
            log.info(`Added sale ${sale.id} with no items`);
            dbEvents.emit('sale-created', sale);
            return { success: true, id: sale.id, sale };
          }
          
          // Process each sale item and update inventory
        for (const item of sale.items) {
            // Insert sale item
            const itemId = item.id || uuidv4();
            const itemSql = `
              INSERT INTO sale_items (
                id, sale_id, product_id, product_name, quantity, unit_price, total_price, cost_price
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const itemParams = [
              itemId,
              sale.id,
              item.product_id || item.itemId,
              item.product_name || '',
              item.quantity || 0,
              item.unit_price || 0,
              item.total_price || 0,
              item.cost_price || 0
            ];
            
            await new Promise((resolveItem, rejectItem) => {
              this.db.run(itemSql, itemParams, function(err) {
                if (err) {
                  log.error(`Error adding sale item for sale ${sale.id}:`, err.message);
                  rejectItem(err);
                } else {
                  resolveItem();
                }
              });
            });
            
            // Update inventory quantity
            if (item.product_id || item.itemId) {
              const productId = item.product_id || item.itemId;
              const updateSql = `
                UPDATE inventory 
                SET quantity = MAX(0, quantity - ?), 
                    updated_at = ? 
        WHERE id = ?
      `;
      
              await new Promise((resolveUpdate, rejectUpdate) => {
                this.db.run(updateSql, [
                  item.quantity || 0,
                  now,
                  productId
                ], function(err) {
                  if (err) {
                    log.error(`Error updating inventory for item ${productId}:`, err.message);
                    rejectUpdate(err);
          } else {
                    resolveUpdate();
                  }
                });
              });
            }
          }
          
          log.info(`Added sale ${sale.id} with ${sale.items.length} items`);
          dbEvents.emit('sale-created', sale);
          return { success: true, id: sale.id, sale };
    } catch (error) {
          log.error('Error processing sale:', error.message);
      throw error;
    }
      })
      .then(result => {
        resolve(result);
      })
      .catch(err => {
        reject(err);
      });
    });
  }

  /**
   * Get all reports
   * @returns {Promise<Array>} Array of reports
   */
  getReports() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM reports ORDER BY createdAt DESC', (err, rows) => {
        if (err) {
          log.error('Error getting reports:', err.message);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  /**
   * Get a report by ID
   * @param {string} id - Report ID
   * @returns {Promise<Object>} Report
   */
  getReportById(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM reports WHERE id = ?', [id], (err, row) => {
        if (err) {
          log.error(`Error getting report ${id}:`, err.message);
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  /**
   * Add a new report
   * @param {Object} report - Report object
   * @returns {Promise<Object>} Result object
   */
  addReport(report) {
    return new Promise((resolve, reject) => {
      if (!report) {
        reject(new Error('Invalid report data'));
        return;
      }
      
      // Ensure report has an ID
      if (!report.id) {
        report.id = `report-${Date.now()}`;
      }
      
      const now = new Date().toISOString();
      report.createdAt = report.createdAt || now;
      report.updatedAt = now;

      const sql = `
        INSERT INTO reports (
          id, type, name, description, data, parameters, charts, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        report.id,
        report.type || '',
        report.name || '',
        report.description || '',
        report.data ? JSON.stringify(report.data) : null,
        report.parameters ? JSON.stringify(report.parameters) : null,
        report.charts ? JSON.stringify(report.charts) : null,
        report.createdAt,
        report.updatedAt
      ];
      
      this.db.run(sql, params, function(err) {
        if (err) {
          log.error('Error adding report:', err.message);
          reject(err);
        } else {
          log.info(`Added new report with ID ${report.id}`);
          
          // Emit event for real-time updates
          dbEvents.emit('report-created', report);
          
          resolve({ success: true, id: report.id, report });
        }
      });
    });
  }
  
  /**
   * Close the database connection
   */
  close() {
    return new Promise((resolve, reject) => {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
            log.error('Error closing database:', err.message);
            reject(err);
        } else {
            log.info('Database connection closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
  
  /**
   * Get database events emitter
   * @returns {EventEmitter} Database events emitter
   */
  getEventEmitter() {
    return dbEvents;
  }

  /**
   * Get all customers
   * @returns {Promise<Array>} Array of customers
   */
  getCustomers() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM customers ORDER BY name', (err, rows) => {
        if (err) {
          log.error('Error getting customers:', err.message);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  /**
   * Get a customer by ID
   * @param {string} id - Customer ID
   * @returns {Promise<Object>} Customer
   */
  getCustomerById(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM customers WHERE id = ?', [id], (err, row) => {
        if (err) {
          log.error(`Error getting customer ${id}:`, err.message);
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  /**
   * Add a new customer
   * @param {Object} customer - Customer object
   * @returns {Promise<Object>} Result object
   */
  addCustomer(customer) {
    return new Promise((resolve, reject) => {
      if (!customer) {
        reject(new Error('Invalid customer data'));
        return;
      }
      
      // Ensure customer has an ID
      if (!customer.id) {
        customer.id = `cust-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      }
      
      const now = new Date().toISOString();
      customer.createdAt = customer.createdAt || now;
      customer.updatedAt = now;

      const sql = `
        INSERT INTO customers (
          id, name, business, email, phone, address, tin, type, notes, 
          totalPurchases, purchaseCount, lastPurchaseDate, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        customer.id,
        customer.name || '',
        customer.business || '',
        customer.email || '',
        customer.phone || '',
        customer.address || '',
        customer.tin || '',
        customer.type || 'regular',
        customer.notes || '',
        customer.totalPurchases || 0,
        customer.purchaseCount || 0,
        customer.lastPurchaseDate || null,
        customer.createdAt,
        customer.updatedAt
      ];
      
      this.db.run(sql, params, function(err) {
        if (err) {
          log.error('Error adding customer:', err.message);
          reject(err);
        } else {
          log.info(`Added new customer with ID ${customer.id}`);
          
          // Emit event for real-time updates
          dbEvents.emit('customer-created', customer);
          
          resolve({ success: true, id: customer.id, customer });
        }
      });
    });
  }

  /**
   * Update a customer
   * @param {Object} customer - Updated customer object
   * @returns {Promise<Object>} Result object
   */
  updateCustomer(customer) {
    return new Promise((resolve, reject) => {
      if (!customer || !customer.id) {
        reject(new Error('Invalid customer data or missing ID'));
        return;
      }
      
      const now = new Date().toISOString();
      customer.updatedAt = now;
      
      const sql = `
        UPDATE customers SET
          name = ?,
          business = ?,
          email = ?,
          phone = ?,
          address = ?,
          tin = ?,
          type = ?,
          notes = ?,
          totalPurchases = ?,
          purchaseCount = ?,
          lastPurchaseDate = ?,
          updatedAt = ?
        WHERE id = ?
      `;
      
      const params = [
        customer.name || '',
        customer.business || '',
        customer.email || '',
        customer.phone || '',
        customer.address || '',
        customer.tin || '',
        customer.type || 'regular',
        customer.notes || '',
        customer.totalPurchases || 0,
        customer.purchaseCount || 0,
        customer.lastPurchaseDate || null,
        customer.updatedAt,
        customer.id
      ];
      
      this.db.run(sql, params, function(err) {
        if (err) {
          log.error(`Error updating customer ${customer.id}:`, err.message);
          reject(err);
        } else {
          if (this.changes === 0) {
            reject(new Error(`Customer with ID ${customer.id} not found`));
            return;
          }
          
          log.info(`Updated customer with ID ${customer.id}`);
          
          // Emit event for real-time updates
          dbEvents.emit('customer-updated', customer);
          
          resolve({ success: true, id: customer.id, customer });
        }
      });
    });
  }

  /**
   * Delete a customer
   * @param {string} id - Customer ID
   * @returns {Promise<Object>} Result object
   */
  deleteCustomer(id) {
    return new Promise((resolve, reject) => {
      if (!id) {
        reject(new Error('Customer ID is required'));
        return;
      }
      
      this.db.run('DELETE FROM customers WHERE id = ?', [id], function(err) {
        if (err) {
          log.error(`Error deleting customer ${id}:`, err.message);
          reject(err);
        } else {
          if (this.changes === 0) {
            reject(new Error(`Customer with ID ${id} not found`));
            return;
          }
          
          log.info(`Deleted customer with ID ${id}`);
          
          // Emit event for real-time updates
          dbEvents.emit('customer-deleted', id);
          
          resolve({ success: true, id });
        }
      });
    });
  }

  /**
   * Update customer purchase statistics
   * @param {string} customerId - Customer ID
   * @param {number} purchaseAmount - Amount of the purchase
   * @returns {Promise<Object>} Updated customer
   */
  updateCustomerPurchaseStats(customerId, purchaseAmount) {
    return new Promise((resolve, reject) => {
      if (!customerId) {
        reject(new Error('Customer ID is required'));
        return;
      }
      
      const now = new Date().toISOString();
      
      const sql = `
        UPDATE customers SET
          totalPurchases = totalPurchases + ?,
          purchaseCount = purchaseCount + 1,
          lastPurchaseDate = ?,
          updatedAt = ?
        WHERE id = ?
      `;
      
      this.db.run(sql, [purchaseAmount, now, now, customerId], function(err) {
        if (err) {
          log.error(`Error updating purchase stats for customer ${customerId}:`, err.message);
          reject(err);
        } else {
          if (this.changes === 0) {
            log.warn(`Customer with ID ${customerId} not found for purchase stats update`);
            reject(new Error(`Customer with ID ${customerId} not found`));
            return;
          }
          
          log.info(`Updated purchase stats for customer ${customerId}: +${purchaseAmount}`);
          
          // Emit event for real-time updates
          dbEvents.emit('customer-stats-updated', { customerId, purchaseAmount });
          
          // Get the updated customer to return
          this.db.get('SELECT * FROM customers WHERE id = ?', [customerId], (err, customer) => {
        if (err) {
              log.error(`Error retrieving updated customer ${customerId}:`, err.message);
              reject(err);
        } else {
              resolve(customer || null);
        }
      });
    }
      }.bind(this));
    });
  }
}

module.exports = Database;

 