import { useState } from 'react';
import Layout from '../components/Layout';
import { useDatabase } from '../contexts/DatabaseContext';
import { useSettings } from '../contexts/SettingsContext';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import type { InventoryItem, Sale } from '../contexts/DatabaseContext';

export default function Reports() {
  const { inventory, sales } = useDatabase();
  const { settings } = useSettings();
  
  // Report type and date range
  const [reportType, setReportType] = useState<'sales' | 'inventory'>('sales');
  const [dateRange, setDateRange] = useState('today');
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  
  // Generate filtered data based on report type and date range
  const getFilteredData = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    
    const lastMonthStart = new Date(today);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    
    const start = dateRange === 'custom' 
      ? new Date(startDate) 
      : dateRange === 'yesterday'
        ? yesterday
        : dateRange === 'last7days'
          ? lastWeekStart
          : dateRange === 'last30days'
            ? lastMonthStart
            : today;
    
    const end = dateRange === 'custom'
      ? new Date(endDate)
      : dateRange === 'yesterday'
        ? new Date(yesterday.getTime() + 86400000 - 1)
        : today;
    
    // Set time to end of day for end date
    if (dateRange === 'custom') {
      end.setHours(23, 59, 59, 999);
    }
    
    if (reportType === 'sales') {
      return sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= start && saleDate <= end;
      });
    } else {
      return inventory;
    }
  };
  
  const filteredData = getFilteredData();
  
  // Calculate summary statistics
  const calculateSummary = () => {
    if (reportType === 'sales') {
      const salesData = filteredData as Sale[];
      const totalSales = salesData.reduce((sum, sale) => sum + sale.total, 0);
      const totalItems = salesData.reduce((sum, sale) => 
        sum + sale.items.reduce((itemSum: number, item) => itemSum + item.quantity, 0), 0);
      const averageSale = salesData.length > 0 ? totalSales / salesData.length : 0;
      
      return {
        totalSales,
        totalTransactions: salesData.length,
        totalItems,
        averageSale
      };
    } else {
      const inventoryData = filteredData as InventoryItem[];
      const totalItems = inventoryData.length;
      const totalValue = inventoryData.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const totalCost = inventoryData.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
      const lowStockItems = inventoryData.filter(item => item.quantity <= settings.lowStockThreshold).length;
      
      return {
        totalItems,
        totalValue,
        totalCost,
        lowStockItems
      };
    }
  };
  
  const summary = calculateSummary();
  
  // Generate report title
  const getReportTitle = () => {
    const type = reportType === 'sales' ? 'Sales' : 'Inventory';
    
    if (dateRange === 'today') {
      return `${type} Report - Today`;
    } else if (dateRange === 'yesterday') {
      return `${type} Report - Yesterday`;
    } else if (dateRange === 'last7days') {
      return `${type} Report - Last 7 Days`;
    } else if (dateRange === 'last30days') {
      return `${type} Report - Last 30 Days`;
    } else {
      return `${type} Report - ${startDate} to ${endDate}`;
    }
  };
  
  // Handle export (in a real app, this would generate a PDF or CSV)
  const handleExport = () => {
    alert('In a real app, this would export the report as PDF or CSV');
  };
  
  return (
    <Layout title="Reports">
      <div className="space-y-6">
        {/* Report Controls */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="form-group">
              <label htmlFor="reportType" className="form-label">
                Report Type
              </label>
              <select
                id="reportType"
                className="form-select"
                value={reportType}
                onChange={(e) => setReportType(e.target.value as 'sales' | 'inventory')}
              >
                <option value="sales">Sales Report</option>
                <option value="inventory">Inventory Report</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="dateRange" className="form-label">
                Date Range
              </label>
              <select
                id="dateRange"
                className="form-select"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last7days">Last 7 Days</option>
                <option value="last30days">Last 30 Days</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            
            {dateRange === 'custom' && (
              <>
                <div className="form-group">
                  <label htmlFor="startDate" className="form-label">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    className="form-input"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="endDate" className="form-label">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    className="form-input"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Report Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-medium">{getReportTitle()}</h2>
          
          <button
            className="btn btn-primary flex items-center"
            onClick={handleExport}
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-1" />
            Export Report
          </button>
        </div>
        
        {/* Report Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportType === 'sales' && (
            <>
              <div className="card bg-white flex flex-col items-center justify-center p-6">
                <h3 className="text-sm font-medium text-gray-500">Total Sales</h3>
                <p className="text-2xl font-semibold mt-2">
                  {settings.currency} {(summary as any).totalSales?.toFixed(2)}
                </p>
              </div>
              
              <div className="card bg-white flex flex-col items-center justify-center p-6">
                <h3 className="text-sm font-medium text-gray-500">Transactions</h3>
                <p className="text-2xl font-semibold mt-2">
                  {(summary as any).totalTransactions}
                </p>
              </div>
              
              <div className="card bg-white flex flex-col items-center justify-center p-6">
                <h3 className="text-sm font-medium text-gray-500">Items Sold</h3>
                <p className="text-2xl font-semibold mt-2">
                  {(summary as any).totalItems}
                </p>
              </div>
              
              <div className="card bg-white flex flex-col items-center justify-center p-6">
                <h3 className="text-sm font-medium text-gray-500">Average Sale</h3>
                <p className="text-2xl font-semibold mt-2">
                  {settings.currency} {(summary as any).averageSale?.toFixed(2)}
                </p>
              </div>
            </>
          )}
          
          {reportType === 'inventory' && (
            <>
              <div className="card bg-white flex flex-col items-center justify-center p-6">
                <h3 className="text-sm font-medium text-gray-500">Total Items</h3>
                <p className="text-2xl font-semibold mt-2">
                  {(summary as any).totalItems}
                </p>
              </div>
              
              <div className="card bg-white flex flex-col items-center justify-center p-6">
                <h3 className="text-sm font-medium text-gray-500">Total Value</h3>
                <p className="text-2xl font-semibold mt-2">
                  {settings.currency} {(summary as any).totalValue?.toFixed(2)}
                </p>
              </div>
              
              <div className="card bg-white flex flex-col items-center justify-center p-6">
                <h3 className="text-sm font-medium text-gray-500">Total Cost</h3>
                <p className="text-2xl font-semibold mt-2">
                  {settings.currency} {(summary as any).totalCost?.toFixed(2)}
                </p>
              </div>
              
              <div className="card bg-white flex flex-col items-center justify-center p-6">
                <h3 className="text-sm font-medium text-gray-500">Low Stock Items</h3>
                <p className="text-2xl font-semibold mt-2">
                  {(summary as any).lowStockItems}
                </p>
              </div>
            </>
          )}
        </div>
        
        {/* Report Data */}
        <div className="card">
          <h3 className="text-lg font-medium mb-4">Report Details</h3>
          
          {filteredData.length > 0 ? (
            <div className="overflow-x-auto">
              {reportType === 'sales' && (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="table-header text-left">Date</th>
                      <th className="table-header text-left">Customer</th>
                      <th className="table-header text-left">Items</th>
                      <th className="table-header text-right">Total</th>
                      <th className="table-header text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(filteredData as Sale[]).map(sale => (
                      <tr key={sale.id} className="table-row">
                        <td className="table-cell">
                          {new Date(sale.date).toLocaleDateString()}
                        </td>
                        <td className="table-cell">{sale.customer}</td>
                        <td className="table-cell">
                          {sale.items.reduce((sum: number, item) => sum + item.quantity, 0)}
                        </td>
                        <td className="table-cell text-right">
                          {settings.currency} {sale.total.toFixed(2)}
                        </td>
                        <td className="table-cell text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            sale.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {sale.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              
              {reportType === 'inventory' && (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="table-header text-left">Name</th>
                      <th className="table-header text-left">Category</th>
                      <th className="table-header text-right">Quantity</th>
                      <th className="table-header text-right">Price</th>
                      <th className="table-header text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(filteredData as InventoryItem[]).map(item => (
                      <tr key={item.id} className="table-row">
                        <td className="table-cell">{item.name}</td>
                        <td className="table-cell">{item.category}</td>
                        <td className="table-cell text-right">
                          <span className={item.quantity <= settings.lowStockThreshold ? 'text-red-600 font-bold' : ''}>
                            {item.quantity}
                          </span>
                        </td>
                        <td className="table-cell text-right">
                          {settings.currency} {item.price.toFixed(2)}
                        </td>
                        <td className="table-cell text-right">
                          {settings.currency} {(item.price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No data available for the selected report type and date range.
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
} 