/**
 * Build script for Android APK
 * 
 * This script automates the process of building the Android APK
 * It performs the following steps:
 * 1. Builds the web app using Vite
 * 2. Syncs Capacitor plugins
 * 3. Copies web assets to Android
 * 4. Opens Android Studio
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

// Helper function to execute commands and log output
function runCommand(command, description) {
  console.log(`\n${colors.bright}${colors.cyan}=== ${description} ===${colors.reset}\n`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`\n${colors.green}✓ ${description} completed successfully${colors.reset}\n`);
    return true;
  } catch (error) {
    console.error(`\n${colors.red}✗ ${description} failed${colors.reset}`);
    console.error(`${colors.dim}${error.message}${colors.reset}\n`);
    return false;
  }
}

// Check if Android platform is already added
function isAndroidPlatformAdded() {
  return fs.existsSync(path.join(__dirname, 'android'));
}

// Main build process
async function buildAndroid() {
  console.log(`\n${colors.bright}${colors.blue}=== Starting Android Build Process ===${colors.reset}\n`);
  
  // Step 1: Build web app
  if (!runCommand('npm run build', 'Building web app')) {
    return;
  }
  
  // Step 2: Add Android platform if not already added
  if (!isAndroidPlatformAdded()) {
    if (!runCommand('npx cap add android', 'Adding Android platform')) {
      return;
    }
  }
  
  // Step 3: Sync Capacitor plugins
  if (!runCommand('npx cap sync', 'Syncing Capacitor plugins')) {
    return;
  }
  
  // Step 4: Copy web assets to Android
  if (!runCommand('npx cap copy android', 'Copying web assets to Android')) {
    return;
  }
  
  // Step 5: Open Android Studio
  console.log(`\n${colors.bright}${colors.yellow}=== Opening Android Studio ===${colors.reset}`);
  console.log(`${colors.yellow}Please build the APK from Android Studio${colors.reset}\n`);
  
  runCommand('npx cap open android', 'Opening Android Studio');
}

// Run the build process
buildAndroid().catch(error => {
  console.error(`\n${colors.bgRed}${colors.white}Build process failed:${colors.reset} ${error.message}\n`);
  process.exit(1);
}); 