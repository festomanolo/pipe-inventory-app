const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
  constructor() {
    // Ensure the data directory exists
    const userDataPath = path.join(process.env.APPDATA || 
      (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : 
      process.env.HOME + '/.local/share'), 'eliva-hardware');
    
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }

    const dbPath = path.join(userDataPath, 'eliva-hardware.db');
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Database opening error: ', err);
      } else {
        console.log('Connected to the SQLite database.');
        this.initDatabase();
      }
    });
  }

  initDatabase() {
    this.db.serialize(() => {
      // Create items table
      this.db.run(`CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        color TEXT,
        diameter REAL,
        length REAL,
        thickness REAL,
        quantity INTEGER NOT NULL,
        cost_price REAL NOT NULL,
        selling_price REAL NOT NULL,
        low_stock_threshold INTEGER DEFAULT 10,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);

      // Create sales table
      this.db.run(`CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number TEXT UNIQUE NOT NULL,
        buyer_name TEXT NOT NULL,
        buyer_title TEXT,
        buyer_tin TEXT,
        total_amount REAL NOT NULL,
        payment_method TEXT,
        sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);

      // Create sale_items table (for items in each sale)
      this.db.run(`CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE RESTRICT
      )`);

      // Create settings table
      this.db.run(`CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT
      )`);

      // Insert default settings if they don't exist
      this.db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('company_name', 'Eliva Hardware')`);
      this.db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('company_address', 'Your Address')`);
      this.db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('company_phone', 'Your Phone')`);
      this.db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('company_email', 'your@email.com')`);
      this.db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('tax_rate', '15')`);
      this.db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('invoice_prefix', 'INV-')`);
      this.db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('next_invoice_number', '1000')`);
    });
  }

  // Item operations
  getAllItems() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM items ORDER BY name', [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  getItem(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM items WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  addItem(item) {
    return new Promise((resolve, reject) => {
      const { name, type, color, diameter, length, thickness, quantity, cost_price, selling_price, low_stock_threshold } = item;
      
      this.db.run(
        `INSERT INTO items (name, type, color, diameter, length, thickness, quantity, cost_price, selling_price, low_stock_threshold) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, type, color, diameter, length, thickness, quantity, cost_price, selling_price, low_stock_threshold || 10],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, ...item });
          }
        }
      );
    });
  }

  updateItem(id, item) {
    return new Promise((resolve, reject) => {
      const { name, type, color, diameter, length, thickness, quantity, cost_price, selling_price, low_stock_threshold } = item;
      
      this.db.run(
        `UPDATE items SET 
         name = ?, 
         type = ?, 
         color = ?, 
         diameter = ?, 
         length = ?, 
         thickness = ?, 
         quantity = ?, 
         cost_price = ?, 
         selling_price = ?, 
         low_stock_threshold = ?,
         updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [name, type, color, diameter, length, thickness, quantity, cost_price, selling_price, low_stock_threshold, id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id, ...item });
          }
        }
      );
    });
  }

  deleteItem(id) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM items WHERE id = ?', [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id, deleted: this.changes > 0 });
        }
      });
    });
  }

  // Sales operations
  async createSale(saleData) {
    const { buyer_name, buyer_title, buyer_tin, payment_method, items } = saleData;
    
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Get next invoice number
        this.db.get('SELECT value FROM settings WHERE key = "next_invoice_number"', [], (err, row) => {
          if (err) {
            return reject(err);
          }
          
          const nextInvoiceNumber = row ? parseInt(row.value) : 1000;
          const invoicePrefix = 'INV-';
          const invoiceNumber = `${invoicePrefix}${nextInvoiceNumber}`;
          
          // Calculate total amount
          const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
          
          // Begin transaction
          this.db.run('BEGIN TRANSACTION', (err) => {
            if (err) {
              return reject(err);
            }
            
            // Insert sale record
            this.db.run(
              `INSERT INTO sales (invoice_number, buyer_name, buyer_title, buyer_tin, total_amount, payment_method) 
               VALUES (?, ?, ?, ?, ?, ?)`,
              [invoiceNumber, buyer_name, buyer_title, buyer_tin, totalAmount, payment_method],
              function(err) {
                if (err) {
                  this.db.run('ROLLBACK');
                  return reject(err);
                }
                
                const saleId = this.lastID;
                let itemsProcessed = 0;
                
                // Insert sale items and update inventory
                items.forEach(item => {
                  // Insert sale item
                  this.db.run(
                    `INSERT INTO sale_items (sale_id, item_id, quantity, unit_price, total_price) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [saleId, item.id, item.quantity, item.unit_price, item.quantity * item.unit_price],
                    (err) => {
                      if (err) {
                        this.db.run('ROLLBACK');
                        return reject(err);
                      }
                      
                      // Update inventory quantity
                      this.db.run(
                        'UPDATE items SET quantity = quantity - ? WHERE id = ?',
                        [item.quantity, item.id],
                        (err) => {
                          if (err) {
                            this.db.run('ROLLBACK');
                            return reject(err);
                          }
                          
                          itemsProcessed++;
                          
                          // If all items processed, commit transaction
                          if (itemsProcessed === items.length) {
                            // Update next invoice number
                            this.db.run(
                              'UPDATE settings SET value = ? WHERE key = "next_invoice_number"',
                              [(nextInvoiceNumber + 1).toString()],
                              (err) => {
                                if (err) {
                                  this.db.run('ROLLBACK');
                                  return reject(err);
                                }
                                
                                this.db.run('COMMIT', (err) => {
                                  if (err) {
                                    this.db.run('ROLLBACK');
                                    return reject(err);
                                  }
                                  
                                  resolve({
                                    id: saleId,
                                    invoice_number: invoiceNumber,
                                    buyer_name,
                                    buyer_title,
                                    buyer_tin,
                                    total_amount: totalAmount,
                                    payment_method,
                                    items
                                  });
                                });
                              }
                            );
                          }
                        }
                      );
                    }
                  );
                });
              }
            );
          });
        });
      });
    });
  }

  getSales(filters = {}) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM sales';
      const queryParams = [];
      
      // Apply filters if provided
      if (filters) {
        const whereConditions = [];
        
        if (filters.startDate && filters.endDate) {
          whereConditions.push('sale_date BETWEEN ? AND ?');
          queryParams.push(filters.startDate, filters.endDate);
        } else if (filters.startDate) {
          whereConditions.push('sale_date >= ?');
          queryParams.push(filters.startDate);
        } else if (filters.endDate) {
          whereConditions.push('sale_date <= ?');
          queryParams.push(filters.endDate);
        }
        
        if (filters.buyerName) {
          whereConditions.push('buyer_name LIKE ?');
          queryParams.push(`%${filters.buyerName}%`);
        }
        
        if (filters.invoiceNumber) {
          whereConditions.push('invoice_number LIKE ?');
          queryParams.push(`%${filters.invoiceNumber}%`);
        }
        
        if (whereConditions.length > 0) {
          query += ' WHERE ' + whereConditions.join(' AND ');
        }
      }
      
      // Add order by
      query += ' ORDER BY sale_date DESC';
      
      this.db.all(query, queryParams, (err, sales) => {
        if (err) {
          reject(err);
        } else {
          // For each sale, get its items
          const promises = sales.map(sale => {
            return new Promise((resolve, reject) => {
              this.db.all(
                `SELECT si.*, i.name, i.type, i.color, i.diameter 
                 FROM sale_items si
                 JOIN items i ON si.item_id = i.id
                 WHERE si.sale_id = ?`,
                [sale.id],
                (err, items) => {
                  if (err) {
                    reject(err);
                  } else {
                    sale.items = items;
                    resolve(sale);
                  }
                }
              );
            });
          });
          
          Promise.all(promises)
            .then(salesWithItems => resolve(salesWithItems))
            .catch(err => reject(err));
        }
      });
    });
  }

  getDailyReport(date) {
    const startDate = date ? new Date(date) : new Date();
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setHours(23, 59, 59, 999);
    
    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();
    
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT s.*, COUNT(si.id) as item_count, SUM(si.quantity) as total_quantity
         FROM sales s
         LEFT JOIN sale_items si ON s.id = si.sale_id
         WHERE s.sale_date BETWEEN ? AND ?
         GROUP BY s.id
         ORDER BY s.sale_date DESC`,
        [startDateStr, endDateStr],
        (err, sales) => {
          if (err) {
            reject(err);
          } else {
            // Calculate summary statistics
            const totalSales = sales.length;
            const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
            
            // Get top selling items
            this.db.all(
              `SELECT i.name, i.type, i.color, i.diameter, SUM(si.quantity) as quantity_sold, 
               SUM(si.total_price) as revenue
               FROM sale_items si
               JOIN items i ON si.item_id = i.id
               JOIN sales s ON si.sale_id = s.id
               WHERE s.sale_date BETWEEN ? AND ?
               GROUP BY i.id
               ORDER BY quantity_sold DESC
               LIMIT 5`,
              [startDateStr, endDateStr],
              (err, topItems) => {
                if (err) {
                  reject(err);
                } else {
                  resolve({
                    date: startDate.toISOString().split('T')[0],
                    totalSales,
                    totalRevenue,
                    sales,
                    topItems
                  });
                }
              }
            );
          }
        }
      );
    });
  }

  getLowStockAlerts() {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM items 
         WHERE quantity <= low_stock_threshold
         ORDER BY quantity ASC`,
        [],
        (err, items) => {
          if (err) {
            reject(err);
          } else {
            resolve(items);
          }
        }
      );
    });
  }

  getProfitLoss(period = 'month') {
    return new Promise((resolve, reject) => {
      let startDate;
      const endDate = new Date();
      
      // Calculate start date based on period
      switch (period) {
        case 'week':
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case 'year':
          startDate = new Date();
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 1);
      }
      
      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();
      
      this.db.all(
        `SELECT si.item_id, i.name, i.cost_price, si.quantity, si.unit_price, si.total_price,
         (si.unit_price - i.cost_price) * si.quantity as profit
         FROM sale_items si
         JOIN items i ON si.item_id = i.id
         JOIN sales s ON si.sale_id = s.id
         WHERE s.sale_date BETWEEN ? AND ?`,
        [startDateStr, endDateStr],
        (err, items) => {
          if (err) {
            reject(err);
          } else {
            // Calculate total revenue, cost and profit
            const totalRevenue = items.reduce((sum, item) => sum + item.total_price, 0);
            const totalCost = items.reduce((sum, item) => sum + (item.cost_price * item.quantity), 0);
            const totalProfit = items.reduce((sum, item) => sum + item.profit, 0);
            
            // Group by item for item-wise profit analysis
            const itemProfits = {};
            items.forEach(item => {
              if (!itemProfits[item.item_id]) {
                itemProfits[item.item_id] = {
                  id: item.item_id,
                  name: item.name,
                  quantity: 0,
                  revenue: 0,
                  cost: 0,
                  profit: 0
                };
              }
              
              itemProfits[item.item_id].quantity += item.quantity;
              itemProfits[item.item_id].revenue += item.total_price;
              itemProfits[item.item_id].cost += (item.cost_price * item.quantity);
              itemProfits[item.item_id].profit += item.profit;
            });
            
            resolve({
              period,
              startDate: startDateStr,
              endDate: endDateStr,
              totalRevenue,
              totalCost,
              totalProfit,
              profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
              itemProfits: Object.values(itemProfits).sort((a, b) => b.profit - a.profit)
            });
          }
        }
      );
    });
  }

  close() {
    this.db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('Database connection closed.');
      }
    });
  }
}

module.exports = Database; 