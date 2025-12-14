/**
 * Database Synchronization Manager
 * Handles synchronization between local SQLite and Supabase cloud database
 */

const { createClient } = require('@supabase/supabase-js');
const log = require('electron-log');

class SyncManager {
  constructor(dbInstance = null) {
    // Configure logger
    log.transports.file.level = 'info';
    this.log = log;
    this.log.info('Initializing SyncManager');
    
    // Local database - can be passed in or created on demand
    this.db = dbInstance;
    
    // Last sync timestamps
    this.lastSyncTimestamps = {
      inventory: null,
      sales: null,
      customers: null,
      settings: null
    };
    
    // Sync status
    this.syncInProgress = false;
    this.syncQueue = [];
    this.offlineChanges = [];
    
    // Initialize Supabase client
    this.initSupabase();
  }
  
  /**
   * Initialize Supabase client with configuration
   */
  initSupabase() {
    try {
      // These would be loaded from secure environment variables or settings
      this.SUPABASE_URL = process.env.SUPABASE_URL;
      this.SUPABASE_KEY = process.env.SUPABASE_KEY;
      
      if (!this.SUPABASE_URL || !this.SUPABASE_KEY) {
        this.log.warn('Supabase credentials not found in environment. Using placeholder values for initialization.');
        // Placeholders for initialization - these won't work for actual API calls
        this.SUPABASE_URL = 'https://your-project-url.supabase.co';
        this.SUPABASE_KEY = 'your-anon-key';
      }
      
      // Create Supabase client
      this.supabase = createClient(this.SUPABASE_URL, this.SUPABASE_KEY);
      this.log.info('Supabase client initialized');
    } catch (error) {
      this.log.error('Error initializing Supabase client:', error);
    }
  }
  
  /**
   * Configure Supabase with actual credentials
   * @param {Object} config - Supabase configuration
   * @param {string} config.url - Supabase project URL
   * @param {string} config.key - Supabase API key
   */
  configureSupabase(config) {
    if (!config.url || !config.key) {
      this.log.error('Invalid Supabase configuration');
      return false;
    }
    
    try {
      this.SUPABASE_URL = config.url;
      this.SUPABASE_KEY = config.key;
      this.supabase = createClient(this.SUPABASE_URL, this.SUPABASE_KEY);
      this.log.info('Supabase client reconfigured with new credentials');
      return true;
    } catch (error) {
      this.log.error('Error configuring Supabase client:', error);
      return false;
    }
  }
  
  /**
   * Check if Supabase connection is available and properly configured
   * @returns {Promise<boolean>} Whether Supabase is available
   */
  async isSupabaseAvailable() {
    try {
      if (!this.supabase) return false;
      
      // Try a simple query to check connectivity
      const { data, error } = await this.supabase.from('health_check').select('*').limit(1);
      
      if (error) {
        this.log.warn('Supabase connection check failed:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      this.log.warn('Error checking Supabase availability:', error);
      return false;
    }
  }
  
  /**
   * Synchronize inventory data between local and cloud
   * @returns {Promise<Object>} Sync results
   */
  async syncInventory() {
    if (this.syncInProgress) {
      this.log.info('Sync already in progress, queueing inventory sync');
      this.syncQueue.push('inventory');
      return { success: false, message: 'Sync already in progress' };
    }
    
    this.syncInProgress = true;
    this.log.info('Starting inventory synchronization');
    
    try {
      // Check if Supabase is available
      const isAvailable = await this.isSupabaseAvailable();
      if (!isAvailable) {
        this.log.warn('Supabase not available, storing changes for later sync');
        this.offlineChanges.push({ table: 'inventory', timestamp: new Date().toISOString() });
        return { success: false, message: 'Supabase not available', offline: true };
      }
      
      // Get last sync timestamp
      const lastSync = this.lastSyncTimestamps.inventory || '1970-01-01T00:00:00.000Z';
      
      // 1. Pull changes from Supabase to local
      const { data: remoteChanges, error: pullError } = await this.supabase
        .from('inventory')
        .select('*')
        .gt('updated_at', lastSync);
      
      if (pullError) {
        this.log.error('Error pulling inventory changes from Supabase:', pullError);
        throw pullError;
      }
      
      // Apply remote changes to local database
      if (remoteChanges && remoteChanges.length > 0) {
        this.log.info(`Applying ${remoteChanges.length} remote inventory changes to local database`);
        for (const item of remoteChanges) {
          await this.applyRemoteInventoryChange(item);
        }
      }
      
      // 2. Push local changes to Supabase
      const localChanges = await this.db.getInventoryChangesSince(lastSync);
      
      if (localChanges && localChanges.length > 0) {
        this.log.info(`Pushing ${localChanges.length} local inventory changes to Supabase`);
        for (const item of localChanges) {
          await this.pushInventoryItemToSupabase(item);
        }
      }
      
      // Update sync timestamp
      this.lastSyncTimestamps.inventory = new Date().toISOString();
      
      this.log.info('Inventory synchronization completed successfully');
      return { 
        success: true, 
        message: 'Sync completed',
        stats: {
          pulled: remoteChanges?.length || 0,
          pushed: localChanges?.length || 0
        }
      };
    } catch (error) {
      this.log.error('Error during inventory sync:', error);
      return { success: false, message: error.message || 'Unknown error during sync' };
    } finally {
      this.syncInProgress = false;
      
      // Process next item in queue if any
      if (this.syncQueue.length > 0) {
        const nextSync = this.syncQueue.shift();
        this.log.info(`Processing next sync in queue: ${nextSync}`);
        
        switch (nextSync) {
          case 'inventory':
            this.syncInventory();
            break;
          case 'sales':
            this.syncSales();
            break;
          case 'customers':
            this.syncCustomers();
            break;
          default:
            this.log.warn(`Unknown sync type in queue: ${nextSync}`);
        }
      }
    }
  }
  
  /**
   * Apply a remote inventory change to the local database
   * @param {Object} item - Inventory item from Supabase
   */
  async applyRemoteInventoryChange(item) {
    try {
      // Check if item exists in local database
      const existingItem = await this.db.getInventoryItem(item.id);
      
      if (existingItem) {
        // Update existing item
        await this.db.updateInventoryItem(this.convertSupabaseItemToLocal(item));
      } else {
        // Add new item
        await this.db.addInventoryItem(this.convertSupabaseItemToLocal(item));
      }
    } catch (error) {
      this.log.error(`Error applying remote inventory change for item ${item.id}:`, error);
      throw error;
    }
  }
  
  /**
   * Push local inventory item to Supabase
   * @param {Object} item - Local inventory item
   */
  async pushInventoryItemToSupabase(item) {
    try {
      const supabaseItem = this.convertLocalItemToSupabase(item);
      
      // Upsert item to Supabase
      const { data, error } = await this.supabase
        .from('inventory')
        .upsert(supabaseItem, { onConflict: 'id' });
      
      if (error) {
        this.log.error(`Error pushing inventory item ${item.id} to Supabase:`, error);
        throw error;
      }
      
      return data;
    } catch (error) {
      this.log.error(`Error pushing inventory item ${item.id} to Supabase:`, error);
      throw error;
    }
  }
  
  /**
   * Convert Supabase inventory item format to local format
   * @param {Object} supabaseItem - Item from Supabase
   * @returns {Object} Item in local format
   */
  convertSupabaseItemToLocal(supabaseItem) {
    return {
      id: supabaseItem.id,
      description: supabaseItem.description,
      category: supabaseItem.category,
      type: supabaseItem.type,
      brand: supabaseItem.brand,
      dimension: supabaseItem.dimension,
      color: supabaseItem.color,
      quantity: supabaseItem.quantity,
      price: supabaseItem.price,
      buyingPrice: supabaseItem.buying_price,
      alertThreshold: supabaseItem.alert_threshold,
      createdAt: supabaseItem.created_at,
      updatedAt: supabaseItem.updated_at
    };
  }
  
  /**
   * Convert local inventory item format to Supabase format
   * @param {Object} localItem - Item from local database
   * @returns {Object} Item in Supabase format
   */
  convertLocalItemToSupabase(localItem) {
    return {
      id: localItem.id,
      description: localItem.description,
      category: localItem.category,
      type: localItem.type,
      brand: localItem.brand,
      dimension: localItem.dimension,
      color: localItem.color,
      quantity: localItem.quantity,
      price: localItem.price,
      buying_price: localItem.buyingPrice,
      alert_threshold: localItem.alertThreshold,
      created_at: localItem.createdAt,
      updated_at: new Date().toISOString()
    };
  }
  
  /**
   * Synchronize sales data between local and cloud
   * @returns {Promise<Object>} Sync results
   */
  async syncSales() {
    if (this.syncInProgress) {
      this.log.info('Sync already in progress, queueing sales sync');
      this.syncQueue.push('sales');
      return { success: false, message: 'Sync already in progress' };
    }
    
    this.syncInProgress = true;
    this.log.info('Starting sales synchronization');
    
    try {
      // Check if Supabase is available
      const isAvailable = await this.isSupabaseAvailable();
      if (!isAvailable) {
        this.log.warn('Supabase not available, storing changes for later sync');
        this.offlineChanges.push({ table: 'sales', timestamp: new Date().toISOString() });
        return { success: false, message: 'Supabase not available', offline: true };
      }
      
      // Get last sync timestamp
      const lastSync = this.lastSyncTimestamps.sales || '1970-01-01T00:00:00.000Z';
      
      // 1. Pull changes from Supabase to local
      const { data: remoteChanges, error: pullError } = await this.supabase
        .from('sales')
        .select('*, sale_items(*)')
        .gt('updated_at', lastSync);
      
      if (pullError) {
        this.log.error('Error pulling sales changes from Supabase:', pullError);
        throw pullError;
      }
      
      // Apply remote changes to local database
      if (remoteChanges && remoteChanges.length > 0) {
        this.log.info(`Applying ${remoteChanges.length} remote sales changes to local database`);
        for (const sale of remoteChanges) {
          await this.applyRemoteSaleChange(sale);
        }
      }
      
      // 2. Push local changes to Supabase
      const localChanges = await this.db.getSalesChangesSince(lastSync);
      
      if (localChanges && localChanges.length > 0) {
        this.log.info(`Pushing ${localChanges.length} local sales changes to Supabase`);
        for (const sale of localChanges) {
          await this.pushSaleToSupabase(sale);
        }
      }
      
      // Update sync timestamp
      this.lastSyncTimestamps.sales = new Date().toISOString();
      
      this.log.info('Sales synchronization completed successfully');
      return { 
        success: true, 
        message: 'Sync completed',
        stats: {
          pulled: remoteChanges?.length || 0,
          pushed: localChanges?.length || 0
        }
      };
    } catch (error) {
      this.log.error('Error during sales sync:', error);
      return { success: false, message: error.message || 'Unknown error during sync' };
    } finally {
      this.syncInProgress = false;
      
      // Process next item in queue if any
      if (this.syncQueue.length > 0) {
        const nextSync = this.syncQueue.shift();
        this.log.info(`Processing next sync in queue: ${nextSync}`);
        
        switch (nextSync) {
          case 'inventory':
            this.syncInventory();
            break;
          case 'sales':
            this.syncSales();
            break;
          case 'customers':
            this.syncCustomers();
            break;
          default:
            this.log.warn(`Unknown sync type in queue: ${nextSync}`);
        }
      }
    }
  }
  
  /**
   * Process any pending offline changes
   * @returns {Promise<Object>} Processing results
   */
  async processOfflineChanges() {
    if (this.offlineChanges.length === 0) {
      return { success: true, message: 'No offline changes to process' };
    }
    
    this.log.info(`Processing ${this.offlineChanges.length} offline changes`);
    
    try {
      // Check if Supabase is available
      const isAvailable = await this.isSupabaseAvailable();
      if (!isAvailable) {
        return { success: false, message: 'Supabase still not available' };
      }
      
      // Group changes by table
      const changesByTable = {};
      this.offlineChanges.forEach(change => {
        if (!changesByTable[change.table]) {
          changesByTable[change.table] = [];
        }
        changesByTable[change.table].push(change);
      });
      
      // Process changes for each table
      for (const [table, changes] of Object.entries(changesByTable)) {
        this.log.info(`Processing ${changes.length} offline changes for ${table}`);
        
        switch (table) {
          case 'inventory':
            await this.syncInventory();
            break;
          case 'sales':
            await this.syncSales();
            break;
          case 'customers':
            await this.syncCustomers();
            break;
          default:
            this.log.warn(`Unknown table in offline changes: ${table}`);
        }
      }
      
      // Clear processed offline changes
      this.offlineChanges = [];
      
      return { success: true, message: 'Offline changes processed successfully' };
    } catch (error) {
      this.log.error('Error processing offline changes:', error);
      return { success: false, message: error.message || 'Unknown error processing offline changes' };
    }
  }
  
  /**
   * Check for internet connectivity
   * @returns {Promise<boolean>} Whether internet is available
   */
  async checkInternetConnection() {
    try {
      // Try to fetch a small resource to check connectivity
      const response = await fetch('https://www.google.com/favicon.ico', { 
        mode: 'no-cors',
        cache: 'no-cache',
        method: 'HEAD',
        timeout: 5000
      });
      return true;
    } catch (error) {
      this.log.warn('Internet connection check failed:', error);
      return false;
    }
  }
  
  /**
   * Get sync status information
   * @returns {Object} Sync status
   */
  getSyncStatus() {
    return {
      lastSync: this.lastSyncTimestamps,
      syncInProgress: this.syncInProgress,
      queueLength: this.syncQueue.length,
      offlineChanges: this.offlineChanges.length,
      supabaseConfigured: !!this.supabase && 
        this.SUPABASE_URL !== 'https://your-project-url.supabase.co' &&
        this.SUPABASE_KEY !== 'your-anon-key'
    };
  }
  
  /**
   * Perform full synchronization of all data
   * @returns {Promise<Object>} Sync results
   */
  async syncAll() {
    this.log.info('Starting full synchronization');
    
    const results = {
      inventory: null,
      sales: null,
      customers: null,
      overall: false
    };
    
    try {
      // Check internet connection
      const hasInternet = await this.checkInternetConnection();
      if (!hasInternet) {
        this.log.warn('No internet connection available for sync');
        return { 
          success: false, 
          message: 'No internet connection available',
          results
        };
      }
      
      // Check if Supabase is available
      const isSupabaseAvailable = await this.isSupabaseAvailable();
      if (!isSupabaseAvailable) {
        this.log.warn('Supabase not available for sync');
        return { 
          success: false, 
          message: 'Supabase not properly configured or unavailable',
          results
        };
      }
      
      // Sync inventory
      results.inventory = await this.syncInventory();
      
      // Sync sales
      results.sales = await this.syncSales();
      
      // Sync customers 
      // (commented out for now, implement similar to inventory and sales)
      // results.customers = await this.syncCustomers();
      
      // Update overall status
      results.overall = results.inventory.success && 
                         results.sales.success;
                         // && results.customers.success;
      
      return {
        success: results.overall,
        message: results.overall ? 'Full sync completed successfully' : 'Sync completed with some issues',
        results
      };
    } catch (error) {
      this.log.error('Error during full sync:', error);
      return { 
        success: false, 
        message: error.message || 'Unknown error during full sync',
        results
      };
    }
  }
}

module.exports = SyncManager; 