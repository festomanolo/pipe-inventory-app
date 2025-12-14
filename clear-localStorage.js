
// Run this in the browser console to clear localStorage
console.log('🧹 Clearing localStorage to force electron-store usage...');

localStorage.removeItem('sales_data');
localStorage.removeItem('sales_backup');
localStorage.removeItem('sales');
localStorage.removeItem('transactions');
localStorage.removeItem('inventory_data');
localStorage.removeItem('products_data');

console.log('✅ localStorage cleared successfully');
console.log('🔄 Refresh the page and try the profit report again');
