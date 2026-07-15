import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, Clock, MessageSquare, NotebookPen, Rocket, Send } from "lucide-react";
import toast from "react-hot-toast";

import { ordersApi } from "@/api/modules";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs } from "@/components/ui/Tabs";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { canAdvanceOrderStage, canChangeOrderPaidStatus, canConfirmOrderReceipt, canManageOrdersAdmin, canOverrideProductionWorkflow, hasAnyPermission, isOrderReceiptConfirmable } from "@/lib/permissions";
import { OrderPaymentToggle } from "@/components/orders/OrderPaymentToggle";
import { isOrderPaymentConfirmed, PRODUCTION_ORDER_STATUSES } from "@/lib/orderStatuses";
import { BoardRevertReasonModal } from "@/components/orders/BoardRevertReasonModal";
import { OrderChatPanel } from "@/components/orders/OrderChatPanel";
import { OrderNotesPanel } from "@/components/orders/OrderNotesPanel";
import {
  WORKFLOW_ASSIGNMENT_STAGES,
  ORDER_BOARD_COLUMNS,
  WORKFLOW_BOARD_STAGES,
  canDropOnBoardColumn,
  isBackwardBoardMove,
  isEnteringProduction,
  orderBoardColumn,
  previousBoardColumn,
  previousEnabledPipelineStatus,
} from "@/lib/workflow";
import { LineItemHeading } from "@/components/orders/LineItemSpecList";
import { OrderApprovalTimeline } from "@/components/orders/OrderApprovalTimeline";
import { OrderInvoicesPanel } from "@/components/finance/OrderInvoicesPanel";
import { OrderReceiptConfirmCard } from "@/components/orders/OrderReceiptConfirmCard";
import {
  WorkflowAssignmentForm,
  assignmentsReadyForRelease,
  draftsFromOrder,
  draftsToPayload,
} from "@/components/orders/WorkflowAssignmentForm";
import { useAuthStore } from "@/store/auth";
import { useT } from "@/i18n/useT";
import { departmentLabel, priorityLabel, workflowStageLabel } from "@/i18n/labels";
import type { Order, OrderItem } from "@/types/api";

const ITEM_TRANSITIONS: Record<string, string[]> = {
  pending: ["design", "on_hold", "cancelled"],
  design: ["printing", "on_hold", "cancelled"],
  printing: ["production", "finishing", "on_hold", "cancelled"],
  production: ["finishing", "on_hold", "cancelled"],
  finishing: ["delivery", "on_hold", "cancelled"],
  delivery: ["completed", "on_hold", "cancelled"],
  on_hold: ["pending", "design", "printing", "production", "finishing", "delivery", "cancelled"],
};

const PIPELINE_ORDER = ["pending", "design", "printing", "production", "finishing", "delivery", "completed"];

function deriveOrderStage(items: OrderItem[]): string {
  const statuses = new Set(items.map((it) => it.workflow_status ?? "pending"));
  if (statuses.has("on_hold")) return "on_hold";
  if ([...statuses].every((s) => s === "completed" || s === "cancelled")) {
    return statuses.has("completed") ? "completed" : "cancelled";
  }
  const active = [...statuses].filter((s) => !["completed", "cancelled", "on_hold"].includes(s));
  if (active.length === 0) return "pending";
  const pipeline = active.filter((s) => PIPELINE_ORDER.includes(s));
  if (pipeline.length === 0) return active.sort()[0];
  return pipeline.sort((a, b) => PIPELINE_ORDER.indexOf(a) - PIPELINE_ORDER.indexOf(b))[0];
}

function OrderApprovalPanel({ order }: { order: Order }) {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const canPropose = hasAnyPermission(user, "orders:update", "orders:admin");
  const canRelease = canManageOrdersAdmin(user);
  const [deadline, setDeadline] = useState(order.deadline ?? "");
  const [adminMessage, setAdminMessage] = useState("");
  const [lines, setLines] = useState(
    order.items.map((it) => ({
      product_id: it.product_id,
      name: it.name,
      quantity: it.quantity,
      unit: it.unit,
      unit_price: it.unit_price,
      tax_rate: it.tax_rate,
      spec: it.spec ?? {},
    })),
  );
  const [assignments, setAssignments] = useState(() =>
    draftsFromOrder(order.workflow_assignments),
  );

  const propose = useMutation({
    mutationFn: () =>
      ordersApi.proposeOrder(order.id, {
        deadline: deadline || undefined,
        admin_message: adminMessage || undefined,
        items: lines,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["order", order.id] });
      toast.success("Proposal sent to customer");
      setAdminMessage("");
    },
  });

  const release = useMutation({
    mutationFn: () => {
      const payload = draftsToPayload(assignments);
      if (!assignmentsReadyForRelease(assignments)) {
        throw new Error("Assign staff for each active stage or mark unused stages as N/A");
      }
      return ordersApi.releaseOrder(order.id, { workflow_assignments: payload });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["order", order.id] });
      qc.invalidateQueries({ queryKey: ["workflow-board"] });
      qc.invalidateQueries({ queryKey: ["order.conversation", order.id] });
      toast.success("Order released to production");
    },
  });

  if (!canPropose && !canRelease) return null;
  if (PRODUCTION_ORDER_STATUSES.has(order.status)) return null;

  const canSendProposal = ["draft", "pending_review", "awaiting_customer"].includes(order.status);
  const canFinalRelease = ["draft", "customer_approved"].includes(order.status);

  return (
    <Card>
      <CardHeader
        title="Pricing & approval"
        subtitle="Set prices and deadline. Customer portal requests require customer sign-off before release."
      />
      <CardBody className="space-y-4">
        {canPropose && canSendProposal ? (
          <>
            <Input label="Deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            <div className="space-y-2">
              {lines.map((line, idx) => (
                <div key={`${line.name}-${idx}-${JSON.stringify(line.spec)}`} className="grid gap-2 sm:grid-cols-3 rounded-lg border border-border p-3">
                  <LineItemHeading
                    name={line.name}
                    quantity={line.quantity}
                    unit={line.unit}
                    spec={line.spec}
                  />
                  <Input
                    label="Unit price"
                    type="number"
                    min={0}
                    step="0.01"
                    value={line.unit_price}
                    onChange={(e) =>
                      setLines((rows) =>
                        rows.map((r, i) => (i === idx ? { ...r, unit_price: Number(e.target.value) || 0 } : r)),
                      )
                    }
                  />
                </div>
              ))}
            </div>
            <Textarea label="Message to customer" rows={2} value={adminMessage} onChange={(e) => setAdminMessage(e.target.value)} />
            <Button loading={propose.isPending} onClick={() => propose.mutate()} icon={<Send className="size-4" />}>
              {order.placed_via === "portal" ? "Send proposal to customer" : "Save pricing"}
            </Button>
          </>
        ) : null}

        {canRelease && canFinalRelease ? (
          <>
            <WorkflowAssignmentForm value={assignments} onChange={setAssignments} />
            <Button
              variant="primary"
              loading={release.isPending}
              disabled={!assignmentsReadyForRelease(assignments)}
              onClick={() => release.mutate()}
              icon={<Rocket className="size-4" />}
            >
              Final approve & release to production
            </Button>
          </>
        ) : null}

        {order.status === "awaiting_customer" ? (
          <p className="text-[12.5px] text-text-3">Waiting for customer to approve the proposal.</p>
        ) : null}
      </CardBody>
    </Card>
  );
}

function OrderAssignmentsPanel({ order }: { order: Order }) {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const { t } = useT();
  const wa = t.staffUi.workflowAssignments;
  const canEdit = hasAnyPermission(user, "orders:admin", "orders:update");
  const releasePanelVisible =
    canManageOrdersAdmin(user) && ["draft", "customer_approved"].includes(order.status);
  const [assignments, setAssignments] = useState(() => draftsFromOrder(order.workflow_assignments));
  const [dirty, setDirty] = useState(false);

  const save = useMutation({
    mutationFn: () => ordersApi.setWorkflowAssignments(order.id, draftsToPayload(assignments)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["order", order.id] });
      qc.invalidateQueries({ queryKey: ["workflow-board"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["order.conversation", order.id] });
      toast.success(wa.saved);
      setDirty(false);
    },
    onError: (e: Error) => toast.error(e.message || t.common.error),
  });

  if (!canEdit || order.status === "cancelled" || order.status === "closed" || releasePanelVisible) {
    return null;
  }

  return (
    <Card>
      <CardHeader title={wa.editTitle} subtitle={wa.editSubtitle} />
      <CardBody className="space-y-4">
        <WorkflowAssignmentForm
          value={assignments}
          onChange={(next) => {
            setAssignments(next);
            setDirty(true);
          }}
        />
        <Button
          variant="primary"
          disabled={!dirty || !assignmentsReadyForRelease(assignments)}
          loading={save.isPending}
          onClick={() => save.mutate()}
        >
          {wa.saveAssignments}
        </Button>
      </CardBody>
    </Card>
  );
}

function OrderWorkflowPanel({ order }: { order: Order }) {
  const { t } = useT();
  const dt = t.staffUi.orders.detail;
  const bb = t.staffUi.orderBoard;
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [revertOpen, setRevertOpen] = useState(false);
  const stage = useMemo(() => deriveOrderStage(order.items), [order.items]);
  const transitions = ITEM_TRANSITIONS[stage] ?? [];
  const canOverride = canOverrideProductionWorkflow(user);
  const canAdvance = canAdvanceOrderStage(user, order, stage);
  const stageAssignment = order.workflow_assignments?.find((a) => a.workflow_status === stage);
  const stageAssigneeNames =
    stageAssignment?.assignee_names && stageAssignment.assignee_names.length > 0
      ? stageAssignment.assignee_names
      : stageAssignment?.assignee_name
        ? [stageAssignment.assignee_name]
        : [];
  const enabledStages = useMemo(() => {
    const fromAssign = (order.workflow_assignments ?? [])
      .filter((a) => !a.is_skipped)
      .map((a) => a.workflow_status);
    return fromAssign.length > 0 ? fromAssign : [...WORKFLOW_ASSIGNMENT_STAGES];
  }, [order.workflow_assignments]);
  const prevStage = useMemo(
    () => previousEnabledPipelineStatus(stage, enabledStages),
    [stage, enabledStages],
  );
  const canRevert = !!prevStage && (canOverride || canAdvance);

  const update = useMutation({
    mutationFn: ({ to_status, notes }: { to_status: string; notes?: string }) =>
      ordersApi.changeOrderWorkflow(order.id, to_status, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["order", order.id] });
      qc.invalidateQueries({ queryKey: ["workflow-board"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      setRevertOpen(false);
      toast.success(dt.pipelineUpdated);
    },
    onError: (e: Error) => toast.error(e.message || dt.updateFailed),
  });

  const requestWorkflowMove = (to_status: string, notes?: string) => {
    const prev = previousEnabledPipelineStatus(stage, enabledStages);
    const isBackward = prev === to_status;
    if (isBackward && !canOverride && !notes?.trim()) {
      setRevertOpen(true);
      return;
    }
    update.mutate({ to_status, notes });
  };

  const allHistory = order.items
    .flatMap((it) => (it.status_history ?? []).map((h) => ({ ...h, item_name: it.name })))
    .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());

  return (
    <Card>
      <CardHeader
        title={dt.productionPipeline}
        subtitle={dt.productionPipelineSub.replace("{n}", String(order.items.length))}
        action={<Badge variant="brand">{workflowStageLabel(stage, t)}</Badge>}
      />
      <CardBody className="space-y-4">
        {stageAssigneeNames.length > 0 ? (
          <p className="text-[12.5px] text-text-2">
            {dt.stageTeam}:{" "}
            <span className="font-medium">{stageAssigneeNames.join(", ")}</span>
          </p>
        ) : null}
        {!canAdvance && hasAnyPermission(user, "production:update") ? (
          <p className="text-[12.5px] text-amber-600 dark:text-amber-400">
            {dt.notAssigned}
          </p>
        ) : null}
        {transitions.length > 0 && canAdvance ? (
          <div className="flex flex-wrap gap-2">
            {transitions.map((s) => (
              <Button
                key={s}
                size="sm"
                variant="secondary"
                loading={update.isPending}
                onClick={() => requestWorkflowMove(s)}
              >
                → {workflowStageLabel(s, t)}
              </Button>
            ))}
          </div>
        ) : null}
        {canRevert && prevStage ? (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              loading={update.isPending}
              onClick={() => requestWorkflowMove(prevStage)}
            >
              ← {workflowStageLabel(prevStage, t)}
            </Button>
          </div>
        ) : null}

        {allHistory.length > 0 ? (
          <div className="border-t border-border pt-3 space-y-2">
            <div className="text-[11px] font-semibold uppercase text-text-3 tracking-wide">{dt.history}</div>
            {allHistory.slice(0, 8).map((h) => (
              <div key={h.id} className="flex gap-2 text-[12px]">
                <Clock className="size-3.5 text-text-3 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="font-medium">
                    {h.from_status ? `${workflowStageLabel(h.from_status, t)} → ` : ""}
                    {workflowStageLabel(h.to_status, t)}
                  </span>
                  <span className="text-text-3"> · {h.item_name}</span>
                  {h.notes ? <span className="text-text-3"> — {h.notes}</span> : null}
                  <div className="text-[11px] text-text-3">{formatDateTime(h.occurred_at)}</div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </CardBody>
      <BoardRevertReasonModal
        open={revertOpen}
        title={bb.revertTitle}
        description={bb.revertDescription}
        reasonLabel={bb.revertReasonLabel}
        reasonPlaceholder={bb.revertReasonPlaceholder}
        confirmLabel={bb.revertConfirm}
        cancelLabel={t.staffUi.common.cancel}
        loading={update.isPending}
        onCancel={() => setRevertOpen(false)}
        onConfirm={(reason) => {
          if (prevStage) update.mutate({ to_status: prevStage, notes: reason });
        }}
      />
    </Card>
  );
}

function buildBoardMoveContext(order: Order, boardColumn: string) {
  const drafts = draftsFromOrder(order.workflow_assignments);
  const skipped = drafts.filter((d) => d.skipped).map((d) => d.workflow_status as string);
  const withAssignees = drafts
    .filter((d) => !d.skipped && d.assignee_ids.length > 0)
    .map((d) => d.workflow_status);
  const enabled = WORKFLOW_ASSIGNMENT_STAGES.filter((s) => !skipped.includes(s));
  const prevColumn = previousBoardColumn(boardColumn);
  const inProduction = (WORKFLOW_BOARD_STAGES as readonly string[]).includes(boardColumn);

  return {
    board_column: boardColumn,
    enabled_stages: [...enabled],
    skipped_stages: skipped,
    stages_with_assignees: withAssignees,
    assignments_ready: assignmentsReadyForRelease(drafts),
    can_advance: inProduction,
    can_revert: !!prevColumn,
    prev_column: prevColumn,
    revert_requires_reason: inProduction,
  };
}

function ItemSummaryCard({ item, t }: { item: OrderItem; t: ReturnType<typeof useT>["t"] }) {
  return (
    <div className="flex items-start justify-between gap-2 sm:gap-3 rounded-lg border border-border/80 bg-surface/50 px-2.5 py-2 sm:px-3 sm:py-2.5">
      <LineItemHeading
        name={item.name}
        quantity={item.quantity}
        unit={item.unit}
        spec={item.spec}
        description={item.description}
      />
      <div className="flex flex-col items-end gap-1 shrink-0 text-end">
        <span className="text-[12.5px] sm:text-[13px] font-semibold tabular-nums">{formatMoney(item.line_total)}</span>
        {item.current_department ? (
          <Badge variant="brand">{departmentLabel(item.current_department, t)}</Badge>
        ) : null}
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const { t } = useT();
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const bb = t.staffUi.orderBoard;
  const columnLabels = bb.columns as Record<string, string>;
  const dt = t.staffUi.orders.detail;
  const no = t.staffUi.newOrder;
  const isOrderAdmin = canManageOrdersAdmin(user);
  const canOverride = canOverrideProductionWorkflow(user);
  const canPaid = canChangeOrderPaidStatus(user);
  const so = t.staffUi.orders;
  const collab = t.staffUi.orderCollab;
  const [tab, setTab] = useState<"overview" | "chat" | "notes">("overview");
  const canEditBoardColumn =
    isOrderAdmin ||
    canOverride ||
    hasAnyPermission(user, "production:update", "orders:update");
  const [revertModal, setRevertModal] = useState<{ toColumn: string } | null>(null);

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => ordersApi.get(orderId),
    enabled: !!orderId,
    refetchInterval: 15_000,
  });

  const boardMove = useMutation({
    mutationFn: ({ toColumn, notes }: { toColumn: string; notes?: string }) =>
      ordersApi.boardMove(orderId, toColumn, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["order", orderId] });
      qc.invalidateQueries({ queryKey: ["workflow-board"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      setRevertModal(null);
      toast.success(bb.moved);
    },
  });

  if (isLoading || !order) {
    return <div className="text-text-3 text-sm py-8">{dt.loading}</div>;
  }

  const currentColumn = orderBoardColumn(order);
  const paymentConfirmed = isOrderPaymentConfirmed(order.status);
  const showPaymentEditor = canPaid && (currentColumn === "confirmed" || currentColumn === "paid");
  const boardContext = buildBoardMoveContext(order, currentColumn);

  const requestBoardMove = (toColumn: string, notes?: string) => {
    if (toColumn === currentColumn) return;
    if (!canDropOnBoardColumn(boardContext, toColumn, canOverride, canPaid)) {
      if (isEnteringProduction(currentColumn, toColumn)) {
        const stageLabel = columnLabels[toColumn] ?? toColumn;
        if ((boardContext.skipped_stages ?? []).includes(toColumn)) {
          toast.error(bb.stageMarkedNa.replace("{stage}", stageLabel), { duration: 5000 });
        } else {
          toast.error(bb.stageNoAssignees.replace("{stage}", stageLabel), { duration: 5000 });
        }
      } else {
        toast.error(bb.stageNotApplicable);
      }
      return;
    }

    const backward = isBackwardBoardMove(currentColumn, toColumn);
    if (backward && !canOverride && !notes?.trim()) {
      setRevertModal({ toColumn });
      return;
    }

    boardMove.mutate({ toColumn, notes });
  };

  const handleColumnChange = (next: string) => {
    requestBoardMove(next);
  };

  return (
    <div className="page-shell space-y-4">
      <PageHeader
        title={order.title ?? order.code}
        description={
          <span className="font-mono text-[12px]">{order.code}</span>
        }
        actions={
          <>
            <Link to="/app/orders" className="btn btn-secondary w-full sm:w-auto">
              <ArrowLeft className="size-4" /> {dt.back}
            </Link>
            <Link to="/app/orders/board" className="btn btn-secondary w-full sm:w-auto">
              {dt.boardView}
            </Link>
          </>
        }
      />

      <Tabs
        fullWidth
        value={tab}
        onChange={(id) => setTab(id as "overview" | "chat" | "notes")}
        items={[
          { id: "overview", label: collab.tabOverview },
          {
            id: "chat",
            label: collab.tabChat,
            icon: <MessageSquare className="size-3.5" />,
          },
          {
            id: "notes",
            label: collab.tabNotes,
            icon: <NotebookPen className="size-3.5" />,
          },
        ]}
      />

      {tab === "chat" ? <OrderChatPanel orderId={order.id} /> : null}
      {tab === "notes" ? <OrderNotesPanel order={order} /> : null}

      {tab === "overview" ? (
      <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
        <div className="flex flex-col gap-4">
          <Card className="shrink-0 w-full">
            <CardHeader title={no.summaryTitle} />
            <CardBody className="space-y-2.5 text-[13px]">
              <div className="flex justify-between gap-3 items-start">
                <span className="text-text-2 shrink-0 pt-2">{dt.status}</span>
                {canEditBoardColumn ? (
                  <Select
                    className="max-w-[200px]"
                    value={currentColumn}
                    onChange={(e) => handleColumnChange((e.target as HTMLSelectElement).value)}
                    options={ORDER_BOARD_COLUMNS.map((col) => ({
                      value: col,
                      label: columnLabels[col] ?? col,
                    }))}
                  />
                ) : (
                  <Badge variant="brand">{columnLabels[currentColumn] ?? currentColumn}</Badge>
                )}
              </div>
              {showPaymentEditor ? (
                <div className="pt-1 border-t border-border/60">
                  <OrderPaymentToggle order={order} canEdit={canPaid} />
                </div>
              ) : paymentConfirmed ? (
                <div className="flex justify-between gap-2 pt-1 border-t border-border/60">
                  <span className="text-text-2">{dt.payment}</span>
                  <Badge variant="success">{t.portalUi.statuses.paid}</Badge>
                </div>
              ) : null}
              <div className="flex justify-between gap-2">
                <span className="text-text-2">{dt.priority}</span>
                <span>{priorityLabel(order.priority, t)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-text-2">{dt.deadline}</span>
                <span>{formatDate(order.deadline)}</span>
              </div>
              <div className="flex justify-between gap-2 pt-1 border-t border-border/60">
                <span className="text-text-2">{dt.total}</span>
                <span className="font-semibold tabular-nums">{formatMoney(order.grand_total, order.currency)}</span>
              </div>
              {order.notes ? (
                <p className="text-text-2 pt-1 border-t border-border/60 text-[12.5px] leading-relaxed">{order.notes}</p>
              ) : null}
            </CardBody>
          </Card>

          <OrderApprovalTimeline events={order.events} showTeamLink />
        </div>

        <div className="lg:col-span-2 flex flex-col gap-3 min-w-0">
          <section className="shrink-0">
            <h2 className="text-[14px] font-semibold mb-2">
              {dt.lineItemsCount.replace("{n}", String(order.items.length))}
            </h2>
            <div
              className={`flex flex-col gap-2 ${
                order.items.length > 5 ? "max-h-[min(42vh,320px)] overflow-y-auto overscroll-contain pe-1" : ""
              }`}
            >
              {order.items.map((item) => (
                <ItemSummaryCard key={item.id} item={item} t={t} />
              ))}
            </div>
          </section>

          <OrderApprovalPanel order={order} />
          {PRODUCTION_ORDER_STATUSES.has(order.status) ? <OrderWorkflowPanel order={order} /> : null}
          {isOrderReceiptConfirmable(order.status) && canConfirmOrderReceipt(user) ? (
            <OrderReceiptConfirmCard
              orderId={order.id}
              showNotes
              notesLabel={t.staffUi.newOrder.notes}
              copy={{
                title: so.confirmReceiptTitle,
                hint: so.confirmReceiptHint,
                question: so.confirmReceiptQuestion,
                yes: so.confirmReceiptYes,
                success: so.confirmReceiptSuccess,
              }}
            />
          ) : null}
          <OrderInvoicesPanel orderId={order.id} />
          <OrderAssignmentsPanel order={order} />
        </div>
      </div>
      ) : null}

      <BoardRevertReasonModal
        open={!!revertModal}
        title={bb.revertTitle}
        description={bb.revertDescription}
        reasonLabel={bb.revertReasonLabel}
        reasonPlaceholder={bb.revertReasonPlaceholder}
        confirmLabel={bb.revertConfirm}
        cancelLabel={t.staffUi.common.cancel}
        loading={boardMove.isPending}
        onCancel={() => setRevertModal(null)}
        onConfirm={(reason) => {
          if (revertModal) requestBoardMove(revertModal.toColumn, reason);
        }}
      />
    </div>
  );
}
