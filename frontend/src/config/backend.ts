/**
 * Backend API target — always points at the production server.
 * Override with VITE_BACKEND_ORIGIN in .env if needed.
 */

/** Default API server (no trailing slash). */
export const DEFAULT_BACKEND_ORIGIN = "http://187.55.228.244:8000";

export const BACKEND_ORIGIN = (
  import.meta.env.VITE_BACKEND_ORIGIN ?? DEFAULT_BACKEND_ORIGIN
).replace(/\/$/, "");

export const API_BASE = `${BACKEND_ORIGIN}/api/v1`;

/** Prefix backend-relative paths (/uploads/...) with the API origin. */
export function resolveBackendAssetUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return path.startsWith("/") ? `${BACKEND_ORIGIN}${path}` : `${BACKEND_ORIGIN}/${path}`;
}
