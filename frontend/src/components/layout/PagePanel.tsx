import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/** Default page wrapper — stacks sections; scrolls inside the app main panel. */
export function PageScroll({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("space-y-5", className)}>{children}</div>;
}

/** Full-height page — shell stays fixed; children manage internal scroll regions. */
export function PagePanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex h-full min-h-0 flex-col gap-5 overflow-hidden", className)}>
      {children}
    </div>
  );
}

/** Scrollable region inside a PagePanel (sidebar list, table body, kanban column, thread). */
export function PanelScroll({
  children,
  className,
  axis = "y",
}: {
  children: ReactNode;
  className?: string;
  axis?: "x" | "y" | "both";
}) {
  const overflow =
    axis === "x" ? "overflow-x-auto overflow-y-hidden" :
    axis === "both" ? "overflow-auto" :
    "overflow-y-auto overflow-x-hidden";

  return (
    <div className={cn("min-h-0 flex-1 overscroll-contain", overflow, className)}>
      {children}
    </div>
  );
}
