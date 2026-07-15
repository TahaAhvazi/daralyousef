import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, FileText, LayoutGrid, LifeBuoy, Package, Plus, Receipt, Sparkles } from "lucide-react";

import { financeApi, ordersApi, ticketsApi } from "@/api/modules";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageTip } from "@/components/ui/PageTip";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDate, formatMoney } from "@/lib/format";
import { useAuthStore } from "@/store/auth";
import { useT } from "@/i18n/useT";

export default function PortalHome() {
  const user = useAuthStore((s) => s.user);
  const { t } = useT();
  const th = t.portalUi.home;

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["portal.orders"],
    queryFn: () => ordersApi.list({ page_size: 5 }),
  });
  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ["portal.invoices"],
    queryFn: () => financeApi.invoices({ page_size: 5 }),
  });
  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ["portal.tickets"],
    queryFn: () => ticketsApi.list({ page_size: 5 }),
  });

  const outstanding = (invoices?.items ?? []).reduce((s, i) => s + (i.balance || 0), 0);
  const activeOrders = (orders?.items ?? []).filter(
    (o) => !["delivered", "closed", "cancelled"].includes(o.status),
  ).length;
  const openTickets = (tickets?.items ?? []).filter(
    (tk) => !["resolved", "closed"].includes(tk.status),
  ).length;

  const loading = ordersLoading || invoicesLoading || ticketsLoading;

  return (
    <div className="page-shell space-y-6">
      <PageHeader
        title={th.greeting.replace("{name}", user?.full_name ?? "")}
        description={th.subtitle}
        actions={
          <Link to="/portal/orders/new" className="w-full sm:w-auto">
            <Button size="lg" icon={<Sparkles className="size-4" />} full className="sm:w-auto min-h-12">
              {th.startOrder}
            </Button>
          </Link>
        }
      />

      <PageTip storageKey="portal-home">{th.subtitle}</PageTip>

      <div className="grid gap-4 sm:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-8 w-20" />
            </div>
          ))
        ) : (
          <>
            <StatCard label={th.kpiActive} value={activeOrders} tone="brand" icon={<Package className="size-5" />} />
            <StatCard label={th.kpiOutstanding} value={formatMoney(outstanding)} tone="warning" icon={<Receipt className="size-5" />} />
            <StatCard label={th.kpiOpenTickets} value={openTickets} tone="info" icon={<FileText className="size-5" />} />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title={th.recentOrders}
            subtitle={th.recentOrdersSub}
            action={
              <Link to="/portal/orders" className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand hover:underline">
                {th.viewAll} <ArrowUpRight data-rtl-mirror="true" className="size-3" />
              </Link>
            }
          />
          <CardBody className="space-y-1 pt-2">
            {ordersLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)
            ) : (orders?.items ?? []).length === 0 ? (
              <EmptyState
                compact
                title={th.noOrders}
                action={
                  <Link to="/portal/orders/new">
                    <Button size="sm" icon={<Plus className="size-3.5" />}>{th.startOrder}</Button>
                  </Link>
                }
              />
            ) : (
              (orders?.items ?? []).map((o) => (
                <Link
                  key={o.id}
                  to={`/portal/orders/${o.id}`}
                  className="flex min-h-[52px] items-center justify-between gap-3 rounded-xl p-3 transition-colors hover:bg-surface-2"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-[13.5px]">{o.title ?? o.code}</div>
                    <div className="truncate text-caption">
                      {o.code} · {th.deadline} {formatDate(o.deadline)}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge status={o.status} />
                    <span className="font-semibold text-[13.5px] tabular-nums">
                      {formatMoney(o.grand_total, o.currency)}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title={th.invoices}
            subtitle={th.invoicesSub}
            action={
              <Link to="/portal/invoices" className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand hover:underline">
                {th.viewAll} <ArrowUpRight data-rtl-mirror="true" className="size-3" />
              </Link>
            }
          />
          <CardBody className="space-y-1 pt-2">
            {invoicesLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)
            ) : (invoices?.items ?? []).length === 0 ? (
              <EmptyState compact title={th.noInvoices} />
            ) : (
              (invoices?.items ?? []).map((i) => (
                <Link
                  key={i.id}
                  to={`/portal/invoices/${i.id}`}
                  className="flex min-h-[52px] items-center justify-between gap-3 rounded-xl p-3 transition-colors hover:bg-surface-2"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-[13.5px]">{i.code}</div>
                    <div className="truncate text-caption">{th.due} {formatDate(i.due_date)}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge status={i.status} />
                    <span className="font-semibold text-[13.5px] tabular-nums">
                      {formatMoney(i.balance, i.currency)}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </CardBody>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="text-overline px-0.5">{t.staffUi.common.startHere}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickLink to="/portal/orders/new" icon={<Plus className="size-4" />} label={th.startOrder} primary />
          <QuickLink to="/portal/orders" icon={<LayoutGrid className="size-4" />} label={t.portalUi.nav.myOrders} />
          <QuickLink to="/portal/invoices" icon={<Receipt className="size-4" />} label={t.portalUi.nav.invoices} />
          <QuickLink to="/portal/tickets" icon={<LifeBuoy className="size-4" />} label={t.portalUi.nav.support} />
        </div>
      </section>
    </div>
  );
}

function QuickLink({
  to,
  icon,
  label,
  primary,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      to={to}
      className={
        primary
          ? "card flex min-h-[56px] items-center gap-3 border-brand/25 bg-brand/5 px-4 py-3.5 text-[13.5px] font-semibold text-brand ring-1 ring-brand/15"
          : "card card-interactive flex min-h-[56px] items-center gap-3 px-4 py-3.5 text-[13px] font-medium text-text-2 hover:text-text"
      }
    >
      <span
        className={`grid size-10 place-items-center rounded-lg ${
          primary ? "bg-grad-brand text-white" : "bg-brand/10 text-brand"
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <ArrowUpRight data-rtl-mirror="true" className="size-4 shrink-0 opacity-70" />
    </Link>
  );
}
