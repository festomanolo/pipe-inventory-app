const { contextBridge, ipcRenderer } = require('electron');

// Expose sales-related functionality to renderer process
contextBridge.exposeInMainWorld('SalesHandlers', {
    getAllSales: async () => {
        console.log('SalesHandlers.getAllSales called');
        
        // Define retry parameters
        const maxRetries = 3;
        const delayMs = 1000;
        let lastError = null;
        
        // Try multiple methods with retries for robustness
        for (let retry = 0; retry < maxRetries; retry++) {
            try {
                // First try 'get-all-sales'
                try {
                    console.log(`Attempt ${retry + 1} using get-all-sales handler`);
                    const sales = await ipcRenderer.invoke('get-all-sales');
                    console.log(`SalesHandlers.getAllSales received ${sales ? sales.length : 0} sales via get-all-sales`);
                    
                    // Validate the response
                    if (Array.isArray(sales)) {
                        return sales;
                    } else {
                        console.warn('get-all-sales did not return an array, got:', typeof sales);
                        throw new Error('Invalid sales data format');
                    }
                } catch (error) {
                    console.warn('Error using get-all-sales:', error);
                    lastError = error;
                    
                    // Try fallback method if first one fails
                    console.log('Falling back to get-sales handler');
                    const sales = await ipcRenderer.invoke('get-sales');
                    console.log(`SalesHandlers.getAllSales received ${sales ? sales.length : 0} sales via get-sales`);
                    
                    // Validate the response
                    if (Array.isArray(sales)) {
                        return sales;
                    } else {
                        console.warn('get-sales did not return an array, got:', typeof sales);
                        throw new Error('Invalid sales data format');
                    }
                }
            } catch (error) {
                lastError = error;
                console.error(`Attempt ${retry + 1} failed:`, error);
                
                if (retry < maxRetries - 1) {
                    console.log(`Retrying in ${delayMs}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                }
            }
        }
        
        // All attempts failed
        console.error(`All ${maxRetries} attempts to get sales failed:`, lastError);
        throw lastError || new Error('Failed to retrieve sales data after multiple attempts');
    },
    getInventoryItems: async () => {
        console.log('SalesHandlers.getInventoryItems called');
        try {
            const items = await ipcRenderer.invoke('get-inventory-items');
            console.log(`SalesHandlers.getInventoryItems received ${items ? items.length : 0} items`);
            return items;
        } catch (error) {
            console.error('Error in SalesHandlers.getInventoryItems:', error);
            throw error;
        }
    },
    createSale: async (sale) => {
        console.log('SalesHandlers.createSale called');
        try {
            let result;
            try {
                result = await ipcRenderer.invoke('add-sale', sale);
            } catch (error) {
                console.log('Error on add-sale, details:', error);
                throw error;
            }
            console.log('SalesHandlers.createSale result:', result);
            return result;
        } catch (error) {
            console.error('Error in SalesHandlers.createSale:', error);
            throw error;
        }
    },
    getSaleById: async (saleId) => {
        console.log('SalesHandlers.getSaleById called for ID:', saleId);
        try {
            const sale = await ipcRenderer.invoke('get-sale-by-id', saleId);
            console.log('SalesHandlers.getSaleById result:', sale);
            return sale;
        } catch (error) {
            console.error('Error in SalesHandlers.getSaleById:', error);
            throw error;
        }
    },
    getSalesByPeriod: async (period, customRange) => {
        console.log('SalesHandlers.getSalesByPeriod called with period:', period);
        try {
            const sales = await ipcRenderer.invoke('get-sales-by-period', { period, customRange });
            console.log(`SalesHandlers.getSalesByPeriod received ${sales ? sales.length : 0} sales`);
            return sales;
        } catch (error) {
            console.error('Error in SalesHandlers.getSalesByPeriod:', error);
            throw error;
        }
    },
    getSalesSummary: async (sales) => {
        console.log('SalesHandlers.getSalesSummary called');
        try {
            const summary = await ipcRenderer.invoke('get-sales-summary', sales);
            console.log('SalesHandlers.getSalesSummary result:', summary);
            return summary;
        } catch (error) {
            console.error('Error in SalesHandlers.getSalesSummary:', error);
            throw error;
        }
    },
    deleteSale: async (saleId) => {
        console.log('SalesHandlers.deleteSale called for ID:', saleId);
        try {
            const result = await ipcRenderer.invoke('delete-sale', saleId);
            console.log('SalesHandlers.deleteSale result:', result);
            return result;
        } catch (error) {
            console.error('Error in SalesHandlers.deleteSale:', error);
            throw error;
        }
    },
    getCustomers: async () => {
        console.log('SalesHandlers.getCustomers called');
        try {
            const customers = await ipcRenderer.invoke('get-customers');
            console.log(`SalesHandlers.getCustomers received ${customers ? customers.length : 0} customers`);
            return customers;
        } catch (error) {
            console.error('Error in SalesHandlers.getCustomers:', error);
            throw error;
        }
    },
    getCustomerById: async (customerId) => {
        console.log(`SalesHandlers.getCustomerById called for ID: ${customerId}`);
        try {
            const customer = await ipcRenderer.invoke('get-customer-by-id', customerId);
            console.log('SalesHandlers.getCustomerById result:', customer);
            return customer;
        } catch (error) {
            console.error(`Error in SalesHandlers.getCustomerById for ID ${customerId}:`, error);
            throw error;
        }
    },
    addSale: async (sale) => {
        console.log('SalesHandlers.addSale called with data:', sale);
        try {
            // First try create-sale then fall back to add-sale for backward compatibility
            let result;
            
            try {
                result = await ipcRenderer.invoke('create-sale', sale);
            } catch (error) {
                console.log('create-sale failed, trying add-sale:', error);
                result = await ipcRenderer.invoke('add-sale', sale);
            }
            
            console.log('Sale added successfully, result:', result);
            return result;
        } catch (error) {
            console.error('Error in SalesHandlers.addSale:', error);
            throw error;
        }
    }
});

// Also expose the regular electronAPI for compatibility and additional functions
contextBridge.exposeInMainWorld('electronAPI', {
    // System handlers
    platform: process.platform,
    minimize: () => ipcRenderer.send('minimize'),
    maximize: () => ipcRenderer.send('maximize'),
    close: () => ipcRenderer.send('close'),
    
    // Sales handlers for compatibility
    getSales: async () => {
        console.log('electronAPI.getSales called');
        try {
            const sales = await ipcRenderer.invoke('get-sales');
            console.log(`electronAPI.getSales received ${sales ? sales.length : 0} sales`);
            return sales;
        } catch (error) {
            console.error('Error in electronAPI.getSales:', error);
            throw error;
        }
    },
    addSale: async (sale) => {
        console.log('electronAPI.addSale called with data:', sale);
        try {
            const result = await ipcRenderer.invoke('add-sale', sale);
            console.log('electronAPI.addSale result:', result);
            return result;
        } catch (error) {
            console.error('Error in electronAPI.addSale:', error);
            throw error;
        }
    },
    getInventory: async () => {
        console.log('electronAPI.getInventory called');
        try {
            const items = await ipcRenderer.invoke('get-inventory');
            console.log(`electronAPI.getInventory received ${items ? items.length : 0} items`);
            return items;
        } catch (error) {
            console.error('Error in electronAPI.getInventory:', error);
            throw error;
        }
    },
    
    // External links
    openExternalLink: (url) => ipcRenderer.invoke('open-external-link', url)
}); 