const { build, Platform } = require('electron-builder');
const path = require('path');

async function buildWindows() {
  console.log('🚀 Building Windows app with fixes...');
  
  try {
    const result = await build({
      targets: Platform.WINDOWS.createTarget(),
      config: {
        appId: 'com.eliva.hardware',
        productName: 'Eliva Hardware',
        directories: {
          output: 'dist'
        },
        files: [
          'src/**/*',
          'public/**/*',
          'node_modules/**/*',
          'package.json'
        ],
        win: {
          target: [
            {
              target: 'nsis',
              arch: ['x64']
            },
            {
              target: 'portable',
              arch: ['x64']
            }
          ],
          icon: 'public/assets/images/logo.ico'
        },
        nsis: {
          oneClick: false,
          allowToChangeInstallationDirectory: true,
          createDesktopShortcut: true,
          createStartMenuShortcut: true,
          shortcutName: 'Eliva Hardware'
        },
        portable: {
          artifactName: 'Eliva-Hardware-Portable-${version}.exe'
        }
      }
    });
    
    console.log('✅ Windows build completed successfully!');
    console.log('📦 Output directory: dist/');
    
    // List the generated files
    const fs = require('fs');
    const distPath = path.join(__dirname, 'dist');
    
    if (fs.existsSync(distPath)) {
      const files = fs.readdirSync(distPath);
      console.log('\n📁 Generated files:');
      files.forEach(file => {
        const filePath = path.join(distPath, file);
        const stats = fs.statSync(filePath);
        const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`  - ${file} (${sizeInMB} MB)`);
      });
    }
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Run the build
buildWindows();