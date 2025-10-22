// Debug script to test the new hour period functionality
// Run this in the browser console after connecting to MT5

console.log('🕐 Testing Hour Period Feature for Closed Positions');

// Test the time label function
function getTimeLabel(daysBack) {
  if (daysBack < 1) {
    const hours = Math.round(daysBack * 24);
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else {
    return `${daysBack} day${daysBack > 1 ? 's' : ''}`;
  }
}

// Test various time periods
const testPeriods = [0.04, 0.08, 0.5, 1, 3, 7, 14, 30];
console.log('📊 Time Label Tests:');
testPeriods.forEach(period => {
  const label = getTimeLabel(period);
  console.log(`  ${period} days → "${label}"`);
});

// Check if the dropdown has the hour option
const dropdown = document.getElementById('closedPositionsDays');
if (dropdown) {
  console.log('✅ Dropdown found');
  const hourOption = Array.from(dropdown.options).find(option => option.value === '0.04');
  if (hourOption) {
    console.log('✅ Hour option (0.04) found in dropdown:', hourOption.text);
  } else {
    console.error('❌ Hour option not found in dropdown');
    console.log('Available options:', Array.from(dropdown.options).map(o => `${o.value}: ${o.text}`));
  }
} else {
  console.error('❌ Dropdown not found');
}

// Test the API if available
if (typeof window.mt5API !== 'undefined' && typeof window.mt5API.getClosedPositions === 'function') {
  console.log('✅ API available, testing hour period...');
  
  async function testHourPeriod() {
    try {
      console.log('🔄 Testing getClosedPositions with 1 hour period...');
      const result = await window.mt5API.getClosedPositions(0.04);
      console.log('✅ Hour period test result:', result);
      
      if (result.success && result.data) {
        console.log(`📊 Found ${result.data.length} positions in the last hour`);
        if (result.data.length > 0) {
          console.log('Most recent position:', result.data[0]);
        }
      } else {
        console.log('ℹ️ No positions found in the last hour or error:', result.error);
      }
    } catch (error) {
      console.error('❌ Error testing hour period:', error);
    }
  }
  
  // Run the test
  testHourPeriod();
} else {
  console.log('ℹ️ API not available, skipping API test');
}

console.log('🏁 Hour period debug test complete');
console.log('💡 To manually test:');
console.log('1. Select "1 hour" from the dropdown');
console.log('2. Click "Refresh"');
console.log('3. Check if positions from the last hour are displayed');