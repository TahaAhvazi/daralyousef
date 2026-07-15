import type { ReactNode } from "react";

import { Card, CardBody } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

type StatTone = "brand" | "success" | "warning" | "danger" | "info" | "neutral";

const TONE_ICON: Record<StatTone, string> = {
  brand: "bg-brand/10 text-brand",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  info: "bg-info/10 text-info",
  neutral: "bg-surface-2 text-text-2",
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "brand",
  action,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: StatTone;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("relative h-full overflow-hidden", className)}>
      <CardBody className="relative flex h-full flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 flex-1 text-[11px] font-semibold uppercase leading-snug tracking-wide text-text-3 sm:text-[12px] sm:tracking-wider">
            {label}
          </p>
          {icon ? (
            <span
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-xl sm:size-10",
                TONE_ICON[tone],
              )}
            >
              {icon}
            </span>
          ) : null}
        </div>

        <p className="mt-3 text-[1.5rem] font-semibold leading-none tracking-tight text-text tabular-nums sm:mt-3.5 sm:text-[1.75rem]">
          {value}
        </p>

        {hint ? (
          <p className="mt-2 text-[12px] leading-snug text-text-3 sm:text-[12.5px]">{hint}</p>
        ) : null}

        {action ? <div className="mt-auto border-t border-border/70 pt-3">{action}</div> : null}
      </CardBody>
    </Card>
  );
}
