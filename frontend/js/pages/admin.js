// Use globals provided by non-module scripts
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
  const user = window.authManager.getCurrentUser()
  if (user) {
    userName.textContent = user.name || "Admin"
  }

  const userBtn = document.getElementById("user-btn")
  const userDropdown = document.getElementById("user-dropdown")

  userBtn.addEventListener("click", () => {
    userDropdown.classList.toggle("show")
  })

  document.getElementById("logout-btn").addEventListener("click", () => {
    window.authManager.logout()
    window.location.href = "login.html"
  })
}

function setupFilters() {
  document.getElementById("status-filter").addEventListener("change", loadReports)
}

async function loadStatistics() {
  try {
    // Compute stats client-side from reports since backend has no statistics endpoint
    const reports = await window.apiClient.getReports([])
    const counts = {
      pending: 0,
      verified: 0,
      resolved: 0,
      rejected: 0,
    }
    reports.forEach((r) => {
      const s = r.status
      if (s && counts.hasOwnProperty(s)) counts[s]++
    })
    document.getElementById("stat-pending").textContent = counts.pending
    // in-progress is not used in backend; omit
    document.getElementById("stat-verified").textContent = counts.verified
    document.getElementById("stat-resolved").textContent = counts.resolved
  } catch (error) {
    console.error("Failed to load statistics:", error)
  }
}

async function loadReports() {
  try {
    const reports = await window.apiClient.getReports()
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
        <td>${report.category_id || ''}</td>
                <td>
          <select class="status-select" onchange="updateStatus('${report.id}', this.value)">
                        <option value="pending" ${report.status === "pending" ? "selected" : ""}>Pending</option>
                        <option value="verified" ${report.status === "verified" ? "selected" : ""}>Terverifikasi</option>
                        <option value="resolved" ${report.status === "resolved" ? "selected" : ""}>Selesai</option>
            <option value="rejected" ${report.status === "rejected" ? "selected" : ""}>Ditolak</option>
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
    await window.apiClient.updateReportStatus(reportId, status)
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
