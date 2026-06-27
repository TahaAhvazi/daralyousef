import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_LOCALE, LOCALE_META, SUPPORTED_LOCALES, type Locale } from "@/i18n/config";

interface LocaleState {
  locale: Locale;
  setLocale: (l: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,
      setLocale: (l) => set({ locale: l }),
    }),
    { name: "atelier.locale" }
  )
);

/** Side-effect: apply locale to <html lang> and <html dir>. */
export function applyLocaleToHtml(locale: Locale) {
  const root = document.documentElement;
  const meta = LOCALE_META[locale];
  root.setAttribute("lang", meta.htmlLang);
  root.setAttribute("dir", meta.dir);
}

export function nextLocale(current: Locale): Locale {
  const i = SUPPORTED_LOCALES.indexOf(current);
  return SUPPORTED_LOCALES[(i + 1) % SUPPORTED_LOCALES.length];
}
