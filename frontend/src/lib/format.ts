import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/ar-iq";

import { useLocaleStore } from "@/store/locale";

dayjs.extend(relativeTime);

function bcp47(locale: string) {
  return locale === "ar" ? "ar-IQ" : "en-US";
}
function dayjsLocale(locale: string) {
  return locale === "ar" ? "ar-iq" : "en";
}

/** Plain (non-hook) versions look up locale at call time. */
function currentLocale(): string {
  try { return useLocaleStore.getState().locale; } catch { return "en"; }
}

export function formatMoney(value: number, currency = "USD", localeOverride?: string) {
  const locale = bcp47(localeOverride ?? currentLocale());
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency", currency, maximumFractionDigits: 2,
    }).format(value || 0);
  } catch {
    return `${(value || 0).toFixed(2)} ${currency}`;
  }
}

export function formatNumber(value: number, digits = 0, localeOverride?: string) {
  const locale = bcp47(localeOverride ?? currentLocale());
  return new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(value || 0);
}

export function fromNow(iso?: string | null, localeOverride?: string) {
  if (!iso) return "—";
  return dayjs(iso).locale(dayjsLocale(localeOverride ?? currentLocale())).fromNow();
}

export function formatDate(iso?: string | null, fmt = "MMM D, YYYY", localeOverride?: string) {
  if (!iso) return "—";
  return dayjs(iso).locale(dayjsLocale(localeOverride ?? currentLocale())).format(fmt);
}

export function formatDateTime(iso?: string | null, localeOverride?: string) {
  return formatDate(iso, "MMM D, YYYY · HH:mm", localeOverride);
}

export function formatMessageTime(iso?: string | null, localeOverride?: string) {
  if (!iso) return "";
  const loc = dayjsLocale(localeOverride ?? currentLocale());
  const d = dayjs(iso).locale(loc);
  const now = dayjs().locale(loc);
  if (d.isSame(now, "day")) return d.format("HH:mm");
  if (d.isSame(now.subtract(1, "day"), "day")) return localeOverride === "ar" || currentLocale() === "ar" ? "أمس" : "Yesterday";
  if (d.isSame(now, "year")) return d.format("MMM D");
  return d.format("MMM D, YYYY");
}

/** Short time for chat list rows (e.g. 16:08, Yesterday). */
export function formatChatListTime(iso?: string | null, localeOverride?: string) {
  return formatMessageTime(iso, localeOverride);
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
