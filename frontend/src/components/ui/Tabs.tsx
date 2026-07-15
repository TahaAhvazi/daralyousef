import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface TabItem {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  badge?: ReactNode;
  disabled?: boolean;
}

export function Tabs({
  items,
  value,
  onChange,
  className,
  fullWidth,
}: {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
  fullWidth?: boolean;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex max-w-full flex-wrap gap-1 rounded-xl border border-border bg-surface-2/60 p-1",
        fullWidth && "flex w-full",
        className,
      )}
    >
      {items.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            className={cn(
              "focus-ring inline-flex min-h-[36px] items-center justify-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
              fullWidth && "flex-1",
              active
                ? "bg-surface text-text shadow-soft"
                : "text-text-2 hover:bg-surface/70 hover:text-text",
              tab.disabled && "cursor-not-allowed opacity-50",
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge}
          </button>
        );
      })}
    </div>
  );
}
