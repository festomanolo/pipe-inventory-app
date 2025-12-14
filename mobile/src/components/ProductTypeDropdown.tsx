import { useState, useEffect } from 'react';
import { productTypes } from '../utils/productTypes';

interface ProductTypeDropdownProps {
  selectedCategory: string;
  selectedType: string;
  onCategoryChange: (category: string) => void;
  onTypeChange: (type: string) => void;
  onCustomTypeChange?: (customType: string) => void;
}

export default function ProductTypeDropdown({
  selectedCategory,
  selectedType,
  onCategoryChange,
  onTypeChange,
  onCustomTypeChange
}: ProductTypeDropdownProps) {
  const [showCustomType, setShowCustomType] = useState(false);
  const [customType, setCustomType] = useState('');

  // Update custom type visibility when category changes
  useEffect(() => {
    setShowCustomType(selectedCategory === 'Custom');
  }, [selectedCategory]);

  // Handle category change
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value;
    onCategoryChange(category);
    
    // Reset type when category changes
    if (category !== 'Custom') {
      const availableTypes = productTypes[category as keyof typeof productTypes] || [];
      if (availableTypes.length > 0) {
        onTypeChange(availableTypes[0]);
      } else {
        onTypeChange('');
      }
    } else {
      onTypeChange('custom');
    }
  };

  // Handle type change
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onTypeChange(e.target.value);
  };

  // Handle custom type change
  const handleCustomTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomType(value);
    if (onCustomTypeChange) {
      onCustomTypeChange(value);
    }
  };

  return (
    <div className="space-y-4">
      <div className="form-group">
        <label htmlFor="category" className="form-label">
          Product Category
        </label>
        <select
          id="category"
          className="form-select"
          value={selectedCategory}
          onChange={handleCategoryChange}
        >
          <option value="">Select Category</option>
          {Object.keys(productTypes).map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
          <option value="Custom">Custom Product</option>
        </select>
      </div>
      
      <div className="form-group">
        <label htmlFor="type" className="form-label">
          Product Type
        </label>
        <select
          id="type"
          className="form-select"
          value={selectedType}
          onChange={handleTypeChange}
          disabled={!selectedCategory}
        >
          <option value="">Select Product Type</option>
          {selectedCategory && selectedCategory !== 'Custom' && 
            productTypes[selectedCategory as keyof typeof productTypes]?.map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))
          }
          {selectedCategory === 'Custom' && (
            <option value="custom">Custom Type</option>
          )}
        </select>
        
        {showCustomType && (
          <div className="mt-2">
            <input
              type="text"
              id="custom-type"
              className="form-input"
              placeholder="Enter custom product type"
              value={customType}
              onChange={handleCustomTypeChange}
            />
          </div>
        )}
      </div>
    </div>
  );
} 