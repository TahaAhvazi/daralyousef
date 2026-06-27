import {
  Boxes, FileText, Home, LayoutGrid, LifeBuoy, ListChecks, MessagesSquare,
  Package, Plus, Receipt, Settings, ShieldCheck, UserCog, Users,
} from "lucide-react";

import { canViewExecutiveDashboard, hasAnyPermission } from "@/lib/permissions";
import type { Dict } from "@/i18n/messages";
import type { User } from "@/types/api";

export type NavKey = keyof Dict["staffUi"]["nav"];

export interface NavItem {
  to: string;
  labelKey: NavKey;
  icon: React.ReactNode;
  perm?: string | string[];
  executiveOnly?: boolean;
  workHome?: boolean;
}

export interface NavSection {
  labelKey: NavKey;
  items: NavItem[];
}

export const STAFF_NAV_SECTIONS: NavSection[] = [
  {
    labelKey: "overview",
    items: [
      { to: "/app", labelKey: "dashboard", icon: <Home className="size-4" />, executiveOnly: true },
      { to: "/app/work", labelKey: "dashboard", icon: <Home className="size-4" />, workHome: true },
      { to: "/app/audit", labelKey: "auditLog", icon: <ShieldCheck className="size-4" />, perm: "audit:read" },
    ],
  },
  {
    labelKey: "crm",
    items: [
      { to: "/app/customers", labelKey: "customers", icon: <Users className="size-4" />, perm: "crm:read" },
    ],
  },
  {
    labelKey: "operations",
    items: [
      { to: "/app/orders/board", labelKey: "orderBoard", icon: <LayoutGrid className="size-4" />, perm: ["production:read", "production:update"] },
      { to: "/app/orders", labelKey: "orders", icon: <ListChecks className="size-4" />, perm: ["orders:read", "orders:admin"] },
      { to: "/app/orders/new", labelKey: "newOrder", icon: <Plus className="size-4" />, perm: "orders:create" },
      { to: "/app/quotations", labelKey: "quotations", icon: <FileText className="size-4" />, perm: "finance:read" },
      { to: "/app/invoices", labelKey: "invoices", icon: <Receipt className="size-4" />, perm: "finance:read" },
    ],
  },
  {
    labelKey: "catalog",
    items: [
      { to: "/app/products", labelKey: "products", icon: <Package className="size-4" />, perm: "catalog:manage" },
      { to: "/app/materials", labelKey: "materials", icon: <Boxes className="size-4" />, perm: "inventory:read" },
    ],
  },
  {
    labelKey: "service",
    items: [
      { to: "/app/tickets", labelKey: "tickets", icon: <LifeBuoy className="size-4" />, perm: ["support:read", "support:reply"] },
      { to: "/app/messages", labelKey: "messages", icon: <MessagesSquare className="size-4" />, perm: ["messages:read", "messages:send"] },
    ],
  },
  {
    labelKey: "insights",
    items: [
      { to: "/app/users", labelKey: "myEmployees", icon: <UserCog className="size-4" />, perm: "users:read" },
      { to: "/app/settings", labelKey: "settings", icon: <Settings className="size-4" /> },
    ],
  },
];

export function filterNavItem(item: NavItem, user: User | null): boolean {
  if (item.executiveOnly && !canViewExecutiveDashboard(user)) return false;
  if (item.workHome && canViewExecutiveDashboard(user)) return false;
  if (!item.perm) return true;
  const perms = Array.isArray(item.perm) ? item.perm : [item.perm];
  return hasAnyPermission(user, ...perms);
}
