/**
 * Backend target switch
 * ─────────────────────
 * DEV   → local FastAPI (Vite proxy → http://127.0.0.1:8000)
 * PROD  → Vercel service at VERCEL_BACKEND_PREFIX, or VITE_BACKEND_ORIGIN if set
 */

/** Must match `backend.routePrefix` in root vercel.json */
export const VERCEL_BACKEND_PREFIX = "/_/backend";

/** Override with full API origin (no trailing slash) when API is on another host. */
const REMOTE_BACKEND_ORIGIN = (import.meta.env.VITE_BACKEND_ORIGIN ?? "").replace(/\/$/, "");

/** Local dev uses the Vite proxy; production builds use Vercel / remote URL. */
export const USE_LOCAL_BACKEND = import.meta.env.DEV;

export const LOCAL_BACKEND_URL = "http://127.0.0.1:8000";

export const BACKEND_ORIGIN = USE_LOCAL_BACKEND
  ? ""
  : REMOTE_BACKEND_ORIGIN || VERCEL_BACKEND_PREFIX;

export const API_BASE = USE_LOCAL_BACKEND
  ? "/api/v1"
  : `${BACKEND_ORIGIN}/api/v1`;

/** Prefix backend-relative paths (/uploads/...) when not using the Vite dev proxy. */
export function resolveBackendAssetUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  if (!BACKEND_ORIGIN) return path;
  return path.startsWith("/") ? `${BACKEND_ORIGIN}${path}` : `${BACKEND_ORIGIN}/${path}`;
}
