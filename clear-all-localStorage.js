
// COMPREHENSIVE localStorage CLEARING SCRIPT
// Run this in the browser console to force electron-store usage

console.log('🧹 Clearing ALL localStorage data to force electron-store usage...');

// Clear all sales-related data
localStorage.removeItem('sales_data');
localStorage.removeItem('sales_backup');
localStorage.removeItem('sales');
localStorage.removeItem('transactions');
localStorage.removeItem('sales_data_backup');
localStorage.removeItem('sales_cache');

// Clear all inventory-related data
localStorage.removeItem('inventory_data');
localStorage.removeItem('inventory_backup');
localStorage.removeItem('inventory');
localStorage.removeItem('products_data');
localStorage.removeItem('products_backup');
localStorage.removeItem('products_cache');

// Clear all report-related data
localStorage.removeItem('reports_data');
localStorage.removeItem('reports_backup');
localStorage.removeItem('reports_cache');

// Clear any other potential data sources
localStorage.removeItem('app_data');
localStorage.removeItem('app_backup');
localStorage.removeItem('data_cache');
localStorage.removeItem('cache');

// Clear all keys that might contain sales or inventory data
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && (key.includes('sale') || key.includes('inventory') || key.includes('product') || key.includes('report'))) {
    keysToRemove.push(key);
  }
}

keysToRemove.forEach(key => {
  localStorage.removeItem(key);
  console.log('Removed:', key);
});

console.log('✅ ALL localStorage data cleared successfully');
console.log('🔄 The application will now use electron-store data exclusively');
console.log('📊 Refresh the page and try the profit report again');
console.log('💡 If you still see issues, restart the application completely');
