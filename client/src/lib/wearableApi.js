const WEARABLE_API_BASE_URL = import.meta.env.VITE_WEARABLE_API_URL || 'http://localhost:8011'

async function fetchJson(path) {
  const response = await fetch(`${WEARABLE_API_BASE_URL}${path}`)
  if (!response.ok) {
    throw new Error(`Wearable API request failed: ${response.status}`)
  }
  return response.json()
}

export function fetchLatestWearableMetrics() {
  return fetchJson('/api/wearables/latest')
}

export function fetchWearableHistory(limit = 120) {
  return fetchJson(`/api/wearables/history?limit=${limit}`)
}
