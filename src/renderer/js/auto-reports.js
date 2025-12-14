/**
 * Automatic Daily Reports System
 * Handles scheduled generation of daily sales and inventory reports
 */

class AutoReportsManager {
  constructor() {
    this.scheduledTimeout = null;
    this.checkInterval = null;
    this.settings = this.loadSettings();
    this.lastGeneratedDate = localStorage.getItem('lastAutoReportDate');
    
    console.log('AutoReportsManager initialized');
  }

  // Load settings from localStorage
  loadSettings() {
    try {
      const settings = JSON.parse(localStorage.getItem('dailyReportSettings') || '{}');
      return {
        enabled: settings.enabled !== false,
        hour: settings.hour || 0,
        minute: settings.minute || 0,
        directory: settings.directory || '',
        includeSales: settings.includeSales !== false,
        includeInventory: settings.includeInventory !== false,
        includeProfit: settings.includeProfit || false,
        showNotification: settings.showNotification !== false,
        generateOnStartup: settings.generateOnStartup || false
      };
    } catch (error) {
      console.error('Error loading auto-report settings:', error);
      return {
        enabled: true,
        hour: 0,
        minute: 0,
        directory: '',
        includeSales: true,
        includeInventory: true,
        includeProfit: false,
        showNotification: true,
        generateOnStartup: false
      };
    }
  }

  // Save settings to localStorage
  saveSettings(settings) {
    try {
      this.settings = { ...this.settings, ...settings };
      localStorage.setItem('dailyReportSettings', JSON.stringify(this.settings));
      console.log('Auto-report settings saved:', this.settings);
      
      // Restart scheduling with new settings
      this.startScheduling();
      return true;
    } catch (error) {
      console.error('Error saving auto-report settings:', error);
      return false;
    }
  }

  // Start the automatic report scheduling
  startScheduling() {
    this.stopScheduling(); // Clear any existing scheduling
    
    if (!this.settings.enabled) {
      console.log('Auto-reports disabled, not scheduling');
      return;
    }

    console.log(`Scheduling daily reports for ${this.settings.hour}:${this.settings.minute.toString().padStart(2, '0')}`);
    
    // Schedule the next report
    this.scheduleNextReport();
    
    // Check every minute if it's time to generate a report
    this.checkInterval = setInterval(() => {
      this.checkIfTimeToGenerate();
    }, 60000); // Check every minute
    
    // Check for missed reports on startup
    if (this.settings.generateOnStartup) {
      this.checkForMissedReports();
    }
  }

  // Stop automatic report scheduling
  stopScheduling() {
    if (this.scheduledTimeout) {
      clearTimeout(this.scheduledTimeout);
      this.scheduledTimeout = null;
    }
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    console.log('Auto-report scheduling stopped');
  }

  // Schedule the next report generation
  scheduleNextReport() {
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(this.settings.hour, this.settings.minute, 0, 0);
    
    // If the scheduled time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    const timeUntilNext = scheduledTime.getTime() - now.getTime();
    
    console.log(`Next report scheduled for: ${scheduledTime.toLocaleString()}`);
    console.log(`Time until next report: ${Math.round(timeUntilNext / 1000 / 60)} minutes`);
    
    this.scheduledTimeout = setTimeout(() => {
      this.generateDailyReports();
      this.scheduleNextReport(); // Schedule the next one
    }, timeUntilNext);
  }

  // Check if it's time to generate a report (backup check)
  checkIfTimeToGenerate() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const today = now.toDateString();
    
    // Check if it's the scheduled time and we haven't generated today's report yet
    if (currentHour === this.settings.hour && 
        currentMinute === this.settings.minute && 
        this.lastGeneratedDate !== today) {
      
      console.log('Time to generate daily report (backup check)');
      this.generateDailyReports();
    }
  }

  // Check for missed reports on startup
  checkForMissedReports() {
    const now = new Date();
    const today = now.toDateString();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString();
    
    // If we haven't generated today's report and it's past the scheduled time
    const scheduledTime = new Date();
    scheduledTime.setHours(this.settings.hour, this.settings.minute, 0, 0);
    
    if (now > scheduledTime && this.lastGeneratedDate !== today) {
      console.log('Missed report detected, generating now...');
      setTimeout(() => {
        this.generateDailyReports();
      }, 5000); // Wait 5 seconds after startup
    }
  }

  // Generate the daily reports
  async generateDailyReports() {
    try {
      console.log('Generating automatic daily reports...');
      
      const today = new Date();
      const todayString = today.toDateString();
      
      // Check if we already generated today's report
      if (this.lastGeneratedDate === todayString) {
        console.log('Daily report already generated today, skipping');
        return;
      }

      // Get data for reports
      const [inventory, sales] = await Promise.all([
        this.getInventoryData(),
        this.getSalesData()
      ]);

      const reports = [];
      
      // Generate Sales Report
      if (this.settings.includeSales) {
        const salesReport = await this.generateSalesReport(sales, today);
        if (salesReport) reports.push(salesReport);
      }
      
      // Generate Inventory Report
      if (this.settings.includeInventory) {
        const inventoryReport = await this.generateInventoryReport(inventory, today);
        if (inventoryReport) reports.push(inventoryReport);
      }
      
      // Generate Profit Report
      if (this.settings.includeProfit) {
        const profitReport = await this.generateProfitReport(sales, today);
        if (profitReport) reports.push(profitReport);
      }

      // Save reports to database
      for (const report of reports) {
        await this.saveReport(report);
      }

      // Update last generated date
      this.lastGeneratedDate = todayString;
      localStorage.setItem('lastAutoReportDate', todayString);

      // Show notification if enabled
      if (this.settings.showNotification) {
        this.showNotification(`Generated ${reports.length} daily report(s) successfully`, 'success');
      }

      console.log(`Successfully generated ${reports.length} daily reports`);
      
    } catch (error) {
      console.error('Error generating daily reports:', error);
      
      if (this.settings.showNotification) {
        this.showNotification('Error generating daily reports', 'error');
      }
    }
  }

  // Get inventory data
  async getInventoryData() {
    try {
      if (window.electronAPI && window.electronAPI.getInventory) {
        return await window.electronAPI.getInventory();
      }
      return JSON.parse(localStorage.getItem('inventory_backup') || '[]');
    } catch (error) {
      console.error('Error getting inventory data:', error);
      return [];
    }
  }

  // Get sales data
  async getSalesData() {
    try {
      if (window.electronAPI && window.electronAPI.getSales) {
        return await window.electronAPI.getSales();
      }
      return JSON.parse(localStorage.getItem('sales_backup') || '[]');
    } catch (error) {
      console.error('Error getting sales data:', error);
      return [];
    }
  }

  // Generate sales report
  async generateSalesReport(sales, date) {
    try {
      const todaySales = sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate.toDateString() === date.toDateString();
      });

      const totalSales = todaySales.reduce((sum, sale) => sum + (sale.total || 0), 0);
      const totalItems = todaySales.reduce((sum, sale) => sum + (sale.quantity || 0), 0);

      const report = {
        id: 'auto-sales-' + Date.now(),
        title: `Daily Sales Report - ${date.toLocaleDateString()}`,
        type: 'sales',
        date: date.toISOString(),
        description: `Automatic daily sales report for ${date.toLocaleDateString()}`,
        summary: {
          totalSales,
          totalItems,
          transactionCount: todaySales.length
        },
        tableData: todaySales.map(sale => ({
          'Time': new Date(sale.date).toLocaleTimeString(),
          'Item': sale.itemName || 'Unknown',
          'Quantity': sale.quantity || 0,
          'Price': sale.price || 0,
          'Total': sale.total || 0,
          'Customer': sale.customerName || 'Walk-in'
        })),
        createdAt: new Date().toISOString(),
        isAutoGenerated: true
      };

      return report;
    } catch (error) {
      console.error('Error generating sales report:', error);
      return null;
    }
  }

  // Generate inventory report
  async generateInventoryReport(inventory, date) {
    try {
      const lowStockItems = inventory.filter(item => (item.quantity || 0) < (item.alertThreshold || 10));
      const totalValue = inventory.reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || 0)), 0);
      const totalItems = inventory.reduce((sum, item) => sum + (item.quantity || 0), 0);

      const report = {
        id: 'auto-inventory-' + Date.now(),
        title: `Daily Inventory Report - ${date.toLocaleDateString()}`,
        type: 'inventory',
        date: date.toISOString(),
        description: `Automatic daily inventory report for ${date.toLocaleDateString()}`,
        summary: {
          totalItems,
          totalValue,
          lowStockCount: lowStockItems.length,
          totalProducts: inventory.length
        },
        tableData: inventory.map(item => ({
          'Item': item.name || 'Unknown',
          'Type': item.type || 'Unknown',
          'Diameter': item.diameter || 'N/A',
          'Color': item.color || 'N/A',
          'Quantity': item.quantity || 0,
          'Price': item.price || 0,
          'Value': (item.quantity || 0) * (item.price || 0),
          'Status': (item.quantity || 0) < (item.alertThreshold || 10) ? 'Low Stock' : 'In Stock'
        })),
        lowStockItems: lowStockItems,
        createdAt: new Date().toISOString(),
        isAutoGenerated: true
      };

      return report;
    } catch (error) {
      console.error('Error generating inventory report:', error);
      return null;
    }
  }

  // Generate profit report
  async generateProfitReport(sales, date) {
    try {
      const todaySales = sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate.toDateString() === date.toDateString();
      });

      const totalRevenue = todaySales.reduce((sum, sale) => sum + (sale.total || 0), 0);
      const totalCost = todaySales.reduce((sum, sale) => sum + ((sale.quantity || 0) * (sale.cost || sale.price * 0.7)), 0);
      const totalProfit = totalRevenue - totalCost;

      const report = {
        id: 'auto-profit-' + Date.now(),
        title: `Daily Profit Report - ${date.toLocaleDateString()}`,
        type: 'profit',
        date: date.toISOString(),
        description: `Automatic daily profit report for ${date.toLocaleDateString()}`,
        summary: {
          totalRevenue,
          totalCost,
          totalProfit,
          profitMargin: totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(2) : 0
        },
        tableData: todaySales.map(sale => ({
          'Time': new Date(sale.date).toLocaleTimeString(),
          'Item': sale.itemName || 'Unknown',
          'Quantity': sale.quantity || 0,
          'Revenue': sale.total || 0,
          'Cost': (sale.quantity || 0) * (sale.cost || sale.price * 0.7),
          'Profit': (sale.total || 0) - ((sale.quantity || 0) * (sale.cost || sale.price * 0.7))
        })),
        createdAt: new Date().toISOString(),
        isAutoGenerated: true
      };

      return report;
    } catch (error) {
      console.error('Error generating profit report:', error);
      return null;
    }
  }

  // Save report to database
  async saveReport(report) {
    try {
      if (window.electronAPI && window.electronAPI.addReport) {
        return await window.electronAPI.addReport(report);
      } else {
        // Fallback to localStorage
        const reports = JSON.parse(localStorage.getItem('reports_backup') || '[]');
        reports.push(report);
        localStorage.setItem('reports_backup', JSON.stringify(reports));
        return report;
      }
    } catch (error) {
      console.error('Error saving report:', error);
      throw error;
    }
  }

  // Show notification
  showNotification(message, type = 'info') {
    try {
      // Try to use the app's notification system if available
      if (window.Dashboard && window.Dashboard.showNotification) {
        window.Dashboard.showNotification(message, type);
        return;
      }

      // Fallback to browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Eliva Hardware - Auto Reports', {
          body: message,
          icon: '../../public/assets/images/logo.png'
        });
      } else {
        console.log('Auto-report notification:', message);
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  // Generate report now (manual trigger)
  async generateReportNow() {
    console.log('Generating daily report manually...');
    await this.generateDailyReports();
  }

  // Get current settings
  getSettings() {
    return { ...this.settings };
  }

  // Update settings
  updateSettings(newSettings) {
    return this.saveSettings(newSettings);
  }
}

// Create global instance
window.AutoReportsManager = new AutoReportsManager();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Start scheduling if we're not on the login page
  if (!window.location.pathname.includes('login.html')) {
    setTimeout(() => {
      window.AutoReportsManager.startScheduling();
    }, 2000); // Wait 2 seconds after page load
  }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AutoReportsManager;
}