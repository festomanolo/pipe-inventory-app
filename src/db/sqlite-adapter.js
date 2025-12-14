/**
 * SQLite Adapter - Compatibility layer for sqlite3
 * This adapter allows the application to work with sqlite3
 */

const fs = require('fs');
const path = require('path');

// Only use sqlite3 now
let sqlite3, Database, isUsingSqlite3 = true;

try {
  // Try to load sqlite3
  sqlite3 = require('sqlite3').verbose();
  console.log('Using sqlite3 for database operations');
  
  // If successful, use the original sqlite3 Database
  Database = sqlite3.Database;
} catch (sqliteErr) {
  console.error('sqlite3 is not available:', sqliteErr);
  
  // Create a dummy Database that logs errors but doesn't crash
  Database = class DummyDatabase {
    constructor(dbPath, mode, callback) {
      console.error('No SQLite module available, using dummy database');
      if (callback && typeof callback === 'function') {
        callback(new Error('No SQLite module available'));
      }
    }
    
    run() { console.error('SQLite operation failed: No SQLite module available'); return this; }
    get() { console.error('SQLite operation failed: No SQLite module available'); return this; }
    all() { console.error('SQLite operation failed: No SQLite module available'); return this; }
    exec() { console.error('SQLite operation failed: No SQLite module available'); return this; }
    prepare() { console.error('SQLite operation failed: No SQLite module available'); return {}; }
    close() { console.error('SQLite operation failed: No SQLite module available'); }
  };
  
  sqlite3 = {
    Database: Database,
    verbose: () => sqlite3
  };
}

module.exports = {
  sqlite3,
  Database,
  isUsingSqlite3
}; 