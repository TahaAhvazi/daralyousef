import { useEffect } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/cn";
import { useT } from "@/i18n/useT";

export function Drawer({
  open,
  onClose,
  title,
  children,
  side = "start",
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  side?: "start" | "end";
}) {
  const { t, dir } = useT();
  const resolvedSide = side === "start" ? (dir === "rtl" ? "end" : "start") : (dir === "rtl" ? "start" : "end");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const slideFrom = resolvedSide === "start" ? "-100%" : "100%";

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === "string" ? title : t.staffUi.topbar.openMenu}
            initial={{ x: slideFrom }}
            animate={{ x: 0 }}
            exit={{ x: slideFrom }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className={cn(
              "absolute inset-y-0 flex w-[min(300px,88vw)] flex-col bg-surface shadow-2xl",
              resolvedSide === "start" ? "start-0" : "end-0",
              resolvedSide === "start"
                ? dir === "rtl" ? "border-s border-border" : "border-e border-border"
                : dir === "rtl" ? "border-e border-border" : "border-s border-border",
            )}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3.5">
              <div className="min-w-0 text-[15px] font-semibold tracking-tight truncate">{title}</div>
              <button
                type="button"
                className="btn btn-ghost h-9 w-9 shrink-0 p-0"
                onClick={onClose}
                aria-label={t.staffUi.topbar.closeMenu}
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
