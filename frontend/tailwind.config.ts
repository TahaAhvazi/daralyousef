import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      screens: {
        xs: "480px",
      },
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-2": "rgb(var(--surface-2) / <alpha-value>)",
        "surface-3": "rgb(var(--surface-3) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        "border-strong": "rgb(var(--border-strong) / <alpha-value>)",
        text: "rgb(var(--text) / <alpha-value>)",
        "text-2": "rgb(var(--text-2) / <alpha-value>)",
        "text-3": "rgb(var(--text-3) / <alpha-value>)",
        brand: {
          DEFAULT: "rgb(var(--brand) / <alpha-value>)",
          2: "rgb(var(--brand-2) / <alpha-value>)",
          soft: "rgb(var(--brand-soft) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          2: "rgb(var(--accent-2) / <alpha-value>)",
          soft: "rgb(var(--accent-soft) / <alpha-value>)",
        },
        success: "rgb(var(--success) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
        info: "rgb(var(--info) / <alpha-value>)",
        ring: "rgb(var(--ring) / <alpha-value>)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "IBM Plex Sans Arabic",
          "Cairo",
          "Tajawal",
          "Noto Naskh Arabic",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
        display: ["Inter", "IBM Plex Sans Arabic", "Cairo", "sans-serif"],
        arabic: ["IBM Plex Sans Arabic", "Cairo", "Tajawal", "Noto Naskh Arabic", "sans-serif"],
      },
      borderRadius: {
        sm: "8px",
        DEFAULT: "12px",
        md: "12px",
        lg: "16px",
        xl: "22px",
        "2xl": "28px",
      },
      boxShadow: {
        // Ambient ink shadows — track --text so they pick up the active palette
        // (dark-blue ink in light mode, light-grey ink-on-dark in dark mode).
        soft: "0 1px 2px rgb(var(--text) / .04), 0 1px 3px rgb(var(--text) / .06)",
        medium: "0 4px 14px rgb(var(--text) / .06), 0 2px 6px rgb(var(--text) / .04)",
        // Brand-tinted shadows resolve via CSS vars so they re-skin live.
        glow: "0 18px 40px -12px rgb(var(--brand) / .35), 0 8px 24px -8px rgb(var(--text) / .08)",
        ring: "0 0 0 1px rgb(var(--brand) / .15), 0 12px 40px rgb(var(--brand) / .18)",
        gold: "0 18px 40px -12px rgb(var(--accent) / .35), 0 8px 24px -8px rgb(var(--text) / .1)",
      },
      backgroundImage: {
        // Brand signature gradient — deep → base → soft
        "grad-brand":
          "linear-gradient(135deg, rgb(var(--brand-2)) 0%, rgb(var(--brand)) 45%, rgb(var(--brand-soft)) 100%)",
        // Sweeping accent for highlight surfaces — deep → base → soft
        "grad-gold":
          "linear-gradient(135deg, rgb(var(--accent-2)) 0%, rgb(var(--accent)) 50%, rgb(var(--accent-soft)) 100%)",
        // Refined aurora that combines brand + accent
        "grad-aurora":
          "linear-gradient(135deg, rgb(var(--brand)) 0%, rgb(var(--brand-soft)) 40%, rgb(var(--accent)) 100%)",
        // Warm cream sunrise for soft moments
        "grad-sunrise":
          "linear-gradient(135deg, rgb(var(--accent-soft)) 0%, rgb(var(--accent)) 50%, rgb(var(--accent-2)) 100%)",
        "grad-mesh":
          "radial-gradient(800px 400px at 80% -20%, rgb(var(--brand) / .18), transparent 60%), radial-gradient(800px 400px at -10% 110%, rgb(var(--accent) / .18), transparent 60%)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.4s linear infinite",
        "fade-up": "fade-up .25s cubic-bezier(.2,.7,.2,1)",
      },
    },
  },
  plugins: [],
} satisfies Config;
