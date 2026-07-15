import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  ExternalLink,
  GripVertical,
  User,
} from "lucide-react";
import type { PointerEvent as ReactPointerEvent } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import {
  WORKFLOW_ASSIGNMENT_STAGES,
  WORKFLOW_BOARD_STAGES,
} from "@/lib/workflow";
import type { Dict } from "@/i18n/messages";
import type { WorkflowBoardOrder } from "@/types/api";

const PRIORITY_BORDER: Record<string, string> = {
  urgent: "border-s-red-500",
  high: "border-s-orange-500",
  normal: "border-s-blue-500",
  low: "border-s-emerald-500",
};

const PRIORITY_VARIANT: Record<string, "danger" | "warning" | "info" | "success" | "default"> = {
  urgent: "danger",
  high: "warning",
  normal: "info",
  low: "success",
};

function isOverdue(deadline?: string | null, column?: string) {
  if (!deadline) return false;
  if (column === "completed" || column === "cancelled") return false;
  const day = deadline.slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  return day < today;
}

function isMine(order: WorkflowBoardOrder, userId?: number | null) {
  if (!userId) return false;
  if (order.stage_assignee_ids?.includes(userId)) return true;
  if (order.stage_assignee_id === userId) return true;
  return false;
}

function ProgressBar({ pct, label }: { pct: number; label: string }) {
  return (
    <div className="mb-2.5">
      <div className="mb-1 flex items-center justify-between text-[11px] text-text-3">
        <span>{label}</span>
        <span className="tabular-nums font-medium text-text-2">{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-brand transition-all"
          style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
        />
      </div>
    </div>
  );
}

function StageTrack({
  order,
  columnLabels,
}: {
  order: WorkflowBoardOrder;
  columnLabels: Record<string, string>;
}) {
  if (!(WORKFLOW_BOARD_STAGES as readonly string[]).includes(order.board_column)) return null;
  const skipped = new Set(order.skipped_stages ?? []);
  const enabled = new Set(order.enabled_stages ?? WORKFLOW_ASSIGNMENT_STAGES);

  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {WORKFLOW_ASSIGNMENT_STAGES.map((s) => {
        const isSkipped = skipped.has(s);
        const isCurrent = order.workflow_status === s;
        const short = (columnLabels[s] ?? s).slice(0, 3);
        return (
          <span
            key={s}
            title={columnLabels[s] ?? s}
            className={cn(
              "rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              isSkipped && "bg-surface-2/60 text-text-3 line-through opacity-50",
              !isSkipped && enabled.has(s) && !isCurrent && "bg-surface-2 text-text-2",
              isCurrent && !isSkipped && "bg-brand text-white shadow-soft",
            )}
          >
            {short}
          </span>
        );
      })}
    </div>
  );
}

function AssigneeLine({ names, unassigned }: { names: string[]; unassigned: string }) {
  if (names.length === 0) {
    return <span className="truncate text-text-3">{unassigned}</span>;
  }
  const shown = names.slice(0, 2).join(", ");
  const extra = names.length - 2;
  return (
    <span className="truncate" title={names.join(", ")}>
      {shown}
      {extra > 0 ? ` +${extra}` : ""}
    </span>
  );
}

export function boardOrderMatchesQuery(order: WorkflowBoardOrder, q: string) {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return (
    order.order_code.toLowerCase().includes(needle) ||
    (order.order_title ?? "").toLowerCase().includes(needle) ||
    (order.items_summary ?? "").toLowerCase().includes(needle) ||
    (order.stage_assignee_names ?? []).some((n) => n.toLowerCase().includes(needle)) ||
    (order.stage_assignee_name ?? "").toLowerCase().includes(needle)
  );
}

export function boardOrderIsMine(order: WorkflowBoardOrder, userId?: number | null) {
  return isMine(order, userId);
}

export function boardOrderIsOverdue(order: WorkflowBoardOrder) {
  return isOverdue(order.order_deadline, order.board_column);
}

export function BoardOrderCard({
  order,
  onAdvance,
  onRevert,
  loading,
  canOpenDetail,
  canOverride,
  canDrag,
  isDragging,
  onPointerDragStart,
  bb,
  columnLabels,
  priorityLabels,
  touchMode = false,
  currentUserId,
}: {
  order: WorkflowBoardOrder;
  onAdvance: (orderId: number, toColumn: string) => void;
  onRevert: (orderId: number, toColumn: string) => void;
  loading: boolean;
  canOpenDetail: boolean;
  canOverride: boolean;
  canDrag: boolean;
  isDragging: boolean;
  onPointerDragStart?: (e: ReactPointerEvent<HTMLDivElement>, order: WorkflowBoardOrder) => void;
  bb: Dict["staffUi"]["orderBoard"];
  columnLabels: Record<string, string>;
  priorityLabels: Record<string, string>;
  touchMode?: boolean;
  currentUserId?: number | null;
}) {
  const nextCol =
    order.next_status && (WORKFLOW_BOARD_STAGES as readonly string[]).includes(order.next_status)
      ? order.next_status
      : null;
  const prevCol = order.prev_column;
  const canAdvance = canOverride || (!!order.can_advance && !!nextCol);
  const canRevert = (canOverride || !!order.can_revert) && !!prevCol;
  const overdue = isOverdue(order.order_deadline, order.board_column);
  const mine = isMine(order, currentUserId);
  const border = PRIORITY_BORDER[order.order_priority] ?? PRIORITY_BORDER.normal;
  const priorityVariant = PRIORITY_VARIANT[order.order_priority] ?? "default";
  const priorityLabel = priorityLabels[order.order_priority] ?? order.order_priority;
  const sourceLabel = order.placed_via === "portal" ? bb.sourcePortal : bb.sourceStaff;
  const assigneeNames =
    order.stage_assignee_names && order.stage_assignee_names.length > 0
      ? order.stage_assignee_names
      : order.stage_assignee_name
        ? [order.stage_assignee_name]
        : [];

  const codeEl = canOpenDetail ? (
    <Link
      to={`/app/orders/${order.order_id}`}
      className={cn(
        "block truncate font-semibold text-text hover:text-brand",
        touchMode ? "text-[15px]" : "text-[13px]",
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {order.order_code}
    </Link>
  ) : (
    <span className={cn("block truncate font-semibold text-text", touchMode ? "text-[15px]" : "text-[13px]")}>
      {order.order_code}
    </span>
  );

  return (
    <div
      data-board-card={touchMode ? undefined : true}
      onPointerDown={(e) => {
        if (touchMode || !canDrag || e.button !== 0) return;
        if ((e.target as HTMLElement).closest("a, button")) return;
        e.stopPropagation();
        onPointerDragStart?.(e, order);
      }}
      className={cn(
        "min-w-0 rounded-xl border border-border border-s-[3px] bg-surface shadow-soft transition-all",
        border,
        touchMode ? "p-3.5" : "select-none p-3 hover:shadow-md",
        !touchMode && canDrag && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-40 ring-2 ring-brand/30",
        overdue && "bg-danger/[0.03]",
        mine && !overdue && "bg-brand/[0.03]",
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {!touchMode && canDrag ? (
              <GripVertical className="size-3.5 shrink-0 text-text-3 opacity-60" aria-hidden />
            ) : null}
            <div className="min-w-0 flex-1">{codeEl}</div>
          </div>
          {order.order_title ? (
            <p
              className={cn(
                "mt-0.5 truncate font-medium text-text",
                touchMode ? "text-[13px]" : "text-[12px]",
              )}
            >
              {order.order_title}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {mine ? (
            <Badge variant="brand" className="!text-[10px] !px-1.5 !py-0">
              {bb.mineBadge}
            </Badge>
          ) : null}
          {overdue ? (
            <Badge variant="danger" className="!text-[10px] !px-1.5 !py-0">
              {bb.overdueBadge}
            </Badge>
          ) : null}
        </div>
      </div>

      <ProgressBar pct={order.progress_pct} label={bb.progressLabel} />

      {order.items_summary ? (
        <p
          className={cn(
            "line-clamp-2 leading-relaxed text-text-2",
            touchMode ? "text-[12.5px]" : "text-[11.5px]",
          )}
        >
          {order.items_summary}
        </p>
      ) : null}

      <StageTrack order={order} columnLabels={columnLabels} />

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <Badge variant={priorityVariant} className="!text-[10px]">
          {priorityLabel}
        </Badge>
        <span
          className={cn(
            "rounded-md bg-surface-2 px-1.5 py-0.5 text-text-3",
            touchMode ? "text-[11px]" : "text-[10px]",
          )}
        >
          {sourceLabel}
        </span>
      </div>

      <div
        className={cn(
          "mt-2.5 flex items-start justify-between gap-2 text-text-2",
          touchMode ? "text-[12px]" : "text-[11px]",
        )}
      >
        <div className="min-w-0 space-y-1">
          {order.order_deadline ? (
            <span
              className={cn(
                "inline-flex items-center gap-1",
                overdue && "font-semibold text-danger",
              )}
            >
              <Calendar className="size-3.5 shrink-0" />
              <span className="truncate">
                {bb.dueLabel}: {formatDate(order.order_deadline)}
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-text-3">
              <Calendar className="size-3.5 shrink-0" />
              {bb.noDeadline}
            </span>
          )}
          <span className="flex items-center gap-1 text-text-3">
            <User className="size-3.5 shrink-0" />
            <AssigneeLine names={assigneeNames} unassigned={bb.unassigned} />
          </span>
        </div>
        <span className="shrink-0 rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] tabular-nums text-text-3">
          {bb.itemCount.replace("{n}", String(order.item_count))}
        </span>
      </div>

      {order.read_only_reason && !canOverride ? (
        <p className="mt-2 rounded-lg border border-amber-500/25 bg-amber-500/5 px-2 py-1.5 text-[11px] leading-snug text-amber-700 dark:text-amber-400">
          {order.read_only_reason}
        </p>
      ) : null}

      {touchMode ? (
        <div className="mt-3 flex flex-col gap-2">
          {nextCol && canAdvance ? (
            <Button
              size="sm"
              variant="primary"
              className="w-full !h-11 justify-center !text-[13px]"
              loading={loading}
              icon={<ArrowRight data-rtl-mirror="true" className="size-4" />}
              onClick={() => onAdvance(order.order_id, nextCol)}
            >
              {bb.moveForward.replace("{stage}", columnLabels[nextCol] ?? nextCol)}
            </Button>
          ) : null}
          {prevCol && canRevert ? (
            <Button
              size="sm"
              variant="secondary"
              className="w-full !h-10 justify-center !text-[12px]"
              loading={loading}
              icon={<ArrowLeft data-rtl-mirror="true" className="size-3.5" />}
              onClick={() => onRevert(order.order_id, prevCol)}
            >
              {bb.moveBack.replace("{stage}", columnLabels[prevCol] ?? prevCol)}
            </Button>
          ) : null}
          {canOpenDetail ? (
            <Link to={`/app/orders/${order.order_id}`} className="w-full">
              <Button size="sm" variant="ghost" className="w-full !h-10 !text-[12px]">
                <ExternalLink className="size-4" />
                {bb.openOrder}
              </Button>
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="mt-2.5 flex flex-col gap-1.5">
          {nextCol && canAdvance ? (
            <Button
              size="sm"
              variant="primary"
              className="w-full !h-8 justify-center !text-[11px]"
              loading={loading}
              onClick={() => onAdvance(order.order_id, nextCol)}
            >
              → {columnLabels[nextCol] ?? nextCol}
            </Button>
          ) : null}
          <div className="flex items-center gap-1">
            {prevCol && canRevert ? (
              <Button
                size="sm"
                variant="secondary"
                className="!h-7 flex-1 !px-2 !text-[10px]"
                loading={loading}
                title={columnLabels[prevCol] ?? prevCol}
                onClick={() => onRevert(order.order_id, prevCol)}
              >
                ← {columnLabels[prevCol] ?? prevCol}
              </Button>
            ) : (
              <span className="flex-1" />
            )}
            {canOpenDetail ? (
              <Link to={`/app/orders/${order.order_id}`} className="shrink-0">
                <Button size="sm" variant="ghost" className="!h-7 !px-2" title={bb.openOrder}>
                  <ExternalLink className="size-3.5" />
                </Button>
              </Link>
            ) : null}
          </div>
        </div>
      )}

      {canDrag && !touchMode ? (
        <p className="mt-1.5 text-center text-[9px] text-text-3 opacity-70">{bb.dragHint}</p>
      ) : null}
    </div>
  );
}
