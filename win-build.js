/**
 * Simple Windows Build Script
 * Non-interactive Windows build script
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Windows Build Process...\n');

try {
  // Ensure build directories exist
  const buildDir = path.join(__dirname, 'build');
  const iconsDir = path.join(buildDir, 'icons');
  const distDir = path.join(__dirname, 'dist');
  
  [buildDir, iconsDir, distDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✓ Created directory: ${dir}`);
    }
  });
  
  // Install dependencies if needed
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  console.log('✓ Dependencies installed\n');
  
  // Build for Windows
  console.log('🔨 Building Windows application...');
  execSync('npx electron-builder --win --x64', { stdio: 'inherit' });
  
  console.log('\n✅ Windows build completed successfully!');
  console.log('📁 Check the "dist" folder for your Windows application files');
  
} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  process.exit(1);
}