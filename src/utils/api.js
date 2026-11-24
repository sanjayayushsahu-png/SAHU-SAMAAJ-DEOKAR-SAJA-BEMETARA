const API_BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'sscg_auth_token_v1';

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request(path, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
          'X-Auth-Token': token,
        }
      : {}),
    ...(options.headers || {}),
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      cache: 'no-store',
      ...options,
      headers,
      signal: controller.signal,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      const error = new Error(err.error || `HTTP ${res.status}`);
      error.status = res.status;
      throw error;
    }
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  health: () => request(`/health?t=${Date.now()}`),
  bootstrap: () => request(`/bootstrap?t=${Date.now()}`),
  loginMember: (payload) =>
    request('/auth/member', { method: 'POST', body: JSON.stringify(payload) }),
  loginAdmin: (mobile, pin) =>
    request('/auth/admin', { method: 'POST', body: JSON.stringify({ mobile, pin }) }),
  createPost: (payload) =>
    request('/posts', { method: 'POST', body: JSON.stringify(payload) }),
  toggleLike: (postId) =>
    request(`/posts/${postId}/like`, { method: 'POST' }),
  addComment: (postId, text) =>
    request(`/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ text }) }),
  approvePost: (postId) =>
    request(`/posts/${postId}/approve`, { method: 'PATCH' }),
  toggleFeatured: (postId) =>
    request(`/posts/${postId}/feature`, { method: 'PATCH' }),
  deletePost: (postId) =>
    request(`/posts/${postId}`, { method: 'DELETE' }),
  addSahitya: (payload) =>
    request('/sahitya', { method: 'POST', body: JSON.stringify(payload) }),
  deleteSahitya: (id) =>
    request(`/sahitya/${id}`, { method: 'DELETE' }),
  addHistory: (payload) =>
    request('/history', { method: 'POST', body: JSON.stringify(payload) }),
  deleteHistory: (id) =>
    request(`/history/${id}`, { method: 'DELETE' }),
  addEvent: (payload) =>
    request('/events', { method: 'POST', body: JSON.stringify(payload) }),
  deleteEvent: (id) =>
    request(`/events/${id}`, { method: 'DELETE' }),
  toggleRsvp: (id, going) =>
    request(`/events/${id}/rsvp`, { method: 'POST', body: JSON.stringify({ going }) }),
  setRequireApproval: (requireApproval) =>
    request('/settings/approval', {
      method: 'PATCH',
      body: JSON.stringify({ requireApproval }),
    }),
};
