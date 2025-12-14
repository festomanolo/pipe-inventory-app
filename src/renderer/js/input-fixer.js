/**
 * Input Field Fixer for Modals
 * This script addresses specific issues with input fields in modals becoming uneditable
 * This is especially problematic on Windows after using the app for a while
 */

// Execute when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Modal input fixer initializing...');
  
  // Add event listeners to all modals to fix inputs when they are shown
  const allModals = document.querySelectorAll('.modal');
  
  allModals.forEach(modal => {
    // When a modal is about to be shown, reset all input fields in it
    modal.addEventListener('show.bs.modal', function() {
      console.log(`Modal ${modal.id} is being shown, fixing inputs...`);
      
      // Find all input fields in the modal
      const inputs = modal.querySelectorAll('input, textarea, select');
      
      // Reset each input field
      inputs.forEach(input => {
        // Make sure the input is editable
        input.readOnly = false;
        input.disabled = false;
        
        // Ensure it has proper pointer events
        input.style.pointerEvents = 'auto';
        
        // Clear any potential error state class
        input.classList.remove('input-error');
        
        // Fix for Windows: toggle display to force a redraw
        const originalDisplay = input.style.display;
        input.style.display = 'none';
        setTimeout(() => {
          input.style.display = originalDisplay;
        }, 5);
      });
    });
    
    // Also fix when the modal is fully shown
    modal.addEventListener('shown.bs.modal', function() {
      const inputs = modal.querySelectorAll('input, textarea, select');
      
      // Focus the first input after a small delay
      setTimeout(() => {
        // Try to find the first visible, non-hidden input
        const firstInput = Array.from(inputs).find(input => 
          !input.hidden && 
          input.type !== 'hidden' && 
          getComputedStyle(input).display !== 'none'
        );
        
        if (firstInput) {
          try {
            firstInput.focus();
            console.log(`Focused first input in modal ${modal.id}:`, firstInput.id || firstInput.name);
          } catch (e) {
            console.warn('Could not focus first input:', e);
          }
        }
      }, 200);
    });
  });
  
  // Global click handler for modal containers to reset inputs
  document.addEventListener('click', function(event) {
    const modalBody = event.target.closest('.modal-body');
    if (modalBody) {
      // If clicking in a modal body, check if any nearby input should be focused
      const rect = {
        left: event.clientX - 30,
        right: event.clientX + 30,
        top: event.clientY - 30,
        bottom: event.clientY + 30
      };
      
      // Find input elements near the click in this modal
      modalBody.querySelectorAll('input, textarea, select').forEach(input => {
        if (input.disabled || input.readOnly) {
          // Reset potentially stuck inputs
          input.disabled = false;
          input.readOnly = false;
          console.log('Reset potentially stuck input in modal:', input.id || input.name);
        }
        
        const inputRect = input.getBoundingClientRect();
        
        // Check for overlap with the expanded click area
        if (rect.left <= inputRect.right && 
            rect.right >= inputRect.left && 
            rect.top <= inputRect.bottom && 
            rect.bottom >= inputRect.top) {
          
          // This input is near where the user clicked but didn't receive the click
          // It might be stuck - try to reset it and focus it
          console.log('Resetting and focusing nearby input in modal:', input.id || input.name);
          
          setTimeout(() => {
            try {
              input.disabled = false;
              input.readOnly = false;
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
  
  // Create a MutationObserver to watch for dynamically added modals
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(node => {
          // Check if the added node is a modal or contains modals
          if (node.nodeType === Node.ELEMENT_NODE) {
            const newModals = node.classList && node.classList.contains('modal') ? 
              [node] : node.querySelectorAll('.modal');
            
            if (newModals.length > 0) {
              console.log(`Found ${newModals.length} new modals, adding input fixing handlers`);
              
              newModals.forEach(modal => {
                // Add the same event listeners as above
                modal.addEventListener('show.bs.modal', function() {
                  console.log(`New modal ${modal.id} is being shown, fixing inputs...`);
                  
                  const inputs = modal.querySelectorAll('input, textarea, select');
                  inputs.forEach(input => {
                    input.readOnly = false;
                    input.disabled = false;
                    input.style.pointerEvents = 'auto';
                    
                    // Toggle display to force a redraw
                    const originalDisplay = input.style.display;
                    input.style.display = 'none';
                    setTimeout(() => {
                      input.style.display = originalDisplay;
                    }, 5);
                  });
                });
                
                modal.addEventListener('shown.bs.modal', function() {
                  const inputs = modal.querySelectorAll('input, textarea, select');
                  
                  // Focus the first input after a small delay
                  setTimeout(() => {
                    const firstInput = Array.from(inputs).find(input => 
                      !input.hidden && 
                      input.type !== 'hidden' && 
                      getComputedStyle(input).display !== 'none'
                    );
                    
                    if (firstInput) {
                      try {
                        firstInput.focus();
                      } catch (e) {
                        console.warn('Could not focus first input:', e);
                      }
                    }
                  }, 200);
                });
              });
            }
          }
        });
      }
    });
  });
  
  // Start observing the document for modal changes
  observer.observe(document.body, { childList: true, subtree: true });
  
  console.log('Modal input fixer initialized');
}); 