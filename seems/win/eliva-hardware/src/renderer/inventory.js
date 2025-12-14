// Inventory management module for Eliva Hardware

// Global variables
let inventoryData = [];
let filteredInventory = [];
let currentSort = { field: 'name', direction: 'asc' };

// Function to load inventory data
function loadInventory() {
  // Set up event listeners
  setupInventoryEventListeners();
  
  // Load inventory data
  fetchInventoryData();
}

// Set up event listeners for inventory page
function setupInventoryEventListeners() {
  // Add item button
  const addItemBtn = document.getElementById('add-item-btn');
  if (addItemBtn) {
    addItemBtn.addEventListener('click', showAddItemModal);
  }
  
  // Search input
  const searchInput = document.getElementById('inventory-search');
  if (searchInput) {
    searchInput.addEventListener('input', filterInventory);
  }
  
  // Filters
  const filterType = document.getElementById('filter-type');
  const filterDiameter = document.getElementById('filter-diameter');
  const sortBy = document.getElementById('sort-by');
  
  if (filterType) filterType.addEventListener('change', filterInventory);
  if (filterDiameter) filterDiameter.addEventListener('change', filterInventory);
  if (sortBy) sortBy.addEventListener('change', sortInventory);
  
  // Add item form
  const addItemForm = document.getElementById('add-item-form');
  if (addItemForm) {
    const saveItemBtn = document.getElementById('save-item-btn');
    if (saveItemBtn) {
      saveItemBtn.addEventListener('click', saveNewItem);
    }
  }
  
  // Modal close buttons
  const modalCloseButtons = document.querySelectorAll('.modal-close, .modal-cancel');
  modalCloseButtons.forEach(button => {
    button.addEventListener('click', closeModals);
  });
}

// Fetch inventory data from the database
function fetchInventoryData() {
  window.api.getInventory()
    .then(items => {
      inventoryData = items;
      filteredInventory = [...items];
      renderInventoryTable();
    })
    .catch(err => {
      console.error('Error fetching inventory data:', err);
      window.appUtils.showToast('error', 'Error', 'Failed to load inventory data.');
    });
}

// Render inventory table with current data
function renderInventoryTable() {
  const tableBody = document.getElementById('inventory-table-body');
  if (!tableBody) return;
  
  // Clear existing rows
  tableBody.innerHTML = '';
  
  // Add rows for each item
  filteredInventory.forEach(item => {
    const row = document.createElement('tr');
    row.className = 'inventory-item';
    
    // Highlight low stock items
    if (item.quantity <= item.low_stock_threshold) {
      row.classList.add('low-stock');
    }
    
    row.innerHTML = `
      <td>${item.id}</td>
      <td>${item.name}</td>
      <td>${item.type}</td>
      <td>${item.color || '-'}</td>
      <td>${item.diameter ? item.diameter + '"' : '-'}</td>
      <td>${item.length ? item.length + ' ft' : '-'}</td>
      <td class="quantity-cell">${item.quantity}</td>
      <td>${window.appUtils.formatCurrency(item.cost_price)}</td>
      <td>${window.appUtils.formatCurrency(item.selling_price)}</td>
      <td class="actions-cell">
        <button class="btn-icon edit-item" data-id="${item.id}">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn-icon delete-item" data-id="${item.id}">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    
    // Add event listeners to action buttons
    tableBody.appendChild(row);
    
    // Add event listeners to the buttons
    const editButton = row.querySelector('.edit-item');
    const deleteButton = row.querySelector('.delete-item');
    
    editButton.addEventListener('click', () => editItem(item.id));
    deleteButton.addEventListener('click', () => deleteItem(item.id));
  });
  
  // Add empty state if no items
  if (filteredInventory.length === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = `
      <td colspan="10" class="empty-state">
        <div class="empty-state-content">
          <i class="fas fa-box-open"></i>
          <p>No inventory items found</p>
          <button class="btn primary" id="empty-add-item">Add Your First Item</button>
        </div>
      </td>
    `;
    tableBody.appendChild(emptyRow);
    
    // Add event listener to the empty state button
    const emptyAddButton = emptyRow.querySelector('#empty-add-item');
    if (emptyAddButton) {
      emptyAddButton.addEventListener('click', showAddItemModal);
    }
  }
}

// Filter inventory based on search and filters
function filterInventory() {
  const searchInput = document.getElementById('inventory-search');
  const filterType = document.getElementById('filter-type');
  const filterDiameter = document.getElementById('filter-diameter');
  
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
  const typeFilter = filterType ? filterType.value : '';
  const diameterFilter = filterDiameter ? filterDiameter.value : '';
  
  filteredInventory = inventoryData.filter(item => {
    // Search term filter
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm) ||
      item.type.toLowerCase().includes(searchTerm) ||
      (item.color && item.color.toLowerCase().includes(searchTerm));
    
    // Type filter
    const matchesType = !typeFilter || item.type === typeFilter;
    
    // Diameter filter
    const matchesDiameter = !diameterFilter || 
      (item.diameter && item.diameter.toString() === diameterFilter);
    
    return matchesSearch && matchesType && matchesDiameter;
  });
  
  // Apply current sort
  sortInventoryBy(currentSort.field, currentSort.direction);
  
  // Render the filtered data
  renderInventoryTable();
}

// Sort inventory by specified field
function sortInventory() {
  const sortBy = document.getElementById('sort-by');
  if (!sortBy) return;
  
  const field = sortBy.value;
  
  // Toggle direction if clicking the same field
  const direction = currentSort.field === field && currentSort.direction === 'asc' ? 'desc' : 'asc';
  
  sortInventoryBy(field, direction);
  renderInventoryTable();
}

// Sort inventory data by field and direction
function sortInventoryBy(field, direction) {
  currentSort = { field, direction };
  
  filteredInventory.sort((a, b) => {
    let valueA, valueB;
    
    switch (field) {
      case 'name':
        valueA = a.name.toLowerCase();
        valueB = b.name.toLowerCase();
        break;
      case 'quantity':
        valueA = a.quantity;
        valueB = b.quantity;
        break;
      case 'price':
        valueA = a.selling_price;
        valueB = b.selling_price;
        break;
      default:
        valueA = a.name.toLowerCase();
        valueB = b.name.toLowerCase();
    }
    
    if (valueA < valueB) return direction === 'asc' ? -1 : 1;
    if (valueA > valueB) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

// Show add item modal
function showAddItemModal() {
  const modal = document.getElementById('add-item-modal');
  if (modal) {
    modal.style.display = 'block';
    
    // Reset form
    const form = document.getElementById('add-item-form');
    if (form) form.reset();
  }
}

// Close all modals
function closeModals() {
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    modal.style.display = 'none';
  });
}

// Save new item
function saveNewItem() {
  const form = document.getElementById('add-item-form');
  if (!form) return;
  
  // Check form validity
  const inputs = form.querySelectorAll('input[required], select[required]');
  let isValid = true;
  
  inputs.forEach(input => {
    if (!input.value) {
      input.classList.add('invalid');
      isValid = false;
    } else {
      input.classList.remove('invalid');
    }
  });
  
  if (!isValid) {
    window.appUtils.showToast('error', 'Validation Error', 'Please fill in all required fields.');
    return;
  }
  
  // Get form data
  const formData = new FormData(form);
  const item = {
    name: formData.get('name'),
    type: formData.get('type'),
    color: formData.get('color'),
    diameter: formData.get('diameter') ? parseFloat(formData.get('diameter')) : null,
    length: formData.get('length') ? parseFloat(formData.get('length')) : null,
    thickness: formData.get('thickness') ? parseFloat(formData.get('thickness')) : null,
    quantity: parseInt(formData.get('quantity')),
    low_stock_threshold: parseInt(formData.get('low_stock_threshold')),
    cost_price: parseFloat(formData.get('cost_price')),
    selling_price: parseFloat(formData.get('selling_price'))
  };
  
  // Save to database
  window.api.addItem(item)
    .then(newItem => {
      // Add to inventory data
      inventoryData.push(newItem);
      
      // Re-filter and render
      filterInventory();
      
      // Close modal
      closeModals();
      
      // Show success message
      window.appUtils.showToast('success', 'Item Added', `${newItem.name} has been added to inventory.`);
    })
    .catch(err => {
      console.error('Error adding item:', err);
      window.appUtils.showToast('error', 'Error', 'Failed to add item to inventory.');
    });
}

// Edit item
function editItem(itemId) {
  // Find the item
  const item = inventoryData.find(item => item.id === itemId);
  if (!item) return;
  
  // Create edit modal if it doesn't exist
  let editModal = document.getElementById('edit-item-modal');
  if (!editModal) {
    editModal = document.createElement('div');
    editModal.id = 'edit-item-modal';
    editModal.className = 'modal';
    
    // Clone the add item modal content
    const addItemModal = document.getElementById('add-item-modal');
    if (addItemModal) {
      const modalContent = addItemModal.querySelector('.modal-content').cloneNode(true);
      
      // Update title
      const modalHeader = modalContent.querySelector('.modal-header h2');
      if (modalHeader) modalHeader.textContent = 'Edit Item';
      
      // Update form ID
      const form = modalContent.querySelector('form');
      if (form) form.id = 'edit-item-form';
      
      // Update button ID and text
      const saveButton = modalContent.querySelector('.modal-footer .primary');
      if (saveButton) {
        saveButton.id = 'update-item-btn';
        saveButton.textContent = 'Update Item';
      }
      
      editModal.appendChild(modalContent);
      document.body.appendChild(editModal);
      
      // Add event listeners
      const closeButtons = editModal.querySelectorAll('.modal-close, .modal-cancel');
      closeButtons.forEach(button => {
        button.addEventListener('click', closeModals);
      });
      
      const updateButton = editModal.querySelector('#update-item-btn');
      if (updateButton) {
        updateButton.addEventListener('click', () => updateItem(itemId));
      }
    }
  }
  
  // Fill form with item data
  const form = document.getElementById('edit-item-form');
  if (form) {
    form.elements['name'].value = item.name;
    form.elements['type'].value = item.type;
    form.elements['color'].value = item.color || '';
    form.elements['diameter'].value = item.diameter || '';
    form.elements['length'].value = item.length || '';
    form.elements['thickness'].value = item.thickness || '';
    form.elements['quantity'].value = item.quantity;
    form.elements['low_stock_threshold'].value = item.low_stock_threshold;
    form.elements['cost_price'].value = item.cost_price;
    form.elements['selling_price'].value = item.selling_price;
  }
  
  // Show modal
  editModal.style.display = 'block';
}

// Update item
function updateItem(itemId) {
  const form = document.getElementById('edit-item-form');
  if (!form) return;
  
  // Check form validity
  const inputs = form.querySelectorAll('input[required], select[required]');
  let isValid = true;
  
  inputs.forEach(input => {
    if (!input.value) {
      input.classList.add('invalid');
      isValid = false;
    } else {
      input.classList.remove('invalid');
    }
  });
  
  if (!isValid) {
    window.appUtils.showToast('error', 'Validation Error', 'Please fill in all required fields.');
    return;
  }
  
  // Get form data
  const formData = new FormData(form);
  const item = {
    name: formData.get('name'),
    type: formData.get('type'),
    color: formData.get('color'),
    diameter: formData.get('diameter') ? parseFloat(formData.get('diameter')) : null,
    length: formData.get('length') ? parseFloat(formData.get('length')) : null,
    thickness: formData.get('thickness') ? parseFloat(formData.get('thickness')) : null,
    quantity: parseInt(formData.get('quantity')),
    low_stock_threshold: parseInt(formData.get('low_stock_threshold')),
    cost_price: parseFloat(formData.get('cost_price')),
    selling_price: parseFloat(formData.get('selling_price'))
  };
  
  // Update in database
  window.api.updateItem(itemId, item)
    .then(updatedItem => {
      // Update in inventory data
      const index = inventoryData.findIndex(item => item.id === itemId);
      if (index !== -1) {
        inventoryData[index] = updatedItem;
      }
      
      // Re-filter and render
      filterInventory();
      
      // Close modal
      closeModals();
      
      // Show success message
      window.appUtils.showToast('success', 'Item Updated', `${updatedItem.name} has been updated.`);
    })
    .catch(err => {
      console.error('Error updating item:', err);
      window.appUtils.showToast('error', 'Error', 'Failed to update item.');
    });
}

// Delete item
function deleteItem(itemId) {
  // Find the item
  const item = inventoryData.find(item => item.id === itemId);
  if (!item) return;
  
  // Confirm deletion
  if (confirm(`Are you sure you want to delete ${item.name}?`)) {
    // Delete from database
    window.api.deleteItem(itemId)
      .then(result => {
        if (result.deleted) {
          // Remove from inventory data
          inventoryData = inventoryData.filter(item => item.id !== itemId);
          
          // Re-filter and render
          filterInventory();
          
          // Show success message
          window.appUtils.showToast('success', 'Item Deleted', `${item.name} has been deleted.`);
        } else {
          window.appUtils.showToast('error', 'Error', 'Failed to delete item.');
        }
      })
      .catch(err => {
        console.error('Error deleting item:', err);
        window.appUtils.showToast('error', 'Error', 'Failed to delete item.');
      });
  }
}

// Export the loadInventory function
window.loadInventory = loadInventory; 