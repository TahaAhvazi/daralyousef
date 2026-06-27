import type { User } from "@/types/api";

export function userPermissions(user: User | null | undefined): string[] {
  if (!user) return [];
  if (user.is_superuser) return ["*"];
  return user.permissions ?? [];
}

export function hasPermission(user: User | null | undefined, perm: string): boolean {
  const perms = userPermissions(user);
  return perms.includes("*") || perms.includes(perm);
}

export function hasAnyPermission(user: User | null | undefined, ...perms: string[]): boolean {
  return perms.some((p) => hasPermission(user, p));
}

export function hasRole(user: User | null | undefined, ...slugs: string[]): boolean {
  if (!user) return false;
  const roles = (user.roles ?? []).map((r) => r.slug);
  return slugs.some((s) => roles.includes(s));
}

/** Full executive dashboard (revenue, company-wide KPIs). */
export function canViewExecutiveDashboard(user: User | null | undefined): boolean {
  return !!user?.is_superuser || hasRole(user, "ceo") || hasPermission(user, "dashboard:read");
}

/** Accountant or general manager — may set/clear paid status on orders. */
export function canChangeOrderPaidStatus(user: User | null | undefined): boolean {
  if (!user) return false;
  if (user.is_superuser) return true;
  return hasRole(user, "accountant", "general_manager");
}

/** Full order detail, pricing, customer info, order-level status changes. */
export function canManageOrdersAdmin(user: User | null | undefined): boolean {
  return !!user?.is_superuser || hasPermission(user, "orders:admin");
}

export function canViewOrderList(user: User | null | undefined): boolean {
  return hasAnyPermission(user, "orders:read", "orders:admin", "orders:create");
}

export function canUseProductionBoard(user: User | null | undefined): boolean {
  return hasAnyPermission(user, "production:read", "production:update");
}

export function canOverrideProductionWorkflow(user: User | null | undefined): boolean {
  if (!user) return false;
  if (canManageOrdersAdmin(user)) return true;
  return hasRole(user, "ceo", "cto", "general_manager");
}

export function canAdvanceProduction(user: User | null | undefined): boolean {
  return hasPermission(user, "production:update") || canOverrideProductionWorkflow(user);
}

/** Whether user may advance a specific order stage (assignee or executive override). */
export function canAdvanceOrderStage(
  user: User | null | undefined,
  order: {
    workflow_assignments?: {
      workflow_status: string;
      assignee_id?: number | null;
      assignee_ids?: number[];
      is_skipped?: boolean;
    }[];
  },
  currentStage: string,
): boolean {
  if (canOverrideProductionWorkflow(user)) return true;
  if (!canAdvanceProduction(user) || !user) return false;
  const assignment = order.workflow_assignments?.find((a) => a.workflow_status === currentStage);
  if (!assignment || assignment.is_skipped) return false;
  const ids =
    assignment.assignee_ids && assignment.assignee_ids.length > 0
      ? assignment.assignee_ids
      : assignment.assignee_id != null
        ? [assignment.assignee_id]
        : [];
  if (ids.length === 0) return false;
  return ids.includes(user.id);
}

const RECEIPT_TERMINAL_STATUSES = new Set(["delivered", "closed", "cancelled"]);

export function isOrderReceiptConfirmable(status: string): boolean {
  return !RECEIPT_TERMINAL_STATUSES.has(status);
}

/** Customer, accountant, CTO, or other staff with order update rights. */
export function canConfirmOrderReceipt(user: User | null | undefined): boolean {
  if (!user) return false;
  if (!user.is_staff) return true;
  if (canManageOrdersAdmin(user)) return true;
  if (hasPermission(user, "orders:update")) return true;
  return hasRole(user, "accountant", "cto", "ceo", "general_manager");
}

export function canCreateOrders(user: User | null | undefined): boolean {
  return hasPermission(user, "orders:create");
}

const CLOSED_TICKET_STATUSES = new Set(["closed", "resolved"]);

export function isTicketClosed(ticket: { status: string }): boolean {
  return CLOSED_TICKET_STATUSES.has(ticket.status);
}

export function canAssignTickets(user: User | null | undefined): boolean {
  return !!user?.is_superuser || hasPermission(user, "support:reply");
}

export function canReplyToTicket(
  user: User | null | undefined,
  ticket: { status: string; assignee_id?: number | null },
): boolean {
  if (!user || isTicketClosed(ticket)) return false;
  if (user.is_superuser) return true;
  if (!user.is_staff) return true;
  return hasPermission(user, "support:reply") && ticket.assignee_id === user.id;
}

export function canManageCatalog(user: User | null | undefined): boolean {
  return !!user?.is_superuser || hasPermission(user, "catalog:manage");
}

/** Warehouse lead & general manager — catalog + inventory admin surfaces. */
export function canAccessCatalogInventory(user: User | null | undefined): boolean {
  if (!user) return false;
  if (user.is_superuser) return true;
  if (hasRole(user, "general_manager", "warehouse")) return true;
  return canManageCatalog(user) && hasPermission(user, "inventory:read");
}

export function canCreateInventory(user: User | null | undefined): boolean {
  return !!user?.is_superuser || hasPermission(user, "inventory:create");
}

export function canUpdateInventory(user: User | null | undefined): boolean {
  return !!user?.is_superuser || hasPermission(user, "inventory:update");
}

export function canDeleteInventory(user: User | null | undefined): boolean {
  return !!user?.is_superuser || hasPermission(user, "inventory:delete");
}

export function canCreateCrm(user: User | null | undefined): boolean {
  return !!user?.is_superuser || hasPermission(user, "crm:create");
}

export function canDeleteCrm(user: User | null | undefined): boolean {
  return !!user?.is_superuser || hasPermission(user, "crm:delete");
}

export function canCreateUsers(user: User | null | undefined): boolean {
  return !!user?.is_superuser || hasPermission(user, "users:create");
}

export function canUpdateUsers(user: User | null | undefined): boolean {
  return !!user?.is_superuser || hasPermission(user, "users:update");
}

export function canDeleteUsers(user: User | null | undefined): boolean {
  return !!user?.is_superuser || hasPermission(user, "users:delete");
}

export function canCloseTicket(
  user: User | null | undefined,
  ticket: { status: string; assignee_id?: number | null },
): boolean {
  if (!user || isTicketClosed(ticket)) return false;
  if (user.is_superuser) return true;
  if (!user.is_staff) return true;
  return hasPermission(user, "support:reply") && ticket.assignee_id === user.id;
}
