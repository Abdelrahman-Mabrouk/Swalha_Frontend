import axios from 'axios'

const getApiBaseUrl = () => {
    // أثناء النشر على Railway
    return "https://swalhabackend-production.up.railway.app/api";
  };

const API_BASE_URL = getApiBaseUrl();
const authService = {
  async login(credentials) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials, {
        withCredentials: true   // مهم لو بتتعامل مع كوكيز
      })
      return response.data
    } catch (error) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      throw new Error('Login failed. Please try again.')
    }
  },

  setAuthToken(token) {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
  },

  removeAuthToken() {
    delete axios.defaults.headers.common['Authorization']
  }
}

export { authService } 
