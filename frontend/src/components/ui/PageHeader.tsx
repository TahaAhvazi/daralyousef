import type { ReactNode } from "react";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import type { BreadcrumbItem } from "@/lib/breadcrumbs";
import { cn } from "@/lib/cn";

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  className,
  actionsClassName,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  className?: string;
  actionsClassName?: string;
}) {
  return (
    <div className={cn("mb-6 w-full min-w-0 max-w-full", className)}>
      {breadcrumbs && breadcrumbs.length > 1 ? (
        <Breadcrumbs items={breadcrumbs} className="mb-3" />
      ) : null}
      <div className="flex w-full min-w-0 max-w-full flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 shrink">
          <h1 className="text-display">{title}</h1>
          {description ? (
            <p className="mt-1.5 text-body text-text-2 break-words">{description}</p>
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
    </div>
  );
}
