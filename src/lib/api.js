const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
export const JWT_STORAGE_KEY = "ugf_auth_token";
export const USER_STORAGE_KEY = "ugf_auth_user";

export function getStoredToken() {
  return localStorage.getItem(JWT_STORAGE_KEY);
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearStoredAuth() {
  localStorage.removeItem(JWT_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
}

export function persistAuth(token, user) {
  localStorage.setItem(JWT_STORAGE_KEY, token);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

/**
 * Shared fetch wrapper — attaches JWT Bearer header when present.
 */
export async function apiFetch(path, options = {}) {
  const token = getStoredToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  let body = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { error: text };
    }
  }

  if (!res.ok) {
    const err = new Error(body?.error || res.statusText || "Request failed");
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return body;
}

export const api = {
  get: (path, options) => apiFetch(path, { ...options, method: "GET" }),
  post: (path, data, options) =>
    apiFetch(path, {
      ...options,
      method: "POST",
      body: JSON.stringify(data ?? {}),
    }),
};
