const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function createWindowsIcon() {
  console.log('🎨 Creating optimized Windows icon...');
  
  try {
    const logoPath = 'public/assets/images/logo.png';
    const outputDir = 'build/icons';
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Icon sizes for Windows ICO file
    const sizes = [16, 24, 32, 48, 64, 96, 128, 256];
    
    console.log('📐 Generating icon sizes:', sizes.join(', '));
    
    // Generate PNG files for each size
    const pngPromises = sizes.map(async (size) => {
      const outputPath = path.join(outputDir, `${size}x${size}.png`);
      
      await sharp(logoPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
        })
        .png({
          quality: 100,
          compressionLevel: 9
        })
        .toFile(outputPath);
      
      console.log(`✅ Created ${size}x${size}.png`);
      return outputPath;
    });
    
    await Promise.all(pngPromises);
    
    // Create a high-quality main icon
    await sharp(logoPath)
      .resize(256, 256, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png({
        quality: 100,
        compressionLevel: 9
      })
      .toFile(path.join(outputDir, 'icon.png'));
    
    console.log('✅ Created main icon.png');
    
    // Try to create ICO file using png-to-ico if available
    try {
      const pngToIco = require('png-to-ico');
      
      // Use the largest sizes for ICO
      const icoSizes = [16, 24, 32, 48, 64, 128, 256];
      const icoInputs = icoSizes.map(size => path.join(outputDir, `${size}x${size}.png`));
      
      const icoBuffer = await pngToIco(icoInputs);
      fs.writeFileSync(path.join(outputDir, 'icon.ico'), icoBuffer);
      
      console.log('✅ Created optimized icon.ico with multiple sizes');
    } catch (icoError) {
      console.log('⚠️  Could not create ICO file, using existing one');
    }
    
    console.log('🎉 Windows icon optimization complete!');
    
  } catch (error) {
    console.error('❌ Error creating Windows icon:', error);
    process.exit(1);
  }
}

// Run the icon creation
createWindowsIcon();