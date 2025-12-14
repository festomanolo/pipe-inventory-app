const path = require('path');
const { app } = require('electron');
let sqlite3;
try {
  const { sqlite3: sqliteAdapter } = require('./sqlite-adapter');
  sqlite3 = sqliteAdapter;
  console.log('SalesDB using SQLite adapter');
} catch (e) {
  console.error('Error loading SQLite adapter:', e);
  try {
    sqlite3 = require('sqlite3').verbose();
    console.log('SalesDB using direct sqlite3 module');
  } catch (sqliteErr) {
    console.error('SQLite3 module not available, SalesDB will operate in fallback mode');
  }
}

const log = require('electron-log');

// Handle app reference for testing or when app module is not available
const getAppPath = () => {
    // If the app is available, use it
    try {
        if (app && app.getPath) {
            return app.getPath('userData');
        }
    } catch (error) {
        log.warn('Electron app module not available, using fallback path');
    }
    
    // Fallback for tests or non-electron environments
    return process.env.NODE_ENV === 'test' 
        ? path.join(__dirname, '../../test/fixtures')
        : path.join(process.env.HOME || process.env.USERPROFILE, '.pipe-inventory');
};

class SalesDB {
    constructor() {
        // Check if sqlite3 module is available
        if (!sqlite3) {
            log.error('SQLite3 module not available, SalesDB will operate in fallback mode');
            this.fallbackMode = true;
            return;
        }
        
        this.fallbackMode = false;
        const userDataPath = getAppPath();
        this.dbPath = path.join(userDataPath, 'inventory.db');
        log.info(`Initializing SalesDB with path: ${this.dbPath}`);
        
        try {
            this.db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READWRITE, (err) => {
                if (err) {
                    log.error('Error connecting to sales database:', err);
                    // Try to create the table in case it doesn't exist
                    this.createTablesIfNeeded();
                } else {
                    log.info('Connected to sales database successfully');
                    this.createTablesIfNeeded();
                }
            });
        } catch (error) {
            log.error('Critical error initializing sales database:', error);
            this.fallbackMode = true;
        }
    }

    createTablesIfNeeded() {
        if (this.fallbackMode) return;
        
        log.info('Checking if sales table exists');
        const query = `
            CREATE TABLE IF NOT EXISTS sales (
                id TEXT PRIMARY KEY,
                invoiceNumber TEXT,
                buyer TEXT,
                date TEXT,
                items TEXT,
                totalAmount REAL,
                paymentMethod TEXT,
                status TEXT,
                notes TEXT,
                createdAt TEXT,
                updatedAt TEXT
            )
        `;

        this.db.run(query, (err) => {
            if (err) {
                log.error('Error creating sales table:', err);
            } else {
                log.info('Sales table created or already exists');
            }
        });
    }

    getAllSales() {
        return new Promise((resolve, reject) => {
            // Return empty array in fallback mode
            if (this.fallbackMode) {
                log.warn('SalesDB in fallback mode, returning empty sales array');
                resolve([]);
                return;
            }
            
            log.info('Getting all sales');
            const query = `SELECT * FROM sales ORDER BY date DESC`;
            this.db.all(query, [], (err, rows) => {
                if (err) {
                    log.error('Error fetching sales:', err);
                    resolve([]); // Return empty array instead of rejecting
                } else {
                    try {
                        // Parse the items JSON string for each sale
                        const sales = rows.map(row => {
                            try {
                                return {
                                    ...row,
                                    items: JSON.parse(row.items || '[]'),
                                    buyer: JSON.parse(row.buyer || '{}')
                                };
                            } catch (parseError) {
                                log.error(`Error parsing JSON for sale ${row.id}:`, parseError);
                                return {
                                    ...row,
                                    items: [],
                                    buyer: {}
                                };
                            }
                        });
                        log.info(`Retrieved ${sales.length} sales records`);
                        resolve(sales);
                    } catch (parseError) {
                        log.error('Error parsing sales data:', parseError);
                        resolve([]);
                    }
                }
            });
        });
    }

    getSaleById(id) {
        return new Promise((resolve, reject) => {
            // Return null in fallback mode
            if (this.fallbackMode) {
                log.warn('SalesDB in fallback mode, returning null for getSaleById');
                resolve(null);
                return;
            }
            
            const query = `SELECT * FROM sales WHERE id = ?`;
            this.db.get(query, [id], (err, row) => {
                if (err) {
                    log.error('Error fetching sale:', err);
                    reject(err);
                } else if (!row) {
                    resolve(null);
                } else {
                    // Parse the items JSON string
                    const sale = {
                        ...row,
                        items: JSON.parse(row.items || '[]'),
                        buyer: JSON.parse(row.buyer || '{}')
                    };
                    resolve(sale);
                }
            });
        });
    }

    createSale(saleData) {
        return new Promise((resolve, reject) => {
            // Return mock data in fallback mode
            if (this.fallbackMode) {
                log.warn('SalesDB in fallback mode, returning mock data for createSale');
                const now = new Date().toISOString();
                const mockSale = {
                    id: saleData.id || Date.now().toString(),
                    invoiceNumber: saleData.invoiceNumber || `INV-${Date.now()}`,
                    buyer: saleData.buyer || {},
                    date: saleData.date || now,
                    items: saleData.items || [],
                    totalAmount: saleData.totalAmount || 0,
                    paymentMethod: saleData.paymentMethod || 'Cash',
                    status: saleData.status || 'completed',
                    notes: saleData.notes || '',
                    createdAt: now,
                    updatedAt: now
                };
                resolve(mockSale);
                return;
            }
            
            const now = new Date().toISOString();
            const sale = {
                id: saleData.id || Date.now().toString(),
                invoiceNumber: saleData.invoiceNumber || `INV-${Date.now()}`,
                buyer: JSON.stringify(saleData.buyer || {}),
                date: saleData.date || now,
                items: JSON.stringify(saleData.items || []),
                totalAmount: saleData.totalAmount || 0,
                paymentMethod: saleData.paymentMethod || 'Cash',
                status: saleData.status || 'completed',
                notes: saleData.notes || '',
                createdAt: now,
                updatedAt: now
            };

            const query = `
                INSERT INTO sales (
                    id, invoiceNumber, buyer, date, items, totalAmount,
                    paymentMethod, status, notes, createdAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            this.db.run(query, [
                sale.id,
                sale.invoiceNumber,
                sale.buyer,
                sale.date,
                sale.items,
                sale.totalAmount,
                sale.paymentMethod,
                sale.status,
                sale.notes,
                sale.createdAt,
                sale.updatedAt
            ], function(err) {
                if (err) {
                    log.error('Error creating sale:', err);
                    reject(err);
                } else {
                    // Return the created sale with parsed items
                    resolve({
                        ...sale,
                        items: JSON.parse(sale.items),
                        buyer: JSON.parse(sale.buyer)
                    });
                }
            });
        });
    }

    getSalesByPeriod(period, customRange = {}) {
        return new Promise((resolve, reject) => {
            // Return empty array in fallback mode
            if (this.fallbackMode) {
                log.warn('SalesDB in fallback mode, returning empty array for getSalesByPeriod');
                resolve([]);
                return;
            }
            
            let query = `SELECT * FROM sales WHERE 1=1`;
            const params = [];

            const now = new Date();
            let startDate;

            switch(period) {
                case 'day':
                    startDate = new Date(now.setHours(0, 0, 0, 0));
                    query += ` AND date >= ?`;
                    params.push(startDate.toISOString());
                    break;
                case 'week':
                    startDate = new Date(now.setDate(now.getDate() - 7));
                    query += ` AND date >= ?`;
                    params.push(startDate.toISOString());
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    query += ` AND date >= ?`;
                    params.push(startDate.toISOString());
                    break;
                case 'year':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    query += ` AND date >= ?`;
                    params.push(startDate.toISOString());
                    break;
                case 'custom':
                    if (customRange.startDate) {
                        query += ` AND date >= ?`;
                        params.push(new Date(customRange.startDate).toISOString());
                    }
                    if (customRange.endDate) {
                        query += ` AND date <= ?`;
                        params.push(new Date(customRange.endDate).toISOString());
                    }
                    break;
            }

            query += ` ORDER BY date DESC`;

            this.db.all(query, params, (err, rows) => {
                if (err) {
                    log.error('Error fetching sales by period:', err);
                    reject(err);
                } else {
                    // Parse the items JSON string for each sale
                    const sales = rows.map(row => ({
                        ...row,
                        items: JSON.parse(row.items || '[]'),
                        buyer: JSON.parse(row.buyer || '{}')
                    }));
                    resolve(sales);
                }
            });
        });
    }

    getSalesSummary(sales = null) {
        return new Promise(async (resolve, reject) => {
            try {
                // If in fallback mode, return empty summary
                if (this.fallbackMode) {
                    log.warn('SalesDB in fallback mode, returning empty summary for getSalesSummary');
                    resolve({
                        totalSales: 0,
                        totalTransactions: 0,
                        averageOrder: 0,
                        recentSales: []
                    });
                    return;
                }
                
                // If no sales provided, get all sales
                const salesToAnalyze = sales || await this.getAllSales();

                const summary = {
                    totalSales: salesToAnalyze.length,
                    totalRevenue: 0,
                    totalItems: 0,
                    formattedTotalRevenue: ''
                };

                salesToAnalyze.forEach(sale => {
                    summary.totalRevenue += parseFloat(sale.totalAmount) || 0;
                    summary.totalItems += sale.items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
                });

                summary.formattedTotalRevenue = `TZsh ${summary.totalRevenue.toFixed(2)}`;
                resolve(summary);
            } catch (error) {
                log.error('Error generating sales summary:', error);
                reject(error);
            }
        });
    }

    deleteSale(id) {
        return new Promise((resolve, reject) => {
            // Return success in fallback mode
            if (this.fallbackMode) {
                log.warn('SalesDB in fallback mode, returning mock success for deleteSale');
                resolve({ success: true, id });
                return;
            }
            
            const query = `DELETE FROM sales WHERE id = ?`;
            this.db.run(query, [id], function(err) {
                if (err) {
                    log.error('Error deleting sale:', err);
                    reject(err);
                } else {
                    resolve({ success: true, id });
                }
            });
        });
    }
}

module.exports = new SalesDB(); 