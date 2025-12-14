/**
 * Platform-specific fixes
 * This script detects the platform and applies specific fixes for known issues
 */

// Execute when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Platform fixes initializing...');
  
  // Detect if running on Windows
  const isWindows = navigator.userAgent.indexOf('Windows') !== -1;
  console.log(`Running on ${isWindows ? 'Windows' : 'non-Windows'} platform`);
  
  if (isWindows) {
    console.log('Applying Windows-specific fixes');
    
    // Load Windows-specific CSS
    loadWindowsSpecificCSS();
    
    // Apply input field fixes for Windows
    applyWindowsInputFixes();
  }
});

/**
 * Load Windows-specific CSS fixes
 */
function loadWindowsSpecificCSS() {
  const windowsFixCSS = document.createElement('link');
  windowsFixCSS.rel = 'stylesheet';
  windowsFixCSS.href = '../css/win-fix.css';
  windowsFixCSS.id = 'windows-fix-css';
  document.head.appendChild(windowsFixCSS);
  
  console.log('Windows-specific CSS loaded');
}

/**
 * Apply Windows-specific input field fixes
 */
function applyWindowsInputFixes() {
  // Find all input fields, textareas, and selects
  const inputElements = document.querySelectorAll('input, textarea, select');
  console.log(`Applying Windows fixes to ${inputElements.length} input elements`);
  
  // Add event listeners to all input elements
  inputElements.forEach(input => {
    // Prevent inputs from becoming uneditable by refreshing their state on blur
    input.addEventListener('blur', function() {
      // Store current value
      const currentValue = this.value;
      
      // Set a short timeout to reset the field if needed
      setTimeout(() => {
        // If the input is still on the page
        if (document.body.contains(this)) {
          // Remove and restore any "stuck" attributes
          this.readOnly = false;
          this.disabled = false;
          
          // Ensure the field remains focusable
          this.tabIndex = 0;
        }
      }, 100);
    });
    
    // Add a click handler to reset fields if they appear to be stuck
    input.addEventListener('click', function(event) {
      if (this.disabled || this.readOnly) {
        console.log('Resetting potentially stuck input field:', this.id || this.name);
        this.disabled = false;
        this.readOnly = false;
      }
    });
  });
  
  // Create a MutationObserver to watch for new inputs being added to the DOM
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(node => {
          // Check if the added node is an Element and contains inputs
          if (node.nodeType === Node.ELEMENT_NODE) {
            const newInputs = node.querySelectorAll('input, textarea, select');
            if (newInputs.length > 0) {
              console.log(`Applying Windows fixes to ${newInputs.length} new input elements`);
              
              newInputs.forEach(input => {
                // Add the same event listeners as above
                input.addEventListener('blur', function() {
                  const currentValue = this.value;
                  setTimeout(() => {
                    if (document.body.contains(this)) {
                      this.readOnly = false;
                      this.disabled = false;
                      this.tabIndex = 0;
                    }
                  }, 100);
                });
                
                input.addEventListener('click', function(event) {
                  if (this.disabled || this.readOnly) {
                    this.disabled = false;
                    this.readOnly = false;
                  }
                });
              });
            }
          }
        });
      }
    });
  });
  
  // Start observing the document with the configured parameters
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Add a global click handler to help with stuck fields
  document.addEventListener('click', function(event) {
    // Check if we clicked on or near an input but not in it (indicating it might be stuck)
    if (event.target.tagName !== 'INPUT' && 
        event.target.tagName !== 'TEXTAREA' && 
        event.target.tagName !== 'SELECT') {
      
      // Look for nearby inputs to see if the user was trying to click one
      const rect = {
        left: event.clientX - 20,
        right: event.clientX + 20,
        top: event.clientY - 20,
        bottom: event.clientY + 20
      };
      
      // Find input elements near the click
      document.querySelectorAll('input, textarea, select').forEach(input => {
        const inputRect = input.getBoundingClientRect();
        
        // Check for overlap with the expanded click area
        if (rect.left <= inputRect.right && 
            rect.right >= inputRect.left && 
            rect.top <= inputRect.bottom && 
            rect.bottom >= inputRect.top) {
          
          // This input is near where the user clicked but didn't receive the click
          // It might be stuck - try to reset it
          console.log('Resetting nearby input that might be stuck:', input.id || input.name);
          input.disabled = false;
          input.readOnly = false;
          
          // Try to focus it
          setTimeout(() => {
            try {
              input.focus();
              
              // If it's an input with a value, put cursor at the end
              if (input.value && typeof input.selectionStart !== 'undefined') {
                input.selectionStart = input.selectionEnd = input.value.length;
              }
            } catch (e) {
              console.error('Error focusing reset input:', e);
            }
          }, 10);
        }
      });
    }
  });
  
  console.log('Windows input fixes applied');
} 