import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

/**
 * Keep in sync with `src/config/backend.ts` → USE_LOCAL_BACKEND.
 * true  → proxy to local uvicorn
 * false → proxy to production
 */
const USE_LOCAL_BACKEND = true;

const PROXY_TARGET = USE_LOCAL_BACKEND
  ? "http://localhost:8000"
  : "https://daralyousif.iq";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: PROXY_TARGET,
        changeOrigin: true,
        secure: !USE_LOCAL_BACKEND,
      },
      "/uploads": {
        target: PROXY_TARGET,
        changeOrigin: true,
        secure: !USE_LOCAL_BACKEND,
      },
    },
  },
});
