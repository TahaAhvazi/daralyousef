import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Globe } from "lucide-react";
import { LOCALE_META, SUPPORTED_LOCALES } from "@/i18n/config";
import { applyLocaleToHtml, useLocaleStore } from "@/store/locale";
import { useT } from "@/i18n/useT";
import { cn } from "@/lib/cn";

interface Props {
  variant?: "default" | "ghost" | "landing" | "minimal";
  align?: "start" | "end";
  className?: string;
}

export function LanguageSwitcher({ variant = "default", align = "end", className }: Props) {
  const { locale } = useT();
  const setLocale = useLocaleStore((s) => s.setLocale);
  const meta = LOCALE_META[locale];
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          variant === "minimal"
            ? "inline-flex h-9 items-center gap-1.5 px-2 text-[13px] font-medium text-white/80 hover:text-white transition-colors"
            : "btn h-9 px-3 text-[13px]",
          variant === "landing"
            ? "rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/15 backdrop-blur-md"
            : variant === "ghost"
              ? "btn-ghost"
              : variant === "default"
                ? "btn-secondary"
                : "",
        )}
        aria-label="Change language"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Globe className="size-4" />
        <span className="hidden sm:inline tabular-nums">{meta.native}</span>
        <span className="sm:hidden uppercase tracking-wider">{locale}</span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.2, 0.7, 0.2, 1] }}
            role="menu"
            className={cn(
              "absolute top-[calc(100%+8px)] z-50 min-w-[200px] glass rounded-xl p-1.5 shadow-medium",
              align === "end" ? "end-0" : "start-0",
            )}
          >
            {SUPPORTED_LOCALES.map((code) => {
              const m = LOCALE_META[code];
              const active = code === locale;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    setLocale(code);
                    applyLocaleToHtml(code);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-[13px] text-start transition-colors",
                    active ? "bg-brand/10 text-brand" : "hover:bg-surface-2 text-text",
                  )}
                  role="menuitemradio"
                  aria-checked={active}
                >
                  <span className="text-[16px] leading-none">{m.flag}</span>
                  <span className="flex-1">
                    <span className="block font-semibold">{m.native}</span>
                    <span className="block text-[11px] text-text-3">{m.label}</span>
                  </span>
                  {active ? <Check className="size-4 text-brand" /> : null}
                </button>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
