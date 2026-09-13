const envApiUrl = import.meta.env.VITE_API_URL;

// In production, default to relative path "" so it works seamlessly on any domain/host
// (unified deployment or behind reverse proxy).
// In local Vite dev (port 5173), fallback to 'http://127.0.0.1:8000'.
export const API_BASE_URL =
  typeof envApiUrl === 'string' && envApiUrl.trim() !== ''
    ? envApiUrl.replace(/\/+$/, '')
    : (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '');
