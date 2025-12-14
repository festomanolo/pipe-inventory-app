/**
 * Reports Data Handler
 * Provides functions to fetch and process real data from the Electron store
 */

// Direct access to electron-store through IPC
async function getDirectStoreData(key) {
  try {
    if (window.electron && window.electron.ipcRenderer) {
      console.log(`Directly accessing electron-store for key: ${key}`);
      const result = await window.electron.ipcRenderer.invoke('get-store-value', key);
      console.log(`Retrieved from electron-store key ${key}:`, result ? (Array.isArray(result) ? result.length + ' items' : 'data') : 'null');
      return result;
    }
    return null;
  } catch (error) {
    console.error(`Error accessing electron-store for key ${key}:`, error);
    return null;
  }
}

// Debug function to understand what's in the electron store
async function debugElectronStore() {
  try {
    if (window.electron && window.electron.ipcRenderer) {
      console.log('Debugging electron store contents...');
      const result = await window.electron.ipcRenderer.invoke('debug-store-keys');
      console.log('Electron store debug result:', result);
      
      if (result.keys && result.keys.length > 0) {
        console.log('Available keys in the store:', result.keys.join(', '));
        console.log('Counts:', result.counts);
        
        // Check specific keys we're interested in
        const keysToCheck = ['inventory', 'items', 'inventoryItems', 'sales'];
        keysToCheck.forEach(key => {
          if (result.keys.includes(key)) {
            console.log(`Key '${key}' exists with ${result.counts[key]} items`);
          } else {
            console.log(`Key '${key}' does not exist in the store`);
          }
        });
      } else {
        console.log('No keys found in the electron store');
      }
      
      return result;
    }
    console.warn('electron.ipcRenderer not available for debugging');
    return null;
  } catch (error) {
    console.error('Error debugging electron store:', error);
    return null;
  }
}

// Function to fetch report data from electron store
async function fetchReportsData() {
  try {
    console.log('Fetching report data from electron store');
    
    // Debug the electron store to understand what data is available
    await debugElectronStore();
    
    // Check what APIs are available in the window object
    console.log('Available APIs:');
    console.log('- window.electron:', !!window.electron);
    console.log('- window.electronAPI:', !!window.electronAPI);
    console.log('- window.SalesHandlers:', !!window.SalesHandlers);
    
    let salesData = [];
    let inventoryData = [];
    
    // PRIORITY APPROACH 1: Direct access to inventory data via same API as inventory.html page
    if (!inventoryData.length && window.electronAPI && typeof window.electronAPI.getInventory === 'function') {
      try {
        console.log('Using direct electronAPI.getInventory() - same as inventory.html page');
        inventoryData = await window.electronAPI.getInventory();
        console.log(`Retrieved ${inventoryData ? inventoryData.length : 0} inventory items via electronAPI.getInventory()`);
        
        if (inventoryData && inventoryData.length > 0) {
          console.log('Sample inventory item:', inventoryData[0]);
        }
      } catch (error) {
        console.error('Error fetching inventory data via electronAPI.getInventory():', error);
      }
    }
    
    // PRIORITY APPROACH 2: Direct electron-store access via IPC
    if (!inventoryData.length) {
      try {
        console.log('Attempting direct electron-store access for inventory');
        
        // Direct access to inventory data - try all known keys
        const directInventory = await getDirectStoreData('inventory');
        if (directInventory && Array.isArray(directInventory) && directInventory.length > 0) {
          console.log(`Found ${directInventory.length} inventory items directly in electron-store`);
          console.log('First inventory item:', directInventory[0]);
          inventoryData = directInventory;
        }
      } catch (error) {
        console.error('Error with direct electron-store access for inventory:', error);
      }
    }
    
    // PRIORITY APPROACH 3: Try SalesHandlers methods
    if (!inventoryData.length && window.SalesHandlers) {
      try {
        console.log('Trying SalesHandlers.getInventoryItems()');
        
        if (typeof window.SalesHandlers.getInventoryItems === 'function') {
          inventoryData = await window.SalesHandlers.getInventoryItems();
          console.log(`Retrieved ${inventoryData ? inventoryData.length : 0} inventory items via SalesHandlers`);
        }
      } catch (error) {
        console.error('Error with SalesHandlers methods for inventory:', error);
      }
    }
    
    // PRIORITY APPROACH 4: Last resort - try using ipcRenderer directly
    if (!inventoryData.length && window.electron && window.electron.ipcRenderer) {
      try {
        console.log('Using ipcRenderer.invoke("get-inventory")');
        inventoryData = await window.electron.ipcRenderer.invoke('get-inventory');
        console.log(`Retrieved ${inventoryData ? inventoryData.length : 0} inventory items via IPC`);
      } catch (error) {
        console.error('Error fetching inventory via IPC:', error);
      }
    }
    
    // Get sales data using similar approaches
    
    // APPROACH 1: Direct electron-store access via IPC
    try {
      console.log('Attempting direct electron-store access for sales');
      const directSales = await getDirectStoreData('sales');
      if (directSales && Array.isArray(directSales) && directSales.length > 0) {
        console.log(`Found ${directSales.length} sales records directly in electron-store`);
        console.log('First sales record:', directSales[0]);
        salesData = directSales;
      }
    } catch (error) {
      console.error('Error with direct electron-store access for sales:', error);
    }
    
    // APPROACH 2: Try electronAPI methods if available
    if (!salesData.length && window.electronAPI) {
      try {
        if (typeof window.electronAPI.getSales === 'function') {
          console.log('Using electronAPI.getSales()');
          salesData = await window.electronAPI.getSales();
          console.log(`Retrieved ${salesData ? salesData.length : 0} sales records via electronAPI`);
        }
      } catch (error) {
        console.error('Error with electronAPI methods for sales:', error);
      }
    }
    
    // APPROACH 3: Try SalesHandlers methods
    if (!salesData.length && window.SalesHandlers) {
      try {
        if (typeof window.SalesHandlers.getAllSales === 'function') {
          console.log('Using SalesHandlers.getAllSales()');
          salesData = await window.SalesHandlers.getAllSales();
          console.log(`Retrieved ${salesData ? salesData.length : 0} sales records via SalesHandlers`);
        }
      } catch (error) {
        console.error('Error with SalesHandlers methods for sales:', error);
      }
    }
    
    // APPROACH 4: Try using ipcRenderer directly
    if (!salesData.length && window.electron && window.electron.ipcRenderer) {
      try {
        console.log('Using ipcRenderer.invoke("get-all-sales")');
        salesData = await window.electron.ipcRenderer.invoke('get-all-sales');
        if (!salesData || salesData.length === 0) {
          console.log('Falling back to get-sales');
          salesData = await window.electron.ipcRenderer.invoke('get-sales');
        }
      } catch (error) {
        console.error('Error fetching sales via IPC:', error);
      }
    }
    
    // Process inventory data to ensure consistent format
    if (inventoryData.length > 0) {
      // Ensure all inventory items have required fields
      inventoryData = inventoryData.map(item => {
        const processedItem = { ...item };
        // Ensure quantity is a number
        if (processedItem.quantity === undefined || processedItem.quantity === null) {
          processedItem.quantity = 0;
        } else if (typeof processedItem.quantity === 'string') {
          processedItem.quantity = parseFloat(processedItem.quantity) || 0;
        }
        
        // Ensure price/cost is a number
        if (processedItem.price === undefined && processedItem.cost === undefined) {
          processedItem.price = 0;
        } else if (typeof processedItem.price === 'string') {
          processedItem.price = parseFloat(processedItem.price) || 0;
        } else if (typeof processedItem.cost === 'string' && processedItem.price === undefined) {
          processedItem.price = parseFloat(processedItem.cost) || 0;
        }
        
        // Ensure category exists
        if (!processedItem.category) {
          processedItem.category = 'Uncategorized';
        }
        
        return processedItem;
      });
    }
    
    // Process sales data if available
    if (salesData.length > 0) {
      // Ensure all sales have a date
      salesData = salesData.map(sale => {
        if (!sale.date && !sale.created_at) {
          // Add a date if missing
          return { ...sale, date: new Date().toISOString() };
        }
        return sale;
      });
    }
    
    // Log final status
    console.log('Data retrieval complete:');
    console.log('- Sales records:', salesData ? salesData.length : 0);
    console.log('- Inventory items:', inventoryData ? inventoryData.length : 0);
    
    // Return the data
    return {
      sales: salesData || [],
      inventory: inventoryData || []
    };
  } catch (error) {
    console.error('Error fetching data from electron store:', error);
    return { sales: [], inventory: [] };
  }
}

// Function to generate sales report with real data
function generateSalesReport(salesData, period) {
  if (!salesData || !salesData.length) {
    console.warn('No sales data available for report');
    return null;
  }
  
  console.log(`Generating sales report with ${salesData.length} records`);
  console.log('Sample sales record:', JSON.stringify(salesData[0]));
  
  // Filter by period if needed
  const { startDate, endDate } = getDateRangeForPeriod(period);
  console.log('Filtering sales data by period:', { 
    period,
    startDate: startDate.toISOString(), 
    endDate: endDate.toISOString() 
  });
  
  const filteredSales = salesData.filter(sale => {
    const saleDate = new Date(sale.date || sale.created_at || Date.now());
    return saleDate >= startDate && saleDate <= endDate;
  });
  
  console.log(`After filtering: ${filteredSales.length} records remain`);
  
  if (!filteredSales.length) {
    console.warn('No sales data available for the selected period');
    return null;
  }
  
  // Calculate metrics
  const totalSales = filteredSales.reduce((sum, sale) => sum + (parseFloat(sale.total_amount) || 0), 0);
  const totalTransactions = filteredSales.length;
  const avgOrder = totalTransactions > 0 ? totalSales / totalTransactions : 0;
  
  // Find most recent date
  filteredSales.sort((a, b) => {
    const dateA = new Date(a.date || a.created_at || 0);
    const dateB = new Date(b.date || b.created_at || 0);
    return dateB - dateA;
  });
  const latestDate = new Date(filteredSales[0].date || filteredSales[0].created_at || Date.now());
  
  console.log('Report metrics:', {
    totalSales,
    totalTransactions,
    avgOrder,
    latestDate: latestDate.toISOString()
  });
  
  // Generate report object
  return {
    id: 'sales-' + Date.now(),
    title: 'Sales Overview',
    type: 'sales',
    description: `${totalTransactions} transactions, $${totalSales.toFixed(2)} total`,
    date: latestDate.toISOString().split('T')[0],
    period: period,
    data: {
      sales: filteredSales,
      stats: {
        totalSales: totalSales,
        totalTransactions: totalTransactions,
        avgOrder: avgOrder,
        growth: 0 // Would need historical data to calculate
      }
    }
  };
}

// Function to generate inventory report with real data
function generateInventoryReport(inventoryData) {
  if (!inventoryData || !inventoryData.length) {
    console.warn('No inventory data available for report');
    return null;
  }
  
  console.log(`Generating inventory report with ${inventoryData.length} items`);
  console.log('Sample inventory item:', JSON.stringify(inventoryData[0]));
  
  // Calculate inventory metrics
  const totalItems = inventoryData.length;
  
  // Calculate total value - handle different property names
  const totalValue = inventoryData.reduce((sum, item) => {
    const quantity = parseFloat(item.quantity) || 0;
    // Check different possible price/cost fields
    let price = 0;
    if (item.price !== undefined) {
      price = parseFloat(item.price) || 0;
    } else if (item.cost !== undefined) {
      price = parseFloat(item.cost) || 0;
    } else if (item.cost_price !== undefined) {
      price = parseFloat(item.cost_price) || 0;
    } else if (item.sell_price !== undefined) {
      // Use sell_price as fallback if no cost price
      price = parseFloat(item.sell_price) || 0;
    }
    return sum + (quantity * price);
  }, 0);
  
  // Count low stock items - handle different threshold properties
  const lowStockItems = inventoryData.filter(item => {
    const quantity = parseFloat(item.quantity) || 0;
    // Check different possible threshold fields
    let threshold = 10; // Default threshold
    if (item.alert_threshold !== undefined) {
      threshold = parseFloat(item.alert_threshold) || 10;
    } else if (item.threshold !== undefined) {
      threshold = parseFloat(item.threshold) || 10;
    } else if (item.min_quantity !== undefined) {
      threshold = parseFloat(item.min_quantity) || 10;
    }
    return quantity <= threshold;
  });
  
  // Extract categories - handle different category fields
  const categories = [...new Set(inventoryData.map(item => {
    // Check different possible category fields
    if (item.category) {
      return item.category;
    } else if (item.category_name) {
      return item.category_name;
    } else if (item.type) {
      return item.type;
    } else {
      return 'Uncategorized';
    }
  }))];
  
  // Group items by category for detailed reporting
  const categoryData = {};
  inventoryData.forEach(item => {
    // Determine category
    let category = 'Uncategorized';
    if (item.category) {
      category = item.category;
    } else if (item.category_name) {
      category = item.category_name;
    } else if (item.type) {
      category = item.type;
    }
    
    // Initialize category if not exists
    if (!categoryData[category]) {
      categoryData[category] = {
        name: category,
        count: 0,
        value: 0,
        items: []
      };
    }
    
    // Add item to category count
    categoryData[category].count++;
    
    // Add item value to category value
    const quantity = parseFloat(item.quantity) || 0;
    let price = 0;
    if (item.price !== undefined) {
      price = parseFloat(item.price) || 0;
    } else if (item.cost !== undefined) {
      price = parseFloat(item.cost) || 0;
    } else if (item.cost_price !== undefined) {
      price = parseFloat(item.cost_price) || 0;
    } else if (item.sell_price !== undefined) {
      price = parseFloat(item.sell_price) || 0;
    }
    categoryData[category].value += (quantity * price);
    
    // Add item to category items list (limit to save space)
    if (categoryData[category].items.length < 20) {
      categoryData[category].items.push({
        id: item.id,
        name: item.name || item.description || 'Unnamed Item',
        quantity: quantity,
        price: price,
        value: quantity * price
      });
    }
  });
  
  // Sort low stock items by quantity (lowest first)
  lowStockItems.sort((a, b) => {
    const quantityA = parseFloat(a.quantity) || 0;
    const quantityB = parseFloat(b.quantity) || 0;
    return quantityA - quantityB;
  });
  
  // Prepare low stock items for display
  const lowStockData = lowStockItems.map(item => {
    const quantity = parseFloat(item.quantity) || 0;
    let threshold = 10;
    if (item.alert_threshold !== undefined) {
      threshold = parseFloat(item.alert_threshold) || 10;
    } else if (item.threshold !== undefined) {
      threshold = parseFloat(item.threshold) || 10;
    } else if (item.min_quantity !== undefined) {
      threshold = parseFloat(item.min_quantity) || 10;
    }
    
    return {
      id: item.id,
      name: item.name || item.description || 'Unnamed Item',
      quantity: quantity,
      threshold: threshold
    };
  });
  
  console.log('Inventory metrics:', {
    totalItems,
    totalValue,
    lowStockCount: lowStockItems.length,
    categoriesCount: categories.length,
    categories: categories
  });
  
  // Generate report object
  return {
    id: 'inventory-' + Date.now(),
    title: 'Inventory Status',
    type: 'inventory',
    description: `${totalItems} items, ${lowStockItems.length} low stock`,
    date: new Date().toISOString().split('T')[0],
    data: {
      items: inventoryData,
      totalItems: totalItems,
      totalValue: totalValue,
      lowStockItems: lowStockItems.length,
      lowStockData: lowStockData,
      categories: categories,
      categoryData: categoryData
    }
  };
}

// Function to generate profit report with real data
function generateProfitReport(salesData, inventoryData, period) {
  if (!salesData || !salesData.length) {
    console.warn('No sales data available for profit report');
    return null;
  }
  
  // Filter by period if needed
  const { startDate, endDate } = getDateRangeForPeriod(period);
  const filteredSales = salesData.filter(sale => {
    const saleDate = new Date(sale.date || sale.created_at || Date.now());
    return saleDate >= startDate && saleDate <= endDate;
  });
  
  if (!filteredSales.length) {
    console.warn('No sales data available for the selected period');
    return null;
  }
  
  // Calculate profit metrics
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + (parseFloat(sale.total_amount) || 0), 0);
  
  // Estimate cost of goods sold
  // If we have detailed cost info, use that, otherwise estimate as 65% of revenue
  const totalCost = filteredSales.reduce((sum, sale) => {
    if (sale.cost) {
      return sum + (parseFloat(sale.cost) || 0);
    } else {
      return sum + ((parseFloat(sale.total_amount) || 0) * 0.65);
    }
  }, 0);
  
  const grossProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  
  // Generate report object
  return {
    id: 'profit-' + Date.now(),
    title: 'Profit Analysis',
    type: 'profit',
    description: `$${grossProfit.toFixed(2)} profit, ${profitMargin.toFixed(1)}% margin`,
    date: new Date().toISOString().split('T')[0],
    period: period,
    data: {
      totalRevenue: totalRevenue,
      totalCost: totalCost,
      grossProfit: grossProfit,
      profitMargin: profitMargin.toFixed(1)
    }
  };
}

// Helper function to get date range for a period
function getDateRangeForPeriod(period) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let startDate = new Date(today);
  let endDate = new Date(today);
  
  switch (period) {
    case 'today':
      // Already set to today
      break;
    case 'yesterday':
      startDate.setDate(startDate.getDate() - 1);
      endDate = new Date(startDate);
      break;
    case 'this_week':
      // Set to beginning of week (Sunday)
      startDate.setDate(startDate.getDate() - startDate.getDay());
      break;
    case 'last_week':
      // Set to beginning of last week
      startDate.setDate(startDate.getDate() - startDate.getDay() - 7);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6); // Last day of last week (Saturday)
      break;
    case 'this_month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'last_month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    case 'this_year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case 'custom':
      // Custom period would be handled by reading date inputs
      const customStartInput = document.getElementById('start-date');
      const customEndInput = document.getElementById('end-date');
      
      if (customStartInput && customStartInput.value) {
        startDate = new Date(customStartInput.value);
      }
      
      if (customEndInput && customEndInput.value) {
        endDate = new Date(customEndInput.value);
      }
      break;
  }
  
  // Set end date to end of day
  endDate.setHours(23, 59, 59, 999);
  
  return { startDate, endDate };
}

// Export functions to be used in reports.js
window.ReportsDataHandler = {
  fetchReportsData,
  generateSalesReport,
  generateInventoryReport,
  generateProfitReport,
  getDateRangeForPeriod,
  debugElectronStore
}; 