/**
 * inventory-handlers.js
 * Handles inventory item operations with robust error handling and fallback mechanisms
 */

// Define product types if not already defined in window
if (!window.productTypes) {
  window.productTypes = {
    'Pipes': ['PVC Pipe', 'HDPE Pipe', 'Steel Pipe', 'Copper Pipe', 'PPR Pipe', 'UPVC Pipe', 'GI Pipe', 'Pipe Fittings', 'Pipe Valves'],
    'Paint': ['Emulsion Paint', 'Enamel Paint', 'Primer', 'Varnish', 'Wood Stain', 'Spray Paint', 'Textured Paint', 'Ceiling Paint'],
    'Building': ['Cement', 'Sand', 'Gravel', 'Bricks', 'Blocks', 'Concrete', 'Reinforcement', 'Wood', 'Plywood', 'Gypsum'],
    'Electrical': ['Cables', 'Switches', 'Sockets', 'Circuit Breakers', 'Distribution Boards', 'Conduits', 'Electrical Boxes'],
    'Hardware': ['Nails', 'Screws', 'Bolts', 'Nuts', 'Washers', 'Hinges', 'Locks', 'Handles', 'Brackets', 'Chains'],
    'Tools': ['Hand Tools', 'Power Tools', 'Measuring Tools', 'Cutting Tools', 'Drilling Tools', 'Safety Equipment'],
    'Roofing': ['Metal Sheets', 'Roof Tiles', 'Roof Panels', 'Waterproofing', 'Gutters', 'Roof Fasteners'],
    'Flooring': ['Tiles', 'Wooden Flooring', 'Laminate Flooring', 'Vinyl Flooring', 'Carpet', 'Floor Adhesives'],
    'Lighting': ['Bulbs', 'LED Lights', 'Tubes', 'Lamps', 'Fixtures', 'Emergency Lights', 'Decorative Lights'],
    'Bath': ['Taps', 'Showers', 'Basins', 'Toilets', 'Bathtubs', 'Bathroom Accessories', 'Kitchen Sinks', 'Faucets']
  };
}

// Function to update an inventory item with proper error handling
async function updateInventoryItem(updatedItem) {
  try {
    // Check if electronAPI is available
    if (window.electronAPI && typeof window.electronAPI.updateInventoryItem === 'function') {
      try {
        // Use the Electron API
        const result = await window.electronAPI.updateInventoryItem(updatedItem);
        console.log('Item updated successfully via Electron API:', result);
        
        // Also update in LocalDatabase for sync
        if (window.LocalDatabase) {
          const localResult = window.LocalDatabase.updateInventoryItem(updatedItem);
          console.log('Item also updated in LocalDatabase for sync');
        }
        
        return result;
      } catch (apiError) {
        console.error('Error updating via Electron API, falling back to LocalDatabase:', apiError);
        // Fall through to LocalDatabase
      }
    }
    
    // Use LocalDatabase if available
    if (window.LocalDatabase) {
      console.log('Using LocalDatabase to update item');
      const result = window.LocalDatabase.updateInventoryItem(updatedItem);
      if (result) {
        console.log('Item updated successfully in LocalDatabase');
        return result;
      } else {
        throw new Error(`Failed to update item with ID ${updatedItem.id} in LocalDatabase`);
      }
    } else {
      // Use localStorage fallback if LocalDatabase is not available
      console.warn('LocalDatabase not available, using localStorage fallback');
      
      // Get current inventory
      let inventory = [];
      try {
        const data = localStorage.getItem('inventory_items');
        inventory = data ? JSON.parse(data) : [];
      } catch (error) {
        console.error('Error reading inventory from localStorage:', error);
        throw new Error('Failed to read inventory data');
      }
      
      // Find and update the item
      const index = inventory.findIndex(item => item.id === updatedItem.id);
      if (index === -1) {
        throw new Error(`Item with ID ${updatedItem.id} not found`);
      }
      
      // Update the item
      inventory[index] = {
        ...inventory[index],
        ...updatedItem,
        updatedAt: new Date().toISOString()
      };
      
      // Save back to localStorage
      try {
        localStorage.setItem('inventory_items', JSON.stringify(inventory));
        console.log('Item updated successfully in localStorage');
        return inventory[index];
      } catch (error) {
        console.error('Error saving updated inventory to localStorage:', error);
        throw new Error('Failed to save updated inventory data');
      }
    }
  } catch (error) {
    console.error('Error updating inventory item:', error);
    
    // Try fallback even if API was available but failed
    try {
      // Get current inventory from localStorage
      let inventory = [];
      const localData = localStorage.getItem('inventory_items');
      if (localData) {
        inventory = JSON.parse(localData);
      }
      
      // Find and update the item
      const index = inventory.findIndex(item => item.id === updatedItem.id);
      if (index !== -1) {
        // Update the item
        inventory[index] = {
          ...inventory[index],
          ...updatedItem,
          updatedAt: new Date().toISOString()
        };
        
        // Save back to localStorage
        localStorage.setItem('inventory_items', JSON.stringify(inventory));
        console.log('Item updated in localStorage after API error');
        return inventory[index];
      }
    } catch (fallbackError) {
      console.error('Fallback update also failed:', fallbackError);
    }
    
    // Re-throw the original error if all attempts fail
    throw error;
  }
}

// Function to handle the update item form submission
async function handleUpdateItem(event) {
  event.preventDefault();
  
  try {
    console.log('Edit form submitted, processing update...');
    const itemId = document.getElementById('edit-item-id').value;
    const category = document.getElementById('edit-item-category').value;
    
    if (!itemId) {
      console.error('Missing item ID in form');
      alert('Error: Item ID is missing');
      return;
    }
    
    if (!category) {
      alert('Please select a product category');
      return;
    }
    
    // Handle custom type
    let type;
    if (category === 'Custom') {
      type = document.getElementById('edit-custom-type').value;
      if (!type) {
        alert('Please enter a custom product type');
        return;
      }
    } else {
      type = document.getElementById('edit-item-type').value;
      if (!type) {
        alert('Please select a product type');
        return;
      }
    }
    
    console.log('Saving item with category:', category, 'and type:', type);
    
    // Get brand field
    const brand = document.getElementById('edit-item-brand').value || '';
    console.log('Brand value from form:', brand);
    
    // Get buying price field
    const buyingPrice = parseFloat(document.getElementById('edit-item-buying-price').value) || 0;
    console.log('Buying price value from form:', buyingPrice);
    
    // Create updated item object with default values for optional fields
    const updatedItem = {
      id: itemId,
      category: category,
      type: type,
      description: document.getElementById('edit-item-description').value || '',
      brand: brand,
      dimension: document.getElementById('edit-item-dimension').value || '',
      color: document.getElementById('edit-item-color').value || '',
      unit: document.getElementById('edit-item-unit').value || 'piece',
      sku: document.getElementById('edit-item-sku').value || '',
      quantity: parseInt(document.getElementById('edit-item-quantity').value) || 0,
      price: parseFloat(document.getElementById('edit-item-price').value) || 0,
      buyingPrice: buyingPrice,
      buying_price: buyingPrice, // Include both formats for compatibility
      alertThreshold: parseInt(document.getElementById('edit-item-alert').value) || 10,
      notes: document.getElementById('edit-item-notes').value || '',
      updatedAt: new Date().toISOString()
    };
    
    console.log('Updated item object:', updatedItem);
    
    // Validate required fields
    if (!updatedItem.description) {
      alert('Please enter a product description');
      return;
    }
    
    // Show loading indicator
    const saveButton = document.getElementById('save-edit-item');
    const originalText = saveButton.innerHTML;
    saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
    saveButton.disabled = true;
    
    try {
      // Update the item
      const result = await updateInventoryItem(updatedItem);
      console.log('Item updated successfully:', result);
      
      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('editItemModal'));
      modal.hide();
      
      // Reload inventory
      if (typeof loadInventoryData === 'function') {
        await loadInventoryData();
      } else if (typeof loadInventory === 'function') {
        await loadInventory();
      } else {
        console.warn('No inventory reload function found');
        // Force page reload as last resort
        window.location.reload();
      }
      
      // Show success notification
      if (window.NotificationSystem) {
        window.NotificationSystem.show(`Item "${updatedItem.description}" updated successfully`, { 
          type: 'success',
          title: 'Item Updated'
        });
      } else {
        // Create toast notification
        const toastHTML = `
          <div class="toast align-items-center text-white bg-success border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
              <div class="toast-body">
                <i class="fas fa-check-circle me-2"></i> Item updated successfully!
              </div>
              <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
          </div>
        `;
        
        // Create toast container if it doesn't exist
        if (!document.getElementById('toast-container')) {
          const container = document.createElement('div');
          container.id = 'toast-container';
          container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
          document.body.appendChild(container);
        }
        
        // Show toast
        const toastContainer = document.getElementById('toast-container');
        toastContainer.innerHTML = toastHTML;
        const toast = new bootstrap.Toast(toastContainer.querySelector('.toast'));
        toast.show();
      }
    } finally {
      // Restore button state
      saveButton.innerHTML = originalText;
      saveButton.disabled = false;
    }
  } catch (error) {
    console.error('Error updating item:', error);
    alert('An error occurred while updating the item: ' + (error.message || 'Unknown error'));
  }
}

// Function to add an inventory item with proper error handling
async function addInventoryItem(newItem) {
  try {
    // Ensure we have required properties
    if (!newItem.description || !newItem.category || !newItem.type) {
      throw new Error('Missing required item properties');
    }
    
    // Assign ID if not present
    if (!newItem.id) {
      newItem.id = Date.now().toString();
    }
    
    // Add timestamps if not present
    if (!newItem.createdAt) {
      newItem.createdAt = new Date().toISOString();
    }
    
    // Check if electronAPI is available
    if (window.electronAPI && typeof window.electronAPI.addInventoryItem === 'function') {
      try {
        // Use the Electron API
        console.log('Adding item via Electron API:', newItem);
        const result = await window.electronAPI.addInventoryItem(newItem);
        console.log('Item added successfully via Electron API:', result);
        
        // Also add to LocalDatabase for sync
        if (window.LocalDatabase) {
          const localResult = window.LocalDatabase.addInventoryItem(newItem);
          console.log('Item also added to LocalDatabase for sync');
        }
        
        return result;
      } catch (apiError) {
        console.error('Error adding via Electron API, falling back to LocalDatabase:', apiError);
        // Fall through to LocalDatabase
      }
    }
    
    // Use LocalDatabase if available
    if (window.LocalDatabase) {
      console.log('Using LocalDatabase to add item');
      const result = window.LocalDatabase.addInventoryItem(newItem);
      if (result) {
        console.log('Item added successfully to LocalDatabase');
        return result;
      } else {
        throw new Error(`Failed to add item to LocalDatabase`);
      }
    } else {
      // Use localStorage fallback if LocalDatabase is not available
      console.warn('LocalDatabase not available, using localStorage fallback');
      
      // Get current inventory
      let inventory = [];
      try {
        const data = localStorage.getItem('inventory_items');
        inventory = data ? JSON.parse(data) : [];
      } catch (error) {
        console.error('Error reading inventory from localStorage:', error);
        inventory = []; // Start fresh if there's an error
      }
      
      // Check for duplicate ID
      if (inventory.some(item => item.id === newItem.id)) {
        // Generate a new ID to avoid conflicts
        newItem.id = Date.now().toString();
      }
      
      // Add the item
      inventory.push(newItem);
      
      // Save back to localStorage
      try {
        localStorage.setItem('inventory_items', JSON.stringify(inventory));
        console.log('Item added successfully to localStorage');
        return newItem;
      } catch (error) {
        console.error('Error saving updated inventory to localStorage:', error);
        throw new Error('Failed to save inventory data to localStorage');
      }
    }
  } catch (error) {
    console.error('Error adding inventory item:', error);
    throw error;
  }
}

// Function to handle the add item form submission
async function handleAddItem(event) {
  event.preventDefault();
  console.log('Add item form submitted');
  
  try {
    // Use a static flag to prevent multiple concurrent submissions
    if (handleAddItem.isSubmitting) {
      console.warn('Form submission already in progress, ignoring duplicate submission');
      return;
    }
    
    // Set the flag to prevent multiple submissions
    handleAddItem.isSubmitting = true;
    
    // Track the time of this submission to prevent rapid fire submissions
    const currentTime = Date.now();
    
    // If less than 3 seconds since last submission, reject it
    if (handleAddItem.lastSubmissionTime && (currentTime - handleAddItem.lastSubmissionTime < 3000)) {
      console.warn(`Submission attempted too soon. Please wait a few seconds before submitting again.`);
      alert('Please wait a few seconds before submitting again.');
      handleAddItem.isSubmitting = false;
      return;
    }
    
    handleAddItem.lastSubmissionTime = currentTime;
    
    // Get form values with correct element IDs matching the HTML
    const category = document.getElementById('item-category')?.value || '';
    
    if (!category) {
      alert('Please select a product category');
      handleAddItem.isSubmitting = false;
      return;
    }
    
    // Handle custom type
    let type;
    if (category === 'Custom') {
      type = document.getElementById('custom-type')?.value || '';
      if (!type) {
        alert('Please enter a custom product type');
        handleAddItem.isSubmitting = false;
        return;
      }
    } else {
      type = document.getElementById('item-type')?.value || '';
      if (!type) {
        alert('Please select a product type');
        handleAddItem.isSubmitting = false;
        return;
      }
    }
    
    // Generate a truly unique ID with both timestamp and random component
    // This ensures uniqueness even if multiple items are created in the same millisecond
    const timestamp = Date.now();
    const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const uniqueId = `${timestamp}-${randomPart}`;
    
    // Get brand field
    const brand = document.getElementById('item-brand')?.value || '';
    console.log('Brand value from form:', brand);
    
    // Get all form fields with proper validation and defaults
    const description = document.getElementById('item-description')?.value || '';
    const dimension = document.getElementById('item-dimension')?.value || '';
    const color = document.getElementById('item-color')?.value || '';
    const unit = document.getElementById('item-unit')?.value || 'piece';
    const sku = document.getElementById('item-sku')?.value || '';
    const quantity = parseInt(document.getElementById('item-quantity')?.value || '0', 10) || 0;
    const buyingPrice = parseFloat(document.getElementById('item-buying-price')?.value || '0') || 0;
    console.log('Buying price value from form:', buyingPrice);
    const price = parseFloat(document.getElementById('item-price')?.value || '0') || 0;
    const alertThreshold = parseInt(document.getElementById('item-alert')?.value || '10', 10) || 10;
    const notes = document.getElementById('item-notes')?.value || '';
    
    // Create new item object with all fields consistently named
    const newItem = {
      id: uniqueId,
      category,
      type,
      description,
      brand,
      dimension,
      dimensions: dimension, // Include both for compatibility
      color,
      unit,
      sku,
      quantity,
      buyingPrice,
      buying_price: buyingPrice, // Include both for compatibility
      cost_price: buyingPrice, // Include both for compatibility
      price,
      selling_price: price, // Include both for compatibility
      alertThreshold,
      alert_threshold: alertThreshold, // Include both for compatibility
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      created_at: new Date().toISOString(), // Include both for compatibility
      updated_at: new Date().toISOString(), // Include both for compatibility
      // Additional data for other fields
      additional_data: {
        category,
        unit,
        sku,
        notes,
        brand // Also include brand in additional_data for backward compatibility
      }
    };
    
    console.log('Prepared new item data:', newItem);
    
    // Validate required fields
    if (!newItem.description) {
      alert('Please enter a product description');
      handleAddItem.isSubmitting = false;
      return;
    }
    
    // Check for buying price vs selling price
    if (newItem.buyingPrice > newItem.price) {
      const confirmLoss = confirm('Warning: Buying price is higher than selling price. This will result in a loss. Do you want to continue?');
      if (!confirmLoss) {
        handleAddItem.isSubmitting = false;
        return;
      }
    }
    
    // Disable save button if exists
    const saveBtn = document.getElementById('save-item');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Adding...';
    }
    
    // Add the item
    console.log('Calling addInventoryItem with:', newItem);
    try {
      const addedItem = await addInventoryItem(newItem);
      console.log('Item added successfully:', addedItem);
      
      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('addItemModal'));
      if (modal) modal.hide();
      
      // Reset form
      const form = document.getElementById('add-item-form');
      if (form) form.reset();
      
      // Reload inventory
      if (typeof loadInventoryData === 'function') {
        await loadInventoryData();
      } else if (typeof loadInventory === 'function') {
        await loadInventory();
      } else {
        console.warn('No inventory reload function found');
        // Add item to the UI immediately as fallback
        window.inventoryData = window.inventoryData || [];
        window.inventoryData.push(addedItem);
        if (typeof renderInventoryTable === 'function') {
          renderInventoryTable(window.inventoryData);
        }
      }
      
      // Show success notification
      if (window.NotificationSystem) {
        window.NotificationSystem.show(`Item "${newItem.description}" added successfully`, { 
          type: 'success',
          title: 'Item Added'
        });
      } else {
        // Create toast notification
        const toastHTML = `
          <div class="toast align-items-center text-white bg-success border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
              <div class="toast-body">
                <i class="fas fa-check-circle me-2"></i> Item added successfully!
              </div>
              <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
          </div>
        `;
        
        // Create toast container if it doesn't exist
        if (!document.getElementById('toast-container')) {
          const container = document.createElement('div');
          container.id = 'toast-container';
          container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
          document.body.appendChild(container);
        }
        
        // Show toast
        const toastContainer = document.getElementById('toast-container');
        if (toastContainer) {
          toastContainer.innerHTML = toastHTML;
          const toast = new bootstrap.Toast(toastContainer.querySelector('.toast'));
          if (toast) toast.show();
        }
      }
      
      return addedItem;
    } catch (error) {
      console.error('Error in API call:', error);
      // Re-enable the button
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = 'Save Item';
      }
      alert(`Failed to add item: ${error.message || 'Unknown error'}`);
      throw error;
    } finally {
      // Always reset the submission flag when done
      setTimeout(() => {
        handleAddItem.isSubmitting = false;
        
        // Re-enable button if needed
        if (saveBtn && saveBtn.disabled) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = 'Save Item';
        }
      }, 1000);
    }
  } catch (error) {
    console.error('Error adding item:', error);
    alert('An error occurred while adding the item: ' + (error.message || 'Unknown error'));
    handleAddItem.isSubmitting = false;
    throw error;
  }
}

// Function to delete an inventory item with proper error handling
async function deleteInventoryItem(itemId) {
  try {
    if (!itemId) {
      throw new Error('Item ID is required');
    }
    
    // Check if electronAPI is available and use it directly
    if (window.electronAPI && typeof window.electronAPI.deleteInventoryItem === 'function') {
        console.log('Deleting item via Electron API:', itemId);
        const result = await window.electronAPI.deleteInventoryItem(itemId);
        console.log('Item deleted successfully via Electron API:', result);
        return result;
    }
    
    // Fallback to localStorage if electronAPI is not available
    console.warn('electronAPI not available, using localStorage fallback');
      
      // Get current inventory
      let inventory = [];
      try {
        const data = localStorage.getItem('inventory_items');
        inventory = data ? JSON.parse(data) : [];
      } catch (error) {
        console.error('Error reading inventory from localStorage:', error);
        throw new Error('Failed to read inventory data');
      }
      
      // Check if item exists
      const index = inventory.findIndex(item => item.id === itemId);
      if (index === -1) {
        throw new Error(`Item with ID ${itemId} not found`);
      }
      
      // Remove the item
      inventory.splice(index, 1);
      
      // Save back to localStorage
      try {
        localStorage.setItem('inventory_items', JSON.stringify(inventory));
        console.log('Item deleted successfully from localStorage');
        return true;
      } catch (error) {
        console.error('Error saving updated inventory to localStorage:', error);
        throw new Error('Failed to save updated inventory data');
    }
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    throw error;
  }
}

// Function to handle the delete item button click
async function handleDeleteItemClick(itemId, itemName) {
  try {
    if (!itemId) {
      throw new Error('No item ID provided');
    }
    
    // Use the modal dialog instead of the browser's confirm
    return new Promise((resolve) => {
      // Set item info in the delete modal
      document.getElementById('delete-item-id').value = itemId;
      document.getElementById('delete-item-name').textContent = itemName || 'this item';
      
      // Show the modal
      const modal = new bootstrap.Modal(document.getElementById('deleteItemModal'));
      modal.show();
      
      // Handle the confirm button click
      const confirmBtn = document.getElementById('confirm-delete');
      const originalClickHandler = confirmBtn.onclick;
      
      // Set a new click handler
      confirmBtn.onclick = async () => {
        // Reset the click handler
        confirmBtn.onclick = originalClickHandler;
    
    // Show loading/processing notification
    if (window.NotificationSystem) {
      window.NotificationSystem.show('Deleting item...', { 
        type: 'info',
        playSound: false
      });
    }
    
    // Delete the item
    const result = await deleteInventoryItem(itemId);
    
    // Reload inventory if needed
    if (typeof loadInventoryData === 'function') {
      await loadInventoryData();
    } else if (typeof loadInventory === 'function') {
      await loadInventory();
    } else if (window.inventoryData) {
      // Update UI directly as fallback
      window.inventoryData = window.inventoryData.filter(item => item.id !== itemId);
      if (typeof renderInventoryTable === 'function') {
        renderInventoryTable(window.inventoryData);
      }
    }
        
        // Close the modal
        modal.hide();
    
    // Show success notification
    if (window.NotificationSystem) {
      window.NotificationSystem.show(`Item ${itemName ? `"${itemName}"` : ''} deleted successfully`, { 
        type: 'success',
        title: 'Item Deleted'
      });
    } else {
      // Create toast notification
      const toastHTML = `
        <div class="toast align-items-center text-white bg-success border-0" role="alert" aria-live="assertive" aria-atomic="true">
          <div class="d-flex">
            <div class="toast-body">
              <i class="fas fa-check-circle me-2"></i> Item deleted successfully!
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
        </div>
      `;
      
      // Create toast container if it doesn't exist
      if (!document.getElementById('toast-container')) {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(container);
      }
      
      // Show toast
      const toastContainer = document.getElementById('toast-container');
      toastContainer.innerHTML = toastHTML;
      const toast = new bootstrap.Toast(toastContainer.querySelector('.toast'));
      toast.show();
    }
    
        resolve(result);
      };
      
      // Handle the cancel button click
      const cancelBtn = document.querySelector('#deleteItemModal [data-bs-dismiss="modal"]');
      cancelBtn.onclick = () => {
        // Reset the click handler
        confirmBtn.onclick = originalClickHandler;
        resolve(false);
      };
    });
  } catch (error) {
    console.error('Error handling delete item:', error);
    
    // Show error notification
    if (window.NotificationSystem) {
      window.NotificationSystem.show(`Error deleting item: ${error.message || 'Unknown error'}`, { 
        type: 'error',
        title: 'Delete Failed'
      });
    } else {
      alert('An error occurred while deleting the item: ' + (error.message || 'Unknown error'));
    }
    
    return false;
  }
}

// Stock adjustment functionality
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
    
    // First, get the current item data
    let currentItem;
    if (window.electronAPI && typeof window.electronAPI.getInventoryItem === 'function') {
      try {
        currentItem = await window.electronAPI.getInventoryItem(adjustmentData.itemId);
      } catch (apiError) {
        console.error('Error getting item from API:', apiError);
        
        // Try local data as fallback
        if (window.inventoryData) {
          currentItem = window.inventoryData.find(item => item.id === adjustmentData.itemId);
        }
        
        if (!currentItem) {
          throw new Error('Failed to retrieve current item data');
        }
      }
    } else {
      // Use local data if API not available
      if (window.inventoryData) {
        currentItem = window.inventoryData.find(item => item.id === adjustmentData.itemId);
      }
      
      if (!currentItem) {
        throw new Error('Failed to retrieve current item data');
      }
    }
    
    // Calculate new quantity based on adjustment type
    let newQuantity = currentItem.quantity;
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
    const updatedItem = { ...currentItem, quantity: newQuantity, updatedAt: new Date().toISOString() };
    
    // Save the updated item
    if (window.electronAPI && typeof window.electronAPI.updateInventoryItem === 'function') {
      try {
        const result = await window.electronAPI.updateInventoryItem(updatedItem);
        console.log('Item updated successfully with new quantity:', result);
        return result;
      } catch (apiError) {
        console.error('Error updating item via API:', apiError);
        
        // Perform local update if API fails
        if (window.inventoryData) {
          const index = window.inventoryData.findIndex(item => item.id === updatedItem.id);
          if (index !== -1) {
            window.inventoryData[index] = updatedItem;
          }
        }
        
        // Also update in localStorage
        try {
          const inventory = JSON.parse(localStorage.getItem('inventory_items') || '[]');
          const index = inventory.findIndex(item => item.id === updatedItem.id);
          if (index !== -1) {
            inventory[index] = updatedItem;
            localStorage.setItem('inventory_items', JSON.stringify(inventory));
          }
        } catch (localError) {
          console.error('Error updating localStorage:', localError);
        }
        
        return updatedItem;
      }
    } else {
      // Use local update if API not available
      if (window.inventoryData) {
        const index = window.inventoryData.findIndex(item => item.id === updatedItem.id);
        if (index !== -1) {
          window.inventoryData[index] = updatedItem;
        }
      }
      
      // Also update in localStorage
      try {
        const inventory = JSON.parse(localStorage.getItem('inventory_items') || '[]');
        const index = inventory.findIndex(item => item.id === updatedItem.id);
        if (index !== -1) {
          inventory[index] = updatedItem;
          localStorage.setItem('inventory_items', JSON.stringify(inventory));
        }
      } catch (localError) {
        console.error('Error updating localStorage:', localError);
      }
      
      return updatedItem;
    }
  } catch (error) {
    console.error('Error adjusting inventory stock:', error);
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
      // Prepare adjustment data
      const adjustmentData = {
        itemId,
        type: adjustmentType,
        quantity,
        reason,
        notes,
        date: new Date().toISOString()
      };
      
      // Process adjustment
      const updatedItem = await adjustInventoryStock(adjustmentData);
      
      // Update displayed quantity
      document.getElementById('edit-item-quantity').value = updatedItem.quantity;
      document.getElementById('current-quantity').textContent = updatedItem.quantity;
      
      // Update status badge
      updateStockStatusBadge(updatedItem.quantity, updatedItem.alertThreshold || 10);
      
      // Update last updated time
      document.getElementById('last-updated').textContent = formatDate(updatedItem.updatedAt);
      
      // Load adjustment history
      loadAdjustmentHistory(itemId);
      
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
  const currentQuantity = parseInt(document.getElementById('edit-item-quantity').value) || 0;
  const unit = document.getElementById('edit-item-unit')?.value || 'pieces';
  
  let previewText = '';
  let previewClass = 'alert-info';
  
  switch (adjustmentType) {
    case 'add':
      previewText = `Adding ${quantity} ${unit}(s) to current stock. New total will be ${currentQuantity + quantity} ${unit}(s).`;
      previewClass = 'alert-success';
      break;
    case 'remove':
      const newTotal = Math.max(0, currentQuantity - quantity);
      previewText = `Removing ${quantity} ${unit}(s) from current stock. New total will be ${newTotal} ${unit}(s).`;
      previewClass = quantity > currentQuantity ? 'alert-danger' : 'alert-warning';
      break;
    case 'set':
      previewText = `Setting stock to exactly ${quantity} ${unit}(s) (current: ${currentQuantity} ${unit}(s)).`;
      previewClass = quantity < currentQuantity ? 'alert-warning' : 'alert-info';
      break;
  }
  
  const previewElement = document.getElementById('adjustment-preview');
  previewElement.textContent = previewText;
  
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

// Export the new functions
window.InventoryHandlers = {
  ...(window.InventoryHandlers || {}),
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  adjustInventoryStock,
  getAdjustmentHistory,
  handleSaveAdjustment,
  updateAdjustmentPreview,
  showEditModal,
  loadAdjustmentHistory,
  handleAddItem,
  handleUpdateItem,
  handleDeleteItemClick
};

// Initialize event listeners when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Initializing inventory handlers');
  
  // Set up the edit form submission handler
  const editForm = document.getElementById('edit-item-form');
  if (editForm) {
    editForm.addEventListener('submit', handleUpdateItem);
  } else {
    console.warn('Edit item form not found');
  }
  
  // Set up category change handler for edit form
  const editCategorySelect = document.getElementById('edit-item-category');
  if (editCategorySelect) {
    editCategorySelect.addEventListener('change', function() {
      const category = this.value;
      const typeSelect = document.getElementById('edit-item-type');
      const customTypeContainer = document.getElementById('edit-custom-type-container');
      
      // Clear existing options
      typeSelect.innerHTML = '<option value="">Select Product Type</option>';
      
      if (category === 'Custom') {
        customTypeContainer.style.display = 'block';
      } else {
        customTypeContainer.style.display = 'none';
        
        // Make sure productTypes is defined
        if (!window.productTypes) {
          window.productTypes = {
            'Pipes': ['PVC Pipe', 'HDPE Pipe', 'Steel Pipe', 'Copper Pipe', 'PPR Pipe', 'UPVC Pipe', 'GI Pipe', 'Pipe Fittings', 'Pipe Valves'],
            'Paint': ['Emulsion Paint', 'Enamel Paint', 'Primer', 'Varnish', 'Wood Stain', 'Spray Paint', 'Textured Paint', 'Ceiling Paint'],
            'Building': ['Cement', 'Sand', 'Gravel', 'Bricks', 'Blocks', 'Concrete', 'Reinforcement', 'Wood', 'Plywood', 'Gypsum'],
            'Electrical': ['Cables', 'Switches', 'Sockets', 'Circuit Breakers', 'Distribution Boards', 'Conduits', 'Electrical Boxes'],
            'Hardware': ['Nails', 'Screws', 'Bolts', 'Nuts', 'Washers', 'Hinges', 'Locks', 'Handles', 'Brackets', 'Chains'],
            'Tools': ['Hand Tools', 'Power Tools', 'Measuring Tools', 'Cutting Tools', 'Drilling Tools', 'Safety Equipment'],
            'Roofing': ['Metal Sheets', 'Roof Tiles', 'Roof Panels', 'Waterproofing', 'Gutters', 'Roof Fasteners'],
            'Flooring': ['Tiles', 'Wooden Flooring', 'Laminate Flooring', 'Vinyl Flooring', 'Carpet', 'Floor Adhesives'],
            'Lighting': ['Bulbs', 'LED Lights', 'Tubes', 'Lamps', 'Fixtures', 'Emergency Lights', 'Decorative Lights'],
            'Bath': ['Taps', 'Showers', 'Basins', 'Toilets', 'Bathtubs', 'Bathroom Accessories', 'Kitchen Sinks', 'Faucets']
          };
        }
        
        // Get product types for this category (safely)
        const categoryTypes = window.productTypes[category] || [];
        console.log('Category:', category, 'Types available:', categoryTypes.length);
        
        // Add options
        if (categoryTypes && categoryTypes.length > 0) {
          categoryTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            typeSelect.appendChild(option);
          });
        } else {
          // Add a default option if no types are found for this category
          const option = document.createElement('option');
          option.value = 'Default';
          option.textContent = 'Default Type';
          typeSelect.appendChild(option);
        }
        
        // Log the populated select for debugging
        console.log('Populated type select with options:', typeSelect.options.length);
      }
    });
  }
});

