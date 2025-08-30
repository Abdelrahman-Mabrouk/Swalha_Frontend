import axios from 'axios'

const getApiBaseUrl = () => {
    // يأخذ الـ IP من الـ URL الحالي ويغير الـ port للـ backend
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    return `${protocol}//${hostname}:8080/api`;
};

const API_BASE_URL = getApiBaseUrl();
// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)


const apiService = {
  // Students
  async getStudents() {
    const response = await apiClient.get('/registrar/students')
    return response.data
  },

  async createStudent(studentData) {
    const response = await apiClient.post('/registrar/students', studentData)
    return response.data
  },
  

updateStudent: async (id, data) => {
    try {
        console.log('Updating student with ID:', id, 'and data:', data);
        const response = await apiClient.put(`/registrar/students/${id}`, data);
        
        // Verify the response includes the updated status
        if (response.data && response.data.status !== data.status) {
            console.warn('Server response status differs from requested status:', {
                requested: data.status,
                received: response.data.status
            });
        }
        
        // Force a fresh GET request to ensure we have the latest data
        const refreshResponse = await apiClient.get(`/registrar/students/${id}`);
        return refreshResponse.data;
    } catch (error) {
        console.error('Update student error:', error.response || error);
        throw error.response?.data || error.message;
    }},

  async deleteStudent(id) {
    await apiClient.delete(`/registrar/students/${id}`)
  },

  // Classes
  async getClasses() {
    const response = await apiClient.get('/registrar/classes')
    return response.data
  },

  async createClass(classData) {
    const response = await apiClient.post('/registrar/classes', classData)
    return response.data
  },

  async updateClass(id, classData) {
    const response = await apiClient.put(`/registrar/classes/${id}`, classData)
    return response.data
  },

  async deleteClass(id) {
    await apiClient.delete(`/registrar/classes/${id}`)
  },

  // Revenues
  async getRevenues() {
    const response = await apiClient.get('/accountant/revenues')
    return response.data
  },

  async createRevenue(revenueData) {
    try {
      console.log('API Service - Sending revenue data:', revenueData)
      const response = await apiClient.post('/accountant/revenues', revenueData)
      console.log('API Service - Revenue response:', response.data)
      return response.data
    } catch (error) {
      console.error('API Service - Revenue error:', error)
      if (error.response) {
        console.error('API Service - Error response:', error.response.data)
      }
      throw error
    }
  },

  async updateRevenue(id, revenueData) {
    const response = await apiClient.put(`/accountant/revenues/${id}`, revenueData)
    return response.data
  },

  async deleteRevenue(id) {
    await apiClient.delete(`/accountant/revenues/${id}`)
  },

  // Expenses
  async getExpenses() {
    const response = await apiClient.get('/accountant/expenses')
    return response.data
  },

  async createExpense(expenseData) {
    const response = await apiClient.post('/accountant/expenses', expenseData)
    
    return response.data
  },

  async updateExpense(id, expenseData) {
    const response = await apiClient.put(`/accountant/expenses/${id}`, expenseData)
    return response.data
  },

  async deleteExpense(id) {
    await apiClient.delete(`/accountant/expenses/${id}`)
  },

  // Reports
  async getFinancialSummary() {
    const response = await apiClient.get('/accountant/reports/summary')
    return response.data
  },

  async getRevenueReports() {
    const response = await apiClient.get('/accountant/reports/revenues')
    return response.data
  },

  async getExpenseReports() {
    const response = await apiClient.get('/accountant/reports/expenses')
    return response.data
  },

  // Payments
  async addPayment(paymentData) {
    try {
      console.log('API Service - Sending payment data:', paymentData)
      const response = await apiClient.post('/payments', paymentData)
      console.log('API Service - Payment response:', response.data)
      return response.data
    } catch (error) {
      console.error('API Service - Payment error:', error)
      if (error.response) {
        console.error('API Service - Error response:', error.response.data)
      }
      throw error
    }
  },
  
  // System Settings
  async getMonthlyFee() {
    const response = await apiClient.get('/admin/settings')
    return response.data
  },


updateMonthlyFee: async (data) => {
  try {
    const { month, year } = data; // Extract month and year from data
    console.log("Sending payload:", data);

    // Validate and format the amount
    const amount = parseFloat(data.settingValue);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Invalid monthly fee amount');
    }


    console.log('Sending monthly fee update:', data);

    const response = await apiClient.post('/admin/settings/monthly-fee', data);

    return response.data;
  } catch (error) {
    console.error('Monthly fee update error:', error);
    throw error.response?.data || error;
  }
},
  async getStudentPayments(studentId) {
    const response = await apiClient.get(`/payments/student/${studentId}`)
    return response.data
  },
    async getStudentTotalPaymentsInThisMonth(studentId) {
    const response = await apiClient.get(`/monthly-payments/${studentId}`)
    return response.data
  },

  async getStudentPaymentSummary(studentId) {
    const response = await apiClient.get(`/payments/student/${studentId}/summary`)
    return response.data
  },

  async getStudentUnpaidPayments(studentId) {
    const response = await apiClient.get(`/payments/student/${studentId}/unpaid`)
    return response.data
  },
  async submitEnrollment(formData) {
    const response = await apiClient.post('/enrollment', formData);
    return response.data;
  },
  // Waiting List
async addToWaitingList(waitingListData) {
  const response = await apiClient.post('/waitinglist', waitingListData)
  return response.data
},

async getWaitingList() {
  const response = await apiClient.get('/waitinglist')
  return response.data
},

async editStudent(waitingListData) {
  const response = await apiClient.put('/waitinglist', waitingListData)
  return response.data
},

async deleteStudentfromWating(waitingListData) {
  const response = await apiClient.delete('/waitinglist', { data: waitingListData })
  return response.data
}
}

export { apiService } 