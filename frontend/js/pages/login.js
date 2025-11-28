document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form")
  const authManager = {} // Declare the authManager variable here or import it properly

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const email = document.getElementById("email").value
    const password = document.getElementById("password").value

    try {
      await authManager.login(email, password)
      window.location.href = "dashboard.html"
    } catch (error) {
      document.getElementById("form-error").textContent =
        error.message || "Login gagal. Periksa email dan password Anda."
      document.getElementById("form-error").style.display = "block"
    }
  })
})
