import { useState } from 'react';
import Layout from '../components/Layout';
import { useDatabase } from '../contexts/DatabaseContext';
import { useSettings } from '../contexts/SettingsContext';

export default function Analytics() {
  const { inventory, sales } = useDatabase();
  const { settings } = useSettings();
  const [timeRange, setTimeRange] = useState('month');
  
  // Calculate some basic analytics
  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalInventoryValue = inventory.reduce(
    (sum, item) => sum + item.price * item.quantity, 
    0
  );
  const totalInventoryCost = inventory.reduce(
    (sum, item) => sum + item.cost * item.quantity, 
    0
  );
  const totalProfit = totalSales - totalInventoryCost;
  const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
  
  // Count sales by category
  const salesByCategory = sales.reduce((acc, sale) => {
    sale.items.forEach(item => {
      const product = inventory.find(p => p.id === item.productId);
      if (product) {
        const category = product.category;
        acc[category] = (acc[category] || 0) + item.total;
      }
    });
    return acc;
  }, {} as Record<string, number>);
  
  // Count inventory by category
  const inventoryByCategory = inventory.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + (item.price * item.quantity);
    return acc;
  }, {} as Record<string, number>);
  
  return (
    <Layout title="Analytics">
      <div className="space-y-6">
        {/* Time Range Selector */}
        <div className="card">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium">Analytics Dashboard</h2>
            
            <select
              className="form-select w-auto"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card bg-white p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Sales</h3>
            <p className="text-2xl font-semibold mt-2">
              {settings.currency} {totalSales.toFixed(2)}
            </p>
          </div>
          
          <div className="card bg-white p-6">
            <h3 className="text-sm font-medium text-gray-500">Inventory Value</h3>
            <p className="text-2xl font-semibold mt-2">
              {settings.currency} {totalInventoryValue.toFixed(2)}
            </p>
          </div>
          
          <div className="card bg-white p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Profit</h3>
            <p className="text-2xl font-semibold mt-2">
              {settings.currency} {totalProfit.toFixed(2)}
            </p>
          </div>
          
          <div className="card bg-white p-6">
            <h3 className="text-sm font-medium text-gray-500">Profit Margin</h3>
            <p className="text-2xl font-semibold mt-2">
              {profitMargin.toFixed(1)}%
            </p>
          </div>
        </div>
        
        {/* Charts Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-medium mb-4">Sales by Category</h3>
            <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-500 mb-2">Chart visualization will appear here</p>
                <p className="text-sm text-gray-400">
                  In the full implementation, this would show a pie chart of sales by category
                </p>
                
                {/* Display data as text for now */}
                <div className="mt-4 text-left">
                  {Object.entries(salesByCategory).map(([category, amount]) => (
                    <div key={category} className="flex justify-between mb-1">
                      <span>{category}:</span>
                      <span>{settings.currency} {amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-medium mb-4">Inventory Distribution</h3>
            <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-500 mb-2">Chart visualization will appear here</p>
                <p className="text-sm text-gray-400">
                  In the full implementation, this would show a pie chart of inventory value by category
                </p>
                
                {/* Display data as text for now */}
                <div className="mt-4 text-left">
                  {Object.entries(inventoryByCategory).map(([category, value]) => (
                    <div key={category} className="flex justify-between mb-1">
                      <span>{category}:</span>
                      <span>{settings.currency} {value.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Additional Analytics */}
        <div className="card">
          <h3 className="text-lg font-medium mb-4">Performance Metrics</h3>
          <p className="text-gray-500 mb-4">
            This section would contain more detailed analytics in the full implementation.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Top Selling Products</h4>
              <p className="text-sm text-gray-500">
                Would display a list of best-selling products
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Sales Trends</h4>
              <p className="text-sm text-gray-500">
                Would display sales trends over time
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Inventory Turnover</h4>
              <p className="text-sm text-gray-500">
                Would display inventory turnover rates
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 