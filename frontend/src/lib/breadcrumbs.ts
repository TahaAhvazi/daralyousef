import type { Dict } from "@/i18n/messages";

type NavDict = Dict["staffUi"]["nav"];
type PortalNavDict = Dict["portalUi"]["nav"];

const STAFF_STATIC: Record<string, keyof NavDict | "notifications"> = {
  "/app": "dashboard",
  "/app/work": "dashboard",
  "/app/hr": "humanResources",
  "/app/hr/employees": "humanResources",
  "/app/hr/payroll-report": "payrollReport",
  "/app/customers": "customers",
  "/app/leads": "leads",
  "/app/orders": "orders",
  "/app/orders/board": "orderBoard",
  "/app/orders/new": "newOrder",
  "/app/quotations": "quotations",
  "/app/invoices": "invoices",
  "/app/materials": "materials",
  "/app/tickets": "tickets",
  "/app/messages": "messages",
  "/app/notifications": "notifications",
  "/app/products": "products",
  "/app/audit": "auditLog",
  "/app/users": "myEmployees",
  "/app/settings": "settings",
};

const PORTAL_STATIC: Record<string, keyof PortalNavDict | "newOrder"> = {
  "/portal": "overview",
  "/portal/orders": "myOrders",
  "/portal/orders/new": "newOrder",
  "/portal/quotations": "quotations",
  "/portal/invoices": "invoices",
  "/portal/tickets": "support",
  "/portal/profile": "profile",
};

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

function matchStatic(path: string, map: Record<string, string>): string | null {
  if (map[path]) return path;
  const sorted = Object.keys(map).sort((a, b) => b.length - a.length);
  for (const key of sorted) {
    if (path.startsWith(key + "/") || path === key) return key;
  }
  return null;
}

export function staffBreadcrumbs(
  pathname: string,
  nav: NavDict,
  extras?: { notifications?: string },
): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [{ label: nav.dashboard, to: "/app" }];

  if (pathname === "/app" || pathname === "/app/work") return items;

  const base = matchStatic(pathname, STAFF_STATIC as Record<string, string>);
  if (!base) return items;

  const key = STAFF_STATIC[base];
  const label =
    key === "notifications"
      ? extras?.notifications ?? "Notifications"
      : nav[key as keyof NavDict];

  items.push({ label, to: base });

  const detailMatch = pathname.match(/^\/app\/(orders|invoices|tickets)\/(\d+)$/);
  if (detailMatch) {
    items.push({ label: `#${detailMatch[2]}` });
  }

  return items;
}

export function portalBreadcrumbs(
  pathname: string,
  nav: PortalNavDict,
  extras?: { newOrder?: string },
): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [{ label: nav.overview, to: "/portal" }];
  if (pathname === "/portal") return items;

  const base = matchStatic(pathname, PORTAL_STATIC as Record<string, string>);
  if (!base) return items;

  const key = PORTAL_STATIC[base];
  if (base === "/portal/orders/new") {
    items.push({ label: nav.myOrders, to: "/portal/orders" });
    items.push({ label: extras?.newOrder ?? "New order" });
    return items;
  }

  items.push({ label: nav[key as keyof PortalNavDict], to: base });

  const detailMatch = pathname.match(/^\/portal\/orders\/(\d+)$/);
  if (detailMatch) {
    items.push({ label: `#${detailMatch[1]}` });
  }

  return items;
}
