
// Run this in the browser console to check localStorage sales data
console.log('🔍 Checking localStorage sales data...');

const salesData = localStorage.getItem('sales_data');
if (salesData) {
  const sales = JSON.parse(salesData);
  console.log('Sales in localStorage:', sales.length);
  
  if (sales.length > 0) {
    console.log('Sample sales:');
    sales.slice(0, 5).forEach((sale, index) => {
      console.log(`  ${index + 1}. ${sale.date || sale.createdAt}: ${sale.totalAmount} TSh`);
      if (sale.items) {
        sale.items.forEach(item => {
          console.log(`     - ${item.product_name} (ID: ${item.product_id})`);
        });
      }
    });
    
    // Check for unknown products
    const unknownProducts = sales.filter(sale => 
      sale.items && sale.items.some(item => 
        !item.product_id || item.product_id === 'unknown-id' || item.product_name === 'Unknown Product'
      )
    );
    
    console.log('Sales with unknown products:', unknownProducts.length);
  }
} else {
  console.log('No sales data found in localStorage');
}

// To clear localStorage and force use of electron-store:
// localStorage.removeItem('sales_data');
// console.log('localStorage sales data cleared');
