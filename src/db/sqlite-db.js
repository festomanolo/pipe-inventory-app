const path = require('path');
const { app } = require('electron');
const Database = require('better-sqlite3');
const EventEmitter = require('events');

// Load SQLite module with better compatibility
let sqlite3;
try {
  const { sqlite3: sqliteAdapter } = require('./sqlite-adapter');
  sqlite3 = sqliteAdapter;
  console.log('SQLiteDB using SQLite adapter');
} catch (e) {
  console.error('Error loading SQLite adapter:', e);
  try {
    sqlite3 = require('sqlite3').verbose();
    console.log('SQLiteDB using direct sqlite3 module');
  } catch (sqliteErr) {
    console.error('SQLite3 module not available, SQLiteDB will operate in fallback mode');
  }
}

// Create events emitter for real-time data changes
class DatabaseEvents extends EventEmitter {}
const dbEvents = new DatabaseEvents();

// Database connection instance
let db = null;

// Get the path to the database file in the app's user data directory
function getDatabasePath() {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'pipe-inventory.db');
}

/**
 * Initialize the database connection
 * @returns {Object} Database connection instance
 */
function initializeDatabase() {
  try {
    console.log('Initializing database at:', getDatabasePath());
    
    db = new Database(getDatabasePath());
    
    console.log('Connected to SQLite database successfully');
    
    // Create tables if they don't exist
    createTables();
    
    // Run database migrations
    migrateDatabase();
    
    // Force a check and fix of customer statistics specifically
    module.exports.forceMigrations();
    
    // Initialize default settings if needed
      initializeDefaultSettings();
    
    return db;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

/**
 * Migrate database schema and data
 * @returns {boolean} Success
 */
function migrateDatabase() {
  const db = getDatabase();
  const hasMigrationRun = db.pragma('user_version');
  
  try {
    console.log('Starting database migration. Current version:', hasMigrationRun);
    
    // Check tables first
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='inventory'").get();
    if (!tableExists) {
      console.log('Inventory table does not exist, creating it...');
      createTables();
    }
    
    // Run in a transaction
    db.transaction(() => {
      // Version 1 migrations
      if (hasMigrationRun < 1) {
        console.log('Running migration to version 1...');
        
        // Ensure brand column exists if not already
        const brandColumnExists = db.prepare("PRAGMA table_info(inventory)").all()
          .some(col => col.name === 'brand');
        
        if (!brandColumnExists) {
          console.log('Adding brand column to inventory table');
          db.prepare('ALTER TABLE inventory ADD COLUMN brand TEXT DEFAULT ""').run();
        } else {
          console.log('brand column already exists');
        }
        
        // Ensure dimensions column exists if not already
        const dimensionsColumnExists = db.prepare("PRAGMA table_info(inventory)").all()
          .some(col => col.name === 'dimensions');
        
        if (!dimensionsColumnExists) {
          console.log('Adding dimensions column to inventory table');
          db.prepare('ALTER TABLE inventory ADD COLUMN dimensions TEXT DEFAULT ""').run();
        } else {
          console.log('dimensions column already exists');
        }
        
        // Ensure buying_price column exists if not already
        const buyingPriceColumnExists = db.prepare("PRAGMA table_info(inventory)").all()
          .some(col => col.name === 'buying_price');
        
        if (!buyingPriceColumnExists) {
          console.log('Adding buying_price column to inventory table');
          db.prepare('ALTER TABLE inventory ADD COLUMN buying_price REAL DEFAULT 0').run();
        } else {
          console.log('buying_price column already exists');
        }
        
        // Copy cost_price to buying_price if buying_price is empty
        db.prepare(`
          UPDATE inventory 
          SET buying_price = cost_price 
          WHERE buying_price = 0 AND cost_price > 0
        `).run();
        
        // Extract brand and dimensions from additional_data if they're empty
        const items = db.prepare('SELECT id, additional_data FROM inventory WHERE brand = "" OR dimensions = ""').all();
        items.forEach(item => {
          if (item.additional_data) {
            try {
              const additionalData = JSON.parse(item.additional_data);
              
              // Update brand if empty and exists in additional_data
              if (additionalData.brand) {
                db.prepare('UPDATE inventory SET brand = ? WHERE id = ?').run(additionalData.brand, item.id);
              }
              
              // Update dimensions if empty and exists in additional_data
              if (additionalData.dimensions || additionalData.dimension) {
                const dimensionValue = additionalData.dimensions || additionalData.dimension;
                db.prepare('UPDATE inventory SET dimensions = ? WHERE id = ?').run(dimensionValue, item.id);
              }
            } catch (e) {
              console.error('Error parsing additional_data for item:', item.id, e);
            }
          }
        });
        
        // Ensure type column exists if not already
        const typeColumnExists = db.prepare("PRAGMA table_info(inventory)").all()
          .some(col => col.name === 'type');
        
        if (!typeColumnExists) {
          console.log('Adding type column to inventory table');
          db.prepare('ALTER TABLE inventory ADD COLUMN type TEXT DEFAULT ""').run();
        } else {
          console.log('type column already exists');
        }
      }
      
      // Version 2 migrations (future migrations can be added here)
      if (hasMigrationRun < 2) {
        console.log('Running migration to version 2...');
        // Future migrations can be added here
      }
      
      // Check if customer_id column exists in sales table
      const salesColumns = db.prepare('PRAGMA table_info(sales)').all();
      const hasCustomerId = salesColumns.some(col => col.name === 'customer_id');
      
      if (!hasCustomerId) {
        console.log('Adding customer_id column to sales table');
        db.prepare('ALTER TABLE sales ADD COLUMN customer_id TEXT').run();
      }
      
      // Check if payment_method column exists in sales table
      const hasPaymentMethod = salesColumns.some(col => col.name === 'payment_method');
      
      if (!hasPaymentMethod) {
        console.log('Adding payment_method column to sales table');
        db.prepare('ALTER TABLE sales ADD COLUMN payment_method TEXT').run();
      }
      
      // VERSION 3: Check and fix customer purchase statistics columns
      if (hasMigrationRun < 3) {
        console.log('Running migration to version 3 - Customer Purchase Statistics');
        const customerColumns = db.prepare('PRAGMA table_info(customers)').all();
        console.log('Customer table columns:', customerColumns);
        
        // Check if totalPurchases and purchaseCount columns exist and have proper types
        const hasTotalPurchases = customerColumns.some(col => col.name === 'totalPurchases');
        const hasPurchaseCount = customerColumns.some(col => col.name === 'purchaseCount');
        const hasLastPurchaseDate = customerColumns.some(col => col.name === 'lastPurchaseDate');
        
        if (!hasTotalPurchases) {
          console.log('Adding totalPurchases column to customers table');
          db.prepare('ALTER TABLE customers ADD COLUMN totalPurchases REAL DEFAULT 0').run();
        }
        
        if (!hasPurchaseCount) {
          console.log('Adding purchaseCount column to customers table');
          db.prepare('ALTER TABLE customers ADD COLUMN purchaseCount INTEGER DEFAULT 0').run();
        }
        
        if (!hasLastPurchaseDate) {
          console.log('Adding lastPurchaseDate column to customers table');
          db.prepare('ALTER TABLE customers ADD COLUMN lastPurchaseDate TEXT').run();
        }
        
        // Fix existing customers with missing or invalid purchase stats
        console.log('Checking and fixing customer purchase statistics');
        const customersWithInvalidStats = db.prepare(`
          SELECT id, totalPurchases, purchaseCount, lastPurchaseDate
          FROM customers 
          WHERE totalPurchases IS NULL OR purchaseCount IS NULL OR 
                totalPurchases = '' OR purchaseCount = '' OR
                totalPurchases < 0 OR purchaseCount < 0
        `).all();
        
        if (customersWithInvalidStats.length > 0) {
          console.log(`Found ${customersWithInvalidStats.length} customers with invalid purchase statistics, fixing...`);
          
  db.prepare(`
            UPDATE customers
            SET 
              totalPurchases = COALESCE(totalPurchases, 0),
              purchaseCount = COALESCE(purchaseCount, 0)
            WHERE totalPurchases IS NULL OR purchaseCount IS NULL OR 
                  totalPurchases = '' OR purchaseCount = '' OR
                  totalPurchases < 0 OR purchaseCount < 0
  `).run();
        }
        
        // Recalculate purchase statistics for all customers based on sales data
        console.log('Recalculating purchase statistics for all customers from sales data');
        
        const customers = db.prepare('SELECT id, name FROM customers').all();
        let customersUpdated = 0;
        
        customers.forEach(customer => {
          try {
            // Get all sales for this customer
            const sales = db.prepare(`
              SELECT id, total_amount, created_at 
              FROM sales
              WHERE customer_id = ? OR customer_name = ?
              ORDER BY created_at DESC
            `).all(customer.id, customer.name);
            
            if (sales.length > 0) {
              // Calculate statistics
              let totalPurchases = 0;
              let lastPurchaseDate = null;
              
              sales.forEach(sale => {
                const saleAmount = parseFloat(sale.total_amount) || 0;
                totalPurchases += saleAmount;
                
                // Keep track of most recent purchase
                if (!lastPurchaseDate || new Date(sale.created_at) > new Date(lastPurchaseDate)) {
                  lastPurchaseDate = sale.created_at;
                }
              });
              
              // Update customer record with calculated stats
  db.prepare(`
                UPDATE customers
                SET 
                  totalPurchases = ?,
                  purchaseCount = ?,
                  lastPurchaseDate = ?
                WHERE id = ?
              `).run(
                totalPurchases,
                sales.length,
                lastPurchaseDate || null,
                customer.id
              );
              
              customersUpdated++;
            }
          } catch (error) {
            console.error(`Error recalculating stats for customer ${customer.id}:`, error);
          }
        });
        
        console.log(`Updated purchase statistics for ${customersUpdated} customers`);
      }
      
      // VERSION 4: Fix any customers with future dates and ensure correct data types
      if (hasMigrationRun < 4) {
        console.log('Running migration to version 4 - Fix dates and data types');
        
        // Fix any future dates in createdAt or lastPurchaseDate
        const now = new Date().toISOString();
        
  db.prepare(`
          UPDATE customers
          SET createdAt = ?
          WHERE createdAt > ? OR createdAt IS NULL OR createdAt = ''
        `).run(now, now);
        
        db.prepare(`
          UPDATE customers
          SET lastPurchaseDate = NULL
          WHERE lastPurchaseDate > ? OR lastPurchaseDate = ''
        `).run(now);
        
        // Convert string values to proper numeric types
        db.prepare(`
          UPDATE customers
          SET 
            totalPurchases = CAST(totalPurchases AS REAL),
            purchaseCount = CAST(purchaseCount AS INTEGER)
  `).run();
  
        // Set default values for any NULLs or invalid values
  db.prepare(`
          UPDATE customers
          SET 
            totalPurchases = 0
          WHERE totalPurchases IS NULL OR totalPurchases = '' OR 
                CAST(totalPurchases AS REAL) < 0 OR 
                CAST(totalPurchases AS REAL) IS NULL
  `).run();
  
  db.prepare(`
          UPDATE customers
          SET 
            purchaseCount = 0
          WHERE purchaseCount IS NULL OR purchaseCount = '' OR 
                CAST(purchaseCount AS INTEGER) < 0 OR 
                CAST(purchaseCount AS INTEGER) IS NULL
        `).run();
      }
      
      // Update user_version to latest migration version
      db.pragma('user_version = 4');
    })();
    
    console.log('Database migration completed successfully');
    return true;
  } catch (error) {
    console.error('Error migrating database:', error);
    throw error;
  }
}

/**
 * Create all required database tables
 */
function createTables() {
  console.log('Creating tables if needed...');
  const db = getDatabase();
  
  // Create customers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
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
      lastUpdated TEXT
    )
  `);
  
  // Create inventory table
  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT,
      description TEXT,
      price REAL NOT NULL,
      cost REAL,
      quantity INTEGER DEFAULT 0,
      unit TEXT,
      sku TEXT,
      minimum_stock INTEGER DEFAULT 0,
      supplier TEXT,
      location TEXT,
      image TEXT,
      createdAt TEXT,
      lastUpdated TEXT
    )
  `);
  
  // Create sales table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      customer_id TEXT,
      customer_name TEXT,
      items TEXT NOT NULL,
      total_amount REAL NOT NULL,
      payment_method TEXT,
      status TEXT DEFAULT 'completed',
      notes TEXT,
      receipt_number TEXT,
      created_by TEXT,
      createdAt TEXT,
      lastUpdated TEXT,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
    )
  `);
  
  // Create indexes for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
    CREATE INDEX IF NOT EXISTS idx_inventory_name ON inventory(name);
    CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
    CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
    CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
  `);
  
  console.log('Database tables and indexes created or verified');
}

/**
 * Initialize default application settings
 */
function initializeDefaultSettings() {
  const settings = {
    'company_name': 'Pipe Inventory Management',
    'alert_threshold': '10',
    'currency': 'TZS',
    'currency_symbol': 'TSh',
    'date_format': 'DD/MM/YYYY',
    'language': 'en',
    'next_invoice_number': '1000',
    'exchange_rates': JSON.stringify({
      USD: 2500,
      EUR: 2700,
      TZS: 1
    })
  };
  
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)');
  const now = new Date().toISOString();
  
  // Begin a transaction
  const transaction = db.transaction(() => {
    for (const [key, value] of Object.entries(settings)) {
      stmt.run(key, value, now);
    }
  });
  
  // Execute the transaction
  transaction();
  
  console.log('Default settings initialized');
}

/**
 * Get database connection instance
 * @returns {Object} Database connection instance
 */
function getDatabase() {
  if (!db) {
    return initializeDatabase();
  }
  return db;
}

/**
 * Close the database connection
 */
function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    console.log('Database connection closed');
  }
}

// ============================================
// INVENTORY MANAGEMENT
// ============================================

/**
 * Get all inventory items
 * @returns {Array} Array of inventory items
 */
function getAllItems() {
  try {
    const db = getDatabase();
    const items = db.prepare('SELECT * FROM inventory ORDER BY updated_at DESC').all();
    
    console.log(`Retrieved ${items.length} items from database`);
    
    return items.map(item => {
      // Parse additional_data if it exists
      let additionalData = {};
      if (item.additional_data) {
        try {
          additionalData = JSON.parse(item.additional_data);
        } catch (e) {
          console.error('Error parsing additional_data for item:', item.id);
          additionalData = {};
      }
      }
      
      // Ensure we get brand and buying_price from both standard columns and additional_data
      const brand = item.brand || additionalData.brand || '';
      const buyingPrice = item.buying_price || additionalData.buying_price || item.cost_price || 0;
      const dimensions = item.dimensions || additionalData.dimensions || additionalData.dimension || item.diameter || '';
      
      // Map database fields to frontend format
      return {
        id: item.id,
        type: item.type,
        description: item.description,
        quantity: item.quantity,
        price: item.selling_price,
        cost: item.cost_price,
        color: item.color,
        diameter: item.diameter,
        brand: brand,
        dimensions: dimensions,
        dimension: dimensions,
        buyingPrice: buyingPrice,
        buying_price: buyingPrice,
        alertThreshold: item.alert_threshold,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        category: additionalData.category || '',
        unit: additionalData.unit || '',
        sku: additionalData.sku || '',
        notes: additionalData.notes || '',
        additional_data: additionalData
      };
    });
  } catch (error) {
    console.error('Error getting inventory items:', error);
    throw error;
  }
}

/**
 * Get a single inventory item by ID
 * @param {string} itemId - ID of the item to find
 * @returns {Object|null} The item or null if not found
 */
function getItemById(itemId) {
  try {
    const db = getDatabase();
    const item = db.prepare('SELECT * FROM inventory WHERE id = ?').get(itemId);
    
    if (!item) {
      return null;
    }
    
    // Parse additional_data if it exists
    let additionalData = {};
    if (item.additional_data) {
      try {
        additionalData = JSON.parse(item.additional_data);
      } catch (e) {
        console.error('Error parsing additional_data for item:', itemId);
      }
    }
    
    // Ensure we get brand and buying_price from both standard columns and additional_data
    const brand = item.brand || additionalData.brand || '';
    const buyingPrice = item.buying_price || additionalData.buying_price || item.cost_price || 0;
    const dimensions = item.dimensions || additionalData.dimensions || additionalData.dimension || item.diameter || '';
    
    // Map database fields to frontend format
    return {
      id: item.id,
      type: item.type,
      description: item.description,
      quantity: item.quantity,
      price: item.selling_price,
      cost: item.cost_price,
      color: item.color,
      diameter: item.diameter,
      brand: brand,
      dimensions: dimensions,
      dimension: dimensions,
      buyingPrice: buyingPrice,
      buying_price: buyingPrice,
      alertThreshold: item.alert_threshold,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      category: additionalData.category || '',
      unit: additionalData.unit || '',
      sku: additionalData.sku || '',
      notes: additionalData.notes || '',
      additional_data: additionalData
    };
  } catch (error) {
    console.error('Error getting inventory item by ID:', error);
    throw error;
  }
}

/**
 * Add a new inventory item
 * @param {Object} item - Item data
 * @returns {Object} The added item with ID
 */
function addItem(item) {
  try {
    const db = getDatabase();
    const now = new Date().toISOString();
    
    // Log the input item for debugging
    console.log('Adding new item with data:', JSON.stringify(item, null, 2));
    
    // Generate a unique ID if not provided
    const newItem = {
      id: item.id || Date.now().toString(),
      type: item.type || '',
      description: item.description || '',
      quantity: item.quantity || 0,
      cost_price: item.cost_price || item.buyingPrice || item.buying_price || 0,
      selling_price: item.selling_price || item.price || 0,
      color: item.color || '',
      diameter: item.diameter || '',
      brand: item.brand || '',
      dimensions: item.dimensions || item.dimension || '',
      buying_price: item.buying_price || item.buyingPrice || item.cost_price || 0,
      alert_threshold: item.alert_threshold || item.alertThreshold || 10,
      created_at: now,
      updated_at: now,
      additional_data: JSON.stringify({
        ...item.additional_data || {},
        category: item.category || '',
        unit: item.unit || '',
        sku: item.sku || '',
        notes: item.notes || '',
        brand: item.brand || '', // Also include brand in additional_data
        buying_price: item.buying_price || item.buyingPrice || item.cost_price || 0 // Also include buying_price in additional_data
      })
    };
    
    // Log the prepared item for debugging
    console.log('Prepared item for insertion:', JSON.stringify(newItem, null, 2));
    
    const stmt = db.prepare(`
      INSERT INTO inventory (
        id, type, description, quantity, cost_price, selling_price, 
        color, diameter, brand, dimensions, buying_price, alert_threshold, created_at, updated_at, additional_data
      ) VALUES (
        @id, @type, @description, @quantity, @cost_price, @selling_price, 
        @color, @diameter, @brand, @dimensions, @buying_price, @alert_threshold, @created_at, @updated_at, @additional_data
      )
    `);
    
    const result = stmt.run(newItem);
    
    if (result.changes === 1) {
      // Emit event for real-time updates
      dbEvents.emit('inventory-created', { 
        ...newItem, 
        additional_data: JSON.parse(newItem.additional_data)
      });
      
      return { 
        ...newItem, 
        additional_data: JSON.parse(newItem.additional_data)
      };
    } else {
      throw new Error('Failed to add inventory item');
    }
  } catch (error) {
    console.error('Error adding inventory item:', error);
    throw error;
  }
}

/**
 * Update an existing inventory item
 * @param {string} itemId - ID of the item to update
 * @param {Object} updates - Fields to update
 * @returns {Object|null} Updated item or null if not found
 */
function updateItem(itemId, updates) {
  try {
    const db = getDatabase();
    const item = getItemById(itemId);
    
    if (!item) {
      return null;
    }
    
    const now = new Date().toISOString();
    
    // Prepare data for update
    let updateData = { ...updates, updated_at: now };
    
    // Debug logging - what fields are we updating?
    console.log('Updating item with fields:', Object.keys(updateData));
    console.log('Updates include brand?', updates.brand !== undefined);
    console.log('Updates include buying_price?', updates.buying_price !== undefined || updates.buyingPrice !== undefined);
    
    // Make sure brand is included in updateData
    if (updates.brand !== undefined) {
      updateData.brand = updates.brand;
      console.log('Setting brand field to:', updates.brand);
    }
    
    // Make sure dimensions is included in updateData
    if (updates.dimensions !== undefined || updates.dimension !== undefined) {
      updateData.dimensions = updates.dimensions || updates.dimension || '';
      console.log('Setting dimensions field to:', updateData.dimensions);
    }
    
    // Make sure buying_price is included in updateData
    if (updates.buying_price !== undefined || updates.buyingPrice !== undefined) {
      updateData.buying_price = updates.buying_price || updates.buyingPrice || 0;
      updateData.cost_price = updateData.buying_price; // Keep these in sync
      console.log('Setting buying_price field to:', updateData.buying_price);
    }
    
    // Make sure selling_price is included in updateData
    if (updates.selling_price !== undefined || updates.price !== undefined) {
      updateData.selling_price = updates.selling_price || updates.price || 0;
      console.log('Setting selling_price field to:', updateData.selling_price);
    }
    
    // Make sure type is included in updateData
    if (updates.type !== undefined) {
      updateData.type = updates.type;
      console.log('Setting type field to:', updates.type);
    }
    
    // Handle additional_data specially - merge with existing if present
    if (updates.additional_data || updates.category || updates.unit || updates.sku || updates.notes || updates.brand) {
      const currentAdditionalData = item.additional_data || {};
      updateData.additional_data = JSON.stringify({
        ...currentAdditionalData,
        ...(updates.additional_data || {}),
        category: updates.category || currentAdditionalData.category || '',
        unit: updates.unit || currentAdditionalData.unit || '',
        sku: updates.sku || currentAdditionalData.sku || '',
        notes: updates.notes || currentAdditionalData.notes || '',
        brand: updates.brand || currentAdditionalData.brand || '', // Also store brand in additional_data for backward compatibility
        buying_price: updates.buying_price || updates.buyingPrice || currentAdditionalData.buying_price || 0 // Also store buying_price in additional_data for backward compatibility
      });
    }
    
    // Convert alertThreshold to alert_threshold for database consistency
    if (updates.alertThreshold !== undefined) {
      updateData.alert_threshold = updates.alertThreshold;
    }
    
    // Build update SQL query dynamically based on available fields
    const updateFields = Object.keys(updateData)
      .filter(key => key !== 'id' && key !== 'created_at') // Don't update these fields
      .map(key => `${key} = @${key}`)
      .join(', ');
    
    // Build the SQL statement
    const sql = `UPDATE inventory SET ${updateFields} WHERE id = @id`;
    
    // Add ID to updateData for WHERE clause
    updateData.id = itemId;
    
    // Execute the update
    const stmt = db.prepare(sql);
    const result = stmt.run(updateData);
    
    if (result.changes === 1) {
      // Get the updated item
      const updatedItem = getItemById(itemId);
      
      // Emit event for real-time updates
      dbEvents.emit('inventory-updated', updatedItem);
      
      return updatedItem;
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Error updating item with ID ${itemId}:`, error);
    throw error;
  }
}

/**
 * Delete an inventory item
 * @param {string} itemId - ID of the item to delete
 * @returns {boolean} Success status
 */
function deleteItem(itemId) {
  try {
    const db = getDatabase();
    const item = getItemById(itemId);
    
    if (!item) {
      return false;
    }
    
    const result = db.prepare('DELETE FROM inventory WHERE id = ?').run(itemId);
    
    if (result.changes === 1) {
      // Emit event for real-time updates
      dbEvents.emit('inventory-deleted', { id: itemId });
      
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error(`Error deleting item with ID ${itemId}:`, error);
    throw error;
  }
}

/**
 * Get items with quantity below their alert threshold
 * @returns {Array} Array of items below threshold
 */
function getLowStockItems() {
  try {
    const db = getDatabase();
    const items = db.prepare('SELECT * FROM inventory WHERE quantity <= alert_threshold').all();
    
    return items.map(item => {
      if (item.additional_data) {
        try {
          item.additional_data = JSON.parse(item.additional_data);
        } catch (e) {
          console.error('Error parsing additional_data for item:', item.id);
        }
      }
      return item;
    });
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    throw error;
  }
}

/**
 * Search inventory items by various criteria
 * @param {Object} criteria - Search criteria
 * @returns {Array} Matching items
 */
function searchItems(criteria) {
  try {
    const db = getDatabase();
    
    let query = 'SELECT * FROM inventory WHERE 1=1';
    const params = {};
    
    if (criteria.type) {
      query += ' AND type LIKE @type';
      params.type = `%${criteria.type}%`;
    }
    
    if (criteria.color) {
      query += ' AND color LIKE @color';
      params.color = `%${criteria.color}%`;
    }
    
    if (criteria.diameter) {
      query += ' AND diameter = @diameter';
      params.diameter = criteria.diameter;
    }
    
    if (criteria.query) {
      query += ` AND (
        description LIKE @query OR 
        type LIKE @query OR 
        id LIKE @query
      )`;
      params.query = `%${criteria.query}%`;
    }
    
    const items = db.prepare(query).all(params);
    
    return items.map(item => {
      if (item.additional_data) {
        try {
          item.additional_data = JSON.parse(item.additional_data);
        } catch (e) {
          console.error('Error parsing additional_data for item:', item.id);
        }
      }
      return item;
    });
  } catch (error) {
    console.error('Error searching inventory items:', error);
    throw error;
  }
}

// ============================================
// SALES MANAGEMENT
// ============================================

/**
 * Get all sales records
 * @returns {Array} All sales with their items
 */
function getAllSales() {
  try {
    const db = getDatabase();
    const sales = db.prepare('SELECT * FROM sales ORDER BY created_at DESC').all();
    
    // Get items for each sale
    return sales.map(sale => {
      const items = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(sale.id);
      return { ...sale, items };
    });
  } catch (error) {
    console.error('Error fetching sales records:', error);
    throw error;
  }
}

/**
 * Get a single sale by ID
 * @param {string} saleId - ID of the sale to find
 * @returns {Object|null} The sale or null if not found
 */
function getSaleById(saleId) {
  try {
    const db = getDatabase();
    const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(saleId);
    
    if (!sale) {
      return null;
    }
    
    // Get items for this sale
    const items = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(saleId);
    
    // Parse additional_data if it exists
    if (sale.additional_data) {
      try {
        sale.additional_data = JSON.parse(sale.additional_data);
      } catch (e) {
        console.error('Error parsing additional_data for sale:', saleId);
        sale.additional_data = {};
      }
    } else {
      sale.additional_data = {};
    }
    
    return { ...sale, items };
  } catch (error) {
    console.error(`Error fetching sale with ID ${saleId}:`, error);
    throw error;
  }
}

module.exports = {
  initializeDatabase,
  closeDatabase,
  getDatabase,
  getAllItems,
  getItemById,
  addItem,
  updateItem,
  deleteItem,
  getLowStockItems,
  searchItems,
  getAllSales,
  getSaleById,
  addSale: function(sale) {
    try {
      console.log('Adding new sale:', JSON.stringify(sale, null, 2));
      const db = getDatabase();
      
      // Ensure IDs
      if (!sale.id) {
        sale.id = `sale-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      }
      
      // Convert field names to match database schema
      const now = new Date().toISOString();
      
      // Extract customer data
      const customerName = sale.customer_name || sale.customerName || 
        (sale.buyer ? sale.buyer.name : '') || '';
      
      const customerId = sale.customer_id || sale.customerId || 
        (sale.buyer ? sale.buyer.id : null);
      
      const customerContact = sale.customer_contact || 
        (sale.buyer ? (sale.buyer.phone || sale.buyer.email) : null);
      
      // Extract sale date
      const saleDate = sale.date || sale.createdAt || now;
      
      // Format the items as JSON if they're an array
      let itemsJson = sale.items;
      if (Array.isArray(sale.items)) {
        itemsJson = JSON.stringify(sale.items);
      }
      
      // Insert into sales table
      const insertSaleStmt = db.prepare(`
        INSERT INTO sales (
          id, 
          date, 
          customer_id, 
          customer_name, 
          items, 
          total_amount, 
          payment_method, 
          status, 
          notes, 
          receipt_number, 
          created_by, 
          createdAt, 
          lastUpdated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      insertSaleStmt.run(
        sale.id,
        saleDate,
        customerId,
        customerName,
        itemsJson,
        sale.totalAmount || sale.total_amount || 0,
        sale.paymentMethod || sale.payment_method || 'cash',
        sale.status || 'completed',
        sale.notes || '',
        sale.invoiceNumber || sale.invoice_number || sale.receipt_number || '',
        sale.createdBy || sale.created_by || '',
        now,
        now
      );
      
      console.log(`Sale with ID ${sale.id} added successfully`);
      
      // For backward compatibility with older schema, also insert into sale_items table if it exists
      try {
        if (Array.isArray(sale.items) && sale.items.length > 0) {
          // Check if sale_items table exists
          const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='sale_items'").get();
          
          if (tableExists) {
            // Insert each item
            const insertItemStmt = db.prepare(`
              INSERT INTO sale_items (
                id, 
                sale_id, 
                product_id, 
                product_name, 
                quantity, 
                unit_price, 
                total_price
              ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `);
            
            sale.items.forEach(item => {
              const itemId = item.id || `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
              
              insertItemStmt.run(
                itemId,
                sale.id,
                item.productId || item.product_id || '',
                item.productName || item.product_name || '',
                item.quantity || 0,
                item.unitPrice || item.unit_price || 0,
                item.totalPrice || item.total_price || 0
              );
            });
            
            console.log(`Added ${sale.items.length} items to sale_items table`);
          }
        }
      } catch (itemsError) {
        console.warn('Error inserting sale items:', itemsError.message);
        // Continue despite error, as we already have items in the main sales record
      }
      
      // Update customer purchase statistics
      if (customerId) {
        try {
          // Get the total amount from the sale
          const totalAmount = parseFloat(sale.totalAmount || sale.total_amount || 0);
          
          // Call method to update customer purchase statistics
          const updatedStats = this.updateCustomerPurchaseStats(customerId, totalAmount, saleDate);
          
          if (updatedStats) {
            console.log(`Updated purchase stats for customer ${customerId}:`, updatedStats);
            
            // Emit event for real-time updates to UI
            if (dbEvents && typeof dbEvents.emit === 'function') {
              dbEvents.emit('customer-stats-updated', {
                customerId: customerId,
                purchaseAmount: totalAmount,
                totalPurchases: updatedStats.totalPurchases,
                purchaseCount: updatedStats.purchaseCount,
                lastPurchaseDate: updatedStats.lastPurchaseDate
              });
            }
          }
        } catch (statsError) {
          console.warn(`Error updating customer purchase statistics: ${statsError.message}`);
          // Continue despite error, as the sale was successfully added
        }
      }
      
      return { success: true, id: sale.id };
    } catch (error) {
      console.error('Error adding sale:', error.message);
      throw error;
    }
  },
  
  updateSale: function(saleId, updates) {
    try {
      console.log(`Updating sale with ID: ${saleId}`);
      const db = getDatabase();
      
      // Update the sale in the database
      const result = db.prepare(`
        UPDATE sales 
        SET 
          status = COALESCE(?, status),
          payment_method = COALESCE(?, payment_method),
          notes = COALESCE(?, notes),
          lastUpdated = ?
        WHERE id = ?
      `).run(
        updates.status || null,
        updates.paymentMethod || updates.payment_method || null,
        updates.notes || null,
        new Date().toISOString(),
        saleId
      );
      
      if (result.changes === 0) {
        throw new Error(`Sale with ID ${saleId} not found`);
      }
      
      return { success: true, id: saleId };
    } catch (error) {
      console.error(`Error updating sale ${saleId}:`, error);
      throw error;
    }
  },
  
  deleteSale: function(saleId) {
    try {
      console.log(`Deleting sale with ID: ${saleId}`);
      const db = getDatabase();
      
      // Delete from sales table
      const result = db.prepare('DELETE FROM sales WHERE id = ?').run(saleId);
      
      if (result.changes === 0) {
        throw new Error(`Sale with ID ${saleId} not found`);
      }
      
      // Try to delete from sale_items if the table exists
      try {
        db.prepare('DELETE FROM sale_items WHERE sale_id = ?').run(saleId);
      } catch (error) {
        // It's okay if this fails - table might not exist
        console.warn(`Could not delete from sale_items: ${error.message}`);
      }
      
      return { success: true, id: saleId };
    } catch (error) {
      console.error(`Error deleting sale ${saleId}:`, error);
      throw error;
    }
  },
  
  getSalesByDate: function(date) {
    try {
      console.log(`Getting sales for date: ${date}`);
      const formattedDate = new Date(date).toISOString().split('T')[0] + '%';
      
      const sales = getDatabase().prepare(
        'SELECT * FROM sales WHERE date LIKE ? ORDER BY date DESC'
      ).all(formattedDate);
      
      return sales;
    } catch (error) {
      console.error(`Error getting sales for date ${date}:`, error);
      throw error;
    }
  },
  
  getSalesBetweenDates: function(startDate, endDate) {
    try {
      console.log(`Getting sales between dates: ${startDate} and ${endDate}`);
      
      const sales = getDatabase().prepare(`
        SELECT * FROM sales 
        WHERE date >= ? AND date <= ?
        ORDER BY date DESC
      `).all(startDate, endDate);
      
      return sales;
    } catch (error) {
      console.error(`Error getting sales between dates:`, error);
      throw error;
    }
  },
  
  getSaleItems: function(saleId) {
    try {
      console.log(`Getting items for sale with ID: ${saleId}`);
      const db = getDatabase();
      
      // First try to get from sale_items table if it exists
      try {
        const items = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(saleId);
        if (items.length > 0) {
          return items;
        }
      } catch (error) {
        // Table might not exist, continue to alternate method
        console.warn(`Could not get items from sale_items table: ${error.message}`);
      }
      
      // Try to get from sales.items JSON field instead
      const sale = db.prepare('SELECT items FROM sales WHERE id = ?').get(saleId);
      if (sale && sale.items) {
        try {
          if (typeof sale.items === 'string') {
            return JSON.parse(sale.items);
          }
          return sale.items;
        } catch (error) {
          console.error(`Error parsing items JSON for sale ${saleId}:`, error);
          return [];
        }
      }
      
      return [];
    } catch (error) {
      console.error(`Error getting items for sale ${saleId}:`, error);
      throw error;
    }
  },
  
  getSalesReport: function(startDate, endDate) {
    try {
      console.log(`Generating sales report from ${startDate} to ${endDate}`);
      const db = getDatabase();
      
      const sales = db.prepare(`
        SELECT 
          COUNT(*) as totalSales,
          SUM(total_amount) as totalRevenue,
          MIN(date) as firstSaleDate,
          MAX(date) as lastSaleDate
        FROM sales
        WHERE date >= ? AND date <= ?
      `).get(startDate, endDate);
      
      // Get sales by day
      const dailySales = db.prepare(`
        SELECT
          DATE(date) as day,
          COUNT(*) as count,
          SUM(total_amount) as revenue
        FROM sales
        WHERE date >= ? AND date <= ?
        GROUP BY day
        ORDER BY day
      `).all(startDate, endDate);
      
      return {
        summary: sales,
        dailySales
      };
    } catch (error) {
      console.error(`Error generating sales report:`, error);
      throw error;
    }
  },
  
  getCustomers: function() {
    try {
      console.log('Getting all customers');
      const customers = getDatabase().prepare('SELECT * FROM customers ORDER BY name').all();
      console.log(`Retrieved ${customers.length} customers`);
      return customers;
    } catch (error) {
      console.error('Error getting customers:', error);
      throw error;
    }
  },
  
  getCustomerById: function(customerId) {
    try {
      console.log(`Getting customer with ID: ${customerId}`);
      const db = getDatabase();
      
      // Get basic customer information
      const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
      
      if (customer) {
        // Debug purchase statistics fields
        console.log(`Customer purchase stats for ${customerId}:`, {
          totalPurchases: customer.totalPurchases,
          purchaseCount: customer.purchaseCount,
          lastPurchaseDate: customer.lastPurchaseDate
        });
        
        // Ensure purchase statistics fields are properly typed
        customer.totalPurchases = parseFloat(customer.totalPurchases) || 0;
        customer.purchaseCount = parseInt(customer.purchaseCount) || 0;
        
        // Convert dates to JavaScript Date objects where applicable
        if (customer.lastPurchaseDate) {
          try {
            // Check if it's a valid date
            const purchaseDate = new Date(customer.lastPurchaseDate);
            if (isNaN(purchaseDate.getTime()) || purchaseDate > new Date()) {
              console.warn(`Invalid lastPurchaseDate for customer ${customerId}: ${customer.lastPurchaseDate}`);
              customer.lastPurchaseDate = null;
            }
          } catch (error) {
            console.warn(`Error parsing lastPurchaseDate for customer ${customerId}: ${error.message}`);
            customer.lastPurchaseDate = null;
          }
        }
        
        if (customer.createdAt) {
          try {
            // Check if it's a valid date
            const createdDate = new Date(customer.createdAt);
            if (isNaN(createdDate.getTime()) || createdDate > new Date()) {
              console.warn(`Invalid createdAt for customer ${customerId}: ${customer.createdAt}`);
              // Set to a reasonable default if invalid (yesterday)
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              customer.createdAt = yesterday.toISOString();
            }
          } catch (error) {
            console.warn(`Error parsing createdAt for customer ${customerId}: ${error.message}`);
            // Set to a reasonable default if invalid (yesterday)
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            customer.createdAt = yesterday.toISOString();
          }
        } else {
          // If no createdAt date, set to a reasonable default (yesterday)
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          customer.createdAt = yesterday.toISOString();
        }
        
        // Get purchase history from sales table
        let purchaseHistory = [];
        try {
          const sales = db.prepare('SELECT * FROM sales WHERE customer_id = ? ORDER BY date DESC').all(customerId);
          
          // Process each sale
          purchaseHistory = sales.map(sale => {
            // Parse JSON items if stored as string
            let items = [];
            if (sale.items) {
              try {
                if (typeof sale.items === 'string') {
                  items = JSON.parse(sale.items);
                } else {
                  items = sale.items;
                }
              } catch (error) {
                console.warn(`Error parsing items for sale ${sale.id}: ${error.message}`);
              }
            }
            
            // Process sale items if we have item details in a separate table
            if (!items.length) {
              try {
                const saleItems = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(sale.id);
                items = saleItems.map(item => ({
                  productId: item.product_id,
                  productName: item.product_name,
                  quantity: item.quantity,
                  unitPrice: item.unit_price,
                  totalPrice: item.total_price
                }));
              } catch (error) {
                console.warn(`Error fetching sale_items for sale ${sale.id}: ${error.message}`);
              }
            }
            
            // Create sale object with consistent property names
            return {
              id: sale.id,
              date: sale.date || sale.created_at || sale.createdAt,
              invoiceNumber: sale.invoice_number || sale.receipt_number,
              customerId: sale.customer_id,
              customerName: sale.customer_name,
              items: items,
              totalAmount: parseFloat(sale.total_amount),
              paymentMethod: sale.payment_method,
              status: sale.status,
              notes: sale.notes
            };
          });
          
          // Add purchase history to customer object
          customer.purchaseHistory = purchaseHistory;
          
          // Calculate correct purchase statistics from actual sales data
          const shouldUpdateStats = (
            purchaseHistory.length > 0 && 
            (customer.purchaseCount === 0 || 
             customer.totalPurchases === 0 || 
             !customer.lastPurchaseDate ||
             purchaseHistory.length !== customer.purchaseCount)
          );
          
          if (shouldUpdateStats) {
            console.log(`Recalculating purchase statistics for customer ${customerId}`);
            
            // Calculate total purchases and count
            const totalPurchases = purchaseHistory.reduce((sum, purchase) => sum + purchase.totalAmount, 0);
            const purchaseCount = purchaseHistory.length;
            
            // Find the latest purchase date
            let lastPurchaseDate = null;
            if (purchaseHistory.length > 0) {
              // Sort by date descending to get the most recent
              const sortedPurchases = [...purchaseHistory].sort((a, b) => {
                return new Date(b.date) - new Date(a.date);
              });
              
              lastPurchaseDate = sortedPurchases[0].date;
            }
            
            // Update customer statistics in the database
            db.prepare(`
              UPDATE customers 
              SET totalPurchases = ?, 
                  purchaseCount = ?, 
                  lastPurchaseDate = ?,
                  lastUpdated = ?
              WHERE id = ?
            `).run(
              totalPurchases, 
              purchaseCount, 
              lastPurchaseDate, 
              new Date().toISOString(),
              customerId
            );
            
            // Update the customer object
            customer.totalPurchases = totalPurchases;
            customer.purchaseCount = purchaseCount;
            customer.lastPurchaseDate = lastPurchaseDate;
          }
        } catch (error) {
          console.error(`Error fetching purchase history for customer ${customerId}: ${error.message}`);
        }
        
      return customer;
      } else {
        console.warn(`Customer with ID ${customerId} not found`);
        return null;
      }
    } catch (error) {
      console.error(`Error in getCustomerById for ${customerId}: ${error.message}`);
      return null;
    }
  },
  
  addCustomer: function(customer) {
    try {
      const now = new Date();
      const isoDateString = now.toISOString(); // Ensure proper ISO format
      
      // Check for duplicate submissions in the last 5 seconds
      const recentCustomers = getDatabase()
        .prepare('SELECT * FROM customers WHERE name = ? AND phone = ? AND createdAt > datetime("now", "-5 seconds")')
        .all(customer.name, customer.phone || '');
      
      if (recentCustomers.length > 0) {
        console.warn('Detected potential duplicate customer submission');
        throw new Error('Duplicate submission detected - please try again in a few seconds');
      }
      
      // Generate ID if not provided
      if (!customer.id) {
        customer.id = `cust-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      }
      
      const stmt = getDatabase().prepare(`
        INSERT INTO customers (
          id, name, business, email, phone, address, tin, type, notes, 
          totalPurchases, purchaseCount, lastPurchaseDate, createdAt, updatedAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const info = stmt.run(
        customer.id,
        customer.name,
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
        isoDateString, // Use our validated date
        isoDateString  // Use our validated date
      );
      
      console.log(`Added new customer with ID: ${customer.id}`);
      
      // Emit event
      dbEvents.emit('customer-created', { 
        ...customer, 
        createdAt: isoDateString, 
        updatedAt: isoDateString 
      });
      
      return { 
        ...customer, 
        createdAt: isoDateString, 
        updatedAt: isoDateString 
      };
    } catch (error) {
      console.error('Error adding customer:', error);
      throw error;
    }
  },
  
  updateCustomer: function(customer) {
    try {
      console.log(`Updating customer with ID: ${customer.id}`);
      const now = new Date();
      const isoDateString = now.toISOString(); // Ensure proper ISO format
      
      // Prepare SQL statement
      const stmt = getDatabase().prepare(`
        UPDATE customers
        SET 
          name = ?,
          business = ?,
          email = ?,
          phone = ?,
          address = ?,
          tin = ?,
          type = ?,
          notes = ?,
          updatedAt = ?
        WHERE id = ?
      `);
      
      const info = stmt.run(
        customer.name,
        customer.business || '',
        customer.email || '',
        customer.phone || '',
        customer.address || '',
        customer.tin || '',
        customer.type || 'regular',
        customer.notes || '',
        isoDateString, // Use our validated date
        customer.id
      );
      
      if (info.changes === 0) {
        throw new Error(`Customer with ID ${customer.id} not found`);
      }
      
      console.log(`Updated customer with ID: ${customer.id}`);
      
      const updatedCustomer = { 
        ...customer, 
        updatedAt: isoDateString 
      };
      
      // Emit event
      dbEvents.emit('customer-updated', updatedCustomer);
      
      return updatedCustomer;
    } catch (error) {
      console.error(`Error updating customer with ID ${customer.id}:`, error);
      throw error;
    }
  },
  
  deleteCustomer: function(customerId) {
    try {
      console.log(`Deleting customer with ID: ${customerId}`);
      
      const stmt = getDatabase().prepare('DELETE FROM customers WHERE id = ?');
      const info = stmt.run(customerId);
      
      if (info.changes === 0) {
        throw new Error(`Customer with ID ${customerId} not found`);
      }
      
      console.log(`Deleted customer with ID: ${customerId}`);
      
      // Emit event
      dbEvents.emit('customer-deleted', customerId);
      
      return { success: true, id: customerId };
    } catch (error) {
      console.error(`Error deleting customer with ID ${customerId}:`, error);
      throw error;
    }
  },
  
  /**
   * Update customer purchase statistics based on a new sale
   * @param {string} customerId - Customer ID
   * @param {number} purchaseAmount - Total amount of the purchase
   * @param {string} purchaseDate - Purchase date in ISO format
   * @returns {object} Updated customer statistics
   */
  updateCustomerPurchaseStats: function(customerId, purchaseAmount, purchaseDate) {
    if (!customerId) {
      console.warn('Cannot update purchase stats: No customer ID provided');
      return null;
    }

    try {
      console.log(`Updating purchase statistics for customer ${customerId}`);
      const db = getDatabase();
      
      // Get current customer data
      const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
      
      if (!customer) {
        console.warn(`Cannot update purchase stats: Customer ${customerId} not found`);
        return null;
      }
      
      // Parse current values safely
      const currentTotal = parseFloat(customer.totalPurchases) || 0;
      const currentCount = parseInt(customer.purchaseCount) || 0;
      const currentLastPurchase = customer.lastPurchaseDate;
      
      // Calculate new values
      const newTotal = currentTotal + parseFloat(purchaseAmount);
      const newCount = currentCount + 1;
      
      // Determine if this is a newer purchase
      let newLastPurchase = currentLastPurchase;
      if (!currentLastPurchase || new Date(purchaseDate) > new Date(currentLastPurchase)) {
        newLastPurchase = purchaseDate;
      }
      
      // Update the customer record
      const updateResult = db.prepare(`
        UPDATE customers
        SET totalPurchases = ?, 
          purchaseCount = ?,
          lastPurchaseDate = ?,
            lastUpdated = ?
        WHERE id = ?
      `).run(
        newTotal, 
        newCount, 
        newLastPurchase, 
        new Date().toISOString(),
        customerId
      );
      
      if (updateResult.changes > 0) {
        console.log(`Updated purchase statistics for customer ${customerId}: Total=${newTotal}, Count=${newCount}, Last=${newLastPurchase}`);
        return {
          customerId,
          totalPurchases: newTotal,
          purchaseCount: newCount,
          lastPurchaseDate: newLastPurchase
        };
      } else {
        console.warn(`No changes made when updating purchase stats for customer ${customerId}`);
        return null;
      }
    } catch (error) {
      console.error(`Error updating purchase statistics for customer ${customerId}: ${error.message}`);
      return null;
    }
  },
  
  getReports: function() {
    // Implementation...
    return [];
  },
  
  /**
   * Force specific migrations to run regardless of version
   */
  forceMigrations: function() {
    try {
      console.log('Running forced migrations...');
      const db = getDatabase();
      
      // Fix customer purchase stats
      console.log('Forcing fix of customer purchase statistics');
      const customersWithInvalidStats = db.prepare(`
        SELECT id, totalPurchases, purchaseCount, lastPurchaseDate
        FROM customers 
        WHERE totalPurchases IS NULL OR purchaseCount IS NULL OR 
              totalPurchases = '' OR purchaseCount = '' OR
              totalPurchases < 0 OR purchaseCount < 0
      `).all();
      
      if (customersWithInvalidStats.length > 0) {
        console.log(`Found ${customersWithInvalidStats.length} customers with invalid purchase statistics, fixing...`);
        
        db.prepare(`
          UPDATE customers
          SET 
            totalPurchases = COALESCE(totalPurchases, 0),
            purchaseCount = COALESCE(purchaseCount, 0)
          WHERE totalPurchases IS NULL OR purchaseCount IS NULL OR 
                totalPurchases = '' OR purchaseCount = '' OR
                totalPurchases < 0 OR purchaseCount < 0
        `).run();
      }
      
      // Fix any future dates in createdAt or lastPurchaseDate
      const now = new Date().toISOString();
      
      db.prepare(`
        UPDATE customers 
        SET createdAt = ?
        WHERE createdAt > ? OR createdAt IS NULL OR createdAt = ''
      `).run(now, now);
      
      // Recalculate purchase statistics for customers with suspicious data
      console.log('Recalculating purchase statistics from sales data');
      
      const customers = db.prepare('SELECT id, name FROM customers').all();
      let customersUpdated = 0;
      
      // Process each customer
      for (const customer of customers) {
        try {
          const sales = db.prepare(`
            SELECT * FROM sales
            WHERE customer_id = ?
            ORDER BY date DESC
          `).all(customer.id);
          
          if (sales.length > 0) {
            // Calculate statistics
            const totalPurchases = sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0);
            const lastPurchaseDate = sales[0].date;
            
            // Update the customer record
            db.prepare(`
              UPDATE customers
              SET 
                totalPurchases = ?,
                purchaseCount = ?, 
                lastPurchaseDate = ?,
                lastUpdated = ?
        WHERE id = ?
            `).run(
              totalPurchases,
              sales.length,
              lastPurchaseDate || null,
              now,
              customer.id
            );
            
            customersUpdated++;
          }
    } catch (error) {
          console.error(`Error recalculating stats for customer ${customer.id}: ${error.message}`);
        }
      }
      
      console.log(`Updated purchase statistics for ${customersUpdated} customers`);
      return { success: true, customersUpdated };
      
    } catch (error) {
      console.error(`Error in forceMigrations: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
};

