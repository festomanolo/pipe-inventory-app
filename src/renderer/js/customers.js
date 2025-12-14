/**
 * Customers Management Module
 * Handles all customer-related functionality including listing, adding, editing, and deleting
 */

// Global variables
let customersData = [];
let currentPage = 1;
let itemsPerPage = 10;
let filteredCustomers = [];
let selectedCustomerId = null;

// Initialize the customers module
window.initializeCustomers = function() {
  console.log('Initializing customers module...');
  
  // Set up event listeners
  setupEventListeners();
  
  // Load customers data
  loadCustomersData();
};

// Set up event listeners for the customer page
function setupEventListeners() {
  // Search and filter
  document.getElementById('search-customer').addEventListener('input', filterCustomers);
  document.getElementById('filter-type').addEventListener('change', filterCustomers);
  document.getElementById('refresh-btn').addEventListener('click', refreshCustomersData);
  
  // Add customer form
  const addCustomerForm = document.getElementById('add-customer-form');
  if (addCustomerForm) {
    addCustomerForm.addEventListener('submit', handleAddCustomer);
  }
  
  // Edit customer form
  const editCustomerForm = document.getElementById('edit-customer-form');
  if (editCustomerForm) {
    editCustomerForm.addEventListener('submit', handleUpdateCustomer);
  }
  
  // Edit customer button in details modal
  const editCustomerBtn = document.getElementById('edit-customer-btn');
  if (editCustomerBtn) {
    editCustomerBtn.addEventListener('click', function() {
      // Close details modal and open edit modal
      const customerDetailsModal = bootstrap.Modal.getInstance(document.getElementById('customerDetailsModal'));
      customerDetailsModal.hide();
      
      // Populate and show edit modal
      populateEditForm(selectedCustomerId);
      const editCustomerModal = new bootstrap.Modal(document.getElementById('editCustomerModal'));
      editCustomerModal.show();
    });
  }
  
  // Delete confirmation
  const confirmDeleteBtn = document.getElementById('confirm-delete');
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', handleDeleteCustomer);
  }
  
  // Listen for customer-stats-updated event from main process
  if (window.electronAPI && typeof window.electronAPI.onCustomerStatsUpdated === 'function') {
    console.log('Setting up listener for customer-stats-updated events');
    window.electronAPI.onCustomerStatsUpdated((data) => {
      console.log('Received customer-stats-updated event:', data);
      
      // If the customer details modal is currently showing this customer, refresh it
      if (selectedCustomerId === data.customerId) {
        console.log('Currently viewing this customer, refreshing details...');
        showCustomerDetails(data.customerId);
      }
      
      // Also refresh the customers list to show updated data
      refreshCustomersData();
    });
  }
}

// Load customers data from the database
async function loadCustomersData() {
  try {
    // Show loading state
    const customersContainer = document.getElementById('customers-container');
    customersContainer.innerHTML = `
      <div class="text-center p-5">
        <div class="loader"></div>
        <p class="mt-3">Loading customers...</p>
      </div>
    `;
    
    // Get customers from database
    if (window.electronAPI && typeof window.electronAPI.getCustomers === 'function') {
      customersData = await window.electronAPI.getCustomers();
    } else {
      console.error('getCustomers function not available');
      customersData = [];
    }
    
    // Reset filter
    filteredCustomers = [...customersData];
    
    // Update customer count
    updateCustomerCount(filteredCustomers.length);
    
    // Render customers
    renderCustomers(filteredCustomers);
  } catch (error) {
    console.error('Error loading customers data:', error);
    
    // Show error message
    const customersContainer = document.getElementById('customers-container');
    customersContainer.innerHTML = `
      <div class="alert alert-danger m-3">
        <i class="fas fa-exclamation-triangle me-2"></i>
        <strong>Error loading customers:</strong> ${error.message || 'Unknown error'}
      </div>
    `;
  }
}

// Render customers to the UI
function renderCustomers(customers) {
  const customersContainer = document.getElementById('customers-container');
  
  // Handle empty state
  if (!customers || customers.length === 0) {
    customersContainer.innerHTML = `
      <div class="text-center p-5">
        <i class="fas fa-users fa-3x mb-3 text-secondary"></i>
        <h4>No Customers Found</h4>
        <p class="text-secondary">Add your first customer by clicking the "Add New Customer" button.</p>
      </div>
    `;
    
    // Hide pagination
    document.getElementById('customer-pagination').innerHTML = '';
    return;
  }
  
  // Calculate pagination
  const totalPages = Math.ceil(customers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, customers.length);
  const currentCustomers = customers.slice(startIndex, endIndex);
  
  // Generate customer cards
  let customersHTML = '';
  
  currentCustomers.forEach(customer => {
    // Generate initials for avatar
    const nameParts = (customer.name || '').split(' ');
    const initials = nameParts.length > 1 
      ? (nameParts[0][0] + nameParts[1][0]).toUpperCase()
      : (nameParts[0] ? nameParts[0][0].toUpperCase() : '?');
    
    // Generate badge based on customer type
    const badgeClass = customer.type === 'premium' ? 'badge-premium' : 'badge-regular';
    const badgeText = customer.type === 'premium' ? 'Premium' : 'Regular';
    
    customersHTML += `
      <div class="card customer-card mb-3" data-customer-id="${customer.id}">
        <div class="card-body d-flex align-items-center">
          <div class="customer-avatar">
            ${initials}
          </div>
          <div class="customer-info">
            <div class="d-flex align-items-center">
              <h5 class="customer-name mb-0">${customer.name || 'Unknown'}</h5>
              <span class="customer-badge ${badgeClass} ms-2">${badgeText}</span>
            </div>
            <p class="customer-business mb-1">${customer.business || 'No business'}</p>
            <p class="customer-contact">
              <i class="fas fa-phone-alt me-1"></i> ${customer.phone || 'No phone'}
              ${customer.email ? `<span class="ms-3"><i class="fas fa-envelope me-1"></i> ${customer.email}</span>` : ''}
            </p>
          </div>
          <div class="customer-actions">
            <button class="btn btn-sm btn-outline-primary view-customer" data-customer-id="${customer.id}">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-sm btn-outline-secondary edit-customer" data-customer-id="${customer.id}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger delete-customer" data-customer-id="${customer.id}">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  });
  
  customersContainer.innerHTML = customersHTML;
  
  // Generate pagination
  generatePagination(totalPages);
  
  // Add event listeners to the customer cards
  addCustomerCardEventListeners();
}

// Add event listeners to customer cards
function addCustomerCardEventListeners() {
  // View customer
  document.querySelectorAll('.view-customer').forEach(button => {
    button.addEventListener('click', async (event) => {
      const customerId = event.currentTarget.getAttribute('data-customer-id');
      await showCustomerDetails(customerId);
    });
  });
  
  // Edit customer
  document.querySelectorAll('.edit-customer').forEach(button => {
    button.addEventListener('click', (event) => {
      const customerId = event.currentTarget.getAttribute('data-customer-id');
      populateEditForm(customerId);
      const editCustomerModal = new bootstrap.Modal(document.getElementById('editCustomerModal'));
      editCustomerModal.show();
    });
  });
  
  // Delete customer
  document.querySelectorAll('.delete-customer').forEach(button => {
    button.addEventListener('click', (event) => {
      const customerId = event.currentTarget.getAttribute('data-customer-id');
      const customerName = getCustomerName(customerId);
      
      // Set the customer ID and name in the delete modal
      document.getElementById('delete-customer-id').value = customerId;
      document.getElementById('delete-customer-name').textContent = customerName;
      
      // Show the delete modal
      const deleteCustomerModal = new bootstrap.Modal(document.getElementById('deleteCustomerModal'));
      deleteCustomerModal.show();
    });
  });
}

// Generate pagination controls
function generatePagination(totalPages) {
  const paginationContainer = document.getElementById('customer-pagination');
  
  if (totalPages <= 1) {
    paginationContainer.innerHTML = '';
    return;
  }
  
  let paginationHTML = `
    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" data-page="${currentPage - 1}" aria-label="Previous">
        <span aria-hidden="true">&laquo;</span>
      </a>
    </li>
  `;
  
  const maxPageLinks = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxPageLinks / 2));
  let endPage = Math.min(totalPages, startPage + maxPageLinks - 1);
  
  if (endPage - startPage + 1 < maxPageLinks) {
    startPage = Math.max(1, endPage - maxPageLinks + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    paginationHTML += `
      <li class="page-item ${currentPage === i ? 'active' : ''}">
        <a class="page-link" href="#" data-page="${i}">${i}</a>
      </li>
    `;
  }
  
  paginationHTML += `
    <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
      <a class="page-link" href="#" data-page="${currentPage + 1}" aria-label="Next">
        <span aria-hidden="true">&raquo;</span>
      </a>
    </li>
  `;
  
  paginationContainer.innerHTML = paginationHTML;
  
  // Add event listeners to pagination links
  document.querySelectorAll('#customer-pagination .page-link').forEach(link => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const page = parseInt(event.currentTarget.getAttribute('data-page'));
      
      if (page && page !== currentPage && page >= 1 && page <= totalPages) {
        currentPage = page;
        renderCustomers(filteredCustomers);
        
        // Scroll to top of customers container
        document.getElementById('customers-container').scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

// Filter customers based on search and filter criteria
function filterCustomers() {
  const searchTerm = document.getElementById('search-customer').value.toLowerCase();
  const filterType = document.getElementById('filter-type').value;
  
  // Reset to first page when filtering
  currentPage = 1;
  
  // Apply filters
  filteredCustomers = customersData.filter(customer => {
    // Filter by type
    if (filterType && customer.type !== filterType && filterType !== '') {
      return false;
    }
    
    // Filter by search term
    if (searchTerm) {
      const name = (customer.name || '').toLowerCase();
      const business = (customer.business || '').toLowerCase();
      const phone = (customer.phone || '').toLowerCase();
      const email = (customer.email || '').toLowerCase();
      
      return (
        name.includes(searchTerm) ||
        business.includes(searchTerm) ||
        phone.includes(searchTerm) ||
        email.includes(searchTerm)
      );
    }
    
    return true;
  });
  
  // Update customer count
  updateCustomerCount(filteredCustomers.length);
  
  // Render filtered customers
  renderCustomers(filteredCustomers);
}

// Update the customer count display
function updateCustomerCount(count) {
  const countElement = document.getElementById('customer-count');
  countElement.textContent = `${count} customer${count !== 1 ? 's' : ''}`;
}

// Handle adding a new customer
async function handleAddCustomer(event) {
  event.preventDefault();
  
  try {
    // Get form data
    const customerData = {
      id: 'cust-' + Date.now(),
      name: document.getElementById('customer-name').value.trim(),
      business: document.getElementById('customer-business').value.trim(),
      email: document.getElementById('customer-email').value.trim(),
      phone: document.getElementById('customer-phone').value.trim(),
      address: document.getElementById('customer-address').value.trim(),
      tin: document.getElementById('customer-tin').value.trim(),
      type: document.getElementById('customer-type').value,
      notes: document.getElementById('customer-notes').value.trim(),
      totalPurchases: 0,
      purchaseCount: 0,
      createdAt: new Date().toISOString(), // Add timestamp
      lastUpdated: new Date().toISOString()
    };
    
    // Validate required fields
    if (!customerData.name) {
      throw new Error('Customer name is required');
    }
    
    if (!customerData.phone) {
      throw new Error('Phone number is required');
    }
    
    // Add customer to database
    if (window.electronAPI && typeof window.electronAPI.addCustomer === 'function') {
      const result = await window.electronAPI.addCustomer(customerData);
      
      if (result) {
        // Add to local data arrays
        customersData.push(customerData);
        filteredCustomers.push(customerData);
        
        // Update UI
        updateCustomerCount(customersData.length);
        renderCustomers(filteredCustomers);
        
        // Close the modal
        const addCustomerModal = bootstrap.Modal.getInstance(document.getElementById('addCustomerModal'));
        addCustomerModal.hide();
        
        // Reset the form
        document.getElementById('add-customer-form').reset();
        
        // Show notification
        if (window.NotificationSystem) {
          window.NotificationSystem.show(`Customer ${customerData.name} added successfully`, { 
            type: 'success',
            title: 'Customer Added'
          });
        }
      } else {
        throw new Error('Failed to add customer to database');
      }
    } else {
      throw new Error('addCustomer function not available');
    }
  } catch (error) {
    console.error('Error adding customer:', error);
    
    // Show error notification
    if (window.NotificationSystem) {
      window.NotificationSystem.show(`Error adding customer: ${error.message}`, { 
        type: 'error',
        title: 'Error'
      });
    }
  }
}

// Populate the edit form with customer data
function populateEditForm(customerId) {
  const customer = customersData.find(c => c.id === customerId);
  
  if (!customer) {
    console.error(`Customer with ID ${customerId} not found`);
    return;
  }
  
  // Set form values
  document.getElementById('edit-customer-id').value = customer.id;
  document.getElementById('edit-customer-name').value = customer.name || '';
  document.getElementById('edit-customer-business').value = customer.business || '';
  document.getElementById('edit-customer-email').value = customer.email || '';
  document.getElementById('edit-customer-phone').value = customer.phone || '';
  document.getElementById('edit-customer-address').value = customer.address || '';
  document.getElementById('edit-customer-tin').value = customer.tin || '';
  document.getElementById('edit-customer-type').value = customer.type || 'regular';
  document.getElementById('edit-customer-notes').value = customer.notes || '';
}

// Handle updating a customer
async function handleUpdateCustomer(event) {
  event.preventDefault();
  
  try {
    const customerId = document.getElementById('edit-customer-id').value;
    
    // Find the existing customer in the data
    const existingCustomerIndex = customersData.findIndex(c => c.id === customerId);
    if (existingCustomerIndex === -1) {
      throw new Error(`Customer with ID ${customerId} not found`);
    }
    
    // Get original customer to preserve data not in the form
    const originalCustomer = customersData[existingCustomerIndex];
    
    // Get form data
    const customerData = {
      id: customerId,
      name: document.getElementById('edit-customer-name').value.trim(),
      business: document.getElementById('edit-customer-business').value.trim(),
      email: document.getElementById('edit-customer-email').value.trim(),
      phone: document.getElementById('edit-customer-phone').value.trim(),
      address: document.getElementById('edit-customer-address').value.trim(),
      tin: document.getElementById('edit-customer-tin').value.trim(),
      type: document.getElementById('edit-customer-type').value,
      notes: document.getElementById('edit-customer-notes').value.trim(),
      // Preserve other data
      totalPurchases: originalCustomer.totalPurchases || 0,
      purchaseCount: originalCustomer.purchaseCount || 0,
      createdAt: originalCustomer.createdAt || new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
    
    // Validate required fields
    if (!customerData.name) {
      throw new Error('Customer name is required');
    }
    
    if (!customerData.phone) {
      throw new Error('Phone number is required');
    }
    
    // Update customer in database
    if (window.electronAPI && typeof window.electronAPI.updateCustomer === 'function') {
      const result = await window.electronAPI.updateCustomer(customerData);
      
      if (result) {
        // Update in local data arrays
        customersData[existingCustomerIndex] = customerData;
        
        // Update filtered array if needed
        const filteredIndex = filteredCustomers.findIndex(c => c.id === customerId);
        if (filteredIndex !== -1) {
          filteredCustomers[filteredIndex] = customerData;
        }
        
        // Update UI
        renderCustomers(filteredCustomers);
        
        // Close the modal
        const editCustomerModal = bootstrap.Modal.getInstance(document.getElementById('editCustomerModal'));
        editCustomerModal.hide();
        
        // Show notification
        if (window.NotificationSystem) {
          window.NotificationSystem.show(`Customer ${customerData.name} updated successfully`, { 
            type: 'success',
            title: 'Customer Updated'
          });
        }
      } else {
        throw new Error('Failed to update customer in database');
      }
    } else {
      throw new Error('updateCustomer function not available');
    }
  } catch (error) {
    console.error('Error updating customer:', error);
    
    // Show error notification
    if (window.NotificationSystem) {
      window.NotificationSystem.show(`Error updating customer: ${error.message}`, { 
        type: 'error',
        title: 'Error'
      });
    }
  }
}

// Show customer details in modal
async function showCustomerDetails(customerId) {
  try {
    selectedCustomerId = customerId;
    
    // Show loading state
    const customerDetailsContent = document.getElementById('customer-details-content');
    customerDetailsContent.innerHTML = `
      <div class="text-center p-5">
        <div class="loader"></div>
        <p class="mt-3">Loading customer details...</p>
      </div>
    `;
    
    // Show the modal
    const customerDetailsModal = new bootstrap.Modal(document.getElementById('customerDetailsModal'));
    customerDetailsModal.show();
    
    // Get customer from database
    let customer = null;
    if (window.electronAPI && typeof window.electronAPI.getCustomerById === 'function') {
      customer = await window.electronAPI.getCustomerById(customerId);
      console.log('Customer data received:', customer);
      
      // Ensure purchase stats are initialized if they're missing
      if (customer.totalPurchases === undefined || customer.totalPurchases === null) {
        customer.totalPurchases = 0;
      }
      
      if (customer.purchaseCount === undefined || customer.purchaseCount === null) {
        customer.purchaseCount = 0;
      }
    } else {
      customer = customersData.find(c => c.id === customerId);
    }
    
    if (!customer) {
      throw new Error(`Customer with ID ${customerId} not found`);
    }
    
    // Generate initials for avatar
    const nameParts = (customer.name || '').split(' ');
    const initials = nameParts.length > 1 
      ? (nameParts[0][0] + nameParts[1][0]).toUpperCase()
      : (nameParts[0] ? nameParts[0][0].toUpperCase() : '?');
    
    // Format dates
    const lastPurchaseDate = customer.lastPurchaseDate 
      ? new Date(customer.lastPurchaseDate).toLocaleDateString() 
      : 'Never';
    
    const joinedDate = customer.createdAt 
      ? new Date(customer.createdAt).toLocaleDateString() 
      : 'Unknown';
    
    // Generate badge based on customer type
    const badgeClass = customer.type === 'premium' ? 'badge-premium' : 'badge-regular';
    const badgeText = customer.type === 'premium' ? 'Premium' : 'Regular';
    
    // Determine customer status based on purchase history
    let customerStatus = 'Inactive';
    let statusColor = 'text-danger';
    
    if (customer.purchaseCount > 10) {
      customerStatus = 'Loyal';
      statusColor = 'text-success';
    } else if (customer.purchaseCount > 5) {
      customerStatus = 'Regular';
      statusColor = 'text-primary';
    } else if (customer.purchaseCount > 0) {
      customerStatus = 'Active';
      statusColor = 'text-info';
    }
    
    // Generate purchase history HTML if available
    let purchaseHistoryHTML = '';
    let mostPurchasedItemsHTML = '';
    let totalItemsPurchased = 0;
    
    if (customer.purchaseHistory && customer.purchaseHistory.length > 0) {
      // Count total items purchased
      let totalItemsMap = {};
      
      customer.purchaseHistory.forEach(purchase => {
        purchase.items.forEach(item => {
          totalItemsPurchased += item.quantity;
          
          // Track individual items for most purchased
          const itemKey = item.productName;
          if (!totalItemsMap[itemKey]) {
            totalItemsMap[itemKey] = {
              name: item.productName, 
              quantity: 0,
              totalSpent: 0
            };
          }
          totalItemsMap[itemKey].quantity += item.quantity;
          totalItemsMap[itemKey].totalSpent += item.totalPrice;
        });
      });
      
      // Create purchase history table
      purchaseHistoryHTML = `
        <div class="table-responsive">
          <table class="table table-striped table-hover">
            <thead class="table-primary">
              <tr>
                <th>Date</th>
                <th>Invoice #</th>
                <th>Items</th>
                <th>Total Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      // Add rows for each purchase
      customer.purchaseHistory.forEach(purchase => {
        // Format purchase date
        const purchaseDate = new Date(purchase.date).toLocaleDateString();
        
        // Create item summary
        const itemSummary = purchase.items.map(item => 
          `${item.quantity} × ${item.productName}`
        ).join('<br>');
        
        // Status badge
        const statusBadge = purchase.status === 'completed' 
          ? '<span class="badge bg-success">Completed</span>' 
          : '<span class="badge bg-secondary">' + purchase.status + '</span>';
        
        purchaseHistoryHTML += `
          <tr class="purchase-row" data-purchase-id="${purchase.id}">
            <td>${purchaseDate}</td>
            <td>${purchase.invoiceNumber || 'N/A'}</td>
            <td>${itemSummary}</td>
            <td>${formatCurrency(purchase.totalAmount)}</td>
            <td>${statusBadge}</td>
          </tr>
        `;
      });
      
      purchaseHistoryHTML += `
            </tbody>
          </table>
        </div>
      `;
      
      // Generate most purchased items section
      const topPurchasedItems = Object.values(totalItemsMap).sort((a, b) => b.quantity - a.quantity);
      
      if (topPurchasedItems.length > 0) {
        mostPurchasedItemsHTML = `
          <div class="mt-4">
            <h5 class="border-bottom pb-2 mb-3"><i class="fas fa-star me-2"></i>Most Purchased Items</h5>
            <div class="table-responsive">
              <table class="table table-sm">
                <thead class="table-secondary">
                  <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Total Spent</th>
                  </tr>
                </thead>
                <tbody>
        `;
        
        // Add top 5 most purchased items
        topPurchasedItems.slice(0, 5).forEach(item => {
          mostPurchasedItemsHTML += `
            <tr>
              <td>${item.name}</td>
              <td>${item.quantity}</td>
              <td>${formatCurrency(item.totalSpent)}</td>
            </tr>
          `;
        });
        
        mostPurchasedItemsHTML += `
                </tbody>
              </table>
            </div>
          </div>
        `;
      }
    } else {
      purchaseHistoryHTML = `
        <div class="text-center p-5">
          <i class="fas fa-shopping-cart fa-3x mb-3 text-secondary"></i>
          <h5 class="text-secondary">No Purchase History</h5>
          <p class="text-muted">This customer hasn't made any purchases yet.</p>
        </div>
      `;
    }

    // Generate HTML for customer details with tabs
    customerDetailsContent.innerHTML = `
      <div class="customer-details-section">
        <!-- Customer Header -->
        <div class="customer-details-header p-3 rounded mb-4" style="background: linear-gradient(90deg, #3a1c71, #d76d77, #ffaf7b);">
          <div class="row align-items-center">
            <div class="col-auto">
              <div class="customer-details-avatar" style="width: 80px; height: 80px; border-radius: 50%; background-color: rgba(255,255,255,0.2); display: flex; justify-content: center; align-items: center; font-size: 2rem; color: white;">
            ${initials}
          </div>
            </div>
            <div class="col text-white">
            <div class="d-flex align-items-center">
                <h3 class="mb-0">${customer.name || 'Unknown'}</h3>
              <span class="customer-badge ${badgeClass} ms-2">${badgeText}</span>
                <span class="ms-3 ${statusColor}" style="font-size: 0.9rem;">
                  <i class="fas fa-circle me-1" style="font-size: 0.7rem;"></i>${customerStatus}
                </span>
            </div>
              <p class="mb-0">${customer.business || 'No business'}</p>
              <div class="d-flex mt-2">
                <div class="me-4 text-white">
                  <i class="fas fa-phone me-1"></i> ${customer.phone || 'N/A'}
                </div>
                <div class="text-white">
                  <i class="fas fa-envelope me-1"></i> ${customer.email || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Tabs Navigation -->
        <ul class="nav nav-tabs" id="customerDetailsTabs" role="tablist">
          <li class="nav-item" role="presentation">
            <button class="nav-link active" id="overview-tab" data-bs-toggle="tab" data-bs-target="#overview" type="button" role="tab" aria-controls="overview" aria-selected="true">
              <i class="fas fa-user me-2"></i>Overview
            </button>
                </li>
          <li class="nav-item" role="presentation">
            <button class="nav-link" id="purchase-history-tab" data-bs-toggle="tab" data-bs-target="#purchase-history" type="button" role="tab" aria-controls="purchase-history" aria-selected="false">
              <i class="fas fa-shopping-cart me-2"></i>Purchase History
              ${customer.purchaseCount > 0 ? `<span class="badge bg-primary ms-1">${customer.purchaseCount}</span>` : ''}
            </button>
                </li>
          <li class="nav-item" role="presentation">
            <button class="nav-link" id="notes-tab" data-bs-toggle="tab" data-bs-target="#notes" type="button" role="tab" aria-controls="notes" aria-selected="false">
              <i class="fas fa-sticky-note me-2"></i>Notes
            </button>
                </li>
              </ul>
            
        <!-- Tabs Content -->
        <div class="tab-content p-3 border border-top-0 rounded-bottom" id="customerDetailsTabContent">
          <!-- Overview Tab -->
          <div class="tab-pane fade show active" id="overview" role="tabpanel" aria-labelledby="overview-tab">
            <div class="row">
            <div class="col-md-6">
                <h5 class="border-bottom pb-2 mb-3"><i class="fas fa-info-circle me-2"></i>Contact Information</h5>
                <div class="mb-3">
                  <div class="card bg-primary text-white mb-2">
                    <div class="card-body py-2">
                      <p class="mb-0">
                        <strong><i class="fas fa-phone-alt me-2"></i>Phone:</strong> ${customer.phone || 'Not provided'}
                      </p>
                  </div>
                </div>
                  <div class="card bg-primary text-white mb-2">
                    <div class="card-body py-2">
                      <p class="mb-0">
                        <strong><i class="fas fa-envelope me-2"></i>Email:</strong> ${customer.email || 'Not provided'}
                      </p>
                  </div>
                </div>
                  <div class="card bg-primary text-white mb-2">
                    <div class="card-body py-2">
                      <p class="mb-0">
                        <strong><i class="fas fa-map-marker-alt me-2"></i>Address:</strong> ${customer.address || 'Not provided'}
                      </p>
                  </div>
                </div>
                  <div class="card bg-primary text-white mb-2">
                    <div class="card-body py-2">
                      <p class="mb-0">
                        <strong><i class="fas fa-receipt me-2"></i>TIN:</strong> ${customer.tin || 'Not provided'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
                <div class="col-md-6">
                <h5 class="border-bottom pb-2 mb-3"><i class="fas fa-chart-line me-2"></i>Purchase Statistics</h5>
                <div class="row">
                  <div class="col-6 mb-3">
                    <div class="card bg-primary text-white h-100">
                      <div class="card-body text-center">
                        <h6 class="card-subtitle mb-2">Total Purchases</h6>
                        <h4 class="card-title">${formatCurrency(parseFloat(customer.totalPurchases) || 0)}</h4>
                      </div>
                    </div>
                  </div>
                  <div class="col-6 mb-3">
                    <div class="card bg-primary text-white h-100">
                      <div class="card-body text-center">
                        <h6 class="card-subtitle mb-2">Purchase Count</h6>
                        <h4 class="card-title">${parseInt(customer.purchaseCount) || 0}</h4>
                      </div>
                    </div>
                  </div>
                  <div class="col-6 mb-3">
                    <div class="card bg-primary text-white h-100">
                      <div class="card-body text-center">
                        <h6 class="card-subtitle mb-2">Items Purchased</h6>
                        <h4 class="card-title">${totalItemsPurchased || 0}</h4>
                      </div>
                    </div>
                  </div>
                  <div class="col-6 mb-3">
                    <div class="card bg-primary text-white h-100">
                      <div class="card-body text-center">
                        <h6 class="card-subtitle mb-2">Last Purchase</h6>
                        <p class="card-text">${lastPurchaseDate}</p>
                      </div>
                    </div>
                  </div>
                  <div class="col-12 mb-3">
                    <div class="card bg-primary text-white">
                      <div class="card-body text-center">
                        <h6 class="card-subtitle mb-2">Customer Since</h6>
                        <p class="card-text">${joinedDate}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Purchase History Tab -->
          <div class="tab-pane fade" id="purchase-history" role="tabpanel" aria-labelledby="purchase-history-tab">
            <h5 class="border-bottom pb-2 mb-3">
              <i class="fas fa-history me-2"></i>Purchase History
              ${customer.purchaseCount > 0 ? 
                `<span class="badge bg-primary">${customer.purchaseCount} purchase${customer.purchaseCount !== 1 ? 's' : ''}</span>` : 
                ''}
            </h5>
            ${purchaseHistoryHTML}
            ${mostPurchasedItemsHTML}
          </div>
          
          <!-- Notes Tab -->
          <div class="tab-pane fade" id="notes" role="tabpanel" aria-labelledby="notes-tab">
            <h5 class="border-bottom pb-2 mb-3"><i class="fas fa-sticky-note me-2"></i>Notes</h5>
            <div class="p-3 bg-light rounded" style="min-height: 150px;">
            ${customer.notes || 'No notes available for this customer.'}
            </div>
          </div>
        </div>
      </div>
    `;

    // Add event listeners to purchase history rows for additional details
    if (customer.purchaseHistory && customer.purchaseHistory.length > 0) {
      document.querySelectorAll('.purchase-row').forEach(row => {
        row.addEventListener('click', () => {
          const purchaseId = row.getAttribute('data-purchase-id');
          const purchase = customer.purchaseHistory.find(p => p.id === purchaseId);
          
          if (purchase) {
            showPurchaseDetails(purchase);
          }
        });
      });
    }
    
  } catch (error) {
    console.error('Error showing customer details:', error);
    
    // Show error in modal
    const customerDetailsContent = document.getElementById('customer-details-content');
    customerDetailsContent.innerHTML = `
      <div class="alert alert-danger">
        <i class="fas fa-exclamation-triangle me-2"></i>
        <strong>Error:</strong> ${error.message || 'Unknown error'}
      </div>
    `;
  }
}

// Handle customer deletion
async function handleDeleteCustomer() {
  try {
    const customerId = document.getElementById('delete-customer-id').value;
    const customerName = getCustomerName(customerId);
    
    if (!customerId) {
      throw new Error('Customer ID is required');
    }
    
    // Delete customer from database
    if (window.electronAPI && typeof window.electronAPI.deleteCustomer === 'function') {
      const result = await window.electronAPI.deleteCustomer(customerId);
      
      if (result) {
        // Remove from local data arrays
        customersData = customersData.filter(c => c.id !== customerId);
        filteredCustomers = filteredCustomers.filter(c => c.id !== customerId);
        
        // Update UI
        updateCustomerCount(customersData.length);
        renderCustomers(filteredCustomers);
        
        // Close the modal
        const deleteCustomerModal = bootstrap.Modal.getInstance(document.getElementById('deleteCustomerModal'));
        deleteCustomerModal.hide();
        
        // Show notification
        if (window.NotificationSystem) {
          window.NotificationSystem.show(`Customer ${customerName} deleted successfully`, { 
            type: 'success',
            title: 'Customer Deleted'
          });
        }
      } else {
        throw new Error('Failed to delete customer from database');
      }
    } else {
      throw new Error('deleteCustomer function not available');
    }
  } catch (error) {
    console.error('Error deleting customer:', error);
    
    // Show error notification
    if (window.NotificationSystem) {
      window.NotificationSystem.show(`Error deleting customer: ${error.message}`, { 
        type: 'error',
        title: 'Error'
      });
    }
    
    // Close the modal
    const deleteCustomerModal = bootstrap.Modal.getInstance(document.getElementById('deleteCustomerModal'));
    deleteCustomerModal.hide();
  }
}

// Refresh customers data
async function refreshCustomersData() {
  try {
    // Reset to first page
    currentPage = 1;
    
    // Clear search and filter
    document.getElementById('search-customer').value = '';
    document.getElementById('filter-type').value = '';
    
    // Reload data
    await loadCustomersData();
    
    // Show notification
    if (window.NotificationSystem) {
      window.NotificationSystem.show('Customer data refreshed', { 
        type: 'info',
        title: 'Data Refreshed'
      });
    }
  } catch (error) {
    console.error('Error refreshing customers data:', error);
    
    // Show error notification
    if (window.NotificationSystem) {
      window.NotificationSystem.show(`Error refreshing data: ${error.message}`, { 
        type: 'error',
        title: 'Error'
      });
    }
  }
}

// Helper function to get customer name by ID
function getCustomerName(customerId) {
  const customer = customersData.find(c => c.id === customerId);
  return customer ? customer.name : 'Unknown Customer';
}

// Helper function to format currency
function formatCurrency(amount) {
  // Get settings from localStorage or use defaults
  const settings = JSON.parse(localStorage.getItem('settings')) || { currency: 'TZS', currencySymbol: 'TZsh' };
  
  // Format the amount with 2 decimal places
  const formattedAmount = Number(amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  // Return formatted amount with currency symbol
  return `${settings.currencySymbol || 'TZsh'} ${formattedAmount}`;
}

// Show purchase details in a modal
function showPurchaseDetails(purchase) {
  try {
    console.log('Showing purchase details:', purchase);
  
    // Create modal HTML
    const modalHTML = `
      <div class="modal fade" id="purchaseDetailsModal" tabindex="-1" aria-labelledby="purchaseDetailsModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header bg-primary text-white">
              <h5 class="modal-title" id="purchaseDetailsModalLabel">
                <i class="fas fa-receipt me-2"></i>Purchase Details - Invoice #${purchase.invoiceNumber || 'N/A'}
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="row mb-3">
                <div class="col-md-6">
                  <p><strong>Date:</strong> ${new Date(purchase.date).toLocaleDateString()}</p>
                  <p><strong>Status:</strong> 
                    <span class="badge ${purchase.status === 'completed' ? 'bg-success' : 'bg-secondary'}">
                      ${purchase.status || 'N/A'}
                    </span>
                  </p>
                </div>
                <div class="col-md-6 text-md-end">
                  <p><strong>Payment Method:</strong> ${purchase.paymentMethod || 'Cash'}</p>
                  <p><strong>Total Amount:</strong> ${formatCurrency(purchase.totalAmount)}</p>
                </div>
              </div>
              
              <h6 class="border-bottom pb-2 mb-3">Items Purchased</h6>
              <div class="table-responsive">
                <table class="table table-striped table-hover">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th class="text-center">Quantity</th>
                      <th class="text-end">Unit Price</th>
                      <th class="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${purchase.items.map(item => `
                      <tr>
                        <td>${item.productName}</td>
                        <td class="text-center">${item.quantity}</td>
                        <td class="text-end">${formatCurrency(item.unitPrice)}</td>
                        <td class="text-end">${formatCurrency(item.totalPrice)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th colspan="3" class="text-end">Grand Total:</th>
                      <th class="text-end">${formatCurrency(purchase.totalAmount)}</th>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button type="button" class="btn btn-primary print-invoice-btn" data-invoice-id="${purchase.id}">
                <i class="fas fa-print me-2"></i>Print Invoice
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Add modal to DOM if it doesn't exist
    let modalElement = document.getElementById('purchaseDetailsModal');
    if (modalElement) {
      bootstrap.Modal.getInstance(modalElement).dispose();
      modalElement.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Get reference to the new modal and show it
    modalElement = document.getElementById('purchaseDetailsModal');
    const purchaseModal = new bootstrap.Modal(modalElement);
    purchaseModal.show();
    
    // Add event listener to print invoice button
    const printInvoiceBtn = modalElement.querySelector('.print-invoice-btn');
    if (printInvoiceBtn) {
      printInvoiceBtn.addEventListener('click', () => {
        // Call function to print invoice
        if (window.electronAPI && typeof window.electronAPI.generateInvoice === 'function') {
          window.electronAPI.generateInvoice(purchase.id)
            .then(result => {
              console.log('Invoice generated:', result);
            })
            .catch(error => {
              console.error('Error generating invoice:', error);
              if (window.NotificationSystem) {
                window.NotificationSystem.show(`Error generating invoice: ${error.message}`, {
                  type: 'error',
                  title: 'Error'
                });
              }
            });
        } else {
          // Fallback if API not available
          console.log('Print invoice for purchase:', purchase.id);
          if (window.NotificationSystem) {
            window.NotificationSystem.show('Invoice printing not available in this version', {
              type: 'info',
              title: 'Information'
            });
          }
        }
      });
    }
  } catch (error) {
    console.error('Error showing purchase details:', error);
    if (window.NotificationSystem) {
      window.NotificationSystem.show(`Error showing purchase details: ${error.message}`, {
        type: 'error',
        title: 'Error'
      });
    }
  }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.initializeCustomers();
});
