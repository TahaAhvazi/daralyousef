import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Columns3, RefreshCw, Search, UserRound } from "lucide-react";
import toast from "react-hot-toast";

import { BoardRevertReasonModal } from "@/components/orders/BoardRevertReasonModal";
import {
  BoardOrderCard,
  boardOrderIsMine,
  boardOrderIsOverdue,
  boardOrderMatchesQuery,
} from "@/components/orders/BoardOrderCard";
import { MobileBoardView } from "@/components/orders/MobileBoardView";
import { departmentsApi, ordersApi } from "@/api/modules";
import { BoardCanvas, columnAtPoint } from "@/components/orders/BoardCanvas";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { PagePanel } from "@/components/layout/PagePanel";
import { Input, Select } from "@/components/ui/Input";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import {
  canOpenOrderDetail,
  canChangeOrderPaidStatus,
  canOverrideProductionWorkflow,
  canViewOrderList,
} from "@/lib/permissions";
import {
  ORDER_BOARD_COLUMNS,
  WORKFLOW_BOARD_STAGES,
  canDropOnBoardColumn,
  isBackwardBoardMove,
  isEnteringProduction,
} from "@/lib/workflow";
import { useAuthStore } from "@/store/auth";
import { useT } from "@/i18n/useT";
import { departmentLabel } from "@/i18n/labels";
import type { WorkflowBoardOrder } from "@/types/api";

const COLUMN_WIDTH = 272;
const COLUMN_GAP = 12;
const BOARD_CONTENT_WIDTH = ORDER_BOARD_COLUMNS.length * (COLUMN_WIDTH + COLUMN_GAP) - COLUMN_GAP + 32;

type CardDragState = {
  orderId: number;
  fromColumn: string;
  x: number;
  y: number;
  order: WorkflowBoardOrder;
};

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

function DragGhost({ order, x, y }: { order: WorkflowBoardOrder; x: number; y: number }) {
  return (
    <div
      className="pointer-events-none fixed z-[9999] w-[250px] rotate-2 rounded-xl border-2 border-brand bg-surface p-3 opacity-95 shadow-xl"
      style={{ left: x, top: y, transform: "translate(-50%, -50%) rotate(2deg)" }}
    >
      <p className="truncate text-[12px] font-semibold text-text">{order.order_code}</p>
      {order.order_title ? (
        <p className="mt-0.5 truncate text-[11px] text-text-2">{order.order_title}</p>
      ) : null}
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-brand" style={{ width: `${order.progress_pct}%` }} />
      </div>
    </div>
  );
}

function StatsDonut({
  total,
  byColumn,
  columnLabels,
}: {
  total: number;
  byColumn: Record<string, number>;
  columnLabels: Record<string, string>;
}) {
  const segments = useMemo(() => {
    if (total === 0) return [];
    return ORDER_BOARD_COLUMNS.filter((c) => c !== "cancelled" && (byColumn[c] ?? 0) > 0).map((col) => ({
      col,
      count: byColumn[col] ?? 0,
      pct: Math.round(((byColumn[col] ?? 0) / total) * 100),
      color: STAT_COLORS[col] ?? "#94a3b8",
    }));
  }, [byColumn, total]);

  let cursor = 0;
  const gradient =
    segments.length === 0
      ? "conic-gradient(#e2e8f0 0deg 360deg)"
      : `conic-gradient(${segments
          .map((s) => {
            const start = cursor;
            cursor += (s.count / total) * 360;
            return `${s.color} ${start}deg ${cursor}deg`;
          })
          .join(", ")})`;

  return (
    <div className="flex items-start gap-3">
      <div className="relative size-[88px] shrink-0 rounded-full" style={{ background: gradient }}>
        <div className="absolute inset-[14px] flex flex-col items-center justify-center rounded-full bg-surface">
          <span className="text-lg font-bold leading-none text-text">{total}</span>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-1">
        {segments.slice(0, 6).map((s) => (
          <li key={s.col} className="flex min-w-0 items-center gap-1.5 text-[10px]">
            <span className="size-2 shrink-0 rounded-full" style={{ background: s.color }} />
            <span className="flex-1 truncate text-text-2">{columnLabels[s.col] ?? s.col}</span>
            <span className="shrink-0 text-text-3">{s.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function OrderBoardPage() {
  const { t } = useT();
  const bb = t.staffUi.orderBoard;
  const columnLabels = bb.columns as Record<string, string>;
  const priorityLabels = t.staffUi.priorities as Record<string, string>;
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canOpenDetail = canOpenOrderDetail(user);
  const canOverride = canOverrideProductionWorkflow(user);
  const canChangePaid = canChangeOrderPaidStatus(user);
  const canDrag =
    canOverride ||
    !!user?.permissions?.some((p) =>
      ["production:update", "orders:admin", "orders:update", "*"].includes(p),
    );
  const [deptSlug, setDeptSlug] = useState("");
  const [search, setSearch] = useState("");
  const [mineOnly, setMineOnly] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [hideEmpty, setHideEmpty] = useState(false);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [draggingOrder, setDraggingOrder] = useState<WorkflowBoardOrder | null>(null);
  const [ghostPos, setGhostPos] = useState({ x: 0, y: 0 });
  const cardDragRef = useRef<CardDragState | null>(null);
  const [revertModal, setRevertModal] = useState<{ orderId: number; toColumn: string } | null>(null);

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: departmentsApi.list,
  });

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["workflow-board", deptSlug],
    queryFn: () => ordersApi.workflowBoard(deptSlug ? { department_slug: deptSlug } : undefined),
    refetchInterval: 30_000,
  });

  const ordersById = useMemo(() => {
    const map = new Map<number, WorkflowBoardOrder>();
    for (const col of Object.values(data?.columns ?? {})) {
      for (const o of col) map.set(o.order_id, o);
    }
    return map;
  }, [data]);

  const filteredColumns = useMemo(() => {
    const out: Record<string, WorkflowBoardOrder[]> = {};
    for (const col of ORDER_BOARD_COLUMNS) {
      out[col] = (data?.columns?.[col] ?? []).filter((o) => {
        if (!boardOrderMatchesQuery(o, search)) return false;
        if (mineOnly && !boardOrderIsMine(o, user?.id)) return false;
        if (overdueOnly && !boardOrderIsOverdue(o)) return false;
        return true;
      });
    }
    return out;
  }, [data?.columns, search, mineOnly, overdueOnly, user?.id]);

  const visibleColumns = useMemo(() => {
    if (!hideEmpty && !search.trim() && !mineOnly && !overdueOnly) return [...ORDER_BOARD_COLUMNS];
    if (!hideEmpty) return [...ORDER_BOARD_COLUMNS];
    return ORDER_BOARD_COLUMNS.filter((c) => (filteredColumns[c]?.length ?? 0) > 0);
  }, [hideEmpty, search, mineOnly, overdueOnly, filteredColumns]);

  const boardWidth =
    Math.max(visibleColumns.length, 1) * (COLUMN_WIDTH + COLUMN_GAP) - COLUMN_GAP + 32;

  const filteredTotal = useMemo(
    () => Object.values(filteredColumns).reduce((sum, rows) => sum + rows.length, 0),
    [filteredColumns],
  );

  const mineCount = useMemo(() => {
    let n = 0;
    for (const rows of Object.values(data?.columns ?? {})) {
      for (const o of rows) if (boardOrderIsMine(o, user?.id)) n += 1;
    }
    return n;
  }, [data?.columns, user?.id]);

  const overdueCount = useMemo(() => {
    let n = 0;
    for (const rows of Object.values(data?.columns ?? {})) {
      for (const o of rows) if (boardOrderIsOverdue(o)) n += 1;
    }
    return n;
  }, [data?.columns]);

  const move = useMutation({
    mutationFn: ({ orderId, toColumn, notes }: { orderId: number; toColumn: string; notes?: string }) =>
      ordersApi.boardMove(orderId, toColumn, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflow-board"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["order"] });
      setRevertModal(null);
      toast.success(bb.moved);
    },
    onError: () => {
      /* translated toast shown by http interceptor */
    },
  });

  const requestMove = (orderId: number, toColumn: string, notes?: string) => {
    const order = ordersById.get(orderId);
    if (!order) return;
    if (order.board_column === toColumn) return;
    if (!canDropOnBoardColumn(order, toColumn, canOverride, canChangePaid)) {
      if (isEnteringProduction(order.board_column, toColumn)) {
        const stageLabel = columnLabels[toColumn] ?? toColumn;
        if ((order.skipped_stages ?? []).includes(toColumn)) {
          toast.error(bb.stageMarkedNa.replace("{stage}", stageLabel), { duration: 5000 });
        } else {
          toast.error(bb.stageNoAssignees.replace("{stage}", stageLabel), { duration: 5000 });
        }
      } else {
        toast.error(bb.stageNotApplicable);
      }
      return;
    }

    const backward = isBackwardBoardMove(order.board_column, toColumn);
    if (backward) {
      if (!order.can_revert && !canOverride) {
        toast.error(order.read_only_reason || bb.moveFailed);
        return;
      }
      if (order.revert_requires_reason && !canOverride && !notes?.trim()) {
        setRevertModal({ orderId, toColumn });
        return;
      }
    } else if (
      (WORKFLOW_BOARD_STAGES as readonly string[]).includes(toColumn) &&
      !canOverride &&
      !order.can_advance
    ) {
      toast.error(order.read_only_reason || bb.moveFailed);
      return;
    }

    move.mutate({ orderId, toColumn, notes });
  };

  const totalOrders = data?.stats?.total ?? 0;
  const byColumn = data?.stats?.by_column ?? {};
  const activity = data?.recent_activity ?? [];

  const handleDrop = (column: string, orderId: number) => {
    requestMove(orderId, column);
  };

  const startCardDrag = (e: ReactPointerEvent<HTMLDivElement>, order: WorkflowBoardOrder) => {
    if (!canDrag) return;
    const drag: CardDragState = {
      orderId: order.order_id,
      fromColumn: order.board_column,
      x: e.clientX,
      y: e.clientY,
      order,
    };
    cardDragRef.current = drag;
    setGhostPos({ x: e.clientX, y: e.clientY });
    setDraggingOrder(order);
    setDraggingId(order.order_id);
  };

  useEffect(() => {
    if (!draggingOrder) return;

    const onMove = (e: globalThis.PointerEvent) => {
      setGhostPos({ x: e.clientX, y: e.clientY });
      setDropTarget(columnAtPoint(e.clientX, e.clientY));
      if (cardDragRef.current) {
        cardDragRef.current = { ...cardDragRef.current, x: e.clientX, y: e.clientY };
      }
    };

    const onUp = (e: globalThis.PointerEvent) => {
      const d = cardDragRef.current;
      const col = columnAtPoint(e.clientX, e.clientY);
      if (d && col) handleDrop(col, d.orderId);
      cardDragRef.current = null;
      setDraggingOrder(null);
      setDropTarget(null);
      setDraggingId(null);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    document.body.style.cursor = "grabbing";
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      document.body.style.cursor = "";
    };
  }, [draggingOrder]);

  return (
    <PagePanel className="!gap-2 h-full min-h-0">
      <PageHeader
        className="!mb-1 shrink-0"
        actionsClassName="w-full gap-1.5 lg:w-auto"
        title={bb.title}
        description={bb.description}
        actions={
          <>
            <Select
              className="!h-8 w-full !text-[12px] sm:w-[10.5rem] sm:max-w-[10.5rem]"
              value={deptSlug}
              onChange={(e) => setDeptSlug((e.target as HTMLSelectElement).value)}
              options={[
                { value: "", label: bb.allDepartments },
                ...(departments ?? []).map((d) => ({
                  value: d.slug,
                  label: departmentLabel(d, t),
                })),
              ]}
            />
            <Button
              variant="secondary"
              onClick={() => refetch()}
              loading={isFetching}
              title={bb.refresh}
              className="!h-8 !px-2 shrink-0"
            >
              <RefreshCw className="size-4" />
            </Button>
            {canViewOrderList(user) ? (
              <Link
                to="/app/orders"
                className="btn btn-secondary !h-8 !px-2 shrink-0"
                title={bb.listView}
              >
                <Columns3 className="size-4" />
              </Link>
            ) : null}
          </>
        }
      />

      <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-text-3" />
          <Input
            className="!h-9 !ps-8 !text-[12.5px]"
            placeholder={bb.searchPh}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMineOnly((v) => !v)}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[12px] font-medium transition-colors",
              mineOnly
                ? "border-brand bg-brand/10 text-brand"
                : "border-border bg-surface text-text-2 hover:bg-surface-2",
            )}
          >
            <UserRound className="size-3.5" />
            {bb.filterMine}
            {mineCount > 0 ? (
              <span className="rounded-full bg-surface-2 px-1.5 text-[10px] tabular-nums text-text-3">
                {mineCount}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setOverdueOnly((v) => !v)}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[12px] font-medium transition-colors",
              overdueOnly
                ? "border-danger bg-danger/10 text-danger"
                : "border-border bg-surface text-text-2 hover:bg-surface-2",
            )}
          >
            <AlertTriangle className="size-3.5" />
            {bb.filterOverdue}
            {overdueCount > 0 ? (
              <span className="rounded-full bg-surface-2 px-1.5 text-[10px] tabular-nums text-text-3">
                {overdueCount}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setHideEmpty((v) => !v)}
            className={cn(
              "hidden h-9 items-center rounded-full border px-3 text-[12px] font-medium transition-colors lg:inline-flex",
              hideEmpty
                ? "border-brand bg-brand/10 text-brand"
                : "border-border bg-surface text-text-2 hover:bg-surface-2",
            )}
          >
            {bb.hideEmpty}
          </button>
        </div>
        {(search.trim() || mineOnly || overdueOnly) && (
          <p className="text-[11px] text-text-3 sm:ms-auto">
            {bb.showingCount
              .replace("{shown}", String(filteredTotal))
              .replace("{total}", String(totalOrders))}
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="text-sm text-text-3">{bb.loading}</div>
      ) : (
        <>
          <MobileBoardView
            columns={data?.columns ?? {}}
            columnLabels={columnLabels}
            bb={bb}
            activity={activity}
            totalOrders={totalOrders}
            byColumn={byColumn}
            onAdvance={(id, toColumn) => requestMove(id, toColumn)}
            onRevert={(id, toColumn) => requestMove(id, toColumn)}
            loading={move.isPending}
            canOpenDetail={canOpenDetail}
            canOverride={canOverride}
            currentUserId={user?.id}
            search={search}
            mineOnly={mineOnly}
            overdueOnly={overdueOnly}
            priorityLabels={priorityLabels}
          />

          <div className="hidden min-h-0 flex-1 gap-0 overflow-hidden lg:flex">
            <BoardCanvas
              className="min-h-0 min-w-0 flex-1"
              contentWidth={boardWidth}
              cardDragging={!!draggingOrder}
              labels={{
                zoomIn: bb.zoomIn,
                zoomOut: bb.zoomOut,
                resetZoom: bb.resetZoom,
                fitView: bb.fitView,
                zoomPct: bb.zoomPct,
                panHint: bb.panHint,
                enterFullscreen: bb.enterFullscreen,
                exitFullscreen: bb.exitFullscreen,
              }}
            >
              <div className="flex gap-3 p-4" style={{ width: boardWidth }}>
                {visibleColumns.map((col) => {
                  const orders = filteredColumns[col] ?? [];
                  const isDropTarget = dropTarget === col;
                  const isCancelled = col === "cancelled";
                  return (
                    <div
                      key={col}
                      className={cn("flex shrink-0 flex-col", isCancelled && "opacity-90")}
                      style={{ width: COLUMN_WIDTH }}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <span
                            className="size-2 shrink-0 rounded-full"
                            style={{ background: STAT_COLORS[col] ?? "#94a3b8" }}
                          />
                          <h3 className="truncate text-[12px] font-semibold text-text">
                            {columnLabels[col] ?? col}
                          </h3>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                            orders.length ? "bg-brand/10 text-brand" : "bg-surface-2 text-text-3",
                          )}
                        >
                          {orders.length}
                        </span>
                      </div>
                      <div
                        data-board-drop={col}
                        className={cn(
                          "min-h-[640px] space-y-2.5 rounded-xl border p-2 transition-colors",
                          isDropTarget
                            ? "border-dashed border-brand bg-brand/10 ring-2 ring-brand/25"
                            : isCancelled
                              ? "border-red-500/20 bg-red-500/5"
                              : "border-border/60 bg-surface-2/60",
                        )}
                      >
                        {orders.length === 0 ? (
                          <p className="py-8 text-center text-[11px] text-text-3">{bb.emptyColumn}</p>
                        ) : (
                          orders.map((order) => (
                            <BoardOrderCard
                              key={order.order_id}
                              order={order}
                              bb={bb}
                              columnLabels={columnLabels}
                              priorityLabels={priorityLabels}
                              onAdvance={(id, toColumn) => requestMove(id, toColumn)}
                              onRevert={(id, toColumn) => requestMove(id, toColumn)}
                              loading={move.isPending}
                              canOpenDetail={canOpenDetail}
                              canOverride={canOverride}
                              canDrag={canDrag}
                              isDragging={draggingId === order.order_id}
                              onPointerDragStart={startCardDrag}
                              currentUserId={user?.id}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </BoardCanvas>

            <aside className="ml-3 hidden h-full min-h-0 w-[280px] shrink-0 flex-col border-l border-border bg-surface/40 pl-3 xl:flex">
              <div className="flex h-full min-h-0 flex-col gap-3 py-0.5">
                <div className="shrink-0 rounded-xl border border-border bg-surface p-4 shadow-soft">
                  <h3 className="mb-1 text-sm font-semibold text-text">{bb.statsTitle}</h3>
                  <p className="mb-3 text-[11px] text-text-3">
                    {bb.totalOrders} · {bb.activeCount.replace("{n}", String(totalOrders))}
                  </p>
                  <StatsDonut total={totalOrders} byColumn={byColumn} columnLabels={columnLabels} />
                </div>

                <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-soft">
                  <div className="shrink-0 border-b border-border/60 px-4 pb-2 pt-4">
                    <h3 className="text-sm font-semibold text-text">{bb.activityTitle}</h3>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
                    {activity.length === 0 ? (
                      <p className="text-[11px] text-text-3">{bb.activityEmpty}</p>
                    ) : (
                      <ul className="space-y-3">
                        {activity.map((ev) => (
                          <li key={ev.id} className="relative border-l-2 border-border pl-3">
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
                </div>
              </div>
            </aside>
          </div>
        </>
      )}

      {draggingOrder ? <DragGhost order={draggingOrder} x={ghostPos.x} y={ghostPos.y} /> : null}

      <BoardRevertReasonModal
        open={!!revertModal}
        title={bb.revertTitle}
        description={bb.revertDescription}
        reasonLabel={bb.revertReasonLabel}
        reasonPlaceholder={bb.revertReasonPlaceholder}
        confirmLabel={bb.revertConfirm}
        cancelLabel={t.staffUi.common.cancel}
        loading={move.isPending}
        onCancel={() => setRevertModal(null)}
        onConfirm={(reason) => {
          if (revertModal) requestMove(revertModal.orderId, revertModal.toColumn, reason);
        }}
      />
    </PagePanel>
  );
}
