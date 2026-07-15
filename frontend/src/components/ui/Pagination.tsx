import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { useT } from "@/i18n/useT";

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  className,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  const { t } = useT();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p className="text-caption tabular-nums">
        {from}–{to} {t.staffUi.common.of} {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          icon={<ChevronLeft data-rtl-mirror="true" className="size-3.5" />}
        >
          {t.staffUi.common.previous}
        </Button>
        <span className="min-w-[5rem] text-center text-caption tabular-nums">
          {t.staffUi.common.page} {page} {t.staffUi.common.of} {totalPages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          iconRight={<ChevronRight data-rtl-mirror="true" className="size-3.5" />}
        >
          {t.staffUi.common.next}
        </Button>
      </div>
    </div>
  );
}
