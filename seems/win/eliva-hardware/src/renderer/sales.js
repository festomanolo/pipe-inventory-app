// Sales management module for Eliva Hardware

// Global variables
let salesData = [];
let inventoryData = [];
let selectedItems = [];
let taxRate = 15; // Default tax rate (%)

// Function to load sales data
function loadSales() {
  // Set up event listeners
  setupSalesEventListeners();
  
  // Load sales data
  fetchSalesData();
  
  // Load inventory data for sales
  fetchInventoryData();
  
  // Get tax rate from settings
  fetchTaxRate();
}

// Set up event listeners for sales page
function setupSalesEventListeners() {
  // New sale button
  const newSaleBtn = document.getElementById('new-sale-btn');
  if (newSaleBtn) {
    newSaleBtn.addEventListener('click', showNewSaleModal);
  }
  
  // Search input
  const searchInput = document.getElementById('sales-search');
  if (searchInput) {
    searchInput.addEventListener('input', filterSales);
  }
  
  // Date filters
  const dateFrom = document.getElementById('sales-date-from');
  const dateTo = document.getElementById('sales-date-to');
  
  if (dateFrom) dateFrom.valueAsDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
  if (dateTo) dateTo.valueAsDate = new Date();
  
  // Apply filters button
  const applyFiltersBtn = document.getElementById('apply-sales-filters');
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', filterSales);
  }
  
  // Reset filters button
  const resetFiltersBtn = document.getElementById('reset-sales-filters');
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', resetFilters);
  }
  
  // Modal close buttons
  const modalCloseButtons = document.querySelectorAll('.modal-close, .modal-cancel');
  modalCloseButtons.forEach(button => {
    button.addEventListener('click', closeModals);
  });
  
  // Add sale item button
  const addSaleItemBtn = document.getElementById('add-sale-item');
  if (addSaleItemBtn) {
    addSaleItemBtn.addEventListener('click', addSaleItemRow);
  }
  
  // Complete sale button
  const completeSaleBtn = document.getElementById('complete-sale-btn');
  if (completeSaleBtn) {
    completeSaleBtn.addEventListener('click', completeSale);
  }
}

// Fetch sales data from the database
function fetchSalesData() {
  const dateFrom = document.getElementById('sales-date-from');
  const dateTo = document.getElementById('sales-date-to');
  
  const filters = {};
  if (dateFrom && dateFrom.value) {
    filters.startDate = new Date(dateFrom.value).toISOString();
  }
  if (dateTo && dateTo.value) {
    // Set to end of day
    const endDate = new Date(dateTo.value);
    endDate.setHours(23, 59, 59, 999);
    filters.endDate = endDate.toISOString();
  }
  
  window.api.getSales(filters)
    .then(sales => {
      salesData = sales;
      renderSalesTable();
    })
    .catch(err => {
      console.error('Error fetching sales data:', err);
      window.appUtils.showToast('error', 'Error', 'Failed to load sales data.');
    });
}

// Fetch inventory data for sales
function fetchInventoryData() {
  window.api.getInventory()
    .then(items => {
      inventoryData = items;
    })
    .catch(err => {
      console.error('Error fetching inventory data:', err);
    });
}

// Fetch tax rate from settings
function fetchTaxRate() {
  // In a real app, this would be fetched from settings in the database
  // For now, we'll use the default value
}

// Render sales table with current data
function renderSalesTable() {
  const tableBody = document.getElementById('sales-table-body');
  if (!tableBody) return;
  
  // Clear existing rows
  tableBody.innerHTML = '';
  
  // Add rows for each sale
  salesData.forEach(sale => {
    const row = document.createElement('tr');
    row.className = 'sale-item';
    
    const saleDate = new Date(sale.sale_date);
    
    row.innerHTML = `
      <td>${sale.invoice_number}</td>
      <td>${window.appUtils.formatDate(saleDate)}</td>
      <td>${sale.buyer_name}</td>
      <td>${sale.buyer_tin || '-'}</td>
      <td>${sale.items ? sale.items.length : 0} items</td>
      <td>${window.appUtils.formatCurrency(sale.total_amount)}</td>
      <td class="actions-cell">
        <button class="btn-icon view-sale" data-id="${sale.id}">
          <i class="fas fa-eye"></i>
        </button>
        <button class="btn-icon print-sale" data-id="${sale.id}">
          <i class="fas fa-print"></i>
        </button>
      </td>
    `;
    
    tableBody.appendChild(row);
    
    // Add event listeners to the buttons
    const viewButton = row.querySelector('.view-sale');
    const printButton = row.querySelector('.print-sale');
    
    viewButton.addEventListener('click', () => viewSale(sale.id));
    printButton.addEventListener('click', () => printSaleInvoice(sale.id));
  });
  
  // Add empty state if no sales
  if (salesData.length === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = `
      <td colspan="7" class="empty-state">
        <div class="empty-state-content">
          <i class="fas fa-shopping-cart"></i>
          <p>No sales records found</p>
          <button class="btn primary" id="empty-new-sale">Create Your First Sale</button>
        </div>
      </td>
    `;
    tableBody.appendChild(emptyRow);
    
    // Add event listener to the empty state button
    const emptyNewSaleButton = emptyRow.querySelector('#empty-new-sale');
    if (emptyNewSaleButton) {
      emptyNewSaleButton.addEventListener('click', showNewSaleModal);
    }
  }
}

// Filter sales based on search and filters
function filterSales() {
  const searchInput = document.getElementById('sales-search');
  const dateFrom = document.getElementById('sales-date-from');
  const dateTo = document.getElementById('sales-date-to');
  const buyerFilter = document.getElementById('filter-buyer');
  
  const filters = {};
  
  if (searchInput && searchInput.value) {
    filters.invoiceNumber = searchInput.value;
  }
  
  if (dateFrom && dateFrom.value) {
    filters.startDate = new Date(dateFrom.value).toISOString();
  }
  
  if (dateTo && dateTo.value) {
    // Set to end of day
    const endDate = new Date(dateTo.value);
    endDate.setHours(23, 59, 59, 999);
    filters.endDate = endDate.toISOString();
  }
  
  if (buyerFilter && buyerFilter.value) {
    filters.buyerName = buyerFilter.value;
  }
  
  window.api.getSales(filters)
    .then(sales => {
      salesData = sales;
      renderSalesTable();
    })
    .catch(err => {
      console.error('Error fetching filtered sales data:', err);
      window.appUtils.showToast('error', 'Error', 'Failed to filter sales data.');
    });
}

// Reset filters
function resetFilters() {
  const searchInput = document.getElementById('sales-search');
  const dateFrom = document.getElementById('sales-date-from');
  const dateTo = document.getElementById('sales-date-to');
  const buyerFilter = document.getElementById('filter-buyer');
  
  if (searchInput) searchInput.value = '';
  if (dateFrom) dateFrom.valueAsDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
  if (dateTo) dateTo.valueAsDate = new Date();
  if (buyerFilter) buyerFilter.value = '';
  
  fetchSalesData();
}

// Show new sale modal
function showNewSaleModal() {
  const modal = document.getElementById('new-sale-modal');
  if (!modal) return;
  
  // Reset form
  const form = document.getElementById('new-sale-form');
  if (form) form.reset();
  
  // Clear selected items
  selectedItems = [];
  
  // Clear sale items table
  const saleItemsBody = document.getElementById('sale-items-body');
  if (saleItemsBody) saleItemsBody.innerHTML = '';
  
  // Reset totals
  updateSaleTotals();
  
  // Show modal
  modal.style.display = 'block';
}

// Close all modals
function closeModals() {
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    modal.style.display = 'none';
  });
}

// Add a new item row to the sale
function addSaleItemRow() {
  const saleItemsBody = document.getElementById('sale-items-body');
  if (!saleItemsBody) return;
  
  // Create new row
  const row = document.createElement('tr');
  row.className = 'sale-item-row';
  
  // Create item selection dropdown
  const itemOptions = inventoryData
    .filter(item => item.quantity > 0) // Only show items with stock
    .map(item => `<option value="${item.id}" data-price="${item.selling_price}" data-max="${item.quantity}">${item.name} (${item.diameter ? item.diameter + '"' : ''} ${item.type})</option>`)
    .join('');
  
  row.innerHTML = `
    <td>
      <select class="sale-item-select">
        <option value="">Select an item</option>
        ${itemOptions}
      </select>
    </td>
    <td>
      <input type="number" class="sale-item-quantity" min="1" value="1">
    </td>
    <td>
      <input type="number" class="sale-item-price" step="0.01" min="0" value="0.00" readonly>
    </td>
    <td class="sale-item-total">$0.00</td>
    <td>
      <button class="btn-icon remove-sale-item">
        <i class="fas fa-times"></i>
      </button>
    </td>
  `;
  
  saleItemsBody.appendChild(row);
  
  // Add event listeners
  const itemSelect = row.querySelector('.sale-item-select');
  const quantityInput = row.querySelector('.sale-item-quantity');
  const priceInput = row.querySelector('.sale-item-price');
  const removeButton = row.querySelector('.remove-sale-item');
  
  // Item selection change
  itemSelect.addEventListener('change', () => {
    const selectedOption = itemSelect.options[itemSelect.selectedIndex];
    const price = selectedOption.getAttribute('data-price');
    const maxQuantity = selectedOption.getAttribute('data-max');
    
    priceInput.value = price || 0;
    quantityInput.max = maxQuantity || 1;
    
    // If quantity is more than max, adjust it
    if (parseInt(quantityInput.value) > parseInt(maxQuantity)) {
      quantityInput.value = maxQuantity;
    }
    
    updateRowTotal(row);
    updateSaleTotals();
  });
  
  // Quantity change
  quantityInput.addEventListener('input', () => {
    const selectedOption = itemSelect.options[itemSelect.selectedIndex];
    const maxQuantity = selectedOption.getAttribute('data-max');
    
    // Validate quantity
    if (parseInt(quantityInput.value) > parseInt(maxQuantity)) {
      quantityInput.value = maxQuantity;
      window.appUtils.showToast('warning', 'Quantity Adjusted', 'Quantity cannot exceed available stock.');
    }
    
    updateRowTotal(row);
    updateSaleTotals();
  });
  
  // Remove item
  removeButton.addEventListener('click', () => {
    row.remove();
    updateSaleTotals();
  });
}

// Update the total for a single row
function updateRowTotal(row) {
  const quantityInput = row.querySelector('.sale-item-quantity');
  const priceInput = row.querySelector('.sale-item-price');
  const totalCell = row.querySelector('.sale-item-total');
  
  const quantity = parseInt(quantityInput.value) || 0;
  const price = parseFloat(priceInput.value) || 0;
  const total = quantity * price;
  
  totalCell.textContent = window.appUtils.formatCurrency(total);
}

// Update sale totals
function updateSaleTotals() {
  const rows = document.querySelectorAll('.sale-item-row');
  let subtotal = 0;
  
  rows.forEach(row => {
    const quantityInput = row.querySelector('.sale-item-quantity');
    const priceInput = row.querySelector('.sale-item-price');
    
    const quantity = parseInt(quantityInput.value) || 0;
    const price = parseFloat(priceInput.value) || 0;
    
    subtotal += quantity * price;
  });
  
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;
  
  // Update display
  const subtotalEl = document.getElementById('sale-subtotal');
  const taxEl = document.getElementById('sale-tax');
  const totalEl = document.getElementById('sale-total');
  
  if (subtotalEl) subtotalEl.textContent = window.appUtils.formatCurrency(subtotal);
  if (taxEl) taxEl.textContent = window.appUtils.formatCurrency(tax);
  if (totalEl) totalEl.textContent = window.appUtils.formatCurrency(total);
}

// Complete sale
function completeSale() {
  const form = document.getElementById('new-sale-form');
  if (!form) return;
  
  // Check buyer info
  const buyerName = form.elements['buyer_name'].value;
  if (!buyerName) {
    window.appUtils.showToast('error', 'Validation Error', 'Please enter buyer name.');
    return;
  }
  
  // Check if there are items
  const rows = document.querySelectorAll('.sale-item-row');
  if (rows.length === 0) {
    window.appUtils.showToast('error', 'Validation Error', 'Please add at least one item to the sale.');
    return;
  }
  
  // Collect sale items
  const items = [];
  let isValid = true;
  
  rows.forEach(row => {
    const itemSelect = row.querySelector('.sale-item-select');
    const quantityInput = row.querySelector('.sale-item-quantity');
    const priceInput = row.querySelector('.sale-item-price');
    
    const itemId = parseInt(itemSelect.value);
    const quantity = parseInt(quantityInput.value);
    const unitPrice = parseFloat(priceInput.value);
    
    if (!itemId || !quantity || !unitPrice) {
      isValid = false;
      return;
    }
    
    items.push({
      id: itemId,
      quantity: quantity,
      unit_price: unitPrice
    });
  });
  
  if (!isValid) {
    window.appUtils.showToast('error', 'Validation Error', 'Please check all items have valid selections and quantities.');
    return;
  }
  
  // Create sale data
  const saleData = {
    buyer_name: form.elements['buyer_name'].value,
    buyer_title: form.elements['buyer_title'].value,
    buyer_tin: form.elements['buyer_tin'].value,
    payment_method: form.elements['payment_method'].value,
    items: items
  };
  
  // Save to database
  window.api.createSale(saleData)
    .then(sale => {
      // Close modal
      closeModals();
      
      // Refresh sales data
      fetchSalesData();
      
      // Refresh inventory data
      fetchInventoryData();
      
      // Show success message
      window.appUtils.showToast('success', 'Sale Completed', `Sale #${sale.invoice_number} has been created.`);
      
      // Show print option
      if (confirm('Sale completed successfully. Do you want to print the invoice?')) {
        printSaleInvoice(sale.id);
      }
    })
    .catch(err => {
      console.error('Error creating sale:', err);
      window.appUtils.showToast('error', 'Error', 'Failed to complete the sale.');
    });
}

// View sale details
function viewSale(saleId) {
  // Find the sale
  const sale = salesData.find(s => s.id === saleId);
  if (!sale) return;
  
  // Create or update view sale modal
  let viewModal = document.getElementById('view-sale-modal');
  if (!viewModal) {
    viewModal = document.createElement('div');
    viewModal.id = 'view-sale-modal';
    viewModal.className = 'modal';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    modalContent.innerHTML = `
      <div class="modal-header">
        <h2>Sale Details</h2>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="sale-details">
          <div class="sale-header">
            <div class="sale-info">
              <h3>Invoice #<span id="view-invoice-number"></span></h3>
              <p>Date: <span id="view-sale-date"></span></p>
            </div>
            <div class="buyer-info">
              <h4>Buyer Information</h4>
              <p>Name: <span id="view-buyer-name"></span></p>
              <p>Title: <span id="view-buyer-title"></span></p>
              <p>TIN: <span id="view-buyer-tin"></span></p>
            </div>
          </div>
          
          <div class="sale-items">
            <h4>Items</h4>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody id="view-sale-items">
                <!-- Sale items will be added dynamically -->
              </tbody>
            </table>
          </div>
          
          <div class="sale-summary">
            <div class="summary-row">
              <span>Subtotal:</span>
              <span id="view-subtotal"></span>
            </div>
            <div class="summary-row">
              <span>Tax:</span>
              <span id="view-tax"></span>
            </div>
            <div class="summary-row total">
              <span>Total:</span>
              <span id="view-total"></span>
            </div>
            <div class="summary-row">
              <span>Payment Method:</span>
              <span id="view-payment-method"></span>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn outline modal-cancel">Close</button>
        <button class="btn primary" id="print-viewed-sale">Print Invoice</button>
      </div>
    `;
    
    viewModal.appendChild(modalContent);
    document.body.appendChild(viewModal);
    
    // Add event listeners
    const closeButtons = viewModal.querySelectorAll('.modal-close, .modal-cancel');
    closeButtons.forEach(button => {
      button.addEventListener('click', closeModals);
    });
    
    const printButton = viewModal.querySelector('#print-viewed-sale');
    if (printButton) {
      printButton.addEventListener('click', () => printSaleInvoice(saleId));
    }
  }
  
  // Fill in sale details
  document.getElementById('view-invoice-number').textContent = sale.invoice_number;
  document.getElementById('view-sale-date').textContent = window.appUtils.formatDateTime(sale.sale_date);
  document.getElementById('view-buyer-name').textContent = sale.buyer_name;
  document.getElementById('view-buyer-title').textContent = sale.buyer_title || '-';
  document.getElementById('view-buyer-tin').textContent = sale.buyer_tin || '-';
  document.getElementById('view-payment-method').textContent = sale.payment_method;
  
  // Calculate totals
  let subtotal = 0;
  
  // Fill in items
  const itemsContainer = document.getElementById('view-sale-items');
  itemsContainer.innerHTML = '';
  
  sale.items.forEach(item => {
    const row = document.createElement('tr');
    const total = item.quantity * item.unit_price;
    subtotal += total;
    
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.quantity}</td>
      <td>${window.appUtils.formatCurrency(item.unit_price)}</td>
      <td>${window.appUtils.formatCurrency(total)}</td>
    `;
    
    itemsContainer.appendChild(row);
  });
  
  // Calculate tax and total
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;
  
  // Update summary
  document.getElementById('view-subtotal').textContent = window.appUtils.formatCurrency(subtotal);
  document.getElementById('view-tax').textContent = window.appUtils.formatCurrency(tax);
  document.getElementById('view-total').textContent = window.appUtils.formatCurrency(total);
  
  // Show modal
  viewModal.style.display = 'block';
}

// Print sale invoice
function printSaleInvoice(saleId) {
  // Find the sale
  const sale = salesData.find(s => s.id === saleId);
  if (!sale) return;
  
  // In a real app, this would generate a PDF using jsPDF
  // For now, we'll just show a message
  window.appUtils.showToast('info', 'Print Invoice', `Printing invoice for sale #${sale.invoice_number}...`);
  
  // Example of how to generate a PDF (not fully implemented)
  /*
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // Add company header
  doc.setFontSize(22);
  doc.text('Eliva Hardware', 105, 20, { align: 'center' });
  
  // Add invoice details
  doc.setFontSize(16);
  doc.text(`INVOICE #${sale.invoice_number}`, 105, 30, { align: 'center' });
  
  // Add date
  doc.setFontSize(10);
  doc.text(`Date: ${window.appUtils.formatDate(sale.sale_date)}`, 20, 40);
  
  // Add buyer info
  doc.text('Sold To:', 20, 50);
  doc.text(`${sale.buyer_name}`, 20, 55);
  if (sale.buyer_title) doc.text(`${sale.buyer_title}`, 20, 60);
  if (sale.buyer_tin) doc.text(`TIN: ${sale.buyer_tin}`, 20, 65);
  
  // Add items table
  doc.setFontSize(12);
  doc.text('Item', 20, 80);
  doc.text('Qty', 100, 80);
  doc.text('Price', 130, 80);
  doc.text('Total', 170, 80);
  
  doc.line(20, 82, 190, 82);
  
  let y = 90;
  let subtotal = 0;
  
  sale.items.forEach(item => {
    const total = item.quantity * item.unit_price;
    subtotal += total;
    
    doc.text(item.name, 20, y);
    doc.text(item.quantity.toString(), 100, y);
    doc.text(window.appUtils.formatCurrency(item.unit_price), 130, y);
    doc.text(window.appUtils.formatCurrency(total), 170, y);
    
    y += 10;
  });
  
  // Add totals
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;
  
  doc.line(20, y, 190, y);
  y += 10;
  
  doc.text('Subtotal:', 130, y);
  doc.text(window.appUtils.formatCurrency(subtotal), 170, y);
  y += 10;
  
  doc.text('Tax:', 130, y);
  doc.text(window.appUtils.formatCurrency(tax), 170, y);
  y += 10;
  
  doc.setFontSize(14);
  doc.text('Total:', 130, y);
  doc.text(window.appUtils.formatCurrency(total), 170, y);
  
  // Save or print the PDF
  doc.save(`invoice-${sale.invoice_number}.pdf`);
  */
}

// Export the loadSales function
window.loadSales = loadSales; 