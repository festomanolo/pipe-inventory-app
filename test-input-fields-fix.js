/**
 * Test script to verify input field functionality after report generation
 * Run this in the browser console on the reports page
 */

console.log('🧪 Starting input field functionality test...');

// Test function to check if input fields are working
function testInputFields() {
  console.log('🔍 Testing input field functionality...');
  
  const inputSelectors = [
    'input[type="text"]',
    'input[type="password"]',
    'input[type="email"]',
    'input[type="number"]',
    'input[type="search"]',
    'textarea',
    'select'
  ];
  
  let totalInputs = 0;
  let workingInputs = 0;
  let brokenInputs = [];
  
  inputSelectors.forEach(selector => {
    const inputs = document.querySelectorAll(selector);
    
    inputs.forEach(input => {
      if (input.id) {
        totalInputs++;
        
        // Test if input is functional
        const originalValue = input.value;
        const testValue = 'test_' + Date.now();
        
        try {
          input.value = testValue;
          const isWorking = input.value === testValue;
          input.value = originalValue; // Restore original value
          
          if (isWorking && !input.disabled && !input.readOnly) {
            workingInputs++;
            console.log(`✅ ${input.id} is working`);
          } else {
            brokenInputs.push({
              id: input.id,
              type: input.type,
              disabled: input.disabled,
              readOnly: input.readOnly,
              canSetValue: isWorking
            });
            console.log(`❌ ${input.id} is broken:`, {
              disabled: input.disabled,
              readOnly: input.readOnly,
              canSetValue: isWorking
            });
          }
        } catch (error) {
          brokenInputs.push({
            id: input.id,
            type: input.type,
            error: error.message
          });
          console.log(`❌ ${input.id} threw error:`, error.message);
        }
      }
    });
  });
  
  console.log(`📊 Test Results:`);
  console.log(`   Total inputs tested: ${totalInputs}`);
  console.log(`   Working inputs: ${workingInputs}`);
  console.log(`   Broken inputs: ${brokenInputs.length}`);
  
  if (brokenInputs.length > 0) {
    console.log(`❌ Broken inputs:`, brokenInputs);
  }
  
  return {
    total: totalInputs,
    working: workingInputs,
    broken: brokenInputs.length,
    brokenDetails: brokenInputs
  };
}

// Test report generation and input field recovery
async function testReportGenerationAndInputs() {
  console.log('🧪 Testing report generation and input field recovery...');
  
  // Test inputs before report generation
  console.log('📋 Testing inputs BEFORE report generation...');
  const beforeResults = testInputFields();
  
  // Simulate report generation
  console.log('📊 Simulating report generation...');
  
  // Emit operation start event
  document.dispatchEvent(new CustomEvent('operation-start', { 
    detail: { type: 'test-report-generation' } 
  }));
  
  // Wait for a few seconds to simulate processing
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Test inputs during operation
  console.log('📋 Testing inputs DURING operation...');
  const duringResults = testInputFields();
  
  // Emit operation end event
  document.dispatchEvent(new CustomEvent('operation-end', { 
    detail: { type: 'test-report-generation' } 
  }));
  
  // Wait for recovery
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test inputs after operation
  console.log('📋 Testing inputs AFTER operation...');
  const afterResults = testInputFields();
  
  console.log('📊 Complete Test Results:');
  console.log('   Before operation:', beforeResults);
  console.log('   During operation:', duringResults);
  console.log('   After operation:', afterResults);
  
  // Check if recovery worked
  const recoveryWorked = afterResults.working >= beforeResults.working;
  console.log(recoveryWorked ? '✅ Input field recovery SUCCESSFUL' : '❌ Input field recovery FAILED');
  
  return {
    before: beforeResults,
    during: duringResults,
    after: afterResults,
    recoveryWorked: recoveryWorked
  };
}

// Manual fix test
function testManualFix() {
  console.log('🔧 Testing manual input field fix...');
  
  if (window.WinLoginFix && window.WinLoginFix.emergencyInputRecovery) {
    window.WinLoginFix.emergencyInputRecovery();
    
    setTimeout(() => {
      const results = testInputFields();
      console.log('📊 Results after manual fix:', results);
    }, 500);
  } else {
    console.log('❌ WinLoginFix not available');
  }
}

// Export test functions to global scope
window.InputFieldTest = {
  testInputFields,
  testReportGenerationAndInputs,
  testManualFix
};

console.log('✅ Input field test functions loaded');
console.log('📋 Available functions:');
console.log('   InputFieldTest.testInputFields() - Test current input field status');
console.log('   InputFieldTest.testReportGenerationAndInputs() - Full test with simulated report generation');
console.log('   InputFieldTest.testManualFix() - Test manual fix function');