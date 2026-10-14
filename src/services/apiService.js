/**
 * API Service for FinShield AI
 * Connects frontend to the FastAPI + PostgreSQL backend.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

async function request(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });
    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`[FinShield API] ${endpoint} failed, falling back:`, err.message);
    throw err;
  }
}

export const apiService = {
  // Health
  checkHealth: () => request('/health'),

  // Advertisements
  getAdvertisements: (params = {}) => {
    const query = new URLSearchParams();
    if (params.query) query.append('query', params.query);
    if (params.platform) query.append('platform', params.platform);
    if (params.risk) query.append('risk', params.risk);
    if (params.page) query.append('page', params.page);
    if (params.pageSize) query.append('pageSize', params.pageSize || 100);
    return request(`/advertisements?${query.toString()}`);
  },

  getAdvertisementById: (id) => request(`/advertisements/${id}`),

  updateAdStatus: (id, status) =>
    request(`/advertisements/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  toggleAdReview: (id) =>
    request(`/advertisements/${id}/toggle-review`, {
      method: 'POST',
    }),

  // Alerts
  getAlerts: () => request('/alerts'),
  toggleAlertRead: (id) => request(`/alerts/${id}/read`, { method: 'PATCH' }),

  // Campaigns & DNA Graph
  getCampaigns: () => request('/campaigns'),
  getCampaignGraph: (id) => request(`/campaigns/${id}/graph`),

  // Investigations
  getInvestigations: () => request('/investigations'),
  createInvestigation: (data) =>
    request('/investigations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateInvestigation: (id, changes) =>
    request(`/investigations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(changes),
    }),

  // Watchlist
  getWatchlist: () => request('/watchlist'),
  addToWatchlist: (data) =>
    request('/watchlist', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  removeFromWatchlist: (id) =>
    request(`/watchlist/${id}`, {
      method: 'DELETE',
    }),

  // Live Reddit Sync
  syncLiveRedditFeed: (limit = 10) =>
    request('/ingestion/sync', {
      method: 'POST',
      body: JSON.stringify({ limit }),
    }),

  // Live Inspection
  inspectAd: async (formData) => {
    const res = await fetch(`${API_BASE}/analysis/inspect`, {
      method: 'POST',
      body: formData, // multipart/form-data
    });
    if (!res.ok) throw new Error(`Inspection failed: ${res.statusText}`);
    return await res.json();
  },
};
