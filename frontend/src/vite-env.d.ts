/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional full backend origin in production (e.g. https://api.example.com). */
  readonly VITE_BACKEND_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
