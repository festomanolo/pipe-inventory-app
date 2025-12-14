/**
 * Build Setup Script
 * 
 * This script prepares the environment for building the application.
 * It creates necessary directories and files for packaging.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const pngToIco = require('png-to-ico');

// Constants
const BUILD_DIR = path.join(__dirname, 'build');
const ICONS_DIR = path.join(BUILD_DIR, 'icons');
const PLACEHOLDER_ICON_SIZE = 1024; // Size for placeholder icons

// Main setup function
async function runSetup() {
  console.log('Setting up build environment...');
  
  // Create build directory structure
  createBuildDirectories();
  
  // Create icons for different platforms
  await createIcons();
  
  // Create license and other required files
  createRequiredFiles();
  
  console.log('Build setup completed successfully!');
  return true;
}

// Create necessary directories
function createBuildDirectories() {
  const buildDir = path.join(__dirname, 'build');
  const iconsDir = path.join(buildDir, 'icons');
  
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
    console.log('Created build directory');
  }
  
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
    console.log('Created icons directory');
  }
}

// Create icons for different platforms
async function createIcons() {
  const logoPath = path.join(__dirname, 'public', 'assets', 'images', 'logo.png');
  const iconsDir = path.join(__dirname, 'build', 'icons');
  
  if (!fs.existsSync(logoPath)) {
    console.error('Logo file not found at:', logoPath);
    return false;
  }
  
  try {
    // Create Windows icon (.ico)
    console.log('Creating Windows icon...');
    const icoBuffer = await pngToIco([logoPath]);
    const icoPath = path.join(iconsDir, 'icon.ico');
    fs.writeFileSync(icoPath, icoBuffer);
    console.log('Windows icon created at:', icoPath);
    
    // For macOS, we would typically create .icns files
    // This requires additional dependencies like sharp or iconutil
    console.log('Note: For macOS builds, you may need to manually create .icns files');
    
    // For Linux, we create multiple size PNG files
    console.log('Creating Linux icons...');
    const sizes = [16, 24, 32, 48, 64, 128, 256, 512];
    
    // This is a placeholder - in a real implementation, you would use
    // a library like 'sharp' to resize the images
    console.log('Note: For Linux builds, you may need to manually create multiple size icons');
    
    return true;
      } catch (error) {
    console.error('Error creating icons:', error);
    return false;
  }
}

// Create license and other required files
function createRequiredFiles() {
  const buildDir = path.join(__dirname, 'build');
  
  // Create license file
  const licensePath = path.join(buildDir, 'license.txt');
  const licenseContent = `Eliva Hardware Pipe Inventory Management System
Copyright (c) 2024 Eliva Hardware

All rights reserved.

This software is the property of Eliva Hardware and is protected by copyright law.
Unauthorized reproduction or distribution of this software, or any portion of it,
may result in severe civil and criminal penalties, and will be prosecuted to the
maximum extent possible under law.`;
    
    fs.writeFileSync(licensePath, licenseContent);
  console.log('License file created at:', licensePath);
  
  // Create entitlements for macOS
  const entitlementsPath = path.join(buildDir, 'entitlements.mac.plist');
    const entitlementsContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.cs.disable-library-validation</key>
    <true/>
  </dict>
</plist>`;
    
    fs.writeFileSync(entitlementsPath, entitlementsContent);
  console.log('macOS entitlements file created at:', entitlementsPath);
  
  // Create a placeholder background for DMG
  console.log('Note: For macOS DMG background, you may need to add a background.png to the build directory');
}

// If this script is run directly
if (require.main === module) {
  runSetup().then(success => {
    if (success) {
      console.log('Setup completed successfully!');
    } else {
      console.error('Setup failed!');
      process.exit(1);
    }
  }).catch(error => {
    console.error('Error during setup:', error);
    process.exit(1);
  });
}

// Export the setup function for use in other scripts
module.exports = {
  runSetup
};
