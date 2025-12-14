// Dashboard module for Eliva Hardware

// Chart instances
let salesChart = null;

// Function to load dashboard data
function loadDashboard() {
  // Load dashboard statistics
  loadDashboardStats();
  
  // Initialize sales chart
  initSalesChart();
  
  // Load recent activity
  loadRecentActivity();
  
  // Load AI recommendations
  loadAIRecommendations();
}

// Load dashboard statistics
function loadDashboardStats() {
  // Get today's date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get today's sales
  window.api.getDailyReport(today.toISOString())
    .then(report => {
      // Update today's sales stat
      const todaySales = document.getElementById('today-sales');
      if (todaySales) {
        todaySales.textContent = window.appUtils.formatCurrency(report.totalRevenue || 0);
      }
      
      // Update other stats based on the report
    })
    .catch(err => {
      console.error('Error loading daily report:', err);
    });
  
  // Get total items count
  window.api.getInventory()
    .then(items => {
      const totalItems = document.getElementById('total-items');
      if (totalItems) {
        totalItems.textContent = items.length;
      }
    })
    .catch(err => {
      console.error('Error loading inventory:', err);
    });
  
  // Get low stock alerts
  window.api.getLowStockAlerts()
    .then(items => {
      const lowStockCount = document.getElementById('low-stock-count');
      if (lowStockCount) {
        lowStockCount.textContent = items.length;
      }
    })
    .catch(err => {
      console.error('Error loading low stock alerts:', err);
    });
  
  // Get monthly profit
  window.api.getProfitLoss('month')
    .then(report => {
      const monthlyProfit = document.getElementById('monthly-profit');
      if (monthlyProfit) {
        monthlyProfit.textContent = window.appUtils.formatCurrency(report.totalProfit || 0);
      }
    })
    .catch(err => {
      console.error('Error loading profit/loss report:', err);
    });
}

// Initialize sales chart
function initSalesChart() {
  const ctx = document.getElementById('sales-chart');
  if (!ctx) return;
  
  // Get sales data for the last 7 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 6); // Last 7 days including today
  
  window.api.getSales({ startDate: startDate.toISOString(), endDate: endDate.toISOString() })
    .then(sales => {
      // Process sales data by day
      const salesByDay = processSalesByDay(sales, startDate, endDate);
      
      // Create chart
      salesChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: salesByDay.labels,
          datasets: [
            {
              label: 'Sales',
              data: salesByDay.sales,
              backgroundColor: 'rgba(74, 108, 255, 0.2)',
              borderColor: 'rgba(74, 108, 255, 1)',
              borderWidth: 2,
              tension: 0.4,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  if (context.parsed.y !== null) {
                    label += window.appUtils.formatCurrency(context.parsed.y);
                  }
                  return label;
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                color: 'rgba(255, 255, 255, 0.05)'
              },
              ticks: {
                color: 'rgba(255, 255, 255, 0.7)'
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(255, 255, 255, 0.05)'
              },
              ticks: {
                color: 'rgba(255, 255, 255, 0.7)',
                callback: function(value) {
                  return '$' + value;
                }
              }
            }
          }
        }
      });
    })
    .catch(err => {
      console.error('Error loading sales data for chart:', err);
    });
}

// Process sales data by day
function processSalesByDay(sales, startDate, endDate) {
  const days = [];
  const salesData = [];
  
  // Create array of dates
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    days.push(currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    
    // Initialize sales amount for this day
    const dayStr = currentDate.toISOString().split('T')[0];
    let dayTotal = 0;
    
    // Sum sales for this day
    sales.forEach(sale => {
      const saleDate = new Date(sale.sale_date);
      if (saleDate.toISOString().split('T')[0] === dayStr) {
        dayTotal += sale.total_amount;
      }
    });
    
    salesData.push(dayTotal);
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return {
    labels: days,
    sales: salesData
  };
}

// Load recent activity
function loadRecentActivity() {
  const activityList = document.getElementById('recent-activity-list');
  if (!activityList) return;
  
  // Clear existing activity items except the first one (template)
  while (activityList.children.length > 1) {
    activityList.removeChild(activityList.lastChild);
  }
  
  // Get recent sales
  window.api.getSales({ limit: 5 })
    .then(sales => {
      // Add sale activities
      sales.forEach(sale => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item stagger-item';
        
        activityItem.innerHTML = `
          <div class="activity-icon sale">
            <i class="fas fa-shopping-cart"></i>
          </div>
          <div class="activity-details">
            <p class="activity-title">New Sale</p>
            <p class="activity-description">Sale #${sale.invoice_number} to ${sale.buyer_name}</p>
            <p class="activity-time">${getTimeAgo(new Date(sale.sale_date))}</p>
          </div>
        `;
        
        activityList.appendChild(activityItem);
      });
    })
    .catch(err => {
      console.error('Error loading recent sales:', err);
    });
  
  // Get recent inventory changes (this would need a separate API endpoint)
  // For now, we'll just add a placeholder
  const inventoryActivity = document.createElement('div');
  inventoryActivity.className = 'activity-item stagger-item';
  
  inventoryActivity.innerHTML = `
    <div class="activity-icon inventory">
      <i class="fas fa-box"></i>
    </div>
    <div class="activity-details">
      <p class="activity-title">Inventory Update</p>
      <p class="activity-description">Added 50 units of PVC Pipe (1.5")</p>
      <p class="activity-time">2 hours ago</p>
    </div>
  `;
  
  activityList.appendChild(inventoryActivity);
}

// Load AI recommendations
function loadAIRecommendations() {
  const recommendationsContainer = document.getElementById('ai-recommendations');
  if (!recommendationsContainer) return;
  
  // Clear existing recommendations
  recommendationsContainer.innerHTML = '';
  
  // Get inventory data
  window.api.getInventory()
    .then(items => {
      // Get sales data
      return window.api.getSales().then(sales => {
        return { items, sales };
      });
    })
    .then(data => {
      // Generate recommendations based on inventory and sales data
      const recommendations = generateRecommendations(data.items, data.sales);
      
      // Add recommendations to the container
      recommendations.forEach(rec => {
        const recItem = document.createElement('div');
        recItem.className = 'recommendation-item';
        
        recItem.innerHTML = `
          <div class="recommendation-icon">
            <i class="fas ${rec.icon}"></i>
          </div>
          <div class="recommendation-content">
            <h3>${rec.title}</h3>
            <p>${rec.message}</p>
          </div>
        `;
        
        recommendationsContainer.appendChild(recItem);
      });
    })
    .catch(err => {
      console.error('Error loading data for recommendations:', err);
    });
}

// Generate AI recommendations based on data
function generateRecommendations(items, sales) {
  const recommendations = [];
  
  // Check for low stock items
  const lowStockItems = items.filter(item => item.quantity <= item.low_stock_threshold);
  if (lowStockItems.length > 0) {
    recommendations.push({
      title: 'Stock Replenishment',
      message: `${lowStockItems.length} items are running low on stock. Consider restocking soon.`,
      icon: 'fa-exclamation-circle'
    });
  }
  
  // Check for popular items
  if (sales.length > 0) {
    // This would require more complex analysis in a real app
    recommendations.push({
      title: 'Popular Items',
      message: 'PVC pipes (1.5" diameter) are your best selling items this month. Consider increasing inventory.',
      icon: 'fa-chart-line'
    });
  }
  
  // Profit margin recommendation
  recommendations.push({
    title: 'Pricing Strategy',
    message: 'Galvanized pipes have the highest profit margin. Consider promoting these items.',
    icon: 'fa-percentage'
  });
  
  // Seasonal recommendation
  const currentMonth = new Date().getMonth();
  if (currentMonth >= 3 && currentMonth <= 5) { // Spring
    recommendations.push({
      title: 'Seasonal Trend',
      message: 'Spring season typically sees increased demand for garden irrigation pipes. Prepare inventory accordingly.',
      icon: 'fa-seedling'
    });
  }
  
  return recommendations;
}

// Get time ago string
function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);
  
  if (diffSec < 60) {
    return 'Just now';
  } else if (diffMin < 60) {
    return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  } else if (diffHour < 24) {
    return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  } else if (diffDay < 7) {
    return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

// Export the loadDashboard function
window.loadDashboard = loadDashboard; 