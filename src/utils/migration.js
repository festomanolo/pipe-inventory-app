/**
 * Migrate data from electron-store to SQLite database
 * @param {Object} options - Migration options
 * @returns {Promise<Object>} Migration results
 */
async function migrateData(options = {}) {
  if (!SqliteDb) {
    throw new Error('SQLite database module not provided. Call init() first.');
  }
  
  // Default options
  const defaultOptions = {
    force: false,          // Force migration even if already completed
    validateOnly: false,   // Only validate, don't migrate
    skipBackup: false,     // Skip backup step
    batchSize: 100         // Number of items to insert in each batch
  };
  
  const opts = { ...defaultOptions, ...options };
  
  // Check if migration already completed
  const status = checkMigrationStatus();
  
  if (status.completed && !opts.force) {
    log.info('Migration already completed. Use force option to re-run.');
    return {
      success: false,
      migrated: false,
      reason: 'already_completed',
      message: 'Migration already completed. Use force option to re-run.',
      status
    };
  }
  
  // Initialize migration status
  const migrationStatus = {
    completed: false,
    startedAt: new Date().toISOString(),
    completedAt: null,
    version: SCHEMA_VERSION,
    error: null,
    steps: {
      backup: { completed: false, timestamp: null },
      extraction: { completed: false, timestamp: null },
      validation: { completed: false, timestamp: null },
      transformation: { completed: false, timestamp: null },
      migration: { completed: false, timestamp: null }
    },
    stats: {
      inventory: 0,
      sales: 0,
      saleItems: 0,
      reports: 0,
      settings: 0
    }
  };
  
  updateMigrationStatus(migrationStatus);
  migrationEvents.emit('migration-started', { status: migrationStatus });
  
  try {
    // Step 1: Backup electron-store
    if (!opts.skipBackup) {
      log.info('Creating backup of electron-store...');
      migrationEvents.emit('migration-progress', { 
        step: 'backup',
        message: 'Creating backup of electron-store...',
        progress: 10
      });
      
      const backup = backupElectronStore();
      if (!backup.success) {
        throw new Error(`Backup failed: ${backup.error}`);
      }
      
      migrationStatus.steps.backup = { 
        completed: true, 
        timestamp: new Date().toISOString(),
        path: backup.path
      };
      updateMigrationStatus(migrationStatus);
      
      migrationEvents.emit('migration-progress', { 
        step: 'backup',
        message: 'Backup completed successfully',
        progress: 20,
        details: backup
      });
    } else {
      log.info('Skipping backup step as requested');
      migrationStatus.steps.backup = { 
        completed: true, 
        timestamp: new Date().toISOString(),
        skipped: true
      };
    }
    
    // Step 2: Extract data from electron-store
    log.info('Extracting data from electron-store...');
    migrationEvents.emit('migration-progress', { 
      step: 'extraction',
      message: 'Extracting data from electron-store...',
      progress: 30
    });
    
    const store = new Store();
    const storeData = {
      inventory: store.get('inventory') || [],
      sales: store.get('sales') || [],
      reports: store.get('reports') || [],
      settings: store.get('settings') || {}
    };
    
    migrationStatus.steps.extraction = { 
      completed: true, 
      timestamp: new Date().toISOString(),
      counts: {
        inventory: storeData.inventory.length,
        sales: storeData.sales.length,
        reports: storeData.reports.length,
        settings: Object.keys(storeData.settings).length
      }
    };
    updateMigrationStatus(migrationStatus);
    
    migrationEvents.emit('migration-progress', { 
      step: 'extraction',
      message: 'Data extracted successfully',
      progress: 40,
      counts: migrationStatus.steps.extraction.counts
    });
    
    // Step 3: Validate data
    log.info('Validating data...');
    migrationEvents.emit('migration-progress', { 
      step: 'validation',
      message: 'Validating data...',
      progress: 50
    });
    
    const validationResults = validateData(storeData);
    
    if (!validationResults.isValid) {
      throw new Error(`Data validation failed: ${validationResults.errors.join(', ')}`);
    }
    
    if (validationResults.warnings.length > 0) {
      log.warn('Validation warnings:', validationResults.warnings);
      migrationEvents.emit('migration-warning', { 
        warnings: validationResults.warnings,
        stats: validationResults.stats
      });
    }
    
    migrationStatus.steps.validation = { 
      completed: true, 
      timestamp: new Date().toISOString(),
      stats: validationResults.stats,
      warnings: validationResults.warnings.length
    };
    updateMigrationStatus(migrationStatus);
    
    migrationEvents.emit('migration-progress', { 
      step: 'validation',
      message: 'Data validated successfully',
      progress: 60,
      warnings: validationResults.warnings.length,
      stats: validationResults.stats
    });
    
    // Step 4: Transform data to SQLite format
    log.info('Transforming data to SQLite format...');
    migrationEvents.emit('migration-progress', { 
      step: 'transformation',
      message: 'Transforming data...',
      progress: 70
    });
    
    const transformedData = transformData(storeData);
    
    migrationStatus.steps.transformation = { 
      completed: true, 
      timestamp: new Date().toISOString(),
      stats: transformedData.stats
    };
    updateMigrationStatus(migrationStatus);
    
    migrationEvents.emit('migration-progress', { 
      step: 'transformation',
      message: 'Data transformed successfully',
      progress: 80,
      stats: transformedData.stats
    });
    
    // If validateOnly option is set, stop here
    if (opts.validateOnly) {
      log.info('Validate-only mode, stopping before actual migration');
      return {
        success: true,
        migrated: false,
        validated: true,
        transformed: true,
        status: migrationStatus,
        validationResults,
        transformStats: transformedData.stats
      };
    }
    
    // Step 5: Migrate data to SQLite
    log.info('Migrating data to SQLite...');
    migrationEvents.emit('migration-progress', { 
      step: 'migration',
      message: 'Migrating data to SQLite...',
      progress: 85
    });
    
    // Initialize progress counters
    let totalItems = transformedData.stats.inventory + 
                     transformedData.stats.sales + 
                     transformedData.stats.saleItems + 
                     transformedData.stats.reports + 
                     transformedData.stats.settings;
    
    let migratedItems = 0;
    const batchSize = opts.batchSize;
    
    // Begin transaction for atomic migration
    SqliteDb.beginTransaction();
    
    try {
      // Migrate inventory items in batches
      for (let i = 0; i < transformedData.inventory.length; i += batchSize) {
        const batch = transformedData.inventory.slice(i, i + batchSize);
        
        for (const item of batch) {
          await SqliteDb.addItem(item);
          migratedItems++;
          
          // Report progress after every 10 items
          if (migratedItems % 10 === 0) {
            const progress = Math.min(85 + (migratedItems / totalItems) * 10, 95);
            migrationEvents.emit('migration-progress', { 
              step: 'migration',
              message: `Migrating inventory items (${migratedItems}/${totalItems})...`,
              progress,
              current: migratedItems,
              total: totalItems
            });
          }
        }
      }
      
      // Migrate sales in batches
      for (let i = 0; i < transformedData.sales.length; i += batchSize) {
        const batch = transformedData.sales.slice(i, i + batchSize);
        
        for (const sale of batch) {
          await SqliteDb.addSale(sale);
          migratedItems++;
        }
      }
      
      // Migrate sale items in batches
      for (let i = 0; i < transformedData.saleItems.length; i += batchSize) {
        const batch = transformedData.saleItems.slice(i, i + batchSize);
        
        for (const saleItem of batch) {
          await SqliteDb.addSaleItem(saleItem);
          migratedItems++;
        }
      }
      
      // Migrate reports in batches
      for (let i = 0; i < transformedData.reports.length; i += batchSize) {
        const batch = transformedData.reports.slice(i, i + batchSize);
        
        for (const report of batch) {
          await SqliteDb.addReport(report);
          migratedItems++;
        }
      }
      
      // Migrate settings
      for (const setting of transformedData.settings) {
        await SqliteDb.setSetting(setting.key, setting.value);
        migratedItems++;
      }
      
      // Commit transaction
      SqliteDb.commitTransaction();
      
      migrationStatus.steps.migration = { 
        completed: true, 
        timestamp: new Date().toISOString(),
        stats: {
          migrated: migratedItems,
          total: totalItems
        }
      };
      
      // Update final statistics
      migrationStatus.stats = transformedData.stats;
      migrationStatus.completed = true;
      migrationStatus.completedAt = new Date().toISOString();
      updateMigrationStatus(migrationStatus);
      
      log.info('Migration completed successfully:', migrationStatus);
      
      migrationEvents.emit('migration-progress', { 
        step: 'migration',
        message: 'Migration completed successfully',
        progress: 100,
        stats: transformedData.stats
      });
      
      migrationEvents.emit('migration-completed', { 
        status: migrationStatus,
        stats: transformedData.stats
      });
      
      return {
        success: true,
        migrated: true,
        status: migrationStatus,
        stats: transformedData.stats
      };
      
    } catch (migrationError) {
      log.error('Error during migration, rolling back transaction:', migrationError);
      
      // Rollback transaction
      SqliteDb.rollbackTransaction();
      
      throw migrationError; // Re-throw to be caught by outer try-catch
    }
    
  } catch (error) {
    // Handle any errors during the migration process
    log.error('Migration failed:', error);
    
    migrationStatus.error = error.message;
    migrationStatus.completedAt = new Date().toISOString();
    updateMigrationStatus(migrationStatus);
    
    migrationEvents.emit('migration-error', { 
      error: error.message,
      status: migrationStatus
    });
    
    return {
      success: false,
      migrated: false,
      error: error.message,
      status: migrationStatus
    };
  }
}

// Export the module
module.exports = {
  init,
  migrationEvents
};

/**
 * Migration Utility for Pipe Inventory App
 * Handles safe migration from electron-store to SQLite database
 */

const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const Store = require('electron-store');
const log = require('electron-log');
const EventEmitter = require('events');

// Import database modules
let SqliteDb;

// Migration event emitter
class MigrationEvents extends EventEmitter {}
const migrationEvents = new MigrationEvents();

// Constants
const MIGRATION_STATUS_FILE = 'migration-status.json';
const BACKUP_DIR = 'backups';
const SCHEMA_VERSION = '1.0.0';

/**
 * Initialize the migration utility
 * @param {Object} sqliteDb - SQLite database module
 * @returns {Object} Migration utility functions
 */
function init(sqliteDb) {
  SqliteDb = sqliteDb;
  
  // Create backup directory if it doesn't exist
  const userDataPath = app.getPath('userData');
  const backupPath = path.join(userDataPath, BACKUP_DIR);
  
  if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath, { recursive: true });
    log.info('Created backup directory at:', backupPath);
  }
  
  return {
    migrateData,
    checkMigrationStatus,
    resetMigrationStatus,
    getMigrationEvents: () => migrationEvents,
    validateData,
    backupElectronStore,
    restoreElectronStore
  };
}

/**
 * Check if migration has been completed
 * @returns {Object} Migration status
 */
function checkMigrationStatus() {
  try {
    const userDataPath = app.getPath('userData');
    const statusPath = path.join(userDataPath, MIGRATION_STATUS_FILE);
    
    if (fs.existsSync(statusPath)) {
      const statusData = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
      return statusData;
    }
    
    return {
      completed: false,
      startedAt: null,
      completedAt: null,
      version: null,
      error: null
    };
  } catch (error) {
    log.error('Error checking migration status:', error);
    return {
      completed: false,
      error: error.message
    };
  }
}

/**
 * Reset migration status to allow re-migration
 * @returns {boolean} Success status
 */
function resetMigrationStatus() {
  try {
    const userDataPath = app.getPath('userData');
    const statusPath = path.join(userDataPath, MIGRATION_STATUS_FILE);
    
    if (fs.existsSync(statusPath)) {
      fs.unlinkSync(statusPath);
      log.info('Migration status reset');
    }
    
    return true;
  } catch (error) {
    log.error('Error resetting migration status:', error);
    return false;
  }
}

/**
 * Update migration status
 * @param {Object} status - Migration status object
 * @returns {boolean} Success status
 */
function updateMigrationStatus(status) {
  try {
    const userDataPath = app.getPath('userData');
    const statusPath = path.join(userDataPath, MIGRATION_STATUS_FILE);
    
    fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
    log.info('Migration status updated:', status);
    
    return true;
  } catch (error) {
    log.error('Error updating migration status:', error);
    return false;
  }
}

/**
 * Backup electron-store data
 * @returns {Object} Backup information or error
 */
function backupElectronStore() {
  try {
    const store = new Store();
    const userDataPath = app.getPath('userData');
    
    // Get store file path
    const storePath = path.join(userDataPath, 'config.json');
    
    if (!fs.existsSync(storePath)) {
      return { 
        success: false, 
        error: 'Store file not found',
        path: storePath
      };
    }
    
    // Create backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `electron-store-backup-${timestamp}.json`;
    const backupPath = path.join(userDataPath, BACKUP_DIR, backupFile);
    
    // Copy file
    fs.copyFileSync(storePath, backupPath);
    
    // Verify backup
    if (!fs.existsSync(backupPath)) {
      return { 
        success: false, 
        error: 'Backup file not created',
        source: storePath,
        target: backupPath
      };
    }
    
    log.info(`Electron Store backed up to: ${backupPath}`);
    
    return {
      success: true,
      path: backupPath,
      timestamp,
      size: fs.statSync(backupPath).size
    };
  } catch (error) {
    log.error('Error backing up electron-store:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Restore electron-store from backup
 * @param {string} backupPath - Path to backup file
 * @returns {Object} Restore information or error
 */
function restoreElectronStore(backupPath) {
  try {
    const userDataPath = app.getPath('userData');
    const storePath = path.join(userDataPath, 'config.json');
    
    if (!fs.existsSync(backupPath)) {
      return { 
        success: false, 
        error: 'Backup file not found',
        path: backupPath
      };
    }
    
    // Create a backup of current config before restoring
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const currentBackupFile = `electron-store-pre-restore-${timestamp}.json`;
    const currentBackupPath = path.join(userDataPath, BACKUP_DIR, currentBackupFile);
    
    if (fs.existsSync(storePath)) {
      fs.copyFileSync(storePath, currentBackupPath);
      log.info(`Current config backed up to: ${currentBackupPath}`);
    }
    
    // Restore from backup
    fs.copyFileSync(backupPath, storePath);
    
    log.info(`Electron Store restored from: ${backupPath}`);
    
    return {
      success: true,
      path: storePath,
      previousConfigBackup: currentBackupPath
    };
  } catch (error) {
    log.error('Error restoring electron-store:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Validate data for migration
 * @param {Object} data - Data to validate
 * @returns {Object} Validation results
 */
function validateData(data) {
  const validationResults = {
    isValid: true,
    errors: [],
    warnings: [],
    stats: {
      inventory: 0,
      sales: 0,
      reports: 0,
      settings: 0,
      transformed: 0
    }
  };
  
  // Check if data exists
  if (!data) {
    validationResults.isValid = false;
    validationResults.errors.push('No data provided');
    return validationResults;
  }
  
  // Validate inventory data
  if (Array.isArray(data.inventory)) {
    validationResults.stats.inventory = data.inventory.length;
    
    // Validate each inventory item
    data.inventory.forEach((item, index) => {
      if (!item.id) {
        validationResults.warnings.push(`Inventory item at index ${index} has no ID`);
      }
      
      if (!item.description) {
        validationResults.warnings.push(`Inventory item ID ${item.id || index} has no description`);
      }
      
      // Check for required numeric fields
      if (typeof item.quantity !== 'number' && item.quantity !== null) {
        validationResults.warnings.push(`Inventory item ID ${item.id || index} has invalid quantity: ${item.quantity}`);
      }
      
      if (typeof item.sellingPrice !== 'number' && item.sellingPrice !== null && typeof item.price !== 'number') {
        validationResults.warnings.push(`Inventory item ID ${item.id || index} has invalid price: ${item.sellingPrice || item.price}`);
      }
    });
  } else {
    validationResults.warnings.push('Inventory data is not an array');
  }
  
  // Validate sales data
  if (Array.isArray(data.sales)) {
    validationResults.stats.sales = data.sales.length;
    
    // Validate each sale
    data.sales.forEach((sale, index) => {
      if (!sale.id) {
        validationResults.warnings.push(`Sale at index ${index} has no ID`);
      }
      
      if (!Array.isArray(sale.items)) {
        validationResults.warnings.push(`Sale ID ${sale.id || index} has no items array`);
      } else if (sale.items.length === 0) {
        validationResults.warnings.push(`Sale ID ${sale.id || index} has empty items array`);
      }
    });
  } else {
    validationResults.warnings.push('Sales data is not an array');
  }
  
  // Validate reports data
  if (Array.isArray(data.reports)) {
    validationResults.stats.reports = data.reports.length;
  } else {
    validationResults.warnings.push('Reports data is not an array');
  }
  
  // Validate settings data
  if (data.settings && typeof data.settings === 'object') {
    validationResults.stats.settings = 1;
  } else {
    validationResults.warnings.push('Settings data is not an object');
  }
  
  // Set overall validation status
  validationResults.isValid = validationResults.errors.length === 0;
  
  return validationResults;
}

/**
 * Transform electron-store data to SQLite format
 * @param {Object} storeData - Data from electron-store
 * @returns {Object} Transformed data ready for SQLite
 */
function transformData(storeData) {
  const transformed = {
    inventory: [],
    sales: [],
    saleItems: [],
    reports: [],
    settings: []
  };
  
  let transformCount = 0;
  
  // Transform inventory items
  if (Array.isArray(storeData.inventory)) {
    transformed.inventory = storeData.inventory.map(item => {
      transformCount++;
      
      // Map to SQLite schema
      return {
        id: item.id || Date.now().toString() + Math.random().toString(36).substr(2, 5),
        type: item.type || '',
        description: item.description || '',
        quantity: item.quantity || 0,
        cost_price: item.costPrice || item.cost_price || 0,
        selling_price: item.sellingPrice || item.selling_price || item.price || 0,
        color: item.color || '',
        diameter: item.dimension || item.diameter || '',
        alert_threshold: item.alertThreshold || item.alert_threshold || 10,
        created_at: item.createdAt || new Date().toISOString(),
        updated_at: item.updatedAt || new Date().toISOString(),
        additional_data: JSON.stringify({
          brand: item.brand || '',
          sku: item.sku || '',
          category: item.category || '',
          unit: item.unit || 'piece',
          notes: item.notes || '',
          // Add any other fields that don't map directly
          ...Object.fromEntries(
            Object.entries(item).filter(([key]) => 
              !['id', 'type', 'description', 'quantity', 'costPrice', 'cost_price',
                'sellingPrice', 'selling_price', 'price', 'color', 'dimension', 'diameter',
                'alertThreshold', 'alert_threshold', 'createdAt', 'updatedAt',
                'brand', 'sku', 'category', 'unit', 'notes'].includes(key)
            )
          )
        })
      };
    });
  }
  
  // Transform sales and sale items
  if (Array.isArray(storeData.sales)) {
    storeData.sales.forEach(sale => {
      transformCount++;
      
      // Map sale to SQLite schema
      const transformedSale = {
        id: sale.id || Date.now().toString() + Math.random().toString(36).substr(2, 5),
        invoice_number: sale.invoiceNumber || `INV-${Date.now()}`,
        customer_name: sale.customerName || sale.customer || '',
        customer_contact: sale.customerContact || sale.contact || '',
        total_amount: parseFloat(sale.totalAmount || 0),
        status: sale.status || 'completed',
        created_at: sale.createdAt || new Date().toISOString(),
        notes: sale.notes || '',
        additional_data: JSON.stringify({
          paymentMethod: sale.paymentMethod || 'cash',
          discount: sale.discount || 0,
          tax: sale.tax || 0,
          // Add any other fields that don't map directly
          ...Object.fromEntries(
            Object.entries(sale).filter(([key]) => 
              !['id', 'invoiceNumber', 'customerName', 'customer', 'customerContact', 'contact',
                'totalAmount', 'status', 'createdAt', 'notes', 'items',
                'paymentMethod', 'discount', 'tax'].includes(key)
            )
          )
        })
      };
      
      transformed.sales.push(transformedSale);
      
      // Transform sale items
      if (Array.isArray(sale.items)) {
        sale.items.forEach(item => {
          transformCount++;
          
          // Map sale item to SQLite schema
          const saleItem = {
            id: item.id || `${sale.id}_${item.itemId || Date.now()}`,
            sale_id: sale.id,
            item_id: item.itemId || item.id,
            quantity: item.quantity || 0,
            unit_price: item.unitPrice || item.price || 0,
            total_price: item.totalPrice || (item.quantity * item.unitPrice) || 0,
            type: item.type || '',
            description: item.description || ''
          };
          
          transformed.saleItems.push(saleItem);
        });
      }
    });
  }
  
// Transform reports
  if (Array.isArray(storeData.reports)) {
    transformed.reports = storeData.reports.map(report => {
      transformCount++;
      
      // Map report to SQLite schema
      return {
        id: report.id || Date.now().toString() + Math.random().toString(36).substr(2, 5),
        title: report.title || 'Report',
        description: report.description || '',
        type: report.type || 'general',
        parameters: JSON.stringify(report.parameters || {}),
        results: JSON.stringify(report.results || {}),
        created_at: report.createdAt || new Date().toISOString(),
        updated_at: report.updatedAt || new Date().toISOString()
      };
    });
  }
  
  // Transform settings
  if (storeData.settings && typeof storeData.settings === 'object') {
    // Convert settings object to array of key-value pairs for SQLite
    const now = new Date().toISOString();
    
    for (const [key, value] of Object.entries(storeData.settings)) {
      transformCount++;
      
      // Special handling for complex objects like exchangeRates
      const settingValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      
      transformed.settings.push({
        key,
        value: settingValue,
        updated_at: now
      });
    }
  }
  
  // Add statistics to the result
  transformed.stats = {
    inventory: transformed.inventory.length,
    sales: transformed.sales.length,
    saleItems: transformed.saleItems.length,
    reports: transformed.reports.length,
    settings: transformed.settings.length,
    transformed: transformCount
  };
  
  return transformed;
}

