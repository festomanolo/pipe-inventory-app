
/**
 * Windows Main Process Extensions
 * This script adds Windows-specific functionality to the main process
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// Add Windows-specific code to the main process
exports.setupWindowsSpecificFeatures = function(mainWindow) {
  console.log('Setting up Windows-specific features');
  
  // Add special handling for the reports page
  mainWindow.webContents.on('did-navigate', (event, url) => {
    if (url.includes('reports.html')) {
      console.log('Reports page loaded in Windows, applying fixes');
      
      // Inject Windows-specific fixes
      mainWindow.webContents.executeJavaScript(`
        // Load Windows-specific CSS
        const winCssLink = document.createElement('link');
        winCssLink.rel = 'stylesheet';
        winCssLink.href = '../resources/win-reports-fix.css';
        document.head.appendChild(winCssLink);
        
        // Load Windows-specific JS
        const winScript = document.createElement('script');
        winScript.src = '../resources/win-reports-fix.js';
        document.body.appendChild(winScript);
        
        console.log('Windows-specific reports fixes applied');
      `);
    }
  });
  
  return mainWindow;
};
