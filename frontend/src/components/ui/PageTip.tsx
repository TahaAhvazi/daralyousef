import type { ReactNode } from "react";
import { Lightbulb, X } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/cn";
import { useT } from "@/i18n/useT";

/** Short, dismissible tip for first-time / beginner guidance. No features — UI only. */
export function PageTip({
  children,
  storageKey,
  className,
}: {
  children: ReactNode;
  /** When set, dismissing persists in localStorage */
  storageKey?: string;
  className?: string;
}) {
  const { t } = useT();
  const [hidden, setHidden] = useState(() => {
    if (!storageKey || typeof window === "undefined") return false;
    try {
      return localStorage.getItem(`page-tip:${storageKey}`) === "1";
    } catch {
      return false;
    }
  });

  if (hidden) return null;

  const dismiss = () => {
    setHidden(true);
    if (!storageKey) return;
    try {
      localStorage.setItem(`page-tip:${storageKey}`, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className={cn(
        "mb-4 flex items-start gap-3 rounded-xl border border-info/25 bg-info/8 px-4 py-3 text-[13.5px] text-text",
        className,
      )}
      role="note"
    >
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-info/15 text-info">
        <Lightbulb className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1 leading-relaxed text-text-2">
        <span className="me-1.5 font-semibold text-text">{t.staffUi.common.tip}:</span>
        {children}
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="btn btn-ghost h-8 w-8 shrink-0 p-0"
        aria-label={t.staffUi.common.dismissTip}
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
