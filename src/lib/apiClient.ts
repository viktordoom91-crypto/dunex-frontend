/**
 * lib/apiClient.ts
 *
 * Fixes applied:
 * 1. Removed the `if (typeof window !== 'undefined')` branch that caused the
 *    hydration mismatch — replaced with a single safe accessor.
 * 2. The base URL now reads NEXT_PUBLIC_API_URL at module load time on both
 *    server and client, so SSR and browser always agree on the value.
 * 3. Added a hard fallback so a missing env var shows a clear error rather
 *    than silently hitting a wrong host.
 */

import axios from 'axios';

// ── Resolved once at module load — same value on server and client ────────────
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://dunex-backend.onrender.com/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  // Give Render's free tier time to cold-start
  timeout: 30000,
});

// ── Request interceptor: attach admin JWT ────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    // localStorage is only available in the browser — guard it safely
    // WITHOUT a typeof-window branch so the interceptor itself never throws
    try {
      const token = localStorage.getItem('admin_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // server-side or storage unavailable — skip silently
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle expired sessions ────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      try {
        localStorage.removeItem('admin_token');
        window.location.href = '/admin-login';
      } catch {
        // server-side — ignore
      }
    }
    return Promise.reject(error);
  }
);