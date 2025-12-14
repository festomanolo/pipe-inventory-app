/**
 * Windows-specific input field fix
 * Ensures all input fields work properly after logout and during long sessions on Windows
 */

(function() {
  'use strict';
  
  // Global flag to prevent recursive fixes
  let isFixingInputs = false;

  // Function to completely reset and fix any input field
  function fixInputField(inputElement, inputId) {
    if (!inputElement) {
      inputElement = document.getElementById(inputId);
      if (!inputElement) return null;
    }

    console.log(`Fixing input field: ${inputId || inputElement.id}`);

    // Store current value and attributes
    const currentValue = inputElement.value;
    const currentType = inputElement.type;
    const currentPlaceholder = inputElement.placeholder;
    const currentRequired = inputElement.required;
    const currentClasses = inputElement.className;
    const currentName = inputElement.name;
    const currentId = inputElement.id;
    
    // First, try a gentle fix without cloning
    inputElement.disabled = false;
    inputElement.readOnly = false;
    inputElement.removeAttribute('disabled');
    inputElement.removeAttribute('readonly');
    inputElement.removeAttribute('tabindex');
    
    // Test if gentle fix works
    const testValue = inputElement.value;
    inputElement.value = 'test';
    const gentleFixWorks = inputElement.value === 'test';
    inputElement.value = testValue;
    
    if (gentleFixWorks) {
      console.log(`Gentle fix worked for ${inputId || inputElement.id}`);
      // Apply minimal styling fixes
      inputElement.style.pointerEvents = 'auto';
      inputElement.style.userSelect = 'text';
      inputElement.style.webkitUserSelect = 'text';
      inputElement.tabIndex = 0;
      return inputElement;
    }
    
    console.log(`Gentle fix failed, applying aggressive fix for ${inputId || inputElement.id}`);
    
    // Aggressive fix: clone the element
    const newInput = inputElement.cloneNode(false);
    newInput.value = '';
    newInput.type = currentType;
    newInput.placeholder = currentPlaceholder;
    newInput.required = currentRequired;
    newInput.className = currentClasses;
    newInput.name = currentName;
    newInput.id = currentId;
    
    // Replace the old input with the new one
    inputElement.parentNode.replaceChild(newInput, inputElement);
    
    // Apply essential styling only
    newInput.style.pointerEvents = 'auto';
    newInput.style.userSelect = 'text';
    newInput.style.webkitUserSelect = 'text';
    newInput.style.mozUserSelect = 'text';
    newInput.style.msUserSelect = 'text';
    newInput.style.opacity = '1';
    newInput.style.visibility = 'visible';
    
    // Force enable input functionality
    newInput.tabIndex = 0;
    newInput.contentEditable = false;
    newInput.disabled = false;
    newInput.readOnly = false;
    
    // Remove problematic attributes
    newInput.removeAttribute('aria-disabled');
    newInput.removeAttribute('data-disabled');
    
    // Restore value
    newInput.value = currentValue;
    
    console.log(`Input field ${inputId || inputElement.id} aggressively fixed for Windows`);
    return newInput;
  }

  // Function to completely reset and fix password input field
  function fixPasswordInput() {
    const passwordInput = document.getElementById('passwordInput');
    const newInput = fixInputField(passwordInput, 'passwordInput');
    
    if (!newInput) return;
    
    // Re-add the password toggle functionality - but don't clone the button
    const toggleBtn = document.getElementById('passwordToggle');
    if (toggleBtn) {
      // Remove existing listeners without cloning
      toggleBtn.onclick = null;
      
      // Add new listener
      toggleBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const currentInput = document.getElementById('passwordInput');
        const icon = this.querySelector('i');
        
        if (currentInput) {
          if (currentInput.type === 'password') {
            currentInput.type = 'text';
            icon.className = 'fas fa-eye-slash';
          } else {
            currentInput.type = 'password';
            icon.className = 'fas fa-eye';
          }
        }
      });
      
      console.log('✅ Password toggle functionality restored');
    }
    
    // Force focus after a short delay
    setTimeout(() => {
      newInput.focus();
      newInput.click(); // Additional click to ensure it's active
    }, 200);

    return newInput;
  }

  // Function to fix all input fields on the page
  function fixAllInputFields() {
    const inputSelectors = [
      'input[type="text"]',
      'input[type="password"]',
      'input[type="email"]',
      'input[type="number"]',
      'input[type="search"]',
      'textarea',
      'select'
    ];
    
    inputSelectors.forEach(selector => {
      const inputs = document.querySelectorAll(selector);
      inputs.forEach(input => {
        if (input.id) {
          fixInputField(input, input.id);
        }
      });
    });
    
    console.log('All input fields fixed for Windows');
  }

  // Function to clear all session-related interference
  function clearSessionInterference() {
    try {
      console.log('Clearing session interference for Windows...');
      
      // Clear SessionManager interference
      if (window.SessionManager) {
        if (window.SessionManager.clearSessionTracking) {
          window.SessionManager.clearSessionTracking();
        }
        if (window.SessionManager.forceClearAllListeners) {
          window.SessionManager.forceClearAllListeners();
        }
      }

      // Clear any remaining activity timers
      if (window.activityTimer) {
        clearTimeout(window.activityTimer);
        window.activityTimer = null;
      }
      if (window.warningTimer) {
        clearTimeout(window.warningTimer);
        window.warningTimer = null;
      }

      // Remove problematic event listeners that might interfere with input
      const problematicEvents = ['mousedown', 'mousemove', 'keypress', 'keydown', 'keyup', 'input', 'change'];
      problematicEvents.forEach(eventType => {
        // Create a dummy function to remove any remaining listeners
        const dummyHandler = function() {};
        document.removeEventListener(eventType, dummyHandler, false);
        document.removeEventListener(eventType, dummyHandler, true);
      });

      // Force clear any global variables that might interfere
      if (window.updateLastActivity) {
        window.updateLastActivity = null;
      }

      console.log('Session interference cleared for Windows');
    } catch (error) {
      console.error('Error clearing session interference:', error);
    }
  }

  // Function to ensure all input fields remain functional
  function ensureInputFunctionality() {
    console.log('🔍 Checking input field functionality...');
    
    // Only check text input fields, not dropdowns or other elements
    const textInputs = document.querySelectorAll('input[type="text"], input[type="password"], input[type="email"], input[type="number"], textarea');
    let fixedCount = 0;
    
    textInputs.forEach(input => {
      if (!input.id) return; // Skip inputs without IDs
      
      try {
        // Test if input is functional
        const originalValue = input.value;
        const testValue = 'test_' + Date.now();
        
        input.value = testValue;
        const isWorking = input.value === testValue;
        input.value = originalValue; // Restore original value
        
        if (!isWorking) {
          console.log(`🔧 Input field ${input.id} not functional, applying fix...`);
          fixInputField(input, input.id);
          fixedCount++;
        }
      } catch (error) {
        console.warn(`Error testing input field ${input.id}:`, error);
        // Only fix if it's clearly broken
        if (input.disabled || input.readOnly) {
          fixInputField(input, input.id);
          fixedCount++;
        }
      }
    });
    
    if (fixedCount > 0) {
      console.log(`✅ Fixed ${fixedCount} input fields`);
    }
  }

  // Function to monitor and fix input fields continuously with operation awareness
  function startInputMonitoring() {
    let operationInProgress = false;
    let operationInterval = null;
    
    // Normal monitoring - check every 3 seconds during normal operation
    const normalInterval = setInterval(() => {
      if (!operationInProgress) {
        ensureInputFunctionality();
      }
    }, 3000);
    
    // Enhanced monitoring during long operations
    document.addEventListener('operation-start', (event) => {
      console.log('🔄 Long operation started, increasing input monitoring...', event.detail);
      operationInProgress = true;
      
      // Check every 500ms during operations to prevent input field blocking
      operationInterval = setInterval(() => {
        console.log('🔧 Monitoring inputs during operation...');
        ensureInputFunctionality();
      }, 500);
    });
    
    document.addEventListener('operation-end', (event) => {
      console.log('✅ Long operation ended, applying comprehensive recovery...', event.detail);
      operationInProgress = false;
      
      if (operationInterval) {
        clearInterval(operationInterval);
        operationInterval = null;
      }
      
      // Apply comprehensive recovery after operations
      setTimeout(() => {
        console.log('🚨 Applying post-operation input field recovery...');
        emergencyInputRecovery();
      }, 200);
      
      // Additional recovery after a longer delay
      setTimeout(() => {
        console.log('🔧 Secondary input field recovery...');
        ensureInputFunctionality();
      }, 1000);
    });
    
    // Also check when user interacts with the page (but avoid interfering with input events)
    document.addEventListener('click', (event) => {
      // Don't interfere if clicking on input fields
      if (event.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) {
        return;
      }
      setTimeout(ensureInputFunctionality, 200);
    });
    
    // Monitor for specific events that might break input fields
    document.addEventListener('DOMNodeInserted', () => {
      setTimeout(ensureInputFunctionality, 500);
    });
    
    // Fix inputs after any AJAX-like operations
    const originalFetch = window.fetch;
    if (originalFetch) {
      window.fetch = function(...args) {
        return originalFetch.apply(this, args).then(response => {
          setTimeout(ensureInputFunctionality, 300);
          return response;
        });
      };
    }
    
    console.log('Enhanced input field monitoring started for Windows with operation awareness');
  }

  // Initialize fixes when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    console.log('Windows input fix initializing...');
    
    // Check if we're coming from a logout
    const isLoggingOut = localStorage.getItem('isLoggingOut');
    if (isLoggingOut) {
      console.log('Detected logout, applying aggressive input field fixes...');
      localStorage.removeItem('isLoggingOut');
      
      // Apply more aggressive fixes for logout scenario
      setTimeout(() => {
        clearSessionInterference();
        fixAllInputFields();
        if (document.getElementById('passwordInput')) {
          fixPasswordInput();
        }
      }, 50);
      
      // Multiple fix attempts for logout scenario
      setTimeout(() => {
        fixAllInputFields();
        ensureInputFunctionality();
      }, 200);
      
      setTimeout(() => {
        fixAllInputFields();
        ensureInputFunctionality();
      }, 500);
      
      setTimeout(() => {
        fixAllInputFields();
        ensureInputFunctionality();
      }, 1000);
    } else {
      // Normal initialization
      clearSessionInterference();
      
      // Fix all input fields immediately
      setTimeout(() => {
        fixAllInputFields();
        if (document.getElementById('passwordInput')) {
          fixPasswordInput();
        }
      }, 100);
      
      // Re-fix input fields after additional delay to ensure they're ready
      setTimeout(() => {
        fixAllInputFields();
        ensureInputFunctionality();
      }, 500);
    }
    
    // Start continuous monitoring
    startInputMonitoring();
  });

  // Also run fixes when window gains focus (in case user switched windows)
  window.addEventListener('focus', function() {
    setTimeout(() => {
      ensureInputFunctionality();
    }, 100);
  });

  // Run fixes when page becomes visible (tab switching)
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
      setTimeout(() => {
        ensureInputFunctionality();
      }, 200);
    }
  });

  // Global input field monitoring for all pages
  document.addEventListener('click', (event) => {
    // Only check text input fields when clicked, not dropdowns or buttons
    if (event.target && ['INPUT'].includes(event.target.tagName)) {
      const inputType = event.target.type;
      const textInputTypes = ['text', 'password', 'email', 'number'];
      
      if (textInputTypes.includes(inputType) && event.target.id) {
        setTimeout(() => {
          const input = event.target;
          
          // Test if the clicked input is functional
          const originalValue = input.value;
          const testValue = 'test_' + Date.now();
          
          input.value = testValue;
          if (input.value !== testValue) {
            console.log(`🚨 Input field ${input.id} clicked but not functional, applying targeted fix...`);
            fixInputField(input, input.id);
          } else {
            input.value = originalValue;
          }
        }, 50);
      }
    }
  });

  // Special handler for login page after logout
  if (window.location.pathname.includes('login.html')) {
    // Additional aggressive fixes for login page
    setTimeout(() => {
      console.log('Applying login page specific fixes...');
      clearSessionInterference();
      fixAllInputFields();
      
      // Focus the password input if it exists
      const passwordInput = document.getElementById('passwordInput');
      if (passwordInput) {
        setTimeout(() => {
          passwordInput.focus();
        }, 100);
      }
    }, 1500);

    // Monitor for any session interference on login page
    setInterval(() => {
      if (window.location.pathname.includes('login.html')) {
        const passwordInput = document.getElementById('passwordInput');
        if (passwordInput && !passwordInput.disabled && !passwordInput.readOnly) {
          // Test if input is working
          const testValue = passwordInput.value;
          passwordInput.value = 'test';
          if (passwordInput.value !== 'test') {
            console.log('Login input field broken, applying emergency fix...');
            emergencyInputRecovery();
          } else {
            passwordInput.value = testValue;
          }
        }
      }
    }, 5000); // Check every 5 seconds on login page
  }

  // Enhanced emergency input field recovery function for post-operation scenarios
  function emergencyInputRecovery() {
    console.log('🚨 Enhanced emergency input field recovery initiated...');
    
    try {
      // Clear any problematic event listeners first
      clearSessionInterference();
      
      // Get all input fields that might need fixing
      const inputSelectors = [
        'input[type="text"]',
        'input[type="password"]', 
        'input[type="email"]',
        'input[type="number"]',
        'input[type="search"]',
        'textarea',
        'select'
      ];
      
      let fixedCount = 0;
      let totalChecked = 0;
      
      inputSelectors.forEach(selector => {
        const inputs = document.querySelectorAll(selector);
        console.log(`🔍 Checking ${inputs.length} ${selector} elements...`);
        
        inputs.forEach(input => {
          if (input.id) {
            totalChecked++;
            
            // Test if this specific input needs fixing
            const originalValue = input.value;
            const testValue = 'test_' + Date.now();
            
            try {
              input.value = testValue;
              const needsFix = input.value !== testValue;
              input.value = originalValue;
              
              // Also check for disabled/readonly states
              const isDisabledOrReadonly = input.disabled || input.readOnly;
              const hasProblematicStyles = input.style.pointerEvents === 'none' || 
                                         input.style.userSelect === 'none';
              
              if (needsFix || isDisabledOrReadonly || hasProblematicStyles) {
                console.log(`🔧 Emergency fix needed for ${input.id} (needsFix: ${needsFix}, disabled: ${input.disabled}, readonly: ${input.readOnly})`);
                
                // Apply comprehensive fix
                input.disabled = false;
                input.readOnly = false;
                input.style.pointerEvents = 'auto';
                input.style.userSelect = 'text';
                input.style.webkitUserSelect = 'text';
                input.style.mozUserSelect = 'text';
                input.style.msUserSelect = 'text';
                input.tabIndex = 0;
                
                // Remove problematic attributes
                input.removeAttribute('aria-disabled');
                input.removeAttribute('data-disabled');
                input.removeAttribute('readonly');
                
                // Test if gentle fix worked
                input.value = testValue;
                const gentleWorked = input.value === testValue;
                input.value = originalValue;
                
                if (!gentleWorked) {
                  console.log(`🔨 Applying aggressive fix for ${input.id}`);
                  // Apply aggressive fix by cloning element
                  const newInput = input.cloneNode(false);
                  
                  // Copy all important attributes
                  newInput.value = originalValue;
                  newInput.type = input.type;
                  newInput.placeholder = input.placeholder;
                  newInput.required = input.required;
                  newInput.className = input.className;
                  newInput.name = input.name;
                  newInput.id = input.id;
                  
                  // Ensure it's functional
                  newInput.disabled = false;
                  newInput.readOnly = false;
                  newInput.style.pointerEvents = 'auto';
                  newInput.style.userSelect = 'text';
                  newInput.style.webkitUserSelect = 'text';
                  newInput.tabIndex = 0;
                  
                  // Replace the problematic input
                  input.parentNode.replaceChild(newInput, input);
                }
                
                fixedCount++;
              }
            } catch (testError) {
              console.warn(`⚠️ Error testing input field ${input.id}:`, testError);
              // If we can't test it, assume it needs fixing
              fixInputField(input, input.id);
              fixedCount++;
            }
          }
        });
      });
      
      console.log(`🔍 Emergency recovery checked ${totalChecked} input fields`);
      
      if (fixedCount > 0) {
        console.log(`✅ Emergency recovery fixed ${fixedCount} input fields`);
        
        // Apply additional recovery measures
        setTimeout(() => {
          console.log('🔧 Applying secondary recovery measures...');
          
          // Re-enable any inputs that might have been disabled again
          document.querySelectorAll('input, textarea, select').forEach(input => {
            if (input.id && (input.disabled || input.readOnly)) {
              console.log(`🔧 Re-enabling ${input.id}`);
              input.disabled = false;
              input.readOnly = false;
              input.style.pointerEvents = 'auto';
            }
          });
        }, 500);
        
      } else {
        console.log('✅ No input fields needed emergency recovery');
      }
      
    } catch (error) {
      console.error('❌ Emergency recovery failed:', error);
      
      // Fallback: try to fix all inputs with the basic method
      try {
        console.log('🔄 Attempting fallback recovery...');
        fixAllInputFields();
      } catch (fallbackError) {
        console.error('❌ Fallback recovery also failed:', fallbackError);
      }
    }
  }

  // Export functions for use in other scripts
  window.WinLoginFix = {
    fixPasswordInput,
    fixInputField,
    fixAllInputFields,
    clearSessionInterference,
    ensureInputFunctionality,
    startInputMonitoring,
    emergencyInputRecovery
  };

})(); 