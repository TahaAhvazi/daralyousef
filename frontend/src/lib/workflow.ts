import type { Product } from "@/types/api";

export const WORKFLOW_ASSIGNMENT_STAGES = [
  "design",
  "printing",
  "production",
  "finishing",
  "delivery",
] as const;

export const PIPELINE_ORDER = [
  "pending",
  "design",
  "printing",
  "production",
  "finishing",
  "delivery",
  "completed",
] as const;

export type WorkflowAssignmentStage = (typeof WORKFLOW_ASSIGNMENT_STAGES)[number];

const DEPT_SLUG_TO_STAGE: Record<string, WorkflowAssignmentStage> = {
  design: "design",
  printing: "printing",
  cnc: "production",
  flex_uv: "finishing",
  delivery: "delivery",
};

export function suggestedStagesFromProducts(
  products: Product[],
  lineProductIds: Array<number | null | undefined>,
): Set<WorkflowAssignmentStage> {
  const slugs = new Set<string>();
  for (const pid of lineProductIds) {
    if (!pid) continue;
    const p = products.find((x) => x.id === pid);
    for (const d of p?.required_departments ?? []) {
      slugs.add(d.slug);
    }
  }
  const stages = new Set<WorkflowAssignmentStage>();
  for (const slug of slugs) {
    const stage = DEPT_SLUG_TO_STAGE[slug];
    if (stage) stages.add(stage);
  }
  return stages.size > 0 ? stages : new Set(WORKFLOW_ASSIGNMENT_STAGES);
}

export interface WorkflowAssignmentDraft {
  workflow_status: WorkflowAssignmentStage;
  assignee_ids: number[];
  skipped: boolean;
}

export function emptyAssignmentDrafts(): WorkflowAssignmentDraft[] {
  return WORKFLOW_ASSIGNMENT_STAGES.map((workflow_status) => ({
    workflow_status,
    assignee_ids: [],
    skipped: false,
  }));
}

export function draftsFromOrder(
  existing?: {
    workflow_status: string;
    assignee_id?: number | null;
    assignee_ids?: number[];
    is_skipped?: boolean;
  }[],
): WorkflowAssignmentDraft[] {
  const grouped = new Map<string, { assignee_ids: number[]; skipped: boolean }>();
  for (const row of existing ?? []) {
    const ids =
      row.assignee_ids && row.assignee_ids.length > 0
        ? row.assignee_ids
        : row.assignee_id != null
          ? [row.assignee_id]
          : [];
    grouped.set(row.workflow_status, {
      assignee_ids: row.is_skipped ? [] : ids,
      skipped: !!row.is_skipped,
    });
  }
  return WORKFLOW_ASSIGNMENT_STAGES.map((workflow_status) => {
    const row = grouped.get(workflow_status);
    return {
      workflow_status,
      assignee_ids: row?.assignee_ids ?? [],
      skipped: row?.skipped ?? false,
    };
  });
}

export function applySuggestedStages(
  drafts: WorkflowAssignmentDraft[],
  suggested: Set<WorkflowAssignmentStage>,
): WorkflowAssignmentDraft[] {
  return drafts.map((d) => ({
    ...d,
    skipped: !suggested.has(d.workflow_status),
    assignee_ids: !suggested.has(d.workflow_status) ? [] : d.assignee_ids,
  }));
}

export function draftsToPayload(drafts: WorkflowAssignmentDraft[]) {
  return WORKFLOW_ASSIGNMENT_STAGES.map((workflow_status) => {
    const d = drafts.find((row) => row.workflow_status === workflow_status)!;
    return {
      workflow_status,
      is_skipped: d.skipped,
      assignee_ids: d.skipped ? [] : d.assignee_ids,
    };
  });
}

export function assignmentsReadyForRelease(drafts: WorkflowAssignmentDraft[]): boolean {
  return WORKFLOW_ASSIGNMENT_STAGES.every((s) => {
    const row = drafts.find((d) => d.workflow_status === s);
    if (!row) return false;
    if (row.skipped) return true;
    return row.assignee_ids.length > 0;
  });
}

/** @deprecated use assignmentsReadyForRelease */
export function allStagesAssigned(drafts: WorkflowAssignmentDraft[]): boolean {
  return assignmentsReadyForRelease(drafts);
}

export const ORDER_BOARD_COLUMNS = [
  "intake",
  "approval",
  "confirmed",
  "paid",
  "design",
  "printing",
  "production",
  "finishing",
  "delivery",
  "completed",
  "cancelled",
] as const;

export const LIFECYCLE_PRE_PRODUCTION_COLUMNS = ["intake", "approval", "confirmed", "paid"] as const;

export type OrderBoardColumn = (typeof ORDER_BOARD_COLUMNS)[number];

const PIPELINE_STAGE_INDEX: Record<string, number> = {
  pending: 0,
  design: 1,
  printing: 2,
  production: 3,
  finishing: 4,
  delivery: 5,
  completed: 6,
};

/** Single board column for an order — bottleneck (earliest active pipeline stage). */
export function deriveOrderPipelineStage(statuses: Iterable<string>): string {
  const set = new Set(statuses);
  if (set.size === 0) return "pending";
  if ([...set].every((s) => s === "cancelled")) return "cancelled";
  if (set.has("on_hold")) return "on_hold";
  if ([...set].every((s) => s === "completed")) return "completed";

  const active = [...set].filter((s) => !["completed", "cancelled", "on_hold"].includes(s));
  if (active.length === 0) return "pending";

  const pipeline = active.filter((s) => s in PIPELINE_STAGE_INDEX);
  if (pipeline.length > 0) {
    return pipeline.sort((a, b) => PIPELINE_STAGE_INDEX[a] - PIPELINE_STAGE_INDEX[b])[0];
  }
  return [...active].sort()[0];
}

/** Map order + line items to a lifecycle kanban column (mirrors backend). */
export function deriveOrderBoardColumn(
  orderStatus: string,
  itemStatuses: Iterable<string>,
): OrderBoardColumn {
  const items = [...itemStatuses];
  if (orderStatus === "cancelled") return "cancelled";
  if (orderStatus === "delivered" || orderStatus === "closed") return "completed";

  const active = items.filter((s) => s !== "completed" && s !== "cancelled");
  if (active.length === 0 && items.length > 0 && items.every((s) => s === "completed")) {
    return "completed";
  }

  if (orderStatus === "draft" || orderStatus === "pending_review") return "intake";
  if (orderStatus === "awaiting_customer" || orderStatus === "customer_approved") return "approval";
  if (orderStatus === "paid") return "paid";

  if (orderStatus === "confirmed" || orderStatus === "in_production") {
    if (orderStatus === "confirmed") return "confirmed";
    if (active.length === 0) return "confirmed";
    const stage = deriveOrderPipelineStage(active);
    if (stage === "on_hold") return "confirmed";
    if (stage === "completed") return "completed";
    if ((WORKFLOW_BOARD_STAGES as readonly string[]).includes(stage)) {
      return stage as OrderBoardColumn;
    }
    if (stage === "pending") return "confirmed";
    return "confirmed";
  }

  return "intake";
}

export function orderBoardColumn(
  order: { status: string; board_column?: string; items?: { workflow_status?: string }[] },
): OrderBoardColumn {
  if (order.board_column && (ORDER_BOARD_COLUMNS as readonly string[]).includes(order.board_column)) {
    return order.board_column as OrderBoardColumn;
  }
  return deriveOrderBoardColumn(
    order.status,
    (order.items ?? []).map((it) => it.workflow_status ?? "pending"),
  );
}

export const WORKFLOW_BOARD_STAGES = [
  "design",
  "printing",
  "production",
  "finishing",
  "delivery",
] as const;

/** @deprecated use ORDER_BOARD_COLUMNS for the full lifecycle board */
export const BOARD_PIPELINE_COLUMNS = ORDER_BOARD_COLUMNS;

export function previousBoardColumn(column: string): string | null {
  const idx = ORDER_BOARD_COLUMNS.indexOf(column as OrderBoardColumn);
  if (idx <= 0) return null;
  return ORDER_BOARD_COLUMNS[idx - 1];
}

export function isBackwardBoardMove(fromColumn: string, toColumn: string): boolean {
  const a = ORDER_BOARD_COLUMNS.indexOf(fromColumn as OrderBoardColumn);
  const b = ORDER_BOARD_COLUMNS.indexOf(toColumn as OrderBoardColumn);
  if (a < 0 || b < 0) return false;
  return b < a;
}

export function isEnteringProduction(fromColumn: string, toColumn: string): boolean {
  return (
    fromColumn === "paid" &&
    (WORKFLOW_BOARD_STAGES as readonly string[]).includes(toColumn)
  );
}

export function previousEnabledPipelineStatus(
  current: string,
  enabledStages: Iterable<string>,
): string | null {
  const enabled = new Set(enabledStages);
  const idx = PIPELINE_ORDER.indexOf(current as (typeof PIPELINE_ORDER)[number]);
  if (idx <= 0) return null;
  for (let i = idx - 1; i >= 0; i--) {
    const s = PIPELINE_ORDER[i];
    if (s === "pending") return "pending";
    if (enabled.has(s)) return s;
  }
  return "pending";
}

export function canEnterProductionColumn(
  order: {
    skipped_stages?: string[];
    stages_with_assignees?: string[];
  },
  column: string,
): boolean {
  if ((order.skipped_stages ?? []).includes(column)) return false;
  return (order.stages_with_assignees ?? []).includes(column);
}

export function canDropOnBoardColumn(
  order: {
    board_column: string;
    enabled_stages?: string[];
    can_advance?: boolean;
    can_revert?: boolean;
    prev_column?: string | null;
    assignments_ready?: boolean;
    skipped_stages?: string[];
    stages_with_assignees?: string[];
  },
  column: string,
  canOverride: boolean,
  canChangePaid = false,
): boolean {
  if (column === order.board_column) return false;

  if (column === "paid") {
    if (!canChangePaid) return false;
    return order.board_column === "confirmed" || order.board_column === "paid";
  }

  if (isEnteringProduction(order.board_column, column)) {
    return canEnterProductionColumn(order, column);
  }

  if (canOverride) return true;

  const curIdx = ORDER_BOARD_COLUMNS.indexOf(order.board_column as OrderBoardColumn);
  const toIdx = ORDER_BOARD_COLUMNS.indexOf(column as OrderBoardColumn);
  if (curIdx < 0 || toIdx < 0) return false;

  if (toIdx < curIdx) {
    if (column === "paid" && order.board_column === "design" && canChangePaid) {
      return !!order.can_revert || canOverride;
    }
    return !!order.can_revert && column === order.prev_column;
  }

  if (column === "cancelled" || column === "completed") return false;
  if (column === "intake" || column === "approval" || column === "confirmed") return false;
  if ((WORKFLOW_BOARD_STAGES as readonly string[]).includes(column)) {
    const enabled = order.enabled_stages ?? [...WORKFLOW_ASSIGNMENT_STAGES];
    return enabled.includes(column) && !!order.can_advance;
  }
  return false;
}

/** @deprecated use canDropOnBoardColumn */
export function canDropOnColumn(
  order: { enabled_stages?: string[]; skipped_stages?: string[] },
  column: string,
  canOverride: boolean,
): boolean {
  if (canOverride) return true;
  if (column === "pending" || column === "on_hold") return true;
  const enabled = order.enabled_stages ?? [...WORKFLOW_ASSIGNMENT_STAGES];
  return enabled.includes(column);
}
