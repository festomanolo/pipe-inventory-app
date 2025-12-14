const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const Database = require('./database/db');

// Initialize database
const db = new Database();

let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    frame: false,
    transparent: true,
    backgroundColor: '#00000000'
  });

  // Load the index.html of the app
  mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));

  // Open DevTools in development mode
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // Create custom title bar menu
  const menu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        {
          label: 'Settings',
          click: () => mainWindow.webContents.send('navigate', 'settings')
        },
        { type: 'separator' },
        {
          label: 'Exit',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ]);

  Menu.setApplicationMenu(menu);
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handlers for database operations
ipcMain.handle('get-inventory', async () => {
  return await db.getAllItems();
});

ipcMain.handle('get-item', async (event, id) => {
  return await db.getItem(id);
});

ipcMain.handle('add-item', async (event, item) => {
  return await db.addItem(item);
});

ipcMain.handle('update-item', async (event, id, item) => {
  return await db.updateItem(id, item);
});

ipcMain.handle('delete-item', async (event, id) => {
  return await db.deleteItem(id);
});

ipcMain.handle('create-sale', async (event, saleData) => {
  return await db.createSale(saleData);
});

ipcMain.handle('get-sales', async (event, filters) => {
  return await db.getSales(filters);
});

ipcMain.handle('get-daily-report', async (event, date) => {
  return await db.getDailyReport(date);
});

ipcMain.handle('get-low-stock-alerts', async () => {
  return await db.getLowStockAlerts();
});

ipcMain.handle('get-profit-loss', async (event, period) => {
  return await db.getProfitLoss(period);
});

// Window controls
ipcMain.on('minimize-window', () => {
  mainWindow.minimize();
});

ipcMain.on('maximize-window', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.on('close-window', () => {
  mainWindow.close();
});