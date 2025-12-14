// Reports module for Eliva Hardware

// Chart instances
let salesTrendChart = null;
let topItemsChart = null;

// Current report period
let currentPeriod = 'month';

// Function to load reports data
function loadReports() {
  // Set up event listeners
  setupReportsEventListeners();
  
  // Load initial report data
  loadReportData(currentPeriod);
}

// Set up event listeners for reports page
function setupReportsEventListeners() {
  // Period selector buttons
  const periodButtons = document.querySelectorAll('.report-period-selector button');
  periodButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Update active button
      periodButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Load data for selected period
      const period = button.getAttribute('data-period');
      currentPeriod = period;
      loadReportData(period);
    });
  });
  
  // Export report button
  const exportReportBtn = document.getElementById('export-report-btn');
  if (exportReportBtn) {
    exportReportBtn.addEventListener('click', exportReportToPdf);
  }
}

// Load report data for the specified period
function loadReportData(period) {
  // Show loading state
  showReportLoadingState();
  
  // Get profit/loss data
  window.api.getProfitLoss(period)
    .then(report => {
      // Update report summary cards
      updateReportSummary(report);
      
      // Update profit analysis table
      updateProfitAnalysisTable(report.itemProfits);
      
      // Get sales data for the period
      return window.api.getSales({
        startDate: report.startDate,
        endDate: report.endDate
      }).then(sales => {
        return { report, sales };
      });
    })
    .then(data => {
      // Update sales trend chart
      updateSalesTrendChart(data.sales, data.report.startDate, data.report.endDate);
      
      // Update top items chart
      updateTopItemsChart(data.report.itemProfits);
      
      // Hide loading state
      hideReportLoadingState();
    })
    .catch(err => {
      console.error('Error loading report data:', err);
      window.appUtils.showToast('error', 'Error', 'Failed to load report data.');
      hideReportLoadingState();
    });
}

// Show loading state for reports
function showReportLoadingState() {
  // Add loading class to report containers
  document.querySelectorAll('.report-section, .chart-container').forEach(container => {
    container.classList.add('loading');
  });
}

// Hide loading state for reports
function hideReportLoadingState() {
  // Remove loading class from report containers
  document.querySelectorAll('.report-section, .chart-container').forEach(container => {
    container.classList.remove('loading');
  });
}

// Update report summary cards
function updateReportSummary(report) {
  // Update total sales
  const totalSalesEl = document.getElementById('report-total-sales');
  if (totalSalesEl) {
    totalSalesEl.textContent = window.appUtils.formatCurrency(report.totalRevenue);
  }
  
  // Update total cost
  const totalCostEl = document.getElementById('report-total-cost');
  if (totalCostEl) {
    totalCostEl.textContent = window.appUtils.formatCurrency(report.totalCost);
  }
  
  // Update profit
  const profitEl = document.getElementById('report-profit');
  if (profitEl) {
    profitEl.textContent = window.appUtils.formatCurrency(report.totalProfit);
    
    // Add class based on profit value
    profitEl.className = 'report-value';
    if (report.totalProfit > 0) {
      profitEl.classList.add('positive');
    } else if (report.totalProfit < 0) {
      profitEl.classList.add('negative');
    }
  }
  
  // Update profit margin
  const profitMarginEl = document.getElementById('report-profit-margin');
  if (profitMarginEl) {
    profitMarginEl.textContent = report.profitMargin.toFixed(2) + '%';
    
    // Add class based on margin value
    profitMarginEl.className = 'report-value';
    if (report.profitMargin > 0) {
      profitMarginEl.classList.add('positive');
    } else if (report.profitMargin < 0) {
      profitMarginEl.classList.add('negative');
    }
  }
}

// Update profit analysis table
function updateProfitAnalysisTable(itemProfits) {
  const tableBody = document.getElementById('profit-analysis-body');
  if (!tableBody) return;
  
  // Clear existing rows
  tableBody.innerHTML = '';
  
  // Add rows for each item
  itemProfits.forEach(item => {
    const row = document.createElement('tr');
    
    const margin = item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0;
    
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.quantity}</td>
      <td>${window.appUtils.formatCurrency(item.revenue)}</td>
      <td>${window.appUtils.formatCurrency(item.cost)}</td>
      <td class="${item.profit >= 0 ? 'positive' : 'negative'}">${window.appUtils.formatCurrency(item.profit)}</td>
      <td class="${margin >= 0 ? 'positive' : 'negative'}">${margin.toFixed(2)}%</td>
    `;
    
    tableBody.appendChild(row);
  });
  
  // Add empty state if no items
  if (itemProfits.length === 0) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = `
      <td colspan="6" class="empty-state">
        <div class="empty-state-content">
          <i class="fas fa-chart-pie"></i>
          <p>No profit analysis data available for this period</p>
        </div>
      </td>
    `;
    tableBody.appendChild(emptyRow);
  }
}

// Update sales trend chart
function updateSalesTrendChart(sales, startDate, endDate) {
  const ctx = document.getElementById('sales-trend-chart');
  if (!ctx) return;
  
  // Destroy existing chart if it exists
  if (salesTrendChart) {
    salesTrendChart.destroy();
  }
  
  // Process sales data based on period
  const salesData = processSalesTrendData(sales, startDate, endDate);
  
  // Create chart
  salesTrendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: salesData.labels,
      datasets: [
        {
          label: 'Sales',
          data: salesData.sales,
          backgroundColor: 'rgba(74, 108, 255, 0.2)',
          borderColor: 'rgba(74, 108, 255, 1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true
        },
        {
          label: 'Profit',
          data: salesData.profits,
          backgroundColor: 'rgba(40, 199, 111, 0.2)',
          borderColor: 'rgba(40, 199, 111, 1)',
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
          position: 'top',
          labels: {
            color: 'rgba(255, 255, 255, 0.7)'
          }
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
      },
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      }
    }
  });
}

// Process sales trend data based on period
function processSalesTrendData(sales, startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const labels = [];
  const salesData = [];
  const profitData = [];
  
  // Determine interval based on date range
  const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  let interval = 'day';
  let format = { month: 'short', day: 'numeric' };
  
  if (daysDiff > 60) {
    interval = 'month';
    format = { month: 'short', year: 'numeric' };
  } else if (daysDiff > 7) {
    interval = 'week';
    format = { month: 'short', day: 'numeric' };
  }
  
  // Create intervals
  const intervals = [];
  let current = new Date(start);
  
  if (interval === 'day') {
    while (current <= end) {
      intervals.push({
        label: current.toLocaleDateString('en-US', format),
        start: new Date(current),
        end: new Date(current.setHours(23, 59, 59, 999)),
        sales: 0,
        profit: 0
      });
      current = new Date(current);
      current.setDate(current.getDate() + 1);
      current.setHours(0, 0, 0, 0);
    }
  } else if (interval === 'week') {
    while (current <= end) {
      const weekEnd = new Date(current);
      weekEnd.setDate(weekEnd.getDate() + 6);
      if (weekEnd > end) weekEnd.setTime(end.getTime());
      
      intervals.push({
        label: `${current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        start: new Date(current),
        end: new Date(weekEnd.setHours(23, 59, 59, 999)),
        sales: 0,
        profit: 0
      });
      
      current = new Date(weekEnd);
      current.setDate(current.getDate() + 1);
      current.setHours(0, 0, 0, 0);
    }
  } else if (interval === 'month') {
    while (current <= end) {
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59, 999);
      if (monthEnd > end) monthEnd.setTime(end.getTime());
      
      intervals.push({
        label: current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        start: new Date(current),
        end: new Date(monthEnd),
        sales: 0,
        profit: 0
      });
      
      current = new Date(monthEnd);
      current.setDate(current.getDate() + 1);
      current.setHours(0, 0, 0, 0);
    }
  }
  
  // Aggregate sales data into intervals
  sales.forEach(sale => {
    const saleDate = new Date(sale.sale_date);
    const interval = intervals.find(i => saleDate >= i.start && saleDate <= i.end);
    
    if (interval) {
      interval.sales += sale.total_amount;
      
      // Calculate profit (this is simplified, in real app would need cost data)
      // Assuming 30% profit margin for this example
      interval.profit += sale.total_amount * 0.3;
    }
  });
  
  // Extract data for chart
  intervals.forEach(interval => {
    labels.push(interval.label);
    salesData.push(interval.sales);
    profitData.push(interval.profit);
  });
  
  return {
    labels,
    sales: salesData,
    profits: profitData
  };
}

// Update top items chart
function updateTopItemsChart(itemProfits) {
  const ctx = document.getElementById('top-items-chart');
  if (!ctx) return;
  
  // Destroy existing chart if it exists
  if (topItemsChart) {
    topItemsChart.destroy();
  }
  
  // Get top 5 items by quantity sold
  const topItems = [...itemProfits].sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  
  // Prepare data for chart
  const labels = topItems.map(item => item.name);
  const quantities = topItems.map(item => item.quantity);
  const revenues = topItems.map(item => item.revenue);
  
  // Create chart
  topItemsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Quantity Sold',
          data: quantities,
          backgroundColor: 'rgba(74, 108, 255, 0.7)',
          borderColor: 'rgba(74, 108, 255, 1)',
          borderWidth: 1,
          yAxisID: 'y'
        },
        {
          label: 'Revenue',
          data: revenues,
          backgroundColor: 'rgba(255, 159, 67, 0.7)',
          borderColor: 'rgba(255, 159, 67, 1)',
          borderWidth: 1,
          type: 'line',
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: 'rgba(255, 255, 255, 0.7)'
          }
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
              if (context.datasetIndex === 0) {
                label += context.parsed.y;
              } else {
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
          position: 'left',
          beginAtZero: true,
          grid: {
            color: 'rgba(255, 255, 255, 0.05)'
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)'
          },
          title: {
            display: true,
            text: 'Quantity',
            color: 'rgba(255, 255, 255, 0.7)'
          }
        },
        y1: {
          position: 'right',
          beginAtZero: true,
          grid: {
            drawOnChartArea: false
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)',
            callback: function(value) {
              return '$' + value;
            }
          },
          title: {
            display: true,
            text: 'Revenue',
            color: 'rgba(255, 255, 255, 0.7)'
          }
        }
      },
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      }
    }
  });
}

// Export report to PDF
function exportReportToPdf() {
  // In a real app, this would generate a PDF using jsPDF
  // For now, we'll just show a message
  window.appUtils.showToast('info', 'Export Report', 'Exporting report to PDF...');
  
  // Example of how to generate a PDF (not fully implemented)
  /*
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // Add company header
  doc.setFontSize(22);
  doc.text('Eliva Hardware', 105, 20, { align: 'center' });
  
  // Add report title
  doc.setFontSize(16);
  doc.text(`${getPeriodName(currentPeriod)} Report`, 105, 30, { align: 'center' });
  
  // Add date range
  const dateRange = getDateRangeForPeriod(currentPeriod);
  doc.setFontSize(10);
  doc.text(`Period: ${dateRange}`, 105, 40, { align: 'center' });
  
  // Add summary section
  doc.setFontSize(14);
  doc.text('Summary', 20, 50);
  
  doc.setFontSize(10);
  doc.text(`Total Sales: ${document.getElementById('report-total-sales').textContent}`, 20, 60);
  doc.text(`Total Cost: ${document.getElementById('report-total-cost').textContent}`, 20, 65);
  doc.text(`Profit: ${document.getElementById('report-profit').textContent}`, 20, 70);
  doc.text(`Profit Margin: ${document.getElementById('report-profit-margin').textContent}`, 20, 75);
  
  // Add charts as images
  if (salesTrendChart) {
    const salesChartImg = salesTrendChart.toBase64Image();
    doc.addImage(salesChartImg, 'PNG', 20, 90, 170, 80);
  }
  
  if (topItemsChart) {
    const topItemsChartImg = topItemsChart.toBase64Image();
    doc.addImage(topItemsChartImg, 'PNG', 20, 180, 170, 80);
  }
  
  // Save the PDF
  doc.save(`eliva-hardware-report-${currentPeriod}.pdf`);
  */
}

// Get formatted name for period
function getPeriodName(period) {
  switch (period) {
    case 'day':
      return 'Daily';
    case 'week':
      return 'Weekly';
    case 'month':
      return 'Monthly';
    case 'quarter':
      return 'Quarterly';
    case 'year':
      return 'Yearly';
    default:
      return 'Custom';
  }
}

// Get formatted date range for period
function getDateRangeForPeriod(period) {
  const now = new Date();
  let start = new Date();
  
  switch (period) {
    case 'day':
      return now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    case 'week':
      start.setDate(now.getDate() - 7);
      break;
    case 'month':
      start.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      start.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      start.setFullYear(now.getFullYear() - 1);
      break;
    default:
      start.setMonth(now.getMonth() - 1);
  }
  
  return `${start.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} - ${now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`;
}

// Export the loadReports function
window.loadReports = loadReports; 