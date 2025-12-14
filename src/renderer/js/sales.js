/**
 * sales.js
 * Handles Sales UI interactions using localStorage
 */

// Global variables
let inventory = [];
let sales = [];
let filteredSales = [];
let selectedItems = [];
let grandTotal = 0;

// Add VAT calculation and UI update logic
let currentVatRate = 18;

function updateVatAndTotal() {
  const vatSwitch = document.getElementById('include-vat-switch');
  const vatInput = document.getElementById('vat-rate');
  const vatLabel = document.getElementById('vat-amount-label');
  const grandTotalLabel = document.getElementById('grand-total');
  let vat = 0;
  let net = 0;
  let vatRate = 0;
  if (vatSwitch && vatSwitch.checked && vatInput) {
    vatRate = parseFloat(vatInput.value || '0');
    if (isNaN(vatRate) || vatRate < 0) vatRate = 0;
  }
  currentVatRate = vatRate;
  vat = grandTotal * (vatRate / (100 + vatRate));
  net = grandTotal - vat;
  if (vatLabel) {
    vatLabel.textContent = `VAT (${vatRate}%): TZS ${vat.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})} | Net: TZS ${net.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`;
  }
  if (grandTotalLabel) {
    grandTotalLabel.textContent = `TZS ${grandTotal.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`;
  }
}

// Add a VAT label in the table footer if not present
function ensureVatLabel() {
  let vatRow = document.getElementById('vat-row');
  if (!vatRow) {
    const tfoot = document.querySelector('#selected-items').closest('table').querySelector('tfoot');
    if (tfoot) {
      vatRow = document.createElement('tr');
      vatRow.id = 'vat-row';
      vatRow.innerHTML = `<td colspan="5" class="text-end"><strong id="vat-amount-label">VAT (18%): TZS 0.00</strong></td><td colspan="2"></td>`;
      tfoot.insertBefore(vatRow, tfoot.firstChild);
    }
  }
}

// Initialize sales module
async function initializeSales(initialData = null) {
  console.log('Initializing sales module');
  
  try {
    // First try to load sales from database via API
    if (window.SalesHandlers && typeof window.SalesHandlers.getAllSales === 'function') {
      console.log('Loading sales data from SalesHandlers.getAllSales');
      try {
        sales = await window.SalesHandlers.getAllSales() || [];
        console.log(`Loaded ${sales.length} sales from database via SalesHandlers.getAllSales`);
      } catch (handlerError) {
        console.error('Error using SalesHandlers.getAllSales:', handlerError);
        // Try fallback method if first one fails
        if (window.electronAPI && typeof window.electronAPI.getSales === 'function') {
          console.log('Falling back to electronAPI.getSales');
          sales = await window.electronAPI.getSales() || [];
          console.log(`Loaded ${sales.length} sales from database via electronAPI.getSales`);
        } else {
          throw handlerError; // Re-throw if no fallback
        }
      }
    } else if (window.electronAPI && typeof window.electronAPI.getSales === 'function') {
      console.log('Loading sales data from electronAPI.getSales');
      sales = await window.electronAPI.getSales() || [];
      console.log(`Loaded ${sales.length} sales from database via electronAPI.getSales`);
    } else {
      // Fallback to localStorage if API methods are not available
      console.warn('API methods not available, trying localStorage...');
      const salesData = localStorage.getItem('sales_data');
      if (salesData) {
        console.log('Loading sales data from localStorage');
        sales = JSON.parse(salesData);
        console.log(`Loaded ${sales.length} sales from localStorage`);
      } else {
        console.log('No sales data found, initializing empty array');
        sales = [];
        localStorage.setItem('sales_data', JSON.stringify(sales));
      }
    }
    
    // Debug info
    console.log('Sales data loaded:', sales);
    
    // Ensure sales is always an array
    if (!Array.isArray(sales)) {
      console.warn('Sales is not an array, resetting to empty array');
      sales = [];
    }
    
    // Sort sales by date (newest first)
    if (sales.length > 0) {
      sales.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.date).getTime();
        const dateB = new Date(b.createdAt || b.date).getTime();
        return dateB - dateA; // Sort descending (newest first)
      });
      console.log('Sales sorted by date (newest first)');
    }
    
    // Log the loaded sales data structure for debugging
    if (sales.length > 0) {
      console.log('Sample sales data structure:', sales[0]);
    }
    
    // Load inventory data
    await loadInventoryData();
    
    // Set up event listeners
    setupEventListeners();
    
    // Filter and render sales
    filterSales();
    
    // Update sales stats
    updateSalesStats();
  } catch (error) {
    console.error('Error initializing sales:', error);
    showNotification('Error initializing sales: ' + error.message, 'error');
  }
}

// Load inventory data
async function loadInventoryData() {
  try {
    console.log('Loading inventory data from database...');
    
    // Try to load inventory from database via electronAPI or SalesHandlers
    if (window.electronAPI && typeof window.electronAPI.getInventory === 'function') {
      inventory = await window.electronAPI.getInventory();
      console.log('Inventory loaded from electronAPI:', inventory.length, 'items');
    } else if (window.SalesHandlers && typeof window.SalesHandlers.getInventoryItems === 'function') {
      inventory = await window.SalesHandlers.getInventoryItems();
      console.log('Inventory loaded from SalesHandlers:', inventory.length, 'items');
    } else {
      // Fallback to localStorage if API methods are not available
      console.warn('API methods not available, trying localStorage...');
      const inventoryData = localStorage.getItem('inventory_data');
      if (inventoryData) {
        console.log('Using inventory data from localStorage');
        inventory = JSON.parse(inventoryData);
      } else {
        // Create some dummy data if none exists
        console.log('No inventory data found, creating dummy data');
        inventory = [
          {
            id: '1',
            description: 'PVC Pipe 1/2"',
            type: 'PVC',
            quantity: 100,
            price: 5.99
          },
          {
            id: '2',
            description: 'PVC Pipe 3/4"',
            type: 'PVC',
            quantity: 80,
            price: 7.99
          },
          {
            id: '3',
            description: 'Copper Pipe 1/2"',
            type: 'Copper',
            quantity: 50,
            price: 12.99
          },
          {
            id: '4',
            description: 'PEX Pipe 3/4"',
            type: 'PEX',
            quantity: 30,
            price: 9.99
          }
        ];
        localStorage.setItem('inventory_data', JSON.stringify(inventory));
      }
    }
    
    // Populate item select dropdown with inventory data
    populateItemSelect();
    setupItemSearchListener();
    
    // Load customers data for the customer select dropdown
    await loadCustomersData();
    
  } catch (error) {
    console.error('Error loading inventory:', error);
    showNotification('Error loading inventory: ' + error.message, 'error');
  }
}

// Load customers data from database
async function loadCustomersData() {
  try {
    console.log('Loading customers data from database...');
    
    let customers = [];
    
    // Try to load customers from database via electronAPI or SalesHandlers
    if (window.electronAPI && typeof window.electronAPI.getCustomers === 'function') {
      customers = await window.electronAPI.getCustomers();
      console.log('Customers loaded from electronAPI:', customers.length, 'customers');
    } else if (window.SalesHandlers && typeof window.SalesHandlers.getCustomers === 'function') {
      customers = await window.SalesHandlers.getCustomers();
      console.log('Customers loaded from SalesHandlers:', customers.length, 'customers');
    } else {
      console.warn('Customer API methods not available');
      return;
    }
    
    // Populate customer select dropdown
    populateCustomerSelect(customers);
    
  } catch (error) {
    console.error('Error loading customers:', error);
    showNotification('Error loading customers: ' + error.message, 'error');
  }
}

// Populate customer select dropdown
function populateCustomerSelect(customers) {
  const customerSelect = document.getElementById('customer-select');
  if (!customerSelect) return;
  
  // Keep the "New Customer" option
  customerSelect.innerHTML = '<option value="">-- New Customer --</option>';
  
  if (!customers || customers.length === 0) {
    console.log('No customers to populate dropdown');
    return;
  }
  
  // Sort customers alphabetically by name
  customers.sort((a, b) => {
    const nameA = (a.name || '').toLowerCase();
    const nameB = (b.name || '').toLowerCase();
    return nameA.localeCompare(nameB);
  });
  
  // Add each customer as an option
  customers.forEach(customer => {
    const option = document.createElement('option');
    option.value = customer.id;
    
    // Include business name if available
    if (customer.business) {
      option.textContent = `${customer.name} (${customer.business})`;
    } else {
      option.textContent = customer.name;
    }
    
    // Store customer data as dataset attributes
    option.dataset.name = customer.name || '';
    option.dataset.business = customer.business || '';
    option.dataset.email = customer.email || '';
    option.dataset.phone = customer.phone || '';
    option.dataset.tin = customer.tin || '';
    
    customerSelect.appendChild(option);
  });
  
  // Add event listener for customer selection
  customerSelect.addEventListener('change', handleCustomerSelection);
}

// Handle customer selection
async function handleCustomerSelection(event) {
  const customerId = event.target.value;
  
  // If "New Customer" is selected, clear the fields
  if (!customerId) {
    clearBuyerFields();
    return;
  }
  
  try {
    console.log('Customer selected:', customerId);
    
    // Get customer data either from the dropdown dataset or from the database
    let customerData = null;
    
    // Try to get data from option dataset first (faster)
    const selectedOption = event.target.options[event.target.selectedIndex];
    if (selectedOption) {
      customerData = {
        id: customerId,
        name: selectedOption.dataset.name,
        business: selectedOption.dataset.business,
        email: selectedOption.dataset.email,
        phone: selectedOption.dataset.phone,
        tin: selectedOption.dataset.tin
      };
    }
    
    // If data is incomplete in dataset, fetch from database
    if (!customerData || !customerData.name) {
      console.log('Fetching customer data from database...');
      
      if (window.electronAPI && typeof window.electronAPI.getCustomerById === 'function') {
        customerData = await window.electronAPI.getCustomerById(customerId);
      } else if (window.SalesHandlers && typeof window.SalesHandlers.getCustomerById === 'function') {
        customerData = await window.SalesHandlers.getCustomerById(customerId);
      } else {
        console.warn('getCustomerById API method not available');
        return;
      }
    }
    
    // Populate buyer fields with customer data
    if (customerData) {
      populateBuyerFields(customerData);
    } else {
      console.warn('Customer data not found for ID:', customerId);
      clearBuyerFields();
    }
    
  } catch (error) {
    console.error('Error handling customer selection:', error);
    showNotification('Error loading customer data: ' + error.message, 'error');
    clearBuyerFields();
  }
}

// Populate buyer fields with customer data
function populateBuyerFields(customer) {
  document.getElementById('buyer-name').value = customer.name || '';
  document.getElementById('buyer-title').value = customer.business || '';
  document.getElementById('buyer-tin').value = customer.tin || '';
  document.getElementById('buyer-phone').value = customer.phone || '';
  document.getElementById('buyer-email').value = customer.email || '';
}

// Clear buyer fields
function clearBuyerFields() {
  document.getElementById('buyer-name').value = '';
  document.getElementById('buyer-title').value = '';
  document.getElementById('buyer-tin').value = '';
  document.getElementById('buyer-phone').value = '';
  document.getElementById('buyer-email').value = '';
}

// --- Add search and filter logic for item selection ---
let itemSearchTerm = '';

// --- Enhanced item search with results box ---
function renderItemSearchResults(filtered) {
  const resultsBox = document.getElementById('item-search-results');
  const itemSelect = document.getElementById('item-select');
  if (!resultsBox) return;
  resultsBox.innerHTML = '';
  if (!filtered || filtered.length === 0) {
    resultsBox.style.display = 'none';
    return;
  }
  filtered.forEach(item => {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'list-group-item list-group-item-action text-white';
    row.style.background = '#23272b';
    row.style.border = 'none';
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.alignItems = 'center';
    // Show price and dimension
    const dimension = item.dimension || item.dimensions || item.size || '';
    row.innerHTML = `
      <div style='flex:1;'>
        <div><strong>${item.description}</strong> <small class='text-muted'>(${item.type}${dimension ? ', ' + dimension : ''})</small></div>
        <div style='font-size: 12px; color: #aaa;'>${dimension ? 'Dimension: ' + dimension + ' | ' : ''}Price: <span style='color:#fff;'>TZS ${item.price?.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span></div>
      </div>
      <span class='badge bg-secondary'>${item.quantity} in stock</span>
      <span class='badge bg-success ms-2'>TZS ${item.price?.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
    `;
    row.onclick = () => {
      if (itemSelect) {
        itemSelect.value = item.id;
        updateItemDetails();
        resultsBox.style.display = 'none';
        const qtyInput = document.getElementById('item-quantity');
        if (qtyInput) qtyInput.focus();
      }
    };
    resultsBox.appendChild(row);
  });
  resultsBox.style.display = 'block';
}

// Update filterAndPopulateItemSelect to also update the results box
function filterAndPopulateItemSelect() {
  const itemSelect = document.getElementById('item-select');
  if (!itemSelect) return;
  itemSelect.innerHTML = '<option value="">Select an item...</option>';
  const search = itemSearchTerm.trim().toLowerCase();
  const filtered = !search ? inventory : inventory.filter(item => {
    return (
      (item.description && item.description.toLowerCase().includes(search)) ||
      (item.type && item.type.toLowerCase().includes(search)) ||
      (item.dimension && item.dimension.toLowerCase().includes(search)) ||
      (item.size && item.size.toLowerCase().includes(search)) ||
      (item.brand && item.brand.toLowerCase().includes(search)) ||
      (item.sku && item.sku.toLowerCase().includes(search))
    );
  });
  filtered.forEach(item => {
    const option = document.createElement('option');
    option.value = item.id;
    const dimension = item.dimension || item.dimensions || item.size || '';
    const price = item.price != null ? `TZS ${item.price.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}` : '';
    option.textContent = `${item.description} (${item.type}${dimension ? ', ' + dimension : ''})${price ? ' - ' + price : ''} - ${item.quantity} in stock`;
    option.dataset.price = item.price;
    option.dataset.type = item.type;
    option.dataset.description = item.description;
    option.dataset.dimension = dimension;
    option.dataset.brand = item.brand || '';
    option.dataset.sku = item.sku || '';
    itemSelect.appendChild(option);
  });
  // Show results box if searching
  renderItemSearchResults(search ? filtered : []);
}

// Replace populateItemSelect with the new filter function
function populateItemSelect() {
  filterAndPopulateItemSelect();
}

// Add event listener for the search box
function setupItemSearchListener() {
  const searchInput = document.getElementById('item-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      itemSearchTerm = e.target.value;
      filterAndPopulateItemSelect();
      updateItemDetails();
    });
  }
}

// Set up event listeners
function setupEventListeners() {
  // Item selection
  const itemSelect = document.getElementById('item-select');
  const itemQuantity = document.getElementById('item-quantity');
  const addItemBtn = document.getElementById('add-item-btn');
  
  if (itemSelect && itemQuantity && addItemBtn) {
    itemSelect.addEventListener('change', updateItemDetails);
    itemQuantity.addEventListener('input', updateItemDetails);
    addItemBtn.addEventListener('click', addItemToSale);
  }
  
  // Customer selection - moved to populateCustomerSelect function
  
  // Period filter
  const periodFilter = document.getElementById('period-filter');
  if (periodFilter) {
    periodFilter.addEventListener('change', () => filterSales());
  }
  
  // Complete sale button
  const completeSaleBtn = document.getElementById('complete-sale-btn');
  if (completeSaleBtn) {
    completeSaleBtn.addEventListener('click', completeSale);
  }
  
  // VAT include/exclude switch
  const vatSwitch = document.getElementById('include-vat-switch');
  if (vatSwitch) {
    vatSwitch.addEventListener('change', updateVatAndTotal);
  }
  
  // Register for sale-created events from main process
  if (window.electronAPI && typeof window.electronAPI.onSaleCreated === 'function') {
    console.log('Setting up listener for sale-created events');
    window.electronAPI.onSaleCreated((newSale) => {
      console.log('Received sale-created event with sale:', newSale);
      
      // Check if the sale is already in our array (avoid duplicates)
      const existingIndex = sales.findIndex(s => s.id === newSale.id);
      
      if (existingIndex === -1) {
        // Add the new sale to our array
        sales.unshift(newSale);  // Add to beginning (newest first)
        
        // Update UI
        filterSales();
        updateSalesStats();
        
        showNotification('New sale received', 'info');
      } else {
        console.log('Sale already exists in array, not adding duplicate');
      }
    });
  }
  
  // Refresh button
  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      try {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        // Force reload sales data from database
        if (window.SalesHandlers && typeof window.SalesHandlers.getAllSales === 'function') {
          console.log('Refreshing sales data from SalesHandlers.getAllSales');
          sales = await window.SalesHandlers.getAllSales() || [];
        } else if (window.electronAPI && typeof window.electronAPI.getSales === 'function') {
          console.log('Refreshing sales data from electronAPI.getSales');
          sales = await window.electronAPI.getSales() || [];
        }
        
        // Sort sales by date (newest first)
        if (Array.isArray(sales) && sales.length > 0) {
          sales.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.date).getTime();
            const dateB = new Date(b.createdAt || b.date).getTime();
            return dateB - dateA; // Sort descending (newest first)
          });
        }
        
        // Update the UI
        filterSales();
        updateSalesStats();
        
        showNotification('Sales data refreshed', 'success');
      } catch (error) {
        console.error('Error refreshing sales data:', error);
        showNotification('Error refreshing sales data: ' + error.message, 'error');
      } finally {
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
      }
    });
  }
  
  // Reset new sale form when modal is closed
  const newSaleModal = document.getElementById('newSaleModal');
  if (newSaleModal) {
    newSaleModal.addEventListener('hidden.bs.modal', () => {
      resetNewSaleForm();
    });
  }
}

// Update item details when selection changes
function updateItemDetails() {
  const itemSelect = document.getElementById('item-select');
  const itemQuantity = document.getElementById('item-quantity');
  const addItemBtn = document.getElementById('add-item-btn');
  
  if (!itemSelect.value) {
    addItemBtn.disabled = true;
    return;
  }
  
  const selectedOption = itemSelect.options[itemSelect.selectedIndex];
  const quantity = parseInt(itemQuantity.value) || 0;
  const price = parseFloat(selectedOption.dataset.price) || 0;
  
  // Update total
  const total = quantity * price;
  
  // Find the selected inventory item to check stock
  const selectedInventoryItem = inventory.find(item => item.id === itemSelect.value);
  const availableQuantity = selectedInventoryItem ? selectedInventoryItem.quantity : 0;
  
  // Enable/disable add button based on quantity
  if (quantity <= 0) {
    addItemBtn.disabled = true;
  } else if (quantity > availableQuantity) {
    addItemBtn.disabled = true;
    // Show notification if quantity exceeds available stock
    showNotification(`Cannot add item: Quantity (${quantity}) exceeds available stock (${availableQuantity})`, 'error');
  } else {
    addItemBtn.disabled = false;
  }
}

// Add item to sale
function addItemToSale() {
  const itemSelect = document.getElementById('item-select');
  const itemQuantity = document.getElementById('item-quantity');
  
  if (!itemSelect.value || !itemQuantity.value) {
    showNotification('Please select an item and specify quantity', 'error');
    return;
  }
  
  const selectedOption = itemSelect.options[itemSelect.selectedIndex];
  const quantity = parseInt(itemQuantity.value);
  const price = parseFloat(selectedOption.dataset.price);
  
  // Validate quantity against available inventory
  const selectedInventoryItem = inventory.find(item => item.id === itemSelect.value);
  if (!selectedInventoryItem) {
    showNotification('Selected item not found in inventory', 'error');
    return;
  }
  
  const availableQuantity = selectedInventoryItem.quantity;
  
  if (quantity <= 0) {
    showNotification('Quantity must be greater than zero', 'error');
    return;
  }
  
  if (quantity > availableQuantity) {
    showNotification(`Cannot add item: Quantity (${quantity}) exceeds available stock (${availableQuantity})`, 'error');
    return;
  }
  
  // Check if the item is already in the selected items list
  const existingItemIndex = selectedItems.findIndex(item => item.id === itemSelect.value);
  
  if (existingItemIndex !== -1) {
    // If the item already exists, update its quantity and total
    const totalNewQuantity = selectedItems[existingItemIndex].quantity + quantity;
    
    if (totalNewQuantity > availableQuantity) {
      showNotification(`Cannot add ${quantity} more units: Total quantity (${totalNewQuantity}) would exceed available stock (${availableQuantity})`, 'error');
      return;
    }
    
    selectedItems[existingItemIndex].quantity = totalNewQuantity;
    selectedItems[existingItemIndex].total = totalNewQuantity * price;
    showNotification(`Updated quantity for ${selectedOption.dataset.description}`, 'success');
  } else {
    // Add as a new item
    const item = {
      id: itemSelect.value,
      description: selectedOption.dataset.description,
      type: selectedOption.dataset.type,
      dimension: selectedOption.dataset.dimension,
      quantity: quantity,
      price: price,
      total: quantity * price
    };
    
    selectedItems.push(item);
    showNotification(`Added ${quantity} × ${selectedOption.dataset.description}`, 'success');
  }
  
  updateSelectedItemsTable();
  
  // Reset selection
  itemSelect.selectedIndex = 0;
  itemQuantity.value = 1;
  updateItemDetails();
}

// Update selected items table
function updateSelectedItemsTable() {
  const tableBody = document.getElementById('selected-items');
  if (!tableBody) return;
  
  if (selectedItems.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted">
          No items added to sale
        </td>
      </tr>
    `;
    grandTotal = 0;
  } else {
    let html = '';
    grandTotal = 0;
    
    selectedItems.forEach((item, index) => {
      grandTotal += item.total;
      html += `
        <tr>
          <td>${item.description}</td>
          <td>${item.type}</td>
          <td>${item.dimension || item.size || 'N/A'}</td>
          <td>${item.quantity}</td>
          <td>TZsh ${item.price.toFixed(2)}</td>
          <td>TZsh ${item.total.toFixed(2)}</td>
          <td>
            <button class="btn btn-sm btn-danger remove-item" data-index="${index}">
              <i class="fas fa-times"></i>
            </button>
          </td>
        </tr>
      `;
    });
    
    tableBody.innerHTML = html;
    
    // Add event listeners for remove buttons
    document.querySelectorAll('.remove-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        selectedItems.splice(index, 1);
        updateSelectedItemsTable();
      });
    });
  }
  
  // Update grand total
  document.getElementById('grand-total').textContent = `TZsh ${grandTotal.toFixed(2)}`;
  
  // Enable/disable complete sale button
  const completeSaleBtn = document.getElementById('complete-sale-btn');
  if (completeSaleBtn) {
    completeSaleBtn.disabled = selectedItems.length === 0;
  }
}

// Complete sale
async function completeSale() {
  try {
    // Validate inputs
    const buyerName = document.getElementById('buyer-name').value.trim();
    
    if (!buyerName) {
      showNotification('Please enter buyer name', 'error');
      return;
    }
    
    if (selectedItems.length === 0) {
      showNotification('Please add items to sale', 'error');
      return;
    }
    
    // Disable button to prevent multiple clicks
    const completeSaleBtn = document.getElementById('complete-sale-btn');
    if (completeSaleBtn) {
      completeSaleBtn.disabled = true;
      completeSaleBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Processing...';
    }
    
    // Get buyer information
    const customerId = document.getElementById('customer-select').value;
    const buyerTitle = document.getElementById('buyer-title').value.trim();
    const buyerTin = document.getElementById('buyer-tin').value.trim();
    const buyerPhone = document.getElementById('buyer-phone').value.trim();
    const buyerEmail = document.getElementById('buyer-email').value.trim();
    const notes = document.getElementById('sale-notes').value.trim();
    
    // Get payment method
    const paymentMethod = document.getElementById('payment-method').value;
    
    // Get VAT rate
    const vatSwitch = document.getElementById('include-vat-switch');
    const vatInput = document.getElementById('vat-rate');
    let vatRate = 0;
    if (vatSwitch && vatSwitch.checked && vatInput) {
      vatRate = parseFloat(vatInput.value || '0');
      if (isNaN(vatRate) || vatRate < 0) vatRate = 0;
    }
    const vatAmount = grandTotal * (vatRate / (100 + vatRate));
    const netAmount = grandTotal - vatAmount;
    const totalWithVat = grandTotal;
    
    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`;
    
    // Create sale object
    const sale = {
      id: Date.now().toString(),
      invoiceNumber: invoiceNumber,
      date: new Date().toISOString(),
      items: selectedItems,
      totalAmount: grandTotal, // Always store the full selling price (including VAT if present)
      paymentMethod: paymentMethod,
      status: 'completed',
      notes: notes,
      buyer: {
        id: customerId || null,
        name: buyerName,
        title: buyerTitle,
        tin: buyerTin,
        phone: buyerPhone,
        email: buyerEmail
      },
      vatRate: vatRate,
      vatAmount: vatAmount,
      netAmount: netAmount, // Store net amount for reference
      totalWithVat: totalWithVat
    };
    
    console.log('Creating new sale:', sale);
    
    // Save sale
    let savedSale;
    
    if (window.electronAPI && typeof window.electronAPI.addSale === 'function') {
      savedSale = await window.electronAPI.addSale(sale);
      console.log('Sale created via electronAPI.addSale:', savedSale);
    } else if (window.SalesHandlers && typeof window.SalesHandlers.createSale === 'function') {
      savedSale = await window.SalesHandlers.createSale(sale);
      console.log('Sale created via SalesHandlers.createSale:', savedSale);
    } else if (window.electronAPI && typeof window.electronAPI.createSale === 'function') {
      savedSale = await window.electronAPI.createSale(sale);
      console.log('Sale created via electronAPI.createSale:', savedSale);
    } else {
      // Fallback to localStorage if API methods are not available
      console.warn('API methods not available, using localStorage fallback...');
      sales.push(sale);
      localStorage.setItem('sales_data', JSON.stringify(sales));
      savedSale = { success: true, sale: sale };
      
      // Update inventory in localStorage
      updateInventoryAfterSale(selectedItems);
    }
    
    // Add the new sale to our global sales array immediately
    if (savedSale && savedSale.success) {
      const newSale = savedSale.sale || sale;
      console.log('Adding new sale to UI:', newSale);
      
      // Add the new sale to the global sales array
      sales.unshift(newSale);
      
      // Immediately update the displayed sales
      filterSales();
      updateSalesStats();
      
      // Update customer purchase statistics if a customer was selected
      if (customerId) {
        try {
          console.log(`Updating purchase statistics for customer ${customerId} with amount ${grandTotal}`);
          
          // Update customer purchase statistics
          if (window.electronAPI && typeof window.electronAPI.updateCustomerPurchaseStats === 'function') {
            const result = await window.electronAPI.updateCustomerPurchaseStats({
              customerId: customerId,
              purchaseAmount: grandTotal
            });
            
            console.log('Customer purchase statistics updated:', result);
          } else {
            console.warn('updateCustomerPurchaseStats function not available');
            
            // Fallback: Update customer stats in localStorage if API not available
            const customers = JSON.parse(localStorage.getItem('customers_data') || '[]');
            const customerIndex = customers.findIndex(c => c.id === customerId);
            
            if (customerIndex !== -1) {
              const customer = customers[customerIndex];
              const now = new Date().toISOString();
              
              // Update purchase stats
              customer.totalPurchases = (customer.totalPurchases || 0) + grandTotal;
              customer.purchaseCount = (customer.purchaseCount || 0) + 1;
              customer.lastPurchaseDate = now;
              customer.updatedAt = now;
              
              // Save back to localStorage
              customers[customerIndex] = customer;
              localStorage.setItem('customers_data', JSON.stringify(customers));
              console.log('Customer purchase statistics updated in localStorage');
            }
          }
        } catch (statsError) {
          console.error('Error updating customer purchase statistics:', statsError);
          // Don't fail the sale if this fails
        }
      }
    }
    
    // Show success notification
    showNotification('Sale completed successfully', 'success');
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('newSaleModal'));
    if (modal) {
      modal.hide();
    }
    
    // Reset form
    resetNewSaleForm();
    
    // Reset button
    if (completeSaleBtn) {
      completeSaleBtn.disabled = false;
      completeSaleBtn.innerHTML = '<i class="fas fa-check me-2"></i> Complete Sale';
    }
    
    // Generate receipt/invoice immediately
    if (savedSale) {
      setTimeout(() => {
        // Set document title for PDF filename based on customer and invoice
        const originalTitle = document.title;
        const sale = savedSale.sale || sale;
        const customerName = sale.buyer?.name || 'Unknown';
        const invoiceNumber = sale.invoiceNumber || `INV-${sale.id}`;
        document.title = `${customerName}_${invoiceNumber}_Receipt`;
        
        createTempPreviewAndPrint(savedSale.sale || sale, false); // Pass false for receipt, true for invoice
        
        // Restore original title after printing
        setTimeout(() => {
          document.title = originalTitle;
        }, 1000);
      }, 500);
    }
    
  } catch (error) {
    console.error('Error completing sale:', error);
    showNotification('Error completing sale: ' + error.message, 'error');
    
    // Reset button
    const completeSaleBtn = document.getElementById('complete-sale-btn');
    if (completeSaleBtn) {
      completeSaleBtn.disabled = false;
      completeSaleBtn.innerHTML = '<i class="fas fa-check me-2"></i> Complete Sale';
    }
  }
}

// Update inventory after sale
function updateInventoryAfterSale(items) {
  try {
    // Get current inventory from localStorage
    const inventoryData = localStorage.getItem('inventory_data');
    if (!inventoryData) return;
    
    let inventoryItems = JSON.parse(inventoryData);
    let updated = false;
    
    items.forEach(item => {
      const index = inventoryItems.findIndex(invItem => invItem.id === item.id);
      if (index !== -1) {
        // Update quantity
        inventoryItems[index].quantity = Math.max(0, inventoryItems[index].quantity - item.quantity);
        updated = true;
      }
    });
    
    if (updated) {
      // Save back to localStorage
      inventory = inventoryItems;
      localStorage.setItem('inventory_data', JSON.stringify(inventoryItems));
      
      // Refresh item dropdown
      populateItemSelect();
    }
  } catch (error) {
    console.error('Error updating inventory:', error);
  }
}

// Filter sales based on selected period
function filterSales() {
  console.log('Filtering sales. Total sales in memory:', sales ? sales.length : 0);
  
  // Ensure sales is an array
  if (!Array.isArray(sales)) {
    console.error('Sales is not an array:', sales);
    sales = [];
  }
  
  const periodFilter = document.getElementById('period-filter');
  const period = periodFilter ? periodFilter.value : 'all';
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekStart = new Date(today - 6 * 86400000).getTime(); // 7 days ago
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const yearStart = new Date(now.getFullYear(), 0, 1).getTime();
  
  // Filter sales based on selected period
  try {
    switch (period) {
      case 'today':
        filteredSales = sales.filter(sale => {
          if (!sale) return false;
          const saleDate = new Date(sale.createdAt || sale.date).getTime();
          return !isNaN(saleDate) && saleDate >= today;
        });
        break;
      case 'week':
        filteredSales = sales.filter(sale => {
          if (!sale) return false;
          const saleDate = new Date(sale.createdAt || sale.date).getTime();
          return !isNaN(saleDate) && saleDate >= weekStart;
        });
        break;
      case 'month':
        filteredSales = sales.filter(sale => {
          if (!sale) return false;
          const saleDate = new Date(sale.createdAt || sale.date).getTime();
          return !isNaN(saleDate) && saleDate >= monthStart;
        });
        break;
      case 'year':
        filteredSales = sales.filter(sale => {
          if (!sale) return false;
          const saleDate = new Date(sale.createdAt || sale.date).getTime();
          return !isNaN(saleDate) && saleDate >= yearStart;
        });
        break;
      case 'all':
      default:
        filteredSales = [...sales];
        break;
    }
  } catch (error) {
    console.error('Error filtering sales:', error);
    filteredSales = [...sales]; // Fallback to all sales
  }
  
  console.log(`Filtered ${sales.length} sales to ${filteredSales.length} sales for period: ${period}`);
  
  // Ensure filteredSales is an array
  if (!Array.isArray(filteredSales)) {
    console.error('filteredSales is not an array after filtering');
    filteredSales = [];
  }
  
  // Render sales table
  renderSalesTable();
  
  // Update sales stats
  updateSalesStats();
}

// Update sales stats
function updateSalesStats() {
  try {
    // Simple summary calculations
    const totalSales = filteredSales.length;
    let totalRevenue = 0;
    let totalItems = 0;
    
    filteredSales.forEach(sale => {
      totalRevenue += parseFloat(sale.totalAmount) || 0;
      if (sale.items && Array.isArray(sale.items)) {
        totalItems += sale.items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
      }
    });
    
    // Update UI
    if (document.getElementById('total-sales')) {
      document.getElementById('total-sales').textContent = totalSales;
    }
    
    if (document.getElementById('total-revenue')) {
      document.getElementById('total-revenue').textContent = `TZsh ${totalRevenue.toFixed(2)}`;
    }
    
    if (document.getElementById('total-items')) {
      document.getElementById('total-items').textContent = totalItems;
    }
  } catch (error) {
    console.error('Error updating sales stats:', error);
  }
}

// Initialize on DOMContentLoaded if not called externally
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, checking if sales need initialization');
  
  // Only initialize if not already called and we're on the sales page
  if (
    !window.salesInitialized && 
    document.getElementById('sales-table') &&
    !document.querySelector('.main-content iframe')
  ) {
    console.log('Initializing sales from DOMContentLoaded');
    window.salesInitialized = true;
    initializeSales();
  }
  
  // Add event listener for the Generate Document button in the modal footer
  const generateDocumentBtn = document.getElementById('generate-document-btn');
  if (generateDocumentBtn) {
    generateDocumentBtn.addEventListener('click', () => {
      console.log('Print button clicked in modal footer');
      
      // Find current active sale details
      const printableContent = document.getElementById('printable-content');
      if (printableContent) {
        const saleId = printableContent.getAttribute('data-sale-id');
        const sale = filteredSales.find(s => s.id === saleId);
        
        if (sale) {
          // Set document title with customer name and invoice number
          const originalTitle = document.title;
          const customerName = sale.buyer?.name || sale.customerName || 'Unknown';
          const invoiceNumber = sale.invoiceNumber || `INV-${sale.id.substring(0, 6)}`;
          
          // Set document title to format the PDF filename
          document.title = `${customerName}_${invoiceNumber}`;
          
          // Print document
          window.print();
          
          // Restore original title
          setTimeout(() => {
            document.title = originalTitle;
          }, 1000);
        } else {
          window.print();
        }
      } else {
        window.print();
      }
    });
  }
});

// Export module functions
window.initializeSales = initializeSales;

// Render sales table
function renderSalesTable() {
  const tableBody = document.getElementById('sales-table');
  if (!tableBody) {
    console.error('Sales table element not found');
    return;
  }
  
  // Ensure filteredSales is an array
  if (!filteredSales || !Array.isArray(filteredSales)) {
    console.error('filteredSales is not valid for rendering:', filteredSales);
    filteredSales = [];
  }
  
  if (filteredSales.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="11" class="text-center">
          <p class="text-muted">No sales found for selected period</p>
        </td>
      </tr>
    `;
    return;
  }
  
  console.log(`Rendering sales table with ${filteredSales.length} sales`);
  
  let html = '';
  
  filteredSales.forEach((sale, index) => {
    if (!sale) {
      console.warn(`Sale at index ${index} is undefined or null`);
      return; // Skip this iteration if sale is invalid
    }
    
    // Format date
    let date;
    try {
      date = new Date(sale.createdAt || sale.date);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      date = date.toLocaleString();
    } catch (error) {
      console.warn(`Invalid date for sale ${sale.id || index}:`, error);
      date = 'N/A';
    }
    
    // Get customer name (handle different data structures)
    const customerName = sale.buyer?.name || sale.customerName || 'Unknown';
    const customerTin = sale.buyer?.tin || sale.customerTin || 'N/A';
    
    // Get invoice number
    const invoiceNumber = sale.invoiceNumber || `INV-${sale.id?.substring(0, 6) || index}`;
    
    // Format total amount
    let totalAmount = 0;
    try {
      totalAmount = parseFloat(sale.totalAmount) || 0;
      if (isNaN(totalAmount)) {
        throw new Error('Invalid amount');
      }
    } catch (error) {
      console.warn(`Invalid amount for sale ${sale.id || index}:`, error);
    }
    
    // Get payment method
    const paymentMethod = sale.paymentMethod || 'Cash';
    
    // Parse items
    let items = [];
    try {
      if (typeof sale.items === 'string') {
        items = JSON.parse(sale.items);
      } else if (Array.isArray(sale.items)) {
        items = sale.items;
      }
    } catch (error) {
      console.warn(`Error parsing items for sale ${sale.id || index}:`, error);
    }
    
    // If there are multiple items, create a row for each item
    if (items.length > 0) {
      items.forEach((item, itemIndex) => {
        // Item properties
        const itemDescription = item.description || 'N/A';
        const itemType = item.type || 'N/A';
        const itemDimension = item.dimension || item.size || 'N/A'; // Use whatever dimension field is available
        const itemQuantity = item.quantity || 0;
    
    // Generate row HTML
        html += `
          <tr${itemIndex === 0 ? ' class="border-top-bold"' : ''}>
            ${itemIndex === 0 ? `<td rowspan="${items.length}">${date}</td>` : ''}
            ${itemIndex === 0 ? `<td rowspan="${items.length}">${invoiceNumber}</td>` : ''}
            ${itemIndex === 0 ? `<td rowspan="${items.length}">${customerName}</td>` : ''}
            ${itemIndex === 0 ? `<td rowspan="${items.length}">${customerTin}</td>` : ''}
            <td>${itemDescription}</td>
            <td>${itemType}</td>
            <td>${itemDimension}</td>
            <td>${itemQuantity}</td>
            ${itemIndex === 0 ? `<td rowspan="${items.length}">TZsh ${totalAmount.toFixed(2)}</td>` : ''}
            ${itemIndex === 0 ? `<td rowspan="${items.length}">${paymentMethod}</td>` : ''}
            ${itemIndex === 0 ? `
            <td rowspan="${items.length}" class="text-end">
              <div class="btn-group">
                <button class="btn btn-sm btn-primary view-sale-btn" data-id="${sale.id}">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-info generate-receipt-btn" data-id="${sale.id}">
                  <i class="fas fa-receipt"></i>
                </button>
                <button class="btn btn-sm btn-secondary generate-invoice-btn" data-id="${sale.id}">
                  <i class="fas fa-file-invoice"></i>
                </button>
              </div>
            </td>` : ''}
          </tr>
        `;
      });
    } else {
      // If no items, still display the sale with empty item cells
    html += `
      <tr>
        <td>${date}</td>
        <td>${invoiceNumber}</td>
        <td>${customerName}</td>
          <td>${customerTin}</td>
          <td>N/A</td>
          <td>N/A</td>
          <td>N/A</td>
          <td>0</td>
        <td>TZsh ${totalAmount.toFixed(2)}</td>
        <td>${paymentMethod}</td>
          <td class="text-end">
          <div class="btn-group">
            <button class="btn btn-sm btn-primary view-sale-btn" data-id="${sale.id}">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-sm btn-info generate-receipt-btn" data-id="${sale.id}">
              <i class="fas fa-receipt"></i>
            </button>
            <button class="btn btn-sm btn-secondary generate-invoice-btn" data-id="${sale.id}">
              <i class="fas fa-file-invoice"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
    }
  });
  
  tableBody.innerHTML = html;
  
  // Add event listeners to the buttons
  document.querySelectorAll('.view-sale-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const saleId = btn.getAttribute('data-id');
      viewSaleDetails(saleId);
    });
  });
  
  document.querySelectorAll('.generate-receipt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const saleId = btn.getAttribute('data-id');
      const sale = filteredSales.find(s => s.id === saleId);
      if (sale) {
        // Set filename based on customer and invoice before printing
        const originalTitle = document.title;
        const customerName = sale.buyer?.name || sale.customerName || 'Unknown';
        const invoiceNumber = sale.invoiceNumber || `INV-${sale.id.substring(0, 6)}`;
        document.title = `${customerName}_${invoiceNumber}_Receipt`;
        
        createTempPreviewAndPrint(sale, false);
        
        // Restore original title after printing
        setTimeout(() => {
          document.title = originalTitle;
        }, 1000);
      }
    });
  });
  
  document.querySelectorAll('.generate-invoice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const saleId = btn.getAttribute('data-id');
      const sale = filteredSales.find(s => s.id === saleId);
      if (sale) {
        // Set filename based on customer and invoice before printing
        const originalTitle = document.title;
        const customerName = sale.buyer?.name || sale.customerName || 'Unknown';
        const invoiceNumber = sale.invoiceNumber || `INV-${sale.id.substring(0, 6)}`;
        document.title = `${customerName}_${invoiceNumber}_Invoice`;
        
        createTempPreviewAndPrint(sale, true);
        
        // Restore original title after printing
        setTimeout(() => {
          document.title = originalTitle;
        }, 1000);
      }
    });
  });
}

// Get badge color for payment method
function getPaymentMethodBadgeColor(method) {
  switch (method) {
    case 'Cash':
      return 'success';
    case 'Check':
      return 'warning';
    case 'Bank Transfer':
      return 'info';
    case 'Mobile Money':
      return 'primary';
    case 'Credit Card':
      return 'danger';
    default:
      return 'secondary';
  }
}

// Reset new sale form
function resetNewSaleForm() {
  // Reset customer selection
  const customerSelect = document.getElementById('customer-select');
  if (customerSelect) {
    customerSelect.selectedIndex = 0;
  }
  
  // Reset buyer fields
  clearBuyerFields();
  
  // Clear selected items
  selectedItems = [];
  updateSelectedItemsTable();
  
  // Reset item selection
  const itemSelect = document.getElementById('item-select');
  if (itemSelect) {
    itemSelect.selectedIndex = 0;
  }
  
  const itemQuantity = document.getElementById('item-quantity');
  if (itemQuantity) {
    itemQuantity.value = 1;
  }
  
  // Reset notes
  const saleNotes = document.getElementById('sale-notes');
  if (saleNotes) {
    saleNotes.value = '';
  }
  
  // Update item details
  updateItemDetails();
}

// Function to display notifications
function showNotification(message, type = 'info') {
  // Use the new notification system if available
  if (window.NotificationSystem) {
    return window.NotificationSystem.show(message, { type });
  }
  
  // Otherwise use the custom implementation
  const toast = document.createElement('div');
  toast.className = 'toast align-items-center border-0';
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.setAttribute('aria-atomic', 'true');
  
  // Get the appropriate background color and icon based on type
  let bgColor, icon, title;
  switch(type) {
    case 'success':
      bgColor = '#10b981';
      icon = 'fa-check-circle';
      title = 'Success';
      break;
    case 'error':
      bgColor = '#ef4444';
      icon = 'fa-exclamation-circle';
      title = 'Error';
      break;
    case 'warning':
      bgColor = '#f59e0b';
      icon = 'fa-exclamation-triangle';
      title = 'Warning';
      break;
    case 'info':
      bgColor = '#3b82f6';
      icon = 'fa-info-circle';
      title = 'Information';
      break;
    default:
      bgColor = '#3b82f6';
      icon = 'fa-info-circle';
      title = 'Information';
  }
  
  // Enhanced toast with icon and better styling
  toast.innerHTML = `
    <div class="toast-header" style="background-color: ${bgColor}; color: white; border: none;">
      <i class="fas ${icon} me-2"></i>
      <strong class="me-auto">${title}</strong>
      <small>Just now</small>
      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
    <div class="toast-body" style="background-color: ${bgColor}15; color: #000; font-weight: 500; padding: 12px 16px;">
      ${message}
    </div>
  `;
  
  // Get or create toast container
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    toastContainer.style.zIndex = '1090';
    document.body.appendChild(toastContainer);
  }
  
  toastContainer.appendChild(toast);
  const bsToast = new bootstrap.Toast(toast, {
    animation: true,
    autohide: true,
    delay: 5000
  });
  bsToast.show();
  
  // Add a subtle entrance animation
  toast.style.transform = 'translateY(20px)';
  toast.style.opacity = '0';
  toast.style.transition = 'all 0.3s ease';
  
    setTimeout(() => {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
  }, 50);
  
  // Remove toast after it's hidden
  toast.addEventListener('hidden.bs.toast', () => {
    toast.remove();
  });
  
  return toast;
}

// Apply enhanced UI elements after DOM is loaded
function applyEnhancedUI() {
  console.log('Applying enhanced UI elements to sales page');
  
  // Add pulse animation to the "New Sale" button
  const newSaleBtn = document.querySelector('button[data-bs-target="#newSaleModal"]');
  if (newSaleBtn) {
    newSaleBtn.classList.add('pulse-button');
  }
  
  // Add the sales-card class to all sales-related cards
  const salesCards = document.querySelectorAll('.card:not(.sales-stats-card)');
  salesCards.forEach(card => {
    card.classList.add('sales-card');
  });
  
  // Enhance sales stats cards
  const statsCards = document.querySelectorAll('.stats-card');
  statsCards.forEach(card => {
    card.classList.add('sales-stats-card');
    
    // Add stats icon based on the title
    const cardTitle = card.querySelector('.card-title');
    if (cardTitle) {
      let iconClass = 'fa-chart-line';
      
      if (cardTitle.textContent.includes('Total')) {
        iconClass = 'fa-money-bill-wave';
      } else if (cardTitle.textContent.includes('Sales')) {
        iconClass = 'fa-shopping-cart';
      } else if (cardTitle.textContent.includes('Customer')) {
        iconClass = 'fa-users';
      } else if (cardTitle.textContent.includes('Profit')) {
        iconClass = 'fa-chart-pie';
      }
      
      const icon = document.createElement('i');
      icon.className = `fas ${iconClass} stats-icon`;
      card.appendChild(icon);
  }
  });
  
  // Enhance payment method badges
  document.querySelectorAll('.payment-badge').forEach(badge => {
    const method = badge.textContent.trim().toLowerCase();
    
    if (method.includes('cash')) {
      badge.classList.add('badge-payment-cash');
    } else if (method.includes('card')) {
      badge.classList.add('badge-payment-card');
    } else if (method.includes('transfer')) {
      badge.classList.add('badge-payment-transfer');
    } else if (method.includes('credit')) {
      badge.classList.add('badge-payment-credit');
    }
  });
  
  // Format the grand total amount box if it exists
  const grandTotalEl = document.getElementById('grand-total');
  if (grandTotalEl) {
    const parentEl = grandTotalEl.parentElement;
    if (parentEl) {
      parentEl.classList.add('total-amount-box');
      
      // Find the label and add a class
      const label = parentEl.querySelector('label, strong');
      if (label) {
        label.classList.add('total-amount-label');
      }
      
      // Add class to the grand total value
      grandTotalEl.classList.add('total-amount-value');
    }
  }
  
  // Apply table styles
  applyTableHeaderStyles();
}

// Call the enhanced UI function when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Apply enhanced UI elements
  setTimeout(applyEnhancedUI, 500);
  
  // Also apply when sales data is loaded or refreshed
  window.addEventListener('sales-data-loaded', applyEnhancedUI);
  
  // Original initialization code if not already called
  if (!window.salesInitialized) {
    window.salesInitialized = true;
    
    // Initialize the sales module
    initializeSales();
    
    // Show welcome notification
    showNotification('Welcome to the Sales Management module', 'info');
  }
});

// Update the applyTableHeaderStyles function to be more aggressive
function applyTableHeaderStyles() {
  console.log('Applying blue header styles to sales tables - ENHANCED VERSION');
  
  // Target elements by both ID and class
  const tableSelectors = [
    '#sales-table',
    '#selected-items',
    '.blue-header-table thead',
    '.table thead',
    'table thead'
  ];
  
  // For each selector, apply styles directly
  tableSelectors.forEach(selector => {
    let elements = document.querySelectorAll(selector);
    
    elements.forEach(element => {
      // Find the closest table and its header
      const table = element.closest('table');
      if (!table) return;
      
      const header = table.querySelector('thead');
      if (!header) return;
  
      // Apply styles to header element
      header.style.backgroundColor = '#3b82f6';
      
      // Apply styles to all rows in header
      const headerRows = header.querySelectorAll('tr');
      headerRows.forEach(row => {
        row.style.backgroundColor = '#3b82f6';
        row.style.color = 'white';
      });
      
      // Apply styles to all cells in header
      const headerCells = header.querySelectorAll('th');
      headerCells.forEach(cell => {
        cell.style.backgroundColor = '#3b82f6';
        cell.style.color = 'white';
        cell.style.fontWeight = 'bold';
        cell.style.borderColor = 'rgba(255, 255, 255, 0.2)';
      });
    });
  });
  
  // Also add CSS class to the head element as a backup method
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    table thead tr, .table thead tr, #inventory-table thead tr, #sales-table thead tr {
      background-color: #3b82f6 !important;
      color: white !important;
    }
    
    table thead th, .table thead th, #inventory-table thead th, #sales-table thead th {
      background-color: #3b82f6 !important;
      color: white !important;
      font-weight: bold !important;
    }
  `;
  document.head.appendChild(styleElement);
}

// Intercept the original renderSalesTable
const originalRenderSalesTable = renderSalesTable;
renderSalesTable = function(...args) {
  // Call the original function
  originalRenderSalesTable.apply(this, args);
  
  // Apply table styles after rendering
  setTimeout(applyTableHeaderStyles, 10);
};

// View sale details function
function viewSaleDetails(saleId, isInvoice = false) {
  try {
    // Find the sale in the filtered sales array
    const sale = filteredSales.find(s => s.id === saleId);
    
    if (!sale) {
      showNotification(`Sale with ID ${saleId} not found`, 'error');
      return;
    }
    
    // Check if modal container exists
    let modalContainer = document.getElementById('sale-details-container');
    let modalElement = document.getElementById('saleDetailsModal');
    
    // Create modal if it doesn't exist
    if (!modalContainer) {
      modalContainer = document.createElement('div');
      modalContainer.id = 'sale-details-container';
      
      const modalHTML = `
        <div class="modal fade" id="saleDetailsModal" tabindex="-1" aria-labelledby="saleDetailsModalLabel" aria-hidden="true">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header bg-primary text-white">
                <h5 class="modal-title" id="saleDetailsModalLabel">Sale Details</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <div id="sale-details-content"></div>
                </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                  <button type="button" class="btn btn-primary" id="generate-document-btn">
                  <i class="fas fa-file-alt me-2"></i>Generate Document
                  </button>
              </div>
            </div>
          </div>
        </div>
      `;
      
      modalContainer.innerHTML = modalHTML;
      document.body.appendChild(modalContainer);
      
      // Get the newly added modal element
      modalElement = document.getElementById('saleDetailsModal');
    }
    
    // Format date
    const saleDate = new Date(sale.createdAt || sale.date).toLocaleString();
    
    // Calculate total if not available
    const total = sale.totalAmount || sale.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    
    // Create HTML for preview
    let content = '';
    if (isInvoice) {
      // Invoice style preview
      content = `
        <div class="invoice-preview p-4 bg-dark text-white" id="printable-content" data-sale-id="${sale.id}">
          <div class="row mb-4">
            <div class="col-6">
              <h3 class="text-white mb-3">INVOICE</h3>
              <p class="mb-1 text-white"><strong>Invoice #:</strong> ${sale.invoiceNumber || 'INV-' + sale.id.substring(0, 6)}</p>
              <p class="mb-1 text-white"><strong>Date:</strong> ${saleDate}</p>
            </div>
            <div class="col-6 text-end">
              <h5 class="text-white">ELIVA HARDWARE</h5>
              <p class="text-white">Pipe Inventory Management System</p>
            </div>
          </div>
          
          <div class="row mb-4">
            <div class="col-6">
              <h5 class="mb-2 text-white">Bill To:</h5>
              <p class="mb-1 text-white"><strong>Name:</strong> ${sale.buyer?.name || sale.customerName || 'Unknown'}</p>
              ${sale.buyer?.title ? `<p class="mb-1 text-white"><strong>Title:</strong> ${sale.buyer.title}</p>` : ''}
              ${sale.buyer?.tin || sale.customerTin ? `<p class="mb-1 text-white"><strong>TIN #:</strong> ${sale.buyer?.tin || sale.customerTin}</p>` : ''}
              ${sale.buyer?.phone || sale.customerPhone ? `<p class="mb-1 text-white"><strong>Phone:</strong> ${sale.buyer?.phone || sale.customerPhone}</p>` : ''}
              ${sale.buyer?.email || sale.customerEmail ? `<p class="mb-1 text-white"><strong>Email:</strong> ${sale.buyer?.email || sale.customerEmail}</p>` : ''}
            </div>
            <div class="col-6 text-end">
              <p class="mb-1 text-white"><strong>Payment Method:</strong> ${sale.paymentMethod || 'Cash'}</p>
            </div>
          </div>
          
          <div class="table-responsive">
            <table class="table table-dark table-bordered">
              <thead class="bg-primary text-white">
                <tr>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Size/Dimension</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
      `;
      
      // Add table rows
      sale.items.forEach(item => {
        const itemTotal = item.total || (item.quantity * item.price);
        const dimension = item.dimension || item.size || 'N/A';
        content += `
          <tr>
            <td class="text-white">${item.description}</td>
            <td class="text-white">${item.type}</td>
            <td class="text-white">${dimension}</td>
            <td class="text-white">${item.quantity}</td>
            <td class="text-white">TZsh ${item.price.toFixed(2)}</td>
            <td class="text-white">TZsh ${itemTotal.toFixed(2)}</td>
          </tr>
        `;
      });
      
      // Add total and finish table
      content += `
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="4" class="text-end text-white"><strong>Subtotal (Net):</strong></td>
                  <td class="text-white">TZsh ${(sale.netAmount || (sale.totalAmount - sale.vatAmount) || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="4" class="text-end text-white"><strong>VAT (${sale.vatRate || 0}%):</strong></td>
                  <td class="text-white">TZsh ${(sale.vatAmount || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="4" class="text-end text-white"><strong>Total:</strong></td>
                  <td class="text-white"><strong>TZsh ${(sale.totalAmount || sale.totalWithVat || 0).toFixed(2)}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
      `;
      
      // Add notes if available
      if (sale.notes) {
        content += `
          <div class="mt-4">
            <h5 class="text-white">Notes:</h5>
            <p class="text-white">${sale.notes}</p>
          </div>
        `;
      }
      
      content += `
        <div class="mt-4 text-center border-top border-light pt-4">
          <p class="text-white">Thank you for your business!</p>
        </div>
      `;
      
    } else {
      // Receipt style preview with white text
      content = `
        <div class="receipt-preview p-4 bg-dark text-white" id="printable-content" data-sale-id="${sale.id}">
          <div class="text-center mb-4">
            <h3 class="mb-1 text-white">ELIVA HARDWARE</h3>
            <p class="text-white">Pipe Inventory Management</p>
            <hr class="border-white">
            <h5 class="my-2 text-white">SALES RECEIPT</h5>
            <p class="mb-1 text-white"><strong>Receipt #:</strong> ${sale.invoiceNumber || 'INV-' + sale.id.substring(0, 6)}</p>
            <p class="text-white"><strong>Date:</strong> ${saleDate}</p>
            <hr class="border-white">
          </div>
          
          <div class="mb-3">
            <p class="mb-1 text-white"><strong>Customer:</strong> ${sale.buyer?.name || sale.customerName || 'Unknown'}</p>
            ${sale.buyer?.phone || sale.customerPhone ? `<p class="text-white"><strong>Phone:</strong> ${sale.buyer?.phone || sale.customerPhone}</p>` : ''}
          </div>
          
          <div class="table-responsive mb-3">
            <table class="table table-sm table-dark">
              <thead class="bg-primary">
                <tr>
                  <th>Item</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th class="text-center">Qty</th>
                  <th class="text-end">Price</th>
                  <th class="text-end">Total</th>
                </tr>
              </thead>
              <tbody>
      `;
      
      // Add table rows
      sale.items.forEach(item => {
        const itemTotal = item.total || (item.quantity * item.price);
        const dimension = item.dimension || item.size || 'N/A';
        content += `
          <tr>
            <td>${item.description}</td>
            <td>${item.type}</td>
            <td>${dimension}</td>
            <td class="text-center">${item.quantity}</td>
            <td class="text-end">TZsh ${item.price.toFixed(2)}</td>
            <td class="text-end">TZsh ${itemTotal.toFixed(2)}</td>
          </tr>
        `;
      });
      
      // Add subtotal, taxes, and total
      content += `
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" class="text-end"><strong>Subtotal (Net):</strong></td>
                  <td class="text-end">TZsh ${(sale.netAmount || (sale.totalAmount - sale.vatAmount) || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="3" class="text-end"><strong>VAT (${sale.vatRate || 0}%):</strong></td>
                  <td class="text-end">TZsh ${(sale.vatAmount || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="3" class="text-end"><strong>Total:</strong></td>
                  <td class="text-end"><strong>TZsh ${(sale.totalAmount || sale.totalWithVat || 0).toFixed(2)}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
      `;
      
      // Add payment method and notes
      content += `
          <div class="mb-3">
            <p class="text-white"><strong>Payment Method:</strong> ${sale.paymentMethod || 'Cash'}</p>
            ${sale.notes ? `<p class="text-white"><strong>Notes:</strong> ${sale.notes}</p>` : ''}
          </div>
          
          <div class="text-center mt-4 border-top border-white pt-3">
            <p class="text-white mb-1">Thank you for your purchase!</p>
            <p class="text-white">ELIVA HARDWARE - Quality Pipes and Fittings</p>
          </div>
        </div>
      `;
    }
    
    // Add buttons for print options
    content += `
      <div class="print-options mt-4">
        <div class="d-flex justify-content-end">
          <button class="btn btn-primary print-btn">
            <i class="fas fa-print me-2"></i>Print
          </button>
        </div>
      </div>
    `;
    
    // Set content to modal body
    const detailsContent = document.getElementById('sale-details-content');
    if (detailsContent) {
      detailsContent.innerHTML = content;
      
      // Add event listener for print button
      const printBtn = detailsContent.querySelector('.print-btn');
      if (printBtn) {
        printBtn.addEventListener('click', () => {
          // Set the document title to include customer name and invoice number for PDF filename
          const originalTitle = document.title;
          const customerName = sale.buyer?.name || sale.customerName || 'Unknown';
          const invoiceNumber = sale.invoiceNumber || `INV-${sale.id.substring(0, 6)}`;
          
          // Set document title to format the PDF filename
          document.title = `${customerName}_${invoiceNumber}`;
          
          // Print the document
          window.print();
          
          // Restore the original title after printing
          setTimeout(() => {
            document.title = originalTitle;
          }, 1000);
        });
      }
    }
    
    // Show the modal
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
    
  } catch (error) {
    console.error('Error viewing sale details:', error);
    showNotification('Error viewing sale details: ' + error.message, 'error');
  }
}

// Create temporary preview and print
function createTempPreviewAndPrint(sale, isInvoice) {
  if (!sale) {
    showNotification('Sale data not available', 'error');
    return;
  }
  
  // Create and show modal with sale details
  viewSaleDetails(sale.id, isInvoice);
  
  // Show notification about printing after a brief delay
  setTimeout(() => {
    showNotification('Use the Print button to print this document', 'info');
  }, 1500);
}

// Add a debug UI element to show backend status
async function showBackendStatus() {
  if (window.electronAPI && typeof window.electronAPI.invoke === 'function') {
    try {
      const status = await window.electronAPI.invoke('get-database-backend-status');
      let footer = document.getElementById('backend-status-footer');
      if (!footer) {
        footer = document.createElement('div');
        footer.id = 'backend-status-footer';
        footer.style.position = 'fixed';
        footer.style.bottom = '0';
        footer.style.right = '0';
        footer.style.background = 'rgba(0,0,0,0.7)';
        footer.style.color = '#fff';
        footer.style.padding = '4px 12px';
        footer.style.fontSize = '12px';
        footer.style.zIndex = '9999';
        footer.style.borderTopLeftRadius = '8px';
        document.body.appendChild(footer);
      }
      footer.textContent = `Backend: ${status.using} | SQLite Available: ${status.sqliteAvailable ? 'Yes' : 'No'} | DB Initialized: ${status.dbInitialized ? 'Yes' : 'No'}`;
    } catch (e) {
      // Fallback if status cannot be retrieved
    }
  }
}

// Call showBackendStatus on page load
window.addEventListener('DOMContentLoaded', showBackendStatus);

// Add this function to always refresh search and dropdown when modal opens
function resetItemSearchAndDropdown() {
  const searchInput = document.getElementById('item-search');
  if (searchInput) {
    searchInput.value = '';
    itemSearchTerm = '';
  }
  populateItemSelect();
}

// Update setupItemSearchListener to always remove old listeners and add a new one
function setupItemSearchListener() {
  const searchInput = document.getElementById('item-search');
  if (searchInput) {
    // Remove previous listeners
    const newInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newInput, searchInput);
    newInput.addEventListener('input', (e) => {
      itemSearchTerm = e.target.value;
      filterAndPopulateItemSelect();
      updateItemDetails();
    });
  }
}

// When the modal is shown, reset search and dropdown, and re-attach search listener
const newSaleModal = document.getElementById('newSaleModal');
if (newSaleModal) {
  newSaleModal.addEventListener('show.bs.modal', () => {
    resetItemSearchAndDropdown();
    setupItemSearchListener();
    // Hide results box initially
    const resultsBox = document.getElementById('item-search-results');
    if (resultsBox) resultsBox.style.display = 'none';
  });
}

