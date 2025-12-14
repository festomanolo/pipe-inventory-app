/**
 * Reports Handler Module
 * Handles report generation, storage, and retrieval with real data from database
 */

const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const log = require('electron-log');
const Store = require('electron-store');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

// Import database modules - these will be injected from main process
let db = null;
let salesDb = null;
let store = null;

// Initialize database connections using the same instances as main process
function initializeDatabases(mainDb = null, mainSalesDb = null, mainStore = null) {
  if (mainDb) {
    db = mainDb;
    log.info('Using main process database instance for reports');
  }
  
  if (mainSalesDb) {
    salesDb = mainSalesDb;
    log.info('Using main process sales database instance for reports');
  }
  
  if (mainStore) {
    store = mainStore;
    log.info('Using main process store instance for reports');
  }
  
  // Fallback initialization if no instances provided
  if (!db) {
    try {
      db = require('../db/sqlite-db');
      log.info('SQLite database module loaded for reports');
    } catch (error) {
      log.warn('SQLite database not available, using fallback:', error.message);
      try {
        const { InventoryManager, SalesManager, SettingsManager } = require('../db/db');
        db = { InventoryManager, SalesManager, SettingsManager };
        log.info('Electron-store database module loaded for reports');
      } catch (fallbackError) {
        log.error('No database module available:', fallbackError.message);
      }
    }
  }
  
  if (!salesDb) {
    try {
      salesDb = require('../db/sales-db');
      log.info('Sales database module loaded for reports');
    } catch (error) {
      log.warn('Sales database not available:', error.message);
    }
  }
  
  if (!store) {
    try {
      const Store = require('electron-store');
      store = new Store();
      log.info('Created new store instance for reports');
    } catch (error) {
      log.error('Error creating store instance:', error);
    }
  }
}

/**
 * Get all reports from the store
 * @returns {Array} Array of report objects
 */
function getReports() {
  try {
    if (!store) {
      const Store = require('electron-store');
      store = new Store();
    }
    const reports = store.get('reports') || [];
    log.info(`Retrieved ${reports.length} reports from store`);
    return reports;
  } catch (error) {
    log.error('Error getting reports:', error);
    return [];
  }
}

/**
 * Get a report by ID
 * @param {string} reportId - The ID of the report to retrieve
 * @returns {Object|null} The report object or null if not found
 */
function getReportById(reportId) {
  try {
    if (!store) {
      const Store = require('electron-store');
      store = new Store();
    }
    const reports = store.get('reports') || [];
    const report = reports.find(r => r.id === reportId);
    
    if (!report) {
      log.warn(`Report with ID ${reportId} not found`);
      return null;
    }
    
    log.info(`Retrieved report with ID ${reportId}`);
    return report;
  } catch (error) {
    log.error(`Error getting report with ID ${reportId}:`, error);
    return null;
  }
}

/**
 * Add a new report
 * @param {Object} reportData - The report data to add
 * @returns {Object} The added report
 */
async function addReport(reportData) {
  try {
    log.info('Adding report with data:', JSON.stringify(reportData));
    
    // Initialize databases if not already done
    initializeDatabases();
    
    // Debug data access for troubleshooting
    debugDataAccess();
    
    // Validate report data
    if (!reportData || !reportData.type) {
      log.error('Invalid report data: missing type');
      throw new Error('Invalid report data: missing type');
    }
    
    const now = new Date();
    
    // Generate real report data based on type
    let reportContent = {};
    switch (reportData.type) {
      case 'inventory':
        reportContent = await generateInventoryReport(reportData.period);
        break;
      case 'sales':
        reportContent = await generateSalesReport(reportData.period);
        break;
      case 'profit':
        reportContent = await generateProfitReport(reportData.period);
        break;
      case 'customer':
        reportContent = await generateCustomerReport(reportData.period);
        break;
      case 'supplier':
        reportContent = await generateSupplierReport(reportData.period);
        break;
      default:
        reportContent = await generateInventoryReport(reportData.period);
    }
    
    // Create report object with real data
    const report = {
      id: `report-${uuidv4()}`,
      title: `${reportData.type.charAt(0).toUpperCase() + reportData.type.slice(1)} Report - ${getPeriodDescription(reportData.period)}`,
      type: reportData.type,
      date: now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      description: `${reportData.type.charAt(0).toUpperCase() + reportData.type.slice(1)} report for ${getPeriodDescription(reportData.period)}`,
      createdAt: now.toISOString(),
      period: reportData.period,
      format: reportData.format,
      ...reportContent
    };
    
    // Add to store
    if (!store) {
      const Store = require('electron-store');
      store = new Store();
    }
    const existingReports = store.get('reports') || [];
    existingReports.push(report);
    store.set('reports', existingReports);
    
    log.info(`Added new ${reportData.type} report with ID ${report.id}`);
    return report;
  } catch (error) {
    log.error('Error adding report:', error);
    throw error;
  }
}

/**
 * Generate an inventory report with real data
 * @param {string} period - The time period for the report
 * @returns {Object} The generated report data
 */
async function generateInventoryReport(period = 'all_time') {
  try {
    let inventory = [];
    let settings = { currencySymbol: 'TSh' };
    
    // Get real inventory data using the same method as main process
    console.log('🔍 Checking data sources...');
    console.log('   db available:', !!db);
    console.log('   db.getInventory:', typeof db?.getInventory);
    console.log('   db.getAllItems:', typeof db?.getAllItems);
    console.log('   db.InventoryManager:', !!db?.InventoryManager);
    console.log('   store available:', !!store);
    
    // Try multiple data sources in order of preference
    if (db && typeof db.getInventory === 'function') {
      try {
        // Using main process Database class
        inventory = await db.getInventory();
        log.info(`Retrieved ${inventory.length} items from main database for inventory report`);
        console.log('📊 Using main database, got', inventory.length, 'items');
      } catch (error) {
        log.warn('Error getting inventory from main database:', error.message);
        console.log('⚠️ Error getting inventory from main database, trying fallback...');
      }
    }
    
    // If still no data, try sqlite-db module
    if (!inventory || inventory.length === 0) {
      if (db && db.getAllItems) {
        try {
          inventory = await db.getAllItems();
          log.info(`Retrieved ${inventory.length} items from sqlite-db for inventory report`);
          console.log('📊 Using sqlite-db, got', inventory.length, 'items');
        } catch (error) {
          log.warn('Error getting inventory from sqlite-db:', error.message);
          console.log('⚠️ Error getting inventory from sqlite-db, trying fallback...');
        }
      }
    }
    
    // If still no data, try InventoryManager
    if (!inventory || inventory.length === 0) {
      if (db && db.InventoryManager) {
        try {
          inventory = db.InventoryManager.getAllItems();
          log.info(`Retrieved ${inventory.length} items from InventoryManager for inventory report`);
          console.log('📊 Using InventoryManager, got', inventory.length, 'items');
        } catch (error) {
          log.warn('Error getting inventory from InventoryManager:', error.message);
          console.log('⚠️ Error getting inventory from InventoryManager, trying fallback...');
        }
      }
    }
    
    // If still no data, try direct store access
    if (!inventory || inventory.length === 0) {
      if (store) {
        try {
          inventory = store.get('inventory') || [];
          log.info(`Retrieved ${inventory.length} items from store for inventory report`);
          console.log('📊 Using direct store access, got', inventory.length, 'items');
        } catch (error) {
          log.warn('Error getting inventory from store:', error.message);
          console.log('⚠️ Error getting inventory from store');
        }
      }
    }
    
    // If still no data, try reading from config.json as last resort
    if (!inventory || inventory.length === 0) {
      try {
        const configPath = path.join(process.cwd(), 'config.json');
        if (fs.existsSync(configPath)) {
          const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          inventory = configData.inventory || [];
          log.info(`Retrieved ${inventory.length} items from config.json for inventory report`);
          console.log('📊 Using config.json, got', inventory.length, 'items');
        }
      } catch (error) {
        log.warn('Error reading inventory from config.json:', error.message);
        console.log('⚠️ Error reading inventory from config.json');
      }
    }
    
    if (!inventory || inventory.length === 0) {
      console.error('❌ No inventory data found in any source!');
      log.error('No inventory data found in any source for inventory report');
      // Return empty report with zeros
      return {
        metrics: {
          'Total Items': '0',
          'Total Value': 'TSh 0',
          'Low Stock Items': '0',
          'Categories': '0'
        },
        stats: {
          totalItems: '0',
          totalValue: 'TSh 0',
          lowStockItems: '0',
          categories: '0'
        },
        charts: [],
        data: [],
        tableData: []
      };
    }
    
    // Get settings for currency
    if (db && db.getSettings) {
      try {
        const dbSettings = await db.getSettings();
        settings = { ...settings, ...dbSettings };
      } catch (error) {
        log.warn('Could not get settings:', error.message);
      }
    } else if (db && db.SettingsManager) {
      settings = { ...settings, ...db.SettingsManager.getSettings() };
    } else if (store) {
      const storeSettings = store.get('settings') || {};
      settings = { ...settings, ...storeSettings };
    }
    
    const currencySymbol = settings.currencySymbol || 'TSh';
    
    // Calculate inventory statistics
    let totalItems = 0;
    let totalValue = 0;
    let lowStockItems = 0;
    const categoryStats = {};
    const typeStats = {};
    
    log.info(`Processing ${inventory.length} inventory items for report`);
    
    if (inventory.length === 0) {
      log.warn('⚠️ No inventory items found - this will result in zeros!');
      console.log('⚠️ No inventory items found - this will result in zeros!');
    } else {
      log.info('📦 Sample inventory item:', JSON.stringify(inventory[0], null, 2));
      console.log('📦 Sample inventory item:', inventory[0]);
    }
    
    inventory.forEach(item => {
      // Handle different field name variations from different database sources
      const quantity = parseInt(item.quantity) || 0;
      const sellingPrice = parseFloat(item.price || item.selling_price) || 0;
      const costPrice = parseFloat(item.cost || item.cost_price || item.buying_price || item.buyingPrice) || 0;
      const itemValue = quantity * costPrice;
      
      totalItems += quantity;
      totalValue += itemValue;
      
      // Check for low stock
      const alertThreshold = parseInt(item.alertThreshold || item.alert_threshold || 10);
      if (quantity <= alertThreshold) {
        lowStockItems++;
      }
      
      // Category statistics - handle different field variations
      const category = item.category || item.type || 'Uncategorized';
      if (!categoryStats[category]) {
        categoryStats[category] = { count: 0, value: 0 };
      }
      categoryStats[category].count += quantity;
      categoryStats[category].value += itemValue;
      
      // Type statistics
      const type = item.type || 'Unknown';
      if (!typeStats[type]) {
        typeStats[type] = { count: 0, value: 0 };
      }
      typeStats[type].count += quantity;
      typeStats[type].value += itemValue;
    });
    
    log.info(`Calculated totals - Items: ${totalItems}, Value: ${totalValue}, Low Stock: ${lowStockItems}`);
    console.log('🧮 Final calculations:');
    console.log(`   Total Items: ${totalItems}`);
    console.log(`   Total Value: ${totalValue}`);
    console.log(`   Low Stock Items: ${lowStockItems}`);
    console.log(`   Categories: ${Object.keys(categoryStats).length}`);
    
    // Prepare chart data
    const categoryLabels = Object.keys(categoryStats);
    const categoryValues = categoryLabels.map(label => categoryStats[label].value);
    const categoryColors = generateColors(categoryLabels.length);
    
    // Prepare table data with proper field mapping
    const tableData = inventory.map(item => {
      const quantity = parseInt(item.quantity) || 0;
      const costPrice = parseFloat(item.cost || item.cost_price || item.buying_price || item.buyingPrice) || 0;
      const sellingPrice = parseFloat(item.price || item.selling_price) || 0;
      const totalValue = quantity * costPrice;
      const alertThreshold = parseInt(item.alertThreshold || item.alert_threshold || 10);
      
      return {
        'Item ID': item.id || 'N/A',
        'Description': item.description || item.name || 'N/A',
        'Type': item.type || 'N/A',
        'Category': item.category || 'N/A',
        'Brand': item.brand || 'N/A',
        'Quantity': quantity,
        'Unit Cost': `${currencySymbol} ${costPrice.toLocaleString()}`,
        'Selling Price': `${currencySymbol} ${sellingPrice.toLocaleString()}`,
        'Total Value': `${currencySymbol} ${totalValue.toLocaleString()}`,
        'Status': quantity <= alertThreshold ? 'Low Stock' : 'In Stock'
      };
    });
    
    return {
      // New format for compatibility with renderer
      metrics: {
        'Total Items': totalItems.toLocaleString(),
        'Total Value': `${currencySymbol} ${totalValue.toLocaleString()}`,
        'Low Stock Items': lowStockItems.toString(),
        'Categories': Object.keys(categoryStats).length.toString()
      },
      // Old format for backward compatibility
      stats: {
        totalItems: totalItems.toLocaleString(),
        totalValue: `${currencySymbol} ${totalValue.toLocaleString()}`,
        lowStockItems: lowStockItems.toString(),
        categories: Object.keys(categoryStats).length.toString()
      },
      charts: [{
        type: 'doughnut',
        data: {
          labels: categoryLabels,
          datasets: [{
            label: 'Inventory Value by Category',
            data: categoryValues,
            backgroundColor: categoryColors.background,
            borderColor: categoryColors.border,
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Inventory Value by Category',
              color: '#fff'
            },
            legend: {
              labels: {
                color: '#fff'
              }
            }
          }
        }
      }],
      data: tableData,
      tableData: tableData, // Duplicate for backward compatibility
      chartData: {
        labels: categoryLabels,
        datasets: [{
          label: 'Inventory Value by Category',
          data: categoryValues,
          backgroundColor: categoryColors.background,
          borderColor: categoryColors.border,
          borderWidth: 2
        }]
      }
    };
  } catch (error) {
    log.error('Error generating inventory report:', error);
    return {
      metrics: {
        'Total Items': '0',
        'Total Value': 'TSh 0',
        'Low Stock Items': '0',
        'Categories': '0'
      },
      stats: {
        totalItems: '0',
        totalValue: 'TSh 0',
        lowStockItems: '0',
        categories: '0'
      },
      charts: [],
      data: [],
      tableData: []
    };
  }
}

/**
 * Generate a sales report for a specific period with real data
 * @param {string} period - The time period for the report
 * @returns {Object} The generated report data
 */
async function generateSalesReport(period = 'this_month') {
  try {
    initializeDatabases();
    
    let sales = [];
    let settings = { currencySymbol: 'TSh' };
    
    // Get real sales data using the same robust fallback chain as inventory
    console.log('🔍 Checking sales data sources...');
    console.log('   salesDb available:', !!salesDb);
    console.log('   db available:', !!db);
    console.log('   store available:', !!store);
    
    // Try multiple data sources in order of preference
    if (salesDb && typeof salesDb.getAllSales === 'function') {
      try {
        sales = await salesDb.getAllSales();
        log.info(`Retrieved ${sales.length} sales from salesDb for sales report`);
        console.log('📊 Using salesDb, got', sales.length, 'sales');
      } catch (error) {
        log.warn('Error getting sales from salesDb:', error.message);
        console.log('⚠️ Error getting sales from salesDb, trying fallback...');
      }
    }
    
    // If still no data, try main database
    if (!sales || sales.length === 0) {
      if (db && typeof db.getAllSales === 'function') {
        try {
          sales = await db.getAllSales();
          log.info(`Retrieved ${sales.length} sales from main database for sales report`);
          console.log('📊 Using main database, got', sales.length, 'sales');
        } catch (error) {
          log.warn('Error getting sales from main database:', error.message);
          console.log('⚠️ Error getting sales from main database, trying fallback...');
        }
      }
    }
    
    // If still no data, try SalesManager
    if (!sales || sales.length === 0) {
      if (db && db.SalesManager) {
        try {
          sales = db.SalesManager.getAllSales();
          log.info(`Retrieved ${sales.length} sales from SalesManager for sales report`);
          console.log('📊 Using SalesManager, got', sales.length, 'sales');
        } catch (error) {
          log.warn('Error getting sales from SalesManager:', error.message);
          console.log('⚠️ Error getting sales from SalesManager, trying fallback...');
        }
      }
    }
    
    // If still no data, try direct store access
    if (!sales || sales.length === 0) {
      if (store) {
        try {
          sales = store.get('sales') || [];
          log.info(`Retrieved ${sales.length} sales from store for sales report`);
          console.log('📊 Using direct store access, got', sales.length, 'sales');
        } catch (error) {
          log.warn('Error getting sales from store:', error.message);
          console.log('⚠️ Error getting sales from store');
        }
      }
    }
    
    // If still no data, try reading from config.json as last resort
    if (!sales || sales.length === 0) {
      try {
        const configPath = path.join(process.cwd(), 'config.json');
        if (fs.existsSync(configPath)) {
          const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          sales = configData.sales || [];
          log.info(`Retrieved ${sales.length} sales from config.json for sales report`);
          console.log('📊 Using config.json, got', sales.length, 'sales');
        }
      } catch (error) {
        log.warn('Error reading sales from config.json:', error.message);
        console.log('⚠️ Error reading sales from config.json');
      }
    }
    
    if (!sales || sales.length === 0) {
      console.error('❌ No sales data found in any source!');
      log.error('No sales data found in any source for sales report');
      // Return empty report with zeros
      return {
        metrics: {
          'Total Revenue': 'TSh 0',
          'Total Transactions': '0',
          'Items Sold': '0',
          'Average Order': 'TSh 0'
        },
        stats: {
          totalSales: 'TSh 0',
          profitMargin: '0%',
          unitsSold: '0',
          avgOrder: 'TSh 0'
        },
        charts: [],
        data: [],
        tableData: []
      };
    }
    
    // Get settings for currency
    if (db && db.getSettings) {
      try {
        const dbSettings = await db.getSettings();
        settings = { ...settings, ...dbSettings };
      } catch (error) {
        log.warn('Could not get settings:', error.message);
      }
    } else if (db && db.SettingsManager) {
      settings = { ...settings, ...db.SettingsManager.getSettings() };
    }
    
    const currencySymbol = settings.currencySymbol || 'TSh';
    
    // Filter sales by period
    const { startDate, endDate } = getPeriodDates(period);
    const filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.date || sale.createdAt);
      return saleDate >= startDate && saleDate <= endDate;
    });
    
    // Calculate sales statistics
    let totalRevenue = 0;
    let totalItems = 0;
    let totalTransactions = filteredSales.length;
    const dailyRevenue = {};
    const customerStats = {};
    
    filteredSales.forEach(sale => {
      const revenue = parseFloat(sale.totalAmount || sale.total_amount) || 0;
      totalRevenue += revenue;
      
      // Count items
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach(item => {
          totalItems += parseInt(item.quantity) || 0;
        });
      }
      
      // Daily revenue tracking
      const saleDate = moment(sale.date || sale.createdAt).format('YYYY-MM-DD');
      if (!dailyRevenue[saleDate]) {
        dailyRevenue[saleDate] = 0;
      }
      dailyRevenue[saleDate] += revenue;
      
      // Customer statistics
      const customerName = sale.buyer?.name || sale.customer_name || 'Walk-in Customer';
      if (!customerStats[customerName]) {
        customerStats[customerName] = { transactions: 0, revenue: 0 };
      }
      customerStats[customerName].transactions++;
      customerStats[customerName].revenue += revenue;
    });
    
    const averageOrder = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    
    // Prepare chart data for daily revenue
    const dailyLabels = Object.keys(dailyRevenue).sort();
    const dailyValues = dailyLabels.map(date => dailyRevenue[date]);
    
    // Prepare table data
    const tableData = filteredSales.map(sale => ({
      'Date': moment(sale.date || sale.createdAt).format('DD/MM/YYYY'),
      'Invoice #': sale.invoiceNumber || sale.receipt_number || sale.id,
      'Customer': sale.buyer?.name || sale.customer_name || 'Walk-in Customer',
      'Items': sale.items ? sale.items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0) : 0,
      'Total': `${currencySymbol} ${parseFloat(sale.totalAmount || sale.total_amount || 0).toLocaleString()}`,
      'Payment Method': sale.paymentMethod || sale.payment_method || 'Cash',
      'Status': sale.status || 'Completed'
    }));
    
    return {
      // New format for compatibility with renderer
      metrics: {
        'Total Revenue': `${currencySymbol} ${totalRevenue.toLocaleString()}`,
        'Total Transactions': totalTransactions.toString(),
        'Items Sold': totalItems.toString(),
        'Average Order': `${currencySymbol} ${averageOrder.toLocaleString()}`
      },
      // Old format for backward compatibility
      stats: {
        totalSales: `${currencySymbol} ${totalRevenue.toLocaleString()}`,
        profitMargin: '0%', // Will be calculated in profit report
        unitsSold: totalItems.toString(),
        avgOrder: `${currencySymbol} ${averageOrder.toLocaleString()}`
      },
      charts: [{
        type: 'line',
        data: {
          labels: dailyLabels.map(date => moment(date).format('DD/MM')),
          datasets: [{
            label: 'Daily Revenue',
            data: dailyValues,
            borderColor: 'rgba(59, 130, 246, 1)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            fill: true
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Daily Revenue Trend',
              color: '#fff'
            },
            legend: {
              labels: {
                color: '#fff'
              }
            }
          },
          scales: {
            x: {
              ticks: {
                color: '#fff'
              }
            },
            y: {
              ticks: {
                color: '#fff'
              }
            }
          }
        }
      }],
      data: tableData,
      tableData: tableData, // Duplicate for backward compatibility
      chartData: {
        labels: dailyLabels.map(date => moment(date).format('DD/MM')),
        datasets: [{
          label: 'Daily Revenue',
          data: dailyValues,
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: true
        }]
      }
    };
  } catch (error) {
    log.error('Error generating sales report:', error);
    return {
      metrics: {
        'Total Revenue': 'TSh 0',
        'Total Transactions': '0',
        'Items Sold': '0',
        'Average Order': 'TSh 0'
      },
      charts: [],
      data: []
    };
  }
}

/**
 * Generate a profit report for a specific period with real data
 * @param {string} period - The time period for the report
 * @returns {Object} The generated report data
 */
async function generateProfitReport(period = 'this_month') {
  try {
    initializeDatabases();
    
    let sales = [];
    let inventory = [];
    let settings = { currencySymbol: 'TSh' };
    
    // Get real sales data using the same robust fallback chain
    console.log('🔍 Checking sales data sources for profit report...');
    console.log('   salesDb available:', !!salesDb);
    console.log('   db available:', !!db);
    console.log('   store available:', !!store);
    
    // Try multiple data sources for sales in order of preference
    if (salesDb && typeof salesDb.getAllSales === 'function') {
      try {
        sales = await salesDb.getAllSales();
        log.info(`Retrieved ${sales.length} sales from salesDb for profit report`);
        console.log('📊 Using salesDb for sales, got', sales.length, 'sales');
      } catch (error) {
        log.warn('Error getting sales from salesDb:', error.message);
        console.log('⚠️ Error getting sales from salesDb, trying fallback...');
      }
    }
    
    // If still no sales data, try main database
    if (!sales || sales.length === 0) {
      if (db && typeof db.getAllSales === 'function') {
        try {
          sales = await db.getAllSales();
          log.info(`Retrieved ${sales.length} sales from main database for profit report`);
          console.log('📊 Using main database for sales, got', sales.length, 'sales');
        } catch (error) {
          log.warn('Error getting sales from main database:', error.message);
          console.log('⚠️ Error getting sales from main database, trying fallback...');
        }
      }
    }
    
    // If still no sales data, try SalesManager
    if (!sales || sales.length === 0) {
      if (db && db.SalesManager) {
        try {
          sales = db.SalesManager.getAllSales();
          log.info(`Retrieved ${sales.length} sales from SalesManager for profit report`);
          console.log('📊 Using SalesManager for sales, got', sales.length, 'sales');
        } catch (error) {
          log.warn('Error getting sales from SalesManager:', error.message);
          console.log('⚠️ Error getting sales from SalesManager, trying fallback...');
        }
      }
    }
    
    // If still no sales data, try direct store access
    if (!sales || sales.length === 0) {
      if (store) {
        try {
          sales = store.get('sales') || [];
          log.info(`Retrieved ${sales.length} sales from store for profit report`);
          console.log('📊 Using direct store access for sales, got', sales.length, 'sales');
        } catch (error) {
          log.warn('Error getting sales from store:', error.message);
          console.log('⚠️ Error getting sales from store');
        }
      }
    }
    
    // If still no sales data, try reading from config.json as last resort
    if (!sales || sales.length === 0) {
      try {
        const configPath = path.join(process.cwd(), 'config.json');
        if (fs.existsSync(configPath)) {
          const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          sales = configData.sales || [];
          log.info(`Retrieved ${sales.length} sales from config.json for profit report`);
          console.log('📊 Using config.json for sales, got', sales.length, 'sales');
        }
      } catch (error) {
        log.warn('Error reading sales from config.json:', error.message);
        console.log('⚠️ Error reading sales from config.json');
      }
    }
    
    // Get real inventory data using the same robust fallback chain
    console.log('🔍 Checking inventory data sources for profit report...');
    
    // Try multiple data sources for inventory in order of preference
    if (db && typeof db.getInventory === 'function') {
      try {
        inventory = await db.getInventory();
        log.info(`Retrieved ${inventory.length} items from main database for profit report`);
        console.log('📊 Using main database for inventory, got', inventory.length, 'items');
      } catch (error) {
        log.warn('Error getting inventory from main database:', error.message);
        console.log('⚠️ Error getting inventory from main database, trying fallback...');
      }
    }
    
    // If still no inventory data, try sqlite-db module
    if (!inventory || inventory.length === 0) {
      if (db && db.getAllItems) {
        try {
          inventory = await db.getAllItems();
          log.info(`Retrieved ${inventory.length} items from sqlite-db for profit report`);
          console.log('📊 Using sqlite-db for inventory, got', inventory.length, 'items');
        } catch (error) {
          log.warn('Error getting inventory from sqlite-db:', error.message);
          console.log('⚠️ Error getting inventory from sqlite-db, trying fallback...');
        }
      }
    }
    
    // If still no inventory data, try InventoryManager
    if (!inventory || inventory.length === 0) {
      if (db && db.InventoryManager) {
        try {
          inventory = db.InventoryManager.getAllItems();
          log.info(`Retrieved ${inventory.length} items from InventoryManager for profit report`);
          console.log('📊 Using InventoryManager for inventory, got', inventory.length, 'items');
        } catch (error) {
          log.warn('Error getting inventory from InventoryManager:', error.message);
          console.log('⚠️ Error getting inventory from InventoryManager, trying fallback...');
        }
      }
    }
    
    // If still no inventory data, try direct store access
    if (!inventory || inventory.length === 0) {
      if (store) {
        try {
          inventory = store.get('inventory') || [];
          log.info(`Retrieved ${inventory.length} items from store for profit report`);
          console.log('📊 Using direct store access for inventory, got', inventory.length, 'items');
        } catch (error) {
          log.warn('Error getting inventory from store:', error.message);
          console.log('⚠️ Error getting inventory from store');
        }
      }
    }
    
    // If still no inventory data, try reading from config.json as last resort
    if (!inventory || inventory.length === 0) {
      try {
        const configPath = path.join(process.cwd(), 'config.json');
        if (fs.existsSync(configPath)) {
          const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          inventory = configData.inventory || [];
          log.info(`Retrieved ${inventory.length} items from config.json for profit report`);
          console.log('📊 Using config.json for inventory, got', inventory.length, 'items');
        }
      } catch (error) {
        log.warn('Error reading inventory from config.json:', error.message);
        console.log('⚠️ Error reading inventory from config.json');
      }
    }
    
    if (!sales || sales.length === 0) {
      console.error('❌ No sales data found in any source for profit report!');
      log.error('No sales data found in any source for profit report');
      // Return empty report with zeros
      return {
        metrics: {
          'Total Revenue': 'TSh 0',
          'Total Cost': 'TSh 0',
          'Total Profit': 'TSh 0',
          'Profit Margin': '0%'
        },
        charts: [],
        data: [],
        tableData: []
      };
    }
    
    // Get settings for currency
    if (db && db.getSettings) {
      try {
        const dbSettings = await db.getSettings();
        settings = { ...settings, ...dbSettings };
      } catch (error) {
        log.warn('Could not get settings:', error.message);
      }
    } else if (db && db.SettingsManager) {
      settings = { ...settings, ...db.SettingsManager.getSettings() };
    }
    
    const currencySymbol = settings.currencySymbol || 'TSh';
    
    // Filter sales by period
    const { startDate, endDate } = getPeriodDates(period);
    const filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.date || sale.createdAt);
      return saleDate >= startDate && saleDate <= endDate;
    });
    
    // Calculate profit statistics
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    const profitByCategory = {};
    const productProfitDetails = [];
    
    console.log(`📊 Processing ${filteredSales.length} sales for profit calculation...`);
    console.log(`📦 Available inventory items: ${inventory.length}`);
    
    filteredSales.forEach(sale => {
      const revenue = parseFloat(sale.totalAmount || sale.total_amount) || 0;
      totalRevenue += revenue;
      
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach(saleItem => {
          const quantity = parseInt(saleItem.quantity) || 0;
          const sellingPrice = parseFloat(saleItem.unit_price || saleItem.price || saleItem.selling_price) || 0;
          
          // Find the inventory item to get cost - try multiple matching strategies
          let inventoryItem = null;
          
          // Strategy 1: Match by product_id
          if (saleItem.product_id) {
            inventoryItem = inventory.find(item => item.id === saleItem.product_id);
          }
          
          // Strategy 2: Match by description/name (exact match)
          if (!inventoryItem && saleItem.product_name) {
            inventoryItem = inventory.find(item => 
              item.description === saleItem.product_name ||
              item.name === saleItem.product_name
            );
          }
          
          // Strategy 3: Match by description/name (partial match)
          if (!inventoryItem && saleItem.product_name) {
            inventoryItem = inventory.find(item => 
              item.description?.toLowerCase().includes(saleItem.product_name.toLowerCase()) ||
              item.name?.toLowerCase().includes(saleItem.product_name.toLowerCase())
            );
          }
          
          // Strategy 4: Match by price (if no other match found)
          if (!inventoryItem && saleItem.unit_price) {
            const price = parseFloat(saleItem.unit_price);
            inventoryItem = inventory.find(item => {
              const itemPrice = parseFloat(item.price || item.selling_price);
              return Math.abs(itemPrice - price) < 10; // Allow small price difference
            });
          }
          
          // Strategy 5: Use product name mapping from store
          if (!inventoryItem && saleItem.product_name && store) {
            try {
              const productNameMapping = store.get('productNameMapping') || {};
              const mappedId = productNameMapping[saleItem.product_name];
              if (mappedId) {
                inventoryItem = inventory.find(item => item.id === mappedId);
              }
            } catch (error) {
              log.warn('Error accessing product name mapping:', error.message);
            }
          }
          
          // Strategy 6: Match by itemId
          if (!inventoryItem && saleItem.itemId) {
            inventoryItem = inventory.find(item => item.id === saleItem.itemId);
          }
          
          // Strategy 7: Match by id
          if (!inventoryItem && saleItem.id) {
            inventoryItem = inventory.find(item => item.id === saleItem.id);
          }
          
          const costPrice = inventoryItem ? 
            (parseFloat(inventoryItem.cost || inventoryItem.cost_price || inventoryItem.buying_price) || 0) : 0;
          
          const itemCost = quantity * costPrice;
          const itemRevenue = quantity * sellingPrice;
          const itemProfit = itemRevenue - itemCost;
          
          totalCost += itemCost;
          totalProfit += itemProfit;
          
          // Category profit tracking
          const category = inventoryItem?.category || inventoryItem?.type || 'Pipes'; // Default to Pipes since most items are pipes
          if (!profitByCategory[category]) {
            profitByCategory[category] = { revenue: 0, cost: 0, profit: 0 };
          }
          profitByCategory[category].revenue += itemRevenue;
          profitByCategory[category].cost += itemCost;
          profitByCategory[category].profit += itemProfit;
          
          // Product profit details for table
          const productName = inventoryItem?.description || inventoryItem?.name || saleItem.product_name || 'Unknown Product';
          const productMargin = itemRevenue > 0 ? ((itemProfit / itemRevenue) * 100) : 0;
          
          productProfitDetails.push({
            'Product': productName,
            'Quantity': quantity,
            'Revenue': `${currencySymbol} ${itemRevenue.toLocaleString()}`,
            'Cost': `${currencySymbol} ${itemCost.toLocaleString()}`,
            'Profit': `${currencySymbol} ${itemProfit.toLocaleString()}`,
            'Margin': `${productMargin.toFixed(1)}%`
          });
          
          console.log(`   📦 ${productName}: ${quantity} units, Revenue: ${itemRevenue}, Cost: ${itemCost}, Profit: ${itemProfit}`);
        });
      }
    });
    
    const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100) : 0;
    
    // Prepare chart data
    const categoryLabels = Object.keys(profitByCategory);
    const categoryProfits = categoryLabels.map(label => profitByCategory[label].profit);
    const categoryColors = generateColors(categoryLabels.length);
    
    // Prepare table data - use product details instead of category summary
    const tableData = productProfitDetails.length > 0 ? productProfitDetails : categoryLabels.map(category => ({
      'Category': category,
      'Revenue': `${currencySymbol} ${profitByCategory[category].revenue.toLocaleString()}`,
      'Cost': `${currencySymbol} ${profitByCategory[category].cost.toLocaleString()}`,
      'Profit': `${currencySymbol} ${profitByCategory[category].profit.toLocaleString()}`,
      'Margin': `${profitByCategory[category].revenue > 0 ? ((profitByCategory[category].profit / profitByCategory[category].revenue) * 100).toFixed(1) : 0}%`
    }));
    
    return {
      metrics: {
        'Total Revenue': `${currencySymbol} ${totalRevenue.toLocaleString()}`,
        'Total Cost': `${currencySymbol} ${totalCost.toLocaleString()}`,
        'Total Profit': `${currencySymbol} ${totalProfit.toLocaleString()}`,
        'Profit Margin': `${profitMargin.toFixed(1)}%`
      },
      charts: [{
        type: 'bar',
        data: {
          labels: categoryLabels,
          datasets: [{
            label: 'Profit by Category',
            data: categoryProfits,
            backgroundColor: categoryColors.background,
            borderColor: categoryColors.border,
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Profit by Category',
              color: '#fff'
            },
            legend: {
              labels: {
                color: '#fff'
              }
            }
          },
          scales: {
            x: {
              ticks: {
                color: '#fff'
              }
            },
            y: {
              ticks: {
                color: '#fff'
              }
            }
          }
        }
      }],
      data: tableData
    };
  } catch (error) {
    log.error('Error generating profit report:', error);
    return {
      metrics: {
        'Total Revenue': 'TSh 0',
        'Total Cost': 'TSh 0',
        'Total Profit': 'TSh 0',
        'Profit Margin': '0%'
      },
      charts: [],
      data: []
    };
  }
}

/**
 * Generate a customer report with real data
 * @param {string} period - The time period for the report
 * @returns {Object} The generated report data
 */
async function generateCustomerReport(period = 'this_month') {
  try {
    initializeDatabases();
    
    let sales = [];
    let customers = [];
    let settings = { currencySymbol: 'TSh' };
    
    // Get real sales data using the same robust fallback chain
    console.log('🔍 Checking sales data sources for customer report...');
    console.log('   salesDb available:', !!salesDb);
    console.log('   db available:', !!db);
    console.log('   store available:', !!store);
    
    // Try multiple data sources for sales in order of preference
    if (salesDb && typeof salesDb.getAllSales === 'function') {
      try {
        sales = await salesDb.getAllSales();
        log.info(`Retrieved ${sales.length} sales from salesDb for customer report`);
        console.log('📊 Using salesDb for sales, got', sales.length, 'sales');
      } catch (error) {
        log.warn('Error getting sales from salesDb:', error.message);
        console.log('⚠️ Error getting sales from salesDb, trying fallback...');
      }
    }
    
    // If still no sales data, try main database
    if (!sales || sales.length === 0) {
      if (db && typeof db.getAllSales === 'function') {
        try {
          sales = await db.getAllSales();
          log.info(`Retrieved ${sales.length} sales from main database for customer report`);
          console.log('📊 Using main database for sales, got', sales.length, 'sales');
        } catch (error) {
          log.warn('Error getting sales from main database:', error.message);
          console.log('⚠️ Error getting sales from main database, trying fallback...');
        }
      }
    }
    
    // If still no sales data, try SalesManager
    if (!sales || sales.length === 0) {
      if (db && db.SalesManager) {
        try {
          sales = db.SalesManager.getAllSales();
          log.info(`Retrieved ${sales.length} sales from SalesManager for customer report`);
          console.log('📊 Using SalesManager for sales, got', sales.length, 'sales');
        } catch (error) {
          log.warn('Error getting sales from SalesManager:', error.message);
          console.log('⚠️ Error getting sales from SalesManager, trying fallback...');
        }
      }
    }
    
    // If still no sales data, try direct store access
    if (!sales || sales.length === 0) {
      if (store) {
        try {
          sales = store.get('sales') || [];
          log.info(`Retrieved ${sales.length} sales from store for customer report`);
          console.log('📊 Using direct store access for sales, got', sales.length, 'sales');
        } catch (error) {
          log.warn('Error getting sales from store:', error.message);
          console.log('⚠️ Error getting sales from store');
        }
      }
    }
    
    // If still no sales data, try reading from config.json as last resort
    if (!sales || sales.length === 0) {
      try {
        const configPath = path.join(process.cwd(), 'config.json');
        if (fs.existsSync(configPath)) {
          const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          sales = configData.sales || [];
          log.info(`Retrieved ${sales.length} sales from config.json for customer report`);
          console.log('📊 Using config.json for sales, got', sales.length, 'sales');
        }
      } catch (error) {
        log.warn('Error reading sales from config.json:', error.message);
        console.log('⚠️ Error reading sales from config.json');
      }
    }
    
    if (db && db.getAllCustomers) {
      customers = await db.getAllCustomers();
    } else if (db && db.CustomersManager) {
      customers = db.CustomersManager.getAllCustomers();
    }
    
    // If still no customer data, try reading from config.json as last resort
    if (!customers || customers.length === 0) {
      try {
        const configPath = path.join(process.cwd(), 'config.json');
        if (fs.existsSync(configPath)) {
          const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          customers = configData.customers || [];
          log.info(`Retrieved ${customers.length} customers from config.json for customer report`);
          console.log('📊 Using config.json for customers, got', customers.length, 'customers');
        }
      } catch (error) {
        log.warn('Error reading customers from config.json:', error.message);
        console.log('⚠️ Error reading customers from config.json');
      }
    }
    
    // Get settings for currency
    if (db && db.getSettings) {
      try {
        const dbSettings = await db.getSettings();
        settings = { ...settings, ...dbSettings };
      } catch (error) {
        log.warn('Could not get settings:', error.message);
      }
    } else if (db && db.SettingsManager) {
      settings = { ...settings, ...db.SettingsManager.getSettings() };
    }
    
    const currencySymbol = settings.currencySymbol || 'TSh';
    
    // Filter sales by period
    const { startDate, endDate } = getPeriodDates(period);
    const filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.date || sale.createdAt);
      return saleDate >= startDate && saleDate <= endDate;
    });
    
    // Calculate customer statistics
    const customerStats = {};
    let totalCustomers = 0;
    let totalRevenue = 0;
    
    filteredSales.forEach(sale => {
      const revenue = parseFloat(sale.totalAmount || sale.total_amount) || 0;
      totalRevenue += revenue;
      
      const customerName = sale.buyer?.name || sale.customer_name || 'Walk-in Customer';
      const customerId = sale.buyer?.id || sale.customer_id || customerName;
      
      if (!customerStats[customerId]) {
        customerStats[customerId] = {
          name: customerName,
          transactions: 0,
          revenue: 0,
          items: 0,
          lastPurchase: null
        };
        totalCustomers++;
      }
      
      customerStats[customerId].transactions++;
      customerStats[customerId].revenue += revenue;
      
      // Count items
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach(item => {
          customerStats[customerId].items += parseInt(item.quantity) || 0;
        });
      }
      
      // Track last purchase
      const saleDate = new Date(sale.date || sale.createdAt);
      if (!customerStats[customerId].lastPurchase || saleDate > new Date(customerStats[customerId].lastPurchase)) {
        customerStats[customerId].lastPurchase = saleDate.toISOString();
      }
    });
    
    // Sort customers by revenue
    const sortedCustomers = Object.values(customerStats).sort((a, b) => b.revenue - a.revenue);
    const topCustomers = sortedCustomers.slice(0, 10);
    
    const averageOrderValue = totalCustomers > 0 ? totalRevenue / filteredSales.length : 0;
    
    // Prepare chart data
    const customerLabels = topCustomers.map(customer => customer.name);
    const customerRevenues = topCustomers.map(customer => customer.revenue);
    const customerColors = generateColors(customerLabels.length);
    
    // Prepare table data
    const tableData = sortedCustomers.map((customer, index) => ({
      'Rank': (index + 1).toString(),
      'Customer Name': customer.name,
      'Transactions': customer.transactions.toString(),
      'Total Revenue': `${currencySymbol} ${customer.revenue.toLocaleString()}`,
      'Items Purchased': customer.items.toString(),
      'Average Order': `${currencySymbol} ${(customer.revenue / customer.transactions).toLocaleString()}`,
      'Last Purchase': customer.lastPurchase ? moment(customer.lastPurchase).format('DD/MM/YYYY') : 'N/A'
    }));
    
    // Prepare top customers data for frontend
    const topCustomersData = sortedCustomers.slice(0, 10).map(customer => ({
      name: customer.name,
      business: customer.name, // Use name as business fallback
      totalPurchases: customer.revenue,
      purchaseCount: customer.transactions
    }));
    
    // Calculate customer types from the customers data if available
    let customerTypes = [];
    if (customers && customers.length > 0) {
      const typeStats = {};
      customers.forEach(customer => {
        const type = customer.type || 'regular';
        if (!typeStats[type]) {
          typeStats[type] = 0;
        }
        typeStats[type]++;
      });
      
      customerTypes = Object.entries(typeStats).map(([type, count]) => ({
        name: type.charAt(0).toUpperCase() + type.slice(1),
        count: count,
        percentage: ((count / customers.length) * 100).toFixed(1)
      }));
    } else {
      // Fallback: analyze customer types from sales data
      const typeStats = { 'Premium': 0, 'Regular': 0 };
      sortedCustomers.forEach(customer => {
        if (customer.revenue > 500000) {
          typeStats['Premium']++;
        } else {
          typeStats['Regular']++;
        }
      });
      
      customerTypes = Object.entries(typeStats).map(([type, count]) => ({
        name: type,
        count: count,
        percentage: totalCustomers > 0 ? ((count / totalCustomers) * 100).toFixed(1) : '0'
      }));
    }
    
    return {
      metrics: {
        'Total Customers': totalCustomers.toString(),
        'Total Revenue': `${currencySymbol} ${totalRevenue.toLocaleString()}`,
        'Average Order Value': `${currencySymbol} ${averageOrderValue.toLocaleString()}`,
        'Repeat Customers': sortedCustomers.filter(c => c.transactions > 1).length.toString()
      },
      charts: [{
        type: 'bar',
        data: {
          labels: customerLabels,
          datasets: [{
            label: 'Revenue by Top Customers',
            data: customerRevenues,
            backgroundColor: customerColors.background,
            borderColor: customerColors.border,
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Top 10 Customers by Revenue',
              color: '#fff'
            },
            legend: {
              labels: {
                color: '#fff'
              }
            }
          },
          scales: {
            x: {
              ticks: {
                color: '#fff'
              }
            },
            y: {
              ticks: {
                color: '#fff'
              }
            }
          }
        }
      }],
      topCustomers: topCustomersData,
      customerTypes: customerTypes,
      data: tableData
    };
  } catch (error) {
    log.error('Error generating customer report:', error);
    return {
      metrics: {
        'Total Customers': '0',
        'Total Revenue': 'TSh 0',
        'Average Order Value': 'TSh 0',
        'Repeat Customers': '0'
      },
      charts: [],
      data: []
    };
  }
}

/**
 * Generate a supplier report with real data
 * @param {string} period - The time period for the report
 * @returns {Object} The generated report data
 */
async function generateSupplierReport(period = 'all_time') {
  try {
    initializeDatabases();
    
    let inventory = [];
    let settings = { currencySymbol: 'TSh' };
    
    // Get real inventory data
    if (db && db.getAllItems) {
      inventory = await db.getAllItems();
    } else if (db && db.InventoryManager) {
      inventory = db.InventoryManager.getAllItems();
    }
    
    // Get settings for currency
    if (db && db.getSettings) {
      try {
        const dbSettings = await db.getSettings();
        settings = { ...settings, ...dbSettings };
      } catch (error) {
        log.warn('Could not get settings:', error.message);
      }
    } else if (db && db.SettingsManager) {
      settings = { ...settings, ...db.SettingsManager.getSettings() };
    }
    
    const currencySymbol = settings.currencySymbol || 'TSh';
    
    // Calculate supplier statistics
    const supplierStats = {};
    let totalSuppliers = 0;
    let totalValue = 0;
    
    inventory.forEach(item => {
      const quantity = parseInt(item.quantity) || 0;
      const cost = parseFloat(item.cost || item.cost_price || item.buying_price) || 0;
      const itemValue = quantity * cost;
      totalValue += itemValue;
      
      const supplier = item.supplier || item.brand || 'Unknown Supplier';
      
      if (!supplierStats[supplier]) {
        supplierStats[supplier] = {
          name: supplier,
          items: 0,
          totalQuantity: 0,
          totalValue: 0,
          categories: new Set()
        };
        totalSuppliers++;
      }
      
      supplierStats[supplier].items++;
      supplierStats[supplier].totalQuantity += quantity;
      supplierStats[supplier].totalValue += itemValue;
      supplierStats[supplier].categories.add(item.category || item.type || 'Uncategorized');
    });
    
    // Convert Set to array length for categories
    Object.values(supplierStats).forEach(supplier => {
      supplier.categories = supplier.categories.size;
    });
    
    // Sort suppliers by value
    const sortedSuppliers = Object.values(supplierStats).sort((a, b) => b.totalValue - a.totalValue);
    const topSuppliers = sortedSuppliers.slice(0, 10);
    
    // Prepare chart data
    const supplierLabels = topSuppliers.map(supplier => supplier.name);
    const supplierValues = topSuppliers.map(supplier => supplier.totalValue);
    const supplierColors = generateColors(supplierLabels.length);
    
    // Prepare table data
    const tableData = sortedSuppliers.map((supplier, index) => ({
      'Rank': (index + 1).toString(),
      'Supplier Name': supplier.name,
      'Items': supplier.items.toString(),
      'Total Quantity': supplier.totalQuantity.toString(),
      'Total Value': `${currencySymbol} ${supplier.totalValue.toLocaleString()}`,
      'Categories': supplier.categories.toString(),
      'Average Item Value': `${currencySymbol} ${(supplier.totalValue / supplier.items).toLocaleString()}`
    }));
    
    return {
      metrics: {
        'Total Suppliers': totalSuppliers.toString(),
        'Total Inventory Value': `${currencySymbol} ${totalValue.toLocaleString()}`,
        'Average per Supplier': `${currencySymbol} ${totalSuppliers > 0 ? (totalValue / totalSuppliers).toLocaleString() : '0'}`,
        'Top Supplier Share': totalValue > 0 && sortedSuppliers.length > 0 ? 
          `${((sortedSuppliers[0].totalValue / totalValue) * 100).toFixed(1)}%` : '0%'
      },
      charts: [{
        type: 'doughnut',
        data: {
          labels: supplierLabels,
          datasets: [{
            label: 'Inventory Value by Supplier',
            data: supplierValues,
            backgroundColor: supplierColors.background,
            borderColor: supplierColors.border,
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Top 10 Suppliers by Inventory Value',
              color: '#fff'
            },
            legend: {
              labels: {
                color: '#fff'
              }
            }
          }
        }
      }],
      data: tableData
    };
  } catch (error) {
    log.error('Error generating supplier report:', error);
    return {
      metrics: {
        'Total Suppliers': '0',
        'Total Inventory Value': 'TSh 0',
        'Average per Supplier': 'TSh 0',
        'Top Supplier Share': '0%'
      },
      charts: [],
      data: []
    };
  }
}

/**
 * Get start and end dates for a specified period
 * @param {string} period - Period identifier (today, this_week, etc.)
 * @returns {Object} Object with startDate and endDate
 */
function getPeriodDates(period) {
  const now = new Date();
  let startDate, endDate = now;
  
  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'yesterday':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
      break;
    case 'this_week':
      const dayOfWeek = now.getDay();
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
      break;
    case 'last_week':
      const lastWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() - 7);
      const lastWeekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() - 1, 23, 59, 59);
      startDate = lastWeekStart;
      endDate = lastWeekEnd;
      break;
    case 'this_month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'last_month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      break;
    case 'this_year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case 'all_time':
    default:
      startDate = new Date(2020, 0, 1); // Start from 2020
      break;
  }
  
  return { startDate, endDate };
}

/**
 * Generate colors for charts
 * @param {number} count - Number of colors needed
 * @returns {Object} Object with background and border color arrays
 */
function generateColors(count) {
  const baseColors = [
    'rgba(59, 130, 246, 0.7)',   // Blue
    'rgba(16, 185, 129, 0.7)',   // Green
    'rgba(245, 158, 11, 0.7)',   // Yellow
    'rgba(239, 68, 68, 0.7)',    // Red
    'rgba(139, 92, 246, 0.7)',   // Purple
    'rgba(236, 72, 153, 0.7)',   // Pink
    'rgba(6, 182, 212, 0.7)',    // Cyan
    'rgba(34, 197, 94, 0.7)',    // Emerald
    'rgba(251, 146, 60, 0.7)',   // Orange
    'rgba(168, 85, 247, 0.7)'    // Violet
  ];
  
  const borderColors = [
    'rgba(59, 130, 246, 1)',
    'rgba(16, 185, 129, 1)',
    'rgba(245, 158, 11, 1)',
    'rgba(239, 68, 68, 1)',
    'rgba(139, 92, 246, 1)',
    'rgba(236, 72, 153, 1)',
    'rgba(6, 182, 212, 1)',
    'rgba(34, 197, 94, 1)',
    'rgba(251, 146, 60, 1)',
    'rgba(168, 85, 247, 1)'
  ];
  
  const background = [];
  const border = [];
  
  for (let i = 0; i < count; i++) {
    background.push(baseColors[i % baseColors.length]);
    border.push(borderColors[i % borderColors.length]);
  }
  
  return { background, border };
}

/**
 * Get a human-readable description of a time period
 * @param {string} period - Period identifier
 * @returns {string} Human-readable period description
 */
function getPeriodDescription(period) {
  switch (period) {
    case 'today': return 'Today';
    case 'yesterday': return 'Yesterday';
    case 'this_week': return 'This Week';
    case 'last_week': return 'Last Week';
    case 'this_month': return 'This Month';
    case 'last_month': return 'Last Month';
    case 'this_year': return 'This Year';
    case 'all_time': return 'All Time';
    default: return period;
  }
}

// Add debug function to test data access
function debugDataAccess() {
  console.log('🔍 DEBUG: Testing data access in reports handler...');
  console.log('   db:', !!db);
  console.log('   store:', !!store);
  
  if (db) {
    console.log('   db.getInventory:', typeof db.getInventory);
    console.log('   db.getAllItems:', typeof db.getAllItems);
    console.log('   db.InventoryManager:', !!db.InventoryManager);
  }
  
  if (store) {
    try {
      const inventory = store.get('inventory') || [];
      console.log('   store inventory count:', inventory.length);
      if (inventory.length > 0) {
        console.log('   sample inventory item:', inventory[0]);
      }
    } catch (error) {
      console.log('   store access error:', error.message);
    }
  }
  
  // Try to read from config.json
  try {
    const configPath = path.join(process.cwd(), 'config.json');
    if (fs.existsSync(configPath)) {
      const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      console.log('   config.json inventory count:', configData.inventory?.length || 0);
      if (configData.inventory && configData.inventory.length > 0) {
        console.log('   sample config inventory item:', configData.inventory[0]);
      }
    } else {
      console.log('   config.json not found');
    }
  } catch (error) {
    console.log('   config.json access error:', error.message);
  }
}

module.exports = {
  getReports,
  getReportById,
  addReport,
  generateInventoryReport,
  generateSalesReport,
  generateProfitReport,
  generateCustomerReport,
  generateSupplierReport,
  getPeriodDates,
  initializeDatabases,
  debugDataAccess
};