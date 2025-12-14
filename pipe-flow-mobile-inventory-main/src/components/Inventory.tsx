
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, List } from 'lucide-react';
import ProductForm from './ProductForm';

const Inventory = () => {
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    'Pipes & Plumbing',
    'Paint & Accessories',
    'Building Materials',
    'Electrical Supplies',
    'Hardware & Fasteners',
    'Tools & Equipment',
    'Roofing Materials',
    'Flooring Materials',
    'Lighting Fixtures',
    'Bath & Kitchen',
    'Custom Products'
  ];

  const products = [
    {
      id: 1,
      name: 'PVC Pipe 2" x 10ft',
      category: 'Pipes & Plumbing',
      stock: 45,
      price: 12.99,
      status: 'In Stock'
    },
    {
      id: 2,
      name: 'Paint Brush Set',
      category: 'Paint & Accessories',
      stock: 8,
      price: 24.99,
      status: 'Low Stock'
    },
    {
      id: 3,
      name: 'Copper Elbow 90°',
      category: 'Pipes & Plumbing',
      stock: 2,
      price: 8.50,
      status: 'Critical'
    },
    {
      id: 4,
      name: 'Electrical Wire 14AWG',
      category: 'Electrical Supplies',
      stock: 120,
      price: 45.00,
      status: 'In Stock'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock':
        return 'status-success';
      case 'Low Stock':
        return 'status-warning';
      case 'Critical':
        return 'status-error';
      default:
        return 'text-gray-600 bg-gray-100 px-3 py-1 rounded-full text-xs font-medium';
    }
  };

  const getStockLevelBar = (stock: number, status: string) => {
    const percentage = Math.min((stock / 100) * 100, 100);
    const colorClass = status === 'In Stock' ? 'bg-green-500' : 
                      status === 'Low Stock' ? 'bg-orange-500' : 'bg-red-500';
    
    return (
      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${colorClass}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    );
  };

  if (showAddProduct) {
    return <ProductForm onBack={() => setShowAddProduct(false)} />;
  }

  return (
    <div className="space-y-6 fade-in mobile-optimized">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Inventory</h2>
        <Button 
          className="pipe-button"
          onClick={() => setShowAddProduct(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Search and Filter */}
      <Card className="pipe-card">
        <CardContent className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pipe-input pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="pipe-select">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-border rounded-lg shadow-lg z-50">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category} className="hover:bg-muted/50">
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Product List */}
      <div className="space-y-4">
        {products.map((product, index) => (
          <Card key={product.id} className="pipe-card slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">{product.category}</p>
                </div>
                <span className={`${getStatusColor(product.status)}`}>
                  {product.status}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-muted-foreground text-sm">Stock Level</p>
                  <p className="font-semibold text-lg">{product.stock} units</p>
                  {getStockLevelBar(product.stock, product.status)}
                </div>
                <div>
                  <p className="text-muted-foreground text-sm">Price</p>
                  <p className="font-semibold text-lg text-primary">${product.price}</p>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1 hover:bg-primary/5 transition-colors duration-300">
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="flex-1 hover:bg-primary/5 transition-colors duration-300">
                  Update Stock
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Card */}
      <Card className="pipe-card-dark fade-in" style={{ animationDelay: '0.6s' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <List className="h-5 w-5" />
            Inventory Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-white">1,248</p>
              <p className="text-sm opacity-90 text-white">Total Products</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-orange-400">23</p>
              <p className="text-sm opacity-90 text-white">Low Stock</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Inventory;
