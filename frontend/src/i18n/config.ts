export const SUPPORTED_LOCALES = ["en", "ar"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_META: Record<Locale, { label: string; native: string; dir: "ltr" | "rtl"; flag: string; htmlLang: string }> = {
  en: { label: "English", native: "English", dir: "ltr", flag: "🇺🇸", htmlLang: "en" },
  // Iraqi Arabic — uses an Iraq region tag so screen readers / fonts pick the right variant.
  ar: { label: "Arabic (Iraq)", native: "العربية", dir: "rtl", flag: "🇮🇶", htmlLang: "ar-IQ" },
};

export const DEFAULT_LOCALE: Locale = "en";
