/**
 * Build Helper Script
 * 
 * This script provides a user-friendly interface for building the application
 * for different platforms with proper configuration.
 */

const readline = require('readline');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Create a readline interface for CLI interaction
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    crimson: '\x1b[38m'
  },
  
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
    crimson: '\x1b[48m'
  }
};

// Print a styled header
function printHeader(text) {
  const line = '='.repeat(text.length + 8);
  console.log(`\n${colors.bright}${colors.fg.blue}${line}${colors.reset}`);
  console.log(`${colors.bright}${colors.fg.blue}==  ${colors.fg.white}${text}  ${colors.fg.blue}==${colors.reset}`);
  console.log(`${colors.bright}${colors.fg.blue}${line}${colors.reset}\n`);
}

// Print a styled section header
function printSection(text) {
  console.log(`\n${colors.bright}${colors.fg.cyan}>> ${text}${colors.reset}`);
  console.log(`${colors.fg.cyan}${'='.repeat(text.length + 4)}${colors.reset}`);
}

// Print success message
function printSuccess(text) {
  console.log(`${colors.fg.green}✓ ${text}${colors.reset}`);
}

// Print error message
function printError(text) {
  console.log(`${colors.fg.red}✗ ${text}${colors.reset}`);
}

// Print info message
function printInfo(text) {
  console.log(`${colors.fg.blue}ℹ ${text}${colors.reset}`);
}

// Print warning message
function printWarning(text) {
  console.log(`${colors.fg.yellow}⚠ ${text}${colors.reset}`);
}

// Execute command with proper error handling
function executeCommand(command, silent = false) {
  try {
    if (!silent) {
      printInfo(`Executing: ${command}`);
    }
    
    const output = execSync(command, { 
      stdio: silent ? 'pipe' : 'inherit',
      encoding: 'utf-8'
    });
    
    return { success: true, output };
  } catch (error) {
    if (!silent) {
      printError(`Command failed: ${command}`);
      printError(`Error: ${error.message}`);
    }
    return { success: false, error };
  }
}

// Check if a command exists in the system
function commandExists(command) {
  const whichCommand = os.platform() === 'win32' ? 'where' : 'which';
  try {
    execSync(`${whichCommand} ${command}`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Run the build setup script
function runBuildSetup() {
  printSection("Running Build Setup");
  
  // Check if build-setup.js exists
  if (!fs.existsSync(path.join(__dirname, 'build-setup.js'))) {
    printError("Build setup script not found!");
    return false;
  }
  
  const result = executeCommand('node build-setup.js');
  if (result.success) {
    printSuccess("Build setup completed successfully");
    return true;
  } else {
    printError("Build setup failed");
    return false;
  }
}

// Install dependencies
function installDependencies() {
  printSection("Installing Dependencies");
  
  // Check if package.json exists
  if (!fs.existsSync(path.join(__dirname, 'package.json'))) {
    printError("package.json not found!");
    return false;
  }
  
  printInfo("Installing npm dependencies...");
  const result = executeCommand('npm install');
  
  if (result.success) {
    printSuccess("Dependencies installed successfully");
    return true;
  } else {
    printError("Failed to install dependencies");
    return false;
  }
}

// Check prerequisites for building
function checkPrerequisites() {
  printSection("Checking Prerequisites");
  
  const prerequisites = {
    node: { command: 'node --version', name: 'Node.js' },
    npm: { command: 'npm --version', name: 'npm' },
    electron: { command: 'npx electron --version', name: 'Electron' },
    electronBuilder: { command: 'npx electron-builder --version', name: 'Electron Builder' }
  };
  
  let allMet = true;
  
  // Check each prerequisite
  for (const [key, prereq] of Object.entries(prerequisites)) {
    process.stdout.write(`Checking for ${prereq.name}... `);
    
    const result = executeCommand(prereq.command, true);
    if (result.success) {
      const version = result.output.trim();
      process.stdout.write(`${colors.fg.green}✓ Found ${version}${colors.reset}\n`);
    } else {
      process.stdout.write(`${colors.fg.red}✗ Not found${colors.reset}\n`);
      allMet = false;
      
      if (key === 'node' || key === 'npm') {
        printError(`${prereq.name} is required for building. Please install it first.`);
      } else {
        printWarning(`${prereq.name} will be installed automatically.`);
      }
    }
  }
  
  // Platform-specific prerequisites
  const platform = os.platform();
  if (platform === 'darwin') {
    // macOS prerequisites
    if (commandExists('iconutil')) {
      printSuccess("iconutil found (required for macOS builds)");
    } else {
      printWarning("iconutil not found. This may affect icon generation for macOS builds.");
    }
  } else if (platform === 'win32') {
    // Windows prerequisites
    // No specific Windows-only tools required
  } else {
    // Linux prerequisites
    if (commandExists('fakeroot') && commandExists('dpkg')) {
      printSuccess("fakeroot and dpkg found (required for .deb packaging)");
    } else {
      printWarning("fakeroot or dpkg not found. This may affect .deb packaging on Linux.");
      printInfo("On Ubuntu/Debian, install with: sudo apt-get install fakeroot dpkg");
    }
  }
  
  return allMet;
}

// Build for Windows
function buildForWindows() {
  printSection("Building for Windows");
  
  const result = executeCommand('npm run build:win');
  if (result.success) {
    printSuccess("Windows build completed successfully");
    return true;
  } else {
    printError("Windows build failed");
    return false;
  }
}

// Build for macOS
function buildForMacOS() {
  printSection("Building for macOS");
  
  // Check if running on macOS
  if (os.platform() !== 'darwin') {
    printWarning("Building for macOS is only supported on macOS");
    printInfo("Skipping macOS build...");
    return false;
  }
  
  const result = executeCommand('npm run build:mac');
  if (result.success) {
    printSuccess("macOS build completed successfully");
    return true;
  } else {
    printError("macOS build failed");
    return false;
  }
}

// Build for Linux
function buildForLinux() {
  printSection("Building for Linux");
  
  const result = executeCommand('npm run build:linux');
  if (result.success) {
    printSuccess("Linux build completed successfully");
    return true;
  } else {
    printError("Linux build failed");
    return false;
  }
}

// Build for all platforms
function buildForAllPlatforms() {
  printSection("Building for All Platforms");
  
  printInfo("This will build for all supported platforms on your system");
  printInfo("Note: For complete cross-platform builds, you need to be on macOS");
  
  const platform = os.platform();
  if (platform !== 'darwin') {
    printWarning("You are not on macOS. macOS builds will be skipped.");
  }
  
  // Build for each platform separately for better error reporting
  const results = {
    windows: buildForWindows(),
    macOS: platform === 'darwin' ? buildForMacOS() : false,
    linux: buildForLinux()
  };
  
  // Report summary
  printSection("Build Summary");
  
  if (results.windows) {
    printSuccess("Windows build completed successfully");
  } else {
    printError("Windows build failed");
  }
  
  if (platform === 'darwin') {
    if (results.macOS) {
      printSuccess("macOS build completed successfully");
    } else {
      printError("macOS build failed");
    }
  } else {
    printInfo("macOS build skipped (not on macOS)");
  }
  
  if (results.linux) {
    printSuccess("Linux build completed successfully");
  } else {
    printError("Linux build failed");
  }
  
  return Object.values(results).some(result => result);
}

// Show menu and handle user input
function showMenu() {
  printHeader("Eliva Hardware Build Helper");
  
  console.log("1. Build Setup");
  console.log("2. Build for Windows");
  console.log("3. Build for macOS");
  console.log("4. Build for Linux");
  console.log("5. Build for All Platforms");
  console.log("6. Check Prerequisites");
  console.log("7. Install Dependencies");
  console.log("0. Exit");
  
  rl.question("\nSelect an option: ", (answer) => {
    switch (answer.trim()) {
      case '1':
        runBuildSetup();
        promptContinue();
        break;
      case '2':
        buildForWindows();
        promptContinue();
        break;
      case '3':
        buildForMacOS();
        promptContinue();
        break;
      case '4':
        buildForLinux();
        promptContinue();
        break;
      case '5':
        buildForAllPlatforms();
        promptContinue();
        break;
      case '6':
        checkPrerequisites();
        promptContinue();
        break;
      case '7':
        installDependencies();
        promptContinue();
        break;
      case '0':
        rl.close();
        break;
      default:
        printError("Invalid option");
        promptContinue();
        break;
    }
  });
}

// Prompt user to continue or exit
function promptContinue() {
  rl.question("\nReturn to menu? (Y/n): ", (answer) => {
    if (answer.trim().toLowerCase() !== 'n') {
      showMenu();
    } else {
      rl.close();
    }
  });
}

// Run full build process
function runFullBuild() {
  printHeader("Eliva Hardware Automated Build Process");
  
  // Steps for a full build
  const prereqsMet = checkPrerequisites();
  if (!prereqsMet) {
    printWarning("Some prerequisites are missing, but we'll try to continue...");
  }
  
  const depsInstalled = installDependencies();
  if (!depsInstalled) {
    printError("Failed to install dependencies. Build process cannot continue.");
    return false;
  }
  
  const setupComplete = runBuildSetup();
  if (!setupComplete) {
    printError("Build setup failed. Build process cannot continue.");
    return false;
  }
  
  return buildForAllPlatforms();
}

// Main function
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    printHeader("Eliva Hardware Build Helper - Help");
    console.log("Usage: node build-helper.js [options]");
    console.log("\nOptions:");
    console.log("  --help, -h     Show this help message");
    console.log("  --auto, -a     Run full build process automatically");
    console.log("  --windows, -w  Build only for Windows");
    console.log("  --mac, -m      Build only for macOS");
    console.log("  --linux, -l    Build only for Linux");
    console.log("  --setup, -s    Run only the build setup");
    console.log("  --deps, -d     Install dependencies only");
    rl.close();
  } else if (args.includes('--auto') || args.includes('-a')) {
    runFullBuild();
    rl.close();
  } else if (args.includes('--windows') || args.includes('-w')) {
    runBuildSetup();
    buildForWindows();
    rl.close();
  } else if (args.includes('--mac') || args.includes('-m')) {
    runBuildSetup();
    buildForMacOS();
    rl.close();
  } else if (args.includes('--linux') || args.includes('-l')) {
    runBuildSetup();
    buildForLinux();
    rl.close();
  } else if (args.includes('--setup') || args.includes('-s')) {
    runBuildSetup();
    rl.close();
  } else if (args.includes('--deps') || args.includes('-d')) {
    installDependencies();
    rl.close();
  } else {
    // Show interactive menu
    showMenu();
  }
}

// Start the script
main();

console.log('Checking build dependencies...');

// Check for required build dependencies
const requiredDeps = [
  { name: 'electron-builder', dev: true },
  { name: 'sqlite3', version: '5.0.0', dev: false },
  { name: 'png-to-ico', dev: true },
  { name: 'cross-env', dev: true }
];

// Read package.json
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Check if dependencies are installed
let missingDeps = [];
for (const dep of requiredDeps) {
  const depList = dep.dev ? packageJson.devDependencies : packageJson.dependencies;
  if (!depList || !depList[dep.name]) {
    missingDeps.push(dep);
    console.log(`Missing dependency: ${dep.name}`);
  }
}

// Install missing dependencies
if (missingDeps.length > 0) {
  console.log('Installing missing dependencies...');
  
  for (const dep of missingDeps) {
    const installCmd = `npm install ${dep.name}${dep.version ? '@' + dep.version : ''} ${dep.dev ? '--save-dev' : '--save'}`;
    console.log(`Running: ${installCmd}`);
  
  try {
      execSync(installCmd, { stdio: 'inherit' });
      console.log(`Successfully installed ${dep.name}`);
  } catch (error) {
      console.error(`Failed to install ${dep.name}:`, error.message);
      process.exit(1);
    }
  }
}

// Check for SQLite3 specifically and rebuild if needed
try {
  require('sqlite3');
  console.log('SQLite3 is properly installed.');
} catch (error) {
  console.log('SQLite3 needs rebuilding for Electron...');
  
  try {
    // Rebuild SQLite3 for the current Electron version
    const electronVersion = packageJson.devDependencies.electron.replace('^', '');
    const rebuildCmd = `npx electron-rebuild -f -w sqlite3 -v ${electronVersion}`;
    
    console.log(`Running: ${rebuildCmd}`);
    execSync(rebuildCmd, { stdio: 'inherit' });
    console.log('Successfully rebuilt SQLite3 for Electron');
  } catch (error) {
    console.error('Failed to rebuild SQLite3:', error.message);
    process.exit(1);
  }
}

// Create build directory structure
const buildDir = path.join(__dirname, 'build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
  console.log('Created build directory');
}

const iconsDir = path.join(buildDir, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
  console.log('Created icons directory');
}

console.log('Build dependencies check completed successfully!');
console.log('You can now run the build commands:');
console.log('- npm run build:win    (for Windows)');
console.log('- npm run build:mac    (for macOS)');
console.log('- npm run build:linux  (for Linux)');
console.log('- npm run build:all    (for all platforms)');

