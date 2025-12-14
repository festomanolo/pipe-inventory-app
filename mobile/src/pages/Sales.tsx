import { useState } from 'react';
import Layout from '../components/Layout';
import { useDatabase } from '../contexts/DatabaseContext';
import { useSettings } from '../contexts/SettingsContext';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function Sales() {
  const { inventory, sales, customers, addSale } = useDatabase();
  const { settings } = useSettings();
  
  // New sale state
  const [newSale, setNewSale] = useState({
    customer: '',
    paymentMethod: 'Cash',
    status: 'Completed',
    notes: ''
  });
  
  // Sale items state
  const [saleItems, setSaleItems] = useState<{
    productId: string;
    quantity: number;
  }[]>([]);
  
  // Selected product for adding
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  
  // Calculate total
  const calculateTotal = () => {
    return saleItems.reduce((total, item) => {
      const product = inventory.find(p => p.id === item.productId);
      return total + (product ? product.price * item.quantity : 0);
    }, 0);
  };
  
  // Add item to sale
  const addItemToSale = () => {
    if (!selectedProduct || selectedQuantity <= 0) return;
    
    const product = inventory.find(p => p.id === selectedProduct);
    if (!product) return;
    
    // Check if we already have this product in the sale
    const existingItemIndex = saleItems.findIndex(item => item.productId === selectedProduct);
    
    if (existingItemIndex >= 0) {
      // Update quantity
      const updatedItems = [...saleItems];
      updatedItems[existingItemIndex].quantity += selectedQuantity;
      setSaleItems(updatedItems);
    } else {
      // Add new item
      setSaleItems([...saleItems, {
        productId: selectedProduct,
        quantity: selectedQuantity
      }]);
    }
    
    // Reset selection
    setSelectedProduct('');
    setSelectedQuantity(1);
  };
  
  // Remove item from sale
  const removeItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewSale(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (saleItems.length === 0) {
      alert('Please add at least one item to the sale');
      return;
    }
    
    try {
      // Format sale items for database
      const formattedItems = saleItems.map(item => {
        const product = inventory.find(p => p.id === item.productId)!;
        return {
          productId: item.productId,
          productName: product.name,
          quantity: item.quantity,
          price: product.price,
          total: product.price * item.quantity
        };
      });
      
      // Create the sale
      await addSale({
        date: new Date().toISOString(),
        customer: newSale.customer,
        items: formattedItems,
        total: calculateTotal(),
        paymentMethod: newSale.paymentMethod,
        status: newSale.status,
        notes: newSale.notes
      });
      
      // Reset form
      setNewSale({
        customer: '',
        paymentMethod: 'Cash',
        status: 'Completed',
        notes: ''
      });
      setSaleItems([]);
      
      alert('Sale recorded successfully');
    } catch (error) {
      console.error('Error recording sale:', error);
      alert('Error recording sale');
    }
  };
  
  return (
    <Layout title="Sales">
      <div className="space-y-6">
        {/* New Sale Form */}
        <div className="card">
          <h2 className="text-lg font-medium mb-4">Record New Sale</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="customer" className="form-label">
                  Customer
                </label>
                <input
                  type="text"
                  id="customer"
                  name="customer"
                  className="form-input"
                  value={newSale.customer}
                  onChange={handleInputChange}
                  list="customer-list"
                  required
                />
                <datalist id="customer-list">
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.name} />
                  ))}
                </datalist>
              </div>
              
              <div className="form-group">
                <label htmlFor="paymentMethod" className="form-label">
                  Payment Method
                </label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  className="form-select"
                  value={newSale.paymentMethod}
                  onChange={handleInputChange}
                >
                  <option value="Cash">Cash</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Mobile Money">Mobile Money</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Credit">Credit (Pay Later)</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="status" className="form-label">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  className="form-select"
                  value={newSale.status}
                  onChange={handleInputChange}
                >
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              
              <div className="form-group md:col-span-2">
                <label htmlFor="notes" className="form-label">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  className="form-input"
                  value={newSale.notes}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>
            </div>
            
            {/* Add Items */}
            <div className="mt-6">
              <h3 className="text-md font-medium mb-3">Sale Items</h3>
              
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <select
                    className="form-select"
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                  >
                    <option value="">Select Product</option>
                    {inventory.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} - {settings.currency} {item.price.toFixed(2)} ({item.quantity} in stock)
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="w-24">
                  <input
                    type="number"
                    className="form-input"
                    value={selectedQuantity}
                    onChange={(e) => setSelectedQuantity(parseInt(e.target.value) || 0)}
                    min="1"
                  />
                </div>
                
                <div>
                  <button
                    type="button"
                    className="btn btn-primary flex items-center"
                    onClick={addItemToSale}
                    disabled={!selectedProduct}
                  >
                    <PlusIcon className="h-5 w-5 mr-1" />
                    Add
                  </button>
                </div>
              </div>
              
              {/* Items Table */}
              {saleItems.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="table-header text-left">Product</th>
                        <th className="table-header text-center">Quantity</th>
                        <th className="table-header text-right">Price</th>
                        <th className="table-header text-right">Total</th>
                        <th className="table-header text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {saleItems.map((item, index) => {
                        const product = inventory.find(p => p.id === item.productId);
                        if (!product) return null;
                        
                        return (
                          <tr key={index} className="table-row">
                            <td className="table-cell">{product.name}</td>
                            <td className="table-cell text-center">{item.quantity}</td>
                            <td className="table-cell text-right">
                              {settings.currency} {product.price.toFixed(2)}
                            </td>
                            <td className="table-cell text-right">
                              {settings.currency} {(product.price * item.quantity).toFixed(2)}
                            </td>
                            <td className="table-cell text-center">
                              <button
                                type="button"
                                className="text-red-600 hover:text-red-800"
                                onClick={() => removeItem(index)}
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="bg-gray-50 font-bold">
                        <td className="table-cell" colSpan={3}>
                          Total
                        </td>
                        <td className="table-cell text-right">
                          {settings.currency} {calculateTotal().toFixed(2)}
                        </td>
                        <td className="table-cell"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No items added to this sale yet
                </p>
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saleItems.length === 0}
              >
                Record Sale
              </button>
            </div>
          </form>
        </div>
        
        {/* Recent Sales */}
        <div className="card">
          <h2 className="text-lg font-medium mb-4">Recent Sales</h2>
          
          {sales.length > 0 ? (
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
                  {sales
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 5)
                    .map(sale => (
                      <tr key={sale.id} className="table-row">
                        <td className="table-cell">
                          {new Date(sale.date).toLocaleDateString()}
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
            <p className="text-gray-500 text-center py-4">
              No sales recorded yet
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
} 