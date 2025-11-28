// Ensure global instances from other scripts are used (defined in auth.js and api-client.js)
// Guest-friendly: do not enforce login on dashboard

let mapManager
let selectedCategories = []

document.addEventListener("DOMContentLoaded", () => {
  // Initialize map
  mapManager = new MapManager("map")

  // Setup UI
  setupNavigation()
  setupReportModal()
  setupDetailModal()
  loadCategories()
  loadReports()
})

function setupNavigation() {
  const userName = document.getElementById("user-name")
  const user = window.authManager?.getCurrentUser?.() || null
  if (user) {
    userName.textContent = user.name || "User"
  }
  else {
    // Guest view: show Login and collapse dropdown
    userName.textContent = "Login"
    const userDropdownEl = document.getElementById("user-dropdown")
    if (userDropdownEl) userDropdownEl.style.display = "none"
  }

  const userBtn = document.getElementById("user-btn")
  const userDropdown = document.getElementById("user-dropdown")

  userBtn.addEventListener("click", () => {
    const isLoggedIn = window.checkAuth ? window.checkAuth() : false
    if (!isLoggedIn) {
      // As guest, clicking user opens login page
      window.location.href = "login.html"
      return
    }
    userDropdown.classList.toggle("show")
  })

  const logoutBtn = document.getElementById("logout-btn")
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      window.authManager?.logout?.()
      window.location.href = "login.html"
    })
  }

  const reportBtn = document.getElementById("report-btn")
  if (reportBtn) {
    if (window.checkAuth && !window.checkAuth()) {
      // Hide create UI for guests
      reportBtn.style.display = "none"
      const createHint = document.getElementById("create-hint")
      if (createHint) createHint.style.display = "block"
    } else {
      reportBtn.addEventListener("click", () => {
        document.getElementById("report-modal").classList.remove("hidden")
      })
    }
  }
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

function setupDetailModal() {
  const modal = document.getElementById("detail-modal")
  const closeBtn = document.getElementById("close-detail")

  const close = () => modal.classList.add("hidden")
  closeBtn.addEventListener("click", close)
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close()
  })
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
    // Build an index for details modal access from popups
    window.__reportsById = {}
    reports.forEach((r) => (window.__reportsById[String(r.id)] = r))
    // Expose global opener used by popup link
    window.openReportDetailById = function (id) {
      const r = window.__reportsById[String(id)]
      if (r) openDetailModal(r)
    }
    mapManager.loadReports(reports)
  } catch (error) {
    console.error("Failed to load reports:", error)
  }
}

function openDetailModal(report) {
  const modal = document.getElementById("detail-modal")
  // Title
  document.getElementById("detail-title").textContent = report.title || "Detail Laporan"
  // Image
  const imgEl = document.getElementById("detail-image")
  const imgWrap = document.getElementById("detail-image-wrapper")
  if (report.image_url) {
    imgEl.src = report.image_url
    imgEl.style.display = ""
    imgWrap.style.display = "block"
  } else {
    imgEl.removeAttribute("src")
    imgEl.style.display = "none"
    imgWrap.style.display = "none"
  }
  // Meta
  document.getElementById("detail-status").textContent = (report.status || "").toUpperCase()
  document.getElementById("detail-category").textContent = report.category_name || report.category_id || "-"
  document.getElementById("detail-reporter").textContent = report.reporter_name || "-"
  const created = report.created_at ? new Date(report.created_at) : null
  document.getElementById("detail-created").textContent = created ? created.toLocaleString("id-ID") : "-"
  document.getElementById("detail-coordinates").textContent = `${Number(report.latitude).toFixed(6)}, ${Number(report.longitude).toFixed(6)}`
  document.getElementById("detail-description").textContent = report.description || ""

  modal.classList.remove("hidden")
}

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
  const dropdown = document.getElementById("user-dropdown")
  const userBtn = document.getElementById("user-btn")
  if (!userBtn.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.classList.remove("show")
  }
})
