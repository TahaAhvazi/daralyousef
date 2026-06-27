/**
 * Backend target switch
 * ─────────────────────
 * true  → local FastAPI (Vite dev proxy → http://127.0.0.1:8000)
 * false → remote deployed server (REMOTE_BACKEND_URL)
 */
export const USE_LOCAL_BACKEND = true;

/** Local uvicorn origin (see backend README). */
export const LOCAL_BACKEND_URL = "http://127.0.0.1:8000";

/** Remote API origin — no trailing slash. */
export const REMOTE_BACKEND_URL = "https://api.example.com";

export const BACKEND_ORIGIN = USE_LOCAL_BACKEND ? "" : REMOTE_BACKEND_URL.replace(/\/$/, "");

export const API_BASE = USE_LOCAL_BACKEND ? "/api/v1" : `${BACKEND_ORIGIN}/api/v1`;

/** Prefix backend-relative paths (/uploads/...) when talking to a remote server. */
export function resolveBackendAssetUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  if (!BACKEND_ORIGIN) return path;
  return path.startsWith("/") ? `${BACKEND_ORIGIN}${path}` : `${BACKEND_ORIGIN}/${path}`;
}
