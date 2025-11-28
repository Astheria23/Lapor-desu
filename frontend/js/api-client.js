// API Client with Axios
import axios from "axios"
import CONFIG from "./config" // Assuming CONFIG is imported from a config file
import MOCK_REPORTS from "./mock-reports" // Assuming MOCK_REPORTS is imported from a mock-reports file
import MOCK_CATEGORIES from "./mock-categories" // Assuming MOCK_CATEGORIES is imported from a mock-categories file

class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL
    this.token = localStorage.getItem("auth_token")
  }

  getHeaders() {
    const headers = {
      "Content-Type": "application/json",
    }
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`
    }
    return headers
  }

  setToken(token) {
    this.token = token
    if (token) {
      localStorage.setItem("auth_token", token)
    }
  }

  clearToken() {
    this.token = null
    localStorage.removeItem("auth_token")
  }

  // Auth Endpoints
  async login(email, password) {
    try {
      const response = await axios.post(`${this.baseURL}/auth/login`, {
        email,
        password,
      })
      if (response.data.token) {
        this.setToken(response.data.token)
      }
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  async register(data) {
    try {
      const response = await axios.post(`${this.baseURL}/auth/register`, data)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  // Reports Endpoints
  async getReports(categories = []) {
    try {
      const params = categories.length > 0 ? { categories: categories.join(",") } : {}
      const response = await axios.get(`${this.baseURL}/reports`, {
        headers: this.getHeaders(),
        params,
      })
      return response.data
    } catch (error) {
      if (CONFIG.MOCK_MODE) {
        const filtered =
          categories.length > 0 ? MOCK_REPORTS.filter((r) => categories.includes(r.category)) : MOCK_REPORTS
        return filtered
      }
      throw error
    }
  }

  async createReport(formData) {
    try {
      const response = await axios.post(`${this.baseURL}/reports`, formData, {
        headers: {
          ...this.getHeaders(),
          "Content-Type": "multipart/form-data",
        },
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  async updateReportStatus(reportId, status) {
    try {
      const response = await axios.patch(
        `${this.baseURL}/reports/${reportId}/status`,
        { status },
        { headers: this.getHeaders() },
      )
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }

  // Categories Endpoints
  async getCategories() {
    try {
      const response = await axios.get(`${this.baseURL}/categories`, {
        headers: this.getHeaders(),
      })
      return response.data
    } catch (error) {
      if (CONFIG.MOCK_MODE) {
        return MOCK_CATEGORIES
      }
      throw error
    }
  }

  // Statistics Endpoints
  async getStatistics() {
    try {
      const response = await axios.get(`${this.baseURL}/reports/statistics`, {
        headers: this.getHeaders(),
      })
      return response.data
    } catch (error) {
      if (CONFIG.MOCK_MODE) {
        return {
          pending: 1,
          verified: 1,
          in_progress: 1,
          resolved: 0,
        }
      }
      throw error
    }
  }
}

// Initialize API Client
const apiClient = new APIClient(CONFIG.API_BASE_URL)
