/**
 * Emergency Windows Input Fix
 * Simple, direct approach to fix Windows input field issues
 */

(function() {
  'use strict';
  
  console.log('🚨 Emergency Windows Input Fix Loading...');
  
  // Simple function to make an input field work
  function makeInputWork(input) {
    if (!input) return false;
    
    try {
      // Remove any blocking attributes
      input.removeAttribute('disabled');
      input.removeAttribute('readonly');
      input.removeAttribute('tabindex');
      
      // Set essential properties
      input.disabled = false;
      input.readOnly = false;
      input.tabIndex = 0;
      
      // Remove any CSS that might block input
      input.style.pointerEvents = 'auto';
      input.style.userSelect = 'text';
      input.style.webkitUserSelect = 'text';
      input.style.mozUserSelect = 'text';
      input.style.msUserSelect = 'text';
      
      // Test if it works
      const testValue = 'test123';
      const originalValue = input.value;
      input.value = testValue;
      const works = input.value === testValue;
      input.value = originalValue;
      
      if (works) {
        console.log(`✅ Input ${input.id || input.name || 'unnamed'} is now working`);
        return true;
      } else {
        console.log(`❌ Input ${input.id || input.name || 'unnamed'} still not working`);
        return false;
      }
    } catch (error) {
      console.error('Error fixing input:', error);
      return false;
    }
  }
  
  // Fix all text inputs on the page
  function fixAllTextInputs() {
    console.log('🔧 Fixing all text inputs...');
    
    const textInputs = document.querySelectorAll('input[type="text"], input[type="password"], input[type="email"], input[type="number"], textarea');
    let fixedCount = 0;
    
    textInputs.forEach(input => {
      if (makeInputWork(input)) {
        fixedCount++;
      }
    });
    
    console.log(`✅ Fixed ${fixedCount} text inputs`);
    return fixedCount;
  }
  
  // Nuclear option: completely recreate broken inputs
  function nuclearInputFix() {
    console.log('☢️ Nuclear input fix - recreating all text inputs...');
    
    const textInputs = document.querySelectorAll('input[type="text"], input[type="password"], input[type="email"], input[type="number"], textarea');
    let recreatedCount = 0;
    
    textInputs.forEach(input => {
      try {
        // Test if input is broken
        const testValue = 'test123';
        const originalValue = input.value;
        input.value = testValue;
        const isBroken = input.value !== testValue;
        input.value = originalValue;
        
        if (isBroken) {
          console.log(`☢️ Recreating broken input: ${input.id || input.name || 'unnamed'}`);
          
          // Create a completely new input element
          const newInput = document.createElement(input.tagName.toLowerCase());
          
          // Copy all attributes
          Array.from(input.attributes).forEach(attr => {
            newInput.setAttribute(attr.name, attr.value);
          });
          
          // Copy value and other properties
          newInput.value = originalValue;
          newInput.type = input.type;
          newInput.placeholder = input.placeholder;
          newInput.className = input.className;
          
          // Ensure it works
          newInput.disabled = false;
          newInput.readOnly = false;
          newInput.tabIndex = 0;
          newInput.style.pointerEvents = 'auto';
          newInput.style.userSelect = 'text';
          
          // Replace the old input
          input.parentNode.replaceChild(newInput, input);
          recreatedCount++;
          
          console.log(`✅ Recreated input: ${newInput.id || newInput.name || 'unnamed'}`);
        }
      } catch (error) {
        console.error('Error in nuclear fix:', error);
      }
    });
    
    console.log(`☢️ Nuclear fix completed: ${recreatedCount} inputs recreated`);
    return recreatedCount;
  }
  
  // Main fix function
  function emergencyFix() {
    console.log('🚨 Starting emergency input fix...');
    
    // Step 1: Try gentle fix
    let fixedCount = fixAllTextInputs();
    
    if (fixedCount === 0) {
      console.log('🚨 Gentle fix failed, trying nuclear option...');
      // Step 2: Nuclear option
      nuclearInputFix();
    }
    
    // Step 3: Re-setup password toggle if it exists
    setupPasswordToggle();
  }
  
  // Setup password toggle functionality
  function setupPasswordToggle() {
    const passwordInput = document.getElementById('passwordInput');
    const toggleBtn = document.getElementById('passwordToggle');
    
    if (passwordInput && toggleBtn) {
      // Remove old listeners
      toggleBtn.onclick = null;
      
      // Add new listener
      toggleBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const input = document.getElementById('passwordInput');
        const icon = this.querySelector('i');
        
        if (input) {
          if (input.type === 'password') {
            input.type = 'text';
            if (icon) icon.className = 'fas fa-eye-slash';
          } else {
            input.type = 'password';
            if (icon) icon.className = 'fas fa-eye';
          }
        }
      });
      
      console.log('✅ Password toggle setup complete');
    }
  }
  
  // Run fix when page loads
  document.addEventListener('DOMContentLoaded', function() {
    console.log('🚨 Emergency Windows Input Fix - DOM Ready');
    
    // Initial fix
    setTimeout(emergencyFix, 100);
    
    // Additional fixes with delays
    setTimeout(emergencyFix, 500);
    setTimeout(emergencyFix, 1000);
    
    // Periodic check
    setInterval(() => {
      const textInputs = document.querySelectorAll('input[type="text"], input[type="password"], input[type="email"], input[type="number"], textarea');
      let brokenCount = 0;
      
      textInputs.forEach(input => {
        const testValue = 'test123';
        const originalValue = input.value;
        input.value = testValue;
        if (input.value !== testValue) {
          brokenCount++;
        }
        input.value = originalValue;
      });
      
      if (brokenCount > 0) {
        console.log(`🚨 Found ${brokenCount} broken inputs, applying emergency fix...`);
        emergencyFix();
      }
    }, 3000);
  });
  
  // Run fix when window gains focus
  window.addEventListener('focus', function() {
    setTimeout(emergencyFix, 100);
  });
  
  // Export for manual use
  window.EmergencyInputFix = {
    fix: emergencyFix,
    fixAll: fixAllTextInputs,
    nuclear: nuclearInputFix
  };
  
  console.log('🚨 Emergency Windows Input Fix Loaded');
  
})();