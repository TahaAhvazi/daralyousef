import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/cn";
import { ORDER_BOARD_COLUMNS } from "@/lib/workflow";
import { formatDateTime } from "@/lib/format";
import type { WorkflowBoardOrder } from "@/types/api";
import type { Dict } from "@/i18n/messages";

import { BoardOrderCard } from "./BoardOrderCard";

const STAT_COLORS: Record<string, string> = {
  intake: "#6366f1",
  approval: "#8b5cf6",
  confirmed: "#3b82f6",
  design: "#06b6d4",
  printing: "#14b8a6",
  production: "#f59e0b",
  finishing: "#f97316",
  delivery: "#84cc16",
  completed: "#22c55e",
  cancelled: "#ef4444",
};

type BoardLabels = Dict["staffUi"]["orderBoard"];

export function MobileBoardView({
  columns,
  columnLabels,
  bb,
  activity,
  totalOrders,
  byColumn,
  onAdvance,
  onRevert,
  loading,
  canOpenDetail,
  canOverride,
}: {
  columns: Record<string, WorkflowBoardOrder[]>;
  columnLabels: Record<string, string>;
  bb: BoardLabels;
  activity: Array<{ id: number; summary: string; actor_name?: string | null; occurred_at: string }>;
  totalOrders: number;
  byColumn: Record<string, number>;
  onAdvance: (orderId: number, toColumn: string) => void;
  onRevert: (orderId: number, toColumn: string) => void;
  loading: boolean;
  canOpenDetail: boolean;
  canOverride: boolean;
}) {
  const firstWithOrders = ORDER_BOARD_COLUMNS.find((c) => (columns[c]?.length ?? 0) > 0);
  const [activeColumn, setActiveColumn] = useState(firstWithOrders ?? ORDER_BOARD_COLUMNS[0]);
  const [showActivity, setShowActivity] = useState(false);

  useEffect(() => {
    if ((columns[activeColumn]?.length ?? 0) > 0) return;
    const next = ORDER_BOARD_COLUMNS.find((c) => (columns[c]?.length ?? 0) > 0);
    if (next) setActiveColumn(next);
  }, [columns, activeColumn]);

  const columnIndex = ORDER_BOARD_COLUMNS.indexOf(activeColumn);
  const orders = columns[activeColumn] ?? [];
  const isCancelled = activeColumn === "cancelled";

  const goPrev = () => {
    if (columnIndex > 0) setActiveColumn(ORDER_BOARD_COLUMNS[columnIndex - 1]);
  };
  const goNext = () => {
    if (columnIndex < ORDER_BOARD_COLUMNS.length - 1) {
      setActiveColumn(ORDER_BOARD_COLUMNS[columnIndex + 1]);
    }
  };

  const stageSummary = useMemo(
    () =>
      ORDER_BOARD_COLUMNS.map((col) => ({
        col,
        count: byColumn[col] ?? 0,
        color: STAT_COLORS[col] ?? "#94a3b8",
        label: columnLabels[col] ?? col,
      })),
    [byColumn, columnLabels],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 lg:hidden">
      <p className="shrink-0 text-[11px] text-text-3 px-0.5">{bb.mobileTapHint}</p>

      <div className="shrink-0 flex items-center gap-1">
        <button
          type="button"
          onClick={goPrev}
          disabled={columnIndex <= 0}
          className="btn btn-ghost h-9 w-9 shrink-0 p-0 disabled:opacity-30"
          aria-label={bb.mobilePrevStage}
        >
          <ChevronLeft data-rtl-mirror="true" className="size-5" />
        </button>

        <div className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain">
          <div className="flex gap-1.5 pb-0.5">
            {stageSummary.map((s) => {
              const active = s.col === activeColumn;
              return (
                <button
                  key={s.col}
                  type="button"
                  onClick={() => setActiveColumn(s.col)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                    active
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-border bg-surface text-text-2",
                  )}
                >
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{ background: s.color }}
                  />
                  <span className="max-w-[5.5rem] truncate">{s.label}</span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
                      active ? "bg-brand text-white" : "bg-surface-2 text-text-3",
                    )}
                  >
                    {s.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={goNext}
          disabled={columnIndex >= ORDER_BOARD_COLUMNS.length - 1}
          className="btn btn-ghost h-9 w-9 shrink-0 p-0 disabled:opacity-30"
          aria-label={bb.mobileNextStage}
        >
          <ChevronRight data-rtl-mirror="true" className="size-5" />
        </button>
      </div>

      <div className="shrink-0 flex items-center justify-between gap-2 rounded-lg border border-border bg-surface-2/50 px-3 py-2">
        <div className="min-w-0">
          <h3 className="text-[13px] font-semibold text-text truncate">
            {columnLabels[activeColumn] ?? activeColumn}
          </h3>
          <p className="text-[11px] text-text-3">
            {bb.activeCount.replace("{n}", String(totalOrders))}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold tabular-nums",
            orders.length ? "bg-brand/10 text-brand" : "bg-surface-2 text-text-3",
          )}
        >
          {orders.length}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain -mx-0.5 px-0.5">
        <div
          className={cn(
            "space-y-3 rounded-xl border p-2 min-h-[12rem]",
            isCancelled ? "border-red-500/20 bg-red-500/5" : "border-border bg-surface-2/40",
          )}
        >
          {orders.length === 0 ? (
            <p className="py-10 text-center text-[13px] text-text-3">{bb.emptyColumn}</p>
          ) : (
            orders.map((order) => (
              <BoardOrderCard
                key={order.order_id}
                order={order}
                bb={bb}
                columnLabels={columnLabels}
                onAdvance={onAdvance}
                onRevert={onRevert}
                loading={loading}
                canOpenDetail={canOpenDetail}
                canOverride={canOverride}
                canDrag={false}
                isDragging={false}
                touchMode
              />
            ))
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-border pt-2">
        <button
          type="button"
          onClick={() => setShowActivity((s) => !s)}
          className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-[12px] font-medium text-text-2 hover:bg-surface-2"
        >
          <span>{bb.activityTitle}</span>
          <span className="text-text-3">{showActivity ? "−" : "+"}</span>
        </button>
        {showActivity ? (
          <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-border bg-surface p-3">
            {activity.length === 0 ? (
              <p className="text-[11px] text-text-3">{bb.activityEmpty}</p>
            ) : (
              <ul className="space-y-2.5">
                {activity.slice(0, 8).map((ev) => (
                  <li key={ev.id} className="border-s-2 border-border ps-2.5">
                    <p className="text-[11px] text-text leading-snug">{ev.summary}</p>
                    <p className="text-[10px] text-text-3 mt-0.5">
                      {ev.actor_name ? `${ev.actor_name} · ` : ""}
                      {formatDateTime(ev.occurred_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
