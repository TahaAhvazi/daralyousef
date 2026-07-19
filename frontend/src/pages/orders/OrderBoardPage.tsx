import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Columns3,
  RefreshCw,
  Search,
  UserRound,
} from "lucide-react";
import toast from "react-hot-toast";

import { BoardRevertReasonModal } from "@/components/orders/BoardRevertReasonModal";
import {
  BoardOrderCard,
  boardOrderIsMine,
  boardOrderIsOverdue,
  boardOrderMatchesQuery,
} from "@/components/orders/BoardOrderCard";
import { columnAtPoint, columnAtPointFromZones, collectBoardDropZones } from "@/components/orders/BoardCanvas";
import { departmentsApi, ordersApi } from "@/api/modules";
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
  canStockCheckOrder,
  canViewOrderList,
} from "@/lib/permissions";
import {
  ORDER_BOARD_COLUMNS,
  WORKFLOW_BOARD_STAGES,
  canDropOnBoardColumn,
  isBackwardBoardMove,
  isEnteringProduction,
  type OrderBoardColumn,
} from "@/lib/workflow";
import { useAuthStore } from "@/store/auth";
import { useT } from "@/i18n/useT";
import { departmentLabel } from "@/i18n/labels";
import type { WorkflowBoardOrder } from "@/types/api";

const TERMINAL_COLUMNS = new Set(["completed", "cancelled"]);
const CARD_MIN_W = 236;
const CARD_H = 128;
const GRID_GAP = 12;

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

function useGridCols(ref: RefObject<HTMLElement | null>) {
  const [cols, setCols] = useState(2);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const w = el.clientWidth;
      setCols(Math.max(1, Math.floor((w + GRID_GAP) / (CARD_MIN_W + GRID_GAP))));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  return cols;
}

function DragGhost({
  order,
  ghostRef,
}: {
  order: WorkflowBoardOrder;
  ghostRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={ghostRef as RefObject<HTMLDivElement>}
      className="pointer-events-none fixed left-0 top-0 z-[9999] w-[220px] will-change-transform rounded-xl border-2 border-brand bg-surface p-2.5 opacity-95 shadow-xl"
      style={{ transform: "translate3d(-9999px, -9999px, 0)" }}
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
  const canStock = canStockCheckOrder(user);
  const canDrag =
    canOverride ||
    canStock ||
    !!user?.permissions?.some((p) =>
      ["production:update", "orders:admin", "orders:update", "*"].includes(p),
    );

  const [deptSlug, setDeptSlug] = useState("");
  const [search, setSearch] = useState("");
  const [mineOnly, setMineOnly] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [hideEmpty, setHideEmpty] = useState(true);
  const [showDone, setShowDone] = useState(false);
  const [activeStage, setActiveStage] = useState<OrderBoardColumn | "">("");
  const [revertModal, setRevertModal] = useState<{ orderId: number; toColumn: string } | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [draggingOrder, setDraggingOrder] = useState<WorkflowBoardOrder | null>(null);
  const cardDragRef = useRef<{ orderId: number } | null>(null);
  const ghostRef = useRef<HTMLDivElement | null>(null);
  const dropTargetRef = useRef<string | null>(null);
  const dragRafRef = useRef(0);
  const pendingPointerRef = useRef<{ x: number; y: number } | null>(null);
  const requestMoveRef = useRef<(orderId: number, toColumn: string, notes?: string) => void>(() => {});

  const gridRef = useRef<HTMLDivElement>(null);
  const cols = useGridCols(gridRef);

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: departmentsApi.list,
  });

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["workflow-board", deptSlug, showDone],
    queryFn: () =>
      ordersApi.workflowBoard({
        ...(deptSlug ? { department_slug: deptSlug } : {}),
        include_done: showDone,
      }),
    refetchInterval: draggingId ? false : 60_000,
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
      if (!showDone && TERMINAL_COLUMNS.has(col)) {
        out[col] = [];
        continue;
      }
      out[col] = (data?.columns?.[col] ?? []).filter((o) => {
        if (!boardOrderMatchesQuery(o, search)) return false;
        if (mineOnly && !boardOrderIsMine(o, user?.id)) return false;
        if (overdueOnly && !boardOrderIsOverdue(o)) return false;
        return true;
      });
    }
    return out;
  }, [data?.columns, search, mineOnly, overdueOnly, showDone, user?.id]);

  const allVisibleStages = useMemo(() => {
    return showDone
      ? [...ORDER_BOARD_COLUMNS]
      : ORDER_BOARD_COLUMNS.filter((c) => !TERMINAL_COLUMNS.has(c));
  }, [showDone]);

  const stageList = useMemo(() => {
    // While dragging, keep empty stages visible so they remain drop targets
    if (draggingOrder || !hideEmpty) return allVisibleStages;
    return allVisibleStages.filter((c) => (filteredColumns[c]?.length ?? 0) > 0);
  }, [hideEmpty, allVisibleStages, filteredColumns, draggingOrder]);

  useEffect(() => {
    if (!stageList.length) {
      setActiveStage("");
      return;
    }
    if (!activeStage || !stageList.includes(activeStage)) {
      setActiveStage(stageList[0]);
    }
  }, [stageList, activeStage]);

  const stageOrders = filteredColumns[activeStage] ?? [];

  // Reset scroll when stage or filters change
  useEffect(() => {
    if (gridRef.current) gridRef.current.scrollTop = 0;
  }, [activeStage, search, mineOnly, overdueOnly, showDone, deptSlug]);

  const filteredTotal = useMemo(
    () => Object.values(filteredColumns).reduce((sum, rows) => sum + rows.length, 0),
    [filteredColumns],
  );

  const activeTotal = useMemo(() => {
    let n = 0;
    for (const col of ORDER_BOARD_COLUMNS) {
      if (TERMINAL_COLUMNS.has(col)) continue;
      n += data?.columns?.[col]?.length ?? 0;
    }
    return n;
  }, [data?.columns]);

  const doneCount = useMemo(() => {
    const counts = data?.stats?.by_column ?? {};
    let n = 0;
    for (const col of TERMINAL_COLUMNS) n += counts[col] ?? 0;
    return n;
  }, [data?.stats?.by_column]);

  const mineCount = useMemo(() => {
    let n = 0;
    for (const col of ORDER_BOARD_COLUMNS) {
      if (!showDone && TERMINAL_COLUMNS.has(col)) continue;
      for (const o of data?.columns?.[col] ?? []) if (boardOrderIsMine(o, user?.id)) n += 1;
    }
    return n;
  }, [data?.columns, showDone, user?.id]);

  const overdueCount = useMemo(() => {
    let n = 0;
    for (const col of ORDER_BOARD_COLUMNS) {
      if (!showDone && TERMINAL_COLUMNS.has(col)) continue;
      for (const o of data?.columns?.[col] ?? []) if (boardOrderIsOverdue(o)) n += 1;
    }
    return n;
  }, [data?.columns, showDone]);

  const move = useMutation({
    mutationFn: ({ orderId, toColumn, notes }: { orderId: number; toColumn: string; notes?: string }) =>
      ordersApi.boardMove(orderId, toColumn, notes),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["workflow-board"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["order"] });
      setRevertModal(null);
      toast.success(bb.moved);
      if ((ORDER_BOARD_COLUMNS as readonly string[]).includes(vars.toColumn)) {
        setActiveStage(vars.toColumn as OrderBoardColumn);
      }
    },
    onError: () => {
      /* translated toast shown by http interceptor */
    },
  });

  const requestMove = useCallback((orderId: number, toColumn: string, notes?: string) => {
    const order = ordersById.get(orderId);
    if (!order) return;
    if (order.board_column === toColumn) return;
    if (!canDropOnBoardColumn(order, toColumn, canOverride, canChangePaid, canStock)) {
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
  }, [ordersById, canOverride, canChangePaid, canStock, columnLabels, bb, move]);

  requestMoveRef.current = requestMove;

  const startCardDrag = useCallback((e: ReactPointerEvent<HTMLDivElement>, order: WorkflowBoardOrder) => {
    if (!canDrag) return;
    // Avoid stealing clicks / text selection; only start after primary button
    if (e.button !== 0) return;
    cardDragRef.current = { orderId: order.order_id };
    dropTargetRef.current = null;
    pendingPointerRef.current = { x: e.clientX, y: e.clientY };
    setDropTarget(null);
    setDraggingOrder(order);
    setDraggingId(order.order_id);
  }, [canDrag]);

  useEffect(() => {
    if (!draggingOrder) return;

    // Snapshot drop zones once — stage rail rarely moves mid-drag
    let zones = collectBoardDropZones();
    let frames = 0;

    const hitTest = (x: number, y: number) => {
      // Refresh rects occasionally in case of scroll/layout shift
      if ((frames++ & 15) === 0) zones = collectBoardDropZones();
      return columnAtPointFromZones(x, y, zones) ?? columnAtPoint(x, y);
    };

    const flushPointer = () => {
      dragRafRef.current = 0;
      const p = pendingPointerRef.current;
      if (!p) return;

      const ghost = ghostRef.current;
      if (ghost) {
        ghost.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) translate(-50%, -50%) rotate(2deg)`;
      }

      const col = hitTest(p.x, p.y);
      if (col !== dropTargetRef.current) {
        dropTargetRef.current = col;
        setDropTarget(col);
      }
    };

    const onMove = (e: globalThis.PointerEvent) => {
      pendingPointerRef.current = { x: e.clientX, y: e.clientY };
      if (dragRafRef.current) return;
      dragRafRef.current = requestAnimationFrame(flushPointer);
    };

    const onUp = (e: globalThis.PointerEvent) => {
      if (dragRafRef.current) {
        cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = 0;
      }
      const d = cardDragRef.current;
      const col = hitTest(e.clientX, e.clientY);
      if (d && col) requestMoveRef.current(d.orderId, col);
      cardDragRef.current = null;
      dropTargetRef.current = null;
      pendingPointerRef.current = null;
      setDraggingOrder(null);
      setDropTarget(null);
      setDraggingId(null);
    };

    // Place ghost at initial pointer before first frame paints mid-screen
    flushPointer();

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
    return () => {
      if (dragRafRef.current) cancelAnimationFrame(dragRafRef.current);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [draggingOrder]);

  const totalOrders = data?.stats?.total ?? 0;
  const byColumn = data?.stats?.by_column ?? {};
  const activity = data?.recent_activity ?? [];
  const stageIndex = activeStage ? stageList.indexOf(activeStage) : -1;

  const goPrevStage = () => {
    if (stageIndex > 0) setActiveStage(stageList[stageIndex - 1]);
  };
  const goNextStage = () => {
    if (stageIndex >= 0 && stageIndex < stageList.length - 1) {
      setActiveStage(stageList[stageIndex + 1]);
    }
  };

  const renderStageChip = (col: OrderBoardColumn, variant: "mobile" | "desktop") => {
    const count = filteredColumns[col]?.length ?? 0;
    const active = col === activeStage;
    const isDrop = dropTarget === col;
    const canAccept =
      !!draggingOrder &&
      draggingOrder.board_column !== col &&
      canDropOnBoardColumn(draggingOrder, col, canOverride, canChangePaid, canStock);

    if (variant === "mobile") {
      return (
        <button
          key={col}
          type="button"
          data-board-drop={col}
          onClick={() => setActiveStage(col)}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-2 text-[11px] font-medium transition-colors",
            isDrop && canAccept
              ? "border-dashed border-brand bg-brand/15 text-brand ring-2 ring-brand/30"
              : isDrop && draggingOrder
                ? "border-dashed border-danger/50 bg-danger/5 text-danger"
                : active
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-border bg-surface text-text-2",
          )}
        >
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ background: STAT_COLORS[col] ?? "#94a3b8" }}
          />
          <span className="max-w-[6rem] truncate">{columnLabels[col] ?? col}</span>
          <span className="rounded-full bg-surface-2 px-1.5 text-[10px] tabular-nums">{count}</span>
        </button>
      );
    }

    return (
      <button
        key={col}
        type="button"
        data-board-drop={col}
        onClick={() => setActiveStage(col)}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-start transition-colors",
          isDrop && canAccept
            ? "bg-brand/15 text-brand ring-2 ring-dashed ring-brand/40"
            : isDrop && draggingOrder
              ? "bg-danger/8 text-danger ring-1 ring-dashed ring-danger/30"
              : active
                ? "bg-brand/10 text-brand ring-1 ring-brand/25"
                : "text-text-2 hover:bg-surface",
        )}
      >
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ background: STAT_COLORS[col] ?? "#94a3b8" }}
        />
        <span className="min-w-0 flex-1 truncate text-[12px] font-medium">
          {columnLabels[col] ?? col}
        </span>
        <span
          className={cn(
            "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
            count ? "bg-surface text-text" : "bg-surface/60 text-text-3",
          )}
        >
          {count}
        </span>
      </button>
    );
  };

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
              "inline-flex h-9 items-center rounded-full border px-3 text-[12px] font-medium transition-colors",
              hideEmpty
                ? "border-brand bg-brand/10 text-brand"
                : "border-border bg-surface text-text-2 hover:bg-surface-2",
            )}
          >
            {bb.hideEmpty}
          </button>
          <button
            type="button"
            onClick={() => setShowDone((v) => !v)}
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[12px] font-medium transition-colors",
              showDone
                ? "border-brand bg-brand/10 text-brand"
                : "border-border bg-surface text-text-2 hover:bg-surface-2",
            )}
          >
            {bb.showDone}
            {doneCount > 0 ? (
              <span className="rounded-full bg-surface-2 px-1.5 text-[10px] tabular-nums text-text-3">
                {doneCount}
              </span>
            ) : null}
          </button>
        </div>
        <p className="text-[11px] text-text-3 sm:ms-auto">
          {canDrag ? `${bb.dragHint} · ` : ""}
          {bb.showingCount
            .replace("{shown}", String(filteredTotal))
            .replace("{total}", String(showDone ? totalOrders : activeTotal))}
        </p>
      </div>

      {isLoading ? (
        <div className="text-sm text-text-3">{bb.loading}</div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-2 lg:flex-row lg:gap-3">
          <aside className="flex shrink-0 flex-col gap-1.5 lg:w-[11.5rem]">
            <div className="flex items-center gap-1 lg:hidden">
              <button
                type="button"
                onClick={goPrevStage}
                disabled={stageIndex <= 0}
                className="btn btn-ghost h-9 w-9 shrink-0 p-0 disabled:opacity-30"
                aria-label={bb.mobilePrevStage}
              >
                <ChevronLeft data-rtl-mirror="true" className="size-4" />
              </button>
              <div className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain">
                <div className="flex gap-1.5 pb-0.5">
                  {stageList.map((col) => renderStageChip(col, "mobile"))}
                </div>
              </div>
              <button
                type="button"
                onClick={goNextStage}
                disabled={stageIndex < 0 || stageIndex >= stageList.length - 1}
                className="btn btn-ghost h-9 w-9 shrink-0 p-0 disabled:opacity-30"
                aria-label={bb.mobileNextStage}
              >
                <ChevronRight data-rtl-mirror="true" className="size-4" />
              </button>
            </div>

            <nav
              className={cn(
                "hidden min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overscroll-contain rounded-xl border p-1.5 lg:flex",
                draggingOrder
                  ? "border-dashed border-brand/40 bg-brand/[0.03]"
                  : "border-border/60 bg-surface-2/40",
              )}
            >
              <p className="px-2 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-3">
                {draggingOrder ? bb.dragHint : bb.selectStage}
              </p>
              {stageList.length === 0 ? (
                <p className="px-2 py-4 text-[11px] text-text-3">{bb.emptyColumn}</p>
              ) : (
                stageList.map((col) => renderStageChip(col, "desktop"))
              )}
            </nav>
          </aside>

          <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-0.5">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: STAT_COLORS[activeStage] ?? "#94a3b8" }}
                />
                <h2 className="truncate text-[14px] font-semibold text-text">
                  {activeStage ? columnLabels[activeStage] ?? activeStage : bb.selectStage}
                </h2>
                <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium tabular-nums text-brand">
                  {stageOrders.length}
                </span>
              </div>
            </div>

            <div
              ref={gridRef}
              className={cn(
                "min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-xl border p-2.5",
                activeStage === "cancelled"
                  ? "border-red-500/20 bg-red-500/5"
                  : "border-border/60 bg-surface-2/40",
              )}
            >
              {stageOrders.length === 0 ? (
                <div className="flex h-full min-h-[12rem] items-center justify-center">
                  <p className="text-[13px] text-text-3">{bb.emptyColumn}</p>
                </div>
              ) : (
                <div
                  className="grid content-start gap-3"
                  style={{
                    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                  }}
                >
                  {stageOrders.map((order) => (
                    <div key={order.order_id} className="min-h-0" style={{ height: CARD_H }}>
                      <BoardOrderCard
                        order={order}
                        compact
                        bb={bb}
                        columnLabels={columnLabels}
                        priorityLabels={priorityLabels}
                        onAdvance={requestMove}
                        onRevert={requestMove}
                        loading={move.isPending}
                        canOpenDetail={canOpenDetail}
                        canOverride={canOverride}
                        canDrag={canDrag}
                        isDragging={draggingId === order.order_id}
                        onPointerDragStart={startCardDrag}
                        currentUserId={user?.id}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <aside className="ml-0 hidden h-full min-h-0 w-[240px] shrink-0 flex-col border-l border-border bg-surface/40 pl-3 xl:flex">
            <div className="flex h-full min-h-0 flex-col gap-3 py-0.5">
              <div className="shrink-0 rounded-xl border border-border bg-surface p-4 shadow-soft">
                <h3 className="mb-1 text-sm font-semibold text-text">{bb.statsTitle}</h3>
                <p className="mb-3 text-[11px] text-text-3">
                  {bb.totalOrders} · {bb.activeCount.replace("{n}", String(activeTotal))}
                </p>
                <StatsDonut
                  total={activeTotal || totalOrders}
                  byColumn={byColumn}
                  columnLabels={columnLabels}
                />
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
      )}

      {draggingOrder ? <DragGhost order={draggingOrder} ghostRef={ghostRef} /> : null}

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
