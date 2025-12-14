/**
 * Fix for product type dropdown functionality
 * This script removes conflicting event listeners and ensures proper functionality
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('Fixing dropdown functionality...');
  
  // Wait a bit to ensure all other scripts have loaded and initialized
  setTimeout(() => {
    fixDropdownFunctionality();
  }, 500);
  
  // Also set up a mutation observer to detect when the modal is shown
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        const modal = document.getElementById('addItemModal');
        if (modal && modal.classList.contains('show')) {
          console.log('Add item modal shown, ensuring dropdown functionality');
          fixDropdownFunctionality();
        }
      }
    });
  });
  
  // Start observing the add item modal
  const addItemModal = document.getElementById('addItemModal');
  if (addItemModal) {
    observer.observe(addItemModal, { attributes: true });
  }
});

function fixDropdownFunctionality() {
  console.log('Applying dropdown fix...');
  
  // Get the category select elements
  const addCategorySelect = document.getElementById('item-category');
  const editCategorySelect = document.getElementById('edit-item-category');
  
  if (!addCategorySelect || !editCategorySelect) {
    console.error('Category select elements not found');
    return;
  }
  
  // Clone the elements to remove all event listeners
  const newAddCategorySelect = addCategorySelect.cloneNode(true);
  const newEditCategorySelect = editCategorySelect.cloneNode(true);
  
  // Replace the original elements with the clones
  addCategorySelect.parentNode.replaceChild(newAddCategorySelect, addCategorySelect);
  editCategorySelect.parentNode.replaceChild(newEditCategorySelect, editCategorySelect);
  
  console.log('Removed all existing event listeners from category selects');
  
  // First try to use the populateProductTypes function from inventory.js
  if (typeof window.populateProductTypes === 'function') {
    console.log('Using populateProductTypes from inventory.js');
    window.populateProductTypes();
  } else {
    console.log('populateProductTypes not found, using fallback');
    
    // Fallback implementation if populateProductTypes is not available
    setupDropdownFallback(newAddCategorySelect, 'item-type', 'custom-type-container');
    setupDropdownFallback(newEditCategorySelect, 'edit-item-type', 'edit-custom-type-container');
  }
  
  // Directly update the product type dropdown based on the current category selection
  updateDropdownsBasedOnCurrentSelection();
  
  console.log('Dropdown fix applied successfully');
}

function updateDropdownsBasedOnCurrentSelection() {
  // For add item form
  const addCategorySelect = document.getElementById('item-category');
  const addTypeSelect = document.getElementById('item-type');
  const addCustomContainer = document.getElementById('custom-type-container');
  
  if (addCategorySelect && addCategorySelect.value) {
    console.log('Updating add form dropdown based on current selection:', addCategorySelect.value);
    updateTypeDropdown(addCategorySelect, addTypeSelect, addCustomContainer);
  }
  
  // For edit item form
  const editCategorySelect = document.getElementById('edit-item-category');
  const editTypeSelect = document.getElementById('edit-item-type');
  const editCustomContainer = document.getElementById('edit-custom-type-container');
  
  if (editCategorySelect && editCategorySelect.value) {
    console.log('Updating edit form dropdown based on current selection:', editCategorySelect.value);
    updateTypeDropdown(editCategorySelect, editTypeSelect, editCustomContainer);
  }
}

function setupDropdownFallback(categorySelect, typeSelectId, customContainerId) {
  const typeSelect = document.getElementById(typeSelectId);
  const customContainer = document.getElementById(customContainerId);
  
  if (!typeSelect) {
    console.error(`Type select element ${typeSelectId} not found`);
    return;
  }
  
  categorySelect.addEventListener('change', () => {
    updateTypeDropdown(categorySelect, typeSelect, customContainer);
  });
}

function updateTypeDropdown(categorySelect, typeSelect, customContainer) {
  if (!categorySelect || !typeSelect) return;
  
  // Clear previous options
  typeSelect.innerHTML = '<option value="">Select Product Type</option>';
  
  const category = categorySelect.value;
  console.log('Category changed to:', category);
  
  // Handle custom category
  if (category === 'Custom') {
    if (customContainer) customContainer.style.display = 'block';
    return;
  }
  
  // Hide custom type input if it exists
  if (customContainer) {
    customContainer.style.display = 'none';
  }
  
  // Add options based on selected category
  if (category && window.productTypes && window.productTypes[category]) {
    // Add options based on selected category
    window.productTypes[category].forEach(type => {
      const option = document.createElement('option');
      option.value = type;
      option.textContent = type;
      typeSelect.appendChild(option);
    });
    
    console.log(`Added ${window.productTypes[category].length} options to type dropdown`);
  } else {
    console.log('No product types found for category:', category);
  }
}

function triggerChangeEvent(element) {
  if (!element) return;
  
  const event = new Event('change', {
    bubbles: true,
    cancelable: true,
  });
  
  element.dispatchEvent(event);
}

// Expose the fix function globally
window.fixDropdownFunctionality = fixDropdownFunctionality;

// Add a direct event listener to the "Add New Item" button
document.addEventListener('DOMContentLoaded', function() {
  const addItemButton = document.querySelector('button[data-bs-toggle="modal"][data-bs-target="#addItemModal"]');
  
  if (addItemButton) {
    addItemButton.addEventListener('click', function() {
      console.log('Add item button clicked, scheduling dropdown fix');
      // Apply the fix after a short delay to ensure the modal is fully shown
      setTimeout(fixDropdownFunctionality, 300);
    });
  }
}); 