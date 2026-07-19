/**
 * Backend API target.
 *
 * Toggle USE_LOCAL_BACKEND below (or comment/uncomment the origins).
 * VITE_BACKEND_ORIGIN in .env still overrides everything when set.
 */

/** `true` = local uvicorn · `false` = production server */
export const USE_LOCAL_BACKEND = true;

/** Local FastAPI (no trailing slash). Prefer 127.0.0.1 over localhost (Windows IPv6). */
export const LOCAL_BACKEND_ORIGIN = "http://127.0.0.1:8000";

/**
 * Production API origin (no trailing slash).
 * Nginx mounts the backend under /api → requests go to …/api/api/v1
 */
export const PRODUCTION_BACKEND_ORIGIN = "https://daralyousif.iq/api";

// ── Switch by commenting one of these if you prefer that style: ─────────────
// export const DEFAULT_BACKEND_ORIGIN = LOCAL_BACKEND_ORIGIN;
// export const DEFAULT_BACKEND_ORIGIN = PRODUCTION_BACKEND_ORIGIN;

export const DEFAULT_BACKEND_ORIGIN = USE_LOCAL_BACKEND
  ? LOCAL_BACKEND_ORIGIN
  : PRODUCTION_BACKEND_ORIGIN;

export const BACKEND_ORIGIN = (
  import.meta.env.VITE_BACKEND_ORIGIN ?? DEFAULT_BACKEND_ORIGIN
).replace(/\/$/, "");

export const API_BASE = `${BACKEND_ORIGIN}/api/v1`;

/** Prefix backend-relative paths (/uploads/...) with the API origin. */
export function resolveBackendAssetUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  // Uploads are mounted at host root (/uploads), not under /api
  if (path.startsWith("/uploads")) {
    if (import.meta.env.DEV) return path; // Vite proxies /uploads
    const root = BACKEND_ORIGIN.replace(/\/api\/?$/, "");
    return `${root}${path}`;
  }
  return path.startsWith("/") ? `${BACKEND_ORIGIN}${path}` : `${BACKEND_ORIGIN}/${path}`;
}
