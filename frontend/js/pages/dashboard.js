// Ensure global instances from other scripts are used (defined in auth.js and api-client.js)
// Do NOT redeclare them here to avoid shadowing/identifier errors.
checkAuth()

let mapManager
let selectedCategories = []

document.addEventListener("DOMContentLoaded", () => {
  // Initialize map
  mapManager = new MapManager("map")

  // Setup UI
  setupNavigation()
  setupReportModal()
  loadCategories()
  loadReports()
})

function setupNavigation() {
  const userName = document.getElementById("user-name")
  const user = window.authManager?.getCurrentUser?.() || null
  if (user) {
    userName.textContent = user.name || "User"
  }

  const userBtn = document.getElementById("user-btn")
  const userDropdown = document.getElementById("user-dropdown")

  userBtn.addEventListener("click", () => {
    userDropdown.classList.toggle("show")
  })

  document.getElementById("logout-btn").addEventListener("click", () => {
    window.authManager?.logout?.()
    window.location.href = "login.html"
  })

  document.getElementById("report-btn").addEventListener("click", () => {
    document.getElementById("report-modal").classList.remove("hidden")
  })
}

function setupReportModal() {
  const modal = document.getElementById("report-modal")
  const closeBtn = document.getElementById("close-modal")
  const cancelBtn = document.getElementById("cancel-btn")
  const reportForm = document.getElementById("report-form")

  closeBtn.addEventListener("click", closeModal)
  cancelBtn.addEventListener("click", closeModal)

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal()
    }
  })

  reportForm.addEventListener("submit", submitReport)
}

function closeModal() {
  document.getElementById("report-modal").classList.add("hidden")
  mapManager.clearTemporaryMarker()
  document.getElementById("report-location").value = ""
}

async function submitReport(e) {
  e.preventDefault()

  const title = document.getElementById("report-title").value
  const category = document.getElementById("report-category").value
  const description = document.getElementById("report-description").value
  const image = document.getElementById("report-image").files[0]

  if (!mapManager.selectedLocation) {
    alert("Silakan pilih lokasi di peta")
    return
  }

  try {
    const formData = new FormData()
    formData.append("title", title)
  // Backend expects category_id
  formData.append("category_id", category)
    formData.append("description", description)
    formData.append("latitude", mapManager.selectedLocation.lat)
    formData.append("longitude", mapManager.selectedLocation.lng)
    if (image) {
      formData.append("image", image)
    }

    await window.apiClient.createReport(formData)

    alert("Laporan berhasil dikirim!")
    closeModal()
    document.getElementById("report-form").reset()
    mapManager.selectedLocation = null
    loadReports()
  } catch (error) {
    alert("Gagal mengirim laporan: " + (error.message || "Error"))
  }
}

async function loadCategories() {
  try {
    const categories = await window.apiClient.getCategories()

    const categoryFilter = document.getElementById("category-filter")
    categoryFilter.innerHTML = ""

    categories.forEach((category) => {
      const div = document.createElement("div")
      div.className = "category-item"
      div.innerHTML = `
                <input type="checkbox" id="cat-${category.id}" value="${category.id}">
                <label for="cat-${category.id}">${category.name}</label>
            `
      div.querySelector("input").addEventListener("change", handleCategoryChange)
      categoryFilter.appendChild(div)
    })

    const reportCategory = document.getElementById("report-category")
    reportCategory.innerHTML = '<option value="">Pilih Kategori</option>'
    categories.forEach((category) => {
      const option = document.createElement("option")
      option.value = category.id
      option.textContent = category.name
      reportCategory.appendChild(option)
    })
  } catch (error) {
    console.error("Failed to load categories:", error)
  }
}

function handleCategoryChange() {
  selectedCategories = Array.from(document.querySelectorAll('#category-filter input[type="checkbox"]:checked')).map(
    (el) => el.value,
  )

  loadReports()
}

async function loadReports() {
  try {
    const reports = await window.apiClient.getReports(selectedCategories)
    mapManager.loadReports(reports)
  } catch (error) {
    console.error("Failed to load reports:", error)
  }
}

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
  const dropdown = document.getElementById("user-dropdown")
  const userBtn = document.getElementById("user-btn")
  if (!userBtn.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.classList.remove("show")
  }
})
