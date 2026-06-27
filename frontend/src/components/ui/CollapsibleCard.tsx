import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { Card, CardBody } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

type Props = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  defaultOpen?: boolean;
  compact?: boolean;
  children: ReactNode;
};

export function CollapsibleCard({
  title,
  subtitle,
  action,
  defaultOpen = false,
  compact,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-start hover:bg-surface-2/40 transition-colors"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-text-3 transition-transform",
                open && "rotate-180",
              )}
            />
            <h3 className={cn("font-semibold tracking-tight text-text truncate", compact ? "text-[13.5px]" : "text-sm")}>
              {title}
            </h3>
          </div>
          {subtitle && !open ? (
            <p className="text-[11px] text-text-3 mt-0.5 ps-6 line-clamp-1">{subtitle}</p>
          ) : null}
        </div>
        {action ? (
          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
            {action}
          </div>
        ) : null}
      </button>
      {open ? (
        <CardBody className={cn("pt-0 border-t border-border/60", compact ? "p-4" : "p-5 pt-4")}>
          {subtitle && open ? (
            <p className="text-[11.5px] text-text-3 mb-3">{subtitle}</p>
          ) : null}
          {children}
        </CardBody>
      ) : null}
    </Card>
  );
}
