// Simple API test script
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

async function testAPI() {
  try {
    console.log('Testing API endpoints...');
    
    // Test revenues endpoint
    try {
      const revenuesResponse = await axios.get(`${API_BASE_URL}/accountant/revenues`);
      console.log('✅ Revenues API working:', {
        status: revenuesResponse.status,
        dataLength: revenuesResponse.data?.length || 0,
        sampleData: revenuesResponse.data?.[0] || 'No data'
      });
    } catch (error) {
      console.log('❌ Revenues API error:', error.response?.status, error.response?.data || error.message);
    }
    
    // Test expenses endpoint
    try {
      const expensesResponse = await axios.get(`${API_BASE_URL}/accountant/expenses`);
      console.log('✅ Expenses API working:', {
        status: expensesResponse.status,
        dataLength: expensesResponse.data?.length || 0,
        sampleData: expensesResponse.data?.[0] || 'No data'
      });
    } catch (error) {
      console.log('❌ Expenses API error:', error.response?.status, error.response?.data || error.message);
    }
    
    // Test students endpoint
    try {
      const studentsResponse = await axios.get(`${API_BASE_URL}/registrar/students`);
      console.log('✅ Students API working:', {
        status: studentsResponse.status,
        dataLength: studentsResponse.data?.length || 0,
        sampleData: studentsResponse.data?.[0] || 'No data'
      });
    } catch (error) {
      console.log('❌ Students API error:', error.response?.status, error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('General error:', error.message);
  }
}

testAPI();
