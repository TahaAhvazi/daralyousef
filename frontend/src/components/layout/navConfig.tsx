import {
  BarChart3,
  Boxes,
  CalendarClock,
  ClipboardList,
  CreditCard,
  FileStack,
  FileText,
  Home,
  LayoutGrid,
  LifeBuoy,
  ListChecks,
  MessagesSquare,
  Package,
  Plus,
  Receipt,
  RotateCcw,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Store,
  Truck,
  UserCog,
  Users,
  UsersRound,
  Wallet,
  FileMinus,
  RefreshCw,
  SlidersHorizontal,
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
  id: string;
  labelKey: NavKey;
  icon: React.ReactNode;
  items: NavItem[];
  /** Single-link module (no children accordion content needed beyond one item). */
  linkOnly?: boolean;
}

export const STAFF_NAV_SECTIONS: NavSection[] = [
  {
    id: "dashboard",
    labelKey: "modDashboard",
    icon: <Home className="size-4" />,
    items: [
      { to: "/app", labelKey: "dashboard", icon: <Home className="size-4" />, executiveOnly: true },
      { to: "/app/work", labelKey: "dashboard", icon: <Home className="size-4" />, workHome: true },
    ],
  },
  {
    id: "sales",
    labelKey: "modSales",
    icon: <ClipboardList className="size-4" />,
    items: [
      { to: "/app/orders", labelKey: "manageOrders", icon: <ListChecks className="size-4" />, perm: ["orders:read", "orders:admin"] },
      { to: "/app/orders/new", labelKey: "createOrder", icon: <Plus className="size-4" />, perm: "orders:create" },
      { to: "/app/invoices", labelKey: "manageInvoices", icon: <Receipt className="size-4" />, perm: "finance:read" },
      { to: "/app/invoices/new", labelKey: "createInvoice", icon: <Plus className="size-4" />, perm: "finance:create" },
      { to: "/app/quotations", labelKey: "manageQuotations", icon: <FileText className="size-4" />, perm: "finance:read" },
      { to: "/app/credit-notes", labelKey: "creditNotes", icon: <FileMinus className="size-4" />, perm: "finance:read" },
      { to: "/app/returns", labelKey: "salesReturns", icon: <RotateCcw className="size-4" />, perm: "finance:read" },
      { to: "/app/recurring-invoices", labelKey: "recurringInvoices", icon: <RefreshCw className="size-4" />, perm: "finance:read" },
      { to: "/app/payments", labelKey: "customerPayments", icon: <Wallet className="size-4" />, perm: "finance:read" },
      { to: "/app/sales-settings", labelKey: "salesSettings", icon: <SlidersHorizontal className="size-4" />, perm: "finance:update" },
    ],
  },
  {
    id: "pos",
    labelKey: "modPos",
    icon: <Store className="size-4" />,
    items: [
      { to: "/app/pos", labelKey: "posTerminal", icon: <ShoppingCart className="size-4" />, perm: ["finance:create", "finance:read"] },
      { to: "/app/pos/sessions", labelKey: "posSessions", icon: <CreditCard className="size-4" />, perm: ["finance:create", "finance:read"] },
    ],
  },
  {
    id: "installments",
    labelKey: "modInstallments",
    icon: <CalendarClock className="size-4" />,
    items: [
      { to: "/app/installments", labelKey: "installmentPlans", icon: <CalendarClock className="size-4" />, perm: "finance:read" },
    ],
  },
  {
    id: "crm",
    labelKey: "modCrm",
    icon: <Users className="size-4" />,
    items: [
      { to: "/app/customers", labelKey: "customers", icon: <Users className="size-4" />, perm: "crm:read" },
      { to: "/app/leads", labelKey: "leads", icon: <UsersRound className="size-4" />, perm: "crm:read" },
      { to: "/app/tickets", labelKey: "tickets", icon: <LifeBuoy className="size-4" />, perm: ["support:read", "support:reply"] },
      { to: "/app/messages", labelKey: "messages", icon: <MessagesSquare className="size-4" />, perm: ["messages:read", "messages:send"] },
    ],
  },
  {
    id: "hrm",
    labelKey: "modHrm",
    icon: <UsersRound className="size-4" />,
    items: [
      { to: "/app/hr", labelKey: "humanResources", icon: <UsersRound className="size-4" />, perm: ["hr:read", "users:read", "dashboard:read"] },
      { to: "/app/hr/payroll-report", labelKey: "payrollReport", icon: <Wallet className="size-4" />, perm: ["hr:read", "users:read", "dashboard:read"] },
      { to: "/app/users", labelKey: "myEmployees", icon: <UserCog className="size-4" />, perm: "users:read" },
    ],
  },
  {
    id: "inventory",
    labelKey: "modInventory",
    icon: <Boxes className="size-4" />,
    items: [
      { to: "/app/materials", labelKey: "materials", icon: <Boxes className="size-4" />, perm: "inventory:read" },
      { to: "/app/products", labelKey: "products", icon: <Package className="size-4" />, perm: "catalog:manage" },
      { to: "/app/purchases", labelKey: "purchases", icon: <Truck className="size-4" />, perm: "inventory:read" },
      { to: "/app/vendors", labelKey: "vendors", icon: <Store className="size-4" />, perm: "inventory:read" },
    ],
  },
  {
    id: "operations",
    labelKey: "modOperations",
    icon: <LayoutGrid className="size-4" />,
    items: [
      { to: "/app/orders/board", labelKey: "orderBoard", icon: <LayoutGrid className="size-4" />, perm: ["production:read", "production:update"] },
    ],
  },
  {
    id: "accounting",
    labelKey: "modAccounting",
    icon: <Wallet className="size-4" />,
    items: [
      { to: "/app/payments", labelKey: "payments", icon: <Wallet className="size-4" />, perm: "finance:read" },
      { to: "/app/expenses", labelKey: "expenses", icon: <Receipt className="size-4" />, perm: "finance:read" },
      { to: "/app/credit-notes", labelKey: "creditNotes", icon: <FileMinus className="size-4" />, perm: "finance:read" },
    ],
  },
  {
    id: "reports",
    labelKey: "modReports",
    icon: <BarChart3 className="size-4" />,
    items: [
      { to: "/app/reports/sales", labelKey: "salesReports", icon: <BarChart3 className="size-4" />, perm: ["finance:read", "dashboard:read"] },
      { to: "/app/audit", labelKey: "auditLog", icon: <ShieldCheck className="size-4" />, perm: "audit:read" },
    ],
  },
  {
    id: "templates",
    labelKey: "modTemplates",
    icon: <FileStack className="size-4" />,
    items: [
      { to: "/app/templates", labelKey: "docTemplates", icon: <FileStack className="size-4" />, perm: "finance:read" },
    ],
  },
  {
    id: "settings",
    labelKey: "modSettings",
    icon: <Settings className="size-4" />,
    items: [
      { to: "/app/settings", labelKey: "settings", icon: <Settings className="size-4" /> },
      { to: "/app/sales-settings", labelKey: "salesSettings", icon: <SlidersHorizontal className="size-4" />, perm: "finance:update" },
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

export function sectionMatchesPath(section: NavSection, pathname: string): boolean {
  return section.items.some((item) => {
    if (item.to === "/app") return pathname === "/app";
    return pathname === item.to || pathname.startsWith(`${item.to}/`);
  });
}
