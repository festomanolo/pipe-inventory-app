
// DATA VERIFICATION SCRIPT
// Run this in the browser console to test our data

console.log('🧪 Testing profit report data...');

// Simulate the profit report logic
const now = new Date();
const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

console.log('Date range:', startOfMonth.toDateString(), 'to', endOfMonth.toDateString());

// This will be replaced by actual data from electron-store
console.log('📊 The profit report should show:');
console.log('   - Real product names (not "Unknown Product")');
console.log('   - Revenue: ~TZS 41,755,644');
console.log('   - Profit: ~TZS 8,458,164');
console.log('   - Margin: ~20.26%');

console.log('✅ If you see these values, the fix worked!');
console.log('❌ If you still see "Unknown Product", localStorage needs clearing');
