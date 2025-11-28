// Declare variables before using them
const checkAdminAuth = () => {
  // Implementation of checkAdminAuth
  console.log("Checking admin authentication...")
}

const authManager = {
  getCurrentUser: () => {
    // Implementation of getCurrentUser
    return { name: "John Doe" }
  },
  logout: () => {
    // Implementation of logout
    console.log("Logging out...")
  },
}

const apiClient = {
  getStatistics: async () => {
    // Implementation of getStatistics
    return { pending: 10, in_progress: 5, verified: 8, resolved: 3 }
  },
  getReports: async () => {
    // Implementation of getReports
    return [
      {
        id: 1,
        title: "Report 1",
        category: "Category 1",
        status: "pending",
        latitude: -6.2088,
        longitude: 106.8456,
        created_at: new Date(),
      },
      {
        id: 2,
        title: "Report 2",
        category: "Category 2",
        status: "verified",
        latitude: -6.2144,
        longitude: 106.8456,
        created_at: new Date(),
      },
      // More reports here
    ]
  },
  updateReportStatus: async (reportId, status) => {
    // Implementation of updateReportStatus
    console.log(`Updating report ${reportId} status to ${status}`)
  },
}

checkAdminAuth()

document.addEventListener("DOMContentLoaded", () => {
  // Setup UI
  setupNavigation()
  setupFilters()
  loadStatistics()
  loadReports()
})

function setupNavigation() {
  const userName = document.getElementById("user-name")
  const user = authManager.getCurrentUser()
  if (user) {
    userName.textContent = user.name || "Admin"
  }

  const userBtn = document.getElementById("user-btn")
  const userDropdown = document.getElementById("user-dropdown")

  userBtn.addEventListener("click", () => {
    userDropdown.classList.toggle("show")
  })

  document.getElementById("logout-btn").addEventListener("click", () => {
    authManager.logout()
    window.location.href = "login.html"
  })
}

function setupFilters() {
  document.getElementById("status-filter").addEventListener("change", loadReports)
}

async function loadStatistics() {
  try {
    const stats = await apiClient.getStatistics()
    document.getElementById("stat-pending").textContent = stats.pending || 0
    document.getElementById("stat-in-progress").textContent = stats.in_progress || 0
    document.getElementById("stat-verified").textContent = stats.verified || 0
    document.getElementById("stat-resolved").textContent = stats.resolved || 0
  } catch (error) {
    console.error("Failed to load statistics:", error)
  }
}

async function loadReports() {
  try {
    const reports = await apiClient.getReports()
    const statusFilter = document.getElementById("status-filter").value

    let filteredReports = reports
    if (statusFilter) {
      filteredReports = reports.filter((r) => r.status === statusFilter)
    }

    const reportsList = document.getElementById("reports-list")
    reportsList.innerHTML = ""

    const table = document.createElement("table")
    table.className = "reports-table"
    table.innerHTML = `
            <thead>
                <tr>
                    <th>Judul</th>
                    <th>Kategori</th>
                    <th>Status</th>
                    <th>Lokasi</th>
                    <th>Tanggal</th>
                    <th>Aksi</th>
                </tr>
            </thead>
            <tbody>
            </tbody>
        `

    const tbody = table.querySelector("tbody")
    filteredReports.forEach((report) => {
      const tr = document.createElement("tr")
      tr.innerHTML = `
                <td>${report.title}</td>
                <td>${report.category}</td>
                <td>
                    <select class="status-select" onchange="updateStatus('${report.id}', this.value)">
                        <option value="pending" ${report.status === "pending" ? "selected" : ""}>Pending</option>
                        <option value="verified" ${report.status === "verified" ? "selected" : ""}>Terverifikasi</option>
                        <option value="in_progress" ${report.status === "in_progress" ? "selected" : ""}>Sedang Diproses</option>
                        <option value="resolved" ${report.status === "resolved" ? "selected" : ""}>Selesai</option>
                    </select>
                </td>
                <td>${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}</td>
                <td>${new Date(report.created_at).toLocaleDateString("id-ID")}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-secondary" onclick="viewReport('${report.id}')">Lihat</button>
                    </div>
                </td>
            `
      tbody.appendChild(tr)
    })

    reportsList.appendChild(table)
  } catch (error) {
    console.error("Failed to load reports:", error)
  }
}

async function updateStatus(reportId, status) {
  try {
    await apiClient.updateReportStatus(reportId, status)
    loadStatistics()
    loadReports()
  } catch (error) {
    alert("Gagal update status: " + error.message)
  }
}

function viewReport(reportId) {
  alert("View report: " + reportId)
}

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
  const dropdown = document.getElementById("user-dropdown")
  const userBtn = document.getElementById("user-btn")
  if (!userBtn.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.classList.remove("show")
  }
})
