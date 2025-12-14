/**
 * Icon Fixer Script
 * This script specifically targets icon visibility problems and fixes them
 * by directly manipulating the DOM elements
 * 
 * Enhanced version with Windows-specific fixes
 */

// Execute immediately
(function() {
  console.log('Icon Fixer v1.2 - Enhanced for Windows - Initializing...');
  
  // Detect platform (Windows vs others)
  const isWindows = navigator.userAgent.indexOf('Windows') !== -1;
  console.log(`Running on ${isWindows ? 'Windows' : 'non-Windows'} platform`);
  
  /**
   * Fix all FontAwesome icons
   */
  function fixFontAwesomeIcons() {
    // Target all FA icons with a broader selector for Windows
    const iconElements = document.querySelectorAll('i.fa, i.fas, i.far, i.fab, i.bi, i[class^="icon-"], i[class*=" icon-"], i[class*="fa-"], button i, a i, .btn i, .nav-link i, .table i, .card i, .edit-btn i, .delete-btn i, .action-btn i');
    
    iconElements.forEach(icon => {
      // Apply more aggressive styling with !important flags for Windows
      if (isWindows) {
        // Windows needs more aggressive styling
        icon.setAttribute('style', `
          color: white !important;
          text-shadow: 0 0 3px black, 0 0 5px white, 0 0 7px white !important;
          filter: brightness(3) contrast(3) !important;
          opacity: 1 !important;
          visibility: visible !important;
          font-weight: bold !important;
          display: inline-block !important;
          font-family: "Font Awesome 5 Free", "FontAwesome", sans-serif !important;
          -webkit-font-smoothing: antialiased !important;
          background-color: rgba(0, 0, 0, 0.2) !important;
          padding: 2px !important;
          border-radius: 3px !important;
          margin: 0 2px !important;
        `);
        
        // For Windows, try to ensure font is properly loaded
        const originalClass = icon.className;
        icon.className = originalClass + ' force-visible';
        
        // Force a redraw by toggling display
        icon.style.display = 'none';
        setTimeout(() => {
          icon.style.display = 'inline-block';
        }, 10);
      } else {
        // Non-Windows styling (macOS, Linux)
        icon.setAttribute('style', `
          color: white !important;
          text-shadow: 0 0 2px black, 0 0 5px rgba(255, 255, 255, 0.7) !important;
          filter: brightness(1.5) contrast(1.5) !important;
          opacity: 1 !important;
          visibility: visible !important;
          font-weight: bold !important;
        `);
      }
      
      // Add a special class we can target with CSS
      icon.classList.add('icon-fixed');
      
      // Create a glow effect by adding a pseudo-element
      const parent = icon.parentElement;
      if (parent) {
        parent.style.position = 'relative';
      }
    });
    
    console.log(`Fixed ${iconElements.length} FontAwesome icons`);
  }
  
  /**
   * Fix all SVG icons
   */
  function fixSvgIcons() {
    // Target all SVG elements
    const svgElements = document.querySelectorAll('svg');
    
    svgElements.forEach(svg => {
      // Set SVG attributes with more intensity for Windows
      svg.setAttribute('style', `
        filter: brightness(${isWindows ? 3 : 1.5}) contrast(${isWindows ? 3 : 1.5}) drop-shadow(0 0 3px rgba(0, 0, 0, 0.7)) !important;
        opacity: 1 !important;
        visibility: visible !important;
        display: inline-block !important;
      `);
      
      // Set fill and stroke for all child elements
      const childElements = svg.querySelectorAll('*');
      childElements.forEach(el => {
        el.setAttribute('fill', 'white');
        el.setAttribute('stroke', 'white');
        el.setAttribute('style', `
          fill: white !important;
          stroke: white !important;
          opacity: 1 !important;
          visibility: visible !important;
        `);
      });
      
      // Add a special class we can target with CSS
      svg.classList.add('svg-fixed');
      
      // Add a filter directly in the SVG for Windows
      if (isWindows && !svg.querySelector('filter#brightness-filter')) {
        const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
        filter.setAttribute('id', 'brightness-filter');
        
        const feComponentTransfer = document.createElementNS('http://www.w3.org/2000/svg', 'feComponentTransfer');
        
        const feFuncR = document.createElementNS('http://www.w3.org/2000/svg', 'feFuncR');
        feFuncR.setAttribute('type', 'linear');
        feFuncR.setAttribute('slope', '3');
        
        const feFuncG = document.createElementNS('http://www.w3.org/2000/svg', 'feFuncG');
        feFuncG.setAttribute('type', 'linear');
        feFuncG.setAttribute('slope', '3');
        
        const feFuncB = document.createElementNS('http://www.w3.org/2000/svg', 'feFuncB');
        feFuncB.setAttribute('type', 'linear');
        feFuncB.setAttribute('slope', '3');
        
        feComponentTransfer.appendChild(feFuncR);
        feComponentTransfer.appendChild(feFuncG);
        feComponentTransfer.appendChild(feFuncB);
        
        filter.appendChild(feComponentTransfer);
        
        // Add the defs element if not present
        let defs = svg.querySelector('defs');
        if (!defs) {
          defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
          svg.insertBefore(defs, svg.firstChild);
        }
        
        defs.appendChild(filter);
        
        // Apply the filter to all child elements
        svg.querySelectorAll('path, circle, rect, line, polyline, polygon').forEach(el => {
          el.setAttribute('filter', 'url(#brightness-filter)');
        });
      }
    });
    
    console.log(`Fixed ${svgElements.length} SVG icons`);
  }
  
  /**
   * Fix all Chart.js elements
   */
  function fixChartJsElements() {
    // Target all canvas elements used by Chart.js
    const canvasElements = document.querySelectorAll('canvas.chartjs-render-monitor, canvas.report-chart, .chart-container canvas');
    
    canvasElements.forEach(canvas => {
      // Apply direct styling with !important flags
      canvas.setAttribute('style', `
        filter: brightness(${isWindows ? 2.5 : 1.5}) contrast(${isWindows ? 2.5 : 1.5}) !important;
        opacity: 1 !important;
        visibility: visible !important;
      `);
      
      // Add a special class we can target with CSS
      canvas.classList.add('canvas-fixed');
      
      // For Windows, try to force a redraw
      if (isWindows && canvas.getContext) {
        try {
          const ctx = canvas.getContext('2d');
          // Save current transform
          ctx.save();
          // Apply a small transformation to force a redraw
          ctx.translate(0.1, 0.1);
          ctx.restore();
        } catch (e) {
          console.error('Error forcing canvas redraw:', e);
        }
      }
      
      console.log('Fixed canvas:', canvas.id || 'unnamed canvas');
    });
    
    console.log(`Fixed ${canvasElements.length} Chart.js canvases`);
  }
  
  /**
   * Fix specifically table action buttons (edit, delete, etc.)
   */
  function fixTableActionButtons() {
    // Target action buttons in tables
    const actionButtons = document.querySelectorAll('.table .btn, .table a[class*="btn"], .table button, .table-action, .edit-btn, .delete-btn, .action-btn');
    
    actionButtons.forEach(btn => {
      // Make the button itself more visible
      btn.style.position = 'relative';
      btn.style.zIndex = '1000';
      
      // Find icons inside the button
      const icons = btn.querySelectorAll('i');
      icons.forEach(icon => {
        if (isWindows) {
          icon.setAttribute('style', `
            color: white !important;
            text-shadow: 0 0 4px black, 0 0 8px white !important;
            filter: brightness(3) contrast(3) !important;
            opacity: 1 !important;
            visibility: visible !important;
            font-weight: bold !important;
            display: inline-block !important;
            background-color: rgba(0, 0, 0, 0.3) !important;
            padding: 3px !important;
            border-radius: 4px !important;
            margin: 0 2px !important;
            font-size: 120% !important;
          `);
        }
      });
    });
    
    console.log(`Fixed ${actionButtons.length} table action buttons`);
  }
  
  /**
   * Add inline CSS to the page
   */
  function addInlineStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Direct icon fixes with highest priority */
      i.icon-fixed, 
      i.fa, i.fas, i.far, i.fab, i.bi, 
      i[class^="icon-"], i[class*=" icon-"], 
      i[class*="fa-"], 
      button i, a i, .btn i, .nav-link i, .table i, .card i, .edit-btn i, .delete-btn i, .action-btn i {
        color: white !important;
        text-shadow: ${isWindows ? 
          '0 0 3px black, 0 0 5px white, 0 0 7px white' : 
          '0 0 2px black, 0 0 5px rgba(255, 255, 255, 0.7)'} !important;
        filter: brightness(${isWindows ? 3 : 1.5}) contrast(${isWindows ? 3 : 1.5}) !important;
        opacity: 1 !important;
        visibility: visible !important;
        font-weight: bold !important;
        display: inline-block !important;
      }
      
      /* Special handling for edit and delete icons */
      .fa-edit, .fa-pencil-alt, .fa-pen, .fa-trash, .fa-trash-alt, .fa-times, .fa-plus, .fa-minus,
      [class*="edit"] i, [class*="delete"] i, [class*="remove"] i, [class*="add"] i, 
      .btn-danger i, .btn-warning i, .btn-success i, .btn-primary i, .btn-info i {
        color: white !important;
        text-shadow: 0 0 3px black, 0 0 5px white, 0 0 7px white !important;
        filter: brightness(3) contrast(3) !important;
        font-size: 1.1em !important;
        margin: 0 2px !important;
        padding: 2px !important;
        background-color: rgba(0, 0, 0, 0.2) !important;
        border-radius: 3px !important;
        box-shadow: 0 0 5px rgba(255, 255, 255, 0.5) !important;
      }
      
      /* Action buttons need extra visibility */
      .action-btn i, .btn-action i, .table-action i, 
      button[class*="edit"] i, button[class*="delete"] i, button[class*="add"] i, 
      a[class*="edit"] i, a[class*="delete"] i, a[class*="add"] i {
        display: inline-block !important;
        width: 20px !important;
        height: 20px !important;
        line-height: 20px !important;
        text-align: center !important;
        background-color: rgba(0, 0, 0, 0.3) !important;
        border-radius: 50% !important;
        margin: 0 2px !important;
      }
      
      /* SVG fixes */
      svg.svg-fixed, svg {
        filter: brightness(${isWindows ? 3 : 1.5}) contrast(${isWindows ? 3 : 1.5}) drop-shadow(0 0 3px rgba(0, 0, 0, 0.7)) !important;
        opacity: 1 !important;
        visibility: visible !important;
      }
      
      svg.svg-fixed *, svg * {
        fill: white !important;
        stroke: white !important;
        opacity: 1 !important;
        visibility: visible !important;
      }
      
      /* Canvas fixes */
      canvas.canvas-fixed, canvas.chartjs-render-monitor, canvas.report-chart, .chart-container canvas {
        filter: brightness(${isWindows ? 2.5 : 1.5}) contrast(${isWindows ? 2.5 : 1.5}) !important;
        opacity: 1 !important;
        visibility: visible !important;
      }
      
      /* Chart labels */
      .chart-title, .chart-label, .legend-item, .chartjs-legend-item span {
        color: white !important;
        text-shadow: 0 0 3px black, 0 0 5px rgba(255, 255, 255, 0.7) !important;
        font-weight: bold !important;
        opacity: 1 !important;
        visibility: visible !important;
      }
      
      /* Force visibility for all elements with opacity or visibility issues */
      [style*="opacity"], [style*="visibility"] {
        opacity: 1 !important;
        visibility: visible !important;
      }
    `;
    
    document.head.appendChild(style);
    console.log('Added inline CSS styles');
  }
  
  /**
   * Replace Font Awesome with Unicode characters if needed
   */
  function replaceFontAwesomeWithUnicode() {
    // Only do this on Windows
    if (!isWindows) return;
    
    // Map of Font Awesome classes to Unicode fallbacks
    const iconMap = {
      'fa-edit': '✏️',
      'fa-pencil-alt': '✏️',
      'fa-pen': '✏️',
      'fa-trash': '🗑️',
      'fa-trash-alt': '🗑️',
      'fa-times': '✖️',
      'fa-plus': '➕',
      'fa-minus': '➖',
      'fa-save': '💾',
      'fa-download': '⬇️',
      'fa-upload': '⬆️',
      'fa-print': '🖨️',
      'fa-search': '🔍',
      'fa-cog': '⚙️',
      'fa-gear': '⚙️',
      'fa-user': '👤',
      'fa-users': '👥',
      'fa-chart-bar': '📊',
      'fa-chart-line': '📈',
      'fa-chart-pie': '📊',
      'fa-file': '📄',
      'fa-file-alt': '📄',
      'fa-file-pdf': '📑',
      'fa-file-excel': '📗',
      'fa-file-csv': '📊',
      'fa-check': '✓',
      'fa-check-circle': '✅',
      'fa-exclamation': '❗',
      'fa-exclamation-circle': '⚠️',
      'fa-exclamation-triangle': '⚠️',
      'fa-info': 'ℹ️',
      'fa-info-circle': 'ℹ️',
      'fa-question': '❓',
      'fa-question-circle': '❓',
      'fa-bars': '☰',
      'fa-hamburger': '☰',
      'fa-ellipsis-v': '⋮',
      'fa-ellipsis-h': '⋯'
    };
    
    // Find all Font Awesome icons
    const iconElements = document.querySelectorAll('i.fa, i.fas, i.far, i.fab, i[class*="fa-"]');
    
    iconElements.forEach(icon => {
      // Check if the icon is likely invisible
      if (isIconInvisible(icon)) {
        // Find a matching Unicode fallback
        let unicodeChar = null;
        
        // Check each class on the element against our map
        for (const className of icon.classList) {
          if (iconMap[className]) {
            unicodeChar = iconMap[className];
            break;
          }
        }
        
        if (unicodeChar) {
          // Create a fallback span
          const fallback = document.createElement('span');
          fallback.className = 'unicode-fallback';
          fallback.textContent = unicodeChar;
          fallback.style.cssText = `
            font-family: 'Segoe UI Emoji', 'Segoe UI Symbol', sans-serif !important;
            font-style: normal !important;
            font-size: 16px !important;
            line-height: 1 !important;
            color: white !important;
            text-shadow: 0 0 3px black !important;
            display: inline-block !important;
            vertical-align: middle !important;
            position: relative !important;
            z-index: 9999 !important;
          `;
          
          // Insert the fallback after the icon
          if (icon.parentNode) {
            icon.parentNode.insertBefore(fallback, icon.nextSibling);
          }
          
          console.log(`Replaced icon with Unicode fallback: ${unicodeChar}`);
        }
      }
    });
  }
  
  /**
   * Check if an icon is invisible
   * @param {Element} icon - The icon element to check
   * @returns {boolean} True if the icon is invisible
   */
  function isIconInvisible(icon) {
    if (!icon) return true;
    
    // Check computed style
    const style = window.getComputedStyle(icon);
    
    // Check various properties that might indicate invisibility
    return style.display === 'none' || 
           style.visibility === 'hidden' || 
           style.opacity === '0' || 
           parseFloat(style.opacity) < 0.1 || 
           style.width === '0px' || 
           style.height === '0px' ||
           !icon.offsetParent; // Element is not in the layout
  }
  
  /**
   * Initialize the fixer
   */
  function init() {
    console.log('Initializing icon fixer...');
    
    // Add inline styles first
    addInlineStyles();
    
    // Fix FontAwesome icons
    fixFontAwesomeIcons();
    
    // Fix SVG icons
    fixSvgIcons();
    
    // Fix Chart.js elements
    fixChartJsElements();
    
    // Fix table action buttons
    fixTableActionButtons();
    
    // Replace with Unicode as a last resort
    replaceFontAwesomeWithUnicode();
    
    console.log('Icon fixer initialization complete');
  }
  
  // Run the initialization
  init();
  
  // Also run after the page has fully loaded
  window.addEventListener('load', () => {
    console.log('Window loaded, running icon fixer again...');
    init();
    
    // Run again after a delay to catch any dynamically added icons
    setTimeout(init, 1000);
    setTimeout(init, 2000);
  });
  
  // Run again after DOM content is loaded
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM content loaded, running icon fixer again...');
    init();
    
    // Run again after a delay to catch any dynamically added icons
    setTimeout(init, 500);
  });
  
  // Create a MutationObserver to watch for dynamically added icons
  const observer = new MutationObserver((mutations) => {
    let shouldRun = false;
    
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        shouldRun = true;
      }
    });
    
    if (shouldRun) {
      console.log('DOM mutations detected, running icon fixer...');
      init();
    }
  });
  
  // Start observing the document with the configured parameters
  observer.observe(document.body, { childList: true, subtree: true });
})();