import { useState } from 'react';
import Layout from '../components/Layout';
import { useDatabase } from '../contexts/DatabaseContext';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function Customers() {
  const { customers, addCustomer } = useDatabase();
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  
  // New customer form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });
  
  // Filter customers based on search
  const filteredCustomers = customers.filter(customer => 
    searchTerm === '' || 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewCustomer(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await addCustomer({
        ...newCustomer,
        totalPurchases: 0
      });
      
      // Reset form
      setNewCustomer({
        name: '',
        phone: '',
        email: '',
        address: '',
        notes: ''
      });
      
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding customer:', error);
      alert('Error adding customer');
    }
  };
  
  return (
    <Layout title="Customers">
      <div className="space-y-6">
        {/* Search and Add */}
        <div className="card">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search customers..."
                className="form-input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <button
              className="btn btn-primary flex items-center justify-center"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <PlusIcon className="h-5 w-5 mr-1" />
              Add Customer
            </button>
          </div>
        </div>
        
        {/* Add Customer Form */}
        {showAddForm && (
          <div className="card animate-fadeIn">
            <h2 className="text-lg font-medium mb-4">Add New Customer</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="form-input"
                    value={newCustomer.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="phone" className="form-label">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className="form-input"
                    value={newCustomer.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-input"
                    value={newCustomer.email}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="address" className="form-label">
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    className="form-input"
                    value={newCustomer.address}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="form-group md:col-span-2">
                  <label htmlFor="notes" className="form-label">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    className="form-input"
                    value={newCustomer.notes}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  className="btn bg-gray-200 text-gray-800 hover:bg-gray-300"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Customers List */}
        <div className="card">
          <h2 className="text-lg font-medium mb-4">Customer Directory</h2>
          
          {filteredCustomers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="table-header text-left">Name</th>
                    <th className="table-header text-left">Phone</th>
                    <th className="table-header text-left">Email</th>
                    <th className="table-header text-right">Total Purchases</th>
                    <th className="table-header text-left">Last Purchase</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCustomers.map(customer => (
                    <tr key={customer.id} className="table-row">
                      <td className="table-cell font-medium">{customer.name}</td>
                      <td className="table-cell">{customer.phone}</td>
                      <td className="table-cell">{customer.email || '-'}</td>
                      <td className="table-cell text-right">
                        {customer.totalPurchases.toFixed(2)}
                      </td>
                      <td className="table-cell">
                        {customer.lastPurchase 
                          ? new Date(customer.lastPurchase).toLocaleDateString() 
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              {searchTerm ? 
                'No customers match your search criteria.' : 
                'No customers found. Add some customers to get started.'}
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
} 