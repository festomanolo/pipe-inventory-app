const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // Database operations
    getInventory: () => ipcRenderer.invoke('get-inventory'),
    getItem: (id) => ipcRenderer.invoke('get-item', id),
    addItem: (item) => ipcRenderer.invoke('add-item', item),
    updateItem: (id, item) => ipcRenderer.invoke('update-item', id, item),
    deleteItem: (id) => ipcRenderer.invoke('delete-item', id),
    createSale: (saleData) => ipcRenderer.invoke('create-sale', saleData),
    getSales: (filters) => ipcRenderer.invoke('get-sales', filters),
    getDailyReport: (date) => ipcRenderer.invoke('get-daily-report', date),
    getLowStockAlerts: () => ipcRenderer.invoke('get-low-stock-alerts'),
    getProfitLoss: (period) => ipcRenderer.invoke('get-profit-loss', period),
    
    // Window controls
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    maximizeWindow: () => ipcRenderer.send('maximize-window'),
    closeWindow: () => ipcRenderer.send('close-window'),
    
    // Listen for events
    onNavigate: (callback) => {
      ipcRenderer.on('navigate', (event, destination) => callback(destination));
      return () => {
        ipcRenderer.removeAllListeners('navigate');
      };
    }
  }
); 