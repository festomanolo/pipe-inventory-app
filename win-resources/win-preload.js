
/**
 * Windows Preload Script
 * This script is injected before the renderer process loads
 */

const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

// Get app path
const appPath = require('electron').remote.app.getAppPath();
const resourcesPath = path.join(path.dirname(appPath), 'resources');

// Load Windows-specific fixes
window.addEventListener('DOMContentLoaded', () => {
  console.log('Windows preload script loaded');
  
  // Check if we're on the reports page
  if (window.location.href.includes('reports.html')) {
    console.log('Reports page detected, applying Windows fixes');
    
    // Load Windows-specific reports CSS
    const winCssLink = document.createElement('link');
    winCssLink.rel = 'stylesheet';
    winCssLink.href = '../resources/win-reports-fix.css';
    document.head.appendChild(winCssLink);
    
    // Load Windows-specific reports JS
    const winScript = document.createElement('script');
    winScript.src = '../resources/win-reports-fix.js';
    document.body.appendChild(winScript);
  }
});
