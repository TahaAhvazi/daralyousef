import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

import { cn } from "@/lib/cn";
import type { BreadcrumbItem } from "@/lib/breadcrumbs";

export function Breadcrumbs({
  items,
  className,
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  if (items.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("flex min-w-0 items-center gap-1", className)}>
      <ol className="flex min-w-0 flex-wrap items-center gap-1">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex min-w-0 items-center gap-1">
              {i > 0 ? (
                <ChevronRight
                  data-rtl-mirror="true"
                  className="size-3.5 shrink-0 text-text-3"
                  aria-hidden
                />
              ) : null}
              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  className="inline-flex min-w-0 max-w-[10rem] items-center gap-1 truncate rounded-md px-1 py-0.5 text-[12.5px] font-medium text-text-2 transition-colors hover:bg-surface-2 hover:text-text sm:max-w-[14rem]"
                >
                  {i === 0 ? <Home className="size-3 shrink-0" aria-hidden /> : null}
                  <span className="truncate">{item.label}</span>
                </Link>
              ) : (
                <span
                  className="inline-flex min-w-0 max-w-[12rem] truncate px-1 text-[12.5px] font-semibold text-text sm:max-w-[16rem]"
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
