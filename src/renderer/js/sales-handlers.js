/**
 * sales-handlers.js
 * Simple implementation of sales handlers with localStorage fallback
 */

// Simplified implementation using localStorage as fallback
window.SalesHandlers = {
    // Load sales data
    loadSalesData: async function() {
        console.log('Loading sales data...');
        try {
            // Try to load from localStorage as fallback
            const salesData = localStorage.getItem('sales_data');
            if (salesData) {
                console.log('Using sales data from localStorage');
                return JSON.parse(salesData);
      } else {
                // No data, return empty array
                console.log('No sales data found, returning empty array');
                return [];
            }
        } catch (error) {
            console.error('Error loading sales data:', error);
            return [];
        }
    },

    // Get inventory items
    getInventoryItems: async function() {
        console.log('Loading inventory data...');
        try {
            // Try to load from localStorage as fallback
            const inventoryData = localStorage.getItem('inventory_data');
            if (inventoryData) {
                console.log('Using inventory data from localStorage');
                return JSON.parse(inventoryData);
      } else {
                // Create some dummy data if none exists
                console.log('No inventory data found, creating dummy data');
                const dummyData = [
          {
            id: '1',
                        description: 'PVC Pipe 1/2"',
                        type: 'PVC',
                        quantity: 100,
                        price: 5.99
          },
          {
            id: '2',
                        description: 'PVC Pipe 3/4"',
                        type: 'PVC',
                        quantity: 80,
                        price: 7.99
                    },
                    {
                        id: '3',
                        description: 'Copper Pipe 1/2"',
                        type: 'Copper',
                        quantity: 50,
                        price: 12.99
                    },
                    {
                        id: '4',
                        description: 'PEX Pipe 3/4"',
                        type: 'PEX',
                        quantity: 30,
                        price: 9.99
                    }
                ];
                localStorage.setItem('inventory_data', JSON.stringify(dummyData));
                return dummyData;
            }
  } catch (error) {
            console.error('Error loading inventory data:', error);
    return [];
        }
    },

    // Add a sale
    createSale: async function(saleData) {
        console.log('Creating new sale with data:', saleData);
        try {
            // Get existing sales
      let sales = [];
      try {
                const existingSales = localStorage.getItem('sales_data');
                if (existingSales) {
                    sales = JSON.parse(existingSales);
                }
            } catch (e) {
                console.error('Error parsing existing sales:', e);
            }

            // Create a new sale object with ID and invoice number
      const newSale = {
                id: Date.now().toString(),
                invoiceNumber: `INV-${Math.floor(Math.random() * 10000)}`,
                ...saleData,
                date: new Date().toISOString(),
                createdAt: new Date().toISOString()
            };
            

            // Add the sale
      sales.push(newSale);
      
      // Save back to localStorage
        localStorage.setItem('sales_data', JSON.stringify(sales));
        
        // Update inventory quantities
            await this.updateInventoryAfterSale(saleData.items);
        
            console.log('Sale created successfully with ID:', newSale.id);
        return newSale;
      } catch (error) {
            console.error('Error creating sale:', error);
    throw error;
  }
    },

    // Update inventory after sale
    updateInventoryAfterSale: async function(items) {
        console.log('Updating inventory after sale');
        try {
      // Get current inventory
      let inventory = [];
            const inventoryData = localStorage.getItem('inventory_data');
            if (inventoryData) {
                inventory = JSON.parse(inventoryData);
      }
      
      // Update quantities
            let updated = false;
            items.forEach(item => {
                const itemId = item.itemId || item.id;
                const quantity = parseInt(item.quantity) || 0;
                
                if (!itemId || quantity <= 0) return;
                
                const index = inventory.findIndex(invItem => invItem.id === itemId);
        if (index !== -1) {
                    inventory[index].quantity = Math.max(0, inventory[index].quantity - quantity);
                    updated = true;
                }
            });

            // Save back to localStorage if updated
            if (updated) {
                localStorage.setItem('inventory_data', JSON.stringify(inventory));
                console.log('Inventory updated successfully');
    }
  } catch (error) {
            console.error('Error updating inventory:', error);
        }
    },

    // Get sales by period (all sales for now)
    getSalesByPeriod: async function(period) {
        console.log('Getting sales by period:', period);
        // For simplicity, just return all sales for now
        return await this.loadSalesData();
    },

    // Get sales summary
    getSalesSummary: async function(sales) {
        console.log('Generating sales summary');
        try {
            // If no sales provided, load all
            const salesToAnalyze = sales || await this.loadSalesData();
            
            // Calculate summary
            const summary = {
                totalSales: salesToAnalyze.length,
                totalRevenue: 0,
                totalItems: 0,
                formattedTotalRevenue: ''
            };
            
            salesToAnalyze.forEach(sale => {
                summary.totalRevenue += parseFloat(sale.totalAmount) || 0;
                if (sale.items && Array.isArray(sale.items)) {
                    summary.totalItems += sale.items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
                }
            });
            
            summary.formattedTotalRevenue = `TZsh ${summary.totalRevenue.toFixed(2)}`;
            console.log('Generated sales summary:', summary);
            return summary;
        } catch (error) {
            console.error('Error generating sales summary:', error);
            return {
                totalSales: 0,
                totalRevenue: 0,
                totalItems: 0,
                formattedTotalRevenue: 'TZsh 0.00'
            };
        }
    },

    // Get all sales
    getAllSales: async function() {
        console.log('Getting all sales');
        return await this.loadSalesData();
    }
};
