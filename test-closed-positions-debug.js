// Debug script to test closed positions functionality
// Run this in the browser console after connecting to MT5

console.log('🔍 Testing Closed Positions Feature');

// Check if the API method exists
if (typeof window.mt5API === 'undefined') {
  console.error('❌ window.mt5API is not defined!');
} else if (typeof window.mt5API.getClosedPositions === 'undefined') {
  console.error('❌ window.mt5API.getClosedPositions is not defined!');
  console.log('Available methods:', Object.keys(window.mt5API));
} else {
  console.log('✅ window.mt5API.getClosedPositions is available');
  
  // Test the method
  async function testClosedPositions() {
    try {
      console.log('🔄 Testing getClosedPositions...');
      const result = await window.mt5API.getClosedPositions(7);
      console.log('✅ Success:', result);
      
      if (result.success && result.data) {
        console.log(`📊 Found ${result.data.length} closed positions`);
        if (result.data.length > 0) {
          console.log('First position:', result.data[0]);
        }
      } else {
        console.log('❌ Error:', result.error);
      }
    } catch (error) {
      console.error('❌ Exception:', error);
    }
  }
  
  // Run the test
  testClosedPositions();
}

// Also test if the UI elements exist
console.log('🎨 Checking UI elements...');
const elements = [
  'closedPositionsTab',
  'closedPositionsList', 
  'closedPositionsDays',
  'refreshClosedPositionsBtn'
];

elements.forEach(id => {
  const element = document.getElementById(id);
  if (element) {
    console.log(`✅ Element ${id} exists`);
  } else {
    console.error(`❌ Element ${id} not found`);
  }
});

// Check if the tab switching function exists
if (typeof window.switchPositionsTab === 'function') {
  console.log('✅ switchPositionsTab function exists');
} else {
  console.error('❌ switchPositionsTab function not found');
}

console.log('🏁 Debug test complete');