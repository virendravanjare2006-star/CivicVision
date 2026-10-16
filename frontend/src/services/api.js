/**
 * CivicVision - API Service Client
 * Team Cognitech
 * 
 * Provides clean, centralized REST calls to the Flask backend.
 */

const API_BASE = '/api';

/**
 * Generic fetch wrapper with JSON error parsing
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const defaultHeaders = {};

  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Backend health check
  getHealth: () => apiFetch('/health'),

  // Dashboard summary metrics
  getDashboard: () => apiFetch('/dashboard'),

  // Hazards list with optional search & filters
  getHazards: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.category && params.category !== 'All') searchParams.append('category', params.category);
    if (params.severity && params.severity !== 'All') searchParams.append('severity', params.severity);
    if (params.status && params.status !== 'All') searchParams.append('status', params.status);
    if (params.search) searchParams.append('search', params.search);

    const query = searchParams.toString();
    return apiFetch(`/hazards${query ? `?${query}` : ''}`);
  },

  // Single hazard detail
  getHazardById: (id) => apiFetch(`/hazards/${id}`),

  // Create new hazard (supports force=true to bypass duplicate confirmation)
  createHazard: (hazardData) =>
    apiFetch('/hazards', {
      method: 'POST',
      body: JSON.stringify(hazardData),
    }),

  // Update hazard (e.g. status change)
  updateHazard: (id, updates) =>
    apiFetch(`/hazards/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  // Delete hazard
  deleteHazard: (id) =>
    apiFetch(`/hazards/${id}`, {
      method: 'DELETE',
    }),

  // AI image detection (accepts FormData for upload OR FormData/object with preset)
  detectImage: (formData) =>
    apiFetch('/detection', {
      method: 'POST',
      body: formData,
    }),
};
