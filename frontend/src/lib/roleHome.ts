import type { User } from "@/types/api";
import {
  canManageOrdersAdmin,
  canUseProductionBoard,
  canViewExecutiveDashboard,
  hasAnyPermission,
  hasPermission,
  hasRole,
} from "@/lib/permissions";

/** Default landing path after staff login. */
export function getStaffHomePath(user: User | null | undefined): string {
  if (!user) return "/login";

  if (canViewExecutiveDashboard(user)) return "/app";

  if (canUseProductionBoard(user) || hasRole(user, "designer", "printing_operator", "department_manager")) {
    return "/app/orders/board";
  }

  if (hasPermission(user, "orders:create")) return "/app/orders/new";
  if (hasAnyPermission(user, "finance:read", "finance:create")) return "/app/invoices";
  if (hasPermission(user, "inventory:read")) return "/app/materials";
  if (hasPermission(user, "crm:read")) return "/app/customers";
  if (hasAnyPermission(user, "support:read", "support:reply")) return "/app/tickets";
  if (hasPermission(user, "marketing:manage")) return "/app/customers";

  return "/app/work";
}

export function getPostLoginPath(user: User): string {
  if (user.is_staff || user.is_superuser) return getStaffHomePath(user);
  return "/portal";
}
