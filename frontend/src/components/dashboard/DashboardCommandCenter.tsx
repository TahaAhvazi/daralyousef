import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Boxes,
  FileText,
  LayoutGrid,
  ListChecks,
  Package,
  Plus,
  Receipt,
  Search,
  Users,
} from "lucide-react";

import { useT } from "@/i18n/useT";
import { hasAnyPermission } from "@/lib/permissions";
import { useAuthStore } from "@/store/auth";

const MODULES = [
  { to: "/app/orders/new", label: "newOrder", icon: Plus, permission: ["orders:create"], tone: "text-success bg-success/10" },
  { to: "/app/orders", label: "orders", icon: ListChecks, permission: ["orders:read", "orders:admin"], tone: "text-brand bg-brand/10" },
  { to: "/app/orders/board", label: "orderBoard", icon: LayoutGrid, permission: ["production:read", "production:update"], tone: "text-info bg-info/10" },
  { to: "/app/customers", label: "customers", icon: Users, permission: ["crm:read"], tone: "text-accent-2 bg-accent/15" },
  { to: "/app/quotations", label: "quotations", icon: FileText, permission: ["finance:read"], tone: "text-warning bg-warning/10" },
  { to: "/app/invoices", label: "invoices", icon: Receipt, permission: ["finance:read"], tone: "text-danger bg-danger/10" },
  { to: "/app/products", label: "products", icon: Package, permission: ["catalog:manage"], tone: "text-brand bg-brand/10" },
  { to: "/app/materials", label: "materials", icon: Boxes, permission: ["inventory:read"], tone: "text-success bg-success/10" },
] as const;

export function DashboardCommandCenter() {
  const { t } = useT();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [customerQuery, setCustomerQuery] = useState("");
  const [orderQuery, setOrderQuery] = useState("");
  const dash = t.staffUi.dashboard;
  const nav = t.staffUi.nav;

  const submitSearch = (event: FormEvent, path: string, value: string) => {
    event.preventDefault();
    const query = value.trim();
    navigate(query ? `${path}?q=${encodeURIComponent(query)}` : path);
  };

  const modules = MODULES.filter((module) =>
    hasAnyPermission(user, ...module.permission),
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-soft">
      <div className="border-b border-border bg-gradient-to-br from-brand/[0.08] via-surface to-accent/[0.08] p-4 sm:p-5">
        <div className="mb-3">
          <h2 className="text-heading">{dash.quickAccessTitle}</h2>
          <p className="mt-0.5 text-caption">{dash.quickAccessDescription}</p>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <QuickSearch
            value={customerQuery}
            onChange={setCustomerQuery}
            onSubmit={(event) => submitSearch(event, "/app/customers", customerQuery)}
            placeholder={dash.searchCustomers}
            label={dash.customerSearchLabel}
            icon={<Users className="size-4" />}
          />
          <QuickSearch
            value={orderQuery}
            onChange={setOrderQuery}
            onSubmit={(event) => submitSearch(event, "/app/orders", orderQuery)}
            placeholder={dash.searchOrders}
            label={dash.orderSearchLabel}
            icon={<ListChecks className="size-4" />}
          />
        </div>
      </div>

      {modules.length > 0 ? (
        <div className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4 lg:grid-cols-8 rtl:divide-x-reverse">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Link
                key={module.to}
                to={module.to}
                className="group flex min-h-28 flex-col items-center justify-center gap-2.5 p-3 text-center transition-colors hover:bg-surface-2 focus-ring"
              >
                <span className={`grid size-10 place-items-center rounded-xl transition-transform group-hover:-translate-y-0.5 ${module.tone}`}>
                  <Icon className="size-5" />
                </span>
                <span className="text-[12px] font-semibold leading-tight text-text-2 group-hover:text-text">
                  {nav[module.label]}
                </span>
              </Link>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

function QuickSearch({
  value,
  onChange,
  onSubmit,
  placeholder,
  label,
  icon,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  placeholder: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <form onSubmit={onSubmit} className="relative">
      <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-text-2">
        {icon}
        {label}
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-text-3" />
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="input input-icon-start min-h-11 bg-surface/90 pe-12"
        />
        <button
          type="submit"
          aria-label={label}
          className="absolute end-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg bg-brand text-white transition-colors hover:bg-brand-2 focus-ring"
        >
          <Search className="size-3.5" />
        </button>
      </div>
    </form>
  );
}
