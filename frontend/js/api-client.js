// API Client using global axios and CONFIG loaded via script tags

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
      const payload = {
        name: data.name,
        email: data.email,
        password: data.password,
      }
      const response = await axios.post(`${this.baseURL}/auth/register`, payload)
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
      const data = response.data
      // Transform GeoJSON FeatureCollection -> array of report objects
      if (data && data.type === "FeatureCollection" && Array.isArray(data.features)) {
        let reports = data.features.map((f) => {
          const p = f.properties || {}
          const coords = (f.geometry && f.geometry.coordinates) || [0, 0]
          return {
            ...p,
            latitude: coords[1],
            longitude: coords[0],
          }
        })
        // Client-side filter by category_id if categories provided
        if (categories && categories.length > 0) {
          const catIds = categories.map((c) => parseInt(c, 10)).filter((n) => !isNaN(n))
          reports = reports.filter((r) => !catIds.length || catIds.includes(r.category_id))
        }
        return reports
      }
      return data
    } catch (error) {
      if (CONFIG && CONFIG.MOCK_MODE && typeof MOCK_REPORTS !== "undefined") {
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
      // Backend expects PATCH /reports/:id with body { status }
      const response = await axios.patch(
        `${this.baseURL}/reports/${reportId}`,
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
      if (CONFIG && CONFIG.MOCK_MODE && typeof MOCK_CATEGORIES !== "undefined") {
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
window.apiClient = new APIClient(CONFIG.API_BASE_URL)
