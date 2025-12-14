/**
 * Reports Page JavaScript - Clean Version
 * Handles report generation, display, and management
 */

// Global variables
let elements = {};
let currentReport = null;
let allReports = [];

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Reports page loaded');
  initializeElements();
  setupEventListeners();
  loadRecentReportsWithRetry();
  updateCurrentDate();
  
  // Debug button removed
});

// Load reports with retry mechanism
async function loadRecentReportsWithRetry(maxRetries = 3) {
  console.log('🔄 Loading reports with retry mechanism...');
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📡 Attempt ${attempt}/${maxRetries} to load reports`);
      await loadRecentReports();
      console.log('✅ Reports loaded successfully');
      return; // Success, exit the retry loop
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        console.error('❌ All retry attempts failed, showing fallback');
        showFallbackReportsState();
      } else {
        console.log(`⏳ Waiting 2 seconds before retry ${attempt + 1}...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
}

// Show fallback state when reports can't be loaded
function showFallbackReportsState() {
  console.log('📭 Showing fallback reports state');
  
  showLoading(false);
  
  // Create a fallback message
  if (elements.reportsList) {
    elements.reportsList.innerHTML = `
      <div class="col-12">
        <div class="card bg-dark border-warning">
          <div class="card-body text-center py-5">
            <i class="fas fa-exclamation-triangle text-warning mb-3" style="font-size: 3rem;"></i>
            <h4 class="text-warning mb-3">Reports Unavailable</h4>
            <p class="text-light mb-4">
              Unable to load reports from the database. This might be due to:
            </p>
            <ul class="list-unstyled text-start mb-4">
              <li class="mb-2"><i class="fas fa-circle text-warning me-2" style="font-size: 0.5rem;"></i> Database connection issues</li>
              <li class="mb-2"><i class="fas fa-circle text-warning me-2" style="font-size: 0.5rem;"></i> Application still initializing</li>
              <li class="mb-2"><i class="fas fa-circle text-warning me-2" style="font-size: 0.5rem;"></i> Temporary system overload</li>
            </ul>
            <div class="d-grid gap-2 d-md-flex justify-content-md-center">
              <button class="btn btn-warning" onclick="loadRecentReportsWithRetry()">
                <i class="fas fa-sync-alt me-2"></i>Try Again
              </button>
              <button class="btn btn-outline-light" onclick="location.reload()">
                <i class="fas fa-redo me-2"></i>Refresh Page
              </button>
              <button class="btn btn-danger" onclick="window.EmergencyInputFix && window.EmergencyInputFix.fix()">
                <i class="fas fa-wrench me-2"></i>Fix Inputs
              </button>
            </div>
            <p class="text-muted mt-3 small">
              You can still generate new reports using the form above.
            </p>
          </div>
        </div>
      </div>
    `;
  }
  
  // Set empty reports array
  allReports = [];
}

// Initialize DOM elements
function initializeElements() {
  console.log('🔧 Initializing elements...');
  elements = {
    reportGeneratorForm: document.getElementById('report-generator-form'),
    reportType: document.getElementById('report-type'),
    reportPeriod: document.getElementById('report-period'),
    reportFormat: document.getElementById('report-format'),
    generateReportBtn: document.getElementById('generate-report-btn'),
    reportsList: document.getElementById('reports-list'),
    reportsLoading: document.getElementById('reports-loading'),
    noReportsFound: document.getElementById('no-reports-found'),
    currentReportContainer: document.getElementById('current-report-container'),
    currentReportTitle: document.getElementById('current-report-title'),
    reportContent: document.getElementById('report-content'),
    searchReports: document.getElementById('search-reports'),
    searchReportsBtn: document.getElementById('search-reports-btn'),
    printReportBtn: document.getElementById('print-report-btn'),
    exportPdfBtn: document.getElementById('export-pdf-btn'),
    exportCsvBtn: document.getElementById('export-csv-btn'),
    closeReportBtn: document.getElementById('close-report-btn')
  };
  console.log('✅ Elements initialized:', Object.keys(elements).length);
}

// Setup event listeners
function setupEventListeners() {
  console.log('🔧 Setting up event listeners...');
  
  if (elements.reportGeneratorForm) {
    elements.reportGeneratorForm.addEventListener('submit', handleReportGeneration);
    console.log('✅ Form submission listener added');
  } else {
    console.error('❌ Report generator form not found');
  }
  
  if (elements.searchReports) {
    elements.searchReports.addEventListener('input', handleSearchReports);
  }
  
  if (elements.searchReportsBtn) {
    elements.searchReportsBtn.addEventListener('click', handleSearchReports);
  }
  
  if (elements.closeReportBtn) {
    elements.closeReportBtn.addEventListener('click', closeCurrentReport);
  }
  
  if (elements.printReportBtn) {
    elements.printReportBtn.addEventListener('click', printCurrentReport);
  }
  
  if (elements.exportPdfBtn) {
    elements.exportPdfBtn.addEventListener('click', exportReportToPDF);
  }
  
  if (elements.exportCsvBtn) {
    elements.exportCsvBtn.addEventListener('click', exportReportToCSV);
  }
  
  console.log('✅ Event listeners setup complete');
}

// Load recent reports from the backend
async function loadRecentReports() {
  console.log('🔄 Starting to load recent reports...');
  
  try {
    showLoading(true);
    
    if (!window.electronAPI) {
      console.error('❌ Electron API not available');
      showError('Application not properly initialized. Please restart the app.');
      return;
    }
    console.log('✅ Electron API is available');
    
    if (typeof window.electronAPI.getReports !== 'function') {
      console.error('❌ getReports method not found in electronAPI');
      console.log('Available methods:', Object.keys(window.electronAPI));
      showError('Reports functionality not available. Please restart the app.');
      return;
    }
    console.log('✅ getReports method found');
    
    console.log('📡 Calling electronAPI.getReports()...');
    
    // Add timeout to prevent infinite loading
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout after 10 seconds')), 10000);
    });
    
    const reports = await Promise.race([
      window.electronAPI.getReports(),
      timeoutPromise
    ]);
    
    console.log('📊 Retrieved reports:', reports);
    console.log('📊 Reports type:', typeof reports);
    console.log('📊 Reports length:', reports ? reports.length : 'N/A');
    
    if (!Array.isArray(reports)) {
      console.warn('⚠️ Reports data is not an array, converting:', reports);
      allReports = reports ? [reports] : [];
    } else {
      allReports = reports;
    }
    
    console.log('💾 Stored reports in allReports:', allReports.length);
    displayReports(allReports);
    console.log('✅ Successfully loaded reports');
    
  } catch (error) {
    console.error('❌ Failed to load reports:', error);
    
    // Show more specific error messages
    if (error.message.includes('timeout')) {
      showError('Request timed out. The database might be busy or corrupted. Please restart the app.');
    } else if (error.message.includes('Database not initialized')) {
      showError('Database not ready. Please wait a moment and refresh the page.');
    } else {
      showError(`Failed to load reports: ${error.message}`);
    }
    
    // Try to show empty state instead of infinite loading
    allReports = [];
    displayReports(allReports);
    
  } finally {
    showLoading(false);
  }
}

// Display reports in the UI
function displayReports(reports) {
  console.log('🎨 displayReports called with:', reports?.length, 'reports');
  
  if (!elements.reportsList) {
    console.error('❌ Reports list element not found');
    return;
  }
  
  elements.reportsList.innerHTML = '';
  console.log('🧹 Cleared reports list');
  
  if (!reports || reports.length === 0) {
    console.log('📭 No reports to display');
    showNoReports();
    return;
  }
  
  console.log('📋 Creating report cards...');
  reports.forEach((report, index) => {
    console.log(`📄 Creating card ${index + 1}:`, report.title);
    try {
      const reportCard = createReportCard(report);
      elements.reportsList.appendChild(reportCard);
    } catch (error) {
      console.error('❌ Error creating report card:', error);
    }
  });
  
  console.log('✅ Displayed reports successfully');
}

// Create a report card element
function createReportCard(report) {
  const col = document.createElement('div');
  col.className = 'col-md-6 col-lg-4';
  
  col.innerHTML = `
    <div class="card dark-card h-100 report-card" data-report-id="${report.id}">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <h6 class="card-title report-title">${report.title || 'Untitled Report'}</h6>
          <span class="badge">${report.type || 'Unknown'}</span>
        </div>
        <p class="card-text report-description small text-secondary">
          ${report.description || 'No description available'}
        </p>
        <div class="d-flex justify-content-between align-items-center">
          <small class="text-muted report-date">
            <i class="fas fa-calendar-alt me-1"></i>
            ${report.date || new Date(report.createdAt).toLocaleDateString()}
          </small>
          <div class="btn-group">
            <button class="btn btn-outline-primary btn-sm" onclick="viewReport('${report.id}')">
              <i class="fas fa-eye me-1"></i>View
            </button>
            <button class="btn btn-outline-danger btn-sm" onclick="deleteReport('${report.id}')" title="Delete Report">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  return col;
}

// Handle report generation form submission with non-blocking processing
async function handleReportGeneration(event) {
  event.preventDefault();
  console.log('🚀 Starting non-blocking report generation');
  
  try {
    const reportData = {
      type: elements.reportType.value,
      period: elements.reportPeriod.value,
      format: elements.reportFormat.value
    };
    
    console.log('📝 Report data:', reportData);
    
    if (!reportData.type) {
      console.warn('⚠️ No report type selected');
      showErrorMessage('Please select a report type');
      return;
    }
    
    // Show progress overlay with input field preservation
    showReportGenerationProgress();
    
    // Set form to generating state but keep inputs functional
    setFormGeneratingState(true);
    
    // Apply immediate input field recovery to ensure they stay functional
    if (window.WinLoginFix) {
      console.log('🔧 Ensuring input fields remain functional during generation...');
      window.WinLoginFix.ensureInputFunctionality();
    }
    
    // Emit operation start event for input monitoring
    document.dispatchEvent(new CustomEvent('operation-start', { detail: { type: 'report-generation' } }));
    
    let newReport;
    
    try {
      // Generate report with chunked processing and shorter timeout
      const reportTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Report generation timeout after 10 seconds')), 10000);
      });
      
      newReport = await Promise.race([
        generateReportWithProgress(reportData),
        reportTimeout
      ]);
    } catch (apiError) {
      console.warn('⚠️ API call failed, trying fallback:', apiError.message);
      try {
        newReport = await generateFallbackReport(reportData);
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError.message);
        throw new Error('Report generation failed: ' + apiError.message);
      }
    }
    
    console.log('📊 Report generated:', newReport);
    console.log('🔍 Report structure check:');
    console.log('   Has stats:', !!newReport?.stats);
    console.log('   Has metrics:', !!newReport?.metrics);
    console.log('   Has tableData:', !!newReport?.tableData);
    console.log('   Has data:', !!newReport?.data);
    console.log('   Stats object:', newReport?.stats);
    console.log('   TableData length:', newReport?.tableData?.length || 0);
    
    if (newReport) {
      allReports.unshift(newReport);
      console.log('💾 Added to local array, total reports:', allReports.length);
      
      displayReports(allReports);
      
      if (reportData.format === 'screen') {
        console.log('👁️ Showing new report');
        viewReport(newReport.id);
      }
      
      event.target.reset();
      console.log('🔄 Form reset');
      
      showSuccessMessage('Report generated successfully!');
    } else {
      console.error('❌ No report returned from API');
      showErrorMessage('Failed to generate report. Please try again.');
    }
    
  } catch (error) {
    console.error('❌ Error generating report:', error);
    showErrorMessage('Failed to generate report: ' + error.message);
  } finally {
    // Hide progress overlay
    hideReportGenerationProgress();
    
    // Reset form state
    setFormGeneratingState(false);
    
    // Emit operation end event
    document.dispatchEvent(new CustomEvent('operation-end', { detail: { type: 'report-generation' } }));
    
    // Force comprehensive input field recovery after report generation
    setTimeout(() => {
      if (window.WinLoginFix) {
        console.log('🔧 Applying comprehensive post-report input field recovery...');
        if (window.WinLoginFix.emergencyInputRecovery) {
          window.WinLoginFix.emergencyInputRecovery();
        } else if (window.WinLoginFix.fixAllInputFields) {
          window.WinLoginFix.fixAllInputFields();
        }
      }
    }, 500);
  }
}

// Reset the generate button to its default state
function resetGenerateButton() {
  if (elements.generateReportBtn) {
    elements.generateReportBtn.innerHTML = '<i class="fas fa-chart-bar me-2"></i>Generate Report';
    elements.generateReportBtn.disabled = false;
    console.log('🔄 Button reset to normal state');
  }
}

// Show report generation progress overlay
function showReportGenerationProgress() {
  console.log('📊 Showing report generation progress...');
  
  const progressOverlay = document.createElement('div');
  progressOverlay.id = 'report-progress-overlay';
  progressOverlay.innerHTML = `
    <div class="progress-content" style="
      background: rgba(26, 26, 46, 0.95);
      border-radius: 15px;
      padding: 2rem;
      text-align: center;
      max-width: 400px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    ">
      <div class="spinner-border text-primary mb-3" role="status" style="width: 3rem; height: 3rem;">
        <span class="visually-hidden">Loading...</span>
      </div>
      <h5 class="text-white mb-2">Generating Report...</h5>
      <p class="text-secondary mb-3">Processing data, please wait...</p>
      <div class="progress mb-3" style="height: 8px;">
        <div class="progress-bar progress-bar-striped progress-bar-animated bg-primary" 
             role="progressbar" style="width: 0%" id="report-progress-bar">
        </div>
      </div>
      <p class="text-muted small">
        <i class="fas fa-info-circle me-1"></i>
        Input fields remain functional during generation
      </p>
    </div>
  `;
  
  progressOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    backdrop-filter: blur(5px);
  `;
  
  document.body.appendChild(progressOverlay);
  
  // Animate progress bar
  let progress = 0;
  const progressBar = document.getElementById('report-progress-bar');
  const progressInterval = setInterval(() => {
    progress += Math.random() * 10 + 5;
    if (progress > 90) progress = 90;
    if (progressBar) {
      progressBar.style.width = progress + '%';
    }
  }, 300);
  
  // Store interval for cleanup
  progressOverlay.progressInterval = progressInterval;
}

// Hide report generation progress overlay
function hideReportGenerationProgress() {
  console.log('✅ Hiding report generation progress...');
  
  const overlay = document.getElementById('report-progress-overlay');
  if (overlay) {
    // Complete the progress bar
    const progressBar = document.getElementById('report-progress-bar');
    if (progressBar) {
      progressBar.style.width = '100%';
    }
    
    // Clear interval
    if (overlay.progressInterval) {
      clearInterval(overlay.progressInterval);
    }
    
    // Remove overlay with fade effect
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s ease-out';
    
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.remove();
      }
    }, 300);
  }
}

// Set form to generating state while keeping inputs functional
function setFormGeneratingState(isGenerating) {
  if (elements.generateReportBtn) {
    if (isGenerating) {
      elements.generateReportBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Generating...';
      elements.generateReportBtn.disabled = true;
    } else {
      elements.generateReportBtn.innerHTML = '<i class="fas fa-chart-bar me-2"></i>Generate Report';
      elements.generateReportBtn.disabled = false;
    }
  }
  
  // Keep other form elements functional - don't disable them
  console.log(isGenerating ? '⏳ Form set to generating state' : '✅ Form reset to normal state');
}

// Generate report with chunked processing to prevent UI blocking
async function generateReportWithProgress(reportData) {
  console.log('📊 Starting chunked report generation...');
  
  try {
    // Update progress incrementally
    updateProgressBar(10);
    
    // Small delay to allow UI to update
    await new Promise(resolve => setTimeout(resolve, 100));
    updateProgressBar(25);
    
    let newReport;
    
    // Handle different report types with progress updates
    if (reportData.type === 'profit') {
      console.log('💰 Generating profit report with progress tracking...');
      updateProgressBar(40);
      
      // Generate profit report with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profit report generation timeout after 20 seconds')), 20000);
      });
      
      newReport = await Promise.race([
        generateProfitReport(reportData),
        timeoutPromise
      ]);
      
      updateProgressBar(80);
    } else {
      console.log('📡 Generating standard report with progress tracking...');
      updateProgressBar(40);
      
      if (!window.electronAPI || typeof window.electronAPI.addReport !== 'function') {
        console.error('❌ addReport method not found in electronAPI');
        newReport = await generateFallbackReport(reportData);
      } else {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Report generation timeout after 15 seconds')), 15000);
        });
        
        newReport = await Promise.race([
          window.electronAPI.addReport(reportData),
          timeoutPromise
        ]);
      }
      
      updateProgressBar(80);
    }
    
    // Final processing
    await new Promise(resolve => setTimeout(resolve, 200));
    updateProgressBar(95);
    
    console.log('✅ Report generation completed');
    return newReport;
    
  } catch (error) {
    console.error('❌ Error in chunked report generation:', error);
    throw error;
  }
}

// Update progress bar percentage
function updateProgressBar(percentage) {
  const progressBar = document.getElementById('report-progress-bar');
  if (progressBar) {
    progressBar.style.width = Math.min(percentage, 100) + '%';
  }
}

// Show success message
function showSuccessMessage(message) {
  console.log('✅ Success:', message);
  
  // Create toast notification
  const toast = document.createElement('div');
  toast.className = 'toast align-items-center text-white bg-success border-0';
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        <i class="fas fa-check-circle me-2"></i>${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;
  
  // Add to toast container or create one
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    document.body.appendChild(toastContainer);
  }
  
  toastContainer.appendChild(toast);
  
  // Show toast
  const bsToast = new bootstrap.Toast(toast);
  bsToast.show();
  
  // Remove after hiding
  toast.addEventListener('hidden.bs.toast', () => {
    toast.remove();
  });
}

// Show error message
function showErrorMessage(message) {
  console.error('❌ Error:', message);
  
  // Create toast notification
  const toast = document.createElement('div');
  toast.className = 'toast align-items-center text-white bg-danger border-0';
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        <i class="fas fa-exclamation-circle me-2"></i>${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;
  
  // Add to toast container or create one
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    document.body.appendChild(toastContainer);
  }
  
  toastContainer.appendChild(toast);
  
  // Show toast
  const bsToast = new bootstrap.Toast(toast);
  bsToast.show();
  
  // Remove after hiding
  toast.addEventListener('hidden.bs.toast', () => {
    toast.remove();
  });
}

// Generate fallback report when main generation fails
async function generateFallbackReport(reportData) {
  console.log('🔄 Generating fallback report for type:', reportData.type);
  
  const now = new Date();
  const reportId = `fallback-${reportData.type}-${Date.now()}`;
  
  // Create basic report structure based on type
  let fallbackReport = {
    id: reportId,
    title: `${reportData.type.charAt(0).toUpperCase() + reportData.type.slice(1)} Report (Fallback)`,
    type: reportData.type,
    date: now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    }),
    description: `${reportData.type} report generated with sample data`,
    createdAt: now.toISOString(),
    period: reportData.period,
    format: reportData.format
  };
  
  // Add type-specific data
  switch (reportData.type) {
    case 'profit':
      fallbackReport.stats = {
        totalRevenue: 'TSh 1,650,000',
        totalCOGS: 'TSh 1,155,000',
        grossProfit: 'TSh 495,000',
        profitMargin: '30%'
      };
      fallbackReport.metrics = {
        'Total Revenue': 'TSh 1,650,000',
        'Total Cost': 'TSh 1,155,000',
        'Total Profit': 'TSh 495,000',
        'Profit Margin': '30%'
      };
      fallbackReport.tableData = [
        {
          'Product': 'PVC Pipes',
          'Revenue': 'TSh 850,000',
          'Cost': 'TSh 595,000',
          'Profit': 'TSh 255,000',
          'Margin': '30%'
        },
        {
          'Product': 'Paint & Accessories',
          'Revenue': 'TSh 450,000',
          'Cost': 'TSh 315,000',
          'Profit': 'TSh 135,000',
          'Margin': '30%'
        },
        {
          'Product': 'Hardware Items',
          'Revenue': 'TSh 350,000',
          'Cost': 'TSh 245,000',
          'Profit': 'TSh 105,000',
          'Margin': '30%'
        }
      ];
      break;
      
    case 'sales':
      fallbackReport.stats = {
        totalSales: 'TSh 1,650,000',
        profitMargin: '30%',
        unitsSold: '245',
        avgOrder: 'TSh 55,000'
      };
      fallbackReport.metrics = {
        'Total Revenue': 'TSh 1,650,000',
        'Total Transactions': '30',
        'Items Sold': '245',
        'Average Order': 'TSh 55,000'
      };
      fallbackReport.tableData = [
        {
          'Date': now.toLocaleDateString(),
          'Invoice #': 'INV-001',
          'Customer': 'Sample Customer',
          'Items': '8',
          'Total': 'TSh 85,000',
          'Payment Method': 'Cash',
          'Status': 'Completed'
        }
      ];
      break;
      
    case 'inventory':
      fallbackReport.stats = {
        totalItems: '156',
        totalValue: 'TSh 2,450,000',
        lowStockItems: '12',
        categories: '8'
      };
      fallbackReport.metrics = {
        'Total Items': '156',
        'Total Value': 'TSh 2,450,000',
        'Low Stock Items': '12',
        'Categories': '8'
      };
      fallbackReport.tableData = [
        {
          'Item ID': 'ITEM-001',
          'Description': 'PVC Pipe 4 inch',
          'Type': 'PVC Pipe',
          'Category': 'Pipes',
          'Quantity': '25',
          'Unit Cost': 'TSh 15,000',
          'Total Value': 'TSh 375,000',
          'Status': 'In Stock'
        }
      ];
      break;
      
    default:
      fallbackReport.stats = {
        totalItems: '0',
        totalValue: 'TSh 0',
        summary: 'No data available'
      };
      fallbackReport.tableData = [];
  }
  
  // Add empty charts array
  fallbackReport.charts = [];
  fallbackReport.data = fallbackReport.tableData;
  
  console.log('✅ Fallback report generated:', fallbackReport.title);
  return fallbackReport;
}

// View a specific report
function viewReport(reportId) {
  console.log('👁️ Viewing report:', reportId);
  
  const report = allReports.find(r => r.id === reportId);
  if (!report) {
    console.error('❌ Report not found:', reportId);
    alert('Report not found.');
    return;
  }
  
  console.log('🔍 Report data for viewing:');
  console.log('   Report object:', report);
  console.log('   Has stats:', !!report?.stats);
  console.log('   Has tableData:', !!report?.tableData);
  console.log('   Stats values:', report?.stats);
  console.log('   TableData sample:', report?.tableData?.[0]);
  
  currentReport = report;
  displayCurrentReport(report);
}

// Display the current report
function displayCurrentReport(report) {
  console.log('📄 Displaying current report:', report.title);
  
  if (!elements.currentReportContainer) {
    console.error('❌ Current report container not found');
    return;
  }
  
  if (elements.currentReportTitle) {
    elements.currentReportTitle.textContent = report.title || 'Report Details';
  }
  
  elements.currentReportContainer.style.display = 'block';
  
  const reportContent = generateReportContent(report);
  if (elements.reportContent) {
    elements.reportContent.innerHTML = reportContent;
  }
  
  // Render chart after content is loaded
  setTimeout(() => {
    renderReportCharts(report);
  }, 100);
  
  elements.currentReportContainer.scrollIntoView({ behavior: 'smooth' });
}

// Generate HTML content for a report
function generateReportContent(report) {
  // Special handling for customer reports
  if (report.type === 'customer') {
    return generateCustomerReportContent(report);
  }
  
  // Special handling for sales reports with pie chart
  if (report.type === 'sales') {
    return generateSalesReportContent(report);
  }
  
  // Special handling for inventory reports with pie chart
  if (report.type === 'inventory') {
    return generateInventoryReportContent(report);
  }
  
  // Special handling for profit reports
  if (report.type === 'profit') {
    return generateProfitReportContent(report);
  }
  
  // Default report layout for other report types
  return `
    <div class="row mb-4" id="report-metrics">
      <div class="col-md-3">
        <div class="stat-card">
          <h3>${report.stats?.totalSales || report.stats?.totalCustomers || '0'}</h3>
          <p>${report.type === 'customer' ? 'Total Customers' : 'Total Sales'}</p>
          <i class="fas fa-${report.type === 'customer' ? 'users' : 'dollar-sign'} icon"></i>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <h3>${report.stats?.profitMargin || report.stats?.activeCustomers || '0'}</h3>
          <p>${report.type === 'customer' ? 'Active Customers' : 'Profit Margin'}</p>
          <i class="fas fa-${report.type === 'customer' ? 'user-check' : 'percentage'} icon"></i>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <h3>${report.stats?.unitsSold || report.stats?.customerRetention || '0'}</h3>
          <p>${report.type === 'customer' ? 'Retention Rate' : 'Units Sold'}</p>
          <i class="fas fa-${report.type === 'customer' ? 'user-clock' : 'box'} icon"></i>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <h3>${report.stats?.avgOrder || report.stats?.avgOrderValue || '0'}</h3>
          <p>Avg Order Value</p>
          <i class="fas fa-shopping-cart icon"></i>
        </div>
      </div>
    </div>
    
    <div class="row mb-4">
      <div class="col-12">
        <div class="card dark-card">
          <div class="card-body">
            <h6 class="card-title mb-3">Report Chart</h6>
            <div id="report-chart-container">
              <canvas id="report-chart" width="400" height="200"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="row">
      <div class="col-12">
        <div class="card dark-card">
          <div class="card-body">
            <h6 class="card-title mb-3">Detailed Data</h6>
            <div class="table-responsive">
              <table class="table table-dark table-hover" id="report-data-table">
                ${generateReportTable(report.tableData)}
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Generate specialized content for inventory reports
function generateInventoryReportContent(report) {
  // Get the correct values from the report data
  const totalValue = report.metrics?.['Total Value'] || report.stats?.totalValue || report.stats?.totalSales || '0';
  const totalItems = report.metrics?.['Total Items'] || report.stats?.totalItems || report.stats?.unitsSold || '0';
  const lowStockItems = report.metrics?.['Low Stock Items'] || report.stats?.lowStockItems || report.summary?.lowStockItems || '0';
  const categories = report.metrics?.['Categories'] || report.stats?.categories || '0';
  
  return `
    <div class="row mb-4" id="report-metrics">
      <div class="col-md-3">
        <div class="stat-card">
          <h3>${totalValue}</h3>
          <p>Total Inventory Value</p>
          <i class="fas fa-boxes icon"></i>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <h3>${categories}</h3>
          <p>Total Categories</p>
          <i class="fas fa-tags icon"></i>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <h3>${totalItems}</h3>
          <p>Total Items</p>
          <i class="fas fa-cubes icon"></i>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <h3>${lowStockItems}</h3>
          <p>Low Stock Items</p>
          <i class="fas fa-exclamation-triangle icon" style="color: #ff6b6b;"></i>
        </div>
      </div>
    </div>
    
    <div class="row mb-4">
      <div class="col-md-8">
        <div class="card dark-card">
          <div class="card-body">
            <h6 class="card-title mb-3">Inventory Value by Category</h6>
            <div id="report-chart-container">
              <canvas id="report-chart" width="400" height="200"></canvas>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card dark-card">
          <div class="card-body">
            <h6 class="card-title mb-3">Products by Category</h6>
            <div id="pie-chart-container">
              <canvas id="pie-chart" width="200" height="200"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="row">
      <div class="col-12">
        <div class="card dark-card">
          <div class="card-body">
            <h6 class="card-title mb-3">Inventory Details</h6>
            <div class="table-responsive">
              <table class="table table-dark table-hover" id="report-data-table">
                ${generateReportTable(report.tableData)}
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    ${report.categoryBreakdown && report.categoryBreakdown.length > 0 ? `
    <div class="row mt-4">
      <div class="col-12">
        <div class="card dark-card">
          <div class="card-body">
            <h6 class="card-title mb-3">Category Breakdown</h6>
            <div class="table-responsive">
              <table class="table table-dark table-hover">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Items Count</th>
                    <th>Total Value</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  ${report.categoryBreakdown.map(category => {
                    const percentage = ((category.value / report.summary.totalValue) * 100).toFixed(1);
                    return `
                      <tr>
                        <td>${category.name}</td>
                        <td>${category.count}</td>
                        <td>${new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'TZS'
                        }).format(category.value)}</td>
                        <td>${percentage}%</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
    ` : ''}
  `;
}

// Generate specialized content for customer reports
function generateCustomerReportContent(report) {
  return `
    <div class="row mb-4" id="report-metrics">
      <div class="col-md-3">
        <div class="stat-card">
          <h3>${report.metrics?.['Total Customers'] || report.stats?.totalCustomers || '0'}</h3>
          <p>👥 Total Customers</p>
          <i class="fas fa-users icon"></i>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <h3>${report.metrics?.['Repeat Customers'] || report.stats?.activeCustomers || '0'}</h3>
          <p>✅ Repeat Customers</p>
          <i class="fas fa-user-check icon"></i>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <h3>${report.metrics?.['Total Revenue'] || report.stats?.totalRevenue || '0'}</h3>
          <p>💰 Total Revenue</p>
          <i class="fas fa-dollar-sign icon"></i>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <h3>${report.metrics?.['Average Order Value'] || report.stats?.avgOrderValue || '0'}</h3>
          <p>📊 Avg Order Value</p>
          <i class="fas fa-shopping-cart icon"></i>
        </div>
      </div>
    </div>
    
    <div class="row mb-4">
      <div class="col-md-8">
        <div class="card dark-card">
          <div class="card-body">
            <h6 class="card-title mb-3">📈 Customer Activity Over Time</h6>
            <div id="report-chart-container">
              <canvas id="report-chart" width="400" height="200"></canvas>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card dark-card">
          <div class="card-body">
            <h6 class="card-title mb-3">🏆 Top Customers</h6>
            <div id="pie-chart-container">
              <canvas id="pie-chart" width="200" height="200"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="row mb-4">
      <div class="col-md-6">
        <div class="card dark-card">
          <div class="card-body">
            <h6 class="card-title mb-3">🥇 Top Customers by Purchase Value</h6>
            <div class="table-responsive">
              <table class="table table-dark table-hover table-sm">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Total Purchases</th>
                    <th>Orders</th>
                  </tr>
                </thead>
                <tbody>
                  ${report.topCustomers?.slice(0, 5).map(customer => `
                    <tr>
                      <td>${customer.name || customer.business}</td>
                      <td class="text-success">${new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'TZS'
                      }).format(customer.totalPurchases || 0)}</td>
                      <td>${customer.purchaseCount || 0}</td>
                    </tr>
                  `).join('') || '<tr><td colspan="3" class="text-center">No data available</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card dark-card">
          <div class="card-body">
            <h6 class="card-title mb-3">📊 Customer Types</h6>
            <div class="table-responsive">
              <table class="table table-dark table-hover table-sm">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Count</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  ${report.customerTypes?.map(type => `
                    <tr>
                      <td>${type.name}</td>
                      <td>${type.count}</td>
                      <td>${type.percentage}%</td>
                    </tr>
                  `).join('') || '<tr><td colspan="3" class="text-center">No data available</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="row">
      <div class="col-12">
        <div class="card dark-card">
          <div class="card-body">
            <h6 class="card-title mb-3">📋 Customer Details</h6>
            <div class="table-responsive">
              <table class="table table-dark table-hover" id="report-data-table">
                ${generateReportTable(report.tableData)}
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Generate specialized content for sales reports
function generateSalesReportContent(report) {
  return `
    <div class="row mb-4" id="report-metrics">
      <div class="col-md-3">
        <div class="stat-card">
          <h3>${report.stats?.totalSales || '0'}</h3>
          <p>Total Sales</p>
          <i class="fas fa-dollar-sign icon"></i>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <h3>${report.stats?.profitMargin || '0'}</h3>
          <p>Profit Margin</p>
          <i class="fas fa-percentage icon"></i>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <h3>${report.stats?.unitsSold || '0'}</h3>
          <p>Units Sold</p>
          <i class="fas fa-box icon"></i>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <h3>${report.stats?.avgOrder || '0'}</h3>
          <p>Avg Order Value</p>
          <i class="fas fa-shopping-cart icon"></i>
        </div>
      </div>
    </div>
    
    <div class="row mb-4">
      <div class="col-md-8">
        <div class="card dark-card">
          <div class="card-body">
            <h6 class="card-title mb-3">Sales by Date</h6>
            <div id="report-chart-container">
              <canvas id="report-chart" width="400" height="200"></canvas>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card dark-card">
          <div class="card-body">
            <h6 class="card-title mb-3">Top Selling Products</h6>
            <div id="pie-chart-container">
              <canvas id="pie-chart" width="200" height="200"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="row">
      <div class="col-12">
        <div class="card dark-card">
          <div class="card-body">
            <h6 class="card-title mb-3">Sales Transactions</h6>
            <div class="table-responsive">
              <table class="table table-dark table-hover" id="report-data-table">
                ${generateReportTable(report.tableData)}
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Generate specialized content for profit reports
function generateProfitReportContent(report) {
  return `
    <div class="row mb-4" id="report-metrics">
      <div class="col-md-3">
        <div class="stat-card">
          <h3>${report.stats?.totalRevenue || '0'}</h3>
          <p>💰 Total Revenue</p>
          <i class="fas fa-dollar-sign icon"></i>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <h3>${report.stats?.totalCOGS || '0'}</h3>
          <p>📦 Cost of Goods Sold</p>
          <i class="fas fa-box icon"></i>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <h3>${report.stats?.grossProfit || '0'}</h3>
          <p>📈 Gross Profit</p>
          <i class="fas fa-chart-line icon"></i>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <h3>${report.stats?.profitMargin || '0'}%</h3>
          <p>📊 Profit Margin</p>
          <i class="fas fa-percentage icon"></i>
        </div>
      </div>
    </div>
    
    <div class="row mb-4">
      <div class="col-md-8">
        <div class="card dark-card">
          <div class="card-body">
            <h6 class="card-title mb-3">📈 Profit Trend Over Time</h6>
            <div id="report-chart-container">
              <canvas id="report-chart" width="400" height="200"></canvas>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card dark-card">
          <div class="card-body">
            <h6 class="card-title mb-3">🥧 Profit by Category</h6>
            <div id="pie-chart-container">
              <canvas id="pie-chart" width="200" height="200"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="row mb-4">
      <div class="col-md-6">
        <div class="card dark-card">
          <div class="card-body">
            <h6 class="card-title mb-3">🏆 Most Profitable Products</h6>
            <div class="table-responsive">
              <table class="table table-dark table-hover table-sm">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Profit</th>
                    <th>Margin</th>
                  </tr>
                </thead>
                <tbody>
                  ${report.topProfitableProducts?.slice(0, 5).map(product => `
                    <tr>
                      <td>${product.name}</td>
                      <td class="text-success">${new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'TZS'
                      }).format(product.profit)}</td>
                      <td>${product.margin}%</td>
                    </tr>
                  `).join('') || '<tr><td colspan="3" class="text-center">No data available</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card dark-card">
          <div class="card-body">
            <h6 class="card-title mb-3">📊 Category Performance</h6>
            <div class="table-responsive">
              <table class="table table-dark table-hover table-sm">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Revenue</th>
                    <th>Profit</th>
                  </tr>
                </thead>
                <tbody>
                  ${report.categoryBreakdown?.map(category => `
                    <tr>
                      <td>${category.name}</td>
                      <td>${new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'TZS'
                      }).format(category.revenue)}</td>
                      <td class="text-success">${new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'TZS'
                      }).format(category.profit)}</td>
                    </tr>
                  `).join('') || '<tr><td colspan="3" class="text-center">No data available</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="row">
      <div class="col-12">
        <div class="card dark-card">
          <div class="card-body">
            <h6 class="card-title mb-3">📋 Detailed Profit Analysis</h6>
            <div class="table-responsive">
              <table class="table table-dark table-hover" id="report-data-table">
                ${generateReportTable(report.tableData)}
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Generate table HTML for report data
function generateReportTable(tableData) {
  if (!tableData || tableData.length === 0) {
    return '<tbody><tr><td colspan="100%" class="text-center">No data available</td></tr></tbody>';
  }
  
  const headers = Object.keys(tableData[0]);
  
  let html = '<thead><tr>';
  headers.forEach(header => {
    html += `<th>${header}</th>`;
  });
  html += '</tr></thead><tbody>';
  
  tableData.forEach(row => {
    html += '<tr>';
    headers.forEach(header => {
      html += `<td>${row[header] || ''}</td>`;
    });
    html += '</tr>';
  });
  
  html += '</tbody>';
  return html;
}

// Handle search functionality
function handleSearchReports() {
  const searchTerm = elements.searchReports.value.toLowerCase().trim();
  
  if (!searchTerm) {
    displayReports(allReports);
    return;
  }
  
  const filteredReports = allReports.filter(report => {
    return (
      (report.title && report.title.toLowerCase().includes(searchTerm)) ||
      (report.type && report.type.toLowerCase().includes(searchTerm)) ||
      (report.description && report.description.toLowerCase().includes(searchTerm))
    );
  });
  
  displayReports(filteredReports);
}

// Close the current report view
function closeCurrentReport() {
  if (elements.currentReportContainer) {
    elements.currentReportContainer.style.display = 'none';
  }
  currentReport = null;
}

// Show/hide loading state
function showLoading(show) {
  console.log('⏳ Setting loading state:', show);
  if (elements.reportsLoading) {
    elements.reportsLoading.style.display = show ? 'block' : 'none';
  }
  if (elements.noReportsFound) {
    elements.noReportsFound.style.display = 'none';
  }
}

// Show no reports message
function showNoReports() {
  console.log('📭 Showing no reports message');
  if (elements.reportsLoading) {
    elements.reportsLoading.style.display = 'none';
  }
  if (elements.noReportsFound) {
    elements.noReportsFound.style.display = 'block';
  }
}

// Show error message
function showError(message) {
  console.log('❌ Showing error:', message);
  if (elements.reportsLoading) {
    elements.reportsLoading.style.display = 'none';
  }
  if (elements.noReportsFound) {
    elements.noReportsFound.style.display = 'block';
    elements.noReportsFound.innerHTML = `
      <i class="fas fa-exclamation-triangle fa-3x mb-3" style="color: var(--danger);"></i>
      <p>${message}</p>
      <button class="btn btn-primary" onclick="loadRecentReports()">
        <i class="fas fa-refresh me-2"></i>Try Again
      </button>
    `;
  }
}

// Update current date display
function updateCurrentDate() {
  const currentDateElement = document.getElementById('current-date');
  if (currentDateElement) {
    const now = new Date();
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    currentDateElement.textContent = now.toLocaleDateString('en-US', options);
  }
}

// Global error handler
window.addEventListener('error', function(event) {
  console.error('❌ Global error caught:', event.error);
  
  if (elements && elements.reportsLoading) {
    elements.reportsLoading.style.display = 'none';
  }
  
  if (elements && elements.noReportsFound) {
    elements.noReportsFound.style.display = 'block';
    elements.noReportsFound.innerHTML = `
      <i class="fas fa-exclamation-triangle fa-3x mb-3" style="color: var(--danger);"></i>
      <p>Error loading reports. Please try refreshing the page.</p>
      <p class="small text-danger">Error details: ${event.error?.message || 'Unknown error'}</p>
    `;
  }
});

// Generate profit report with real data
async function generateProfitReport(reportData) {
  console.log('💰 Generating profit report with real data...');
  
  try {
    // Call the backend profit report generation function
    console.log('📡 Calling backend generateProfitReport...');
    const profitReportData = await window.electronAPI.generateProfitReport(reportData.period);
    
    console.log('📊 Retrieved profit report data:', profitReportData);
    
    // Create report object with backend data
    const now = new Date();
    const report = {
      id: `profit-report-${Date.now()}`,
      title: 'Profit & Loss Report',
      type: 'profit',
      date: now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      description: 'Comprehensive profit analysis with revenue, costs, and margins',
      createdAt: now.toISOString(),
      period: reportData.period,
      format: reportData.format,
      stats: {
        totalRevenue: profitReportData.metrics?.['Total Revenue'] || 'TSh 0',
        totalCOGS: profitReportData.metrics?.['Total Cost'] || 'TSh 0',
        grossProfit: profitReportData.metrics?.['Total Profit'] || 'TSh 0',
        profitMargin: profitReportData.metrics?.['Profit Margin'] || '0%'
      },
      metrics: profitReportData.metrics || {},
      chartData: profitReportData.charts?.[0]?.data || {
        labels: [],
        datasets: []
      },
      pieChartData: profitReportData.pieChart?.data || {
        labels: [],
        datasets: []
      },
      tableData: profitReportData.data || profitReportData.tableData || [],
      categoryBreakdown: profitReportData.categoryBreakdown || [],
      topProfitableProducts: profitReportData.topProfitableProducts || [],
      summary: profitReportData.summary || {}
    };
    
    console.log('✅ Profit report generated successfully');
    return report;
    
  } catch (error) {
    console.error('❌ Error generating profit report:', error);
    throw error;
  }
}

// Calculate profit metrics from sales and inventory data
function calculateProfitMetrics(salesData, inventoryData, period) {
  console.log('🧮 Calculating profit metrics...');
  
  // Filter sales by period
  const filteredSales = filterSalesByPeriod(salesData || [], period);
  
  // Create inventory lookup for cost prices
  const inventoryLookup = {};
  (inventoryData || []).forEach(item => {
    inventoryLookup[item.id] = {
      costPrice: parseFloat(item.cost_price || item.buying_price || 0),
      sellingPrice: parseFloat(item.selling_price || 0),
      type: item.type || 'Unknown'
    };
  });
  
  let totalRevenue = 0;
  let totalCOGS = 0;
  let totalTransactions = filteredSales.length;
  let totalItemsSold = 0;
  
  // Timeline data (last 30 days)
  const timeline = generateTimeline(30);
  const categoryMap = new Map();
  const productMap = new Map();
  const detailedData = [];
  
  // Process each sale
  filteredSales.forEach(sale => {
    const saleDate = new Date(sale.created_at || sale.createdAt);
    const saleTotal = parseFloat(sale.total_amount || 0);
    totalRevenue += saleTotal;
    
    // Process sale items
    const items = sale.items || [];
    items.forEach(item => {
      const productId = item.product_id || item.itemId || item.id;
      const quantity = parseInt(item.quantity || 0);
      const unitPrice = parseFloat(item.unit_price || item.price || 0);
      const itemRevenue = quantity * unitPrice;
      
      totalItemsSold += quantity;
      
      // Get cost from inventory
      const inventoryItem = inventoryLookup[productId];
      const costPrice = inventoryItem?.costPrice || 0;
      const itemCOGS = quantity * costPrice;
      const itemProfit = itemRevenue - itemCOGS;
      
      totalCOGS += itemCOGS;
      
      // Category tracking
      const category = inventoryItem?.type || 'Unknown';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { name: category, revenue: 0, cost: 0, profit: 0 });
      }
      const categoryData = categoryMap.get(category);
      categoryData.revenue += itemRevenue;
      categoryData.cost += itemCOGS;
      categoryData.profit += itemProfit;
      
      // Product tracking
      const productName = item.product_name || item.name || 'Unknown Product';
      if (!productMap.has(productId)) {
        productMap.set(productId, {
          id: productId,
          name: productName,
          revenue: 0,
          cost: 0,
          profit: 0,
          quantity: 0,
          margin: 0
        });
      }
      const productData = productMap.get(productId);
      productData.revenue += itemRevenue;
      productData.cost += itemCOGS;
      productData.profit += itemProfit;
      productData.quantity += quantity;
      productData.margin = productData.revenue > 0 ? 
        ((productData.profit / productData.revenue) * 100) : 0;
      
      // Add to timeline
      const dateKey = saleDate.toISOString().split('T')[0];
      const timelineIndex = timeline.labels.indexOf(dateKey);
      if (timelineIndex >= 0) {
        timeline.revenue[timelineIndex] += itemRevenue;
        timeline.costs[timelineIndex] += itemCOGS;
        timeline.profit[timelineIndex] += itemProfit;
      }
      
      // Detailed data
      detailedData.push({
        'Date': saleDate.toLocaleDateString(),
        'Product': productName,
        'Quantity': quantity,
        'Unit Price': formatCurrency(unitPrice),
        'Revenue': formatCurrency(itemRevenue),
        'Cost': formatCurrency(itemCOGS),
        'Profit': formatCurrency(itemProfit),
        'Margin %': ((itemRevenue > 0 ? (itemProfit / itemRevenue) * 100 : 0)).toFixed(2)
      });
    });
  });
  
  const grossProfit = totalRevenue - totalCOGS;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
  
  // Convert maps to arrays and sort
  const categoryBreakdown = Array.from(categoryMap.values())
    .sort((a, b) => b.profit - a.profit);
  
  const topProfitableProducts = Array.from(productMap.values())
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 10);
  
  console.log('✅ Profit metrics calculated:', {
    totalRevenue,
    totalCOGS,
    grossProfit,
    profitMargin: profitMargin.toFixed(2) + '%'
  });
  
  return {
    totalRevenue,
    totalCOGS,
    grossProfit,
    profitMargin,
    totalTransactions,
    totalItemsSold,
    averageOrderValue,
    timeline,
    categoryBreakdown,
    topProfitableProducts,
    detailedData
  };
}

// Filter sales by period
function filterSalesByPeriod(sales, period) {
  if (!period || period === 'all') return sales;
  
  const now = new Date();
  let startDate;
  
  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      return sales;
  }
  
  return sales.filter(sale => {
    const saleDate = new Date(sale.created_at || sale.createdAt);
    return saleDate >= startDate;
  });
}

// Generate timeline for charts
function generateTimeline(days) {
  const labels = [];
  const revenue = [];
  const costs = [];
  const profit = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    labels.push(date.toISOString().split('T')[0]);
    revenue.push(0);
    costs.push(0);
    profit.push(0);
  }
  
  return { labels, revenue, costs, profit };
}

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
}

// Capture chart images for PDF export
async function captureChartImages() {
  const images = {};
  
  try {
    // Capture main chart
    const mainChart = document.getElementById('report-chart');
    if (mainChart && window.reportChart) {
      images.mainChart = window.reportChart.toBase64Image('image/png', 1.0);
    }
    
    // Capture pie chart
    const pieChart = document.getElementById('pie-chart');
    if (pieChart && window.pieChart) {
      images.pieChart = window.pieChart.toBase64Image('image/png', 1.0);
    }
    
    console.log('📸 Chart images captured successfully');
  } catch (error) {
    console.error('❌ Error capturing chart images:', error);
  }
  
  return images;
}

// Generate enhanced PDF report content
function generateEnhancedPDFReport(report, chartImages = {}) {
  const { mainChart, pieChart } = chartImages;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${report.title} - PDF Export</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }
        
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          background: white;
          box-shadow: 0 0 30px rgba(0,0,0,0.1);
        }
        
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 15px;
          margin-bottom: 30px;
          position: relative;
          overflow: hidden;
        }
        
        .header::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(255,255,255,0.1) 10px,
            rgba(255,255,255,0.1) 20px
          );
          animation: slide 20s linear infinite;
        }
        
        @keyframes slide {
          0% { transform: translateX(-50px); }
          100% { transform: translateX(50px); }
        }
        
        .header-content {
          position: relative;
          z-index: 2;
        }
        
        .company-logo {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        
        .header h1 {
          font-size: 32px;
          margin: 15px 0;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .header p {
          font-size: 16px;
          opacity: 0.9;
          margin: 5px 0;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin: 30px 0;
        }
        
        .stat-card {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          padding: 25px;
          border-radius: 15px;
          text-align: center;
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
          transform: translateY(0);
          transition: transform 0.3s ease;
        }
        
        .stat-card:hover {
          transform: translateY(-5px);
        }
        
        .stat-card h3 {
          font-size: 28px;
          margin-bottom: 10px;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        }
        
        .stat-card p {
          font-size: 14px;
          opacity: 0.9;
          font-weight: 500;
        }
        
        .charts-section {
          margin: 40px 0;
        }
        
        .charts-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 30px;
          margin: 20px 0;
        }
        
        .chart-container {
          background: white;
          padding: 25px;
          border-radius: 15px;
          box-shadow: 0 5px 20px rgba(0,0,0,0.1);
          border: 1px solid #e0e0e0;
        }
        
        .chart-container h4 {
          color: #333;
          margin-bottom: 20px;
          font-size: 18px;
          text-align: center;
          padding-bottom: 10px;
          border-bottom: 2px solid #667eea;
        }
        
        .chart-container img {
          width: 100%;
          height: auto;
          border-radius: 10px;
        }
        
        .table-section {
          margin: 30px 0;
          background: white;
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 5px 20px rgba(0,0,0,0.1);
        }
        
        .table-section h4 {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          margin: 0;
          font-size: 18px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        
        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e0e0e0;
        }
        
        th {
          background: #f8f9fa;
          font-weight: 600;
          color: #333;
        }
        
        tbody tr:nth-child(even) {
          background: #f8f9fa;
        }
        
        tbody tr:hover {
          background: #e3f2fd;
        }
        
        .footer {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 25px;
          text-align: center;
          border-radius: 15px;
          margin-top: 40px;
        }
        
        .footer p {
          margin: 5px 0;
          opacity: 0.9;
        }
        
        @media print {
          body {
            background: white !important;
          }
          
          .container {
            box-shadow: none;
            max-width: none;
            margin: 0;
            padding: 10px;
          }
          
          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
          }
          
          .stat-card {
            padding: 15px;
          }
          
          .stat-card h3 {
            font-size: 20px;
          }
          
          table {
            font-size: 10px;
          }
          
          th, td {
            padding: 8px;
          }
          
          .charts-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-content">
            <div class="company-logo">📊 PIPE INVENTORY SYSTEM</div>
            <h1>${report.title}</h1>
            <p>📅 Generated on: ${new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
            <p>⏰ Period: ${report.period?.label || 'All Time'}</p>
            ${report.description ? `<p>📋 ${report.description}</p>` : ''}
          </div>
        </div>
        
        <div class="stats-grid">
          <div class="stat-card">
            <h3>${report.stats?.totalRevenue || report.stats?.totalSales || '0'}</h3>
            <p>💰 ${report.type === 'profit' ? 'Total Revenue' : report.type === 'inventory' ? 'Total Value' : 'Total Sales'}</p>
          </div>
          <div class="stat-card">
            <h3>${report.stats?.totalCOGS || report.stats?.profitMargin || '0'}</h3>
            <p>📦 ${report.type === 'profit' ? 'Cost of Goods Sold' : 'Profit Margin'}</p>
          </div>
          <div class="stat-card">
            <h3>${report.stats?.grossProfit || report.stats?.unitsSold || '0'}</h3>
            <p>📈 ${report.type === 'profit' ? 'Gross Profit' : report.type === 'inventory' ? 'Total Items' : 'Units Sold'}</p>
          </div>
          <div class="stat-card">
            <h3>${report.stats?.profitMargin || report.stats?.avgOrder || '0'}${report.type === 'profit' ? '%' : ''}</h3>
            <p>📊 ${report.type === 'profit' ? 'Profit Margin' : 'Average Order'}</p>
          </div>
        </div>
        
        ${mainChart || pieChart ? `
        <div class="charts-section">
          <div class="charts-grid">
            ${mainChart ? `
            <div class="chart-container">
              <h4>📊 ${getChartTitle(report.type, 'main')}</h4>
              <img src="${mainChart}" alt="Main Chart" />
            </div>
            ` : ''}
            ${pieChart ? `
            <div class="chart-container">
              <h4>🥧 ${getChartTitle(report.type, 'pie')}</h4>
              <img src="${pieChart}" alt="Pie Chart" />
            </div>
            ` : ''}
          </div>
        </div>
        ` : ''}
        
        ${report.tableData && report.tableData.length > 0 ? `
        <div class="table-section">
          <h4>📋 ${getTableTitle(report.type)}</h4>
          <table>
            <thead>
              <tr>
                ${Object.keys(report.tableData[0]).map(header => `<th>${header}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${report.tableData.slice(0, 25).map(row => `
                <tr>
                  ${Object.keys(row).map(key => `<td>${row[key] || ''}</td>`).join('')}
                </tr>
              `).join('')}
              ${report.tableData.length > 25 ? `
                <tr>
                  <td colspan="${Object.keys(report.tableData[0]).length}" style="text-align: center; font-style: italic; color: #666; padding: 20px;">
                    ... and ${report.tableData.length - 25} more items (download CSV for complete data)
                  </td>
                </tr>
              ` : ''}
            </tbody>
          </table>
        </div>
        ` : ''}
        
        ${generateAdditionalSections(report)}
        
        <div class="footer">
          <div class="company-logo">📊 PIPE INVENTORY MANAGEMENT SYSTEM</div>
          <p>🏢 Professional Business Reports & Analytics</p>
          <p>📄 Report ID: ${report.id}</p>
          <p>⏰ Generated at: ${new Date().toLocaleString()}</p>
          <p>🌐 Powered by Advanced Reporting Engine</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Generate enhanced CSV content
function generateEnhancedCSVContent(report) {
  let csvContent = '';
  
  // Report header with metadata
  csvContent += `"${report.title}"\n`;
  csvContent += `"Generated on: ${new Date().toLocaleDateString()}"\n`;
  csvContent += `"Period: ${report.period?.label || 'All Time'}"\n`;
  csvContent += `"Report Type: ${report.type.toUpperCase()}"\n`;
  csvContent += `"Report ID: ${report.id}"\n\n`;
  
  // Key metrics section
  csvContent += '"KEY METRICS"\n';
  if (report.stats) {
    Object.entries(report.stats).forEach(([key, value]) => {
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      csvContent += `"${label}","${value}"\n`;
    });
  }
  csvContent += '\n';
  
  // Main table data
  if (report.tableData && report.tableData.length > 0) {
    csvContent += '"DETAILED DATA"\n';
    const headers = Object.keys(report.tableData[0]);
    
    // Add headers
    csvContent += headers.map(header => `"${header}"`).join(',') + '\n';
    
    // Add data rows
    report.tableData.forEach(row => {
      const values = headers.map(header => {
        const value = row[header] || '';
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvContent += values.join(',') + '\n';
    });
    csvContent += '\n';
  }
  
  // Category breakdown (for inventory and profit reports)
  if (report.categoryBreakdown && report.categoryBreakdown.length > 0) {
    csvContent += '"CATEGORY BREAKDOWN"\n';
    
    if (report.type === 'profit') {
      csvContent += '"Category","Revenue","Cost","Profit"\n';
      report.categoryBreakdown.forEach(category => {
        csvContent += `"${category.name}","${category.revenue || 0}","${category.cost || 0}","${category.profit || 0}"\n`;
      });
    } else {
      csvContent += '"Category","Items Count","Total Value","Percentage"\n';
      report.categoryBreakdown.forEach(category => {
        const percentage = report.summary?.totalValue ? 
          ((category.value / report.summary.totalValue) * 100).toFixed(1) : '0';
        csvContent += `"${category.name}","${category.count || 0}","${category.value || 0}","${percentage}%"\n`;
      });
    }
    csvContent += '\n';
  }
  
  // Top profitable products (for profit reports)
  if (report.topProfitableProducts && report.topProfitableProducts.length > 0) {
    csvContent += '"TOP PROFITABLE PRODUCTS"\n';
    csvContent += '"Product","Revenue","Cost","Profit","Margin %","Quantity Sold"\n';
    
    report.topProfitableProducts.forEach(product => {
      csvContent += `"${product.name}","${product.revenue || 0}","${product.cost || 0}","${product.profit || 0}","${product.margin || 0}","${product.quantity || 0}"\n`;
    });
    csvContent += '\n';
  }
  
  // Top products (for sales reports)
  if (report.topProducts && report.topProducts.length > 0) {
    csvContent += '"TOP SELLING PRODUCTS"\n';
    csvContent += '"Product","Quantity Sold","Revenue"\n';
    
    report.topProducts.forEach(product => {
      csvContent += `"${product.name}","${product.quantity}","${product.revenue}"\n`;
    });
    csvContent += '\n';
  }
  
  // Summary section
  if (report.summary) {
    csvContent += '"SUMMARY"\n';
    Object.entries(report.summary).forEach(([key, value]) => {
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      csvContent += `"${label}","${value}"\n`;
    });
  }
  
  return csvContent;
}

// Helper functions for PDF generation
function getChartTitle(reportType, chartType) {
  const titles = {
    profit: {
      main: 'Profit Trend Over Time',
      pie: 'Profit by Category'
    },
    sales: {
      main: 'Sales by Date',
      pie: 'Top Selling Products'
    },
    inventory: {
      main: 'Inventory Value by Category',
      pie: 'Products by Category'
    },
    customer: {
      main: 'Customer Activity',
      pie: 'Customer Distribution'
    }
  };
  
  return titles[reportType]?.[chartType] || 'Chart';
}

function getTableTitle(reportType) {
  const titles = {
    profit: 'Detailed Profit Analysis',
    sales: 'Sales Transactions',
    inventory: 'Inventory Details',
    customer: 'Customer Information'
  };
  
  return titles[reportType] || 'Data Table';
}

function generateAdditionalSections(report) {
  let sections = '';
  
  // Profit report specific sections
  if (report.type === 'profit') {
    if (report.topProfitableProducts && report.topProfitableProducts.length > 0) {
      sections += `
        <div class="table-section">
          <h4>🏆 Most Profitable Products</h4>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Revenue</th>
                <th>Cost</th>
                <th>Profit</th>
                <th>Margin %</th>
                <th>Qty Sold</th>
              </tr>
            </thead>
            <tbody>
              ${report.topProfitableProducts.slice(0, 10).map(product => `
                <tr>
                  <td>${product.name}</td>
                  <td>${formatCurrency(product.revenue)}</td>
                  <td>${formatCurrency(product.cost)}</td>
                  <td style="color: #4caf50; font-weight: bold;">${formatCurrency(product.profit)}</td>
                  <td>${product.margin.toFixed(2)}%</td>
                  <td>${product.quantity}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
  }
  
  // Category breakdown for inventory reports
  if (report.type === 'inventory' && report.categoryBreakdown && report.categoryBreakdown.length > 0) {
    sections += `
      <div class="table-section">
        <h4>🏷️ Category Breakdown</h4>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Items Count</th>
              <th>Total Value</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            ${report.categoryBreakdown.map(category => {
              const percentage = report.summary?.totalValue ? 
                ((category.value / report.summary.totalValue) * 100).toFixed(1) : '0';
              return `
                <tr>
                  <td>${category.name}</td>
                  <td>${category.count}</td>
                  <td>${formatCurrency(category.value)}</td>
                  <td>${percentage}%</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
  
  return sections;
}

// Delete report function
function deleteReport(reportId) {
  console.log('🗑️ Deleting report:', reportId);
  
  const report = allReports.find(r => r.id === reportId);
  if (!report) {
    console.error('❌ Report not found:', reportId);
    alert('Report not found.');
    return;
  }
  
  // Confirm deletion
  if (confirm(`Are you sure you want to delete "${report.title}"? This action cannot be undone.`)) {
    try {
      // Remove from local array
      const index = allReports.findIndex(r => r.id === reportId);
      if (index > -1) {
        allReports.splice(index, 1);
        console.log('✅ Report removed from local array');
      }
      
      // Try to delete from backend if available
      if (window.electronAPI && window.electronAPI.deleteReport) {
        window.electronAPI.deleteReport(reportId).catch(error => {
          console.warn('⚠️ Could not delete from backend:', error.message);
        });
      }
      
      // Refresh the display
      displayReports(allReports);
      
      // Close report view if it's currently open
      if (currentReport && currentReport.id === reportId) {
        closeCurrentReport();
      }
      
      console.log('✅ Report deleted successfully');
      alert('Report deleted successfully!');
      
    } catch (error) {
      console.error('❌ Error deleting report:', error);
      alert('Failed to delete report: ' + error.message);
    }
  }
}

console.log('✅ Reports.js loaded successfully');

// Render charts for current report
function renderReportCharts(report) {
  console.log('📊 Rendering charts for report:', report.title);
  
  setTimeout(() => {
    // Render main chart
    const canvas = document.getElementById('report-chart');
    const chartData = report.chartData || (report.charts && report.charts[0] ? report.charts[0].data : null);
    if (canvas && chartData) {
      try {
        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart if it exists
        if (window.reportChart) {
          window.reportChart.destroy();
        }
        
        const chartType = report.charts && report.charts[0] ? report.charts[0].type : 'bar';
        window.reportChart = new Chart(ctx, {
          type: chartType,
          data: chartData,
          options: {
            responsive: true,
            plugins: {
              legend: {
                labels: {
                  color: '#ffffff'
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  color: '#ffffff'
                },
                grid: {
                  color: 'rgba(255, 255, 255, 0.1)'
                }
              },
              x: {
                ticks: {
                  color: '#ffffff'
                },
                grid: {
                  color: 'rgba(255, 255, 255, 0.1)'
                }
              }
            }
          }
        });
        console.log('✅ Main chart rendered successfully');
      } catch (error) {
        console.error('❌ Error rendering main chart:', error);
      }
    }
    
    // Render pie chart if available (for sales reports)
    const pieCanvas = document.getElementById('pie-chart');
    const pieChartData = report.pieChartData || (report.pieChart ? report.pieChart.data : null);
    if (pieCanvas && pieChartData) {
      try {
        const pieCtx = pieCanvas.getContext('2d');
        
        // Destroy existing pie chart if it exists
        if (window.pieChart) {
          window.pieChart.destroy();
        }
        
        window.pieChart = new Chart(pieCtx, {
          type: 'pie',
          data: pieChartData,
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'right',
                labels: {
                  color: '#ffffff',
                  font: {
                    size: 12
                  }
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const label = context.label || '';
                    const value = context.raw || 0;
                    const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                    const percentage = Math.round((value / total) * 100);
                    return `${label}: ${value} (${percentage}%)`;
                  }
                }
              }
            }
          }
        });
        console.log('✅ Pie chart rendered successfully');
      } catch (error) {
        console.error('❌ Error rendering pie chart:', error);
      }
    }
  }, 100); // Small delay to ensure DOM is ready
}

// Print current report
function printCurrentReport() {
  if (!currentReport) {
    alert('No report is currently displayed');
    return;
  }
  
  console.log('🖨️ Printing report:', currentReport.title);
  
  try {
    // Show loading state
    const originalText = elements.printReportBtn.innerHTML;
    elements.printReportBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Preparing...';
    elements.printReportBtn.disabled = true;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    const printContent = generatePrintableReport(currentReport);
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = function() {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
        
        // Reset button
        elements.printReportBtn.innerHTML = originalText;
        elements.printReportBtn.disabled = false;
      }, 1000);
    };
    
    // Reset button if window fails to load
    setTimeout(() => {
      elements.printReportBtn.innerHTML = originalText;
      elements.printReportBtn.disabled = false;
    }, 5000);
    
  } catch (error) {
    console.error('❌ Error printing report:', error);
    alert('Failed to print report: ' + error.message);
    
    // Reset button
    elements.printReportBtn.innerHTML = '<i class="fas fa-print me-2"></i>Print Report';
    elements.printReportBtn.disabled = false;
  }
}

// Export current report to PDF
async function exportReportToPDF() {
  if (!currentReport) {
    alert('No report is currently displayed');
    return;
  }
  
  console.log('📄 Exporting report to PDF:', currentReport.title);
  
  try {
    // Show loading state
    const originalText = elements.exportPdfBtn.innerHTML;
    elements.exportPdfBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Generating PDF...';
    elements.exportPdfBtn.disabled = true;
    
    // Capture chart images for PDF
    const chartImages = await captureChartImages();
    
    // Create enhanced PDF content
    const pdfContent = generateEnhancedPDFReport(currentReport, chartImages);
    
    // Create a new window with PDF content
    const pdfWindow = window.open('', '_blank', 'width=1200,height=800');
    pdfWindow.document.write(pdfContent);
    pdfWindow.document.close();
    
    // Wait for content to load then trigger print dialog
    pdfWindow.onload = function() {
      setTimeout(() => {
        pdfWindow.print();
      }, 1500);
    };
    
    // Reset button
    setTimeout(() => {
      elements.exportPdfBtn.innerHTML = originalText;
      elements.exportPdfBtn.disabled = false;
    }, 2000);
    
    console.log('✅ Enhanced PDF export initiated');
    
  } catch (error) {
    console.error('❌ Error exporting PDF:', error);
    alert('Failed to export PDF: ' + error.message);
    
    // Reset button
    elements.exportPdfBtn.innerHTML = '<i class="fas fa-file-pdf me-2"></i>Export PDF';
    elements.exportPdfBtn.disabled = false;
  }
}

// Export current report to CSV
function exportReportToCSV() {
  if (!currentReport) {
    alert('No report is currently displayed');
    return;
  }
  
  console.log('📊 Exporting report to CSV:', currentReport.title);
  
  try {
    // Show loading state
    const originalText = elements.exportCsvBtn.innerHTML;
    elements.exportCsvBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Generating CSV...';
    elements.exportCsvBtn.disabled = true;
    
    let csvContent = generateEnhancedCSVContent(currentReport);
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const filename = `${currentReport.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
    
    // Reset button
    elements.exportCsvBtn.innerHTML = originalText;
    elements.exportCsvBtn.disabled = false;
    
    console.log('✅ CSV export completed:', filename);
    
  } catch (error) {
    console.error('❌ Error exporting CSV:', error);
    alert('Failed to export CSV: ' + error.message);
    
    // Reset button
    elements.exportCsvBtn.innerHTML = '<i class="fas fa-file-csv me-2"></i>Export CSV';
    elements.exportCsvBtn.disabled = false;
  }
}

// Generate printable HTML content
function generatePrintableReport(report) {
  const chartCanvas = document.getElementById('report-chart');
  const pieChartCanvas = document.getElementById('pie-chart');
  
  let chartImage = '';
  let pieChartImage = '';
  
  // Capture chart images
  if (chartCanvas) {
    chartImage = chartCanvas.toDataURL('image/png');
  }
  
  if (pieChartCanvas) {
    pieChartImage = pieChartCanvas.toDataURL('image/png');
  }
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${report.title}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 20px;
          background: white;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #007bff;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #007bff;
          margin: 0;
          font-size: 28px;
        }
        .header p {
          margin: 5px 0;
          color: #666;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .stat-card {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        }
        .stat-card h3 {
          color: #007bff;
          margin: 0 0 10px 0;
          font-size: 24px;
        }
        .stat-card p {
          margin: 0;
          color: #666;
          font-weight: 500;
        }
        .charts-section {
          margin-bottom: 30px;
        }
        .charts-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        .chart-container {
          text-align: center;
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 20px;
        }
        .chart-container h4 {
          margin: 0 0 15px 0;
          color: #333;
        }
        .chart-container img {
          max-width: 100%;
          height: auto;
        }
        .table-section {
          margin-bottom: 30px;
        }
        .table-section h4 {
          color: #007bff;
          border-bottom: 2px solid #007bff;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          border: 1px solid #dee2e6;
          padding: 12px;
          text-align: left;
        }
        th {
          background: #007bff;
          color: white;
          font-weight: 600;
        }
        tr:nth-child(even) {
          background: #f8f9fa;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #dee2e6;
          color: #666;
          font-size: 12px;
        }
        @media print {
          body { margin: 0; }
          .charts-grid { grid-template-columns: 1fr; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${report.title}</h1>
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
        <p>Period: ${report.period?.label || 'All Time'}</p>
        ${report.description ? `<p>${report.description}</p>` : ''}
      </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <h3>${report.stats?.totalSales || '0'}</h3>
          <p>${report.type === 'inventory' ? 'Total Value' : 'Total Sales'}</p>
        </div>
        <div class="stat-card">
          <h3>${report.stats?.profitMargin || '0'}</h3>
          <p>Profit Margin</p>
        </div>
        <div class="stat-card">
          <h3>${report.stats?.unitsSold || '0'}</h3>
          <p>${report.type === 'inventory' ? 'Total Items' : 'Units Sold'}</p>
        </div>
        <div class="stat-card">
          <h3>${report.stats?.avgOrder || '0'}</h3>
          <p>Average Order</p>
        </div>
      </div>
      
      ${chartImage || pieChartImage ? `
      <div class="charts-section">
        <div class="charts-grid">
          ${chartImage ? `
          <div class="chart-container">
            <h4>${report.type === 'inventory' ? 'Inventory Value by Category' : 'Sales by Date'}</h4>
            <img src="${chartImage}" alt="Main Chart" />
          </div>
          ` : ''}
          ${pieChartImage ? `
          <div class="chart-container">
            <h4>${report.type === 'inventory' ? 'Products by Category' : 'Top Selling Products'}</h4>
            <img src="${pieChartImage}" alt="Pie Chart" />
          </div>
          ` : ''}
        </div>
      </div>
      ` : ''}
      
      ${report.tableData && report.tableData.length > 0 ? `
      <div class="table-section">
        <h4>${report.type === 'inventory' ? 'Inventory Details' : 'Transaction Details'}</h4>
        <table>
          <thead>
            <tr>
              ${Object.keys(report.tableData[0]).map(header => `<th>${header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${report.tableData.map(row => `
              <tr>
                ${Object.keys(row).map(key => `<td>${row[key] || ''}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}
      
      ${report.categoryBreakdown && report.categoryBreakdown.length > 0 ? `
      <div class="table-section">
        <h4>Category Breakdown</h4>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Items Count</th>
              <th>Total Value</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            ${report.categoryBreakdown.map(category => {
              const percentage = ((category.value / report.summary.totalValue) * 100).toFixed(1);
              return `
                <tr>
                  <td>${category.name}</td>
                  <td>${category.count}</td>
                  <td>${new Intl.NumberFormat('en-US', {style: 'currency', currency: 'TZS'}).format(category.value)}</td>
                  <td>${percentage}%</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}
      
      ${report.topProducts && report.topProducts.length > 0 ? `
      <div class="table-section">
        <h4>Top Selling Products</h4>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity Sold</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            ${report.topProducts.map(product => `
              <tr>
                <td>${product.name}</td>
                <td>${product.quantity}</td>
                <td>${new Intl.NumberFormat('en-US', {style: 'currency', currency: 'TZS'}).format(product.revenue)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}
      
      <div class="footer">
        <p>Generated by Pipe Inventory Management System</p>
        <p>Report ID: ${report.id}</p>
      </div>
    </body>
    </html>
  `;
}

// Generate PDF-optimized HTML content
function generatePDFReport(report) {
  const chartCanvas = document.getElementById('report-chart');
  const pieChartCanvas = document.getElementById('pie-chart');
  
  let chartImage = '';
  let pieChartImage = '';
  
  // Capture chart images
  if (chartCanvas) {
    chartImage = chartCanvas.toDataURL('image/png');
  }
  
  if (pieChartCanvas) {
    pieChartImage = pieChartCanvas.toDataURL('image/png');
  }
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${report.title}</title>
      <style>
        @page {
          size: A4;
          margin: 1in;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 0;
          background: white;
          color: #333;
          line-height: 1.4;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #007bff;
          padding-bottom: 20px;
          margin-bottom: 30px;
          background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
          color: white;
          padding: 30px 20px;
          border-radius: 10px;
        }
        .header h1 {
          margin: 0;
          font-size: 32px;
          font-weight: 700;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .header p {
          margin: 8px 0;
          font-size: 16px;
          opacity: 0.9;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 30px;
        }
        .stat-card {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border: 2px solid #007bff;
          border-radius: 12px;
          padding: 25px;
          text-align: center;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .stat-card h3 {
          color: #007bff;
          margin: 0 0 10px 0;
          font-size: 28px;
          font-weight: 700;
        }
        .stat-card p {
          margin: 0;
          color: #495057;
          font-weight: 600;
          font-size: 14px;
        }
        .charts-section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        .charts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        .chart-container {
          text-align: center;
          background: #f8f9fa;
          border: 2px solid #007bff;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .chart-container h4 {
          margin: 0 0 15px 0;
          color: #007bff;
          font-weight: 600;
          font-size: 16px;
        }
        .chart-container img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
        }
        .table-section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        .table-section h4 {
          color: #007bff;
          background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
          color: white;
          padding: 15px 20px;
          margin: 0 0 15px 0;
          border-radius: 8px;
          font-size: 18px;
          font-weight: 600;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        th, td {
          border: 1px solid #dee2e6;
          padding: 12px;
          text-align: left;
          font-size: 12px;
        }
        th {
          background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
          color: white;
          font-weight: 600;
        }
        tr:nth-child(even) {
          background: #f8f9fa;
        }
        tr:hover {
          background: #e3f2fd;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #007bff;
          color: #666;
          font-size: 12px;
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
        }
        .company-logo {
          font-size: 24px;
          font-weight: 700;
          color: #007bff;
          margin-bottom: 10px;
        }
        @media print {
          body { 
            margin: 0; 
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .charts-grid { 
            grid-template-columns: 1fr; 
            gap: 10px;
          }
          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
          }
          .stat-card {
            padding: 15px;
          }
          .stat-card h3 {
            font-size: 20px;
          }
          table {
            font-size: 10px;
          }
          th, td {
            padding: 8px;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-logo">📊 PIPE INVENTORY SYSTEM</div>
        <h1>${report.title}</h1>
        <p>📅 Generated on: ${new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
        <p>⏰ Period: ${report.period?.label || 'All Time'}</p>
        ${report.description ? `<p>📋 ${report.description}</p>` : ''}
      </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <h3>${report.stats?.totalSales || '0'}</h3>
          <p>💰 ${report.type === 'inventory' ? 'Total Value' : 'Total Sales'}</p>
        </div>
        <div class="stat-card">
          <h3>${report.stats?.profitMargin || '0'}</h3>
          <p>📈 Profit Margin</p>
        </div>
        <div class="stat-card">
          <h3>${report.stats?.unitsSold || '0'}</h3>
          <p>📦 ${report.type === 'inventory' ? 'Total Items' : 'Units Sold'}</p>
        </div>
        <div class="stat-card">
          <h3>${report.stats?.avgOrder || '0'}</h3>
          <p>🛒 Average Order</p>
        </div>
      </div>
      
      ${chartImage || pieChartImage ? `
      <div class="charts-section">
        <div class="charts-grid">
          ${chartImage ? `
          <div class="chart-container">
            <h4>📊 ${report.type === 'inventory' ? 'Inventory Value by Category' : 'Sales by Date'}</h4>
            <img src="${chartImage}" alt="Main Chart" />
          </div>
          ` : ''}
          ${pieChartImage ? `
          <div class="chart-container">
            <h4>🥧 ${report.type === 'inventory' ? 'Products by Category' : 'Top Selling Products'}</h4>
            <img src="${pieChartImage}" alt="Pie Chart" />
          </div>
          ` : ''}
        </div>
      </div>
      ` : ''}
      
      ${report.tableData && report.tableData.length > 0 ? `
      <div class="table-section">
        <h4>📋 ${report.type === 'inventory' ? 'Inventory Details' : 'Transaction Details'}</h4>
        <table>
          <thead>
            <tr>
              ${Object.keys(report.tableData[0]).map(header => `<th>${header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${report.tableData.slice(0, 20).map(row => `
              <tr>
                ${Object.keys(row).map(key => `<td>${row[key] || ''}</td>`).join('')}
              </tr>
            `).join('')}
            ${report.tableData.length > 20 ? `
              <tr>
                <td colspan="${Object.keys(report.tableData[0]).length}" style="text-align: center; font-style: italic; color: #666;">
                  ... and ${report.tableData.length - 20} more items
                </td>
              </tr>
            ` : ''}
          </tbody>
        </table>
      </div>
      ` : ''}
      
      ${report.categoryBreakdown && report.categoryBreakdown.length > 0 ? `
      <div class="table-section">
        <h4>🏷️ Category Breakdown</h4>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Items Count</th>
              <th>Total Value</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            ${report.categoryBreakdown.map(category => {
              const percentage = ((category.value / report.summary.totalValue) * 100).toFixed(1);
              return `
                <tr>
                  <td>${category.name}</td>
                  <td>${category.count}</td>
                  <td>${new Intl.NumberFormat('en-US', {style: 'currency', currency: 'TZS'}).format(category.value)}</td>
                  <td>${percentage}%</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}
      
      ${report.topProducts && report.topProducts.length > 0 ? `
      <div class="table-section">
        <h4>🏆 Top Selling Products</h4>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Quantity Sold</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            ${report.topProducts.map(product => `
              <tr>
                <td>${product.name}</td>
                <td>${product.quantity}</td>
                <td>${new Intl.NumberFormat('en-US', {style: 'currency', currency: 'TZS'}).format(product.revenue)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}
      
      <div class="footer">
        <div class="company-logo">📊 PIPE INVENTORY MANAGEMENT SYSTEM</div>
        <p>🏢 Professional Business Reports</p>
        <p>📄 Report ID: ${report.id}</p>
        <p>⏰ Generated at: ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;
}

// Generate fallback report when API is not available
async function generateFallbackReport(reportData) {
  console.log('🔄 Generating fallback report...');
  
  try {
    const reportId = 'fallback-' + Date.now();
    const currentDate = new Date();
    
    // Create a basic report structure
    const fallbackReport = {
      id: reportId,
      title: `${reportData.type.charAt(0).toUpperCase() + reportData.type.slice(1)} Report`,
      type: reportData.type,
      period: reportData.period,
      format: reportData.format,
      date: currentDate.toISOString(),
      createdAt: currentDate.toISOString(),
      description: `Fallback ${reportData.type} report generated locally`,
      tableData: [],
      summary: {
        message: 'Report generated in offline mode',
        note: 'Limited data available - database connection unavailable'
      }
    };
    
    // Try to get some basic data from localStorage
    try {
      const inventoryBackup = JSON.parse(localStorage.getItem('inventory_backup') || '[]');
      const salesBackup = JSON.parse(localStorage.getItem('sales_backup') || '[]');
      
      if (reportData.type === 'inventory' && inventoryBackup.length > 0) {
        fallbackReport.tableData = inventoryBackup.slice(0, 10).map(item => ({
          'Item': item.name || 'Unknown',
          'Type': item.type || 'N/A',
          'Quantity': item.quantity || 0,
          'Price': item.price || 0,
          'Status': (item.quantity || 0) < 10 ? 'Low Stock' : 'In Stock'
        }));
        fallbackReport.summary.totalItems = inventoryBackup.length;
      } else if (reportData.type === 'sales' && salesBackup.length > 0) {
        fallbackReport.tableData = salesBackup.slice(0, 10).map(sale => ({
          'Date': new Date(sale.date).toLocaleDateString(),
          'Item': sale.itemName || 'Unknown',
          'Quantity': sale.quantity || 0,
          'Total': sale.total || 0
        }));
        fallbackReport.summary.totalSales = salesBackup.length;
      } else {
        fallbackReport.tableData = [{
          'Status': 'No data available',
          'Message': 'Please ensure the database is connected and try again',
          'Suggestion': 'Restart the application if the problem persists'
        }];
      }
    } catch (dataError) {
      console.warn('Could not load backup data:', dataError);
      fallbackReport.tableData = [{
        'Status': 'Data unavailable',
        'Error': 'Could not access local data',
        'Action': 'Please restart the application'
      }];
    }
    
    console.log('✅ Fallback report generated:', fallbackReport);
    return fallbackReport;
    
  } catch (error) {
    console.error('❌ Error generating fallback report:', error);
    throw new Error('Could not generate report: ' + error.message);
  }
}

// Settings Modal Functionality
document.addEventListener('DOMContentLoaded', function() {
  // Initialize settings modal functionality
  initializeSettingsModal();
});

function initializeSettingsModal() {
  // Load current settings when modal opens
  const settingsModal = document.getElementById('settingsModal');
  if (settingsModal) {
    settingsModal.addEventListener('show.bs.modal', loadCurrentSettings);
  }

  // Save settings button
  const saveSettingsBtn = document.getElementById('save-settings');
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', saveSettings);
  }

  // Password change form
  const passwordForm = document.getElementById('password-change-form');
  if (passwordForm) {
    passwordForm.addEventListener('submit', handlePasswordChange);
  }

  // Hide password tab for admin users
  const userSession = JSON.parse(localStorage.getItem('userSession') || '{}');
  if (userSession.role === 'admin') {
    const passwordTab = document.getElementById('password-tab-item');
    if (passwordTab) {
      passwordTab.style.display = 'none';
    }
  }
}

function loadCurrentSettings() {
  try {
    // Load settings from localStorage or use defaults
    const settings = JSON.parse(localStorage.getItem('appSettings') || '{}');
    
    // Populate form fields
    const companyName = document.getElementById('company-name');
    if (companyName) companyName.value = settings.companyName || 'Eliva Hardware';
    
    const alertThreshold = document.getElementById('alert-threshold');
    if (alertThreshold) alertThreshold.value = settings.alertThreshold || 10;
    
    const currency = document.getElementById('currency');
    if (currency) currency.value = settings.currency || 'TZS';
    
    const sessionTimeout = document.getElementById('session-timeout');
    if (sessionTimeout) {
      const timeoutHours = localStorage.getItem('sessionTimeoutHours') || '3';
      sessionTimeout.value = timeoutHours;
    }
    
    console.log('Settings loaded successfully');
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

function saveSettings() {
  try {
    // Get form values
    const companyName = document.getElementById('company-name')?.value || 'Eliva Hardware';
    const alertThreshold = parseInt(document.getElementById('alert-threshold')?.value) || 10;
    const currency = document.getElementById('currency')?.value || 'TZS';
    const sessionTimeout = parseInt(document.getElementById('session-timeout')?.value) || 3;
    
    // Create settings object
    const settings = {
      companyName,
      alertThreshold,
      currency,
      lastUpdated: new Date().toISOString()
    };
    
    // Save to localStorage
    localStorage.setItem('appSettings', JSON.stringify(settings));
    localStorage.setItem('sessionTimeoutHours', sessionTimeout.toString());
    
    // Show success message
    showNotification('Settings saved successfully!', 'success');
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
    if (modal) modal.hide();
    
    console.log('Settings saved successfully');
  } catch (error) {
    console.error('Error saving settings:', error);
    showNotification('Error saving settings. Please try again.', 'error');
  }
}

function handlePasswordChange(event) {
  event.preventDefault();
  
  const currentPassword = document.getElementById('current-password')?.value;
  const newPassword = document.getElementById('new-password')?.value;
  const confirmPassword = document.getElementById('confirm-password')?.value;
  
  // Clear previous messages
  const successAlert = document.getElementById('password-success');
  const errorAlert = document.getElementById('password-error');
  const errorText = document.getElementById('password-error-text');
  
  if (successAlert) successAlert.style.display = 'none';
  if (errorAlert) errorAlert.style.display = 'none';
  
  // Validate inputs
  if (!currentPassword || !newPassword || !confirmPassword) {
    showPasswordError('All fields are required');
    return;
  }
  
  if (newPassword !== confirmPassword) {
    showPasswordError('New passwords do not match');
    return;
  }
  
  if (newPassword.length < 6) {
    showPasswordError('New password must be at least 6 characters long');
    return;
  }
  
  // Use SessionManager to change password
  if (window.SessionManager) {
    const result = window.SessionManager.changePassword(currentPassword, newPassword);
    
    if (result.success) {
      showPasswordSuccess('Password changed successfully!');
      // Clear form
      document.getElementById('password-change-form').reset();
    } else {
      showPasswordError(result.message);
    }
  } else {
    showPasswordError('Password change functionality not available');
  }
}

function showPasswordSuccess(message) {
  const successAlert = document.getElementById('password-success');
  if (successAlert) {
    successAlert.style.display = 'block';
    setTimeout(() => {
      successAlert.style.display = 'none';
    }, 5000);
  }
}

function showPasswordError(message) {
  const errorAlert = document.getElementById('password-error');
  const errorText = document.getElementById('password-error-text');
  
  if (errorAlert && errorText) {
    errorText.textContent = message;
    errorAlert.style.display = 'block';
    setTimeout(() => {
      errorAlert.style.display = 'none';
    }, 5000);
  }
}

function showNotification(message, type = 'info') {
  // Create a simple notification
  const notification = document.createElement('div');
  notification.className = `alert alert-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} position-fixed`;
  notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
  notification.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
    ${message}
    <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
  `;
  
  document.body.appendChild(notification);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);
}