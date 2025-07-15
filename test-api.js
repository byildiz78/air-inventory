// Simple API test
const testAPI = async () => {
  try {
    console.log('Testing Dashboard APIs...\n');
    
    // Test stats API
    console.log('1. Testing /api/dashboard/stats');
    const statsResponse = await fetch('http://localhost:3000/api/dashboard/stats');
    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      console.log('✅ Stats API working:', JSON.stringify(stats, null, 2));
    } else {
      console.log('❌ Stats API failed:', statsResponse.status);
    }
    
    // Test stock alerts API
    console.log('\n2. Testing /api/dashboard/stock-alerts');
    const alertsResponse = await fetch('http://localhost:3000/api/dashboard/stock-alerts');
    if (alertsResponse.ok) {
      const alerts = await alertsResponse.json();
      console.log('✅ Stock Alerts API working, found', alerts.length, 'alerts');
    } else {
      console.log('❌ Stock Alerts API failed:', alertsResponse.status);
    }
    
    // Test cost trends API
    console.log('\n3. Testing /api/dashboard/cost-trends');
    const trendsResponse = await fetch('http://localhost:3000/api/dashboard/cost-trends');
    if (trendsResponse.ok) {
      const trends = await trendsResponse.json();
      console.log('✅ Cost Trends API working, found', trends.length, 'data points');
    } else {
      console.log('❌ Cost Trends API failed:', trendsResponse.status);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
};

// Check if running in Node.js
if (typeof window === 'undefined') {
  // Node.js environment - run the test
  testAPI();
} else {
  // Browser environment - make available globally
  window.testAPI = testAPI;
}