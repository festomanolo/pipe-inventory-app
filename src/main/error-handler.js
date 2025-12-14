/**
 * Error handler for the main process
 */
const { dialog } = require('electron');
const log = require('electron-log');

function init() {
  // Store the original showErrorBox function
  const originalShowErrorBox = dialog.showErrorBox;

  // Override the showErrorBox function to suppress specific errors
  dialog.showErrorBox = function(title, message) {
    // Check if the error is about the missing fix-reports-final module
    if (message.includes('Cannot find module') && 
        (message.includes('fix-reports-final') || message.includes('reports-fix'))) {
      // Log the error but don't show the dialog
      log.warn('Suppressed error dialog:', { title, message });
      return;
    }

    // For other errors, use the original function
    return originalShowErrorBox(title, message);
  };

  // Handle uncaught exceptions in the main process
  process.on('uncaughtException', (error) => {
    log.error('Uncaught exception in main process:', error);

    // Check if it's the module not found error we want to suppress
    if (error.message.includes('Cannot find module') && 
        (error.message.includes('fix-reports-final') || error.message.includes('reports-fix'))) {
      // Just log it, don't crash the app
      log.warn('Suppressed uncaught exception for missing module');
      return;
    }
  });

  log.info('Error handler initialized');
}

module.exports = { init }; 