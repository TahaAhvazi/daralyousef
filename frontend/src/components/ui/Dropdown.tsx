import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface DropdownItem {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  onClick?: () => void;
  href?: string;
  danger?: boolean;
  disabled?: boolean;
}

export function Dropdown({
  trigger,
  items,
  align = "end",
  className,
}: {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: "start" | "end";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <div onClick={() => setOpen((s) => !s)}>{trigger}</div>
      {open ? (
        <div
          className={cn(
            "absolute z-50 mt-2 min-w-[11rem] overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-medium animate-fade-up",
            align === "end" ? "end-0" : "start-0",
          )}
          role="menu"
        >
          {items.map((item) => {
            const cls = cn(
              "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-start text-[13.5px] transition-colors",
              item.danger ? "text-danger hover:bg-danger/8" : "text-text hover:bg-surface-2",
              item.disabled && "pointer-events-none opacity-50",
            );
            if (item.href) {
              return (
                <a key={item.id} href={item.href} className={cls} role="menuitem">
                  {item.icon}
                  {item.label}
                </a>
              );
            }
            return (
              <button
                key={item.id}
                type="button"
                className={cls}
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  item.onClick?.();
                  setOpen(false);
                }}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
