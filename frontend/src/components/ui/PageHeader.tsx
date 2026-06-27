import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export function PageHeader({
  title,
  description,
  actions,
  className,
  actionsClassName,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  actionsClassName?: string;
}) {
  return (
    <div
      className={cn(
        "mb-6 flex w-full min-w-0 max-w-full flex-col gap-3 lg:flex-row lg:items-end lg:justify-between",
        className,
      )}
    >
      <div className="min-w-0 shrink">
        <h1 className="text-xl font-semibold tracking-tight text-text sm:text-2xl">{title}</h1>
        {description ? (
          <p className="mt-1 text-[13.5px] text-text-2 break-words">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div
          className={cn(
            "flex w-full min-w-0 max-w-full flex-wrap items-center gap-2 lg:w-auto lg:justify-end",
            actionsClassName,
          )}
        >
          {actions}
        </div>
      ) : null}
    </div>
  );
}
