/**
 * Dashboard.js - Additional functionality for the dashboard
 * This file contains supporting functions for the dashboard.html
 */

// Create a robust API wrapper to handle database connectivity issues
const ElectronAPI = {
  // Store for fallback data
  fallbackData: {
    inventory: null,
    sales: null,
    settings: null,
    reports: null
  },
  
  // Initialize the API wrapper
  init: function() {
    console.log('Initializing ElectronAPI wrapper');
    // Check if the actual electronAPI is available
    if (!window.electronAPI) {
      console.warn('window.electronAPI is not available, using fallback mechanisms');
      // Create a mock electronAPI object
      window.electronAPI = this.createMockAPI();
    } else {
      console.log('window.electronAPI is available');
      // Wrap the existing API with error handling
      this.wrapExistingAPI();
    }
  },
  
  // Create a mock API when electronAPI is not available
  createMockAPI: function() {
    console.log('Creating mock electronAPI');
    return {
      // Inventory operations
      getInventory: async () => {
        console.log('Using mock getInventory');
        return this.getInventoryFallback();
      },
      addInventoryItem: async (item) => {
        console.log('Using mock addInventoryItem');
        return this.addInventoryItemFallback(item);
      },
      updateInventoryItem: async (item) => {
        console.log('Using mock updateInventoryItem');
        return this.updateInventoryItemFallback(item);
      },
      deleteInventoryItem: async (itemId) => {
        console.log('Using mock deleteInventoryItem');
        return this.deleteInventoryItemFallback(itemId);
      },
      
      // Sales operations
      getSales: async () => {
        console.log('Using mock getSales');
        return this.getSalesFallback();
      },
      addSale: async (sale) => {
        console.log('Using mock addSale');
        return this.addSaleFallback(sale);
      },
      
      // Settings operations
      getSettings: async () => {
        console.log('Using mock getSettings');
        return this.getSettingsFallback();
      },
      updateSettings: async (settings) => {
        console.log('Using mock updateSettings');
        return this.updateSettingsFallback(settings);
      },
      
      // Reports operations
      getAllReports: async () => {
        console.log('Using mock getAllReports');
        return this.getReportsFallback();
      },
      
      // Daily report settings
      getDailyReportSettings: async () => {
        console.log('Using mock getDailyReportSettings');
        return this.getDailyReportSettingsFallback();
      },
      updateDailyReportSettings: async (settings) => {
        console.log('Using mock updateDailyReportSettings');
        return this.updateDailyReportSettingsFallback(settings);
      }
    };
  },
  
  // Wrap the existing API with error handling
  wrapExistingAPI: function() {
    console.log('Wrapping existing electronAPI with error handling');
    
    // Save original functions
    const originalAPI = {};
    
    // Inventory operations
    originalAPI.getInventory = window.electronAPI.getInventory;
    window.electronAPI.getInventory = async () => {
      try {
        const result = await originalAPI.getInventory();
        return result;
      } catch (error) {
        console.error('Error in getInventory:', error);
        return this.getInventoryFallback();
      }
    };
    
    originalAPI.addInventoryItem = window.electronAPI.addInventoryItem;
    window.electronAPI.addInventoryItem = async (item) => {
      try {
        const result = await originalAPI.addInventoryItem(item);
        return result;
      } catch (error) {
        console.error('Error in addInventoryItem:', error);
        return this.addInventoryItemFallback(item);
      }
    };
    
    // Sales operations
    originalAPI.getSales = window.electronAPI.getSales;
    window.electronAPI.getSales = async () => {
      try {
        const result = await originalAPI.getSales();
        return result;
      } catch (error) {
        console.error('Error in getSales:', error);
        return this.getSalesFallback();
      }
    };
    
    // Settings operations
    originalAPI.getSettings = window.electronAPI.getSettings;
    window.electronAPI.getSettings = async () => {
      try {
        const result = await originalAPI.getSettings();
        return result;
      } catch (error) {
        console.error('Error in getSettings:', error);
        return this.getSettingsFallback();
      }
    };
    
    // Reports operations
    originalAPI.getAllReports = window.electronAPI.getAllReports;
    window.electronAPI.getAllReports = async () => {
      try {
        const result = await originalAPI.getAllReports();
        return result;
      } catch (error) {
        console.error('Error in getAllReports:', error);
        return this.getReportsFallback();
      }
    };
  },
  
  // Fallback functions for when API calls fail
  getInventoryFallback: function() {
    console.log('Using inventory fallback data');
    
    // Try to get from localStorage first
    try {
      const localData = localStorage.getItem('inventory_items');
      if (localData) {
        return JSON.parse(localData);
      }
    } catch (error) {
      console.error('Error reading inventory from localStorage:', error);
    }
    
    // Use hardcoded fallback if no localStorage data
    if (!this.fallbackData.inventory) {
      this.fallbackData.inventory = [
        {
          id: '1',
          description: 'PVC Pipe 1/2"',
          type: 'PVC',
          size: '1/2 inch',
          quantity: 25,
          price: 5.99,
          alertThreshold: 10,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          description: 'Copper Pipe 3/4"',
          type: 'Copper',
          size: '3/4 inch',
          quantity: 10,
          price: 12.99,
          alertThreshold: 5,
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          description: 'PVC Pipe 3/4"',
          type: 'PVC',
          size: '3/4 inch',
          quantity: 30,
          price: 7.99,
          alertThreshold: 15,
          createdAt: new Date().toISOString()
        }
      ];
    }
    return this.fallbackData.inventory;
  },
  
  addInventoryItemFallback: function(item) {
    console.log('Using addInventoryItem fallback');
    
    // Create a new item with ID
    const newItem = {
      id: Date.now().toString(),
      ...item,
      createdAt: new Date().toISOString()
    };
    
    // Get current inventory
    let inventory = [];
    try {
      const localData = localStorage.getItem('inventory_items');
      if (localData) {
        inventory = JSON.parse(localData);
      }
    } catch (error) {
      console.error('Error reading inventory from localStorage:', error);
      inventory = this.fallbackData.inventory || [];
    }
    
    // Add the new item
    inventory.push(newItem);
    
    // Save back to localStorage
    try {
      localStorage.setItem('inventory_items', JSON.stringify(inventory));
      this.fallbackData.inventory = inventory;
    } catch (error) {
      console.error('Error saving inventory to localStorage:', error);
    }
    
    return newItem;
  },
  
  updateInventoryItemFallback: function(item) {
    console.log('Using updateInventoryItem fallback');
    
    // Get current inventory
    let inventory = [];
    try {
      const localData = localStorage.getItem('inventory_items');
      if (localData) {
        inventory = JSON.parse(localData);
      }
    } catch (error) {
      console.error('Error reading inventory from localStorage:', error);
      inventory = this.fallbackData.inventory || [];
    }
    
    // Find and update the item
    const index = inventory.findIndex(i => i.id === item.id);
    if (index !== -1) {
      inventory[index] = {
        ...inventory[index],
        ...item,
        updatedAt: new Date().toISOString()
      };
      
      // Save back to localStorage
      try {
        localStorage.setItem('inventory_items', JSON.stringify(inventory));
        this.fallbackData.inventory = inventory;
      } catch (error) {
        console.error('Error saving inventory to localStorage:', error);
      }
      
      return inventory[index];
    }
    
    return null;
  },
  
  deleteInventoryItemFallback: function(itemId) {
    console.log('Using deleteInventoryItem fallback');
    
    // Get current inventory
    let inventory = [];
    try {
      const localData = localStorage.getItem('inventory_items');
      if (localData) {
        inventory = JSON.parse(localData);
      }
    } catch (error) {
      console.error('Error reading inventory from localStorage:', error);
      inventory = this.fallbackData.inventory || [];
    }
    
    // Filter out the item
    const newInventory = inventory.filter(i => i.id !== itemId);
    
    // Save back to localStorage
    try {
      localStorage.setItem('inventory_items', JSON.stringify(newInventory));
      this.fallbackData.inventory = newInventory;
    } catch (error) {
      console.error('Error saving inventory to localStorage:', error);
    }
    
    return true;
  },
  
  getSalesFallback: function() {
    console.log('Using sales fallback data');
    
    // Try to get from localStorage first
    try {
      const localData = localStorage.getItem('sales_data');
      if (localData) {
        return JSON.parse(localData);
      }
    } catch (error) {
      console.error('Error reading sales from localStorage:', error);
    }
    
    // Use hardcoded fallback if no localStorage data
    if (!this.fallbackData.sales) {
      this.fallbackData.sales = [
        {
          id: '1',
          date: new Date().toISOString(),
          items: [
            {
              id: '1',
              description: 'PVC Pipe 1/2"',
              quantity: 5,
              price: 5.99
            }
          ],
          total: 29.95,
          paymentMethod: 'cash'
        }
      ];
    }
    return this.fallbackData.sales;
  },
  
  addSaleFallback: function(sale) {
    console.log('Using addSale fallback');
    
    // Create a new sale with ID
    const newSale = {
      id: Date.now().toString(),
      ...sale,
      createdAt: new Date().toISOString()
    };
    
    // Get current sales
    let sales = [];
    try {
      const localData = localStorage.getItem('sales_data');
      if (localData) {
        sales = JSON.parse(localData);
      }
    } catch (error) {
      console.error('Error reading sales from localStorage:', error);
      sales = this.fallbackData.sales || [];
    }
    
    // Add the new sale
    sales.push(newSale);
    
    // Save back to localStorage
    try {
      localStorage.setItem('sales_data', JSON.stringify(sales));
      this.fallbackData.sales = sales;
    } catch (error) {
      console.error('Error saving sales to localStorage:', error);
    }
    
    // Update inventory quantities
    this.updateInventoryAfterSaleFallback(newSale.items);
    
    return newSale;
  },
  
  updateInventoryAfterSaleFallback: function(items) {
    console.log('Using updateInventoryAfterSale fallback');
    
    // Get current inventory
    let inventory = [];
    try {
      const localData = localStorage.getItem('inventory_items');
      if (localData) {
        inventory = JSON.parse(localData);
      }
    } catch (error) {
      console.error('Error reading inventory from localStorage:', error);
      inventory = this.fallbackData.inventory || [];
      return; // Can't update if we can't read
    }
    
    // Update quantities
    let updated = false;
    items.forEach(soldItem => {
      const inventoryItem = inventory.find(item => item.id === soldItem.id || item.id === soldItem.itemId);
      if (inventoryItem) {
        inventoryItem.quantity -= soldItem.quantity;
        updated = true;
      }
    });
    
    // Save back to localStorage if updated
    if (updated) {
      try {
        localStorage.setItem('inventory_items', JSON.stringify(inventory));
        this.fallbackData.inventory = inventory;
      } catch (error) {
        console.error('Error saving inventory to localStorage:', error);
      }
    }
  },
  
  getSettingsFallback: function() {
    console.log('Using settings fallback data');
    
    // Try to get from localStorage first
    try {
      const localData = localStorage.getItem('app_settings');
      if (localData) {
        return JSON.parse(localData);
      }
    } catch (error) {
      console.error('Error reading settings from localStorage:', error);
    }
    
    // Use hardcoded fallback if no localStorage data
    if (!this.fallbackData.settings) {
      this.fallbackData.settings = {
        companyName: 'Pipe Inventory Co.',
        currency: 'TZS',
        taxRate: 0.08,
        lowStockThreshold: 10
      };
    }
    return this.fallbackData.settings;
  },
  
  updateSettingsFallback: function(settings) {
    console.log('Using updateSettings fallback');
    
    // Get current settings
    let currentSettings = {};
    try {
      const localData = localStorage.getItem('app_settings');
      if (localData) {
        currentSettings = JSON.parse(localData);
      }
    } catch (error) {
      console.error('Error reading settings from localStorage:', error);
      currentSettings = this.fallbackData.settings || {};
    }
    
    // Update settings
    const updatedSettings = {
      ...currentSettings,
      ...settings
    };
    
    // Save back to localStorage
    try {
      localStorage.setItem('app_settings', JSON.stringify(updatedSettings));
      this.fallbackData.settings = updatedSettings;
    } catch (error) {
      console.error('Error saving settings to localStorage:', error);
    }
    
    return updatedSettings;
  },
  
  getReportsFallback: function() {
    console.log('Using reports fallback data');
    
    // Try to get from localStorage first
    try {
      const localData = localStorage.getItem('reports_data');
      if (localData) {
        return JSON.parse(localData);
      }
    } catch (error) {
      console.error('Error reading reports from localStorage:', error);
    }
    
    // Use hardcoded fallback if no localStorage data
    if (!this.fallbackData.reports) {
      this.fallbackData.reports = [
        {
          id: '1',
          title: 'Monthly Sales Report',
          type: 'sales',
          period: 'monthly',
          date: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          data: {
            totalSales: 15,
            totalRevenue: 2500.75,
            topSellingItems: [
              { name: 'PVC Pipe 1/2"', quantity: 45, revenue: 269.55 },
              { name: 'Copper Pipe 1/2"', quantity: 20, revenue: 259.80 },
              { name: 'PVC Pipe 3/4"', quantity: 18, revenue: 143.82 }
            ]
          }
        },
        {
          id: '2',
          title: 'Inventory Status Report',
          type: 'inventory',
          date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          data: {
            totalItems: 5,
            totalValue: 1250.45,
            lowStockItems: 2,
            categories: [
              { name: 'PVC', count: 2, value: 450.25 },
              { name: 'Copper', count: 1, value: 350.75 },
              { name: 'Steel', count: 1, value: 275.50 },
              { name: 'PEX', count: 1, value: 174.95 }
            ]
          }
        }
      ];
      
      // Save to localStorage for future use
      try {
        localStorage.setItem('reports_data', JSON.stringify(this.fallbackData.reports));
      } catch (error) {
        console.error('Error saving reports to localStorage:', error);
      }
    }
    
    return this.fallbackData.reports;
  },
  
  getDailyReportSettingsFallback: function() {
    console.log('Using daily report settings fallback data');
    
    // Try to get from localStorage first
    try {
      const localData = localStorage.getItem('pipe_inventory_daily_report_settings');
      if (localData) {
        return JSON.parse(localData);
      }
    } catch (error) {
      console.error('Error reading daily report settings from localStorage:', error);
    }
    
    // Use hardcoded fallback
    const fallbackSettings = {
      enabled: true,
      hour: 0,
      minute: 0,
      directory: 'Reports',
      showNotification: true
    };
    
    // Save to localStorage for future use
    try {
      localStorage.setItem('pipe_inventory_daily_report_settings', JSON.stringify(fallbackSettings));
    } catch (error) {
      console.error('Error saving daily report settings to localStorage:', error);
    }
    
    return fallbackSettings;
  },
  
  updateDailyReportSettingsFallback: function(settings) {
    console.log('Using updateDailyReportSettings fallback');
    
    // Save to localStorage
    try {
      localStorage.setItem('pipe_inventory_daily_report_settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving daily report settings to localStorage:', error);
    }
    
    return settings;
  }
};

// Initialize the API wrapper when the page loads
document.addEventListener('DOMContentLoaded', function() {
  ElectronAPI.init();
  initializePage();
});

function initializePage() {
  // Initialize dashboard components
  initializeDashboardComponents();
  
  // Add event listeners
  document.getElementById('inventory-link').addEventListener('click', function() {
    window.location.href = 'inventory.html';
  });
  
  document.getElementById('sales-link').addEventListener('click', function() {
    window.location.href = 'sales.html';
  });
  
  document.getElementById('reports-link').addEventListener('click', async function() {
    try {
      // Show loading spinner
      document.querySelector('.main-content').innerHTML = `
        <div class="content-header">
          <h1><i class="fas fa-chart-bar me-2"></i> Reports</h1>
        </div>
        <div class="d-flex justify-content-center my-5">
          <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
      `;
      
      // Fetch reports data in the background
      const reportsDataPromise = window.electronAPI.getAllReports();
      
      // Fetch reports.html template
      const response = await fetch('reports.html');
      const content = await response.text();
      
      // Load reports template
      document.querySelector('.main-content').innerHTML = content;
      
      // Create a script element but don't append it immediately
      const script = document.createElement('script');
      script.src = 'js/reports.js';
      
      // Set up the onload handler for the script
      script.onload = async () => {
        // Apply any necessary optimizations
        if (window.initializeReports && typeof window.initializeReports === 'function') {
          // Pass the prefetched data to the initialization function if one exists
          const reportsData = await reportsDataPromise;
          window.initializeReports(reportsData);
        }
      };
      
      // Now append the script to start loading
      document.body.appendChild(script);
    } catch (error) {
      console.error('Error loading reports:', error);
      document.querySelector('.main-content').innerHTML = `
        <div class="alert alert-danger m-3">
          <i class="fas fa-exclamation-triangle me-2"></i>
          Error loading reports. Please try again.
        </div>
      `;
    }
  });
}

function initializeDashboardComponents() {
  // Load and display inventory summary
  loadInventorySummary();
  
  // Load and display sales summary
  loadSalesSummary();
  
  // Load and display settings
  loadSettings();
}

// Ensure Dashboard object is properly initialized
if (typeof Dashboard !== 'object') {
  console.log('Creating Dashboard object');
  window.Dashboard = {};
}

// Add or enhance essential Dashboard methods
Object.assign(Dashboard, {
  // Format currency based on settings
  formatCurrency: function(amount, currency = 'TZS') {
    try {
      if (typeof amount !== 'number') {
        amount = parseFloat(amount) || 0;
      }
      
      // Default to TZS if currency is not provided
      const currencyCode = currency || 'TZS';
      
      // Format based on currency
      if (currencyCode === 'TZS') {
    return new Intl.NumberFormat('sw-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
      }
      
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode
      }).format(amount);
    } catch (error) {
      console.error('Error formatting currency:', error);
      return 'TZS ' + amount.toFixed(0);
    }
  },

  // Show a notification toast
  showNotification: function(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'warning' ? 'warning' : type === 'info' ? 'info' : 'danger'} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;
    
    // Add custom styling for multi-line notifications
    const toastBody = toast.querySelector('.toast-body');
    if (message.includes('<br>')) {
      toastBody.style.whiteSpace = 'normal';
      toast.style.maxWidth = '400px';
    }
    
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      const container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
      document.body.appendChild(container);
    }
    
    document.getElementById('toast-container').appendChild(toast);
    const bsToast = new bootstrap.Toast(toast, {
      delay: 5000 // Longer delay for notifications with more content
    });
    bsToast.show();
    
    // Remove toast after it's hidden
    toast.addEventListener('hidden.bs.toast', () => {
      toast.remove();
    });
  },

  // Update dashboard statistics
  updateDashboardStats: function(inventory, todaySales, allSales) {
    try {
      console.log('Updating dashboard stats with:', {
        inventoryCount: inventory?.length || 0,
        todaySalesCount: todaySales?.length || 0,
        allSalesCount: allSales?.length || 0
      });
      
    // Total inventory items
      const totalInventoryEl = document.getElementById('total-inventory');
      if (totalInventoryEl) {
        totalInventoryEl.textContent = Array.isArray(inventory) ? inventory.length : '0';
      }
    
    // Inventory value
      const inventoryValueEl = document.getElementById('inventory-value');
      if (inventoryValueEl) {
        const inventoryValue = Array.isArray(inventory) 
          ? inventory.reduce((total, item) => total + ((Number(item.quantity) || 0) * (Number(item.price) || 0)), 0)
          : 0;
        inventoryValueEl.textContent = this.formatCurrency(inventoryValue);
      }
    
    // Today's sales count
      const todaySalesEl = document.getElementById('today-sales');
      if (todaySalesEl) {
        todaySalesEl.textContent = Array.isArray(todaySales) ? todaySales.length : '0';
      }
    
    // Today's revenue
      const todayRevenueEl = document.getElementById('today-revenue');
      if (todayRevenueEl) {
        let todayRevenue = 0;
        
        if (Array.isArray(todaySales)) {
          todayRevenue = todaySales.reduce((total, sale) => {
            if (sale.totalAmount) return total + Number(sale.totalAmount);
            if (Array.isArray(sale.items)) {
              return total + sale.items.reduce((sum, item) => 
                sum + ((Number(item.quantity) || 0) * (Number(item.price) || 0)), 0);
            }
            return total;
    }, 0);
        }
        
        todayRevenueEl.textContent = this.formatCurrency(todayRevenue);
      }
      
      console.log('Dashboard stats updated successfully');
    } catch (error) {
      console.error('Error updating dashboard stats:', error);
      this.showNotification('Error updating dashboard statistics', 'error');
    }
  },
  
  // Update charts - if method doesn't exist or fails, create a basic implementation
  updateCharts: Dashboard.updateCharts || function(inventory, sales) {
    try {
      console.log('Updating dashboard charts');
    this.updateInventoryChart(inventory);
    this.updateSalesChart(sales);
    } catch (error) {
      console.error('Error updating charts:', error);
      this.createBasicCharts(inventory, sales);
    }
  },
  
  // Create basic charts if the full implementation fails
  createBasicCharts: function(inventory, sales) {
    try {
      console.log('Creating basic charts as fallback');
      
      // Inventory by type chart
      const inventoryCtx = document.getElementById('inventory-chart');
      if (inventoryCtx) {
        // Clear any existing chart
        if (inventoryCtx.chart) {
          inventoryCtx.chart.destroy();
        }
        
        // Group inventory by type
    const inventoryByType = {};
        if (Array.isArray(inventory)) {
    inventory.forEach(item => {
            const type = item.type || 'Other';
            if (!inventoryByType[type]) {
              inventoryByType[type] = 0;
            }
            inventoryByType[type] += Number(item.quantity) || 0;
          });
        }
        
        // Create chart
        const types = Object.keys(inventoryByType);
        const quantities = types.map(type => inventoryByType[type]);
        
        inventoryCtx.chart = new Chart(inventoryCtx, {
          type: 'doughnut',
      data: {
            labels: types,
        datasets: [{
              data: quantities,
          backgroundColor: [
                '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b',
                '#5a5c69', '#858796', '#4e73df', '#1cc88a', '#36b9cc'
              ]
        }]
      },
      options: {
        maintainAspectRatio: false,
        plugins: {
          legend: {
                position: 'bottom'
          }
        }
      }
    });
      }

    // Sales trend chart
      const salesCtx = document.getElementById('sales-chart');
      if (salesCtx) {
        // Clear any existing chart
        if (salesCtx.chart) {
          salesCtx.chart.destroy();
        }
        
        // Prepare sales data by day (last 7 days)
    const salesByDay = {};
        const today = new Date();
    
        // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
      salesByDay[dateStr] = 0;
    }
    
        // Populate with sales data
        if (Array.isArray(sales)) {
    sales.forEach(sale => {
            try {
              const saleDate = new Date(sale.date);
              const saleDateStr = saleDate.toISOString().split('T')[0];
              
              // Only include sales from the last 7 days
              if (salesByDay.hasOwnProperty(saleDateStr)) {
                salesByDay[saleDateStr] += Number(sale.totalAmount) || 0;
              }
            } catch (error) {
              console.warn('Error processing sale date:', error);
            }
          });
        }
        
        // Create chart
        const dates = Object.keys(salesByDay);
        const amounts = dates.map(date => salesByDay[date]);
        
        salesCtx.chart = new Chart(salesCtx, {
          type: 'line',
      data: {
            labels: dates.map(date => {
              const d = new Date(date);
              return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }),
        datasets: [{
              label: 'Sales Amount',
              data: amounts,
              fill: false,
              borderColor: '#4e73df',
              tension: 0.1
        }]
      },
      options: {
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
            },
            scales: {
              y: {
                beginAtZero: true
          }
        }
      }
    });
      }
      
      console.log('Basic charts created successfully');
    } catch (error) {
      console.error('Error creating basic charts:', error);
    }
  },
  
  // Update recent sales table - ensure implementation exists
  updateRecentSales: function(sales, currency = 'USD') {
    try {
      console.log('Updating recent sales table');
    const recentSalesTable = document.getElementById('recent-sales');
      if (!recentSalesTable) {
        console.warn('Recent sales table element not found');
        return;
      }
      
      // Clear existing rows
    recentSalesTable.innerHTML = '';
    
      // No sales data
      if (!Array.isArray(sales) || sales.length === 0) {
        recentSalesTable.innerHTML = `
          <tr>
            <td colspan="4" class="text-center">No recent sales data available</td>
          </tr>
        `;
        return;
      }
      
      // Sort sales by date (most recent first) and take the first 5
      const recentSales = [...sales]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
      
      // Add rows for each sale
      recentSales.forEach(sale => {
        const row = document.createElement('tr');
        row.className = 'dashboard-list-item';
        row.style.transition = 'box-shadow 0.18s, background 0.18s';
        row.innerHTML = `
          <td><span style='font-weight:600;'>${sale.invoiceNumber || sale.id || '-'}</span></td>
          <td>${sale.customerName || sale.buyer?.name || 'Walk-in Customer'}</td>
          <td>${new Date(sale.date).toLocaleDateString()}</td>
          <td style='font-weight:600; color:#007aff;'>${this.formatCurrency(sale.totalAmount || 0, currency)}</td>
        `;
        row.onmouseover = () => { row.style.background = 'rgba(255,255,255,0.90)'; row.style.boxShadow = '0 6px 24px 0 rgba(255,255,255,0.22)'; };
        row.onmouseout = () => { row.style.background = 'rgba(255,255,255,0.68)'; row.style.boxShadow = '0 2px 12px 0 rgba(255,255,255,0.18)'; };
        row.style.marginBottom = '10px';
        recentSalesTable.appendChild(row);
      });
      
      console.log('Recent sales table updated successfully');
    } catch (error) {
      console.error('Error updating recent sales table:', error);
    }
  },

  // Update low stock items - ensure implementation exists
  updateLowStockItems: function(inventory) {
    try {
      console.log('Updating low stock items');
    const lowStockTable = document.getElementById('low-stock-items');
      if (!lowStockTable) {
        console.warn('Low stock table element not found');
        return;
      }
      
      // Clear existing rows
    lowStockTable.innerHTML = '';
    
      // No inventory data
      if (!Array.isArray(inventory) || inventory.length === 0) {
        lowStockTable.innerHTML = `
          <tr>
            <td colspan="3" class="text-center">No inventory data available</td>
          </tr>
        `;
        return;
      }
      
      // Filter low stock items
      const lowStockItems = inventory.filter(item => {
        const quantity = Number(item.quantity) || 0;
        const threshold = Number(item.alertThreshold) || 10;
        return quantity <= threshold;
      }).sort((a, b) => {
        // Sort by ratio of quantity to threshold (ascending)
        const ratioA = (a.quantity || 0) / (a.alertThreshold || 10);
        const ratioB = (b.quantity || 0) / (b.alertThreshold || 10);
        return ratioA - ratioB;
      }).slice(0, 5);
      
      // No low stock items
    if (lowStockItems.length === 0) {
        lowStockTable.innerHTML = `
          <tr>
            <td colspan="3" class="text-center">No items are low in stock</td>
          </tr>
        `;
        return;
      }
      
      // Add rows for each low stock item
      lowStockItems.forEach(item => {
        const row = document.createElement('tr');
        const quantity = Number(item.quantity) || 0;
        const threshold = Number(item.alertThreshold) || 10;
        const ratio = quantity / threshold;
        
        // Determine status color
        let statusColor = 'success';
        if (ratio === 0) {
          statusColor = 'danger';
        } else if (ratio <= 0.5) {
          statusColor = 'warning';
        }
        
        row.innerHTML = `
          <td>${item.name || item.description || 'Unknown'}</td>
          <td>${item.type || '-'}</td>
          <td><span class="badge bg-${statusColor}">${quantity}</span></td>
        `;
        lowStockTable.appendChild(row);
      });
      
      console.log('Low stock table updated successfully');
    } catch (error) {
      console.error('Error updating low stock table:', error);
    }
  },
  
  // Update recommendations - ensure implementation exists
  updateRecommendations: function(inventory, sales) {
    try {
      console.log('Updating recommendations');
      const recommendationsDiv = document.getElementById('recommendations-list');
      if (!recommendationsDiv) {
        console.warn('Recommendations div element not found');
        return;
      }
      
      // No data
      if (!Array.isArray(inventory) || !Array.isArray(sales)) {
        recommendationsDiv.innerHTML = `
          <div class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i>
            No data available for recommendations
          </div>
        `;
        return;
      }
      
      // Generate simple recommendations
      const recommendations = [];
      
      // 1. Low stock items that sell well
      const soldItemsCount = {};
      sales.forEach(sale => {
        if (Array.isArray(sale.items)) {
          sale.items.forEach(item => {
            if (!soldItemsCount[item.id]) {
              soldItemsCount[item.id] = 0;
            }
            soldItemsCount[item.id] += Number(item.quantity) || 0;
          });
        }
      });
      
      // Find low stock items that have sold well
      inventory.forEach(item => {
        const quantity = Number(item.quantity) || 0;
        const threshold = Number(item.alertThreshold) || 10;
        const salesCount = soldItemsCount[item.id] || 0;
        
        if (quantity <= threshold && salesCount > 0) {
          recommendations.push({
            type: 'restock',
            item: item,
            message: `Restock ${item.name || item.description} - Low stock (${quantity}) with ${salesCount} units sold`
          });
        }
      });
      
      // 2. Items not selling well
      inventory.forEach(item => {
        const quantity = Number(item.quantity) || 0;
        const salesCount = soldItemsCount[item.id] || 0;
        
        // Large inventory but few sales
        if (quantity > 20 && salesCount === 0) {
          recommendations.push({
            type: 'promotion',
            item: item,
            message: `Consider promotion for ${item.name || item.description} - Large stock (${quantity}) with no recent sales`
          });
        }
      });
      
      // No recommendations
      if (recommendations.length === 0) {
        recommendationsDiv.innerHTML = `
          <div class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i>
            No recommendations available at this time
          </div>
        `;
        return;
      }
      
      // Sort by priority (restock first, then promotion)
      recommendations.sort((a, b) => {
        if (a.type === 'restock' && b.type !== 'restock') return -1;
        if (a.type !== 'restock' && b.type === 'restock') return 1;
        return 0;
      });
      
      // Create html for recommendations
      let html = '<div class="list-group">';
      
      // Take top 5 recommendations
      recommendations.slice(0, 5).forEach(rec => {
        const icon = rec.type === 'restock' ? 'fa-exclamation-circle' : 'fa-lightbulb';
        const color = rec.type === 'restock' ? 'warning' : 'info';
        
        html += `
          <div class="list-group-item list-group-item-action">
            <div class="d-flex w-100 justify-content-between">
              <h6 class="mb-1">
                <i class="fas ${icon} text-${color} me-2"></i>
                ${rec.item.name || rec.item.description || 'Unknown'}
              </h6>
              <span class="badge bg-${color}">${rec.type}</span>
              </div>
            <p class="mb-1 small">${rec.message}</p>
            </div>
          `;
      });
      
      html += '</div>';
      recommendationsDiv.innerHTML = html;
      
      console.log('Recommendations updated successfully');
    } catch (error) {
      console.error('Error updating recommendations:', error);
    }
  },
  
  // Check for low stock alerts - ensure implementation exists
  checkLowStockAlerts: Dashboard.checkLowStockAlerts || function(inventory) {
    try {
      console.log('Checking for low stock alerts');
      const alertsContainer = document.getElementById('alerts-container');
      if (!alertsContainer) {
        console.warn('Alerts container not found');
        return;
      }
      
      // Check for low stock items
      if (!Array.isArray(inventory)) {
        console.warn('Invalid inventory data for low stock alerts');
        alertsContainer.style.display = 'none';
        return;
      }
      
      const lowStockItems = inventory.filter(item => {
        const quantity = Number(item.quantity) || 0;
        const threshold = Number(item.alertThreshold) || 10;
        return quantity <= threshold;
      });
      
      if (lowStockItems.length > 0) {
        // Show the alerts container
        alertsContainer.style.display = 'block';
        
        // Update alert text
        const alertContent = alertsContainer.querySelector('.alert');
        if (alertContent) {
          alertContent.innerHTML = `
            <i class="fas fa-exclamation-triangle me-2"></i>
            <strong>Low Inventory Alert!</strong> ${lowStockItems.length} item(s) are running low in stock.
            <a href="#" id="view-alerts" class="alert-link ms-2">View details</a>
          `;
        }
      } else {
        // Hide the alerts container
        alertsContainer.style.display = 'none';
      }
      
      console.log('Low stock alerts checked successfully');
    } catch (error) {
      console.error('Error checking low stock alerts:', error);
    }
  },
  
  // Load alert items - ensure implementation exists
  loadAlertItems: Dashboard.loadAlertItems || function() {
    try {
      console.log('Loading alert items');
      const alertsModal = document.getElementById('alertsModal');
      if (!alertsModal) {
        console.warn('Alerts modal not found');
        return;
      }
      
      const alertsTableBody = alertsModal.querySelector('tbody');
      if (!alertsTableBody) {
        console.warn('Alerts table body not found');
        return;
      }
      
      // Clear existing rows
      alertsTableBody.innerHTML = '';
      
      // Get inventory data
      window.electronAPI.getInventory().then(inventory => {
        // Filter low stock items
        const lowStockItems = inventory.filter(item => {
          const quantity = Number(item.quantity) || 0;
          const threshold = Number(item.alertThreshold) || 10;
          return quantity <= threshold;
        }).sort((a, b) => {
          // Sort by ratio of quantity to threshold (ascending)
          const ratioA = (a.quantity || 0) / (a.alertThreshold || 10);
          const ratioB = (b.quantity || 0) / (b.alertThreshold || 10);
          return ratioA - ratioB;
        });
        
        // No low stock items
        if (lowStockItems.length === 0) {
          alertsTableBody.innerHTML = `
            <tr>
              <td colspan="6" class="text-center">No items are low in stock</td>
            </tr>
          `;
          return;
        }
        
        // Add rows for each low stock item
        lowStockItems.forEach(item => {
          const row = document.createElement('tr');
          const quantity = Number(item.quantity) || 0;
          const threshold = Number(item.alertThreshold) || 10;
          const ratio = quantity / threshold;
          
          // Determine status color
          let statusColor = 'success';
          if (ratio === 0) {
            statusColor = 'danger';
          } else if (ratio <= 0.5) {
            statusColor = 'warning';
          }
          
          row.innerHTML = `
            <td>${item.name || item.description || 'Unknown'}</td>
            <td>${item.category || '-'}</td>
            <td>${item.size || item.dimensions || '-'}</td>
            <td>${item.type || '-'}</td>
            <td><span class="badge bg-${statusColor}">${quantity}</span></td>
            <td>${threshold}</td>
          `;
          alertsTableBody.appendChild(row);
        });
        
        console.log('Alert items loaded successfully');
      }).catch(error => {
        console.error('Error fetching inventory for alerts:', error);
        alertsTableBody.innerHTML = `
          <tr>
            <td colspan="6" class="text-center text-danger">
              Error loading data: ${error.message || 'Unknown error'}
            </td>
          </tr>
        `;
      });
    } catch (error) {
      console.error('Error loading alert items:', error);
    }
  },
  
  // Refresh dashboard
  refreshDashboard: function() {
    console.log('Refreshing dashboard');
    if (typeof window.loadDashboardData === 'function') {
      window.loadDashboardData().then(() => {
        this.showNotification('Dashboard refreshed successfully');
      }).catch(error => {
        console.error('Error refreshing dashboard:', error);
        this.showNotification('Error refreshing dashboard', 'error');
      });
    } else {
      console.error('loadDashboardData function not available');
      this.showNotification('Cannot refresh dashboard - required function not available', 'error');
    }
  }
});

// Load dashboard data
window.loadDashboardData = async function() {
  try {
    console.log('Loading dashboard data...');
    Dashboard.showNotification('Loading dashboard data...', 'info');
    
    // Create fallback data in case API calls fail
    const fallbackInventory = [
      {
        id: '1',
        description: 'PVC Pipe 1/2"',
        type: 'PVC',
        size: '1/2 inch',
        quantity: 50,
        price: 5.99,
        alertThreshold: 10,
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        description: 'PVC Pipe 3/4"',
        type: 'PVC',
        size: '3/4 inch',
        quantity: 35,
        price: 7.99,
        alertThreshold: 10,
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        description: 'Copper Pipe 1/2"',
        type: 'Copper',
        size: '1/2 inch',
        quantity: 20,
        price: 12.99,
        alertThreshold: 5,
        createdAt: new Date().toISOString()
      },
      {
        id: '4',
        description: 'Steel Pipe 1"',
        type: 'Steel',
        size: '1 inch',
        quantity: 15,
        price: 15.99,
        alertThreshold: 5,
        createdAt: new Date().toISOString()
      },
      {
        id: '5',
        description: 'PEX Pipe 3/4"',
        type: 'PEX',
        size: '3/4 inch',
        quantity: 40,
        price: 9.99,
        alertThreshold: 8,
        createdAt: new Date().toISOString()
      }
    ];
    
    const fallbackSales = [
      {
        id: '1',
        date: new Date().toISOString(),
        items: [
          {
            id: '1',
            description: 'PVC Pipe 1/2"',
            quantity: 5,
            price: 5.99
          }
        ],
        total: 29.95,
        paymentMethod: 'cash'
      },
      {
        id: '2',
        date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        items: [
          {
            id: '2',
            description: 'PVC Pipe 3/4"',
            quantity: 8,
            price: 7.99
          },
          {
            id: '5',
            description: 'PEX Pipe 3/4"',
            quantity: 6,
            price: 9.99
          }
        ],
        total: 58.95,
        paymentMethod: 'Credit Card'
      }
    ];
    
    const fallbackSettings = {
      companyName: 'Pipe Inventory Management',
      currency: 'TZS',
      currencySymbol: 'TZsh',
      taxRate: 0.08,
      lowStockThreshold: 10
    };
    
    // Load inventory and sales data with fallbacks
    let inventory, sales, settings;
    
    try {
      inventory = await window.electronAPI.getInventory();
      console.log('Inventory loaded successfully');
    } catch (err) {
      console.error('Error loading inventory:', err);
      inventory = fallbackInventory;
      console.log('Using fallback inventory data');
    }
    
    try {
      sales = await window.electronAPI.getSales();
      console.log('Sales loaded successfully');
    } catch (err) {
      console.error('Error loading sales:', err);
      sales = fallbackSales;
      console.log('Using fallback sales data');
    }
    
    try {
      settings = await window.electronAPI.getSettings();
      console.log('Settings loaded successfully');
    } catch (err) {
      console.error('Error loading settings:', err);
      settings = fallbackSettings;
      console.log('Using fallback settings data');
    }
    
    // Get today's sales
    const todaySales = sales.filter(sale => {
      const today = new Date();
      const saleDate = new Date(sale.date || sale.createdAt);
      return saleDate.setHours(0,0,0,0) === today.setHours(0,0,0,0);
    });
    
    // Update dashboard stats
    Dashboard.updateDashboardStats(inventory, todaySales, sales);
    
    // Update charts
    Dashboard.updateCharts(inventory, sales);
    
    // Update recent sales table
    Dashboard.updateRecentSales(sales, settings.currency);
    
    // Update low stock items
    Dashboard.updateLowStockItems(inventory);
    
    // Update recommendations without causing infinite recursion
    Dashboard.updateRecommendations(inventory, sales);
    
    // Check for low stock alerts
    Dashboard.checkLowStockAlerts(inventory);
    
    // Signal that dashboard data loading is complete
    console.log('Dashboard data loaded successfully');
    Dashboard.showNotification('Dashboard loaded successfully', 'success');
    return true;
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    Dashboard.showNotification('Error loading dashboard data. Using fallback data.', 'warning');
    return false;
  }
}

// Handle dashboard initialization and splash screen transition
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOMContentLoaded event fired on dashboard');
  
  // Skip authentication check and directly load dashboard
  console.log('Skipping authentication check as requested...');
  
  // Ensure the splash screen is visible during loading
  const splashScreen = document.getElementById('splash-screen');
  if (splashScreen) {
    splashScreen.style.display = 'flex';
    splashScreen.classList.remove('hidden');
    console.log('Splash screen made visible');
  }
  
  // Make sure app container is hidden initially
  const appContainer = document.getElementById('app-container');
  if (appContainer) {
    appContainer.style.opacity = '0';
    console.log('App container hidden during loading');
  }
  
  // Create a mock session for the dashboard
  const mockSession = {
    username: 'User',
    loggedIn: true,
    loginTime: new Date().toISOString(),
    sessionId: Date.now().toString(36) + Math.random().toString(36).substr(2),
    expiration: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
  };
  
  // Store the mock session in localStorage
  try {
    localStorage.setItem('eliva_session', JSON.stringify(mockSession));
  } catch (error) {
    console.warn('Could not save mock session to localStorage:', error);
  }
  
  // Proceed directly to dashboard loading
  console.log('Proceeding directly to dashboard with mock session');
  beginDashboardLoad(mockSession);
  
  function beginDashboardLoad(session) {
    
    console.log('User authenticated:', session.username);
    
    // User is authenticated, show splash screen and load dashboard data
    const splashScreen = document.getElementById('splash-screen');
    const appContainer = document.getElementById('app-container');
    
    console.log('Splash screen element:', splashScreen ? 'found' : 'not found');
    console.log('App container element:', appContainer ? 'found' : 'not found');
    
    // Make sure splash screen is visible
    if (splashScreen) {
      splashScreen.style.display = 'flex';
      splashScreen.classList.remove('hidden');
      
      // Update splash screen text with username
      const splashTitle = document.querySelector('.splash-title');
      if (splashTitle) {
        splashTitle.textContent = `Welcome, ${session.username}`;
      }
      
      const splashSubtitle = document.querySelector('.splash-subtitle');
      if (splashSubtitle) {
        splashSubtitle.textContent = 'Loading your dashboard...';
      }
      
      // Start progress animation
      const progressBar = document.getElementById('splash-progress');
      if (progressBar) {
        progressBar.style.width = '0%';
        
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += 2;
          progressBar.style.width = progress + '%';
          
          if (progress >= 100) {
            clearInterval(progressInterval);
          }
        }, 30);
      }
      
      console.log('Splash screen made visible with animations');
    }
    
    // Hide app container until data is loaded
    if (appContainer) {
      appContainer.style.opacity = '0';
      console.log('App container hidden');
    }
    
    // Load dashboard data
    console.log('Calling loadDashboardData function...');
    if (typeof window.loadDashboardData !== 'function') {
      console.error('loadDashboardData function not found on window object!');
      // Fallback to direct loading if function not found
      if (splashScreen) {
        splashScreen.classList.add('splash-hidden');
      }
      if (appContainer) {
        appContainer.classList.add('app-visible');
      }
      return;
    }
    
    window.loadDashboardData()
      .then(() => {
        console.log('Dashboard data loaded successfully, transitioning splash screen');
        // After data is loaded, handle splash screen transition
        setTimeout(() => {
          if (splashScreen) {
            splashScreen.classList.add('splash-hidden');
            console.log('Added splash-hidden class to splash screen');
          }
          if (appContainer) {
            appContainer.style.opacity = '1';
            appContainer.classList.add('app-visible');
            console.log('Added app-visible class to app container');
          }
          
          // Remove splash screen from DOM after transition
          setTimeout(() => {
            if (splashScreen) {
              splashScreen.remove();
              console.log('Removed splash screen from DOM');
            }
          }, 600);
        }, 2000); // Show splash screen for at least 2 seconds to ensure smooth transition
      })
      .catch(error => {
        console.error('Error loading dashboard:', error);
        // Show error in splash screen
        const subtitle = document.querySelector('.splash-subtitle');
        if (subtitle) {
          subtitle.textContent = 'Error loading dashboard. Please try again.';
        }
      });
  }
});

// Initialize the dashboard without authentication check
function initializePage() {
  console.log('Skipping authentication check in initializePage');
  
  // Create a mock session if one doesn't exist
  try {
    let session = localStorage.getItem('eliva_session');
    if (!session) {
      const mockSession = {
        username: 'User',
        loggedIn: true,
        loginTime: new Date().toISOString(),
        sessionId: Date.now().toString(36) + Math.random().toString(36).substr(2),
        expiration: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
      };
      localStorage.setItem('eliva_session', JSON.stringify(mockSession));
    }
  } catch (error) {
    console.error('Error with localStorage session:', error);
  }
  
  // Directly initialize dashboard components without authentication check
  initializeDashboardComponents();
  
  function initializeDashboardComponents() {
    
    // Add refresh button functionality
    const refreshBtn = document.getElementById('refresh-dashboard');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', Dashboard.refreshDashboard);
    }
    
    // Add export PDF functionality
    const exportBtn = document.getElementById('export-dashboard');
    if (exportBtn) {
      exportBtn.addEventListener('click', Dashboard.exportDashboardPDF);
    }

    // View alerts modal
    const viewAlertsBtn = document.getElementById('view-alerts');
    if (viewAlertsBtn) {
      viewAlertsBtn.addEventListener('click', () => {
        const alertsModal = new bootstrap.Modal(document.getElementById('alertsModal'));
        Dashboard.loadAlertItems();
        alertsModal.show();
      });
    }
    
    // Daily report settings
    loadDailyReportSettings();
    
    // Choose directory button
    const chooseDirectoryBtn = document.getElementById('choose-directory');
    if (chooseDirectoryBtn) {
      chooseDirectoryBtn.addEventListener('click', async () => {
        try {
          const result = await window.electronAPI.savePdf({
            defaultPath: document.getElementById('report-directory').value,
            properties: ['openDirectory', 'createDirectory']
          });
          
          if (result) {
            document.getElementById('report-directory').value = result;
          }
        } catch (error) {
          console.error('Error selecting directory:', error);
          Dashboard.showNotification('Error selecting directory', 'error');
        }
      });
    }
    
    // Browse directory button
    const browseDirectoryBtn = document.getElementById('browse-directory');
    if (browseDirectoryBtn) {
      browseDirectoryBtn.addEventListener('click', async () => {
        try {
          if (window.electronAPI && window.electronAPI.selectDirectory) {
            const result = await window.electronAPI.selectDirectory();
            if (result && !result.canceled && result.filePaths.length > 0) {
              const directoryInput = document.getElementById('report-directory');
              if (directoryInput) {
                directoryInput.value = result.filePaths[0];
              }
            }
          } else {
            Dashboard.showNotification('Directory selection not available', 'warning');
          }
        } catch (error) {
          console.error('Error selecting directory:', error);
          Dashboard.showNotification('Error selecting directory', 'error');
        }
      });
    }

    // Generate report now button
    const generateReportBtn = document.getElementById('generate-report-now');
    if (generateReportBtn) {
      generateReportBtn.addEventListener('click', async () => {
        try {
          // Show loading state
          generateReportBtn.disabled = true;
          generateReportBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Generating...';
          
          // Save settings first to ensure they're up to date
          await saveDailyReportSettings();
          
          // Use AutoReportsManager if available, otherwise fallback to Electron API
          if (window.AutoReportsManager) {
            await window.AutoReportsManager.generateReportNow();
            Dashboard.showNotification('Daily reports generated successfully!', 'success');
          } else if (window.electronAPI && window.electronAPI.generateDailyReportNow) {
            const result = await window.electronAPI.generateDailyReportNow();
            
            if (result.success) {
              Dashboard.showNotification(`Report generated: ${result.message}`, 'success');
              
              // Ask if user wants to open the file
              if (confirm('Report generated successfully! Do you want to open it?')) {
                window.electronAPI.openFile(result.filePath);
              }
            } else {
              Dashboard.showNotification(result.message || 'No sales to report', 'warning');
            }
          } else {
            Dashboard.showNotification('Report generation not available', 'error');
          }
        } catch (error) {
          console.error('Error generating report:', error);
          Dashboard.showNotification('Error generating report', 'error');
        } finally {
          // Reset button state
          generateReportBtn.disabled = false;
          generateReportBtn.innerHTML = '<i class="fas fa-file-pdf me-2"></i> Generate Today\'s Report Now';
        }
      });
    }
    
    // Update save settings button to save both general and report settings
    // Only add this handler if we're on the dashboard page
    const saveSettingsBtn = document.getElementById('save-settings');
    if (saveSettingsBtn && window.location.pathname.includes('dashboard.html')) {
      // Replace the existing click event handler
      const oldClickHandler = saveSettingsBtn.onclick;
      saveSettingsBtn.onclick = null;
      
      saveSettingsBtn.addEventListener('click', async () => {
        try {
          // Save general settings
          const companyName = document.getElementById('company-name').value;
          const alertThreshold = parseInt(document.getElementById('alert-threshold').value);
          const currency = document.getElementById('currency').value;

          await window.electronAPI.updateSettings({
            companyName,
            alertThreshold,
            currency
          });
        
          // Save daily report settings
          await saveDailyReportSettings();
          
          // Close modal
          const settingsModal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
          settingsModal.hide();
    
          // Show success notification
          Dashboard.showNotification('Settings saved successfully', 'success');
          
          // Reload dashboard
          loadDashboardData();
        } catch (error) {
          console.error('Error saving settings:', error);
          Dashboard.showNotification('Error saving settings', 'error');
        }
      });
    }
    
    // Add the listeners for low stock alerts
    // Listen for low stock alerts from the main process
    const unsubscribeLowStockAlert = window.electronAPI.onLowStockAlert((lowStockItems) => {
      // Update the UI with the new alerts
      const alertBadge = document.getElementById('alerts-badge');
      if (alertBadge) {
        alertBadge.textContent = lowStockItems.length;
        alertBadge.classList.toggle('d-none', lowStockItems.length === 0);
        document.getElementById('view-alerts').classList.toggle('d-none', lowStockItems.length === 0);
      }
      
      // Find critical items (at or below half of alert threshold)
      const criticalItems = lowStockItems.filter(item => item.quantity <= item.alertThreshold / 2);
      
      // Play sound for critical alerts
      if (criticalItems.length > 0) {
        Dashboard.playAlertSound();
      }
      
      // Show notification
      if (lowStockItems.length > 0) {
        const itemNames = lowStockItems.slice(0, 3).map(item => `${item.description} (${item.quantity} left)`);
        let message = `${lowStockItems.length} items are low in stock!`;
        
        if (lowStockItems.length <= 3) {
          message += `<br>Low items: ${itemNames.join(', ')}`;
        } else {
          message += `<br>Including: ${itemNames.join(', ')}... and ${lowStockItems.length - 3} more`;
        }
        
        Dashboard.showNotification(message, 'warning');
        
        // Pre-load the alerts into the modal
        Dashboard.loadAlertItems();
      }
    });
    
    // Listen for open alerts modal event from the main process
    const unsubscribeOpenAlertsModal = window.electronAPI.onOpenAlertsModal(() => {
      // Get the modal element and show it
      const alertsModal = new bootstrap.Modal(document.getElementById('alertsModal'));
      if (alertsModal) {
        alertsModal.show();
      }
    });
    
    // Clean up event listeners when page is unloaded
    window.addEventListener('beforeunload', () => {
      if (unsubscribeLowStockAlert) unsubscribeLowStockAlert();
      if (unsubscribeOpenAlertsModal) unsubscribeOpenAlertsModal();
    });
    
    // Expose notification function globally
    window.showNotification = Dashboard.showNotification;
    
    // Load initial dashboard data
    loadDashboardData();
  }
}

// Load daily report settings
async function loadDailyReportSettings() {
  try {
    let settings = {};
    
    if (window.electronAPI && window.electronAPI.getDailyReportSettings) {
      settings = await window.electronAPI.getDailyReportSettings();
    } else {
      // Fallback to localStorage
      settings = JSON.parse(localStorage.getItem('dailyReportSettings') || '{}');
    }
    
    // Update UI with settings (check if elements exist first)
    const enableElement = document.getElementById('enable-daily-reports');
    const hourElement = document.getElementById('report-hour');
    const minuteElement = document.getElementById('report-minute');
    const directoryElement = document.getElementById('report-directory');
    const notificationElement = document.getElementById('show-notifications');
    const salesElement = document.getElementById('include-sales-report');
    const inventoryElement = document.getElementById('include-inventory-report');
    const profitElement = document.getElementById('include-profit-report');
    const startupElement = document.getElementById('generate-on-startup');
    
    if (enableElement) enableElement.checked = settings.enabled !== false;
    if (hourElement) hourElement.value = settings.hour || 0;
    if (minuteElement) minuteElement.value = settings.minute || 0;
    if (directoryElement) directoryElement.value = settings.directory || '';
    if (notificationElement) notificationElement.checked = settings.showNotification !== false;
    if (salesElement) salesElement.checked = settings.includeSales !== false;
    if (inventoryElement) inventoryElement.checked = settings.includeInventory !== false;
    if (profitElement) profitElement.checked = settings.includeProfit || false;
    if (startupElement) startupElement.checked = settings.generateOnStartup || false;
  } catch (error) {
    console.error('Error loading daily report settings:', error);
  }
}

// Save daily report settings
async function saveDailyReportSettings() {
  try {
    // Check if daily report elements exist (they might not exist on all pages)
    const enableElement = document.getElementById('enable-daily-reports');
    const hourElement = document.getElementById('report-hour');
    const minuteElement = document.getElementById('report-minute');
    const directoryElement = document.getElementById('report-directory');
    const notificationElement = document.getElementById('show-notifications');
    
    // If elements don't exist, skip saving daily report settings
    if (!enableElement || !hourElement || !minuteElement || !directoryElement || !notificationElement) {
      console.log('Daily report settings elements not found, skipping daily report settings save');
      return;
    }
    
    const salesElement = document.getElementById('include-sales-report');
    const inventoryElement = document.getElementById('include-inventory-report');
    const profitElement = document.getElementById('include-profit-report');
    const startupElement = document.getElementById('generate-on-startup');
    
    const settings = {
      enabled: enableElement.checked,
      hour: parseInt(hourElement.value),
      minute: parseInt(minuteElement.value),
      directory: directoryElement.value,
      showNotification: notificationElement.checked,
      includeSales: salesElement ? salesElement.checked : true,
      includeInventory: inventoryElement ? inventoryElement.checked : true,
      includeProfit: profitElement ? profitElement.checked : false,
      generateOnStartup: startupElement ? startupElement.checked : false
    };
    
    // Save to localStorage as well for the auto-reports system
    localStorage.setItem('dailyReportSettings', JSON.stringify(settings));
    
    // Update AutoReportsManager if available
    if (window.AutoReportsManager) {
      window.AutoReportsManager.updateSettings(settings);
    }
    
    // Try to save to Electron API if available
    if (window.electronAPI && window.electronAPI.updateDailyReportSettings) {
      return await window.electronAPI.updateDailyReportSettings(settings);
    }
    
    return true;
  } catch (error) {
    console.error('Error saving daily report settings:', error);
    throw error;
  }
} 