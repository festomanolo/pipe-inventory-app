const fs = require('fs');
const PDFDocument = require('pdfkit');
const moment = require('moment');

/**
 * Generate a sales receipt PDF
 * @param {string} filePath - Path to save the PDF
 * @param {Object} sale - Sale object
 * @returns {Promise} - Resolves when PDF is created
 */
function generateSalesReceipt(filePath, sale) {
  return new Promise((resolve, reject) => {
    try {
      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `Sales Receipt - ${sale.invoiceNumber || sale.id}`,
          Author: 'Eliva Hardware Inventory Management System'
        }
      });

      // Pipe PDF to file
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Define vibrant colors
      const primaryColor = '#8e24aa'; // Vibrant purple
      const secondaryColor = '#f3e5f5'; // Light purple background
      const accentColor = '#ab47bc'; // Accent purple
      const textColor = '#212121'; // Dark text
      const headingColor = '#4a148c'; // Dark purple for headings
      const successColor = '#00c853'; // Bright green for total
      const borderColor = '#e1bee7'; // Light purple for borders
      const highlightColor = '#ea80fc'; // Bright purple highlight

      // Add colorful gradient header background
      const headerHeight = 150;
      
      // Create a radial gradient for more visual impact
      const gradient = doc.linearGradient(0, 0, doc.page.width, headerHeight);
      gradient.stop(0, '#6a1b9a')
             .stop(0.5, '#8e24aa')
             .stop(1, '#9c27b0');
             
      doc.rect(0, 0, doc.page.width, headerHeight)
         .fill(gradient);
         
      // Add decorative wave pattern to header
      doc.save();
      doc.moveTo(0, headerHeight);
      for (let i = 0; i < doc.page.width; i += 15) {
        doc.lineTo(i + 7.5, headerHeight - 15);
        doc.lineTo(i + 15, headerHeight);
      }
      doc.fillColor(highlightColor)
         .fill();
      doc.restore();
      
      // Add decorative circles in the header
      for (let i = 0; i < 5; i++) {
        const size = 20 + Math.random() * 30;
        const x = Math.random() * doc.page.width;
        const y = Math.random() * headerHeight / 2;
        doc.circle(x, y, size)
           .fillOpacity(0.1)
           .fill('#ffffff');
      }

      // Add company logo/name with shadow effect
      doc.fillOpacity(1)
         .fillColor('#ffffff')
         .fontSize(34)
         .font('Helvetica-Bold')
         .text('ELIVA HARDWARE', 50, 40, { align: 'center' });
         
      // Add subtitle
      doc.fontSize(20)
         .text('Pipe Inventory Management System', { align: 'center' });
         
      // Add document type with emphasis
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .text('SALES RECEIPT', { align: 'center' });

      // Add a fancy line below header
      const contentStartY = headerHeight + 20;
      doc.moveTo(40, contentStartY)
         .lineTo(doc.page.width - 40, contentStartY)
         .lineWidth(2)
         .strokeOpacity(0.8)
         .strokeColor(borderColor)
         .stroke();

      // Receipt information section - create a well-defined card with shadow effect
      const infoCardY = contentStartY + 20;
      
      // Draw receipt info background with rounded corners
      doc.roundedRect(40, infoCardY, doc.page.width - 80, 120, 10)
         .fillColor(secondaryColor)
         .fillOpacity(0.8)
         .fill();
         
      // Add drop shadow effect for the card
      doc.strokeColor(borderColor)
         .lineWidth(2)
         .strokeOpacity(0.5)
         .roundedRect(40, infoCardY, doc.page.width - 80, 120, 10)
         .stroke();
      
      // Reset opacity for text
      doc.fillOpacity(1);

      // Receipt information - left side with colorful labels
      doc.fillColor(headingColor)
         .font('Helvetica-Bold')
         .fontSize(14)
         .text('Receipt #:', 60, infoCardY + 20);
         
      doc.fillColor(textColor)
         .font('Helvetica')
         .fontSize(13)
         .text(`INV-${sale.invoiceNumber || sale.id.substring(0, 6)}`, 140, infoCardY + 20);
      
      doc.fillColor(headingColor)
         .font('Helvetica-Bold')
         .text('Date:', 60, infoCardY + 50);
         
      doc.fillColor(textColor)
         .font('Helvetica')
         .text(moment(sale.createdAt || sale.date).format('MMMM DD, YYYY'), 140, infoCardY + 50);
      
      doc.fillColor(headingColor)
         .font('Helvetica-Bold')
         .text('Time:', 60, infoCardY + 80);
         
      doc.fillColor(textColor)
         .font('Helvetica')
         .text(moment(sale.createdAt || sale.date).format('h:mm A'), 140, infoCardY + 80);
      
      // Receipt information - right side
      doc.fillColor(headingColor)
         .font('Helvetica-Bold')
         .text('Customer:', doc.page.width - 250, infoCardY + 20);
         
      doc.fillColor(textColor)
         .font('Helvetica')
         .text(sale.buyer.name, doc.page.width - 160, infoCardY + 20);
      
      doc.fillColor(headingColor)
         .font('Helvetica-Bold')
         .text('TIN #:', doc.page.width - 250, infoCardY + 50);
         
      doc.fillColor(textColor)
         .font('Helvetica')
         .text(sale.buyer.tinNumber || 'N/A', doc.page.width - 160, infoCardY + 50);
      
      doc.fillColor(headingColor)
         .font('Helvetica-Bold')
         .text('Phone:', doc.page.width - 250, infoCardY + 80);
         
      doc.fillColor(textColor)
         .font('Helvetica')
         .text(sale.buyer.phone || 'N/A', doc.page.width - 160, infoCardY + 80);
      
      // Items section title with attractive styling
      const itemsStartY = infoCardY + 160;
      
      // Add a background highlight for the title
      doc.rect(30, itemsStartY - 5, 230, 40)
         .fillColor(primaryColor)
         .fillOpacity(0.9)
         .fill();
      
      doc.fillOpacity(1)
         .fillColor('#ffffff')
         .font('Helvetica-Bold')
         .fontSize(18)
         .text('ITEMS PURCHASED', 50, itemsStartY + 8);
      
      // Table headers with gradient background
      const tableTop = itemsStartY + 50;
      
      // Draw table header background with gradient
      const tableGradient = doc.linearGradient(40, tableTop, doc.page.width - 40, tableTop + 35);
      tableGradient.stop(0, primaryColor)
                  .stop(1, accentColor);
                  
      doc.rect(40, tableTop, doc.page.width - 80, 35)
         .fill(tableGradient);
      
      // Table column positions
      const colItem = 60;
      const colType = 170;
      const colDiameter = 280;
      const colQty = 370;
      const colPrice = 440;
      const colTotal = 510;
      
      // Add header text with slight text shadow effect
      doc.fillColor('#ffffff')
         .font('Helvetica-Bold')
         .fontSize(13)
         .text('Item', colItem, tableTop + 12)
         .text('Type', colType, tableTop + 12)
         .text('Diameter', colDiameter, tableTop + 12)
         .text('Qty', colQty, tableTop + 12)
         .text('Price', colPrice, tableTop + 12)
         .text('Total', colTotal, tableTop + 12);
      
      // Table content
      let currentY = tableTop + 45;
      let totalAmount = 0;
      
      // Process each item with attractive styling
      sale.items.forEach((item, index) => {
        const itemTotal = item.total || (item.quantity * item.price);
        totalAmount += itemTotal;
        
        // Add alternating row background for better readability
        if (index % 2 === 0) {
          doc.rect(40, currentY - 5, doc.page.width - 80, 30)
             .fillColor(secondaryColor)
             .fillOpacity(0.7)
             .fill();
        }
        
        // Reset opacity for text
        doc.fillOpacity(1);
        
        // Item details with better formatting
        doc.fillColor(textColor)
           .font('Helvetica')
           .fontSize(12)
           .text(item.description || 'Item', colItem, currentY)
           .text(item.type || 'PVC', colType, currentY)
           .text(item.dimension || '3/4"', colDiameter, currentY)
           .text(item.quantity.toString(), colQty, currentY)
           .text(`TZsh ${item.price.toLocaleString()}`, colPrice, currentY)
           .font('Helvetica-Bold') // Make total bold
           .text(`TZsh ${itemTotal.toLocaleString()}`, colTotal, currentY);
        
        currentY += 30;
        
        // Add a new page if needed
        if (currentY > doc.page.height - 120) {
          doc.addPage();
          
          // Add header to new page with gradient
          const pageHeaderGradient = doc.linearGradient(0, 0, doc.page.width, 50);
          pageHeaderGradient.stop(0, primaryColor)
                          .stop(1, accentColor);
                          
          doc.rect(0, 0, doc.page.width, 50)
             .fill(pageHeaderGradient);
             
          doc.fillColor('#ffffff')
             .fontSize(16)
             .font('Helvetica-Bold')
             .text('ELIVA HARDWARE - SALES RECEIPT (continued)', 40, 18);
          
          // Reset current Y position
          currentY = 70;
          
          // Repeat column headers with same gradient
          const headerGradient = doc.linearGradient(40, currentY, doc.page.width - 40, currentY + 35);
          headerGradient.stop(0, primaryColor)
                       .stop(1, accentColor);
                       
          doc.rect(40, currentY, doc.page.width - 80, 35)
             .fill(headerGradient);
          
          doc.fillColor('#ffffff')
             .font('Helvetica-Bold')
             .fontSize(13)
             .text('Item', colItem, currentY + 12)
             .text('Type', colType, currentY + 12)
             .text('Diameter', colDiameter, currentY + 12)
             .text('Qty', colQty, currentY + 12)
             .text('Price', colPrice, currentY + 12)
             .text('Total', colTotal, currentY + 12);
          
          currentY += 45;
        }
      });
      
      // Add a decorative divider line
      doc.moveTo(40, currentY + 10)
         .lineTo(doc.page.width - 40, currentY + 10)
         .lineWidth(2)
         .strokeColor(borderColor)
         .dash(5, { space: 5 })
         .stroke();
      
      // Total section with eye-catching design
      const totalBoxWidth = 220;
      const totalBoxHeight = 50;
      const totalBoxX = doc.page.width - totalBoxWidth - 40;
      
      // Create gradient for total box
      const totalGradient = doc.linearGradient(totalBoxX, currentY + 20, totalBoxX + totalBoxWidth, currentY + 20 + totalBoxHeight);
      totalGradient.stop(0, successColor)
                  .stop(1, '#00796b');
      
      doc.roundedRect(totalBoxX, currentY + 20, totalBoxWidth, totalBoxHeight, 8)
         .fill(totalGradient);
      
      // Add decorative corner elements to total box
      doc.circle(totalBoxX + 15, currentY + 30, 4)
         .fillColor('#ffffff')
         .fillOpacity(0.6)
         .fill();
      
      doc.circle(totalBoxX + totalBoxWidth - 15, currentY + 30, 4)
         .fillColor('#ffffff')
         .fillOpacity(0.6)
         .fill();
      
      // Total text with shadow effect
      doc.fillOpacity(1)
         .fillColor('#ffffff')
         .font('Helvetica-Bold')
         .fontSize(18)
         .text(`TOTAL: TZsh ${totalAmount.toLocaleString()}`, totalBoxX + 20, currentY + 35);
      
      // Thank you message in a decorative box
      const thankYouY = currentY + 90;
      
      // Add gradient background for thank you message
      const thankYouGradient = doc.linearGradient(40, thankYouY, doc.page.width - 40, thankYouY + 60);
      thankYouGradient.stop(0, '#f5f5f5')
                      .stop(1, secondaryColor);
      
      doc.roundedRect(40, thankYouY, doc.page.width - 80, 60, 10)
         .fill(thankYouGradient)
         .lineWidth(2)
         .strokeColor(borderColor)
         .stroke();
      
      // Add decorative elements
      doc.circle(60, thankYouY + 30, 5)
         .fillColor(primaryColor)
         .fill();
      
      doc.circle(doc.page.width - 60, thankYouY + 30, 5)
         .fillColor(primaryColor)
         .fill();
      
      // Thank you message with styling
      doc.fillColor(primaryColor)
         .font('Helvetica-Bold')
         .fontSize(18)
         .text('Thank you for your business!', 40, thankYouY + 20, { align: 'center' });
      
      // Add QR code placeholder with better styling
      const qrSize = 100;
      const qrY = thankYouY + 80;
      const qrX = 40;
      
      // Add gradient background for QR
      const qrGradient = doc.linearGradient(qrX, qrY, qrX + qrSize, qrY + qrSize);
      qrGradient.stop(0, '#f5f5f5')
                .stop(1, '#e0e0e0');
      
      doc.roundedRect(qrX, qrY, qrSize, qrSize, 5)
         .fill(qrGradient)
         .lineWidth(1)
         .strokeColor(borderColor)
         .stroke();
      
      // QR code placeholder text
      doc.save();
      doc.translate(qrX + qrSize/2, qrY + qrSize/2);
      doc.rotate(-45);
      doc.fillColor(primaryColor)
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('SCAN ME', -30, -5, { width: 60, align: 'center' });
      doc.restore();
      
      doc.fillColor(textColor)
         .fontSize(10)
         .text('Scan to verify receipt', qrX, qrY + qrSize + 5, { width: qrSize, align: 'center' });
      
      // Footer with gradient
      const footerY = doc.page.height - 60;
      
      // Add footer gradient
      const footerGradient = doc.linearGradient(0, footerY, doc.page.width, doc.page.height);
      footerGradient.stop(0, '#ffffff')
                    .stop(1, secondaryColor);
                    
      doc.rect(0, footerY, doc.page.width, 60)
         .fill(footerGradient);
      
      // Footer content
      doc.fontSize(10)
         .fillColor(textColor)
         .text('Generated on ' + new Date().toLocaleString(), 40, footerY + 15)
         .font('Helvetica-Bold')
         .text('Eliva Hardware • +255 123 456 789 • info@eliva.co.tz', 40, footerY + 30, { align: 'center' })
         .text('Page 1 of 1', doc.page.width - 80, footerY + 15, { align: 'right' });
      
      // Finalize PDF
      doc.end();
      
      // Handle stream events
      stream.on('finish', () => {
        resolve(filePath);
      });
      
      stream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate a daily sales report PDF
 * @param {string} filePath - Path to save the PDF
 * @param {Array} sales - Array of sales objects
 * @param {string} reportDate - Date for the report
 * @returns {Promise} - Resolves when PDF is created
 */
function generateDailySalesReport(filePath, sales, reportDate) {
  return new Promise((resolve, reject) => {
    try {
      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Daily Sales Report - ${reportDate}`,
          Author: 'Eliva Hardware Management System'
        }
      });

      // Pipe PDF to file
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Define colors
      const primaryColor = '#1e40af'; // Deep blue
      const secondaryColor = '#f8fafc'; // Light gray background
      const accentColor = '#3b82f6'; // Medium blue for highlights
      const textColor = '#334155'; // Dark slate for text

      // Add header with gradient background
      doc.rect(0, 0, doc.page.width, 100)
         .fillColor(primaryColor)
         .fill();

      doc.fillColor('#ffffff')
         .font('Helvetica-Bold')
         .fontSize(22)
         .text('ELIVA HARDWARE INVENTORY MANAGEMENT', 50, 40, { align: 'center' });

      doc.fontSize(16)
         .text('DAILY SALES REPORT', 50, 65, { align: 'center' });

      // Add report information
      doc.fillColor(textColor)
         .font('Helvetica-Bold')
         .fontSize(14)
         .text(`Sales Report: ${reportDate}`, 50, 120);

      doc.moveDown()
         .font('Helvetica')
         .fontSize(12)
         .text(`Total Sales: ${sales.length}`)
         .text(`Generated: ${moment().format('MMMM DD, YYYY [at] h:mm A')}`);

      // Summary section
      doc.moveDown()
         .moveDown()
         .font('Helvetica-Bold')
         .fontSize(14)
         .text('SALES SUMMARY', { underline: true });

      // Calculate totals
      let totalAmount = 0;
      let totalItems = 0;
      const itemTypes = {};

      sales.forEach(sale => {
        sale.items.forEach(item => {
          totalItems += item.quantity;
          totalAmount += item.quantity * item.price;
          
          // Count by pipe type
          if (!itemTypes[item.type]) {
            itemTypes[item.type] = 0;
          }
          itemTypes[item.type] += item.quantity;
        });
      });

      // Format total with thousand separators
      const formattedTotalAmount = totalAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});

      doc.moveDown()
         .font('Helvetica')
         .fontSize(12)
         .text(`Total Revenue: $${formattedTotalAmount}`)
         .text(`Total Items Sold: ${totalItems}`);

      // Item types breakdown
      doc.moveDown()
         .font('Helvetica-Bold')
         .text('Items Sold by Type:');

      Object.keys(itemTypes).forEach(type => {
        doc.font('Helvetica')
           .text(`${type}: ${itemTypes[type]} units`);
      });

      // Sales table
      doc.moveDown()
         .moveDown()
         .font('Helvetica-Bold')
         .fontSize(14)
         .text('DETAILED SALES', { underline: true });

      // Table header
      let y = doc.y + 15;
      const startX = 50;
      doc.font('Helvetica-Bold')
         .fontSize(12)
         .text('#', startX, y)
         .text('Time', startX + 30, y)
         .text('Buyer', startX + 100, y)
         .text('Items', startX + 250, y)
         .text('Total', startX + 450, y);

      // Draw header underline
      y += 15;
      doc.moveTo(startX, y)
         .lineTo(startX + 500, y)
         .stroke();

      // Table rows
      doc.font('Helvetica');

      sales.forEach((sale, i) => {
        y += 20;
        
        // Add alternating row colors
        if (i % 2 === 0) {
          doc.rect(startX - 5, y - 10, 510, 20).fill('#f0f0f5');
        }

        // Calculate sale total
        let saleTotal = 0;
        sale.items.forEach(item => {
          saleTotal += item.quantity * item.price;
        });

        // Format total with thousand separators
        const formattedSaleTotal = saleTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});

        // Format items count text
        const itemsText = `${sale.items.length} items (${sale.items.reduce((sum, item) => sum + item.quantity, 0)} units)`;

        doc.fillColor(textColor)
           .text((i + 1).toString(), startX, y)
           .text(moment(sale.createdAt).format('HH:mm'), startX + 30, y)
           .text(sale.buyer.name, startX + 100, y)
           .text(itemsText, startX + 250, y)
           .text(`$${formattedSaleTotal}`, startX + 450, y);

        // If we're near the end of the page, add a new page
        if (y > doc.page.height - 150) {
          doc.addPage();
          y = 50;
          
          // Repeat headers on new page
          doc.font('Helvetica-Bold')
             .text('#', startX, y)
             .text('Time', startX + 30, y)
             .text('Buyer', startX + 100, y)
             .text('Items', startX + 250, y)
             .text('Total', startX + 450, y);
             
          y += 15;
          doc.moveTo(startX, y)
             .lineTo(startX + 500, y)
             .stroke();
          
          y += 5;
          doc.font('Helvetica');
        }
      });

      // Footer
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        
        doc.fontSize(10)
           .text(
             `Page ${i + 1} of ${pageCount}`,
             50,
             doc.page.height - 50,
             { align: 'center' }
           );
      }

      // Finalize the PDF
      doc.end();

      stream.on('finish', () => {
        resolve(filePath);
      });

      stream.on('error', (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Generate an inventory status report PDF
 * @param {string} filePath - Path to save the PDF
 * @param {Array} inventory - Array of inventory items
 * @returns {Promise} - Resolves when PDF is created
 */
function generateInventoryReport(filePath, inventory) {
  return new Promise((resolve, reject) => {
    try {
      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: 'Inventory Status Report',
          Author: 'Eliva Hardware Inventory Management System'
        }
      });

      // Pipe PDF to file
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Define colors
      const primaryColor = '#1e40af'; // Deep blue
      const secondaryColor = '#f8fafc'; // Light gray background
      const accentColor = '#3b82f6'; // Medium blue for highlights
      const textColor = '#334155'; // Dark slate for text
      const alertColor = '#cc0000'; // Red for alerts

      // Add header with gradient background
      doc.rect(0, 0, doc.page.width, 100)
         .fillColor(primaryColor)
         .fill();

      doc.fillColor('#ffffff')
         .font('Helvetica-Bold')
         .fontSize(22)
         .text('ELIVA HARDWARE INVENTORY MANAGEMENT', 50, 40, { align: 'center' });

      doc.fontSize(16)
         .text('INVENTORY STATUS REPORT', 50, 65, { align: 'center' });

      // Add report information
      doc.fillColor(textColor)
         .font('Helvetica-Bold')
         .fontSize(14)
         .text(`Inventory Status as of ${moment().format('MMMM DD, YYYY')}`, 50, 120);

      // Alerts section - items below threshold
      const alerts = inventory.filter(item => item.quantity <= item.alertThreshold);
      
      if (alerts.length > 0) {
        doc.moveDown()
           .moveDown()
           .fillColor(alertColor)
           .fontSize(14)
           .text('LOW INVENTORY ALERTS', { underline: true });

        // Table header for alerts
        let y = doc.y + 15;
        const startX = 50;
        doc.font('Helvetica-Bold')
           .fontSize(12)
           .text('Type', startX, y)
           .text('Description', startX + 100, y)
           .text('Diameter', startX + 250, y)
           .text('Quantity', startX + 320, y)
           .text('Threshold', startX + 400, y);

        // Draw header underline
        y += 15;
        doc.moveTo(startX, y)
           .lineTo(startX + 500, y)
           .stroke();

        // Table rows for alerts
        doc.font('Helvetica');

        alerts.forEach((item, i) => {
          y += 20;
          
          // Add alternating row colors
          if (i % 2 === 0) {
            doc.rect(startX - 5, y - 10, 510, 20).fill('#fff0f0');
          }

          doc.fillColor(alertColor)
             .text(item.type, startX, y)
             .text(item.description, startX + 100, y)
             .text(item.diameter, startX + 250, y)
             .text(item.quantity.toString(), startX + 320, y)
             .text(item.alertThreshold.toString(), startX + 400, y);
        });
      }

      // Full inventory section
      doc.fillColor(textColor)
         .moveDown()
         .moveDown()
         .font('Helvetica-Bold')
         .fontSize(14)
         .text('COMPLETE INVENTORY', { underline: true });

      // Organize by pipe type
      const inventoryByType = {};
      inventory.forEach(item => {
        if (!inventoryByType[item.type]) {
          inventoryByType[item.type] = [];
        }
        inventoryByType[item.type].push(item);
      });

      // List inventory by type
      Object.keys(inventoryByType).forEach((type, typeIndex) => {
        if (typeIndex > 0) {
          doc.addPage();
        }
        
        doc.moveDown()
           .font('Helvetica-Bold')
           .fontSize(13)
           .text(`${type} Pipes`);

        // Table header
        let y = doc.y + 15;
        const startX = 50;
        doc.font('Helvetica-Bold')
           .fontSize(12)
           .text('Description', startX, y)
           .text('Diameter', startX + 150, y)
           .text('Color', startX + 220, y)
           .text('Quantity', startX + 300, y)
           .text('Price', startX + 380, y)
           .text('Value', startX + 450, y);

        // Draw header underline
        y += 15;
        doc.moveTo(startX, y)
           .lineTo(startX + 500, y)
           .stroke();

        // Table rows
        doc.font('Helvetica');
        let typeTotal = 0;

        inventoryByType[type].forEach((item, i) => {
          y += 20;
          const itemValue = item.quantity * item.price;
          typeTotal += itemValue;
          
          // Add alternating row colors
          if (i % 2 === 0) {
            doc.rect(startX - 5, y - 10, 510, 20).fill('#f0f0f5');
          }

          // Format price and value with thousand separators
          const formattedPrice = item.price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
          const formattedValue = itemValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});

          // Highlight low inventory items
          const textColor = item.quantity <= item.alertThreshold ? alertColor : '#333';

          doc.fillColor(textColor)
             .text(item.description, startX, y)
             .text(item.diameter, startX + 150, y)
             .text(item.color, startX + 220, y)
             .text(item.quantity.toString(), startX + 300, y)
             .text(`$${formattedPrice}`, startX + 380, y)
             .text(`$${formattedValue}`, startX + 450, y);

          // If we're near the end of the page, add a new page
          if (y > doc.page.height - 150 && i < inventoryByType[type].length - 1) {
            doc.addPage();
            y = 50;
            
            // Repeat headers on new page
            doc.font('Helvetica-Bold')
               .text('Description', startX, y)
               .text('Diameter', startX + 150, y)
               .text('Color', startX + 220, y)
               .text('Quantity', startX + 300, y)
               .text('Price', startX + 380, y)
               .text('Value', startX + 450, y);
               
            y += 15;
            doc.moveTo(startX, y)
               .lineTo(startX + 500, y)
               .stroke();
            
            y += 5;
            doc.font('Helvetica');
          }
        });

        // Type total with thousand separators
        const formattedTypeTotal = typeTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});

        // Type total
        y += 30;
        doc.moveTo(startX, y)
           .lineTo(startX + 500, y)
           .stroke();

        y += 15;
        doc.font('Helvetica-Bold')
           .text(`Total Value (${type}):`, startX + 350, y)
           .text(`$${formattedTypeTotal}`, startX + 450, y);
      });

      // Calculate total inventory value
      const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.price), 0);
      
      // Format with thousand separators
      const formattedTotalValue = totalValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});

      // Add summary page
      doc.addPage();
      
      doc.font('Helvetica-Bold')
         .fontSize(16)
         .text('INVENTORY SUMMARY', { align: 'center' });

      doc.moveDown()
         .fontSize(14)
         .text(`Total Inventory Value: $${formattedTotalValue}`);

      doc.moveDown()
         .text(`Total Items in Stock: ${inventory.reduce((sum, item) => sum + item.quantity, 0)}`);

      doc.moveDown()
         .text(`Unique Product Count: ${inventory.length}`);

      doc.moveDown()
         .text(`Low Stock Alerts: ${alerts.length}`);

      // Footer with page numbers
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        
        doc.fontSize(10)
           .text(
             `Page ${i + 1} of ${pageCount}`,
             50,
             doc.page.height - 50,
             { align: 'center' }
           );
      }

      // Finalize the PDF
      doc.end();

      stream.on('finish', () => {
        resolve(filePath);
      });

      stream.on('error', (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Generate an invoice PDF
 * @param {string} filePath - Path to save the PDF
 * @param {Object} sale - Sale object
 * @returns {Promise} - Resolves when PDF is created
 */
function generateInvoicePDF(filePath, sale) {
  return new Promise((resolve, reject) => {
    try {
      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `Invoice - ${sale.invoiceNumber || sale.id}`,
          Author: 'Eliva Hardware Inventory Management System'
        }
      });

      // Pipe PDF to file
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Define vibrant colors - using blue palette for invoices (different from receipt's purple)
      const primaryColor = '#0d47a1'; // Deep blue
      const secondaryColor = '#e3f2fd'; // Light blue background
      const accentColor = '#2196f3'; // Medium blue
      const textColor = '#212121'; // Dark text
      const headingColor = '#01579b'; // Darker blue for headings
      const successColor = '#00695c'; // Teal for total
      const borderColor = '#bbdefb'; // Light blue for borders
      const highlightColor = '#42a5f5'; // Bright blue highlight

      // Add header with blue gradient
      const headerHeight = 150;
      
      // Create gradient background for header
      const gradient = doc.linearGradient(0, 0, doc.page.width, headerHeight);
      gradient.stop(0, '#01579b')
             .stop(0.5, '#0277bd')
             .stop(1, '#0288d1');
             
      doc.rect(0, 0, doc.page.width, headerHeight)
         .fill(gradient);
         
      // Add decorative elements to header
      doc.save();
      
      // Add diagonal stripes to header
      doc.fillOpacity(0.1);
      for (let i = -200; i < doc.page.width + 200; i += 40) {
        doc.polygon([i, 0], [i + 20, 0], [i + headerHeight + 20, headerHeight], [i + headerHeight, headerHeight])
           .fill('#ffffff');
      }
      
      // Add decorative circles in corners
      doc.circle(30, 30, 50)
         .fillOpacity(0.05)
         .fill('#ffffff');
      
      doc.circle(doc.page.width - 30, 30, 30)
         .fillOpacity(0.05)
         .fill('#ffffff');
         
      doc.restore();
      doc.fillOpacity(1);

      // Add company name - different style from receipt
      doc.fillColor('#ffffff')
         .fontSize(32)
         .font('Helvetica-Bold')
         .text('ELIVA HARDWARE', 50, 45, { align: 'center' });
         
      // Add subtitle
      doc.fontSize(18)
         .font('Helvetica')
         .text('Pipe Inventory Management System', { align: 'center' });
         
      // Add document type with emphasis
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .text('INVOICE', { align: 'center' });

      // Add document number stamp
      const stampSize = 110;
      const stampX = doc.page.width - stampSize - 50;
      const stampY = headerHeight + 20;
      
      doc.rect(stampX, stampY, stampSize, stampSize)
         .fill('#f5f5f5')
         .roundedRect(stampX + 5, stampY + 5, stampSize - 10, stampSize - 10, 5)
         .fillColor(accentColor)
         .fillOpacity(0.1)
         .fill()
         .fillOpacity(1);
      
      doc.fontSize(11)
         .fillColor(headingColor)
         .font('Helvetica-Bold')
         .text('INVOICE NUMBER', stampX + 5, stampY + 20, { width: stampSize - 10, align: 'center' });
      
      doc.fontSize(16)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text(`${sale.invoiceNumber || 'INV-' + sale.id.substring(0, 6)}`, stampX + 5, stampY + 40, { width: stampSize - 10, align: 'center' });
      
      doc.fontSize(11)
         .fillColor(headingColor)
         .font('Helvetica-Bold')
         .text('DATE', stampX + 5, stampY + 65, { width: stampSize - 10, align: 'center' });
      
      doc.fontSize(13)
         .fillColor(textColor)
         .font('Helvetica')
         .text(moment(sale.createdAt || sale.date).format('MMMM DD, YYYY'), stampX + 5, stampY + 80, { width: stampSize - 10, align: 'center' });

      // Add a fancy line below header
      const contentStartY = headerHeight + 20;
      doc.moveTo(40, contentStartY)
         .lineTo(doc.page.width - 40, contentStartY)
         .lineWidth(3)
         .strokeOpacity(0.6)
         .strokeColor(accentColor)
         .stroke();

      // Customer information section with business-like layout
      const customerY = contentStartY + 40;
      
      // Add "Bill To" section
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor(headingColor)
         .text('BILL TO:', 40, customerY);
      
      doc.roundedRect(40, customerY + 25, doc.page.width / 2 - 70, 100, 5)
         .lineWidth(1)
         .fillColor(secondaryColor)
         .fillOpacity(0.5)
         .fill()
         .strokeColor(borderColor)
         .stroke();
      
      // Customer details
      doc.fillOpacity(1)
         .fontSize(12)
         .font('Helvetica-Bold')
         .fillColor(headingColor)
         .text(sale.buyer.name, 50, customerY + 35);
      
      doc.font('Helvetica')
         .fillColor(textColor)
         .fontSize(11);
      
      let customerDetailsY = customerY + 55;
      
      if (sale.buyer.title) {
        doc.text(sale.buyer.title, 50, customerDetailsY);
        customerDetailsY += 15;
      }
      
      if (sale.buyer.tinNumber) {
        doc.text(`TIN: ${sale.buyer.tinNumber}`, 50, customerDetailsY);
        customerDetailsY += 15;
      }
      
      if (sale.buyer.phone) {
        doc.text(`Tel: ${sale.buyer.phone}`, 50, customerDetailsY);
        customerDetailsY += 15;
      }
      
      if (sale.buyer.email) {
        doc.text(`Email: ${sale.buyer.email}`, 50, customerDetailsY);
      }
      
      // Items section title with box
      const itemsStartY = customerY + 150;
      
      doc.rect(40, itemsStartY - 5, 180, 30)
         .fillColor(primaryColor)
         .fill();
      
      doc.fillColor('#ffffff')
         .font('Helvetica-Bold')
         .fontSize(14)
         .text('ITEMS PURCHASED', 50, itemsStartY + 2);
      
      // Table headers - horizontal layout with alternating colors
      const tableTop = itemsStartY + 40;
      
      // Columns with pixel widths
      const columns = [
        { id: 'item', title: 'ITEM', width: 160 },
        { id: 'type', title: 'TYPE', width: 70 },
        { id: 'dimension', title: 'SIZE', width: 60 },
        { id: 'quantity', title: 'QTY', width: 50, align: 'center' },
        { id: 'price', title: 'PRICE', width: 90, align: 'right' },
        { id: 'total', title: 'TOTAL', width: 100, align: 'right' }
      ];
      
      // Calculate x positions
      let xPos = 40;
      columns.forEach(column => {
        column.x = xPos;
        xPos += column.width;
      });
      
      // Draw header row
      doc.rect(40, tableTop, doc.page.width - 80, 25)
         .fillColor(primaryColor)
         .fill();
      
      // Add header titles
      doc.fillColor('#ffffff')
         .font('Helvetica-Bold')
         .fontSize(10);
      
      columns.forEach(column => {
        const textOptions = { width: column.width, align: column.align || 'left' };
        doc.text(column.title, column.x + 5, tableTop + 8, textOptions);
      });
      
      // Table content with alternating row colors
      let currentY = tableTop + 25;
      let totalAmount = 0;
      let pageItems = 0; // Count items on current page
      const maxItemsPerPage = 15; // Adjust based on your design
      
      // Process each item
      for (let i = 0; i < sale.items.length; i++) {
        const item = sale.items[i];
        const itemTotal = item.total || (item.quantity * item.price);
        totalAmount += itemTotal;
        
        // Add new page if needed
        if (pageItems >= maxItemsPerPage || currentY > doc.page.height - 150) {
          doc.addPage();
          
          // Add header to new page
          doc.rect(0, 0, doc.page.width, 60)
             .fillColor(primaryColor)
             .fill();
           
          doc.fillColor('#ffffff')
             .fontSize(18)
             .font('Helvetica-Bold')
             .text('ELIVA HARDWARE - INVOICE', 40, 20, { align: 'center' });
          
          doc.fontSize(10)
             .text(`Invoice #: ${sale.invoiceNumber || 'INV-' + sale.id.substring(0, 6)} - Continued`, 40, 40, { align: 'center' });
          
          // Reset for new page
          currentY = 80;
          pageItems = 0;
          
          // Repeat column headers on new page
          doc.rect(40, currentY, doc.page.width - 80, 25)
             .fillColor(primaryColor)
             .fill();
          
          doc.fillColor('#ffffff')
             .fontSize(10);
          
          columns.forEach(column => {
            const textOptions = { width: column.width, align: column.align || 'left' };
            doc.text(column.title, column.x + 5, currentY + 8, textOptions);
          });
          
          currentY += 25;
        }
        
        // Add alternating row background
        if (i % 2 === 0) {
          doc.rect(40, currentY, doc.page.width - 80, 20)
             .fillColor(secondaryColor)
             .fillOpacity(0.5)
             .fill();
        }
        
        // Add row content
        doc.fillOpacity(1)
           .fillColor(textColor)
           .font('Helvetica')
           .fontSize(10);
        
        columns.forEach(column => {
          const textOptions = { width: column.width, align: column.align || 'left' };
          let value = '';
          
          switch (column.id) {
            case 'item':
              value = item.description || 'Item';
              break;
            case 'type':
              value = item.type || '';
              break;
            case 'dimension':
              value = item.dimension || '';
              break;
            case 'quantity':
              value = item.quantity.toString();
              break;
            case 'price':
              value = `TZsh ${item.price.toLocaleString()}`;
              break;
            case 'total':
              value = `TZsh ${itemTotal.toLocaleString()}`;
              doc.font('Helvetica-Bold'); // Make total bold
              break;
          }
          
          doc.text(value, column.x + 5, currentY + 5, textOptions);
          doc.font('Helvetica'); // Reset font
        });
        
        currentY += 20;
        pageItems++;
      }
      
      // Add total section
      doc.rect(40, currentY + 5, doc.page.width - 80, 2)
         .fillColor(borderColor)
         .fill();
      
      const totalSectionY = currentY + 20;
      
      // Create gradient for total box
      const totalBoxWidth = 200;
      const totalBoxX = doc.page.width - totalBoxWidth - 40;
      
      const totalGradient = doc.linearGradient(totalBoxX, totalSectionY, totalBoxX + totalBoxWidth, totalSectionY + 40);
      totalGradient.stop(0, successColor)
                  .stop(1, '#004d40');
      
      doc.roundedRect(totalBoxX, totalSectionY, totalBoxWidth, 40, 5)
         .fill(totalGradient);
      
      doc.fillColor('#ffffff')
         .font('Helvetica-Bold')
         .fontSize(16)
         .text(`TOTAL: TZsh ${totalAmount.toLocaleString()}`, totalBoxX + 10, totalSectionY + 12);
      
      // Terms and conditions section
      const termsY = totalSectionY + 60;
      
      doc.rect(40, termsY, doc.page.width - 80, 30)
         .fillColor(headingColor)
         .fillOpacity(0.1)
         .fill()
         .fillOpacity(1);
      
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor(headingColor)
         .text('PAYMENT TERMS & CONDITIONS', 50, termsY + 9);
      
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor(textColor)
         .text('1. Payment is due within 30 days of the invoice date.', 50, termsY + 40)
         .text('2. Please make payments to: ELIVA HARDWARE, Account #: 123456789', 50, termsY + 55)
         .text('3. For any questions regarding this invoice, please contact +255 123 456 789 or info@eliva.co.tz', 50, termsY + 70);
      
      // Signature section
      const signatureY = termsY + 100;
      
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .text('Authorized Signature:', 40, signatureY);
      
      doc.moveTo(40, signatureY + 40)
         .lineTo(200, signatureY + 40)
         .stroke();
      
      // Add thank you message
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor(primaryColor)
         .text('Thank you for your business!', 40, signatureY + 60, { align: 'center' });
      
      // Footer with gradient
      const footerHeight = 40;
      const footerY = doc.page.height - footerHeight;
      
      const footerGradient = doc.linearGradient(0, footerY, 0, doc.page.height);
      footerGradient.stop(0, '#f5f5f5')
                   .stop(1, '#e3f2fd');
                   
      doc.rect(0, footerY, doc.page.width, footerHeight)
         .fill(footerGradient);
      
      // Add footer text
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor(textColor)
         .text('Eliva Hardware • +255 123 456 789 • info@eliva.co.tz', 40, footerY + 15, { align: 'center' });
      
      // Add page number
      doc.font('Helvetica-Bold')
         .text('Page 1 of 1', doc.page.width - 80, footerY + 15, { align: 'right' });
      
      // Finalize PDF
      doc.end();
      
      // Handle stream events
      stream.on('finish', () => {
        resolve(filePath);
      });
      
      stream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate a generic report PDF
 * @param {string} filePath - Path to save the PDF
 * @param {Object} reportData - Report data object
 * @returns {Promise} - Resolves when PDF is created
 */
function generateGenericReport(filePath, reportData) {
  return new Promise((resolve, reject) => {
    try {
      // Validate inputs first to prevent undefined errors
      if (!filePath) {
        throw new Error('No file path provided for report generation');
      }
      
      if (!reportData || typeof reportData !== 'object') {
        throw new Error('Invalid report data provided for PDF generation');
      }

      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: reportData.title || 'Generated Report',
          Author: 'Eliva Hardware Inventory Management System'
        }
      });

      // Pipe PDF to file
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Define colors - with fallbacks to ensure no undefined
      const primaryColor = (reportData.type === 'inventory') ? '#0d47a1' : '#6a1b9a';
      const secondaryColor = (reportData.type === 'inventory') ? '#2196f3' : '#9c27b0';
      const accentColor = (reportData.type === 'inventory') ? '#bbdefb' : '#e1bee7';

      // Add document styling
      doc.font('Helvetica-Bold')
         .fontSize(24)
         .fillColor(primaryColor)
         .text(reportData.title || 'Report', { align: 'center' });

      // Add generated date
      const reportDate = new Date(reportData.date || reportData.createdAt || new Date()).toLocaleDateString();
      doc.moveDown(0.5)
         .fontSize(12)
         .fillColor('#666666')
         .text(`Generated on: ${reportDate}`, { align: 'center' });

      // Add gradient header
      doc.moveDown(1);
      const startY = doc.y;
      doc.rect(40, startY, doc.page.width - 80, 30)
         .fillOpacity(0.7)
         .fill(primaryColor);
      doc.fillOpacity(1)
         .fillColor('white')
         .fontSize(14)
         .text(
           reportData.type === 'inventory' ? 'Inventory Status Summary' : 'Sales Activity Summary',
           50,
           startY + 8,
           { width: doc.page.width - 100, align: 'center' }
         );

      // Add summary section - with proper null/undefined checking
      doc.moveDown(1.5)
         .fillColor('#333333')
         .fontSize(12);

      if (reportData.data && reportData.data.summary) {
        // If there's a predefined summary object
        Object.entries(reportData.data.summary || {}).forEach(([key, value]) => {
          const formattedKey = key.replace(/([A-Z])/g, ' $1')
                                 .replace(/^./, str => str.toUpperCase())
                                 .replace(/([a-z])([A-Z])/g, '$1 $2');
          
          doc.font('Helvetica-Bold')
             .text(`${formattedKey}: `, { continued: true })
             .font('Helvetica')
             .text(`${value}`);
        });
      } else if (reportData.type === 'inventory' && reportData.data) {
        // Inventory report - with safe property access
        doc.font('Helvetica-Bold')
           .text('Total Items: ', { continued: true })
           .font('Helvetica')
           .text(`${(reportData.data && reportData.data.totalItems) || 0}`);
        
        doc.font('Helvetica-Bold')
           .text('Total Value: ', { continued: true })
           .font('Helvetica')
           .text(`TZsh ${((reportData.data && reportData.data.totalValue) || 0).toFixed(2)}`);
        
        doc.font('Helvetica-Bold')
           .text('Low Stock Items: ', { continued: true })
           .font('Helvetica')
           .text(`${(reportData.data && reportData.data.lowStockItems) || 0}`);
      } else if (reportData.type === 'sales' && reportData.data) {
        // Sales report
        doc.font('Helvetica-Bold')
           .text('Total Sales: ', { continued: true })
           .font('Helvetica')
           .text(`${(reportData.data && reportData.data.totalSales) || 0}`);
        
        doc.font('Helvetica-Bold')
           .text('Total Revenue: ', { continued: true })
           .font('Helvetica')
           .text(`TZsh ${((reportData.data && reportData.data.totalRevenue) || 0).toFixed(2)}`);
        
        if (reportData.period) {
          doc.font('Helvetica-Bold')
             .text('Period: ', { continued: true })
             .font('Helvetica')
             .text(`${reportData.period}`);
        }
      }

      // Add categories section for inventory reports
      if (reportData.type === 'inventory' && reportData.data && reportData.data.categories) {
        doc.moveDown(1.5)
           .font('Helvetica-Bold')
           .fontSize(14)
           .fillColor(primaryColor)
           .text('Categories', { underline: true });
        
        doc.moveDown(0.5);
        
        const categories = reportData.data.categories || [];
        categories.forEach((category, i) => {
          if (category && typeof category === 'object') {
            doc.font('Helvetica-Bold')
               .fontSize(12)
               .fillColor('#333333')
               .text(`${category.name || 'Unknown'}:`, { continued: true })
               .font('Helvetica')
               .text(` ${category.count || 0} items (TZsh ${(category.value || 0).toFixed(2)})`);
          }
        });
      }

      // Add top selling items for sales reports
      if (reportData.type === 'sales' && reportData.data && Array.isArray(reportData.data.topSellingItems) && reportData.data.topSellingItems.length > 0) {
        doc.moveDown(1.5)
           .font('Helvetica-Bold')
           .fontSize(14)
           .fillColor(primaryColor)
           .text('Top Selling Items', { underline: true });
        
        doc.moveDown(0.5);
        
        // Create table for top items
        const tableTop = doc.y;
        const itemsTableWidth = 500;
        const colWidths = [250, 80, 80, 90];
        
        // Draw table header
        doc.font('Helvetica-Bold')
           .fontSize(10)
           .fillColor('#ffffff');
        
        doc.rect(40, tableTop, colWidths[0], 20)
           .fill(primaryColor);
        doc.text('Item', 45, tableTop + 5, { width: colWidths[0] - 10 });
        
        doc.rect(40 + colWidths[0], tableTop, colWidths[1], 20)
           .fill(primaryColor);
        doc.text('Quantity', 40 + colWidths[0] + 5, tableTop + 5, { width: colWidths[1] - 10, align: 'right' });
        
        doc.rect(40 + colWidths[0] + colWidths[1], tableTop, colWidths[2], 20)
           .fill(primaryColor);
        doc.text('Price', 40 + colWidths[0] + colWidths[1] + 5, tableTop + 5, { width: colWidths[2] - 10, align: 'right' });
        
        doc.rect(40 + colWidths[0] + colWidths[1] + colWidths[2], tableTop, colWidths[3], 20)
           .fill(primaryColor);
        doc.text('Revenue', 40 + colWidths[0] + colWidths[1] + colWidths[2] + 5, tableTop + 5, { width: colWidths[3] - 10, align: 'right' });
        
        // Draw table rows with safety checks
        let rowY = tableTop + 20;
        const topSellingItems = reportData.data.topSellingItems || [];
        topSellingItems.forEach((item, i) => {
          if (!item || typeof item !== 'object') return;
          
          // Alternate row background
          if (i % 2 === 0) {
            doc.rect(40, rowY, itemsTableWidth, 20)
               .fillOpacity(0.1)
               .fill(accentColor);
          }
          
          doc.fillOpacity(1)
             .font('Helvetica')
             .fontSize(10)
             .fillColor('#333333');
          
          // Add safe property checks
          const itemName = item.name || 'Unknown';
          const itemQuantity = item.quantity || 0;
          const itemRevenue = item.revenue || 0;
          const itemPrice = itemQuantity > 0 ? (itemRevenue / itemQuantity) : 0;
          
          doc.text(itemName, 45, rowY + 5, { width: colWidths[0] - 10 });
          doc.text(itemQuantity.toString(), 40 + colWidths[0] + 5, rowY + 5, { width: colWidths[1] - 10, align: 'right' });
          doc.text(`TZsh ${itemPrice.toFixed(2)}`, 40 + colWidths[0] + colWidths[1] + 5, rowY + 5, { width: colWidths[2] - 10, align: 'right' });
          doc.text(`TZsh ${itemRevenue.toFixed(2)}`, 40 + colWidths[0] + colWidths[1] + colWidths[2] + 5, rowY + 5, { width: colWidths[3] - 10, align: 'right' });
          
          rowY += 20;
        });
      }

      // Add detailed data if available (full item list or sales list)
      const hasItems = reportData.type === 'inventory' && reportData.data && Array.isArray(reportData.data.items) && reportData.data.items.length > 0;
      const hasSales = reportData.type === 'sales' && reportData.data && Array.isArray(reportData.data.sales) && reportData.data.sales.length > 0;
      
      if (hasItems || hasSales) {
        // Add a page break if we're running low on space
        if (doc.y > 650) {
          doc.addPage();
        } else {
          doc.moveDown(2);
        }
        
        doc.font('Helvetica-Bold')
           .fontSize(14)
           .fillColor(primaryColor)
           .text(reportData.type === 'inventory' ? 'Inventory Items' : 'Sales Transactions', { underline: true });
        
        doc.moveDown(0.5);
        
        // Create table with proper widths
        const detailsTableTop = doc.y;
        let detailColWidths = [];
        let headers = [];
        
        if (reportData.type === 'inventory') {
          detailColWidths = [180, 60, 60, 60, 80, 60];
          headers = ['Item', 'Type', 'Qty', 'Price', 'Value', 'Status'];
        } else { // sales
          detailColWidths = [100, 180, 60, 80, 80];
          headers = ['Date', 'Customer', 'Items', 'Total', 'Invoice'];
        }
        
        // Draw table header
        doc.font('Helvetica-Bold')
           .fontSize(10)
           .fillColor('#ffffff');
        
        let xPos = 40;
        headers.forEach((header, i) => {
          doc.rect(xPos, detailsTableTop, detailColWidths[i], 20)
             .fill(primaryColor);
          doc.text(header, xPos + 5, detailsTableTop + 5, { width: detailColWidths[i] - 10, align: i > 0 ? 'right' : 'left' });
          xPos += detailColWidths[i];
        });
        
        // Get items or sales safely
        const items = reportData.type === 'inventory' ? 
          (reportData.data ? reportData.data.items || [] : []) : 
          (reportData.data ? reportData.data.sales || [] : []);
        
        if (items.length === 0) {
          // No items to display
          doc.moveDown(1)
             .font('Helvetica')
             .fillColor('#333333')
             .text('No items to display', { align: 'center' });
        } else {
          // Calculate pages for pagination
          const itemsPerPage = 25;
          const totalPages = Math.ceil(items.length / itemsPerPage);
          
          // Draw rows with pagination
          let detailRowY = detailsTableTop + 20;
          
          for (let page = 0; page < totalPages; page++) {
            const startIdx = page * itemsPerPage;
            const endIdx = Math.min(startIdx + itemsPerPage, items.length);
            
            // Add a new page if this isn't the first page
            if (page > 0) {
              doc.addPage();
              detailRowY = 60;
              
              // Add page header
              doc.font('Helvetica-Bold')
                 .fontSize(12)
                 .fillColor(primaryColor)
                 .text(`${reportData.title || 'Report'} (continued)`, { align: 'center' });
              
              doc.moveDown(0.5);
              
              // Redraw table header
              doc.font('Helvetica-Bold')
                 .fontSize(10)
                 .fillColor('#ffffff');
              
              let xPos = 40;
              headers.forEach((header, i) => {
                doc.rect(xPos, detailRowY, detailColWidths[i], 20)
                   .fill(primaryColor);
                doc.text(header, xPos + 5, detailRowY + 5, { width: detailColWidths[i] - 10, align: i > 0 ? 'right' : 'left' });
                xPos += detailColWidths[i];
              });
              
              detailRowY += 20;
            }
            
            // Draw the items for this page
            for (let i = startIdx; i < endIdx; i++) {
              const item = items[i];
              if (!item || typeof item !== 'object') continue;
              
              // Alternate row background
              if (i % 2 === 0) {
                let rowWidth = 0;
                detailColWidths.forEach(w => rowWidth += w);
                doc.rect(40, detailRowY, rowWidth, 20)
                   .fillOpacity(0.1)
                   .fill(accentColor);
              }
              
              doc.fillOpacity(1)
                 .font('Helvetica')
                 .fontSize(10)
                 .fillColor('#333333');
              
              let xPos = 40;
              
              if (reportData.type === 'inventory') {
                // Inventory items with safe property access
                doc.text(item.description || 'Unknown', xPos + 5, detailRowY + 5, { width: detailColWidths[0] - 10 });
                xPos += detailColWidths[0];
                
                doc.text(item.type || 'N/A', xPos + 5, detailRowY + 5, { width: detailColWidths[1] - 10, align: 'right' });
                xPos += detailColWidths[1];
                
                doc.text((item.quantity || 0).toString(), xPos + 5, detailRowY + 5, { width: detailColWidths[2] - 10, align: 'right' });
                xPos += detailColWidths[2];
                
                doc.text(`TZsh ${(item.price || 0).toFixed(2)}`, xPos + 5, detailRowY + 5, { width: detailColWidths[3] - 10, align: 'right' });
                xPos += detailColWidths[3];
                
                doc.text(`TZsh ${(item.value || 0).toFixed(2)}`, xPos + 5, detailRowY + 5, { width: detailColWidths[4] - 10, align: 'right' });
              } else {
                // Sales transactions with safe property access
                const saleDate = item.date ? new Date(item.date).toLocaleDateString() : 'N/A';
                doc.text(saleDate, xPos + 5, detailRowY + 5, { width: detailColWidths[0] - 10 });
                xPos += detailColWidths[0];
                
                doc.text(item.customer || 'N/A', xPos + 5, detailRowY + 5, { width: detailColWidths[1] - 10 });
                xPos += detailColWidths[1];
                
                doc.text((item.items || 0).toString(), xPos + 5, detailRowY + 5, { width: detailColWidths[2] - 10, align: 'right' });
                xPos += detailColWidths[2];
                
                doc.text(`TZsh ${(item.total || 0).toFixed(2)}`, xPos + 5, detailRowY + 5, { width: detailColWidths[3] - 10, align: 'right' });
              }
              
              detailRowY += 20;
            }
          }
        }
      }

      // Add footer
      doc.fontSize(10)
         .fillColor('#666666')
         .text(
           'Generated by Eliva Hardware Inventory Management System',
           40,
           doc.page.height - 50,
           { width: doc.page.width - 80, align: 'center' }
         );
      
      // Finalize PDF
      doc.end();
      
      // Listen for stream events
      stream.on('finish', () => {
        resolve(filePath);
      });
      
      stream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      console.error('Error generating generic report:', error);
      reject(error);
    }
  });
}

/**
 * Generate an analytics report PDF with charts and data
 * @param {string} filePath - Path to save the PDF
 * @param {Object} analyticsData - Analytics data object
 * @param {Object} options - Additional options for the report
 * @returns {Promise} - Resolves when PDF is created
 */
function generateAnalyticsReport(filePath, analyticsData, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      // Create PDF document with better quality for charts
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `Analytics Report - ${options.title || 'Overview'}`,
          Author: 'Eliva Hardware Inventory Management System',
          Keywords: 'analytics, sales, inventory, report'
        },
        autoFirstPage: true,
        bufferPages: true
      });

      // Pipe PDF to file
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Define vibrant colors for modern look
      const primaryColor = '#4361ee'; // Vibrant blue
      const secondaryColor = '#f0f4ff'; // Light blue background
      const accentColor = '#3a0ca3'; // Deep purple accent
      const textColor = '#212121'; // Dark text
      const headingColor = '#2b2d42'; // Dark blue for headings
      const successColor = '#4cc9f0'; // Bright blue for highlights
      const borderColor = '#c7d2fe'; // Light purple for borders
      const chartColors = ['#4361ee', '#4cc9f0', '#3a0ca3', '#7209b7', '#f72585', '#480ca8'];

      // Add colorful gradient header background
      const headerHeight = 160;
      
      // Create a linear gradient for the header
      const gradient = doc.linearGradient(0, 0, doc.page.width, headerHeight);
      gradient.stop(0, '#4361ee')
             .stop(0.5, '#3a0ca3')
             .stop(1, '#7209b7');
             
      doc.rect(0, 0, doc.page.width, headerHeight)
         .fill(gradient);
         
      // Add decorative elements to header
      doc.save();
      doc.moveTo(0, headerHeight);
      for (let i = 0; i < doc.page.width; i += 20) {
        doc.lineTo(i + 10, headerHeight - 10);
        doc.lineTo(i + 20, headerHeight);
      }
      doc.fillColor('#4cc9f0')
         .fill();
      doc.restore();

      // Add company name with shadow effect
      doc.fillOpacity(1)
         .fillColor('#ffffff')
         .fontSize(34)
         .font('Helvetica-Bold')
         .text('ELIVA HARDWARE', 50, 40, { align: 'center' });
         
      // Add subtitle
      doc.fontSize(20)
         .text('Analytics Report', { align: 'center' });
         
      // Add report title with emphasis
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .text(options.title || 'Performance Overview', { align: 'center' });

      // Add report date
      doc.fontSize(14)
         .font('Helvetica')
         .text(`Generated on ${moment().format('MMMM DD, YYYY [at] h:mm A')}`, { align: 'center' });

      // Add a fancy line below header
      const contentStartY = headerHeight + 20;
      doc.moveTo(40, contentStartY)
         .lineTo(doc.page.width - 40, contentStartY)
         .lineWidth(2)
         .strokeOpacity(0.8)
         .strokeColor(borderColor)
         .stroke();

      // Add key metrics section
      const metricsStartY = contentStartY + 30;
      doc.fontSize(18)
         .font('Helvetica-Bold')
         .fillColor(headingColor)
         .text('Key Performance Metrics', 40, metricsStartY);

      // Create metrics cards in a row
      const metrics = [
        { 
          label: 'Total Revenue', 
          value: analyticsData.totalRevenue || 0,
          format: 'currency',
          icon: '💰'
        },
        { 
          label: 'Profit Margin', 
          value: analyticsData.profitMargin || 0,
          format: 'percentage',
          icon: '📈'
        },
        { 
          label: 'Inventory Value', 
          value: analyticsData.inventoryValue || 0,
          format: 'currency',
          icon: '📦'
        },
        { 
          label: 'Turnover Rate', 
          value: analyticsData.turnoverRate || 0,
          format: 'number',
          icon: '🔄'
        }
      ];

      const cardWidth = 120;
      const cardHeight = 80;
      const cardGap = 15;
      const cardsStartX = (doc.page.width - ((cardWidth * metrics.length) + (cardGap * (metrics.length - 1)))) / 2;

      metrics.forEach((metric, index) => {
        const cardX = cardsStartX + (index * (cardWidth + cardGap));
        const cardY = metricsStartY + 30;

        // Draw card background with rounded corners
        doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 8)
           .fillColor(secondaryColor)
           .fill();

        // Add metric icon
        doc.fontSize(20)
           .text(metric.icon, cardX + 10, cardY + 10);

        // Add metric value with appropriate formatting
        let formattedValue;
        switch(metric.format) {
          case 'currency':
            formattedValue = `TZsh ${Number(metric.value).toLocaleString()}`;
            break;
          case 'percentage':
            formattedValue = `${Number(metric.value).toFixed(1)}%`;
            break;
          default:
            formattedValue = Number(metric.value).toFixed(1);
        }

        doc.fontSize(16)
           .font('Helvetica-Bold')
           .fillColor(primaryColor)
           .text(formattedValue, cardX + 10, cardY + 35, { width: cardWidth - 20, align: 'center' });

        // Add metric label
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor(textColor)
           .text(metric.label, cardX + 10, cardY + 60, { width: cardWidth - 20, align: 'center' });
      });

      // Add sales trend section if data exists
      if (analyticsData.salesTrend && analyticsData.salesTrend.labels && analyticsData.salesTrend.data) {
        const salesTrendY = metricsStartY + 140;
        
        doc.fontSize(18)
           .font('Helvetica-Bold')
           .fillColor(headingColor)
           .text('Sales Trend', 40, salesTrendY);

        // Add a note about the chart
        doc.fontSize(10)
           .font('Helvetica-Italic')
           .fillColor(textColor)
           .text('The chart below shows sales performance over time.', 40, salesTrendY + 25);

        // Create a table for sales trend data
        const tableTop = salesTrendY + 50;
        const tableWidth = doc.page.width - 80;
        
        // Define column widths for the table
        const colWidths = [200, 150, 150];
        
        // Draw table header
        doc.rect(40, tableTop, tableWidth, 30)
           .fillColor(primaryColor)
           .fill();
        
        // Add header text
        doc.fillColor('#ffffff')
           .font('Helvetica-Bold')
           .fontSize(12)
           .text('Period', 50, tableTop + 10)
           .text('Sales Amount', 250, tableTop + 10)
           .text('% Change', 400, tableTop + 10);

        // Add table rows
        let rowY = tableTop + 30;
        let prevValue = null;
        
        analyticsData.salesTrend.labels.forEach((label, index) => {
          const value = analyticsData.salesTrend.data[index] || 0;
          
          // Calculate percent change
          let percentChange = 0;
          let changeText = '—';
          let changeColor = textColor;
          
          if (prevValue !== null && prevValue !== 0) {
            percentChange = ((value - prevValue) / prevValue) * 100;
            changeText = percentChange > 0 ? `+${percentChange.toFixed(1)}%` : `${percentChange.toFixed(1)}%`;
            changeColor = percentChange > 0 ? '#4cc9f0' : '#f72585';
          }
          
          // Add alternating row background
          if (index % 2 === 0) {
            doc.rect(40, rowY, tableWidth, 25)
               .fillColor(secondaryColor)
               .fillOpacity(0.5)
               .fill();
          }
          
          // Reset opacity for text
          doc.fillOpacity(1);
          
          // Add row data
          doc.fillColor(textColor)
             .font('Helvetica')
             .fontSize(11)
             .text(label, 50, rowY + 7)
             .text(`TZsh ${Number(value).toLocaleString()}`, 250, rowY + 7);
          
          // Add percent change with color
          doc.fillColor(changeColor)
             .text(changeText, 400, rowY + 7);
          
          rowY += 25;
          prevValue = value;
          
          // Add a new page if needed
          if (rowY > doc.page.height - 100) {
            doc.addPage();
            rowY = 60;
            
            // Add section title on new page
            doc.fontSize(18)
               .font('Helvetica-Bold')
               .fillColor(headingColor)
               .text('Sales Trend (Continued)', 40, 40);
          }
        });
      }

      // Add product distribution section if data exists
      if (analyticsData.productDistribution && analyticsData.productDistribution.labels) {
        // Check if we need a new page
        if (doc.y > doc.page.height - 300) {
          doc.addPage();
        }
        
        const distributionY = doc.y + 40;
        
        doc.fontSize(18)
           .font('Helvetica-Bold')
           .fillColor(headingColor)
           .text('Product Distribution', 40, distributionY);

        // Add a note about the chart
        doc.fontSize(10)
           .font('Helvetica-Italic')
           .fillColor(textColor)
           .text('The table below shows distribution of products by category.', 40, distributionY + 25);

        // Create a table for product distribution data
        const tableTop = distributionY + 50;
        const tableWidth = doc.page.width - 80;
        
        // Define column widths for the table
        const colWidths = [180, 100, 100, 100];
        
        // Draw table header
        doc.rect(40, tableTop, tableWidth, 30)
           .fillColor(primaryColor)
           .fill();
        
        // Add header text
        doc.fillColor('#ffffff')
           .font('Helvetica-Bold')
           .fontSize(12)
           .text('Category', 50, tableTop + 10)
           .text('Quantity', 250, tableTop + 10)
           .text('Value', 350, tableTop + 10)
           .text('% of Total', 450, tableTop + 10);

        // Add table rows
        let rowY = tableTop + 30;
        let totalValue = analyticsData.productDistribution.data.reduce((sum, val) => sum + val, 0);
        
        analyticsData.productDistribution.labels.forEach((label, index) => {
          const value = analyticsData.productDistribution.data[index] || 0;
          const quantity = analyticsData.productDistribution.quantities ? 
                          analyticsData.productDistribution.quantities[index] : '—';
          
          // Calculate percent of total
          const percentOfTotal = totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : '0.0';
          
          // Add alternating row background
          if (index % 2 === 0) {
            doc.rect(40, rowY, tableWidth, 25)
               .fillColor(secondaryColor)
               .fillOpacity(0.5)
               .fill();
          }
          
          // Reset opacity for text
          doc.fillOpacity(1);
          
          // Add row data
          doc.fillColor(textColor)
             .font('Helvetica')
             .fontSize(11)
             .text(label, 50, rowY + 7)
             .text(quantity.toString(), 250, rowY + 7)
             .text(`TZsh ${Number(value).toLocaleString()}`, 350, rowY + 7)
             .text(`${percentOfTotal}%`, 450, rowY + 7);
          
          rowY += 25;
          
          // Add a new page if needed
          if (rowY > doc.page.height - 100) {
            doc.addPage();
            rowY = 60;
            
            // Add section title on new page
            doc.fontSize(18)
               .font('Helvetica-Bold')
               .fillColor(headingColor)
               .text('Product Distribution (Continued)', 40, 40);
          }
        });
      }

      // Add recommendations section if data exists
      if (analyticsData.recommendations && analyticsData.recommendations.length > 0) {
        // Check if we need a new page
        if (doc.y > doc.page.height - 200) {
          doc.addPage();
        }
        
        const recommendationsY = doc.y + 40;
        
        doc.fontSize(18)
           .font('Helvetica-Bold')
           .fillColor(headingColor)
           .text('Smart Recommendations', 40, recommendationsY);

        // Add recommendations
        let recY = recommendationsY + 30;
        
        analyticsData.recommendations.forEach((rec, index) => {
          // Create recommendation card with icon
          const cardHeight = 70;
          
          // Draw card background with rounded corners and left border
          doc.roundedRect(40, recY, doc.page.width - 80, cardHeight, 8)
             .fillColor(secondaryColor)
             .fillOpacity(0.7)
             .fill();
          
          // Add colored left border based on type
          let borderColor;
          switch(rec.type) {
            case 'warning':
              borderColor = '#f72585';
              break;
            case 'success':
              borderColor = '#4cc9f0';
              break;
            default:
              borderColor = '#4361ee';
          }
          
          doc.rect(40, recY, 8, cardHeight)
             .fillColor(borderColor)
             .fillOpacity(1)
             .fill();
          
          // Reset opacity for text
          doc.fillOpacity(1);
          
          // Add recommendation title
          doc.fillColor(headingColor)
             .font('Helvetica-Bold')
             .fontSize(14)
             .text(rec.title, 60, recY + 15);
          
          // Add recommendation message
          doc.fillColor(textColor)
             .font('Helvetica')
             .fontSize(11)
             .text(rec.message, 60, recY + 35, { width: doc.page.width - 120 });
          
          recY += cardHeight + 15;
          
          // Add a new page if needed
          if (recY > doc.page.height - 100) {
            doc.addPage();
            recY = 60;
            
            // Add section title on new page
            doc.fontSize(18)
               .font('Helvetica-Bold')
               .fillColor(headingColor)
               .text('Smart Recommendations (Continued)', 40, 40);
          }
        });
      }

      // Add footer with page numbers
      const totalPages = doc.bufferedPageRange().count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(i);
        
        // Add page number
        doc.fontSize(10)
           .fillColor(textColor)
           .text(
             `Page ${i + 1} of ${totalPages}`,
             0,
             doc.page.height - 50,
             { align: 'center' }
           );
        
        // Add footer line
        doc.moveTo(40, doc.page.height - 40)
           .lineTo(doc.page.width - 40, doc.page.height - 40)
           .lineWidth(1)
           .strokeOpacity(0.5)
           .strokeColor(borderColor)
           .stroke();
        
        // Add copyright
        doc.fontSize(9)
           .fillColor(textColor)
           .fillOpacity(0.7)
           .text(
             '© 2024 Eliva Hardware. All rights reserved.',
             0,
             doc.page.height - 30,
             { align: 'center' }
           );
      }

      // Finalize PDF
      doc.end();

      // Handle stream events
      stream.on('finish', () => {
        resolve(filePath);
      });

      stream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Export all functions
module.exports = {
  generateSalesReceipt,
  generateDailySalesReport,
  generateInventoryReport,
  generateInvoicePDF,
  generateGenericReport,
  generateAnalyticsReport
};
