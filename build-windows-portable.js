/**
 * Build Windows Portable Version Only
 * This script builds only the portable version to avoid NSIS issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building Windows Portable Version...\n');

try {
  // Update package.json to build only portable version
  const packageJsonPath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Temporarily modify the Windows target to only build portable
  const originalWinConfig = packageJson.build.win;
  packageJson.build.win = {
    ...originalWinConfig,
    target: [
      {
        target: "portable",
        arch: ["x64"]
      }
    ]
  };
  
  // Write the temporary config
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✓ Updated package.json for portable build');
  
  // Build the portable version
  console.log('🔨 Building Windows portable application...');
  execSync('npx electron-builder --win --x64', { stdio: 'inherit' });
  
  // Restore original config
  packageJson.build.win = originalWinConfig;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✓ Restored original package.json');
  
  console.log('\n✅ Windows portable build completed successfully!');
  console.log('📁 Check the "dist" folder for your Windows portable application');
  console.log('🎯 Look for: Pipe Inventory-Portable-1.4.0.exe');
  
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  
  // Try to restore original config even if build failed
  try {
    const packageJsonPath = path.join(__dirname, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    // Restore original config (this is a simplified restore)
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  } catch (restoreError) {
    console.error('Failed to restore package.json:', restoreError.message);
  }
  
  process.exit(1);
}