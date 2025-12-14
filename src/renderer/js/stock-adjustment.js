/**
 * stock-adjustment.js
 * Handles inventory stock adjustments with tracking and history
 */

// Initialize global adjustment history object
window.adjustmentHistory = {};

/**
 * Function to handle stock adjustment
 * @param {Object} adjustmentData - The adjustment data
 * @returns {Promise<Object>} The updated item
 */
async function adjustInventoryStock(adjustmentData) {
  try {
    if (!adjustmentData || !adjustmentData.itemId) {
      throw new Error('Missing item ID for stock adjustment');
    }
    
    console.log('Processing stock adjustment:', adjustmentData);
    
    // First, check if we were provided with the current item directly
    let currentItem = null;
    let retrievalMethod = '';
    
    // Use the provided current item if available
    if (adjustmentData.currentItem && adjustmentData.currentItem.id === adjustmentData.itemId) {
      currentItem = adjustmentData.currentItem;
      retrievalMethod = 'passed in adjustmentData';
      console.log('Using current item provided in adjustment data:', currentItem);
    }
    
    // If not, check the global inventory array
    if (!currentItem && window.inventory) {
      const itemFromInventory = window.inventory.find(item => item.id === adjustmentData.itemId);
      if (itemFromInventory) {
        currentItem = itemFromInventory;
        retrievalMethod = 'global inventory array';
        console.log('Found item in global inventory array:', currentItem);
      }
    }
    
    // If we still don't have the item, try to fetch it from the API
    if (!currentItem && window.electronAPI && typeof window.electronAPI.getInventoryItem === 'function') {
      try {
        currentItem = await window.electronAPI.getInventoryItem(adjustmentData.itemId);
        retrievalMethod = 'electronAPI.getInventoryItem';
        console.log('Retrieved item from API:', currentItem);
      } catch (apiError) {
        console.error('Error getting item from API:', apiError);
      }
    }
    
    // As a final fallback, try to find it in other global data sources
    if (!currentItem && window.inventoryData) {
      currentItem = window.inventoryData.find(item => item.id === adjustmentData.itemId);
      retrievalMethod = 'window.inventoryData';
      console.log('Found item in global inventoryData:', currentItem);
    }
    
    // If we still couldn't find the item, throw an error
    if (!currentItem) {
      throw new Error('Failed to retrieve current item data');
    }
    
    console.log(`Retrieved current item using ${retrievalMethod}:`, currentItem);
    
    // Calculate new quantity based on adjustment type
    let newQuantity = parseInt(currentItem.quantity) || 0;
    const adjustQty = parseInt(adjustmentData.quantity) || 0;
    
    switch (adjustmentData.type) {
      case 'add':
        newQuantity += adjustQty;
        break;
      case 'remove':
        newQuantity = Math.max(0, newQuantity - adjustQty);
        break;
      case 'set':
        newQuantity = Math.max(0, adjustQty);
        break;
      default:
        throw new Error('Invalid adjustment type');
    }
    
    // Create the adjustment record
    const adjustmentRecord = {
      id: Date.now().toString(),
      itemId: adjustmentData.itemId,
      date: new Date().toISOString(),
      type: adjustmentData.type,
      quantityBefore: currentItem.quantity,
      quantityAfter: newQuantity,
      adjustmentQuantity: adjustQty,
      reason: adjustmentData.reason,
      notes: adjustmentData.notes,
      user: 'Current User' // In a real app, this would be the logged-in user
    };
    
    // Store the adjustment record
    if (!window.adjustmentHistory[adjustmentData.itemId]) {
      window.adjustmentHistory[adjustmentData.itemId] = [];
    }
    window.adjustmentHistory[adjustmentData.itemId].unshift(adjustmentRecord);
    
    // Save to localStorage for persistence
    try {
      localStorage.setItem('adjustment_history', JSON.stringify(window.adjustmentHistory));
    } catch (storageError) {
      console.warn('Could not save adjustment history to localStorage:', storageError);
    }
    
    // Update the item with new quantity
    const updatedItem = { 
      ...currentItem, 
      quantity: newQuantity, 
      updatedAt: new Date().toISOString() 
    };
    
    console.log('Updated item with new quantity:', updatedItem);
    
    // Save the updated item to the database
    if (window.electronAPI && typeof window.electronAPI.updateInventoryItem === 'function') {
      try {
        const result = await window.electronAPI.updateInventoryItem(updatedItem);
        console.log('Item updated in database:', result);
      } catch (updateError) {
        console.error('Error updating item in database:', updateError);
        throw new Error(`Failed to save the updated quantity: ${updateError.message}`);
      }
    } else {
      console.warn('electronAPI.updateInventoryItem not available, changes may not persist');
    }
    
    // Update the item in the global inventory array if it exists
    if (window.inventory) {
      const itemIndex = window.inventory.findIndex(item => item.id === adjustmentData.itemId);
      if (itemIndex !== -1) {
        window.inventory[itemIndex] = { ...window.inventory[itemIndex], ...updatedItem };
        console.log('Updated item in global inventory array');
      }
    }
    
    return updatedItem;
  } catch (error) {
    console.error('Error in adjustInventoryStock:', error);
    throw error;
  }
}

/**
 * Get adjustment history for an item
 * @param {string} itemId - The item ID
 * @returns {Array} Array of adjustment records
 */
function getAdjustmentHistory(itemId) {
  // Load history from localStorage if not already loaded
  if (Object.keys(window.adjustmentHistory).length === 0) {
    try {
      const savedHistory = localStorage.getItem('adjustment_history');
      if (savedHistory) {
        window.adjustmentHistory = JSON.parse(savedHistory);
      }
    } catch (error) {
      console.error('Error loading adjustment history from localStorage:', error);
    }
  }
  
  return (window.adjustmentHistory[itemId] || []);
}

/**
 * Format a date string for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch (error) {
    return dateString;
  }
}

/**
 * Handle save adjustment button click
 * @param {Event} event - The submit event
 */
async function handleSaveAdjustment(event) {
  event.preventDefault();
  
  try {
    const itemId = document.getElementById('edit-item-id').value;
    const adjustmentType = document.querySelector('input[name="adjustment-type"]:checked').value;
    const quantity = parseInt(document.getElementById('adjustment-quantity').value);
    const reason = document.getElementById('adjustment-reason').value;
    const notes = document.getElementById('adjustment-notes').value;
    
    // Validate inputs
    if (!itemId) {
      throw new Error('Item ID is missing');
    }
    
    if (!quantity || quantity <= 0) {
      throw new Error('Please enter a valid quantity');
    }
    
    if (!reason) {
      throw new Error('Please select a reason for the adjustment');
    }
    
    // Show loading indicator
    const saveButton = document.getElementById('save-adjustment');
    const originalText = saveButton.innerHTML;
    saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
    saveButton.disabled = true;
    
    try {
      // Get current item from global inventory array if available
      let currentItem = null;
      if (window.inventory) {
        currentItem = window.inventory.find(item => item.id === itemId);
      }
      
      // Prepare adjustment data
      const adjustmentData = {
        itemId,
        type: adjustmentType,
        quantity,
        reason,
        notes,
        date: new Date().toISOString(),
        currentItem: currentItem
      };
      
      // Process adjustment
      const updatedItem = await adjustInventoryStock(adjustmentData);
      
      // Update the item in the global inventory array
      if (window.inventory) {
        const index = window.inventory.findIndex(item => item.id === itemId);
        if (index !== -1) {
          window.inventory[index] = { ...window.inventory[index], ...updatedItem };
          console.log('Updated item in global inventory array after adjustment:', window.inventory[index]);
        }
      }
      
      // Update displayed quantity in the modal
      document.getElementById('edit-item-quantity').value = updatedItem.quantity;
      document.getElementById('current-quantity').textContent = updatedItem.quantity;
      
      // Update status badge
      updateStockStatusBadge(updatedItem.quantity, updatedItem.alertThreshold || 10);
      
      // Update last updated time
      document.getElementById('last-updated').textContent = formatDate(updatedItem.updatedAt);
      
      // Load adjustment history
      loadAdjustmentHistory(itemId);
      
      // Update the main inventory display if filterInventory function is available
      if (typeof filterInventory === 'function') {
        console.log('Refreshing inventory display with updated data');
        filterInventory();
      } else if (typeof window.refreshInventoryData === 'function') {
        try {
          await window.refreshInventoryData(false); // Don't show notification again
        } catch (refreshError) {
          console.error('Error refreshing inventory after adjustment:', refreshError);
        }
      }
      
      // Show success notification
      if (window.NotificationSystem) {
        window.NotificationSystem.show(`Stock adjusted successfully. New quantity: ${updatedItem.quantity}`, { 
          type: 'success',
          title: 'Stock Updated'
        });
      } else {
        alert(`Stock adjusted successfully. New quantity: ${updatedItem.quantity}`);
      }
      
      // Reset form
      document.getElementById('adjustment-quantity').value = '';
      document.getElementById('adjustment-notes').value = '';
      document.getElementById('adjustment-reason').value = '';
      
      // Update the preview
      updateAdjustmentPreview();
      
    } finally {
      // Restore button state
      saveButton.innerHTML = originalText;
      saveButton.disabled = false;
    }
  } catch (error) {
    console.error('Error saving adjustment:', error);
    if (window.NotificationSystem) {
      window.NotificationSystem.show(`Error: ${error.message}`, { 
        type: 'error',
        title: 'Adjustment Failed'
      });
    } else {
      alert(`Error: ${error.message}`);
    }
  }
}

/**
 * Update adjustment preview text based on selected options
 */
function updateAdjustmentPreview() {
  const adjustmentType = document.querySelector('input[name="adjustment-type"]:checked').value;
  const quantity = parseInt(document.getElementById('adjustment-quantity').value) || 0;
  
  // Get current quantity from the display element, which should always be in sync
  const currentQuantity = parseInt(document.getElementById('current-quantity').textContent) || 0;
  const unit = document.getElementById('current-unit').textContent || 'pieces';
  
  let previewText = '';
  let previewClass = 'alert-info';
  
  switch (adjustmentType) {
    case 'add':
      previewText = `Adding ${quantity} ${unit} to current stock. New total will be ${currentQuantity + quantity} ${unit}.`;
      previewClass = 'alert-success';
      break;
    case 'remove':
      const newTotal = Math.max(0, currentQuantity - quantity);
      previewText = `Removing ${quantity} ${unit} from current stock. New total will be ${newTotal} ${unit}.`;
      previewClass = quantity > currentQuantity ? 'alert-danger' : 'alert-warning';
      break;
    case 'set':
      previewText = `Setting stock to exactly ${quantity} ${unit} (current: ${currentQuantity} ${unit}).`;
      previewClass = quantity < currentQuantity ? 'alert-warning' : 'alert-info';
      break;
  }
  
  const previewElement = document.getElementById('adjustment-preview');
  previewElement.innerHTML = `<strong>Preview:</strong> ${previewText}`;
  
  // Update alert class
  previewElement.className = `alert ${previewClass}`;
}

/**
 * Update the stock status badge based on quantity and threshold
 * @param {number} quantity - The current quantity
 * @param {number} threshold - The alert threshold
 */
function updateStockStatusBadge(quantity, threshold) {
  const badge = document.getElementById('stock-status-badge');
  
  if (quantity <= 0) {
    badge.textContent = 'Out of Stock';
    badge.className = 'badge bg-danger';
  } else if (quantity <= threshold) {
    badge.textContent = 'Low Stock';
    badge.className = 'badge bg-warning';
  } else {
    badge.textContent = 'In Stock';
    badge.className = 'badge bg-success';
  }
}

/**
 * Load adjustment history for an item into the history table
 * @param {string} itemId - The item ID
 */
function loadAdjustmentHistory(itemId) {
  const historyTable = document.getElementById('adjustment-history-tbody');
  const history = getAdjustmentHistory(itemId);
  
  if (!history || history.length === 0) {
    historyTable.innerHTML = `<tr><td colspan="6" class="text-center">No adjustment history found</td></tr>`;
    return;
  }
  
  // Sort by date (newest first)
  history.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Create table rows
  let html = '';
  history.forEach(record => {
    const typeText = record.type === 'add' ? 'Added' : (record.type === 'remove' ? 'Removed' : 'Set to');
    const typeClass = record.type === 'add' ? 'text-success' : (record.type === 'remove' ? 'text-danger' : 'text-primary');
    
    html += `
      <tr>
        <td>${formatDate(record.date)}</td>
        <td class="${typeClass}">${typeText}</td>
        <td>${record.adjustmentQuantity} (${record.quantityBefore} → ${record.quantityAfter})</td>
        <td>${record.reason}</td>
        <td>${record.notes || '-'}</td>
        <td>${record.user || 'System'}</td>
      </tr>
    `;
  });
  
  historyTable.innerHTML = html;
}

/**
 * Show edit modal with item data and load adjustment history
 * @param {Object} item - The item to edit
 */
function showEditModal(item) {
  if (!item) return;
  
  try {
    console.log('Opening edit modal for item:', item);
    
    // Store the current item in a global variable for reference
    window.currentEditItem = item;
    
    // Populate form fields
    document.getElementById('edit-item-id').value = item.id;
    document.getElementById('edit-item-category').value = item.category || '';
    
    // Populate product types based on category
    const categorySelect = document.getElementById('edit-item-category');
    const typeSelect = document.getElementById('edit-item-type');
    const customTypeContainer = document.getElementById('edit-custom-type-container');
    
    // Manually trigger the change event to populate product types
    const event = new Event('change');
    categorySelect.dispatchEvent(event);
    
    // Handle custom type
    if (item.category === 'Custom') {
      customTypeContainer.style.display = 'block';
      document.getElementById('edit-custom-type').value = item.type || '';
    } else {
      customTypeContainer.style.display = 'none';
      
      // Set type after options are populated
      setTimeout(() => {
        typeSelect.value = item.type || '';
        
        // If the type is not in the dropdown, create a new option
        if (typeSelect.value !== item.type && item.type) {
          const option = document.createElement('option');
          option.value = item.type;
          option.textContent = item.type;
          typeSelect.appendChild(option);
          typeSelect.value = item.type;
        }
      }, 100);
    }
    
    // Set other fields
    document.getElementById('edit-item-description').value = item.description || '';
    document.getElementById('edit-item-brand').value = item.brand || '';
    document.getElementById('edit-item-dimension').value = item.dimension || '';
    document.getElementById('edit-item-color').value = item.color || '';
    document.getElementById('edit-item-unit').value = item.unit || 'piece';
    document.getElementById('edit-item-sku').value = item.sku || '';
    document.getElementById('edit-item-quantity').value = item.quantity || 0;
    document.getElementById('edit-item-price').value = item.price || 0;
    document.getElementById('edit-item-alert').value = item.alertThreshold || 10;
    document.getElementById('edit-item-notes').value = item.notes || '';
    
    // Update stock adjustment info
    document.getElementById('current-quantity').textContent = item.quantity || 0;
    document.getElementById('current-unit').textContent = item.unit || 'pieces';
    document.getElementById('last-updated').textContent = item.updatedAt ? formatDate(item.updatedAt) : 'Never';
    
    // Update status badge
    updateStockStatusBadge(item.quantity, item.alertThreshold || 10);
    
    // Load adjustment history
    loadAdjustmentHistory(item.id);
    
    // Reset stock adjustment form
    document.getElementById('adjustment-quantity').value = '';
    document.getElementById('adjustment-reason').value = '';
    document.getElementById('adjustment-notes').value = '';
    document.getElementById('add-stock').checked = true;
    
    // Update adjustment preview
    updateAdjustmentPreview();
    
    // Open the modal
    const editModal = new bootstrap.Modal(document.getElementById('editItemModal'));
    editModal.show();
    
    // Switch to first tab
    document.getElementById('details-tab').click();
  } catch (error) {
    console.error('Error showing edit modal:', error);
  }
}

/**
 * Handle save item changes button click
 */
async function handleSaveItemChanges() {
  try {
    const itemId = document.getElementById('edit-item-id').value;
    if (!itemId) {
      throw new Error('Item ID is missing');
    }
    
    // Get the form data
    const category = document.getElementById('edit-item-category').value;
    const typeSelect = document.getElementById('edit-item-type').value;
    const customType = document.getElementById('edit-custom-type').value;
    const description = document.getElementById('edit-item-description').value;
    const brand = document.getElementById('edit-item-brand').value;
    const dimension = document.getElementById('edit-item-dimension').value;
    const color = document.getElementById('edit-item-color').value;
    const unit = document.getElementById('edit-item-unit').value;
    const sku = document.getElementById('edit-item-sku').value;
    const quantity = parseInt(document.getElementById('edit-item-quantity').value) || 0;
    const price = parseFloat(document.getElementById('edit-item-price').value) || 0;
    const alertThreshold = parseInt(document.getElementById('edit-item-alert').value) || 10;
    const notes = document.getElementById('edit-item-notes').value;
    
    // Validate required fields
    if (!category) {
      throw new Error('Category is required');
    }
    
    // Determine the type based on category
    let type;
    if (category === 'Custom') {
      type = customType;
      if (!type) {
        throw new Error('Custom type is required');
      }
    } else {
      type = typeSelect;
      if (!type) {
        throw new Error('Product type is required');
      }
    }
    
    if (!description) {
      throw new Error('Description is required');
    }
    
    if (!brand) {
      throw new Error('Brand is required');
    }
    
    // Show loading indicator
    const saveButton = document.getElementById('save-edit-item');
    const originalText = saveButton.innerHTML;
    saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
    saveButton.disabled = true;
    
    try {
      // Get the current item
      let currentItem;
      if (window.electronAPI && typeof window.electronAPI.getInventoryItem === 'function') {
        currentItem = await window.electronAPI.getInventoryItem(itemId);
      } else {
        // Try to get from global inventory data
        if (window.inventoryData) {
          currentItem = window.inventoryData.find(item => item.id === itemId);
        }
      }
      
      if (!currentItem) {
        throw new Error('Item not found');
      }
      
      // Create the updated item
      const updatedItem = {
        ...currentItem,
        category,
        type,
        description,
        brand,
        dimension,
        color,
        unit,
        sku,
        quantity,
        price,
        alertThreshold,
        notes,
        updatedAt: new Date().toISOString()
      };
      
      // Save the updated item
      let result;
      if (window.electronAPI && typeof window.electronAPI.updateInventoryItem === 'function') {
        result = await window.electronAPI.updateInventoryItem(updatedItem);
      } else {
        // Use inventory-handlers if available
        if (window.InventoryHandlers && typeof window.InventoryHandlers.updateInventoryItem === 'function') {
          result = await window.InventoryHandlers.updateInventoryItem(updatedItem);
        } else {
          throw new Error('No method available to update inventory item');
        }
      }
      
      if (!result) {
        throw new Error('Failed to update item');
      }
      
      // Close the modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('editItemModal'));
      if (modal) {
        modal.hide();
      }
      
      // Refresh inventory data
      if (typeof window.refreshInventoryData === 'function') {
        await window.refreshInventoryData();
      }
      
      // Show success notification
      if (window.NotificationSystem) {
        window.NotificationSystem.show(`Item "${description}" updated successfully`, { 
          type: 'success',
          title: 'Item Updated'
        });
      } else {
        alert(`Item updated successfully`);
      }
    } finally {
      // Restore button state
      saveButton.innerHTML = originalText;
      saveButton.disabled = false;
    }
  } catch (error) {
    console.error('Error saving item changes:', error);
    if (window.NotificationSystem) {
      window.NotificationSystem.show(`Error: ${error.message}`, { 
        type: 'error',
        title: 'Update Failed'
      });
    } else {
      alert(`Error: ${error.message}`);
    }
  }
}

// Initialize stock adjustment module when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Initializing stock adjustment module');
  
  // Initialize adjustment history from localStorage
  try {
    const savedHistory = localStorage.getItem('adjustment_history');
    if (savedHistory) {
      window.adjustmentHistory = JSON.parse(savedHistory);
      console.log('Loaded adjustment history from localStorage');
    } else {
      window.adjustmentHistory = {};
      console.log('No adjustment history found in localStorage, initialized empty object');
    }
  } catch (error) {
    console.error('Error loading adjustment history from localStorage:', error);
    window.adjustmentHistory = {};
  }
  
  // Set up event listeners for the adjustment form
  const adjustmentForm = document.getElementById('stock-adjustment-form');
  if (adjustmentForm) {
    adjustmentForm.addEventListener('submit', handleSaveAdjustment);
    console.log('Added submit event listener to stock adjustment form');
  }
  
  // Set up event listeners for adjustment quantity and type inputs to update preview
  const adjustmentQuantity = document.getElementById('adjustment-quantity');
  if (adjustmentQuantity) {
    adjustmentQuantity.addEventListener('input', updateAdjustmentPreview);
    console.log('Added input event listener to adjustment quantity field');
  }
  
  // Set up event listeners for adjustment type radio buttons
  const adjustmentTypes = document.querySelectorAll('input[name="adjustment-type"]');
  adjustmentTypes.forEach(radio => {
    radio.addEventListener('change', updateAdjustmentPreview);
  });
  console.log('Added change event listeners to adjustment type radios');
});

// Export functions to global scope
window.StockAdjustment = {
  adjustInventoryStock,
  getAdjustmentHistory,
  handleSaveAdjustment,
  updateAdjustmentPreview,
  updateStockStatusBadge,
  loadAdjustmentHistory,
  showEditModal,
  formatDate,
  handleSaveItemChanges
}; 