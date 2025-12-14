// Chart.js global configuration
Chart.defaults.color = '#fff';
Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';
Chart.defaults.font.family = 'Poppins, sans-serif';

// Chart instances
let salesTrendChart;
let productDistributionChart;
let inventoryHealthChart;

// Global variables to store analytics data
let currentAnalyticsData = {};

// Initialize analytics dashboard
async function initializeAnalytics() {
    try {
        console.log('Initializing analytics dashboard...');
        
        // Show loading overlay
        showLoading();
        
        // Set a shorter timeout to prevent infinite loading, especially on Windows
        const TIMEOUT_MS = 3000; // 3 seconds timeout (reduced from 5)
        
        // Set a timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Analytics data loading timed out. Showing fallback data.')), TIMEOUT_MS);
        });
        
        // Fetch data from database with timeout
        let salesData, inventoryData;
        
        // Try to fetch sales data with timeout
        try {
            console.log('Attempting to fetch sales data with timeout');
            salesData = await Promise.race([fetchSalesData(), timeoutPromise]);
            console.log('Successfully fetched sales data:', salesData ? salesData.length : 0, 'records');
        } catch (salesError) {
            console.warn('Error or timeout fetching sales data:', salesError.message);
            salesData = getMockSalesData();
            console.log('Using mock sales data instead');
            
            // Add a notification about using mock data
            if (typeof addRecommendation === 'function') {
                addRecommendation(
                    'Sales Data Issue',
                    'Using sample sales data because actual data could not be loaded.',
                    'warning'
                );
            }
        }
        
        // Try to fetch inventory data with a new timeout
        const inventoryTimeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Inventory data loading timed out. Showing fallback data.')), TIMEOUT_MS);
        });
        
        try {
            console.log('Attempting to fetch inventory data with timeout');
            inventoryData = await Promise.race([fetchInventoryData(), inventoryTimeoutPromise]);
            console.log('Successfully fetched inventory data:', inventoryData ? inventoryData.length : 0, 'items');
        } catch (inventoryError) {
            console.warn('Error or timeout fetching inventory data:', inventoryError.message);
            inventoryData = getMockInventoryData();
            console.log('Using mock inventory data instead');
            
            // Add a notification about using mock data
            if (typeof addRecommendation === 'function') {
                addRecommendation(
                    'Inventory Data Issue',
                    'Using sample inventory data because actual data could not be loaded.',
                    'warning'
                );
            }
        }
        
        // Make sure we have data to work with, even if it's mock data
        if (!salesData || !Array.isArray(salesData) || salesData.length === 0) {
            console.warn('No sales data available, using mock data');
            salesData = getMockSalesData();
        }
        
        if (!inventoryData || !Array.isArray(inventoryData) || inventoryData.length === 0) {
            console.warn('No inventory data available, using mock data');
            inventoryData = getMockInventoryData();
        }
        
        // Store the data for export functionality
        currentAnalyticsData = {
            salesData,
            inventoryData
        };
        
        // Update metrics
        try {
            console.log('Updating metrics display');
            updateMetrics(salesData, inventoryData);
        } catch (metricsError) {
            console.error('Error updating metrics:', metricsError);
            // Try again with mock data if real data fails
            try {
                updateMetrics(getMockSalesData(), getMockInventoryData());
            } catch (fallbackError) {
                console.error('Even fallback metrics update failed:', fallbackError);
            }
        }
        
        // Initialize charts - do this safely one by one
        console.log('Initializing charts...');
        
        try {
            console.log('Initializing sales trend chart');
            initializeSalesTrendChart(salesData);
            console.log('Sales trend chart initialized successfully');
        } catch (chartError) {
            console.error('Error initializing sales trend chart:', chartError);
            try {
                // Try with mock data if real data fails
                initializeSalesTrendChart(getMockSalesData());
                console.log('Sales trend chart initialized with mock data');
            } catch (fallbackError) {
                console.error('Even fallback sales chart failed:', fallbackError);
                renderNoDataMessage(document.getElementById('sales-trend-chart').getContext('2d'), 'Could not render sales chart');
            }
        }
        
        try {
            console.log('Initializing product distribution chart');
            initializeProductDistributionChart(inventoryData);
            console.log('Product distribution chart initialized successfully');
        } catch (chartError) {
            console.error('Error initializing product distribution chart:', chartError);
            try {
                // Try with mock data if real data fails
                initializeProductDistributionChart(getMockInventoryData());
                console.log('Product distribution chart initialized with mock data');
            } catch (fallbackError) {
                console.error('Even fallback product chart failed:', fallbackError);
                renderNoDataMessage(document.getElementById('product-distribution-chart').getContext('2d'), 'Could not render product chart');
            }
        }
        
        try {
            console.log('Initializing inventory health chart');
            initializeInventoryHealthChart(inventoryData);
            console.log('Inventory health chart initialized successfully');
        } catch (chartError) {
            console.error('Error initializing inventory health chart:', chartError);
            try {
                // Try with mock data if real data fails
                initializeInventoryHealthChart(getMockInventoryData());
                console.log('Inventory health chart initialized with mock data');
            } catch (fallbackError) {
                console.error('Even fallback inventory chart failed:', fallbackError);
                renderNoDataMessage(document.getElementById('inventory-health-chart').getContext('2d'), 'Could not render inventory chart');
            }
        }
        
        // Generate recommendations
        try {
            console.log('Generating recommendations');
            generateRecommendations(salesData, inventoryData);
            console.log('Recommendations generated successfully');
        } catch (recError) {
            console.error('Error generating recommendations:', recError);
            // Add a generic recommendation
            addRecommendation(
                'Analytics System',
                'Some analytics features may be limited due to data loading issues.',
                'info'
            );
        }
        
        // Add event listener for time range changes
        try {
            console.log('Setting up time range event listener');
            const timeRangeElement = document.getElementById('time-range');
            if (timeRangeElement) {
                timeRangeElement.addEventListener('change', async (e) => {
                    const days = parseInt(e.target.value);
                    await updateChartsForTimeRange(days);
                });
                console.log('Time range event listener set up successfully');
            } else {
                console.warn('Time range element not found');
            }
        } catch (eventError) {
            console.error('Error setting up event listener:', eventError);
        }
        
        // Add event listeners for export buttons
        setupExportButtons();
        
    } catch (error) {
        console.error('Critical error initializing analytics:', error);
        
        // Show error message but don't block the UI
        showError('Error loading analytics data: ' + error.message);
        
        // Still initialize with mock data to prevent blank screen
        try {
            console.log('Attempting recovery with mock data');
            const mockSalesData = getMockSalesData();
            const mockInventoryData = getMockInventoryData();
            updateMetrics(mockSalesData, mockInventoryData);
            initializeSalesTrendChart(mockSalesData);
            initializeProductDistributionChart(mockInventoryData);
            initializeInventoryHealthChart(mockInventoryData);
            
            // Store mock data for export functionality
            currentAnalyticsData = {
                salesData: mockSalesData,
                inventoryData: mockInventoryData
            };
            
            // Add event listeners for export buttons
            setupExportButtons();
        } catch (recoveryError) {
            console.error('Recovery attempt failed:', recoveryError);
        }
    } finally {
        // IMPORTANT: Always hide the loading overlay, even if there were errors
        // Add a small delay to ensure the UI has time to render
        setTimeout(() => {
            console.log('Initialization complete, hiding loading overlay');
            hideLoading();
        }, 500);
    }
}

// Fetch sales data from database
async function fetchSalesData() {
    try {
        console.log('Fetching sales data from database...');
        
        // Try to get sales data using various available methods
        let sales = [];
        
        if (window.electronAPI && typeof window.electronAPI.getSales === 'function') {
            console.log('Using electronAPI.getSales to fetch sales data');
            sales = await window.electronAPI.getSales();
            console.log('Got sales data from electronAPI:', sales.length, 'records');
        } else if (window.electronAPI && typeof window.electronAPI.invoke === 'function') {
            console.log('Using electronAPI.invoke to fetch sales data');
            sales = await window.electronAPI.invoke('get-sales-data');
            console.log('Got sales data from invoke method:', sales.length, 'records');
        } else if (window.SalesHandlers && typeof window.SalesHandlers.getAllSales === 'function') {
            console.log('Using SalesHandlers.getAllSales to fetch sales data');
            sales = await window.SalesHandlers.getAllSales();
            console.log('Got sales data from SalesHandlers:', sales.length, 'records');
        } else {
            console.warn('No API method available for getting sales data, using mock data');
            // Return mock data as fallback
            return getMockSalesData();
        }
        
        // Check if we got valid sales data
        if (!sales || !Array.isArray(sales) || sales.length === 0) {
            console.warn('No sales data returned from database, using mock data');
            return getMockSalesData();
        }
        
        console.log('Sample sales data structure:', sales[0]);
        
        // Process the sales data for analytics
        return processSalesData(sales);
    } catch (error) {
        console.error('Error fetching sales data:', error);
        // Return mock data as fallback in case of error
        console.warn('Using mock sales data due to error');
        return getMockSalesData();
    }
}

// Fetch inventory data from database
async function fetchInventoryData() {
    try {
        console.log('Fetching inventory data from database...');
        
        // Try to get inventory data using various available methods
        let inventory = [];
        
        if (window.electronAPI && typeof window.electronAPI.getInventory === 'function') {
            console.log('Using electronAPI.getInventory to fetch inventory data');
            inventory = await window.electronAPI.getInventory();
            console.log('Got inventory data from electronAPI:', inventory.length, 'items');
        } else if (window.electronAPI && typeof window.electronAPI.invoke === 'function') {
            console.log('Using electronAPI.invoke to fetch inventory data');
            inventory = await window.electronAPI.invoke('get-inventory-data');
            console.log('Got inventory data from invoke method:', inventory.length, 'items');
        } else if (window.SalesHandlers && typeof window.SalesHandlers.getInventoryItems === 'function') {
            console.log('Using SalesHandlers.getInventoryItems to fetch inventory data');
            inventory = await window.SalesHandlers.getInventoryItems();
            console.log('Got inventory data from SalesHandlers:', inventory.length, 'items');
        } else {
            console.warn('No API method available for getting inventory data, using mock data');
            // Return mock data as fallback
            return getMockInventoryData();
        }
        
        // Check if we got valid inventory data
        if (!inventory || !Array.isArray(inventory) || inventory.length === 0) {
            console.warn('No inventory data returned from database, using mock data');
            return getMockInventoryData();
        }
        
        console.log('Sample inventory data structure:', inventory[0]);
        
        // Process the inventory data for analytics
        return processInventoryData(inventory);
    } catch (error) {
        console.error('Error fetching inventory data:', error);
        // Return mock data as fallback in case of error
        console.warn('Using mock inventory data due to error');
        return getMockInventoryData();
    }
}

// Process sales data for analytics
function processSalesData(sales) {
    if (!sales || !Array.isArray(sales) || sales.length === 0) {
        console.warn('No sales data to process, returning empty array');
        return [];
    }
    
    console.log('Processing sales data for analytics...');
    
    // Group sales by date and calculate daily totals
    const dailySales = sales.reduce((acc, sale) => {
        // Handle different date formats
        let saleDate;
        try {
            saleDate = new Date(sale.date || sale.createdAt).toLocaleDateString();
        } catch (e) {
            console.warn('Error parsing sale date:', e);
            saleDate = 'Unknown Date';
        }
        
        if (!acc[saleDate]) {
            acc[saleDate] = {
                revenue: 0,
                profit: 0,
                items: 0,
                transactions: 0,
                soldItems: [] // Track individual items sold for better analytics
            };
        }
        
        // Get sale amount, preferring totalAmount but falling back to other properties
        const saleAmount = parseFloat(sale.totalAmount || sale.total_amount || sale.amount || 0);
        
        // Calculate or estimate profit
        let profit = 0;
        
        // Try to get profit directly from sale
        if (typeof sale.profit === 'number') {
            profit = sale.profit;
        } else {
            // Estimate profit as 30% of revenue if not available
            profit = saleAmount * 0.3;
            
            // If items array is available, calculate more accurate profit
            if (sale.items && Array.isArray(sale.items)) {
                // Check if items is a string that needs parsing
                let items = sale.items;
                if (typeof items === 'string') {
                    try {
                        items = JSON.parse(items);
                    } catch (e) {
                        console.warn('Error parsing sale items:', e);
                    }
                }
                
                if (Array.isArray(items)) {
                    // Calculate profit based on item prices and costs
                    profit = items.reduce((total, item) => {
                        const quantity = parseFloat(item.quantity || 1);
                        const price = parseFloat(item.price || 0);
                        const cost = parseFloat(item.cost || item.buyingPrice || (price * 0.7)); // Estimate cost as 70% of price if not available
                        
                        // Track item information for better analytics
                        acc[saleDate].soldItems.push({
                            id: item.id || item.itemId,
                            description: item.description || 'Unknown Item',
                            dimension: item.dimension || item.size || '',
                            type: item.type || item.category || 'Uncategorized',
                            quantity: quantity,
                            price: price,
                            cost: cost,
                            profit: (price - cost) * quantity
                        });
                        
                        return total + ((price - cost) * quantity);
                    }, 0);
                }
            }
        }
        
        // Count items in the sale
        let itemCount = 0;
        if (sale.items) {
            if (Array.isArray(sale.items)) {
                itemCount = sale.items.reduce((count, item) => count + (parseInt(item.quantity) || 1), 0);
            } else if (typeof sale.items === 'string') {
                try {
                    const parsedItems = JSON.parse(sale.items);
                    if (Array.isArray(parsedItems)) {
                        itemCount = parsedItems.reduce((count, item) => count + (parseInt(item.quantity) || 1), 0);
                    } else {
                        itemCount = 0;
                    }
                } catch (e) {
                    console.warn('Error parsing sale items count:', e);
                    itemCount = 0;
                }
            }
        } else if (typeof sale.itemCount === 'number') {
            itemCount = sale.itemCount;
        }
        
        // Update accumulated values
        acc[saleDate].revenue += saleAmount;
        acc[saleDate].profit += profit;
        acc[saleDate].items += itemCount;
        acc[saleDate].transactions += 1;
        
        return acc;
    }, {});

    // Convert to array with dates
    const result = Object.entries(dailySales).map(([date, data]) => ({
        date,
        ...data
    }));
    
    // Sort by date (oldest first)
    result.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB;
    });
    
    console.log('Processed sales data:', result.length, 'daily records');
    return result;
}

// Process inventory data for analytics
function processInventoryData(inventory) {
    if (!inventory || !Array.isArray(inventory) || inventory.length === 0) {
        console.warn('No inventory data to process, returning empty array');
        return [];
    }
    
    console.log('Processing inventory data for analytics...');
    
    return inventory.map(item => {
        // Ensure quantity is a number
        const quantity = parseFloat(item.quantity || 0);
        
        // Get price with fallbacks
        const price = parseFloat(item.price || 0);
        
        // Get inventory value
        const value = quantity * price;
        
        // Get alert threshold with fallback
        const alertThreshold = parseFloat(item.alertThreshold || item.threshold || 10);
        
        // Estimate max quantity based on alert threshold
        const maxQuantity = Math.max(alertThreshold * 3, quantity);
        
        // Calculate inventory health percentage (how much stock is available relative to alert threshold)
        const healthPercentage = alertThreshold > 0 ? (quantity / alertThreshold) * 100 : 100;
        
        // Determine if item is low stock
        const isLowStock = quantity <= alertThreshold;
        
        // Determine if item is optimal stock (between threshold and 3x threshold)
        const isOptimalStock = quantity > alertThreshold && quantity <= (alertThreshold * 3);
        
        // Determine if item is overstock
        const isOverStock = quantity > (alertThreshold * 3);
        
        // Extract dimension/size information
        const dimension = item.dimension || item.size || '';
        
        // Extract detailed description
        const description = item.description || 'Unknown Item';
        
        // Extract item type/category
        const itemType = item.type || item.category || 'Uncategorized';
        
        // Create display name with dimension if available
        const displayName = dimension 
            ? `${description} (${dimension})` 
            : description;
        
        // Enrich item with calculated values
        return {
        ...item,
            quantity,
            price,
            value,
            maxQuantity,
            minQuantity: alertThreshold,
            healthPercentage,
            turnover: calculateTurnoverRate(item, maxQuantity),
            isLowStock,
            isOptimalStock,
            isOverStock,
            dimension,
            displayName,
            itemType
        };
    });
}

// Calculate turnover rate for an item
function calculateTurnoverRate(item, maxQuantity) {
    // If max quantity is not provided, calculate it
    if (maxQuantity === undefined) {
        const alertThreshold = parseFloat(item.alertThreshold || item.threshold || 10);
        maxQuantity = Math.max(alertThreshold * 3, parseFloat(item.quantity || 0));
    }
    
    // This is a simplified calculation. In a real application,
    // you would use actual sales data to calculate this.
    // Here we're estimating based on current stock level vs. max capacity.
    const quantity = parseFloat(item.quantity || 0);
    
    // Inverse ratio - lower stock means higher turnover
    if (maxQuantity > 0) {
        return Math.max(0, Math.min(100, ((maxQuantity - quantity) / maxQuantity) * 100));
    }
    
    return 0;
}

// Generate mock sales data for testing
function getMockSalesData() {
    const mockData = [];
    const today = new Date();
    
    // Generate 30 days of mock sales data
    for (let i = 30; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // More sales on weekends
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const baseSales = isWeekend ? 15000 : 8000;
        
        // Add some randomness
        const revenue = baseSales + (Math.random() * 5000);
        const profit = revenue * 0.3; // 30% profit margin
        
        mockData.push({
            date: date.toLocaleDateString(),
            revenue,
            profit,
            items: Math.floor(5 + Math.random() * 15),
            transactions: Math.floor(2 + Math.random() * 8)
        });
    }
    
    return mockData;
}

// Generate mock inventory data for testing
function getMockInventoryData() {
    const categories = ['Pipes', 'Tools', 'Hardware', 'Electrical', 'Plumbing'];
    const mockData = [];
    
    // Generate 50 mock inventory items
    for (let i = 0; i < 50; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const price = 1000 + Math.random() * 9000;
        const alertThreshold = 5 + Math.floor(Math.random() * 15);
        
        // Add some low stock, some optimal, some overstock
        let quantity;
        const stockType = Math.random();
        if (stockType < 0.2) {
            // Low stock
            quantity = Math.max(0, alertThreshold - Math.floor(Math.random() * 5));
        } else if (stockType < 0.7) {
            // Optimal stock
            quantity = alertThreshold + Math.floor(Math.random() * alertThreshold * 2);
        } else {
            // Overstock
            quantity = alertThreshold * 3 + Math.floor(Math.random() * 20);
        }
        
        mockData.push({
            id: `mock-${i}`,
            description: `${category} Item ${i + 1}`,
            category,
            quantity,
            price,
            alertThreshold,
            minQuantity: alertThreshold,
            maxQuantity: alertThreshold * 3
        });
    }
    
    return mockData;
}

// Update metrics display
function updateMetrics(salesData, inventoryData) {
    try {
        console.log('Updating metrics display...');
        
        // Calculate total revenue from actual sales data
    const totalRevenue = salesData.reduce((sum, day) => sum + day.revenue, 0);
    document.getElementById('total-revenue').textContent = formatCurrency(totalRevenue);

        // Calculate profit margin based on actual sales data
    const totalProfit = salesData.reduce((sum, day) => sum + day.profit, 0);
        const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    document.getElementById('profit-margin').textContent = `${profitMargin.toFixed(1)}%`;

        // Calculate inventory value based on actual inventory data
    const inventoryValue = inventoryData.reduce((sum, item) => sum + item.value, 0);
    document.getElementById('inventory-value').textContent = formatCurrency(inventoryValue);

        // Calculate average turnover rate based on actual inventory data
        const avgTurnover = inventoryData.length > 0 ? 
            inventoryData.reduce((sum, item) => sum + item.turnover, 0) / inventoryData.length : 0;
        document.getElementById('turnover-rate').textContent = `${avgTurnover.toFixed(1)}%`;
        
        // Add trend indicators if we have data from multiple days
        if (salesData.length > 1) {
            // Calculate daily sales trends (compare last 7 days to previous 7 days)
            const last7Days = salesData.slice(-7);
            const previous7Days = salesData.slice(-14, -7);
            
            // Calculate averages
            const last7DaysAvg = last7Days.reduce((sum, day) => sum + day.revenue, 0) / Math.max(1, last7Days.length);
            const previous7DaysAvg = previous7Days.reduce((sum, day) => sum + day.revenue, 0) / Math.max(1, previous7Days.length);
            
            // Calculate percentage change
            const salesChange = previous7DaysAvg > 0 
                ? ((last7DaysAvg - previous7DaysAvg) / previous7DaysAvg) * 100 
                : 0;
            
            // Add trend indicator to revenue
            const salesTrendEl = document.getElementById('sales-trend');
            if (salesTrendEl) {
                salesTrendEl.innerHTML = '';
                
                const trendClass = salesChange >= 0 ? 'trend-up' : 'trend-down';
                const trendIcon = salesChange >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
                
                salesTrendEl.innerHTML = `
                    <span class="trend-indicator ${trendClass}">
                        <i class="fas ${trendIcon} me-1"></i> ${Math.abs(salesChange).toFixed(1)}%
                    </span>
                `;
            }
            
            // Calculate profit margin change
            const last7DaysProfit = last7Days.reduce((sum, day) => sum + day.profit, 0);
            const previous7DaysProfit = previous7Days.reduce((sum, day) => sum + day.profit, 0);
            
            const last7DaysRevenue = last7Days.reduce((sum, day) => sum + day.revenue, 0);
            const previous7DaysRevenue = previous7Days.reduce((sum, day) => sum + day.revenue, 0);
            
            const last7DaysProfitMargin = last7DaysRevenue > 0 ? (last7DaysProfit / last7DaysRevenue) * 100 : 0;
            const previous7DaysProfitMargin = previous7DaysRevenue > 0 ? (previous7DaysProfit / previous7DaysRevenue) * 100 : 0;
            
            const profitMarginChange = previous7DaysProfitMargin > 0 
                ? ((last7DaysProfitMargin - previous7DaysProfitMargin) / previous7DaysProfitMargin) * 100 
                : 0;
            
            // Add trend indicator to profit margin
            const profitTrendEl = document.getElementById('profit-trend');
            if (profitTrendEl) {
                profitTrendEl.innerHTML = '';
                
                const trendClass = profitMarginChange >= 0 ? 'trend-up' : 'trend-down';
                const trendIcon = profitMarginChange >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
                
                profitTrendEl.innerHTML = `
                    <span class="trend-indicator ${trendClass}">
                        <i class="fas ${trendIcon} me-1"></i> ${Math.abs(profitMarginChange).toFixed(1)}%
                    </span>
                `;
            }
        }
    } catch (error) {
        console.error('Error updating metrics:', error);
    }
}

// Initialize sales trend chart
function initializeSalesTrendChart(salesData) {
    try {
        console.log('Initializing sales trend chart...');
    const ctx = document.getElementById('salesTrendChart').getContext('2d');
        
        // Ensure we have data
        if (!salesData || !Array.isArray(salesData) || salesData.length === 0) {
            console.warn('No sales data available for chart');
            // Display a message in the chart area
            renderNoDataMessage(ctx, 'No sales data available');
            return;
        }
    
    salesTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: salesData.map(day => day.date),
            datasets: [
                {
                    label: 'Revenue',
                    data: salesData.map(day => day.revenue),
                    borderColor: '#4cc9f0',
                    backgroundColor: 'rgba(76, 201, 240, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Profit',
                    data: salesData.map(day => day.profit),
                    borderColor: '#4361ee',
                    backgroundColor: 'rgba(67, 97, 238, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#fff'
                    }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += formatCurrency(context.parsed.y);
                                }
                                return label;
                            }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        callback: value => formatCurrency(value)
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
    } catch (error) {
        console.error('Error initializing sales trend chart:', error);
    }
}

// Initialize product distribution chart
function initializeProductDistributionChart(inventoryData) {
    try {
        console.log('Initializing product distribution chart...');
    const ctx = document.getElementById('productDistributionChart').getContext('2d');
        
        // Ensure we have data
        if (!inventoryData || !Array.isArray(inventoryData) || inventoryData.length === 0) {
            console.warn('No inventory data available for chart');
            // Display a message in the chart area
            renderNoDataMessage(ctx, 'No inventory data available');
            return;
        }
    
    // Group items by category
    const categories = inventoryData.reduce((acc, item) => {
            const category = item.category || 'Uncategorized';
            if (!acc[category]) {
                acc[category] = 0;
        }
            acc[category] += item.value;
        return acc;
    }, {});

        // Sort categories by value (highest first)
        const sortedCategories = Object.entries(categories)
            .sort((a, b) => b[1] - a[1])
            .reduce((obj, [key, value]) => {
                obj[key] = value;
                return obj;
            }, {});
        
        // Limit to top 5 categories for better visibility
        let topCategories = {};
        let otherValue = 0;
        
        Object.entries(sortedCategories).forEach(([category, value], index) => {
            if (index < 5) {
                topCategories[category] = value;
            } else {
                otherValue += value;
            }
        });
        
        // Add "Other" category if needed
        if (otherValue > 0) {
            topCategories['Other'] = otherValue;
        }
        
        // Generate colors
        const colors = [
                    '#4cc9f0',
                    '#4361ee',
                    '#3a0ca3',
                    '#7209b7',
            '#f72585',
            '#8338ec'
        ];

        productDistributionChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(topCategories),
                datasets: [{
                    data: Object.values(topCategories),
                    backgroundColor: colors,
                    borderWidth: 1,
                    borderColor: '#2d3748'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
                cutout: '70%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                            color: '#fff',
                            font: {
                                size: 12
                            },
                            padding: 15
                }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.formattedValue;
                                const allValues = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((context.raw / allValues) * 100);
                                return `${label}: ${formatCurrency(context.raw)} (${percentage}%)`;
                            }
                        }
                    }
                }
        }
    });
    } catch (error) {
        console.error('Error initializing product distribution chart:', error);
    }
}

// Initialize inventory health chart
function initializeInventoryHealthChart(inventoryData) {
    try {
        console.log('Initializing inventory health chart...');
    const ctx = document.getElementById('inventoryHealthChart').getContext('2d');
        
        // Ensure we have data
        if (!inventoryData || !Array.isArray(inventoryData) || inventoryData.length === 0) {
            console.warn('No inventory data available for chart');
            // Display a message in the chart area
            renderNoDataMessage(ctx, 'No inventory data available');
            return;
        }
    
    // Calculate inventory health metrics
        const lowStock = inventoryData.filter(item => item.isLowStock).length;
        const optimalStock = inventoryData.filter(item => item.isOptimalStock).length;
        const overStock = inventoryData.filter(item => item.isOverStock).length;
        
        // Calculate percentages for chart title
        const totalItems = inventoryData.length;
        const lowStockPercentage = totalItems > 0 ? Math.round((lowStock / totalItems) * 100) : 0;
        const optimalStockPercentage = totalItems > 0 ? Math.round((optimalStock / totalItems) * 100) : 0;
        const overStockPercentage = totalItems > 0 ? Math.round((overStock / totalItems) * 100) : 0;

    inventoryHealthChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Low Stock', 'Optimal', 'Over Stock'],
            datasets: [{
                data: [lowStock, optimalStock, overStock],
                backgroundColor: [
                    '#e94560',
                    '#4cc9f0',
                    '#4361ee'
                    ],
                    borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const percentage = [lowStockPercentage, optimalStockPercentage, overStockPercentage][context.dataIndex];
                                return `${value} items (${percentage}%)`;
                            }
                        }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
    } catch (error) {
        console.error('Error initializing inventory health chart:', error);
    }
}

// Generate smart recommendations
function generateRecommendations(salesData, inventoryData) {
    try {
        console.log('Generating recommendations...');
    const recommendationsList = document.getElementById('recommendations-list');
    recommendationsList.innerHTML = '';
        
        if (!inventoryData || inventoryData.length === 0) {
            addRecommendation(
                'No Inventory Data',
                'No inventory data is available for analysis. Please add inventory items to get recommendations.',
                'info'
            );
            return;
        }

    // Find low stock items
        const lowStockItems = inventoryData.filter(item => item.isLowStock);
    if (lowStockItems.length > 0) {
            // Get the most critical 3 items to highlight
            const criticalItems = lowStockItems
                .sort((a, b) => (a.quantity / a.minQuantity) - (b.quantity / b.minQuantity))
                .slice(0, 3);
                
            const criticalItemsText = criticalItems
                .map(item => item.displayName)
                .join(', ');
                
        addRecommendation(
            'Low Stock Alert',
                `Restock needed: ${lowStockItems.length} items are below minimum quantity. Most critical: ${criticalItemsText}.`,
            'warning'
        );
    }

    // Find overstocked items
        const overstockedItems = inventoryData.filter(item => item.isOverStock);
    if (overstockedItems.length > 0) {
            // Calculate total value tied up in overstocked items
            const overstockValue = overstockedItems.reduce((sum, item) => {
                const excessQuantity = item.quantity - (item.minQuantity * 3);
                return sum + (excessQuantity * item.price);
            }, 0);
            
            // Get top 3 overstocked items by excess value
            const topOverstockedItems = overstockedItems
                .sort((a, b) => {
                    const excessA = a.quantity - (a.minQuantity * 3);
                    const excessB = b.quantity - (b.minQuantity * 3);
                    return (excessB * b.price) - (excessA * a.price);
                })
                .slice(0, 3);
                
            const overstockedItemsText = topOverstockedItems
                .map(item => item.displayName)
                .join(', ');
            
        addRecommendation(
            'Overstock Alert',
                `${overstockedItems.length} items are overstocked with approximately ${formatCurrency(overstockValue)} tied up in excess inventory. Top overstocked items: ${overstockedItemsText}. Consider running a promotion.`,
            'info'
        );
    }

        // Find slow-moving items (high turnover rate means fast moving in our inverse calculation)
    const slowMovingItems = inventoryData.filter(item => item.turnover < 20);
    if (slowMovingItems.length > 0) {
            // Calculate value of slow-moving items
            const slowMovingValue = slowMovingItems.reduce((sum, item) => sum + item.value, 0);
            
            // Get top 3 slow-moving items by value
            const topSlowMovingItems = slowMovingItems
                .sort((a, b) => b.value - a.value)
                .slice(0, 3);
                
            const slowMovingItemsText = topSlowMovingItems
                .map(item => item.displayName)
                .join(', ');
            
        addRecommendation(
            'Slow Moving Items',
                `${slowMovingItems.length} items have low turnover with approximately ${formatCurrency(slowMovingValue)} in inventory value. Consider reviewing pricing or marketing strategy for: ${slowMovingItemsText}.`,
            'warning'
        );
    }

    // Analyze sales trends
        if (salesData.length >= 14) {
    const recentSales = salesData.slice(-7);
            const previousWeek = salesData.slice(-14, -7);
            
    const avgDailySales = recentSales.reduce((sum, day) => sum + day.revenue, 0) / recentSales.length;
    const prevAvgDailySales = previousWeek.reduce((sum, day) => sum + day.revenue, 0) / previousWeek.length;
    
            const percentChange = ((avgDailySales - prevAvgDailySales) / prevAvgDailySales) * 100;
            
            if (percentChange <= -10) {
        addRecommendation(
                    'Sales Decline',
                    `Recent sales are down by ${Math.abs(percentChange).toFixed(1)}% compared to the previous week. Consider promotional activities.`,
            'warning'
        );
            } else if (percentChange >= 20) {
                addRecommendation(
                    'Sales Growth',
                    `Sales are up by ${percentChange.toFixed(1)}%! Consider increasing inventory levels of top-selling products.`,
                    'success'
                );
            }
            
            // Analyze product category performance
            if (recentSales.length > 0 && previousWeek.length > 0) {
                // Group items by type/category to find distribution
                const categories = inventoryData.reduce((acc, item) => {
                    const category = item.itemType;
                    if (!acc[category]) acc[category] = {
                        value: 0,
                        items: []
                    };
                    acc[category].value += item.value;
                    acc[category].items.push(item);
                    return acc;
                }, {});
                
                // Find the category with the highest inventory value
                const topCategory = Object.entries(categories)
                    .sort((a, b) => b[1].value - a[1].value)[0];
                
                if (topCategory) {
                    const [categoryName, categoryData] = topCategory;
                    const categoryPercentage = Math.round((categoryData.value / inventoryData.reduce((sum, item) => sum + item.value, 0)) * 100);
                    
                    if (categoryPercentage > 50) {
                        // List some examples from this category
                        const exampleItems = categoryData.items
                            .sort((a, b) => b.value - a.value)
                            .slice(0, 3)
                            .map(item => item.displayName)
                            .join(', ');
                            
                        addRecommendation(
                            'Inventory Diversity',
                            `${categoryPercentage}% of your inventory value is in the "${categoryName}" category (e.g., ${exampleItems}). Consider diversifying your product range.`,
                            'info'
                        );
                    }
                }
            }
        } else if (salesData.length > 0) {
            // Not enough data for trend analysis
            addRecommendation(
                'More Data Needed',
                'Collect more sales data to enable accurate trend analysis and more detailed recommendations.',
                'info'
            );
        } else {
            // No sales data
            addRecommendation(
                'No Sales Data',
                'No sales data is available for analysis. Start recording sales to get recommendations based on sales performance.',
                'info'
            );
        }
    } catch (error) {
        console.error('Error generating recommendations:', error);
        addRecommendation(
            'Error Processing Data',
            'An error occurred while generating recommendations. Check console for details.',
            'error'
        );
    }
}

// Add a recommendation to the list
function addRecommendation(title, message, type) {
    const recommendationsList = document.getElementById('recommendations-list');
    const recommendation = document.createElement('div');
    recommendation.className = `recommendation-card ${type}`;
    recommendation.innerHTML = `
        <h6 class="mb-2">${title}</h6>
        <p class="mb-0">${message}</p>
    `;
    recommendationsList.appendChild(recommendation);
}

// Update charts for selected time range
async function updateChartsForTimeRange(days) {
    try {
        console.log(`Updating charts for time range: ${days} days`);
        showLoading();
        
        // Set a timeout to prevent infinite loading
        const TIMEOUT_MS = 3000; // 3 seconds timeout
        
        // Create timeout promises
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Data loading timed out')), TIMEOUT_MS);
        });
        
        // Fetch data with timeout
        let salesData, inventoryData;
        
        try {
            salesData = await Promise.race([fetchSalesData(days), timeoutPromise]);
        } catch (error) {
            console.warn('Error or timeout fetching sales data:', error.message);
            salesData = getMockSalesData();
        }
        
        try {
            // Create a new timeout promise for inventory data
            const inventoryTimeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Inventory data loading timed out')), TIMEOUT_MS);
            });
            
            inventoryData = await Promise.race([fetchInventoryData(), inventoryTimeoutPromise]);
        } catch (error) {
            console.warn('Error or timeout fetching inventory data:', error.message);
            inventoryData = getMockInventoryData();
        }
        
        // Update charts with new data
        updateSalesTrendChart(salesData);
        updateProductDistributionChart(inventoryData);
        updateInventoryHealthChart(inventoryData);
        
        console.log('Charts updated successfully');
    } catch (error) {
        console.error('Error updating charts:', error);
        showError('Failed to update charts');
    } finally {
        // Hide loading overlay after a small delay
        setTimeout(() => {
            hideLoading();
        }, 500);
    }
}

// Update sales trend chart with new data
function updateSalesTrendChart(salesData) {
    salesTrendChart.data.labels = salesData.map(day => day.date);
    salesTrendChart.data.datasets[0].data = salesData.map(day => day.revenue);
    salesTrendChart.data.datasets[1].data = salesData.map(day => day.profit);
    salesTrendChart.update();
}

// Update product distribution chart with new data
function updateProductDistributionChart(inventoryData) {
    const categories = inventoryData.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = 0;
        }
        acc[item.category] += item.value;
        return acc;
    }, {});

    productDistributionChart.data.labels = Object.keys(categories);
    productDistributionChart.data.datasets[0].data = Object.values(categories);
    productDistributionChart.update();
}

// Update inventory health chart with new data
function updateInventoryHealthChart(inventoryData) {
    const lowStock = inventoryData.filter(item => item.quantity < item.minQuantity).length;
    const optimalStock = inventoryData.filter(item => 
        item.quantity >= item.minQuantity && item.quantity <= item.maxQuantity
    ).length;
    const overStock = inventoryData.filter(item => item.quantity > item.maxQuantity).length;

    inventoryHealthChart.data.datasets[0].data = [lowStock, optimalStock, overStock];
    inventoryHealthChart.update();
}

// Format currency values
function formatCurrency(value) {
    return new Intl.NumberFormat('sw-TZ', {
        style: 'currency',
        currency: 'TZS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

// Show error message
function showError(message) {
    console.error('Error:', message);
    
    // Check if there's an error container already
    let errorContainer = document.getElementById('error-container');
    
    // If not, create one
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.id = 'error-container';
        errorContainer.className = 'alert alert-danger position-fixed top-0 start-50 translate-middle-x m-3';
        errorContainer.style.zIndex = '2000';
        errorContainer.style.maxWidth = '80%';
        errorContainer.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        
        // Add dismiss button
        errorContainer.innerHTML = `
            <button type="button" class="btn-close float-end" data-bs-dismiss="alert" aria-label="Close"></button>
            <div class="d-flex align-items-center">
                <i class="fas fa-exclamation-triangle text-danger me-2"></i>
                <span id="error-message"></span>
            </div>
        `;
        
        document.body.appendChild(errorContainer);
    } else {
        // Make sure it's visible
        errorContainer.style.display = 'block';
    }
    
    // Set error message
    document.getElementById('error-message').textContent = message;
    
    // Auto-dismiss after 10 seconds
    setTimeout(() => {
        if (errorContainer) {
            errorContainer.style.display = 'none';
        }
    }, 10000);
}

// Render a no-data message on the chart canvas
function renderNoDataMessage(ctx, message) {
    // Clear canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Set text properties
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '16px Poppins, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    
    // Draw message
    ctx.fillText(message, ctx.canvas.width / 2, ctx.canvas.height / 2);
}

// Show loading overlay
function showLoading() {
    console.log('Showing loading overlay...');
    
    // Check if loading overlay already exists
    let loadingOverlay = document.querySelector('.loading-overlay');
    
    // If not, create it
    if (!loadingOverlay) {
        loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="mt-3 text-white">Loading data...</div>
        `;
        document.body.appendChild(loadingOverlay);
    } else {
        // Make sure it's visible
        loadingOverlay.style.display = 'flex';
    }
}

// Hide loading overlay
function hideLoading() {
    console.log('Hiding loading overlay...');
    
    // Find loading overlay
    const loadingOverlay = document.querySelector('.loading-overlay');
    
    // If it exists, hide it
    if (loadingOverlay) {
        // Add fade-out effect
        loadingOverlay.style.opacity = '0';
        
        // Remove after animation
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
            loadingOverlay.style.opacity = '1';
        }, 300);
    }
}

// Add event listener to initialize analytics when the page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM content loaded, initializing analytics...');
    initializeAnalytics();
}); 

/**
 * Set up event listeners for export buttons
 */
function setupExportButtons() {
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    const exportPrintBtn = document.getElementById('export-print-btn');
    
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', exportAnalyticsPDF);
    }
    
    if (exportPrintBtn) {
        exportPrintBtn.addEventListener('click', printAnalytics);
    }
}

/**
 * Export analytics data as PDF
 */
async function exportAnalyticsPDF() {
    try {
        // Show loading indicator
        showLoading();
        
        // Get current time range
        const timeRangeElement = document.getElementById('time-range');
        const timeRange = timeRangeElement ? timeRangeElement.value : '30';
        
        // Prepare analytics data for PDF
        const analyticsData = prepareAnalyticsDataForExport();
        
        // Add time range to options
        const options = {
            title: `Analytics Report - Last ${timeRange} Days`,
            timeRange: parseInt(timeRange)
        };
        
        // Check if we have access to the Electron API
        if (window.electronAPI && typeof window.electronAPI.invoke === 'function') {
            // Call the main process to generate PDF
            const result = await window.electronAPI.invoke('generate-analytics-report', analyticsData, options);
            
            if (result.success) {
                console.log('PDF generated successfully at:', result.filePath);
                showNotification('Success', `Analytics report exported successfully.`, 'success');
            } else {
                console.error('Error generating PDF:', result.error);
                showNotification('Error', `Failed to export report: ${result.error}`, 'error');
            }
        } else {
            console.error('Electron API not available for PDF generation');
            showNotification('Error', 'PDF export is not available in this environment.', 'error');
        }
    } catch (error) {
        console.error('Error exporting PDF:', error);
        showNotification('Error', `Failed to export report: ${error.message}`, 'error');
    } finally {
        // Hide loading indicator
        hideLoading();
    }
}

/**
 * Print analytics dashboard
 */
function printAnalytics() {
    try {
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        
        if (!printWindow) {
            showNotification('Error', 'Unable to open print window. Please check your popup settings.', 'error');
            return;
        }
        
        // Get current time range
        const timeRangeElement = document.getElementById('time-range');
        const timeRange = timeRangeElement ? timeRangeElement.value : '30';
        
        // Get company name from settings
        const settings = window.localStorage.getItem('pipe_inventory_settings');
        const companyName = settings ? JSON.parse(settings).companyName || 'Eliva Hardware' : 'Eliva Hardware';
        
        // Prepare analytics data
        const analyticsData = prepareAnalyticsDataForExport();
        
        // Create print-friendly HTML
        const printContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Analytics Report - ${companyName}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        margin: 0;
                        padding: 20px;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                        padding-bottom: 20px;
                        border-bottom: 2px solid #4361ee;
                    }
                    h1 {
                        color: #2b2d42;
                        margin-bottom: 5px;
                    }
                    .subtitle {
                        color: #666;
                        font-size: 16px;
                        margin-top: 0;
                    }
                    .date {
                        font-style: italic;
                        color: #777;
                        font-size: 14px;
                    }
                    .metrics-container {
                        display: flex;
                        justify-content: space-between;
                        flex-wrap: wrap;
                        margin-bottom: 30px;
                    }
                    .metric-card {
                        width: 22%;
                        padding: 15px;
                        border: 1px solid #ddd;
                        border-radius: 8px;
                        text-align: center;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                    }
                    .metric-value {
                        font-size: 24px;
                        font-weight: bold;
                        color: #4361ee;
                        margin: 10px 0;
                    }
                    .metric-label {
                        font-size: 14px;
                        color: #666;
                    }
                    .section {
                        margin-bottom: 30px;
                    }
                    .section-title {
                        color: #2b2d42;
                        border-bottom: 1px solid #eee;
                        padding-bottom: 10px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                    }
                    th {
                        background-color: #4361ee;
                        color: white;
                        padding: 10px;
                        text-align: left;
                    }
                    td {
                        padding: 10px;
                        border-bottom: 1px solid #eee;
                    }
                    tr:nth-child(even) {
                        background-color: #f9f9f9;
                    }
                    .footer {
                        margin-top: 50px;
                        text-align: center;
                        font-size: 12px;
                        color: #777;
                        border-top: 1px solid #eee;
                        padding-top: 20px;
                    }
                    @media print {
                        body {
                            padding: 0;
                            margin: 0;
                        }
                        .no-print {
                            display: none;
                        }
                        .page-break {
                            page-break-before: always;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${companyName}</h1>
                    <p class="subtitle">Analytics Report - Last ${timeRange} Days</p>
                    <p class="date">Generated on ${new Date().toLocaleString()}</p>
                </div>
                
                <div class="section">
                    <h2 class="section-title">Key Performance Metrics</h2>
                    <div class="metrics-container">
                        <div class="metric-card">
                            <div class="metric-label">Total Revenue</div>
                            <div class="metric-value">TZsh ${formatCurrency(analyticsData.totalRevenue || 0)}</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-label">Profit Margin</div>
                            <div class="metric-value">${(analyticsData.profitMargin || 0).toFixed(1)}%</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-label">Inventory Value</div>
                            <div class="metric-value">TZsh ${formatCurrency(analyticsData.inventoryValue || 0)}</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-label">Turnover Rate</div>
                            <div class="metric-value">${(analyticsData.turnoverRate || 0).toFixed(1)}</div>
                        </div>
                    </div>
                </div>
                
                <div class="section">
                    <h2 class="section-title">Sales Trend</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Period</th>
                                <th>Sales Amount</th>
                                <th>% Change</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${generateSalesTrendRows(analyticsData.salesTrend)}
                        </tbody>
                    </table>
                </div>
                
                <div class="section">
                    <h2 class="section-title">Product Distribution</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Category</th>
                                <th>Quantity</th>
                                <th>Value</th>
                                <th>% of Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${generateProductDistributionRows(analyticsData.productDistribution)}
                        </tbody>
                    </table>
                </div>
                
                ${analyticsData.recommendations && analyticsData.recommendations.length > 0 ? `
                <div class="section">
                    <h2 class="section-title">Smart Recommendations</h2>
                    ${generateRecommendationsHtml(analyticsData.recommendations)}
                </div>
                ` : ''}
                
                <div class="footer">
                    <p>© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
                </div>
                
                <div class="no-print" style="text-align: center; margin-top: 30px;">
                    <button onclick="window.print()" style="padding: 10px 20px; background: #4361ee; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Print Report
                    </button>
                </div>
            </body>
            </html>
        `;
        
        // Write content to the print window
        printWindow.document.open();
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // Wait for content to load before triggering print
        printWindow.onload = function() {
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
            }, 500);
        };
    } catch (error) {
        console.error('Error printing analytics:', error);
        showNotification('Error', `Failed to print report: ${error.message}`, 'error');
    }
}

/**
 * Prepare analytics data for export
 * @returns {Object} Formatted analytics data
 */
function prepareAnalyticsDataForExport() {
    // Get metrics from UI
    const totalRevenue = document.getElementById('total-revenue').textContent.replace(/[^0-9.]/g, '');
    const profitMargin = document.getElementById('profit-margin').textContent.replace(/[^0-9.]/g, '');
    const inventoryValue = document.getElementById('inventory-value').textContent.replace(/[^0-9.]/g, '');
    const turnoverRate = document.getElementById('turnover-rate').textContent.replace(/[^0-9.]/g, '');
    
    // Get chart data
    const salesTrendData = salesTrendChart ? {
        labels: salesTrendChart.data.labels,
        data: salesTrendChart.data.datasets[0].data
    } : null;
    
    const productDistributionData = productDistributionChart ? {
        labels: productDistributionChart.data.labels,
        data: productDistributionChart.data.datasets[0].data,
        quantities: currentAnalyticsData.inventoryData ? 
            currentAnalyticsData.inventoryData.map(item => item.quantity) : []
    } : null;
    
    // Get recommendations
    const recommendationsContainer = document.getElementById('recommendations-list');
    const recommendations = [];
    
    if (recommendationsContainer) {
        const recommendationElements = recommendationsContainer.querySelectorAll('.recommendation-card');
        recommendationElements.forEach(element => {
            const title = element.querySelector('.recommendation-title')?.textContent || '';
            const message = element.querySelector('.recommendation-message')?.textContent || '';
            const typeClass = element.classList.contains('warning') ? 'warning' : 
                             element.classList.contains('success') ? 'success' : 'info';
            
            recommendations.push({
                title,
                message,
                type: typeClass
            });
        });
    }
    
    return {
        totalRevenue: parseFloat(totalRevenue) || 0,
        profitMargin: parseFloat(profitMargin) || 0,
        inventoryValue: parseFloat(inventoryValue) || 0,
        turnoverRate: parseFloat(turnoverRate) || 0,
        salesTrend: salesTrendData,
        productDistribution: productDistributionData,
        recommendations
    };
}

/**
 * Generate HTML rows for sales trend table
 * @param {Object} salesTrend - Sales trend data
 * @returns {string} HTML content
 */
function generateSalesTrendRows(salesTrend) {
    if (!salesTrend || !salesTrend.labels || !salesTrend.data) {
        return '<tr><td colspan="3">No sales data available</td></tr>';
    }
    
    let rows = '';
    let prevValue = null;
    
    salesTrend.labels.forEach((label, index) => {
        const value = salesTrend.data[index] || 0;
        
        // Calculate percent change
        let percentChange = 0;
        let changeText = '—';
        let changeColor = '#666';
        
        if (prevValue !== null && prevValue !== 0) {
            percentChange = ((value - prevValue) / prevValue) * 100;
            changeText = percentChange > 0 ? `+${percentChange.toFixed(1)}%` : `${percentChange.toFixed(1)}%`;
            changeColor = percentChange > 0 ? '#4cc9f0' : '#f72585';
        }
        
        rows += `
            <tr>
                <td>${label}</td>
                <td>TZsh ${formatCurrency(value)}</td>
                <td style="color: ${changeColor};">${changeText}</td>
            </tr>
        `;
        
        prevValue = value;
    });
    
    return rows;
}

/**
 * Generate HTML rows for product distribution table
 * @param {Object} productDistribution - Product distribution data
 * @returns {string} HTML content
 */
function generateProductDistributionRows(productDistribution) {
    if (!productDistribution || !productDistribution.labels || !productDistribution.data) {
        return '<tr><td colspan="4">No product data available</td></tr>';
    }
    
    let rows = '';
    let totalValue = productDistribution.data.reduce((sum, val) => sum + val, 0);
    
    productDistribution.labels.forEach((label, index) => {
        const value = productDistribution.data[index] || 0;
        const quantity = productDistribution.quantities ? 
                        productDistribution.quantities[index] : '—';
        
        // Calculate percent of total
        const percentOfTotal = totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : '0.0';
        
        rows += `
            <tr>
                <td>${label}</td>
                <td>${quantity}</td>
                <td>TZsh ${formatCurrency(value)}</td>
                <td>${percentOfTotal}%</td>
            </tr>
        `;
    });
    
    return rows;
}

/**
 * Generate HTML for recommendations
 * @param {Array} recommendations - Recommendations data
 * @returns {string} HTML content
 */
function generateRecommendationsHtml(recommendations) {
    if (!recommendations || recommendations.length === 0) {
        return '<p>No recommendations available</p>';
    }
    
    let html = '';
    
    recommendations.forEach(rec => {
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
        
        html += `
            <div style="margin-bottom: 15px; padding: 15px; border-left: 4px solid ${borderColor}; background-color: #f9f9f9;">
                <h3 style="margin-top: 0; color: #2b2d42;">${rec.title}</h3>
                <p style="margin-bottom: 0;">${rec.message}</p>
            </div>
        `;
    });
    
    return html;
}

/**
 * Show notification to user
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, warning, info)
 */
function showNotification(title, message, type = 'info') {
    // Check if we have access to the Electron API
    if (window.electronAPI && typeof window.electronAPI.invoke === 'function') {
        window.electronAPI.invoke('show-notification', {
            title,
            body: message,
            type
        });
    } else {
        // Fallback to alert for environments without notification support
        alert(`${title}: ${message}`);
    }
} 