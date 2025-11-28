// Configuration
const CONFIG = {
  // Default to relative versioned API base for same-origin deployments (e.g., behind Coolify/Nginx)
  // You can still override with localStorage.setItem('api_url', 'https://your-domain/api/v1') if needed
  API_BASE_URL: localStorage.getItem("api_url") || "/api/v1",
  MOCK_MODE: !localStorage.getItem("api_url"),
}

// Mock Data
const MOCK_REPORTS = [
  {
    id: "1",
    title: "Jalan Berlubang di Jl. Sudirman",
    description: "Terdapat lubang besar di tengah jalan yang membahayakan kendaraan",
    category: "jalan_rusak",
    latitude: -6.2088,
    longitude: 106.8456,
    status: "pending",
    created_at: new Date().toISOString(),
    image_url: null,
  },
  {
    id: "2",
    title: "Lampu Jalan Mati",
    description: "Lampu jalan di perempatan sudah tidak menyala selama 2 minggu",
    category: "lampu_jalan",
    latitude: -6.21,
    longitude: 106.847,
    status: "verified",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    image_url: null,
  },
  {
    id: "3",
    title: "Sampah Menumpuk",
    description: "Tumpukan sampah di sepanjang jalan, sudah mengganggu lalu lintas",
    category: "kebersihan",
    latitude: -6.207,
    longitude: 106.844,
    status: "in_progress",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    image_url: null,
  },
]

const MOCK_CATEGORIES = [
  { id: "jalan_rusak", name: "Jalan Rusak" },
  { id: "kebersihan", name: "Kebersihan" },
  { id: "keamanan", name: "Keamanan" },
  { id: "lampu_jalan", name: "Lampu Jalan Mati" },
  { id: "air_bersih", name: "Air Bersih" },
  { id: "drainase", name: "Drainase" },
]
