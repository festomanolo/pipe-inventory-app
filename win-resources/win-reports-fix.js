
/**
 * Windows Reports Page Fixes
 * This script ensures that charts and graphs render correctly on Windows
 */

// Execute when the window loads
window.addEventListener('load', function() {
  console.log('Windows reports fix script loaded');
  
  // Add the Windows-specific CSS
  const winCssLink = document.createElement('link');
  winCssLink.rel = 'stylesheet';
  winCssLink.href = '../resources/win-reports-fix.css';
  document.head.appendChild(winCssLink);
  
  // Wait for charts to be rendered then apply fixes
  setTimeout(function() {
    fixWindowsCharts();
  }, 1000);
  
  // Add event listener for report generation
  const generateReportBtn = document.getElementById('generate-report-btn');
  if (generateReportBtn) {
    generateReportBtn.addEventListener('click', function() {
      setTimeout(function() {
        fixWindowsCharts();
      }, 2000);
    });
  }
});

// Function to fix Windows charts
function fixWindowsCharts() {
  console.log('Applying Windows chart fixes');
  
  // Apply fixes to all chart canvases
  document.querySelectorAll('.report-chart').forEach(function(canvas) {
    canvas.style.filter = 'brightness(1.5) contrast(1.5)';
    canvas.style.opacity = '1';
    canvas.style.visibility = 'visible';
    
    // Force redraw
    const parent = canvas.parentElement;
    if (parent) {
      const display = parent.style.display;
      parent.style.display = 'none';
      setTimeout(function() {
        parent.style.display = display;
      }, 50);
    }
  });
  
  // Apply fixes to chart containers
  document.querySelectorAll('.chart-container').forEach(function(container) {
    container.style.background = 'rgba(0, 0, 0, 0.5)';
    container.style.border = '1px solid rgba(255, 255, 255, 0.2)';
    container.style.boxShadow = '0 0 15px rgba(0, 0, 0, 0.5)';
  });
  
  // Apply fixes to chart titles
  document.querySelectorAll('.chart-title').forEach(function(title) {
    title.style.color = 'white';
    title.style.textShadow = '0 0 5px rgba(0, 0, 0, 0.8)';
    title.style.fontWeight = 'bold';
  });
}
