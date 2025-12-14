/**
 * Main entry point for the Electron app
 */

// Initialize error handler first to catch any startup errors
const errorHandler = require('./error-handler');
errorHandler.init();

// Import main.js which contains the app logic
require('./main');

// Import the reports fix
let reportsFix = { addReportDataHandler: () => console.log('Reports fix module not available') };
try {
  // First try to load from the src directory (for packaged app)
  reportsFix = require('../fix-reports-final');
  console.log('Reports fix module loaded from src directory');
} catch (error) {
  try {
    // Then try to load from the root directory (for development)
    reportsFix = require('../../fix-reports-final');
    console.log('Reports fix module loaded from root directory');
  } catch (secondError) {
    console.log('Reports fix module not found in any location, skipping...');
  }
}

// Apply the reports fix after the app is ready
const { app } = require('electron');
app.whenReady().then(() => {
  try {
    // Add the report data handler
    reportsFix.addReportDataHandler();
    console.log('Reports fix applied successfully');
  } catch (error) {
    console.log('Failed to apply reports fix:', error.message);
  }
}); 