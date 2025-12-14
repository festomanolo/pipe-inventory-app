const fs = require('fs-extra');
const path = require('path');

console.log('🚀 Creating simple unpacked build...');

// Create dist directory
const distDir = path.join(__dirname, 'dist');
const unpackedDir = path.join(distDir, 'win-unpacked');

// Clean and create directories
fs.removeSync(distDir);
fs.ensureDirSync(unpackedDir);

// Copy main application files
const filesToCopy = [
  'src',
  'public',
  'package.json',
  'package-lock.json'
];

filesToCopy.forEach(file => {
  const source = path.join(__dirname, file);
  const dest = path.join(unpackedDir, file);
  
  if (fs.existsSync(source)) {
    console.log(`📁 Copying ${file}...`);
    fs.copySync(source, dest);
  }
});

// Create a simple launcher script
const launcherScript = `
@echo off
echo Starting Pipe Inventory...
cd /d "%~dp0"
node src/main/index.js
pause
`;

fs.writeFileSync(path.join(unpackedDir, 'start.bat'), launcherScript);

// Create a README
const readme = `
# Pipe Inventory - Unpacked Version

This is the unpacked version of the Pipe Inventory application.

## To run:
1. Make sure you have Node.js installed
2. Run: npm install
3. Run: npm start

## Or use the batch file:
- Double-click: start.bat

## Files included:
- src/: Source code
- public/: Public assets
- package.json: Dependencies
- start.bat: Windows launcher script
`;

fs.writeFileSync(path.join(unpackedDir, 'README.md'), readme);

console.log('✅ Simple unpacked build created successfully!');
console.log(`📁 Location: ${unpackedDir}`);
console.log('🚀 To run: cd dist/win-unpacked && npm install && npm start'); 