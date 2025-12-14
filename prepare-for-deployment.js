const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function prepareForDeployment() {
  console.log('📦 Preparing Windows app for deployment...');
  
  try {
    const sourceDir = 'dist/win-unpacked';
    const deployDir = 'deployment';
    const appName = 'Eliva-Hardware-Windows';
    const version = '1.4.0';
    const finalDir = path.join(deployDir, `${appName}-v${version}`);
    
    // Check if source exists
    if (!fs.existsSync(sourceDir)) {
      console.error('❌ Source directory not found. Please build the app first.');
      console.log('Run: npx electron-builder --win --dir');
      process.exit(1);
    }
    
    // Create deployment directory
    if (fs.existsSync(deployDir)) {
      console.log('🧹 Cleaning existing deployment directory...');
      fs.rmSync(deployDir, { recursive: true, force: true });
    }
    
    fs.mkdirSync(deployDir, { recursive: true });
    fs.mkdirSync(finalDir, { recursive: true });
    
    console.log('📁 Copying application files...');
    
    // Copy the entire unpacked directory
    execSync(`cp -r "${sourceDir}"/* "${finalDir}"/`, { stdio: 'inherit' });
    
    // Create a README for deployment
    const readmeContent = `# Eliva Hardware - Windows Application
    
## Installation Instructions

1. **No Installation Required**: This is a portable application
2. **Run the App**: Double-click "Pipe Inventory.exe" to start
3. **First Launch**: The app will create its data files automatically
4. **Data Location**: All data is stored in this same folder

## System Requirements

- Windows 10 or Windows 11 (64-bit)
- At least 4 GB RAM
- 500 MB free disk space

## Features

✅ Inventory Management
✅ Sales Tracking  
✅ Automatic Daily Reports
✅ Customer Management
✅ Analytics and Reporting
✅ Data Export (PDF, CSV)

## Support

For technical support, contact:
- WhatsApp: +255 784 953 866
- GitHub: @festomanolo
- Website: festomanolo.xyz

## Version Information

- Version: ${version}
- Build Date: ${new Date().toLocaleDateString()}
- Platform: Windows x64
- Type: Portable Application

---

© 2025 Eliva Hardware. All rights reserved.
`;
    
    fs.writeFileSync(path.join(finalDir, 'README.txt'), readmeContent);
    
    // Create a simple launcher script
    const launcherScript = `@echo off
echo Starting Eliva Hardware...
echo.
start "" "Pipe Inventory.exe"
`;
    
    fs.writeFileSync(path.join(finalDir, 'Start Eliva Hardware.bat'), launcherScript);
    
    // Get directory size
    const getDirSize = (dir) => {
      let size = 0;
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          size += getDirSize(filePath);
        } else {
          size += stats.size;
        }
      }
      
      return size;
    };
    
    const totalSize = getDirSize(finalDir);
    const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
    
    console.log('✅ Deployment preparation complete!');
    console.log('');
    console.log('📊 Deployment Summary:');
    console.log(`   📁 Location: ${finalDir}`);
    console.log(`   📏 Total Size: ${sizeInMB} MB`);
    console.log(`   🗂️  Files: ${fs.readdirSync(finalDir).length} items`);
    console.log('');
    console.log('📋 Ready for distribution:');
    console.log('   1. ZIP the folder for easy sharing');
    console.log('   2. Copy to USB drives for offline distribution');
    console.log('   3. Upload to cloud storage for download');
    console.log('   4. Share via network drives');
    console.log('');
    console.log('🚀 The application is production-ready!');
    
  } catch (error) {
    console.error('❌ Error preparing deployment:', error);
    process.exit(1);
  }
}

// Run the preparation
prepareForDeployment();