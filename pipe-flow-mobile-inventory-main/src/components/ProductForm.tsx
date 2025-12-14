
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft } from 'lucide-react';

interface ProductFormProps {
  onBack: () => void;
}

const ProductForm = ({ onBack }: ProductFormProps) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [customType, setCustomType] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cost: '',
    stock: '',
    minStock: '',
    supplier: ''
  });

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
    'Bath & Kitchen'
  ];

  const productTypes = {
    'Pipes & Plumbing': ['PVC Pipe', 'Copper Pipe', 'Steel Pipe', 'Fittings', 'Valves', 'Custom Product'],
    'Paint & Accessories': ['Interior Paint', 'Exterior Paint', 'Brushes', 'Rollers', 'Primer', 'Custom Product'],
    'Building Materials': ['Lumber', 'Drywall', 'Insulation', 'Concrete', 'Bricks', 'Custom Product'],
    'Electrical Supplies': ['Wire', 'Conduit', 'Outlets', 'Switches', 'Breakers', 'Custom Product'],
    'Hardware & Fasteners': ['Screws', 'Nails', 'Bolts', 'Washers', 'Anchors', 'Custom Product'],
    'Tools & Equipment': ['Hand Tools', 'Power Tools', 'Measuring', 'Safety Equipment', 'Custom Product'],
    'Roofing Materials': ['Shingles', 'Flashing', 'Gutters', 'Underlayment', 'Custom Product'],
    'Flooring Materials': ['Hardwood', 'Tile', 'Carpet', 'Laminate', 'Vinyl', 'Custom Product'],
    'Lighting Fixtures': ['Indoor Lighting', 'Outdoor Lighting', 'Bulbs', 'Switches', 'Custom Product'],
    'Bath & Kitchen': ['Faucets', 'Sinks', 'Toilets', 'Cabinets', 'Countertops', 'Custom Product']
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Product data:', {
      ...formData,
      category: selectedCategory,
      type: selectedType === 'Custom Product' ? customType : selectedType
    });
    // Add product logic here
    onBack();
  };

  return (
    <div className="space-y-6 fade-in mobile-optimized">
      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBack} 
          className="p-2 hover:bg-muted/50 transition-colors duration-300"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-bold">Add New Product</h2>
      </div>

      <Card className="pipe-card">
        <CardHeader>
          <CardTitle className="font-semibold">Product Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category Selection */}
            <div className="space-y-2">
              <Label htmlFor="category" className="font-medium">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="pipe-select">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-border rounded-lg shadow-lg z-50">
                  {categories.map((category) => (
                    <SelectItem key={category} value={category} className="hover:bg-muted/50">
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Product Type Selection */}
            {selectedCategory && (
              <div className="space-y-2 scale-in">
                <Label htmlFor="type" className="font-medium">Product Type</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="pipe-select">
                    <SelectValue placeholder="Select product type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-border rounded-lg shadow-lg z-50">
                    {productTypes[selectedCategory as keyof typeof productTypes]?.map((type) => (
                      <SelectItem key={type} value={type} className="hover:bg-muted/50">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Custom Type Input */}
            {selectedType === 'Custom Product' && (
              <div className="space-y-2 scale-in">
                <Label htmlFor="customType" className="font-medium">Custom Product Type</Label>
                <Input
                  id="customType"
                  placeholder="Enter custom product type"
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  className="pipe-input"
                />
              </div>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-medium">Product Name</Label>
                <Input
                  id="name"
                  placeholder="Enter product name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pipe-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="font-medium">Description</Label>
                <Input
                  id="description"
                  placeholder="Enter product description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="pipe-input"
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cost" className="font-medium">Cost Price</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  className="pipe-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price" className="font-medium">Sale Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="pipe-input"
                />
              </div>
            </div>

            {/* Stock */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock" className="font-medium">Current Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  placeholder="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="pipe-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minStock" className="font-medium">Minimum Stock</Label>
                <Input
                  id="minStock"
                  type="number"
                  placeholder="0"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                  className="pipe-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier" className="font-medium">Supplier</Label>
              <Input
                id="supplier"
                placeholder="Enter supplier name"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                className="pipe-input"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onBack} 
                className="flex-1 hover:bg-muted/50 transition-colors duration-300"
              >
                Cancel
              </Button>
              <Button type="submit" className="pipe-button flex-1">
                Add Product
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductForm;
