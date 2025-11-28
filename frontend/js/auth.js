// Auth Management
class AuthManager {
  constructor() {
    this.user = this.loadUser()
  }

  loadUser() {
    const userJSON = localStorage.getItem("user")
    return userJSON ? JSON.parse(userJSON) : null
  }

  saveUser(user) {
    this.user = user
    localStorage.setItem("user", JSON.stringify(user))
  }

  isLoggedIn() {
    return !!this.user && !!localStorage.getItem("auth_token")
  }

  isAdmin() {
    return this.user?.role === "admin"
  }

  async login(email, password) {
    const data = await window.apiClient.login(email, password)
    this.saveUser(data.user)
    return data
  }

  async register(name, email, password) {
    const data = await window.apiClient.register({
      name,
      email,
      password,
    })
    return data
  }

  logout() {
    this.user = null
    localStorage.removeItem("user")
    window.apiClient.clearToken()
  }

  getCurrentUser() {
    return this.user
  }
}

// Expose as a global for non-module scripts
window.authManager = new AuthManager()

// Auth Protection
function checkAuth() {
  if (!authManager.isLoggedIn()) {
    window.location.href = "login.html"
    return false
  }
  return true
}

function checkAdminAuth() {
  if (!authManager.isLoggedIn() || !authManager.isAdmin()) {
    window.location.href = "dashboard.html"
    return false
  }
  return true
}

// Also attach helpers for explicit access if needed
window.checkAuth = checkAuth
window.checkAdminAuth = checkAdminAuth
