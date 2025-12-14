/**
 * Test script to verify product type dropdown functionality
 * This script should be included in the inventory.html page for testing
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('Test script loaded');
  
  // Wait for the page to fully load
  setTimeout(() => {
    // Test the category dropdown change event
    const categorySelect = document.getElementById('item-category');
    const typeSelect = document.getElementById('item-type');
    
    if (!categorySelect || !typeSelect) {
      console.error('Category or type select elements not found');
      return;
    }
    
    console.log('Initial product type options:', typeSelect.options.length);
    
    // Access productTypes from the global scope
    const productTypes = window.productTypes || {
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
    
    // Test each category
    const categories = ['Pipes', 'Paint', 'Building', 'Electrical', 'Hardware', 'Tools', 'Roofing', 'Flooring', 'Lighting', 'Bath'];
    
    let testIndex = 0;
    
    function testNextCategory() {
      if (testIndex >= categories.length) {
        console.log('All category tests completed successfully!');
        return;
      }
      
      const category = categories[testIndex];
      console.log(`Testing category: ${category}`);
      
      // Select the category
      categorySelect.value = category;
      
      // Trigger the change event
      const event = new Event('change');
      categorySelect.dispatchEvent(event);
      
      // Check if product types were populated
      setTimeout(() => {
        console.log(`Category ${category} has ${typeSelect.options.length - 1} product types`);
        
        // Verify that product types match the expected types
        const expectedTypes = productTypes[category];
        if (!expectedTypes) {
          console.error(`No product types found for category: ${category}`);
        } else {
          console.log(`Expected ${expectedTypes.length} product types, found ${typeSelect.options.length - 1}`);
          
          // Check if all expected types are in the dropdown
          let allTypesFound = true;
          for (const type of expectedTypes) {
            let found = false;
            for (let i = 0; i < typeSelect.options.length; i++) {
              if (typeSelect.options[i].value === type) {
                found = true;
                break;
              }
            }
            if (!found) {
              console.error(`Product type "${type}" not found in dropdown for category ${category}`);
              allTypesFound = false;
            }
          }
          
          if (allTypesFound) {
            console.log(`All product types for category ${category} found in dropdown`);
          }
        }
        
        // Test next category
        testIndex++;
        setTimeout(testNextCategory, 500);
      }, 100);
    }
    
    // Start testing categories
    testNextCategory();
  }, 1000);
}); 