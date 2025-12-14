/**
 * Logger Module
 * Handles system-wide logging of activities
 */

const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Store = require('electron-store');
const EventEmitter = require('events');

class Logger extends EventEmitter {
  constructor() {
    super();
    this.store = new Store({
      name: 'system-logs',
      // Default settings - can be overridden by user preferences
      defaults: {
        logs: [],
        settings: {
          retention: 90, // days to keep logs
          enableLogging: true,
          logCategories: {
            inventory: true,
            sales: true,
            customer: true,
            user: true,
            system: true
          }
        }
      }
    });
    
    this.initialized = false;
    this.logBuffer = [];
    
    // Bind methods to ensure proper 'this' context
    this.init = this.init.bind(this);
    this.log = this.log.bind(this);
    this.getLogs = this.getLogs.bind(this);
    this.getLogById = this.getLogById.bind(this);
    this.clearLogs = this.clearLogs.bind(this);
    this.clearOldLogs = this.clearOldLogs.bind(this);
    this.exportLogs = this.exportLogs.bind(this);
    this.updateSettings = this.updateSettings.bind(this);
    this.getSettings = this.getSettings.bind(this);
    
    // Start automatic cleanup
    setInterval(() => {
      this.clearOldLogs();
    }, 24 * 60 * 60 * 1000); // Once per day
  }
  
  /**
   * Initialize the logger module
   */
  init() {
    console.log('Initializing Logger Module');
    
    // Load settings
    this.settings = this.store.get('settings');
    
    // Process any buffered logs
    if (this.logBuffer.length > 0) {
      console.log(`Processing ${this.logBuffer.length} buffered log entries`);
      this.logBuffer.forEach(log => {
        this._saveLog(log);
      });
      this.logBuffer = [];
    }
    
    this.initialized = true;
    
    // Log system startup
    this.log({
      type: 'info',
      category: 'system',
      description: 'Application started',
      user: 'system',
      data: {
        version: app.getVersion(),
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.versions.node,
        electronVersion: process.versions.electron
      }
    });
    
    return this;
  }
  
  /**
   * Log an activity
   * @param {Object} logEntry - The log entry to add
   * @param {string} logEntry.type - Log type (info, warning, error, success)
   * @param {string} logEntry.category - Category (inventory, sales, customer, user, system)
   * @param {string} logEntry.description - Description of the activity
   * @param {string} logEntry.user - User who performed the action
   * @param {Object} [logEntry.data] - Additional data related to the log
   * @returns {string} Log ID
   */
  log(logEntry) {
    // Check if logging is enabled for this category
    if (this.initialized && this.settings && 
        (!this.settings.enableLogging || 
         (this.settings.logCategories && this.settings.logCategories[logEntry.category] === false))) {
      return null;
    }
    
    // Create log object
    const log = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      type: logEntry.type || 'info',
      category: logEntry.category || 'system',
      description: logEntry.description || 'Unknown activity',
      user: logEntry.user || 'system',
      data: logEntry.data || null
    };
    
    // If not initialized yet, buffer the log
    if (!this.initialized) {
      this.logBuffer.push(log);
      return log.id;
    }
    
    return this._saveLog(log);
  }
  
  /**
   * Internal method to save log to storage
   * @private
   * @param {Object} log - The log entry to save
   * @returns {string} Log ID
   */
  _saveLog(log) {
    try {
      // Get current logs
      const logs = this.store.get('logs') || [];
      
      // Add new log
      logs.unshift(log);
      
      // Save back to store
      this.store.set('logs', logs);
      
      // Emit event for real-time updates
      this.emit('new-log', log);
      
      return log.id;
    } catch (error) {
      console.error('Error saving log:', error);
      
      // Try to log the error
      try {
        const errorLog = {
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          type: 'error',
          category: 'system',
          description: 'Failed to save log entry',
          user: 'system',
          data: {
            originalLog: log,
            error: error.message
          }
        };
        
        // Get current logs
        const logs = this.store.get('logs') || [];
        
        // Add error log
        logs.unshift(errorLog);
        
        // Save back to store
        this.store.set('logs', logs);
      } catch (e) {
        console.error('Critical error in logger:', e);
      }
      
      return null;
    }
  }
  
  /**
   * Get all logs with optional filtering
   * @param {Object} [filters] - Optional filters to apply
   * @param {string} [filters.type] - Filter by log type
   * @param {string} [filters.category] - Filter by category
   * @param {string} [filters.user] - Filter by user
   * @param {Date|string} [filters.startDate] - Filter logs after this date
   * @param {Date|string} [filters.endDate] - Filter logs before this date
   * @param {string} [filters.search] - Search term to filter by
   * @returns {Array} Filtered logs
   */
  getLogs(filters = {}) {
    try {
      // Get all logs
      const logs = this.store.get('logs') || [];
      
      // If no filters, return all logs
      if (!filters || Object.keys(filters).length === 0) {
        return logs;
      }
      
      // Apply filters
      return logs.filter(log => {
        // Type filter
        if (filters.type && log.type !== filters.type) {
          return false;
        }
        
        // Category filter
        if (filters.category && log.category !== filters.category) {
          return false;
        }
        
        // User filter
        if (filters.user && log.user !== filters.user) {
          return false;
        }
        
        // Date range filter
        if (filters.startDate) {
          const startDate = new Date(filters.startDate);
          const logDate = new Date(log.timestamp);
          if (logDate < startDate) {
            return false;
          }
        }
        
        if (filters.endDate) {
          const endDate = new Date(filters.endDate);
          const logDate = new Date(log.timestamp);
          if (logDate > endDate) {
            return false;
          }
        }
        
        // Search filter
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          return (
            log.description.toLowerCase().includes(searchLower) ||
            log.category.toLowerCase().includes(searchLower) ||
            log.user.toLowerCase().includes(searchLower) ||
            log.type.toLowerCase().includes(searchLower) ||
            (log.data && JSON.stringify(log.data).toLowerCase().includes(searchLower))
          );
        }
        
        return true;
      });
    } catch (error) {
      console.error('Error getting logs:', error);
      return [];
    }
  }
  
  /**
   * Get a specific log by ID
   * @param {string} id - The log ID to find
   * @returns {Object|null} The log entry or null if not found
   */
  getLogById(id) {
    try {
      const logs = this.store.get('logs') || [];
      return logs.find(log => log.id === id) || null;
    } catch (error) {
      console.error(`Error getting log ${id}:`, error);
      return null;
    }
  }
  
  /**
   * Clear all logs
   * @returns {boolean} Success status
   */
  clearLogs() {
    try {
      this.store.set('logs', []);
      
      // Log the clear action
      this.log({
        type: 'warning',
        category: 'system',
        description: 'All logs cleared',
        user: 'system'
      });
      
      return true;
    } catch (error) {
      console.error('Error clearing logs:', error);
      return false;
    }
  }
  
  /**
   * Clear logs older than retention period
   * @returns {number} Number of logs cleared
   */
  clearOldLogs() {
    try {
      // Get retention period from settings
      const retention = this.settings?.retention || 90;
      
      // If retention is 0, keep logs indefinitely
      if (retention === 0) {
        return 0;
      }
      
      // Calculate cutoff date
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retention);
      
      // Get current logs
      const logs = this.store.get('logs') || [];
      
      // Count logs to be deleted
      const countBefore = logs.length;
      
      // Filter out old logs
      const newLogs = logs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= cutoffDate;
      });
      
      // Save filtered logs
      this.store.set('logs', newLogs);
      
      const cleared = countBefore - newLogs.length;
      
      // If any logs were cleared, log the action
      if (cleared > 0) {
        this.log({
          type: 'info',
          category: 'system',
          description: `${cleared} logs older than ${retention} days automatically cleared`,
          user: 'system'
        });
      }
      
      return cleared;
    } catch (error) {
      console.error('Error clearing old logs:', error);
      return 0;
    }
  }
  
  /**
   * Export logs to a file
   * @param {string} filePath - The path to save the file
   * @param {string} [format='json'] - Export format (json or csv)
   * @param {Object} [filters] - Optional filters to apply
   * @returns {Object} Result object with success status
   */
  exportLogs(filePath, format = 'json', filters = {}) {
    try {
      // Get filtered logs
      const logs = this.getLogs(filters);
      
      // Create directory if it doesn't exist
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Export based on format
      if (format === 'csv') {
        // Create CSV content
        const headers = ['ID', 'Timestamp', 'Type', 'Category', 'Description', 'User', 'Data'];
        const rows = [headers.join(',')];
        
        logs.forEach(log => {
          const data = log.data ? JSON.stringify(log.data).replace(/"/g, '""') : '';
          const row = [
            log.id,
            log.timestamp,
            log.type,
            log.category,
            `"${log.description.replace(/"/g, '""')}"`,
            log.user,
            `"${data}"`
          ];
          rows.push(row.join(','));
        });
        
        fs.writeFileSync(filePath, rows.join('\n'), 'utf8');
      } else {
        // JSON format
        fs.writeFileSync(filePath, JSON.stringify(logs, null, 2), 'utf8');
      }
      
      // Log the export action
      this.log({
        type: 'info',
        category: 'system',
        description: `Logs exported to ${filePath}`,
        user: 'system',
        data: {
          format,
          count: logs.length,
          filePath
        }
      });
      
      return {
        success: true,
        path: filePath,
        count: logs.length
      };
    } catch (error) {
      console.error('Error exporting logs:', error);
      
      // Log the error
      this.log({
        type: 'error',
        category: 'system',
        description: `Failed to export logs to ${filePath}`,
        user: 'system',
        data: {
          error: error.message
        }
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Update logger settings
   * @param {Object} newSettings - New settings to apply
   * @returns {boolean} Success status
   */
  updateSettings(newSettings) {
    try {
      // Get current settings
      const currentSettings = this.store.get('settings');
      
      // Merge with new settings
      const updatedSettings = {
        ...currentSettings,
        ...newSettings
      };
      
      // Ensure logCategories are properly merged
      if (newSettings.logCategories) {
        updatedSettings.logCategories = {
          ...currentSettings.logCategories,
          ...newSettings.logCategories
        };
      }
      
      // Save updated settings
      this.store.set('settings', updatedSettings);
      
      // Update local settings
      this.settings = updatedSettings;
      
      // Log the settings update
      this.log({
        type: 'info',
        category: 'system',
        description: 'Logger settings updated',
        user: 'system',
        data: {
          newSettings
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error updating logger settings:', error);
      return false;
    }
  }
  
  /**
   * Get current logger settings
   * @returns {Object} Logger settings
   */
  getSettings() {
    return this.store.get('settings');
  }
}

// Create and export singleton instance
const logger = new Logger();

module.exports = logger; 