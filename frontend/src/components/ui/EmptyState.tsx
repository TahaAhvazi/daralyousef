import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { useT } from "@/i18n/useT";
import { cn } from "@/lib/cn";

export function EmptyState({
  title,
  description,
  icon,
  action,
  compact,
  className,
}: {
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  const { locale } = useT();
  const fallbackTitle = locale === "ar" ? "ما عدنا شي هنا بعد" : "Nothing here yet";
  const resolvedTitle = title ?? fallbackTitle;
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-2 px-4 py-10" : "gap-3 px-6 py-16",
        className,
      )}
    >
      <div
        className={cn(
          "grid place-items-center rounded-2xl border border-border bg-surface-2/60 text-text-3",
          compact ? "size-11" : "size-14",
        )}
      >
        {icon ?? <Inbox className={compact ? "size-5" : "size-7"} />}
      </div>
      <div className="max-w-md">
        <h3 className={cn("font-semibold text-text", compact ? "text-sm" : "text-base")}>
          {resolvedTitle}
        </h3>
        {description ? (
          <p className={cn("mt-1 text-text-2", compact ? "text-xs" : "text-sm")}>{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
