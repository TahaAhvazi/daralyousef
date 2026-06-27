import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { useT } from "@/i18n/useT";

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  const { locale } = useT();
  const fallbackTitle = locale === "ar" ? "ما عدنا شي هنا بعد" : "Nothing here yet";
  const resolvedTitle = title ?? fallbackTitle;
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-surface-2 text-text-3">
        {icon ?? <Inbox className="size-7" />}
      </div>
      <div>
        <h3 className="text-base font-semibold text-text">{resolvedTitle}</h3>
        {description ? <p className="mt-1 text-sm text-text-2 max-w-md">{description}</p> : null}
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
