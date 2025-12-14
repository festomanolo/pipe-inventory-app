/**
 * Visual Reports Module
 * Handles chart generation and visualization for reports
 */

// Initialize VisualReports namespace
window.VisualReports = (function() {
  // Private variables
  let charts = [];
  
  // Initialize charts for a report
  function generateCharts(report, containerId) {
    console.log('Generating charts for report:', report);
    
    // Clear any existing charts
    destroyCharts();
    
    // Get the container element
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('Chart container not found:', containerId);
      return;
    }
    
    // Clear the container
    container.innerHTML = '';
    
    // If we don't have report data, show a placeholder
    if (!report || !report.data) {
      container.innerHTML = `
        <div class="text-center py-4">
          <i class="fas fa-chart-bar fa-3x mb-3 text-muted"></i>
          <p class="text-muted">No data available for visualization</p>
        </div>
      `;
      return;
    }
    
    // Create chart elements based on report type
    switch (report.type) {
      case 'sales':
        createSalesCharts(report, container);
        break;
      case 'inventory':
        createInventoryCharts(report, container);
        break;
      case 'profit':
        createProfitCharts(report, container);
        break;
      default:
        container.innerHTML = `
          <div class="text-center py-4">
            <i class="fas fa-chart-bar fa-3x mb-3 text-muted"></i>
            <p class="text-muted">No visualization available for this report type</p>
          </div>
        `;
    }
  }
  
  // Create sales report charts
  function createSalesCharts(report, container) {
    // For sample data, create placeholder charts
    container.innerHTML = `
      <div class="row">
        <div class="col-md-6 mb-4">
          <h5>Sales by Date</h5>
          <div class="chart-container">
            <canvas id="sales-timeline-chart"></canvas>
          </div>
        </div>
        <div class="col-md-6 mb-4">
          <h5>Sales by Category</h5>
          <div class="chart-container">
            <canvas id="sales-category-chart"></canvas>
          </div>
        </div>
      </div>
    `;
    
    // Create sample charts with Chart.js
    try {
      // Sample data for timeline chart
      const timelineData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Sales',
          data: [1200, 1900, 3000, 5000, 2000, 3000],
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      };
      
      // Sample data for category chart
      const categoryData = {
        labels: ['Pipes', 'Fittings', 'Valves', 'Tools', 'Other'],
          datasets: [{
          label: 'Sales by Category',
          data: [12000, 8000, 5000, 3000, 1500],
          backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)',
            'rgba(153, 102, 255, 0.5)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)'
          ],
            borderWidth: 1
          }]
      };
      
      // Create timeline chart
      const timelineCtx = document.getElementById('sales-timeline-chart').getContext('2d');
      const timelineChart = new Chart(timelineCtx, {
        type: 'line',
        data: timelineData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
            },
              ticks: {
                color: 'rgba(255, 255, 255, 0.7)'
              }
              },
            x: {
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              },
              ticks: {
                color: 'rgba(255, 255, 255, 0.7)'
              }
            }
          },
          plugins: {
            legend: {
              labels: {
                color: 'rgba(255, 255, 255, 0.7)'
              }
            }
          }
        }
      });
      
      // Create category chart
      const categoryCtx = document.getElementById('sales-category-chart').getContext('2d');
      const categoryChart = new Chart(categoryCtx, {
        type: 'pie',
        data: categoryData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
            position: 'right',
            labels: {
                color: 'rgba(255, 255, 255, 0.7)'
              }
            }
          }
        }
      });
      
      // Add charts to the charts array for cleanup later
      charts.push(timelineChart, categoryChart);
      
    } catch (error) {
      console.error('Error creating sales charts:', error);
      container.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-triangle mr-2"></i>
          Error creating charts: ${error.message}
        </div>
      `;
    }
  }
  
  // Create inventory report charts
  function createInventoryCharts(report, container) {
    console.log('Creating inventory charts with data:', report.data);
    
    // Get inventory data
    const categoryData = report.data.categoryData || {};
    const categories = report.data.categories || [];
    const items = report.data.items || [];
    
    // Create container for charts
    container.innerHTML = `
      <div class="row">
        <div class="col-md-6 mb-4">
          <h5>Inventory by Category</h5>
          <div class="chart-container">
            <canvas id="inventory-category-chart"></canvas>
          </div>
        </div>
        <div class="col-md-6 mb-4">
          <h5>Inventory Value Distribution</h5>
          <div class="chart-container">
            <canvas id="inventory-value-chart"></canvas>
          </div>
        </div>
      </div>
    `;
    
    try {
      // Prepare data for category chart
      let categoryLabels = [];
      let categoryItemCounts = [];
      let categoryColors = [];
      
      // If we have categoryData (from real data), use it
      if (Object.keys(categoryData).length > 0) {
        console.log('Using real category data from categoryData object');
        Object.entries(categoryData).forEach(([category, data], index) => {
          categoryLabels.push(data.name || category);
          categoryItemCounts.push(data.count);
          categoryColors.push(getColorForIndex(index));
        });
      }
      // Otherwise check if we have categories and items separately
      else if (categories.length > 0 && items.length > 0) {
        console.log('Calculating category data from categories and items arrays');
        // Count items per category
        const categoryCounts = {};
        categories.forEach(category => {
          categoryCounts[category] = 0;
        });
        
        items.forEach(item => {
          const category = item.category || 'Uncategorized';
          if (!categoryCounts[category]) {
            categoryCounts[category] = 0;
          }
          categoryCounts[category]++;
        });
        
        // Prepare data for chart
        Object.entries(categoryCounts).forEach(([category, count], index) => {
          categoryLabels.push(category);
          categoryItemCounts.push(count);
          categoryColors.push(getColorForIndex(index));
        });
      }
      // Default sample data as last resort
      else {
        console.log('Using sample category data');
        categoryLabels = ['Pipes', 'Tools', 'Hardware', 'Electrical', 'Paint', 'Other'];
        categoryItemCounts = [450, 230, 180, 120, 80, 50];
        categoryColors = ['#4CC9F0', '#4361EE', '#3A0CA3', '#7209B7', '#F72585', '#560BAD'];
      }
      
      // Create category chart
      const categoryCtx = document.getElementById('inventory-category-chart').getContext('2d');
      const categoryChart = new Chart(categoryCtx, {
        type: 'pie',
        data: {
          labels: categoryLabels,
          datasets: [{
            data: categoryItemCounts,
            backgroundColor: categoryColors,
            borderWidth: 1,
            borderColor: '#222'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
          labels: {
                color: '#fff',
                boxWidth: 12,
                padding: 10
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.raw || 0;
                  const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                  const percentage = Math.round((value * 100) / total);
                  return `${label}: ${value} items (${percentage}%)`;
                }
              }
            }
          }
        }
      });
      
      // Prepare data for value chart
      let valueLabels = [];
      let valueData = [];
      let valueColors = [];
      
      // If we have categoryData (from real data), use it
      if (Object.keys(categoryData).length > 0) {
        console.log('Using real value data from categoryData object');
        Object.entries(categoryData).forEach(([category, data], index) => {
          valueLabels.push(data.name || category);
          valueData.push(data.value);
          valueColors.push(getColorForIndex(index + 3)); // Offset colors to make them different
        });
      }
      // Otherwise calculate value from items if available
      else if (categories.length > 0 && items.length > 0) {
        console.log('Calculating value data from categories and items arrays');
        // Sum value per category
        const categoryValues = {};
        categories.forEach(category => {
          categoryValues[category] = 0;
        });
        
        items.forEach(item => {
          const category = item.category || 'Uncategorized';
          if (!categoryValues[category]) {
            categoryValues[category] = 0;
          }
          
          const quantity = parseFloat(item.quantity) || 0;
          let price = 0;
          if (item.price !== undefined) {
            price = parseFloat(item.price) || 0;
          } else if (item.cost !== undefined) {
            price = parseFloat(item.cost) || 0;
          } else if (item.cost_price !== undefined) {
            price = parseFloat(item.cost_price) || 0;
          } else if (item.sell_price !== undefined) {
            price = parseFloat(item.sell_price) || 0;
          }
          
          categoryValues[category] += quantity * price;
        });
        
        // Prepare data for chart
        Object.entries(categoryValues).forEach(([category, value], index) => {
          valueLabels.push(category);
          valueData.push(value);
          valueColors.push(getColorForIndex(index + 3));
        });
      }
      // Default sample data as last resort
      else {
        console.log('Using sample value data');
        valueLabels = ['Pipes', 'Tools', 'Hardware', 'Electrical', 'Paint', 'Other'];
        valueData = [45000, 23000, 18000, 12000, 8000, 5000];
        valueColors = ['#38B000', '#008000', '#70E000', '#CCFF33', '#FFEE32', '#FCF300'];
      }
      
      // Create value chart
      const valueCtx = document.getElementById('inventory-value-chart').getContext('2d');
      const valueChart = new Chart(valueCtx, {
        type: 'doughnut',
        data: {
          labels: valueLabels,
          datasets: [{
            data: valueData,
            backgroundColor: valueColors,
            borderWidth: 1,
            borderColor: '#222'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                color: '#fff',
                boxWidth: 12,
                padding: 10
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.raw || 0;
                  const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                  const percentage = Math.round((value * 100) / total);
                  return `${label}: $${value.toFixed(2)} (${percentage}%)`;
                }
              }
            }
          }
        }
      });
      
      // Add charts to the charts array for cleanup later
      charts.push(categoryChart, valueChart);
      
    } catch (error) {
      console.error('Error creating inventory charts:', error);
      container.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-triangle mr-2"></i>
          Error creating charts: ${error.message}
        </div>
      `;
    }
  }
  
  // Get a color for a chart index
  function getColorForIndex(index) {
    const colors = [
      '#4CC9F0', '#4361EE', '#3A0CA3', '#7209B7', '#F72585', '#560BAD',
      '#38B000', '#008000', '#70E000', '#CCFF33', '#FFEE32', '#FCF300',
      '#FB5607', '#FF006E', '#8338EC', '#3A86FF', '#FF595E', '#FFCA3A'
    ];
    return colors[index % colors.length];
  }
  
  // Create profit report charts
  function createProfitCharts(report, container) {
    // For sample data, create placeholder charts
    container.innerHTML = `
      <div class="row">
        <div class="col-md-6 mb-4">
          <h5>Profit Over Time</h5>
          <div class="chart-container">
            <canvas id="profit-timeline-chart"></canvas>
          </div>
        </div>
        <div class="col-md-6 mb-4">
          <h5>Revenue vs. Cost</h5>
          <div class="chart-container">
            <canvas id="profit-comparison-chart"></canvas>
          </div>
        </div>
      </div>
    `;
    
    // Create sample charts with Chart.js
    try {
      // Sample data for timeline chart
      const timelineData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Profit',
          data: [500, 800, 1200, 2000, 750, 1500],
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
          fill: true
        }]
      };
      
      // Sample data for comparison chart
      const comparisonData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Revenue',
          data: [1500, 2000, 3000, 5000, 2500, 3500],
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }, {
          label: 'Cost',
          data: [1000, 1200, 1800, 3000, 1750, 2000],
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        }]
      };
      
      // Create timeline chart
      const timelineCtx = document.getElementById('profit-timeline-chart').getContext('2d');
      const timelineChart = new Chart(timelineCtx, {
        type: 'line',
        data: timelineData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              },
              ticks: {
                color: 'rgba(255, 255, 255, 0.7)'
              }
            },
            x: {
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              },
              ticks: {
                color: 'rgba(255, 255, 255, 0.7)'
              }
            }
          },
          plugins: {
            legend: {
              labels: {
                color: 'rgba(255, 255, 255, 0.7)'
              }
            }
          }
        }
      });
      
      // Create comparison chart
      const comparisonCtx = document.getElementById('profit-comparison-chart').getContext('2d');
      const comparisonChart = new Chart(comparisonCtx, {
        type: 'bar',
        data: comparisonData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              },
              ticks: {
                color: 'rgba(255, 255, 255, 0.7)'
              }
            },
            x: {
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              },
              ticks: {
                color: 'rgba(255, 255, 255, 0.7)'
              }
            }
          },
          plugins: {
            legend: {
              labels: {
                color: 'rgba(255, 255, 255, 0.7)'
              }
            }
          }
        }
      });
      
      // Add charts to the charts array for cleanup later
      charts.push(timelineChart, comparisonChart);
      
    } catch (error) {
      console.error('Error creating profit charts:', error);
      container.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-triangle mr-2"></i>
          Error creating charts: ${error.message}
            </div>
      `;
    }
  }
  
  // Destroy all charts to prevent memory leaks
  function destroyCharts() {
    charts.forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        chart.destroy();
      }
    });
    charts = [];
  }
  
  // Public API
  return {
    generateCharts: generateCharts,
    destroyCharts: destroyCharts
  };
})();

// Auto-initialize when loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Visual Reports module loaded');
});

// Generate chart for inventory data
function generateInventoryChart(report, containerId) {
  if (!report || !report.data) return;
  
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // Create chart container
  const chartContainer = document.createElement('div');
  chartContainer.className = 'row mb-3';
  
  // Get inventory data
  const categoryData = report.data.categoryData || {};
  
  // Create HTML for charts
  chartContainer.innerHTML = `
    <div class="col-md-6 mb-3">
      <h5>Inventory by Category</h5>
      <div class="chart-wrapper">
        <canvas id="inventory-category-chart"></canvas>
          </div>
          </div>
    <div class="col-md-6 mb-3">
      <h5>Inventory Value Distribution</h5>
      <div class="chart-wrapper">
        <canvas id="inventory-value-chart"></canvas>
          </div>
          </div>
        `;
  
  container.appendChild(chartContainer);
  
  // Prepare data for category chart
  const categoryLabels = [];
  const categoryItemCounts = [];
  const categoryColors = [];
  
  // If we have categoryData (real data), use it
  if (Object.keys(categoryData).length > 0) {
    Object.entries(categoryData).forEach(([category, data], index) => {
      categoryLabels.push(data.name || category);
      categoryItemCounts.push(data.count);
      categoryColors.push(getColorForIndex(index));
    });
  } 
  // Otherwise check if we have categories and items separately
  else if (report.data.categories && report.data.categories.length > 0 && report.data.items) {
    // Count items per category
    const categoryCounts = {};
    report.data.categories.forEach(category => {
      categoryCounts[category] = 0;
    });
    
    report.data.items.forEach(item => {
      const category = item.category || 'Uncategorized';
      if (!categoryCounts[category]) {
        categoryCounts[category] = 0;
      }
      categoryCounts[category]++;
    });
    
    // Prepare data for chart
    Object.entries(categoryCounts).forEach(([category, count], index) => {
      categoryLabels.push(category);
      categoryItemCounts.push(count);
      categoryColors.push(getColorForIndex(index));
    });
  }
  // Default sample data as last resort
  else {
    categoryLabels.push('Pipes', 'Tools', 'Hardware', 'Electrical', 'Paint', 'Other');
    categoryItemCounts.push(450, 230, 180, 120, 80, 50);
    categoryColors.push('#4CC9F0', '#4361EE', '#3A0CA3', '#7209B7', '#F72585', '#560BAD');
  }
  
  // Create category chart
  const categoryCtx = document.getElementById('inventory-category-chart');
  if (categoryCtx) {
    new Chart(categoryCtx, {
      type: 'pie',
      data: {
        labels: categoryLabels,
        datasets: [{
          data: categoryItemCounts,
          backgroundColor: categoryColors,
          borderWidth: 1,
          borderColor: '#222'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#fff',
              boxWidth: 12,
              padding: 10
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((value * 100) / total);
                return `${label}: ${value} items (${percentage}%)`;
              }
            }
          }
        }
        }
      });
    }
    
  // Prepare data for value chart
  const valueLabels = [];
  const valueData = [];
  const valueColors = [];
  
  // If we have categoryData (real data), use it
  if (Object.keys(categoryData).length > 0) {
    Object.entries(categoryData).forEach(([category, data], index) => {
      valueLabels.push(data.name || category);
      valueData.push(data.value);
      valueColors.push(getColorForIndex(index + 3)); // Offset colors to make them different
    });
  }
  // Otherwise use sample data
  else {
    valueLabels.push('Pipes', 'Tools', 'Hardware', 'Electrical', 'Paint', 'Other');
    valueData.push(45000, 23000, 18000, 12000, 8000, 5000);
    valueColors.push('#38B000', '#008000', '#70E000', '#CCFF33', '#FFEE32', '#FCF300');
  }
  
  // Create value chart
  const valueCtx = document.getElementById('inventory-value-chart');
  if (valueCtx) {
    new Chart(valueCtx, {
      type: 'doughnut',
      data: {
        labels: valueLabels,
        datasets: [{
          data: valueData,
          backgroundColor: valueColors,
          borderWidth: 1,
          borderColor: '#222'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
          position: 'right',
          labels: {
              color: '#fff',
              boxWidth: 12,
              padding: 10
            }
          },
          tooltip: {
          callbacks: {
            label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((value * 100) / total);
                return `${label}: $${value.toFixed(2)} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }
} 