import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/cn";
import { ORDER_BOARD_COLUMNS } from "@/lib/workflow";
import { formatDateTime } from "@/lib/format";
import type { WorkflowBoardOrder } from "@/types/api";
import type { Dict } from "@/i18n/messages";

import {
  BoardOrderCard,
  boardOrderIsMine,
  boardOrderIsOverdue,
  boardOrderMatchesQuery,
} from "./BoardOrderCard";

const STAT_COLORS: Record<string, string> = {
  intake: "#6366f1",
  approval: "#8b5cf6",
  confirmed: "#3b82f6",
  paid: "#10b981",
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
  currentUserId,
  search,
  mineOnly,
  overdueOnly,
  priorityLabels,
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
  currentUserId?: number | null;
  search: string;
  mineOnly: boolean;
  overdueOnly: boolean;
  priorityLabels: Record<string, string>;
}) {
  const filteredColumns = useMemo(() => {
    const out: Record<string, WorkflowBoardOrder[]> = {};
    for (const col of ORDER_BOARD_COLUMNS) {
      out[col] = (columns[col] ?? []).filter((o) => {
        if (!boardOrderMatchesQuery(o, search)) return false;
        if (mineOnly && !boardOrderIsMine(o, currentUserId)) return false;
        if (overdueOnly && !boardOrderIsOverdue(o)) return false;
        return true;
      });
    }
    return out;
  }, [columns, search, mineOnly, overdueOnly, currentUserId]);

  const filteredCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const col of ORDER_BOARD_COLUMNS) {
      counts[col] = filteredColumns[col]?.length ?? 0;
    }
    return counts;
  }, [filteredColumns]);

  const preferred =
    ORDER_BOARD_COLUMNS.find((c) => (filteredCounts[c] ?? 0) > 0) ??
    ORDER_BOARD_COLUMNS.find((c) => (byColumn[c] ?? 0) > 0) ??
    ORDER_BOARD_COLUMNS[0];

  const [activeColumn, setActiveColumn] = useState(preferred);
  const [showActivity, setShowActivity] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if ((filteredCounts[activeColumn] ?? 0) > 0) return;
    const next = ORDER_BOARD_COLUMNS.find((c) => (filteredCounts[c] ?? 0) > 0);
    if (next) setActiveColumn(next);
  }, [filteredCounts, activeColumn]);

  useEffect(() => {
    if (!mineOnly && !overdueOnly && !search.trim()) return;
    const next = ORDER_BOARD_COLUMNS.find((c) => (filteredCounts[c] ?? 0) > 0);
    if (next) setActiveColumn(next);
    // Jump once when filters change — filteredCounts intentionally excluded from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mineOnly, overdueOnly, search]);

  const columnIndex = ORDER_BOARD_COLUMNS.indexOf(activeColumn);
  const orders = filteredColumns[activeColumn] ?? [];
  const isCancelled = activeColumn === "cancelled";
  const visibleTotal = Object.values(filteredCounts).reduce((a, b) => a + b, 0);

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
        count: filteredCounts[col] ?? 0,
        color: STAT_COLORS[col] ?? "#94a3b8",
        label: columnLabels[col] ?? col,
      })),
    [filteredCounts, columnLabels],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 lg:hidden">
      <p className="shrink-0 px-0.5 text-[11px] text-text-3">{bb.mobileTapHint}</p>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={goPrev}
          disabled={columnIndex <= 0}
          className="btn btn-ghost h-10 w-10 shrink-0 p-0 disabled:opacity-30"
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
                    "flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-2 text-[11px] font-medium transition-colors",
                    active
                      ? "border-brand bg-brand/10 text-brand"
                      : "border-border bg-surface text-text-2",
                  )}
                >
                  <span className="size-2 shrink-0 rounded-full" style={{ background: s.color }} />
                  <span className="max-w-[6rem] truncate">{s.label}</span>
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
          className="btn btn-ghost h-10 w-10 shrink-0 p-0 disabled:opacity-30"
          aria-label={bb.mobileNextStage}
        >
          <ChevronRight data-rtl-mirror="true" className="size-5" />
        </button>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 shadow-soft">
        <div className="min-w-0">
          <h3 className="truncate text-[14px] font-semibold text-text">
            {columnLabels[activeColumn] ?? activeColumn}
          </h3>
          <p className="text-[11px] text-text-3">
            {bb.showingCount
              .replace("{shown}", String(visibleTotal))
              .replace("{total}", String(totalOrders))}
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

      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-0.5 -mx-0.5"
        onTouchStart={(e) => {
          const t = e.changedTouches[0];
          touchStart.current = t ? { x: t.clientX, y: t.clientY } : null;
        }}
        onTouchEnd={(e) => {
          const start = touchStart.current;
          touchStart.current = null;
          if (!start) return;
          const end = e.changedTouches[0];
          if (!end) return;
          const dx = end.clientX - start.x;
          const dy = end.clientY - start.y;
          if (Math.abs(dx) < 64 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
          if (dx < 0) goNext();
          else goPrev();
        }}
      >
        <div
          className={cn(
            "min-h-[12rem] space-y-3 rounded-xl border p-2.5",
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
                priorityLabels={priorityLabels}
                onAdvance={onAdvance}
                onRevert={onRevert}
                loading={loading}
                canOpenDetail={canOpenDetail}
                canOverride={canOverride}
                canDrag={false}
                isDragging={false}
                touchMode
                currentUserId={currentUserId}
              />
            ))
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-border pt-2">
        <button
          type="button"
          onClick={() => setShowActivity((s) => !s)}
          className="flex w-full items-center justify-between rounded-lg px-2 py-2.5 text-[12px] font-medium text-text-2 hover:bg-surface-2"
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
                    <p className="text-[11px] leading-snug text-text">{ev.summary}</p>
                    <p className="mt-0.5 text-[10px] text-text-3">
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
