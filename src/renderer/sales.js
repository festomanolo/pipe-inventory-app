// Initialize on DOMContentLoaded if not called externally
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, checking if sales need initialization');
  
  // Only initialize if not already called and we're on the sales page
  if (
    !window.salesInitialized && 
    document.getElementById('sales-table') &&
    !document.querySelector('.main-content iframe')
  ) {
    console.log('Initializing sales from DOMContentLoaded');
    window.salesInitialized = true;
    initializeSales();
    
    // Add event listener for the Generate Document button in the modal footer
    const generateDocumentBtn = document.getElementById('generate-document-btn');
    if (generateDocumentBtn) {
      generateDocumentBtn.addEventListener('click', () => {
        console.log('Print button clicked in modal footer');
        window.print();
      });
    }
  }
}); 