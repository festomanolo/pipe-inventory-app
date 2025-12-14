/**
 * Database Utility Module
 * Provides a consistent interface for database operations across the application
 */

// This module serves as a bridge between the renderer process and the main process
// for database operations using the Electron IPC system

/**
 * Get all inventory items
 * @returns {Promise<Array>} Array of inventory items
 */
async function getInventory() {
  try {
    return await window.electronAPI.getInventory();
  } catch (error) {
    console.error('Error getting inventory:', error);
    throw error;
  }
}

/**
 * Add a new inventory item
 * @param {Object} item - The inventory item to add
 * @returns {Promise<Object>} The saved item with ID
 */
async function addInventoryItem(item) {
  try {
    return await window.electronAPI.addInventoryItem(item);
  } catch (error) {
    console.error('Error adding inventory item:', error);
    throw error;
  }
}

/**
 * Update an existing inventory item
 * @param {Object} item - The inventory item to update
 * @returns {Promise<Object>} The updated item
 */
async function updateInventoryItem(item) {
  try {
    return await window.electronAPI.updateInventoryItem(item);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    throw error;
  }
}

/**
 * Delete an inventory item
 * @param {string} itemId - The ID of the item to delete
 * @returns {Promise<boolean>} Success status
 */
async function deleteInventoryItem(itemId) {
  try {
    return await window.electronAPI.deleteInventoryItem(itemId);
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    throw error;
  }
}

/**
 * Get all sales records
 * @returns {Promise<Array>} Array of sales records
 */
async function getSales() {
  try {
    return await window.electronAPI.getSales();
  } catch (error) {
    console.error('Error getting sales:', error);
    throw error;
  }
}

/**
 * Add a new sale record
 * @param {Object} sale - The sale record to add
 * @returns {Promise<Object>} The saved sale with ID
 */
async function addSale(sale) {
  try {
    return await window.electronAPI.addSale(sale);
  } catch (error) {
    console.error('Error adding sale:', error);
    throw error;
  }
}

/**
 * Delete a sale record
 * @param {string} saleId - The ID of the sale to delete
 * @returns {Promise<boolean>} Success status
 */
async function deleteSale(saleId) {
  try {
    return await window.electronAPI.deleteSale(saleId);
  } catch (error) {
    console.error('Error deleting sale:', error);
    throw error;
  }
}

/**
 * Get application settings
 * @returns {Promise<Object>} Application settings
 */
async function getSettings() {
  try {
    return await window.electronAPI.getSettings();
  } catch (error) {
    console.error('Error getting settings:', error);
    throw error;
  }
}

/**
 * Update application settings
 * @param {Object} settings - The settings to update
 * @returns {Promise<Object>} Updated settings
 */
async function updateSettings(settings) {
  try {
    return await window.electronAPI.updateSettings(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
}

// Export all database functions
window.DB = {
  getInventory,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getSales,
  addSale,
  deleteSale,
  getSettings,
  updateSettings
};
