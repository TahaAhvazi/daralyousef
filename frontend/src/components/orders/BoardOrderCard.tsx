import { Link } from "react-router-dom";
import { Calendar, ExternalLink, MoreHorizontal, User } from "lucide-react";
import type { PointerEvent as ReactPointerEvent } from "react";

import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import {
  WORKFLOW_ASSIGNMENT_STAGES,
  WORKFLOW_BOARD_STAGES,
} from "@/lib/workflow";
import type { Dict } from "@/i18n/messages";
import type { WorkflowBoardOrder } from "@/types/api";

const STAGE_SHORT: Record<string, string> = {
  design: "D",
  printing: "P",
  production: "C",
  finishing: "F",
  delivery: "L",
};

const PRIORITY_BAR: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  normal: "bg-blue-500",
  low: "bg-emerald-500",
};

function ProgressBar({ pct, touchMode }: { pct: number; touchMode?: boolean }) {
  return (
    <div className={touchMode ? "mb-3" : "mb-2"}>
      <div className={cn("flex items-center justify-between text-text-3 mb-0.5", touchMode ? "text-[10px]" : "text-[9px]")}>
        <span>Progress</span>
        <span>{pct}%</span>
      </div>
      <div className={cn("rounded-full bg-surface-2 overflow-hidden", touchMode ? "h-1.5" : "h-1")}>
        <div
          className="h-full rounded-full bg-brand transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StagePills({ order }: { order: WorkflowBoardOrder }) {
  if (!(WORKFLOW_BOARD_STAGES as readonly string[]).includes(order.board_column)) return null;
  const skipped = new Set(order.skipped_stages ?? []);
  const enabled = new Set(order.enabled_stages ?? WORKFLOW_ASSIGNMENT_STAGES);
  return (
    <div className="flex flex-wrap gap-0.5 mt-1.5">
      {WORKFLOW_ASSIGNMENT_STAGES.map((s) => {
        const isSkipped = skipped.has(s);
        const isCurrent = order.workflow_status === s;
        return (
          <span
            key={s}
            title={s}
            className={cn(
              "text-[8px] font-semibold px-1 py-0.5 rounded",
              isSkipped && "opacity-35 line-through bg-surface-2 text-text-3",
              !isSkipped && enabled.has(s) && !isCurrent && "bg-surface-2 text-text-2",
              isCurrent && !isSkipped && "bg-brand text-white",
            )}
          >
            {STAGE_SHORT[s]}
          </span>
        );
      })}
    </div>
  );
}

function AssigneeAvatars({ names }: { names: string[] }) {
  const shown = names.slice(0, 3);
  const extra = names.length - shown.length;
  return (
    <div className="flex -space-x-1.5">
      {shown.map((name) => {
        const initial = (name?.trim()?.[0] ?? "?").toUpperCase();
        return (
          <span
            key={name}
            className="inline-flex size-5 items-center justify-center rounded-full bg-brand/15 text-[9px] font-semibold text-brand ring-2 ring-surface"
            title={name}
          >
            {initial}
          </span>
        );
      })}
      {extra > 0 ? (
        <span
          className="inline-flex size-5 items-center justify-center rounded-full bg-surface-2 text-[8px] font-semibold text-text-3 ring-2 ring-surface"
          title={names.slice(3).join(", ")}
        >
          +{extra}
        </span>
      ) : null}
    </div>
  );
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
  touchMode = false,
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
  touchMode?: boolean;
}) {
  const nextCol = order.next_status && (WORKFLOW_BOARD_STAGES as readonly string[]).includes(order.next_status)
    ? order.next_status
    : null;
  const prevCol = order.prev_column;
  const canAdvance = canOverride || (!!order.can_advance && !!nextCol);
  const canRevert = (canOverride || !!order.can_revert) && !!prevCol;
  const barColor = PRIORITY_BAR[order.order_priority] ?? PRIORITY_BAR.normal;
  const sourceLabel = order.placed_via === "portal" ? bb.sourcePortal : bb.sourceStaff;

  const codeEl = canOpenDetail ? (
    <Link
      to={`/app/orders/${order.order_id}`}
      className={cn(
        "font-semibold text-text hover:text-brand truncate block",
        touchMode ? "text-[14px]" : "text-[12px]",
      )}
    >
      {order.order_code}
    </Link>
  ) : (
    <span className={cn("font-semibold text-text truncate block", touchMode ? "text-[14px]" : "text-[12px]")}>
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
        "rounded-xl border border-border bg-surface shadow-soft transition-all min-w-0",
        touchMode ? "p-4" : "p-3 select-none hover:shadow-glow",
        !touchMode && canDrag && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-40 ring-2 ring-brand/30",
      )}
    >
      <div className="flex items-start justify-between gap-1 mb-2">
        <div className={cn("h-0.5 flex-1 rounded-full mt-1", barColor)} style={{ maxWidth: touchMode ? 64 : 48 }} />
        {!touchMode ? (
          <button type="button" className="text-text-3 hover:text-text p-0.5 -mt-1 -mr-1" tabIndex={-1}>
            <MoreHorizontal className="size-3.5" />
          </button>
        ) : null}
      </div>

      <ProgressBar pct={order.progress_pct} touchMode={touchMode} />

      <div className="min-w-0">
        {codeEl}
        {order.order_title ? (
          <p className={cn("font-medium text-text-2 mt-0.5 truncate", touchMode ? "text-[13px]" : "text-[11px]")}>
            {order.order_title}
          </p>
        ) : null}
        <p className={cn("text-text-3 line-clamp-2 mt-1 leading-relaxed", touchMode ? "text-[12px]" : "text-[10px]")}>
          {order.items_summary}
        </p>
      </div>

      <StagePills order={order} />

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <StatusBadge status={order.order_priority} />
        <span className={cn("px-1.5 py-0.5 rounded bg-surface-2 text-text-3", touchMode ? "text-[10px]" : "text-[9px]")}>
          {sourceLabel}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0 text-text-3">
          {order.order_deadline ? (
            <span className={cn("inline-flex items-center gap-0.5 truncate", touchMode ? "text-[11px]" : "text-[10px]")}>
              <Calendar className="size-3 shrink-0" />
              {formatDate(order.order_deadline)}
            </span>
          ) : (
            <span className={cn("inline-flex items-center gap-0.5", touchMode ? "text-[11px]" : "text-[10px]")}>
              <User className="size-3" />
              {order.item_count} item{order.item_count !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {(order.stage_assignee_names?.length ?? 0) > 0 ? (
          <AssigneeAvatars names={order.stage_assignee_names!} />
        ) : order.stage_assignee_name ? (
          <AssigneeAvatars names={[order.stage_assignee_name]} />
        ) : null}
      </div>

      {order.read_only_reason && !canOverride ? (
        <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1.5 leading-snug" title={order.read_only_reason}>
          {order.read_only_reason}
        </p>
      ) : null}

      {touchMode ? (
        <div className="mt-3 flex flex-col gap-2">
          {prevCol && canRevert ? (
            <Button
              size="sm"
              variant="secondary"
              className="w-full !h-10 !text-[12px] justify-center"
              loading={loading}
              onClick={() => onRevert(order.order_id, prevCol)}
            >
              {bb.moveBack.replace("{stage}", columnLabels[prevCol] ?? prevCol)}
            </Button>
          ) : null}
          {nextCol && canAdvance ? (
            <Button
              size="sm"
              variant="primary"
              className="w-full !h-10 !text-[12px] justify-center"
              loading={loading}
              onClick={() => onAdvance(order.order_id, nextCol)}
            >
              {bb.moveForward.replace("{stage}", columnLabels[nextCol] ?? nextCol)}
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
        <div className="mt-2 flex items-center justify-between gap-0.5">
          <div className="flex gap-0.5">
            {prevCol && canRevert ? (
              <Button
                size="sm"
                variant="secondary"
                className="!px-2 !py-0.5 !text-[10px] !h-auto"
                loading={loading}
                title={columnLabels[prevCol] ?? prevCol}
                onClick={() => onRevert(order.order_id, prevCol)}
              >
                ←
              </Button>
            ) : null}
          </div>
          <div className="flex gap-0.5">
            {nextCol && canAdvance ? (
              <Button
                size="sm"
                variant="secondary"
                className="!px-2 !py-0.5 !text-[10px] !h-auto"
                loading={loading}
                onClick={() => onAdvance(order.order_id, nextCol)}
              >
                →
              </Button>
            ) : null}
            {canOpenDetail ? (
              <Link to={`/app/orders/${order.order_id}`}>
                <Button size="sm" variant="ghost" className="!px-1 !py-0.5 !h-auto">
                  <ExternalLink className="size-3" />
                </Button>
              </Link>
            ) : null}
          </div>
        </div>
      )}

      {canDrag && !touchMode ? (
        <p className="text-[8px] text-text-3 mt-1.5 text-center opacity-70">{bb.dragHint}</p>
      ) : null}
    </div>
  );
}
