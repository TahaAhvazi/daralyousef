/**
 * Role-aware product tour — full beginner walkthrough of every staff module,
 * plus the order lifecycle from create → deliver.
 * Steps target `[data-tour="…"]` elements in the staff shell.
 */
import type { User } from "@/types/api";
import {
  canChangeOrderPaidStatus,
  canStockCheckOrder,
  canUseProductionBoard,
  canViewExecutiveDashboard,
  hasAnyPermission,
  hasPermission,
  hasRole,
} from "@/lib/permissions";

export type TourStepKey =
  | "welcome"
  | "sidebar"
  | "navDashboard"
  | "navSales"
  | "manageOrders"
  | "createOrder"
  | "navQuotations"
  | "navInvoices"
  | "createInvoice"
  | "accountantPay"
  | "navPaymentsSales"
  | "navPos"
  | "navInstallments"
  | "navCrm"
  | "navCustomers"
  | "navLeads"
  | "navTickets"
  | "navMessages"
  | "navHrm"
  | "navHr"
  | "navUsers"
  | "navWarehouse"
  | "navMaterials"
  | "warehouseCheck"
  | "navPurchases"
  | "navVendors"
  | "navProducts"
  | "navBoard"
  | "boardFlow"
  | "navAccounting"
  | "navExpenses"
  | "navReports"
  | "navAudit"
  | "navTemplates"
  | "navSettings"
  | "topbarHelp"
  | "flowSummary"
  | "done";

export interface TourStepDef {
  key: TourStepKey;
  /** CSS selector via data-tour attribute value */
  target: string;
  /** Navigate here before highlighting (optional) */
  route?: string;
  /** Open sidebar accordion section id */
  openSection?: string;
  placement?: "top" | "bottom" | "left" | "right" | "auto";
}

export type TourProfile =
  | "executive"
  | "sales"
  | "accountant"
  | "warehouse"
  | "production"
  | "general";

/** Bump when steps change so completed users see the new walkthrough. */
const TOUR_VERSION = "v2";

export function tourStorageKey(userId: number | string, profile: TourProfile): string {
  return `atelier.product-tour.${TOUR_VERSION}.${userId}.${profile}`;
}

export function resolveTourProfile(user: User | null | undefined): TourProfile {
  if (!user) return "general";
  if (canViewExecutiveDashboard(user) || hasRole(user, "ceo", "cto", "general_manager")) {
    return "executive";
  }
  if (canChangeOrderPaidStatus(user) || hasRole(user, "accountant")) return "accountant";
  if (canStockCheckOrder(user) || hasRole(user, "warehouse")) return "warehouse";
  if (
    canUseProductionBoard(user) ||
    hasRole(
      user,
      "designer",
      "printing_operator",
      "cnc_operator",
      "finishing_operator",
      "delivery_operator",
      "department_manager",
    )
  ) {
    return "production";
  }
  if (hasPermission(user, "orders:create") || hasRole(user, "sales")) return "sales";
  return "general";
}

function canSeeTarget(user: User | null | undefined, step: TourStepDef): boolean {
  if (!user) return false;
  switch (step.target) {
    case "nav-section-dashboard":
    case "nav-item-home":
    case "nav-item-work":
      return true;
    case "nav-section-sales":
    case "nav-item-orders":
    case "nav-item-orders-new":
      return hasPermission(user, "orders:create") || hasAnyPermission(user, "orders:read", "orders:admin");
    case "nav-item-orders-board":
      return canUseProductionBoard(user);
    case "nav-item-invoices":
    case "nav-item-invoices-new":
    case "nav-item-quotations":
    case "nav-item-credit-notes":
    case "nav-item-returns":
    case "nav-item-recurring-invoices":
      return hasAnyPermission(user, "finance:read", "finance:create");
    case "nav-item-payments":
    case "nav-section-accounting":
    case "nav-item-expenses":
      return hasPermission(user, "finance:read");
    case "nav-section-pos":
    case "nav-item-pos":
      return hasAnyPermission(user, "finance:create", "finance:read");
    case "nav-section-installments":
    case "nav-item-installments":
      return hasPermission(user, "finance:read");
    case "nav-section-crm":
    case "nav-item-customers":
    case "nav-item-leads":
      return hasPermission(user, "crm:read");
    case "nav-item-tickets":
      return hasAnyPermission(user, "support:read", "support:reply");
    case "nav-item-messages":
      return hasAnyPermission(user, "messages:read", "messages:send");
    case "nav-section-hrm":
    case "nav-item-hr":
      return hasAnyPermission(user, "hr:read", "users:read", "dashboard:read");
    case "nav-item-users":
      return hasPermission(user, "users:read");
    case "nav-section-inventory":
    case "nav-item-materials":
    case "nav-item-purchases":
    case "nav-item-vendors":
      return hasPermission(user, "inventory:read") || canStockCheckOrder(user);
    case "nav-item-products":
      return hasPermission(user, "catalog:manage");
    case "nav-section-operations":
      return canUseProductionBoard(user);
    case "nav-section-reports":
    case "nav-item-reports-sales":
      return hasAnyPermission(user, "finance:read", "dashboard:read");
    case "nav-item-audit":
      return hasPermission(user, "audit:read");
    case "nav-section-templates":
    case "nav-item-templates":
      return hasPermission(user, "finance:read");
    case "nav-section-settings":
    case "nav-item-settings":
      return true;
    default:
      return true;
  }
}

/** Full catalog — filtered per profile + permissions. */
const ALL_STEPS: TourStepDef[] = [
  { key: "welcome", target: "tour-replay", placement: "bottom" },
  { key: "sidebar", target: "app-sidebar", placement: "right", openSection: "dashboard" },
  {
    key: "navDashboard",
    target: "nav-section-dashboard",
    placement: "right",
    openSection: "dashboard",
    route: "/app",
  },
  { key: "navSales", target: "nav-section-sales", placement: "right", openSection: "sales" },
  {
    key: "manageOrders",
    target: "nav-item-orders",
    placement: "right",
    openSection: "sales",
    route: "/app/orders",
  },
  {
    key: "createOrder",
    target: "nav-item-orders-new",
    placement: "right",
    openSection: "sales",
    route: "/app/orders/new",
  },
  {
    key: "navQuotations",
    target: "nav-item-quotations",
    placement: "right",
    openSection: "sales",
    route: "/app/quotations",
  },
  {
    key: "navInvoices",
    target: "nav-item-invoices",
    placement: "right",
    openSection: "sales",
    route: "/app/invoices",
  },
  {
    key: "createInvoice",
    target: "nav-item-invoices-new",
    placement: "right",
    openSection: "sales",
  },
  {
    key: "accountantPay",
    target: "nav-item-invoices",
    placement: "right",
    openSection: "sales",
    route: "/app/invoices",
  },
  {
    key: "navPaymentsSales",
    target: "nav-item-payments",
    placement: "right",
    openSection: "sales",
    route: "/app/payments",
  },
  { key: "navPos", target: "nav-section-pos", placement: "right", openSection: "pos", route: "/app/pos" },
  {
    key: "navInstallments",
    target: "nav-section-installments",
    placement: "right",
    openSection: "installments",
    route: "/app/installments",
  },
  { key: "navCrm", target: "nav-section-crm", placement: "right", openSection: "crm" },
  {
    key: "navCustomers",
    target: "nav-item-customers",
    placement: "right",
    openSection: "crm",
    route: "/app/customers",
  },
  {
    key: "navLeads",
    target: "nav-item-leads",
    placement: "right",
    openSection: "crm",
    route: "/app/leads",
  },
  {
    key: "navTickets",
    target: "nav-item-tickets",
    placement: "right",
    openSection: "crm",
    route: "/app/tickets",
  },
  {
    key: "navMessages",
    target: "nav-item-messages",
    placement: "right",
    openSection: "crm",
    route: "/app/messages",
  },
  { key: "navHrm", target: "nav-section-hrm", placement: "right", openSection: "hrm" },
  {
    key: "navHr",
    target: "nav-item-hr",
    placement: "right",
    openSection: "hrm",
    route: "/app/hr",
  },
  {
    key: "navUsers",
    target: "nav-item-users",
    placement: "right",
    openSection: "hrm",
    route: "/app/users",
  },
  { key: "navWarehouse", target: "nav-section-inventory", placement: "right", openSection: "inventory" },
  {
    key: "navMaterials",
    target: "nav-item-materials",
    placement: "right",
    openSection: "inventory",
    route: "/app/materials",
  },
  {
    key: "warehouseCheck",
    target: "nav-item-materials",
    placement: "right",
    openSection: "inventory",
    route: "/app/materials",
  },
  {
    key: "navPurchases",
    target: "nav-item-purchases",
    placement: "right",
    openSection: "inventory",
    route: "/app/purchases",
  },
  {
    key: "navVendors",
    target: "nav-item-vendors",
    placement: "right",
    openSection: "inventory",
    route: "/app/vendors",
  },
  {
    key: "navProducts",
    target: "nav-item-products",
    placement: "right",
    openSection: "inventory",
    route: "/app/products",
  },
  {
    key: "navBoard",
    target: "nav-item-orders-board",
    placement: "right",
    openSection: "operations",
  },
  {
    key: "boardFlow",
    target: "nav-item-orders-board",
    placement: "right",
    openSection: "operations",
    route: "/app/orders/board",
  },
  {
    key: "navAccounting",
    target: "nav-section-accounting",
    placement: "right",
    openSection: "accounting",
  },
  {
    key: "navExpenses",
    target: "nav-item-expenses",
    placement: "right",
    openSection: "accounting",
    route: "/app/expenses",
  },
  {
    key: "navReports",
    target: "nav-section-reports",
    placement: "right",
    openSection: "reports",
    route: "/app/reports/sales",
  },
  {
    key: "navAudit",
    target: "nav-item-audit",
    placement: "right",
    openSection: "reports",
    route: "/app/audit",
  },
  {
    key: "navTemplates",
    target: "nav-section-templates",
    placement: "right",
    openSection: "templates",
    route: "/app/templates",
  },
  {
    key: "navSettings",
    target: "nav-section-settings",
    placement: "right",
    openSection: "settings",
    route: "/app/settings",
  },
  { key: "flowSummary", target: "tour-replay", placement: "bottom" },
  { key: "topbarHelp", target: "tour-replay", placement: "bottom" },
  { key: "done", target: "tour-replay", placement: "bottom" },
];

/** Shared “know the whole system” spine — permission filter drops what you can’t open. */
const FULL_SYSTEM_KEYS: TourStepKey[] = [
  "welcome",
  "sidebar",
  "navDashboard",
  "navSales",
  "manageOrders",
  "createOrder",
  "navQuotations",
  "navInvoices",
  "createInvoice",
  "navPaymentsSales",
  "navPos",
  "navInstallments",
  "navCrm",
  "navCustomers",
  "navLeads",
  "navTickets",
  "navMessages",
  "navHrm",
  "navHr",
  "navUsers",
  "navWarehouse",
  "navMaterials",
  "navPurchases",
  "navVendors",
  "navProducts",
  "navBoard",
  "boardFlow",
  "navAccounting",
  "navExpenses",
  "navReports",
  "navAudit",
  "navTemplates",
  "navSettings",
  "flowSummary",
  "topbarHelp",
  "done",
];

const PROFILE_STEP_KEYS: Record<TourProfile, TourStepKey[]> = {
  /** Leaders get every module they can access + lifecycle emphasis. */
  executive: [
    "welcome",
    "sidebar",
    "navDashboard",
    "navSales",
    "manageOrders",
    "createOrder",
    "navQuotations",
    "navInvoices",
    "accountantPay",
    "navPaymentsSales",
    "navPos",
    "navInstallments",
    "navCrm",
    "navCustomers",
    "navLeads",
    "navTickets",
    "navMessages",
    "navHrm",
    "navHr",
    "navUsers",
    "navWarehouse",
    "warehouseCheck",
    "navMaterials",
    "navPurchases",
    "navVendors",
    "navProducts",
    "navBoard",
    "boardFlow",
    "navAccounting",
    "navExpenses",
    "navReports",
    "navAudit",
    "navTemplates",
    "navSettings",
    "flowSummary",
    "topbarHelp",
    "done",
  ],
  sales: [
    "welcome",
    "sidebar",
    "navDashboard",
    "navSales",
    "manageOrders",
    "createOrder",
    "navQuotations",
    "navInvoices",
    "createInvoice",
    "navPaymentsSales",
    "navPos",
    "navInstallments",
    "navCrm",
    "navCustomers",
    "navLeads",
    "navTickets",
    "navMessages",
    "navBoard",
    "boardFlow",
    "navSettings",
    "flowSummary",
    "topbarHelp",
    "done",
  ],
  accountant: [
    "welcome",
    "sidebar",
    "navDashboard",
    "navSales",
    "manageOrders",
    "navInvoices",
    "createInvoice",
    "accountantPay",
    "navPaymentsSales",
    "navPos",
    "navInstallments",
    "navCrm",
    "navCustomers",
    "navAccounting",
    "navExpenses",
    "navReports",
    "navTemplates",
    "navSettings",
    "flowSummary",
    "topbarHelp",
    "done",
  ],
  warehouse: [
    "welcome",
    "sidebar",
    "navDashboard",
    "navWarehouse",
    "navMaterials",
    "warehouseCheck",
    "navPurchases",
    "navVendors",
    "navProducts",
    "navBoard",
    "boardFlow",
    "manageOrders",
    "navSettings",
    "flowSummary",
    "topbarHelp",
    "done",
  ],
  production: [
    "welcome",
    "sidebar",
    "navDashboard",
    "navBoard",
    "boardFlow",
    "manageOrders",
    "navMaterials",
    "navMessages",
    "navTickets",
    "navSettings",
    "flowSummary",
    "topbarHelp",
    "done",
  ],
  /** Anyone else: introduce every module they can actually open. */
  general: FULL_SYSTEM_KEYS,
};

export function buildTourSteps(user: User | null | undefined): TourStepDef[] {
  const profile = resolveTourProfile(user);
  const keys = PROFILE_STEP_KEYS[profile];
  const byKey = new Map(ALL_STEPS.map((s) => [s.key, s]));
  return keys
    .map((k) => byKey.get(k))
    .filter((s): s is TourStepDef => !!s)
    .filter((s) => canSeeTarget(user, s));
}

export function isTourCompleted(userId: number | string, profile: TourProfile): boolean {
  try {
    return localStorage.getItem(tourStorageKey(userId, profile)) === "1";
  } catch {
    return false;
  }
}

export function markTourCompleted(userId: number | string, profile: TourProfile): void {
  try {
    localStorage.setItem(tourStorageKey(userId, profile), "1");
  } catch {
    /* ignore quota */
  }
}

export function clearTourCompleted(userId: number | string, profile: TourProfile): void {
  try {
    localStorage.removeItem(tourStorageKey(userId, profile));
  } catch {
    /* ignore */
  }
}

/** Custom event: SidebarNav opens the given section for spotlighting. */
export const TOUR_OPEN_SECTION_EVENT = "atelier:tour-open-section";

export function requestOpenNavSection(sectionId: string): void {
  window.dispatchEvent(new CustomEvent(TOUR_OPEN_SECTION_EVENT, { detail: { sectionId } }));
}
