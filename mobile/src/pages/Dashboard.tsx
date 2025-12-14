import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useDatabase } from '../contexts/DatabaseContext';
import { useSettings } from '../contexts/SettingsContext';
import { 
  CubeIcon, 
  ShoppingCartIcon, 
  UsersIcon, 
  ExclamationCircleIcon 
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const { inventory, sales, customers, loadingStatus } = useDatabase();
  const { settings } = useSettings();
  const [isLoading, setIsLoading] = useState(true);
  const [lowStockItems, setLowStockItems] = useState<number>(0);

  // Calculate dashboard metrics
  useEffect(() => {
    if (!loadingStatus.inventory && !loadingStatus.sales && !loadingStatus.customers) {
      setIsLoading(false);
      
      // Count low stock items
      const lowItems = inventory.filter(item => item.quantity <= settings.lowStockThreshold).length;
      setLowStockItems(lowItems);
    }
  }, [inventory, sales, customers, loadingStatus, settings.lowStockThreshold]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Get recent sales
  const recentSales = sales
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <Layout title="Dashboard">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse text-primary">Loading dashboard data...</div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card bg-white flex items-center">
              <div className="rounded-full bg-blue-100 p-3 mr-4">
                <CubeIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Total Products</h3>
                <p className="text-2xl font-semibold">{inventory.length}</p>
              </div>
            </div>
            
            <div className="card bg-white flex items-center">
              <div className="rounded-full bg-green-100 p-3 mr-4">
                <ShoppingCartIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Total Sales</h3>
                <p className="text-2xl font-semibold">
                  {settings.currency} {sales.reduce((sum, sale) => sum + sale.total, 0).toFixed(2)}
                </p>
              </div>
            </div>
            
            <div className="card bg-white flex items-center">
              <div className="rounded-full bg-purple-100 p-3 mr-4">
                <UsersIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Customers</h3>
                <p className="text-2xl font-semibold">{customers.length}</p>
              </div>
            </div>
            
            <div className="card bg-white flex items-center">
              <div className="rounded-full bg-red-100 p-3 mr-4">
                <ExclamationCircleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Low Stock Items</h3>
                <p className="text-2xl font-semibold">{lowStockItems}</p>
              </div>
            </div>
          </div>
          
          {/* Recent Sales */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Recent Sales</h2>
              <Link to="/sales" className="text-primary hover:underline text-sm">
                View All
              </Link>
            </div>
            
            {recentSales.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="table-header text-left">Date</th>
                      <th className="table-header text-left">Customer</th>
                      <th className="table-header text-right">Total</th>
                      <th className="table-header text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentSales.map(sale => (
                      <tr key={sale.id} className="table-row">
                        <td className="table-cell">
                          {formatDate(sale.date)}
                        </td>
                        <td className="table-cell">{sale.customer}</td>
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
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No recent sales found</p>
            )}
          </div>
          
          {/* Low Stock Warning */}
          {lowStockItems > 0 && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 animate-fadeIn">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    You have {lowStockItems} items below the minimum stock threshold.
                    <Link to="/inventory" className="font-medium underline text-red-700 hover:text-red-600 ml-1">
                      View inventory
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Link to="/inventory" className="card bg-gradient-to-br from-primary to-accent2 text-white p-6 text-center hover:shadow-lg transition-shadow">
              <CubeIcon className="h-10 w-10 mx-auto mb-2" />
              <h3 className="text-lg font-medium">Manage Inventory</h3>
            </Link>
            
            <Link to="/sales" className="card bg-gradient-to-br from-dark to-secondary text-white p-6 text-center hover:shadow-lg transition-shadow">
              <ShoppingCartIcon className="h-10 w-10 mx-auto mb-2" />
              <h3 className="text-lg font-medium">Record Sale</h3>
            </Link>
          </div>
        </div>
      )}
    </Layout>
  );
} 