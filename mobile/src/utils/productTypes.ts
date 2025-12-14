// Define product types organized by category
export const productTypes = {
  'Pipes': ['PVC Pipe', 'HDPE Pipe', 'Steel Pipe', 'Copper Pipe', 'PPR Pipe', 'UPVC Pipe', 'GI Pipe', 'Pipe Fittings', 'Pipe Valves'],
  'Paint': ['Emulsion Paint', 'Enamel Paint', 'Primer', 'Varnish', 'Wood Stain', 'Spray Paint', 'Textured Paint', 'Ceiling Paint'],
  'Building': ['Cement', 'Sand', 'Gravel', 'Bricks', 'Blocks', 'Concrete', 'Reinforcement', 'Wood', 'Plywood', 'Gypsum'],
  'Electrical': ['Cables', 'Switches', 'Sockets', 'Circuit Breakers', 'Distribution Boards', 'Conduits', 'Electrical Boxes'],
  'Hardware': ['Nails', 'Screws', 'Bolts', 'Nuts', 'Washers', 'Hinges', 'Locks', 'Handles', 'Brackets', 'Chains'],
  'Tools': ['Hand Tools', 'Power Tools', 'Measuring Tools', 'Cutting Tools', 'Drilling Tools', 'Safety Equipment'],
  'Roofing': ['Metal Sheets', 'Roof Tiles', 'Roof Panels', 'Waterproofing', 'Gutters', 'Roof Fasteners'],
  'Flooring': ['Tiles', 'Wooden Flooring', 'Laminate Flooring', 'Vinyl Flooring', 'Carpet', 'Floor Adhesives'],
  'Lighting': ['Bulbs', 'LED Lights', 'Tubes', 'Lamps', 'Fixtures', 'Emergency Lights', 'Decorative Lights'],
  'Bath': ['Taps', 'Showers', 'Basins', 'Toilets', 'Bathtubs', 'Bathroom Accessories', 'Kitchen Sinks', 'Faucets']
};

// Get all product categories
export const getProductCategories = (): string[] => {
  return Object.keys(productTypes);
};

// Get product types for a specific category
export const getProductTypesByCategory = (category: string): string[] => {
  return productTypes[category as keyof typeof productTypes] || [];
};

// Get all product types as a flat array
export const getAllProductTypes = (): string[] => {
  return Object.values(productTypes).flat();
};

// Check if a product type exists in any category
export const isValidProductType = (type: string): boolean => {
  return getAllProductTypes().includes(type);
};

// Find the category for a given product type
export const getCategoryForProductType = (type: string): string | null => {
  for (const [category, types] of Object.entries(productTypes)) {
    if (types.includes(type)) {
      return category;
    }
  }
  return null;
}; 