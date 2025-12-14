import { useState } from 'react';
import Layout from '../components/Layout';
import { useDatabase } from '../contexts/DatabaseContext';
import { useSettings } from '../contexts/SettingsContext';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import ProductTypeDropdown from '../components/ProductTypeDropdown';

export default function Inventory() {
  const { inventory, loadingStatus, addInventoryItem } = useDatabase();
  const { settings } = useSettings();
  
  // State for search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [customType, setCustomType] = useState('');
  
  // State for new item form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    type: '',
    quantity: 0,
    price: 0,
    cost: 0,
    supplier: '',
    description: ''
  });
  
  // Filter inventory based on search and filters
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesCategory = selectedCategory === '' || item.category === selectedCategory;
    const matchesType = selectedType === '' || item.type === selectedType || 
      (selectedType === 'custom' && item.type === customType);
      
    return matchesSearch && matchesCategory && matchesType;
  });
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewItem(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'price' || name === 'cost' 
        ? parseFloat(value) || 0 
        : value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Use the actual type or custom type
      const itemType = selectedType === 'custom' ? customType : selectedType;
      
      await addInventoryItem({
        ...newItem,
        category: selectedCategory,
        type: itemType,
        lastUpdated: new Date().toISOString()
      });
      
      // Reset form
      setNewItem({
        name: '',
        category: '',
        type: '',
        quantity: 0,
        price: 0,
        cost: 0,
        supplier: '',
        description: ''
      });
      
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };
  
  return (
    <Layout title="Inventory">
      <div className="space-y-6">
        {/* Search and Filter */}
        <div className="card">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search inventory..."
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
              Add Item
            </button>
          </div>
          
          <div className="mt-4">
            <ProductTypeDropdown
              selectedCategory={selectedCategory}
              selectedType={selectedType}
              onCategoryChange={setSelectedCategory}
              onTypeChange={setSelectedType}
              onCustomTypeChange={setCustomType}
            />
          </div>
        </div>
        
        {/* Add Item Form */}
        {showAddForm && (
          <div className="card animate-fadeIn">
            <h2 className="text-lg font-medium mb-4">Add New Inventory Item</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    Product Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="form-input"
                    value={newItem.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="supplier" className="form-label">
                    Supplier
                  </label>
                  <input
                    type="text"
                    id="supplier"
                    name="supplier"
                    className="form-input"
                    value={newItem.supplier}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="quantity" className="form-label">
                    Quantity
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    className="form-input"
                    value={newItem.quantity}
                    onChange={handleInputChange}
                    min="0"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="cost" className="form-label">
                    Cost Price ({settings.currency})
                  </label>
                  <input
                    type="number"
                    id="cost"
                    name="cost"
                    className="form-input"
                    value={newItem.cost}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="price" className="form-label">
                    Selling Price ({settings.currency})
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    className="form-input"
                    value={newItem.price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                
                <div className="form-group md:col-span-2">
                  <label htmlFor="description" className="form-label">
                    Description
                  </label>
                  <input
                    type="text"
                    id="description"
                    name="description"
                    className="form-input"
                    value={newItem.description}
                    onChange={handleInputChange}
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
                  Save Item
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Inventory List */}
        <div className="card">
          <h2 className="text-lg font-medium mb-4">Inventory Items</h2>
          
          {loadingStatus.inventory ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-pulse text-primary">Loading inventory...</div>
            </div>
          ) : filteredInventory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="table-header text-left">Name</th>
                    <th className="table-header text-left">Category</th>
                    <th className="table-header text-left">Type</th>
                    <th className="table-header text-right">Quantity</th>
                    <th className="table-header text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInventory.map(item => (
                    <tr key={item.id} className="table-row">
                      <td className="table-cell font-medium">{item.name}</td>
                      <td className="table-cell">{item.category}</td>
                      <td className="table-cell">{item.type}</td>
                      <td className="table-cell text-right">
                        <span className={item.quantity <= settings.lowStockThreshold ? 'text-red-600 font-bold' : ''}>
                          {item.quantity}
                        </span>
                      </td>
                      <td className="table-cell text-right">
                        {settings.currency} {item.price.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              {searchTerm || selectedCategory || selectedType ? 
                'No items match your search criteria.' : 
                'No inventory items found. Add some items to get started.'}
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
} 