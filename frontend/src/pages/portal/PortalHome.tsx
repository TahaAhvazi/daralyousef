import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, FileText, Package, Receipt, Sparkles } from "lucide-react";

import { financeApi, ordersApi, ticketsApi } from "@/api/modules";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { formatDate, formatMoney } from "@/lib/format";
import { useAuthStore } from "@/store/auth";
import { useT } from "@/i18n/useT";

export default function PortalHome() {
  const user = useAuthStore((s) => s.user);
  const { t } = useT();
  const { data: orders } = useQuery({ queryKey: ["portal.orders"], queryFn: () => ordersApi.list({ page_size: 5 }) });
  const { data: invoices } = useQuery({ queryKey: ["portal.invoices"], queryFn: () => financeApi.invoices({ page_size: 5 }) });
  const { data: tickets } = useQuery({ queryKey: ["portal.tickets"], queryFn: () => ticketsApi.list({ page_size: 5 }) });

  const outstanding = (invoices?.items ?? []).reduce((s, i) => s + (i.balance || 0), 0);
  const activeOrders = (orders?.items ?? []).filter((o) => !["delivered", "closed", "cancelled"].includes(o.status)).length;
  const openTickets = (tickets?.items ?? []).filter((tk) => !["resolved", "closed"].includes(tk.status)).length;

  return (
    <div className="page-shell space-y-6">
      <div className="glass rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl break-words">
              {t.portalUi.home.greeting.replace("{name}", user?.full_name ?? "")}
            </h1>
            <p className="text-[13.5px] text-text-2 mt-1">{t.portalUi.home.subtitle}</p>
          </div>
          <Link to="/portal/orders/new" className="btn btn-primary w-full sm:w-auto shrink-0">
            <Sparkles className="size-4" /> {t.portalUi.home.startOrder}
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Kpi label={t.portalUi.home.kpiActive} value={activeOrders} icon={<Package className="size-4" />} />
          <Kpi label={t.portalUi.home.kpiOutstanding} value={formatMoney(outstanding)} icon={<Receipt className="size-4" />} />
          <Kpi label={t.portalUi.home.kpiOpenTickets} value={openTickets} icon={<FileText className="size-4" />} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title={t.portalUi.home.recentOrders} subtitle={t.portalUi.home.recentOrdersSub}
                      action={<Link to="/portal/orders" className="text-[12.5px] text-brand inline-flex items-center gap-1">{t.portalUi.home.viewAll} <ArrowUpRight data-rtl-mirror="true" className="size-3" /></Link>} />
          <CardBody className="space-y-3">
            {(orders?.items ?? []).length === 0 ? (
              <p className="text-text-3 text-[13px]">{t.portalUi.home.noOrders}</p>
            ) : (orders?.items ?? []).map((o) => (
              <Link
                key={o.id}
                to={`/portal/orders/${o.id}`}
                className="flex items-center justify-between gap-3 rounded-lg p-2 -mx-2 hover:bg-surface-2 transition-colors"
              >
                <div className="min-w-0">
                  <div className="font-medium text-[13.5px] truncate">{o.title ?? o.code}</div>
                  <div className="text-[11.5px] text-text-3 truncate">{o.code} · {t.portalUi.home.deadline} {formatDate(o.deadline)}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={o.status} />
                  <span className="font-semibold text-[13.5px] tabular-nums">{formatMoney(o.grand_total, o.currency)}</span>
                </div>
              </Link>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t.portalUi.home.invoices} subtitle={t.portalUi.home.invoicesSub}
                      action={<Link to="/portal/invoices" className="text-[12.5px] text-brand inline-flex items-center gap-1">{t.portalUi.home.viewAll} <ArrowUpRight data-rtl-mirror="true" className="size-3" /></Link>} />
          <CardBody className="space-y-3">
            {(invoices?.items ?? []).length === 0 ? (
              <p className="text-text-3 text-[13px]">{t.portalUi.home.noInvoices}</p>
            ) : (invoices?.items ?? []).map((i) => (
              <Link key={i.id} to={`/portal/invoices/${i.id}`} className="flex items-center justify-between gap-3 rounded-lg p-2 -mx-2 hover:bg-surface-2 transition-colors">
                <div className="min-w-0">
                  <div className="font-medium text-[13.5px] truncate">{i.code}</div>
                  <div className="text-[11.5px] text-text-3 truncate">{t.portalUi.home.due} {formatDate(i.due_date)}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={i.status} />
                  <span className="font-semibold text-[13.5px] tabular-nums">{formatMoney(i.balance, i.currency)}</span>
                </div>
              </Link>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value, icon }: { label: string; value: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-surface/70 border border-border/70 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11.5px] uppercase tracking-wider text-text-3 font-semibold">{label}</span>
        <span className="size-7 grid place-items-center rounded-md bg-grad-brand text-white">{icon}</span>
      </div>
      <div className="mt-2 text-xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

void Badge;
