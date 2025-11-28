document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("register-form")
  const authManager = {} // Declare the authManager variable here or import it properly

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const name = document.getElementById("name").value
    const email = document.getElementById("email").value
    const phone = document.getElementById("phone").value
    const password = document.getElementById("password").value
    const confirmPassword = document.getElementById("confirm-password").value

    if (password !== confirmPassword) {
      document.getElementById("confirm-password-error").textContent = "Password tidak cocok"
      document.getElementById("confirm-password-error").style.display = "block"
      return
    }

    try {
      await authManager.register(name, email, phone, password)
      window.location.href = "login.html"
    } catch (error) {
      document.getElementById("form-error").textContent = error.message || "Pendaftaran gagal. Silakan coba lagi."
      document.getElementById("form-error").style.display = "block"
    }
  })
})
