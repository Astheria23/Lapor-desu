// Leaflet Map Manager
const L = window.L // Declare the L variable

class MapManager {
  constructor(mapId) {
    this.mapId = mapId
    this.map = null
    this.markers = L.markerClusterGroup()
    this.selectedLocation = null
    this.initMap()
  }

  initMap() {
    // Initialize Leaflet Map
    this.map = L.map(this.mapId).setView([-6.2088, 106.8456], 13)

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(this.map)

    // Add marker cluster group
    this.map.addLayer(this.markers)

    // Handle map click for location selection
    this.map.on("click", (e) => {
      this.selectLocation(e.latlng)
    })
  }

  selectLocation(latlng) {
    this.selectedLocation = latlng

    // Remove previous marker if exists
    if (this.tempMarker) {
      this.map.removeLayer(this.tempMarker)
    }

    // Add new marker
    this.tempMarker = L.marker(latlng, {
      icon: L.icon({
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        iconSize: [25, 41],
        shadowSize: [41, 41],
        iconAnchor: [12, 41],
        shadowAnchor: [13, 41],
      }),
    }).addTo(this.map)

    // Update location input
    document.getElementById("report-location").value = `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`

    console.log("[v0] Location selected:", latlng)
  }

  addReport(report) {
    const statusColors = {
      pending: "#ef4444", // Red
      verified: "#3b82f6", // Blue
      in_progress: "#f59e0b", // Orange
      resolved: "#10b981", // Green
    }

    const color = statusColors[report.status] || "#6b7280"

    const marker = L.circleMarker([report.latitude, report.longitude], {
      radius: 8,
      fillColor: color,
      color: "#fff",
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8,
    })

    marker.bindPopup(`
            <div style="width: 200px;">
                <h3 style="margin: 0 0 8px 0; font-weight: 700;">${report.title}</h3>
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">${report.description}</p>
                <p style="margin: 0; font-size: 12px;">
                    <strong>Status:</strong> 
                    <span style="background-color: ${color}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px;">
                        ${report.status.toUpperCase()}
                    </span>
                </p>
            </div>
        `)

    this.markers.addLayer(marker)
  }

  loadReports(reports) {
    // Clear existing markers
    this.markers.clearLayers()

    // Add all reports
    reports.forEach((report) => {
      this.addReport(report)
    })
  }

  clearTemporaryMarker() {
    if (this.tempMarker) {
      this.map.removeLayer(this.tempMarker)
      this.tempMarker = null
    }
  }
}
