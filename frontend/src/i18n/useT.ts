import { useMemo } from "react";
import { useLocaleStore } from "@/store/locale";
import { LOCALE_META } from "./config";
import { MESSAGES, type Dict } from "./messages";

/** Returns the current dictionary, locale and direction. */
export function useT() {
  const locale = useLocaleStore((s) => s.locale);
  return useMemo(() => {
    const t: Dict = MESSAGES[locale];
    const meta = LOCALE_META[locale];
    return { t, locale, dir: meta.dir, isRtl: meta.dir === "rtl" };
  }, [locale]);
}

/** Localize digits 0-9 to Eastern Arabic numerals when locale is Arabic. */
export function localizeDigits(input: string | number, locale: string): string {
  const s = String(input);
  if (!locale.startsWith("ar")) return s;
  const map = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return s.replace(/[0-9]/g, (d) => map[Number(d)] ?? d);
}
