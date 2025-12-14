
// localStorage VERIFICATION SCRIPT
// Run this in the browser console to check what's in localStorage

console.log('🔍 Checking localStorage contents...');

const localStorageKeys = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key) {
    localStorageKeys.push(key);
  }
}

console.log('localStorage keys found:', localStorageKeys.length);
localStorageKeys.forEach(key => {
  const value = localStorage.getItem(key);
  console.log(`  ${key}: ${value ? value.substring(0, 100) + '...' : 'empty'}`);
});

if (localStorageKeys.length === 0) {
  console.log('✅ localStorage is completely empty - perfect!');
} else {
  console.log('⚠️ localStorage still contains data - run the clearing script again');
}
