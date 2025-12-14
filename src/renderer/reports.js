// Minimal reports.js implementation

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('Reports page loaded - minimal version');
  
  // DOM Elements
  const reportForm = document.getElementById('report-generator-form');
  const reportType = document.getElementById('report-type');
  const reportPeriod = document.getElementById('report-period');
  const reportFormat = document.getElementById('report-format');
  const generateBtn = document.getElementById('generate-report-btn');
  const reportsList = document.getElementById('reports-list');
  const reportsLoading = document.getElementById('reports-loading');
  const noReportsFound = document.getElementById('no-reports-found');
  
  // Check if elements exist
  if (!reportForm) {
    console.error('Report form not found');
    return;
  }
  
  // Event Listeners
  reportForm.addEventListener('submit', handleFormSubmit);
  
  // Load reports on page load
  fetchReports();
  
  // Add debug buttons directly to the page
  addDebugButtons();
  
  // Handle form submission
  async function handleFormSubmit(e) {
    e.preventDefault();
    console.log('Form submitted');
    
    // Get form values
    const type = reportType.value;
    const period = reportPeriod.value;
    const format = reportFormat.value;
    
    console.log('Report data:', { type, period, format });
    
    // Validate
    if (!type) {
      alert('Please select a report type');
      return;
    }
    
    // Show loading
    if (generateBtn) generateBtn.disabled = true;
    if (reportsLoading) reportsLoading.style.display = 'block';
    
    try {
      // Create report data
      const reportData = {
        type,
        period,
        format,
        createdAt: new Date().toISOString()
      };
      
      console.log('Generating report:', reportData);
      
      // Call API
      if (window.electronAPI && window.electronAPI.addReport) {
        const result = await window.electronAPI.addReport(reportData);
        console.log('📊 Report generated successfully:', result);
        console.log('   Report ID:', result?.id);
        console.log('   Has metrics:', !!result?.metrics);
        console.log('   Has charts:', !!result?.charts);
        console.log('   Has data:', !!result?.data, 'with', result?.data?.length || 0, 'rows');
        
        // Store the full report data for immediate access
        if (result && result.id) {
          window.currentReportData = window.currentReportData || {};
          window.currentReportData[result.id] = result;
          console.log('💾 Stored report data for immediate access');
        }
      } else {
        console.error('electronAPI.addReport is not available');
        alert('Error: Report generation API not available');
        return;
      }
      
      // Refresh reports list
      await fetchReports();
      
      // Show success message and offer to view the report immediately
      const viewNow = confirm('Report generated successfully! Would you like to view it now?');
      if (viewNow && result && result.id) {
        // View the report immediately
        setTimeout(() => {
          window.viewReport(result.id);
        }, 500); // Small delay to ensure DOM is updated
      }
    } catch (err) {
      console.error('Error generating report:', err);
      alert('Failed to generate report: ' + (err.message || 'Unknown error'));
    } finally {
      // Hide loading and re-enable button
      if (generateBtn) generateBtn.disabled = false;
      if (reportsLoading) reportsLoading.style.display = 'none';
    }
  }
  
  // Fetch reports
  async function fetchReports() {
    if (reportsLoading) reportsLoading.style.display = 'block';
    
    try {
      let reports = [];
      
      // Call API
      if (window.electronAPI && window.electronAPI.getReports) {
        reports = await window.electronAPI.getReports();
        console.log('Reports fetched:', reports);
      } else {
        console.error('electronAPI.getReports is not available');
        throw new Error('Reports API not available');
      }
      
      // Render reports
      renderReportsList(reports);
    } catch (err) {
      console.error('Error fetching reports:', err);
      if (reportsList) reportsList.innerHTML = '<p>Failed to load reports</p>';
      if (noReportsFound) noReportsFound.style.display = 'block';
    } finally {
      if (reportsLoading) reportsLoading.style.display = 'none';
    }
  }
  
  // Render reports list
  function renderReportsList(reports) {
    if (!reportsList) return;
    
    reportsList.innerHTML = '';
    
    if (!reports || reports.length === 0) {
      if (noReportsFound) noReportsFound.style.display = 'block';
      return;
    }
    
    if (noReportsFound) noReportsFound.style.display = 'none';
    
    reports.forEach(report => {
      const col = document.createElement('div');
      col.className = 'col-md-4';
      col.innerHTML = `
        <div class="card dark-card report-card h-100" tabindex="0" role="button" aria-label="View report: ${report.title}" data-id="${report.id}">
          <div class="card-body">
            <h6 class="card-title mb-1">${report.title}</h6>
            <div class="report-date mb-2">${report.date}</div>
            <div class="report-description mb-2">${report.description || ''}</div>
            <span class="badge bg-primary">${report.type}</span>
          </div>
        </div>
      `;
      reportsList.appendChild(col);
      // Add click event to the report card
      const card = col.querySelector('.report-card');
      if (card) {
        card.addEventListener('click', function() {
          if (typeof viewReport === 'function') {
            viewReport(report.id);
          } else {
            alert('Report view function not found.');
          }
        });
      }
    });
  }
});
// Toggle sidebar on mobile
document.addEventListener('DOMContentLoaded', function() {
  const toggleSidebar = document.getElementById('toggleSidebar');
  const sidebar = document.querySelector('.sidebar');
  
  if (toggleSidebar && sidebar) {
    toggleSidebar.addEventListener('click', function() {
      sidebar.classList.toggle('show');
    });
  }
  
  // Set current date in header
  const currentDate = document.getElementById('current-date');
  if (currentDate) {
    currentDate.textContent = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  
  // Add debug buttons
  console.log('🔍 Looking for content header...');
  const contentHeader = document.querySelector('.content-header');
  console.log('📍 Content header found:', !!contentHeader);
  if (contentHeader) {
    console.log('✅ Adding debug buttons...');
    // Test Report button
    const testBtn = document.createElement('button');
    testBtn.className = 'btn btn-warning btn-sm me-2';
    testBtn.innerHTML = '<i class="fas fa-bug me-1"></i>Test Report';
    testBtn.onclick = function() {
      // Create a test report with hardcoded data
      const testReport = {
        id: 'test-report-' + Date.now(),
        title: 'Test Inventory Report',
        type: 'inventory',
        date: new Date().toLocaleDateString(),
        description: 'Test report with hardcoded data',
        metrics: {
          'Total Items': '500',
          'Total Value': 'TSh 2,500,000',
          'Low Stock Items': '3',
          'Categories': '4'
        },
        charts: [{
          type: 'doughnut',
          data: {
            labels: ['Pipes', 'Fittings', 'Valves', 'Tools'],
            datasets: [{
              data: [40, 30, 20, 10],
              backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
            }]
          },
          options: {
            plugins: {
              title: { display: true, text: 'Test Chart', color: '#fff' },
              legend: { labels: { color: '#fff' } }
            }
          }
        }],
        data: [
          { 'Item ID': 'TEST-001', 'Description': 'Test Pipe', 'Quantity': 100, 'Price': 'TSh 25,000' },
          { 'Item ID': 'TEST-002', 'Description': 'Test Fitting', 'Quantity': 50, 'Price': 'TSh 5,000' }
        ]
      };
      
      // Store and view the test report
      window.currentReportData = window.currentReportData || {};
      window.currentReportData[testReport.id] = testReport;
      window.viewReport(testReport.id);
    };
    contentHeader.appendChild(testBtn);
    
    // Debug Data button
    const debugBtn = document.createElement('button');
    debugBtn.className = 'btn btn-info btn-sm me-2';
    debugBtn.innerHTML = '<i class="fas fa-search me-1"></i>Debug Data';
    debugBtn.onclick = async function() {
      console.log('🔍 DEBUG: Checking data sources...');
      
      // Check stored reports
      if (window.currentReportData) {
        console.log('💾 Stored reports:', Object.keys(window.currentReportData));
        Object.entries(window.currentReportData).forEach(([id, report]) => {
          console.log(`   ${id}: metrics=${!!report.metrics}, data=${report.data?.length || 0} rows`);
        });
      } else {
        console.log('💾 No stored reports');
      }
      
      // Check API
      if (window.electronAPI && window.electronAPI.getReports) {
        try {
          const reports = await window.electronAPI.getReports();
          console.log('📡 API reports:', reports.length);
          reports.forEach(report => {
            console.log(`   ${report.id}: ${report.title}, metrics=${!!report.metrics}, data=${report.data?.length || 0} rows`);
          });
        } catch (err) {
          console.error('❌ API error:', err);
        }
      }
      
      alert('Check console for debug info');
    };
    contentHeader.appendChild(debugBtn);
  }
});

// Function to add debug buttons
function addDebugButtons() {
  console.log('🔧 Adding debug buttons...');
  
  // Try multiple locations for the buttons
  let targetElement = document.querySelector('.content-header');
  if (!targetElement) {
    targetElement = document.querySelector('h1');
    if (targetElement) {
      targetElement = targetElement.parentElement;
    }
  }
  if (!targetElement) {
    targetElement = document.querySelector('.main-content');
  }
  if (!targetElement) {
    targetElement = document.body;
  }
  
  console.log('📍 Target element for buttons:', targetElement?.tagName, targetElement?.className);
  
  if (targetElement) {
    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 9999; display: flex; gap: 10px;';
    
    // Test Report button
    const testBtn = document.createElement('button');
    testBtn.className = 'btn btn-warning btn-sm';
    testBtn.innerHTML = '<i class="fas fa-bug"></i> Test Report';
    testBtn.style.cssText = 'background: #ffc107; color: #000; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;';
    testBtn.onclick = function() {
      console.log('🧪 Creating test report...');
      // Create a test report with hardcoded data
      const testReport = {
        id: 'test-report-' + Date.now(),
        title: 'Test Inventory Report',
        type: 'inventory',
        date: new Date().toLocaleDateString(),
        description: 'Test report with hardcoded data',
        metrics: {
          'Total Items': '500',
          'Total Value': 'TSh 2,500,000',
          'Low Stock Items': '3',
          'Categories': '4'
        },
        charts: [{
          type: 'doughnut',
          data: {
            labels: ['Pipes', 'Fittings', 'Valves', 'Tools'],
            datasets: [{
              data: [40, 30, 20, 10],
              backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
            }]
          },
          options: {
            plugins: {
              title: { display: true, text: 'Test Chart', color: '#fff' },
              legend: { labels: { color: '#fff' } }
            }
          }
        }],
        data: [
          { 'Item ID': 'TEST-001', 'Description': 'Test Pipe', 'Quantity': 100, 'Price': 'TSh 25,000' },
          { 'Item ID': 'TEST-002', 'Description': 'Test Fitting', 'Quantity': 50, 'Price': 'TSh 5,000' }
        ]
      };
      
      // Store and view the test report
      window.currentReportData = window.currentReportData || {};
      window.currentReportData[testReport.id] = testReport;
      console.log('💾 Stored test report, calling viewReport...');
      window.viewReport(testReport.id);
    };
    
    // Debug Data button
    const debugBtn = document.createElement('button');
    debugBtn.className = 'btn btn-info btn-sm';
    debugBtn.innerHTML = '<i class="fas fa-search"></i> Debug';
    debugBtn.style.cssText = 'background: #17a2b8; color: #fff; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;';
    debugBtn.onclick = async function() {
      console.log('🔍 DEBUG: Checking data sources...');
      
      // Check stored reports
      if (window.currentReportData) {
        console.log('💾 Stored reports:', Object.keys(window.currentReportData));
        Object.entries(window.currentReportData).forEach(([id, report]) => {
          console.log(`   ${id}: metrics=${!!report.metrics}, data=${report.data?.length || 0} rows`);
        });
      } else {
        console.log('💾 No stored reports');
      }
      
      // Check API
      if (window.electronAPI && window.electronAPI.getReports) {
        try {
          const reports = await window.electronAPI.getReports();
          console.log('📡 API reports:', reports.length);
          reports.forEach(report => {
            console.log(`   ${report.id}: ${report.title}, metrics=${!!report.metrics}, data=${report.data?.length || 0} rows`);
          });
        } catch (err) {
          console.error('❌ API error:', err);
        }
      }
      
      alert('Check console (F12) for debug info');
    };
    
    buttonContainer.appendChild(testBtn);
    buttonContainer.appendChild(debugBtn);
    targetElement.appendChild(buttonContainer);
    
    console.log('✅ Debug buttons added successfully');
  } else {
    console.error('❌ Could not find target element for debug buttons');
  }
}

window.viewReport = async function(reportId) {
  console.log('🔍 ViewReport called with ID:', reportId);
  
  // First try to get from stored data (for newly generated reports)
  let report = null;
  if (window.currentReportData && window.currentReportData[reportId]) {
    report = window.currentReportData[reportId];
    console.log('💾 Using stored report data');
    console.log('   Has metrics:', !!report?.metrics);
    console.log('   Has charts:', !!report?.charts);
    console.log('   Has data:', !!report?.data, 'with', report?.data?.length || 0, 'rows');
  }
  
  // If not found in stored data, fetch from main process
  if (!report && window.electronAPI && window.electronAPI.getReportById) {
    try {
      console.log('📡 Fetching report from main process...');
      report = await window.electronAPI.getReportById(reportId);
      console.log('📊 Report received from main process:', report);
      console.log('   Has metrics:', !!report?.metrics);
      console.log('   Has charts:', !!report?.charts);
      console.log('   Has data:', !!report?.data, 'with', report?.data?.length || 0, 'rows');
    } catch (err) {
      console.error('❌ Failed to fetch report details from main process:', err);
    }
  }
  
  // Fallback to window.reports array
  if (!report && window.reports && Array.isArray(window.reports)) {
    report = window.reports.find(r => r.id === reportId);
    console.log('📋 Using report from window.reports array');
  }
  // Try to get from DOM if not found
  if (!report) {
    console.warn('⚠️ Report not found via API, trying DOM fallback...');
    const card = document.querySelector(`.report-card[data-id='${reportId}']`);
    if (card) {
      report = {
        id: reportId,
        title: card.querySelector('.card-title')?.textContent || 'Report',
        description: card.querySelector('.report-description')?.textContent || '',
        date: card.querySelector('.report-date')?.textContent || '',
        type: card.querySelector('.badge')?.textContent || '',
        // DOM fallback doesn't have actual data - this is the problem!
        metrics: null,
        charts: null,
        data: null
      };
      console.warn('⚠️ Using DOM fallback - no actual report data available');
    }
  }
  if (!report) {
    console.error('❌ Report not found anywhere');
    alert('Report not found.');
    return;
  }
  
  // Check if we have actual report data
  if (!report.metrics && !report.charts && !report.data) {
    console.error('❌ Report found but has no data - this explains the zeros!');
    console.log('🔧 Report object:', report);
  }
  // Show the report in the main view
  const container = document.getElementById('current-report-container');
  if (container) {
    container.style.display = '';
    // Render the report title, date, description, and type
    container.innerHTML = `
      <div class="card dark-card mb-4 fade-in">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="card-title mb-3 text-white">${report.title || 'Report'}</h5>
            <div class="report-actions">
              <button class="btn btn-outline-primary btn-sm me-2" id="print-report-btn"><i class="fas fa-print me-1"></i>Print</button>
              <button class="btn btn-outline-success btn-sm me-2" id="export-pdf-btn"><i class="fas fa-file-pdf me-1"></i>PDF</button>
              <button class="btn btn-outline-info btn-sm me-2" id="export-csv-btn"><i class="fas fa-file-csv me-1"></i>CSV</button>
              <button class="btn btn-outline-secondary btn-sm" id="close-report-btn"><i class="fas fa-times me-1"></i>Close</button>
            </div>
          </div>
          <div class="mb-2 text-white"><i class="fas fa-calendar-alt me-2"></i>${report.date || ''}</div>
          <div class="mb-3 text-white">${report.description || ''}</div>
          <div class="mb-3"><span class="badge">${report.type || ''}</span></div>
          <div id="report-metrics" class="row mb-4"></div>
          <div class="row mb-4"><div class="col-12"><div id="report-charts-container" class="chart-container"></div></div></div>
          <div class="row"><div class="col-12"><div class="card dark-card"><div class="card-body"><h6 class="card-title mb-3">Detailed Data</h6><div class="table-responsive"><table class="table table-dark table-hover" id="report-data-table"></table></div></div></div></div></div>
        </div>
      </div>
    `;
    // Render metrics, charts, and table
    renderReportMetrics(report, document.getElementById('report-metrics'));
    renderReportCharts(report, document.getElementById('report-charts-container'));
    renderReportTable(report, document.getElementById('report-data-table'));
    // Add close button handler
    const closeBtn = document.getElementById('close-report-btn');
    if (closeBtn) {
      closeBtn.onclick = function() {
        container.style.display = 'none';
        const reportsList = document.getElementById('reports-list');
        if (reportsList) reportsList.style.display = '';
      };
    }
  }
  // Optionally hide other views (like the reports list)
  const reportsList = document.getElementById('reports-list');
  if (reportsList) reportsList.style.display = 'none';
};

// Helper: Render metrics
function renderReportMetrics(report, metricsContainer) {
  console.log('📈 Rendering metrics:', report?.metrics);
  if (!metricsContainer) {
    console.error('❌ Metrics container not found');
    return;
  }
  if (!report || !report.metrics) {
    console.error('❌ No metrics in report - showing placeholder');
    metricsContainer.innerHTML = '<div class="col-12"><p class="text-center text-white">No metrics available</p></div>';
    return;
  }
  
  metricsContainer.innerHTML = '';
  const metricsEntries = Object.entries(report.metrics);
  console.log('📊 Metrics entries:', metricsEntries);
  
  metricsEntries.forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
    const col = document.createElement('div');
    col.className = 'col-md-3 mb-3';
    col.innerHTML = `<div class="stat-card animate-fade-in"><h3>${value}</h3><p>${key}</p></div>`;
    metricsContainer.appendChild(col);
  });
  console.log('✅ Metrics rendered successfully with', metricsEntries.length, 'metrics');
}
// Helper: Render charts using Chart.js
function renderReportCharts(report, chartsContainer) {
  console.log('📊 Rendering charts:', report?.charts?.length || 0, 'charts');
  if (!chartsContainer) {
    console.error('❌ Charts container not found');
    return;
  }
  if (!report || !report.charts || !Array.isArray(report.charts)) {
    console.error('❌ No charts in report');
    chartsContainer.innerHTML = '<p class="text-center text-white">No charts available</p>';
    return;
  }
  
  chartsContainer.innerHTML = '';
  
  report.charts.forEach((chartConfig, idx) => {
    console.log(`📈 Rendering chart ${idx + 1}:`, chartConfig.type);
    const chartWrapper = document.createElement('div');
    chartWrapper.className = 'chart-wrapper mb-4';
    chartWrapper.style.cssText = 'position: relative; height: 400px; width: 100%;';
    
    const canvas = document.createElement('canvas');
    canvas.id = `report-chart-${idx}`;
    chartWrapper.appendChild(canvas);
    chartsContainer.appendChild(chartWrapper);
    
    // Create chart with proper configuration
    try {
      new Chart(canvas.getContext('2d'), {
        type: chartConfig.type,
        data: chartConfig.data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          ...chartConfig.options
        }
      });
      console.log(`✅ Chart ${idx + 1} rendered successfully`);
    } catch (error) {
      console.error(`❌ Error creating chart ${idx + 1}:`, error);
      chartWrapper.innerHTML = '<p class="text-center text-white">Error loading chart</p>';
    }
  });
}
// Helper: Render detailed data table
function renderReportTable(report, table) {
  console.log('📋 Rendering table with data:', report?.data?.length || 0, 'rows');
  if (!table) {
    console.error('❌ Table element not found');
    return;
  }
  if (!report.data || !Array.isArray(report.data)) {
    console.error('❌ No data array in report');
    table.innerHTML = '<tr><td colspan="99">No data available - missing data array</td></tr>';
    return;
  }
  table.innerHTML = '';
  if (report.data.length === 0) {
    console.warn('⚠️ Data array is empty');
    table.innerHTML = '<tr><td colspan="99">No data available - empty data array</td></tr>';
    return;
  }
  // Table header
  const headers = Object.keys(report.data[0]);
  console.log('📊 Table headers:', headers);
  const thead = document.createElement('thead');
  thead.innerHTML = '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>';
  table.appendChild(thead);
  // Table body
  const tbody = document.createElement('tbody');
  report.data.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = headers.map(h => `<td>${row[h]}</td>`).join('');
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  console.log('✅ Table rendered successfully with', report.data.length, 'rows');
}
