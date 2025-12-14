/**
 * Page Reveal Animation System
 * This script handles the reveal animations for all pages in the app
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize page reveal animations
  initPageRevealAnimations();
});

/**
 * Initialize page reveal animations for the current page
 */
function initPageRevealAnimations() {
  // Get the main content container
  const mainContent = document.querySelector('.main-content');
  if (!mainContent) return;
  
  // Add the page-content class to the main content
  mainContent.classList.add('page-content');
  
  // Add staggered animation to cards and other elements
  const cards = mainContent.querySelectorAll('.card');
  const statCards = mainContent.querySelectorAll('.stat-card');
  const tables = mainContent.querySelectorAll('.table-responsive');
  
  // Apply staggered animations to cards
  if (cards.length > 0) {
    cards.forEach((card, index) => {
      card.classList.add('animate-fade-in');
      card.style.animationDelay = `${0.1 + (index * 0.05)}s`;
    });
  }
  
  // Apply animations to stat cards with different animation
  if (statCards.length > 0) {
    statCards.forEach((card, index) => {
      card.classList.add('animate-fade-in-left');
      card.style.animationDelay = `${0.1 + (index * 0.1)}s`;
    });
  }
  
  // Apply animations to tables
  if (tables.length > 0) {
    tables.forEach((table, index) => {
      table.classList.add('animate-fade-in');
      table.style.animationDelay = `${0.3 + (index * 0.1)}s`;
    });
  }
  
  // Apply animation to content header
  const contentHeader = mainContent.querySelector('.content-header');
  if (contentHeader) {
    contentHeader.classList.add('animate-fade-in-left');
    contentHeader.style.animationDelay = '0.1s';
  }
  
  // Apply staggered animations to table rows (when they exist)
  const tableRows = mainContent.querySelectorAll('tbody tr');
  if (tableRows.length > 0) {
    tableRows.forEach((row, index) => {
      // Limit the max delay to avoid too long animations
      const delay = Math.min(0.1 + (index * 0.03), 0.5);
      row.classList.add('animate-fade-in');
      row.style.animationDelay = `${delay}s`;
    });
  }
  
  // Apply animations to forms
  const forms = mainContent.querySelectorAll('form');
  if (forms.length > 0) {
    forms.forEach((form) => {
      form.classList.add('animate-fade-in');
      form.style.animationDelay = '0.2s';
      
      // Add staggered animations to form groups
      const formGroups = form.querySelectorAll('.form-group, .mb-3');
      if (formGroups.length > 0) {
        formGroups.forEach((group, index) => {
          group.classList.add('animate-slide-up');
          group.style.animationDelay = `${0.2 + (index * 0.05)}s`;
        });
      }
    });
  }
  
  // Apply animations to modals when they open
  const modals = document.querySelectorAll('.modal');
  if (modals.length > 0) {
    modals.forEach((modal) => {
      modal.addEventListener('show.bs.modal', () => {
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
          modalContent.classList.add('animate-scale-in');
        }
        
        // Add staggered animations to modal form groups
        const formGroups = modal.querySelectorAll('.form-group, .mb-3');
        if (formGroups.length > 0) {
          formGroups.forEach((group, index) => {
            group.classList.add('animate-slide-up');
            group.style.animationDelay = `${0.1 + (index * 0.05)}s`;
          });
        }
      });
    });
  }
  
  // Trigger the reveal animation after a short delay
  setTimeout(() => {
    mainContent.classList.add('revealed');
  }, 100);
}
