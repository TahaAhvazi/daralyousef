import type { Dict } from "@/i18n/messages";
import type { NotificationItem } from "@/types/api";

function fill(template: string, vars: Record<string, string>) {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replaceAll(`{${k}}`, v),
    template,
  );
}

function stageLabels(stages: string[] | undefined, t: Dict): string {
  const wa = t.staffUi.workflowAssignments.stages;
  return (stages ?? [])
    .map((s) => wa[s as keyof typeof wa] ?? s)
    .join(", ");
}

export function notificationDisplay(n: NotificationItem, t: Dict) {
  const nt = t.staffUi.notifications;
  const p = (n.payload ?? {}) as Record<string, unknown>;
  const stages = stageLabels(p.stages as string[] | undefined, t);
  const code = String(p.order_code ?? n.title);
  const actor = String(p.actor_name ?? "");
  const sender = String(p.sender_name ?? "");
  const preview = String(p.preview ?? n.body ?? "");

  switch (n.type) {
    case "chat.message":
      return {
        title: n.title || nt.types.chatMessage,
        body: fill(nt.bodies.chatPreview, { sender, preview }),
        kind: nt.types.chatMessage,
      };
    case "order.assigned":
      return {
        title: code,
        body: fill(nt.bodies.assignedToStages, { stages }),
        kind: nt.types.orderAssigned,
      };
    case "order.assignment_updated":
      return {
        title: code,
        body: fill(nt.bodies.assignmentUpdated, { stages }),
        kind: nt.types.orderAssignmentUpdated,
      };
    case "order.assignments_changed":
      return {
        title: code,
        body: fill(
          p.is_update ? nt.bodies.managerAssignmentsUpdated : nt.bodies.managerAssignments,
          { actor, code, stages },
        ),
        kind: nt.types.orderAssignmentsChanged,
      };
    case "order.released":
      if (p.target === "manager") {
        return {
          title: code,
          body: fill(nt.bodies.releasedManager, { actor, code }),
          kind: nt.types.orderReleased,
        };
      }
      return {
        title: code,
        body: nt.bodies.releasedAssignee,
        kind: nt.types.orderReleased,
      };
    default:
      return {
        title: n.title,
        body: n.body ?? "",
        kind: n.type,
      };
  }
}

export function notificationIconType(type: string): "message" | "order" | "bell" {
  if (type.startsWith("chat.")) return "message";
  if (type.startsWith("order.")) return "order";
  return "bell";
}
