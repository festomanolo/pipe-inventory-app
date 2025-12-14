/**
 * Enhanced UI/UX JavaScript for Pipe Inventory App
 * Applies consistent styling across all pages at runtime
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('Applying enhanced UI/UX across the application');
  
  // Apply to any page
  enhanceGlobalUI();
  
  // Apply page-specific enhancements
  const currentPage = window.location.pathname.split('/').pop();
  
  if (currentPage.includes('inventory')) {
    enhanceInventoryUI();
  } else if (currentPage.includes('sales')) {
    enhanceSalesUI();
  } else if (currentPage.includes('reports')) {
    enhanceReportsUI();
  } else if (currentPage.includes('dashboard')) {
    enhanceDashboardUI();
  }
});

// Global UI enhancements
function enhanceGlobalUI() {
  // Enhance all cards
  document.querySelectorAll('.card').forEach(card => {
    if (!card.classList.contains('enhanced')) {
      card.classList.add('enhanced');
      
      // Add subtle hover effect
      card.style.transition = 'all 0.3s ease';
      
      // Enhance card header if present
      const header = card.querySelector('.card-header');
      if (header) {
        header.style.fontWeight = '600';
        
        // Add icon color if there's an icon
        const icon = header.querySelector('i');
        if (icon) {
          icon.style.color = '#3b82f6';
        }
      }
    }
  });
  
  // Enhance all buttons
  document.querySelectorAll('.btn-primary').forEach(btn => {
    if (!btn.classList.contains('enhanced')) {
      btn.classList.add('enhanced');
      
      // Add hover effect
      btn.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-1px)';
        this.style.boxShadow = '0 4px 8px -2px rgba(59, 130, 246, 0.35)';
      });
      
      btn.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 3px 5px -1px rgba(59, 130, 246, 0.25)';
      });
    }
  });
  
  // Apply table header styles
  applyTableHeaderStyles();
}

// Inventory page specific enhancements
function enhanceInventoryUI() {
  console.log('Applying inventory-specific enhancements');
  
  // Add pulse animation to "Add New Item" button
  const addItemBtn = document.querySelector('button[data-bs-target="#addItemModal"]');
  if (addItemBtn) {
    addItemBtn.classList.add('pulse-button');
  }
  
  // Observe the inventory table for changes to apply styling
  const inventoryTable = document.getElementById('inventory-table');
  if (inventoryTable) {
    const observer = new MutationObserver(function() {
      enhanceStockVisualIndicators();
    });
    
    observer.observe(inventoryTable, { childList: true, subtree: true });
    
    // Initial application
    enhanceStockVisualIndicators();
  }
}

// Sales page specific enhancements
function enhanceSalesUI() {
  console.log('Applying sales-specific enhancements');
  
  // Add pulse animation to "New Sale" button
  const newSaleBtn = document.querySelector('button[data-bs-target="#newSaleModal"]');
  if (newSaleBtn) {
    newSaleBtn.classList.add('pulse-button');
  }
  
  // Enhance payment method badges
  document.querySelectorAll('.payment-badge').forEach(badge => {
    const method = badge.textContent.trim().toLowerCase();
    
    if (method.includes('cash')) {
      badge.style.backgroundColor = '#059669';
    } else if (method.includes('card')) {
      badge.style.backgroundColor = '#6366f1';
    } else if (method.includes('transfer')) {
      badge.style.backgroundColor = '#8b5cf6';
    } else if (method.includes('credit')) {
      badge.style.backgroundColor = '#f59e0b';
    }
    
    badge.style.color = 'white';
    badge.style.fontWeight = '500';
    badge.style.borderRadius = '6px';
    badge.style.padding = '8px 12px';
  });
}

// Reports page specific enhancements
function enhanceReportsUI() {
  console.log('Applying reports-specific enhancements');
  
  // Enhance chart containers
  document.querySelectorAll('.chart-container').forEach(container => {
    container.style.borderRadius = '12px';
    container.style.overflow = 'hidden';
    container.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
    container.style.padding = '1rem';
    container.style.backgroundColor = '#ffffff';
    container.style.marginBottom = '1.5rem';
  });
}

// Dashboard page specific enhancements
function enhanceDashboardUI() {
  console.log('Applying dashboard-specific enhancements');
  
  // Enhance stat cards
  document.querySelectorAll('.stats-card').forEach(card => {
    card.style.position = 'relative';
    card.style.overflow = 'hidden';
    card.style.borderRadius = '12px';
    card.style.padding = '1.5rem';
    
    // Add background gradient
    card.style.background = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)';
    card.style.color = 'white';
    
    // Find and enhance stat value
    const statValue = card.querySelector('.stats-value, .card-title');
    if (statValue) {
      statValue.style.fontSize = '2.2rem';
      statValue.style.fontWeight = '700';
      statValue.style.marginBottom = '0.5rem';
    }
    
    // Find and enhance stat label
    const statLabel = card.querySelector('.stats-label, .card-subtitle');
    if (statLabel) {
      statLabel.style.fontSize = '1rem';
      statLabel.style.opacity = '0.9';
    }
    
    // Add decorative icon based on title text
    const title = card.textContent.toLowerCase();
    let iconClass = 'fa-chart-line';
    
    if (title.includes('total') || title.includes('revenue')) {
      iconClass = 'fa-money-bill-wave';
    } else if (title.includes('sales') || title.includes('orders')) {
      iconClass = 'fa-shopping-cart';
    } else if (title.includes('customer')) {
      iconClass = 'fa-users';
    } else if (title.includes('profit') || title.includes('margin')) {
      iconClass = 'fa-chart-pie';
    } else if (title.includes('inventory') || title.includes('stock')) {
      iconClass = 'fa-boxes';
    }
    
    const iconElement = document.createElement('i');
    iconElement.className = `fas ${iconClass}`;
    iconElement.style.position = 'absolute';
    iconElement.style.right = '20px';
    iconElement.style.top = '20px';
    iconElement.style.fontSize = '4rem';
    iconElement.style.opacity = '0.15';
    iconElement.style.color = 'white';
    
    card.appendChild(iconElement);
  });
}

// Enhanced function for stock level indicators
function enhanceStockVisualIndicators() {
  // Apply individual styling to rows
  const outOfStockRows = document.querySelectorAll('tr.out-of-stock-row');
  outOfStockRows.forEach(row => {
    if (!row.hasAttribute('data-enhanced')) {
      row.setAttribute('data-enhanced', 'true');
      
      // Add a subtle left border to make it even more noticeable
      row.style.borderLeft = '3px solid #dc3545';
      
      // Make the text bold for better visibility
      const cells = row.querySelectorAll('td');
      cells.forEach(cell => {
        if (!cell.classList.contains('actions')) {
          cell.style.fontWeight = '500';
        }
      });
      
      // Enhance status badge with icon
      const statusBadge = row.querySelector('.status-badge');
      if (statusBadge && statusBadge.classList.contains('status-danger')) {
        statusBadge.innerHTML = '<i class="fas fa-exclamation-circle me-1"></i> OUT OF STOCK';
      }
    }
  });
  
  // Style low stock rows
  const lowStockRows = document.querySelectorAll('tr.low-stock-row');
  lowStockRows.forEach(row => {
    if (!row.hasAttribute('data-enhanced')) {
      row.setAttribute('data-enhanced', 'true');
      
      // Add a subtle left border
      row.style.borderLeft = '3px solid #fd7e14';
      
      // Enhance status badge with icon
      const statusBadge = row.querySelector('.status-badge');
      if (statusBadge && statusBadge.classList.contains('status-warning')) {
        statusBadge.innerHTML = '<i class="fas fa-exclamation-triangle me-1"></i> LOW STOCK';
      }
    }
  });
  
  // Apply subtle enhancement to good stock rows
  const goodStockRows = document.querySelectorAll('tr.good-stock-row');
  goodStockRows.forEach(row => {
    if (!row.hasAttribute('data-enhanced')) {
      row.setAttribute('data-enhanced', 'true');
      
      // Add a subtle left border
      row.style.borderLeft = '3px solid #28a745';
      
      // Enhance status badge with icon
      const statusBadge = row.querySelector('.status-badge');
      if (statusBadge && statusBadge.classList.contains('status-success')) {
        statusBadge.innerHTML = '<i class="fas fa-check-circle me-1"></i> In Stock';
      }
    }
  });
}

// Apply table header styles
function applyTableHeaderStyles() {
  console.log('Applying enhanced table header styles');
  
  // Target all tables
  document.querySelectorAll('table').forEach(table => {
    const header = table.querySelector('thead');
    if (!header) return;
    
    // Apply styles to header
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
      cell.style.textTransform = 'uppercase';
      cell.style.fontSize = '0.85rem';
      cell.style.letterSpacing = '0.5px';
      cell.style.padding = '12px 16px';
    });
  });
}
