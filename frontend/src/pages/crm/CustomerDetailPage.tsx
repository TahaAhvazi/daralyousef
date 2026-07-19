import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Trash2,
  Wallet,
} from "lucide-react";
import toast from "react-hot-toast";

import { customersApi, financeApi, ordersApi, ticketsApi } from "@/api/modules";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs } from "@/components/ui/Tabs";
import { useAuthStore } from "@/store/auth";
import { canDeleteCrm, canUpdateCrm } from "@/lib/permissions";
import { staffBreadcrumbs } from "@/lib/breadcrumbs";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { useT } from "@/i18n/useT";
import { cn } from "@/lib/cn";

type TabId = "profile" | "orders" | "quotations" | "invoices" | "payments" | "tickets";

export default function CustomerDetailPage() {
  const { id } = useParams();
  const customerId = Number(id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const me = useAuthStore((s) => s.user);
  const { t, isRtl } = useT();
  const tt = t.staffUi.customers;
  const [tab, setTab] = useState<TabId>("profile");

  const { data: customer, isLoading, isError } = useQuery({
    queryKey: ["customer", customerId],
    queryFn: () => customersApi.get(customerId),
    enabled: Number.isFinite(customerId) && customerId > 0,
  });

  const { data: summary } = useQuery({
    queryKey: ["customer.summary", customerId],
    queryFn: () => customersApi.summary(customerId),
    enabled: Number.isFinite(customerId) && customerId > 0,
  });

  const { data: orders } = useQuery({
    queryKey: ["orders", "customer", customerId],
    queryFn: () => ordersApi.list({ page: 1, page_size: 50, customer_id: customerId }),
    enabled: tab === "orders" && customerId > 0,
  });

  const { data: quotations } = useQuery({
    queryKey: ["quotations", "customer", customerId],
    queryFn: () => financeApi.quotations({ page: 1, page_size: 50, customer_id: customerId }),
    enabled: tab === "quotations" && customerId > 0,
  });

  const { data: invoices } = useQuery({
    queryKey: ["invoices", "customer", customerId],
    queryFn: () => financeApi.invoices({ page: 1, page_size: 50, customer_id: customerId }),
    enabled: tab === "invoices" && customerId > 0,
  });

  const { data: payments } = useQuery({
    queryKey: ["payments", "customer", customerId],
    queryFn: () => financeApi.payments({ page: 1, page_size: 50, customer_id: customerId }),
    enabled: tab === "payments" && customerId > 0,
  });

  const { data: tickets } = useQuery({
    queryKey: ["tickets", "customer", customerId],
    queryFn: () => ticketsApi.list({ page: 1, page_size: 50, customer_id: customerId }),
    enabled: tab === "tickets" && customerId > 0,
  });

  const remove = useMutation({
    mutationFn: () => customersApi.remove(customerId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success(tt.archived);
      navigate("/app/customers");
    },
  });

  const breadcrumbs = useMemo(() => {
    const base = staffBreadcrumbs("/app/customers", t.staffUi.nav);
    if (customer) base.push({ label: customer.full_name });
    return base;
  }, [customer, t.staffUi.nav]);

  if (isLoading) {
    return (
      <div className="page-shell space-y-4">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (isError || !customer) {
    return (
      <div className="page-shell space-y-4">
        <PageHeader title={tt.emptyTitle} breadcrumbs={breadcrumbs} />
        <Card>
          <CardBody className="py-10 text-center text-sm text-text-3">
            {tt.emptyDesc}
            <div className="mt-4">
              <Link to="/app/customers" className="btn btn-secondary">{t.staffUi.common.previous}</Link>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-shell space-y-5">
      <PageHeader
        title={customer.full_name}
        description={customer.code}
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/app/customers" className="btn btn-secondary min-h-10">
              <ArrowLeft className={cn("size-4", isRtl && "rotate-180")} />
              {t.staffUi.nav.customers}
            </Link>
            {canUpdateCrm(me) ? (
              <Button
                variant="secondary"
                className="min-h-10"
                icon={<Pencil className="size-4" />}
                onClick={() => navigate("/app/customers")}
              >
                {tt.editBtn}
              </Button>
            ) : null}
            {canDeleteCrm(me) ? (
              <Button
                variant="ghost"
                className="min-h-10 text-danger"
                loading={remove.isPending}
                icon={<Trash2 className="size-4" />}
                onClick={() => {
                  if (window.confirm(`${t.staffUi.common.archive}? ${customer.full_name}`)) {
                    remove.mutate();
                  }
                }}
              >
                {t.staffUi.common.archive}
              </Button>
            ) : null}
          </div>
        }
      />

      <Card>
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="grid size-16 place-items-center rounded-2xl bg-grad-brand text-lg font-semibold text-white">
            {customer.full_name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-heading">{customer.full_name}</h2>
              {customer.user_id ? <Badge variant="success">{tt.portalBadge}</Badge> : null}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-text-2">
              {customer.email ? (
                <span className="inline-flex items-center gap-1.5"><Mail className="size-3.5 text-text-3" />{customer.email}</span>
              ) : null}
              {customer.phone ? (
                <span className="inline-flex items-center gap-1.5"><Phone className="size-3.5 text-text-3" />{customer.phone}</span>
              ) : null}
              {[customer.city, customer.country].filter(Boolean).length ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-text-3" />
                  {[customer.city, customer.country].filter(Boolean).join(", ")}
                </span>
              ) : null}
            </div>
          </div>
          {summary ? (
            <div className="grid grid-cols-2 gap-2 sm:w-64">
              <MiniStat label={t.staffUi.nav.orders} value={formatNumber(summary.orders_count)} />
              <MiniStat label={t.staffUi.nav.invoices} value={formatNumber(summary.invoices_count)} />
              <MiniStat label={t.staffUi.nav.tickets} value={formatNumber(summary.tickets_count)} />
              <MiniStat
                label={t.staffUi.invoices.colBalance}
                value={formatMoney(summary.invoices_balance, summary.currency)}
              />
            </div>
          ) : null}
        </CardBody>
      </Card>

      <Tabs
        fullWidth
        value={tab}
        onChange={(v) => setTab(v as TabId)}
        items={[
          { id: "profile", label: tt.colCustomer },
          { id: "orders", label: t.staffUi.nav.orders, badge: summary?.orders_count || undefined },
          { id: "quotations", label: t.staffUi.nav.quotations, badge: summary?.quotations_count || undefined },
          { id: "invoices", label: t.staffUi.nav.invoices, badge: summary?.invoices_count || undefined },
          { id: "payments", label: t.staffUi.nav.payments, badge: summary?.payments_count || undefined },
          { id: "tickets", label: t.staffUi.nav.tickets, badge: summary?.tickets_count || undefined },
        ]}
      />

      {tab === "profile" ? (
        <Card>
          <CardHeader title={tt.colCustomer} />
          <CardBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label={tt.colCode} value={customer.code} />
            <Field label={tt.colCustomer} value={customer.full_name} />
            <Field label={tt.colPhone} value={customer.phone || "—"} />
            <Field label="Email" value={customer.email || "—"} />
            <Field label={tt.colLocation} value={[customer.city, customer.country].filter(Boolean).join(", ") || "—"} />
            <Field label={tt.colTags} value={customer.tags || "—"} />
            <Field label="Address" value={customer.address || "—"} />
            <Field label="Title" value={customer.title || "—"} />
            <Field label="Notes" value={customer.notes || "—"} />
          </CardBody>
        </Card>
      ) : null}

      {tab === "orders" ? (
        <RelatedList
          empty="No orders"
          rows={(orders?.items ?? []).map((o) => ({
            id: o.id,
            title: o.code,
            sub: o.title || o.status,
            href: `/app/orders/${o.id}`,
            meta: formatMoney(o.grand_total, o.currency),
          }))}
        />
      ) : null}

      {tab === "quotations" ? (
        <RelatedList
          empty="No quotations"
          rows={(quotations?.items ?? []).map((q) => ({
            id: q.id,
            title: q.code,
            sub: q.status,
            href: `/app/quotations`,
            meta: formatMoney(q.grand_total, q.currency),
          }))}
        />
      ) : null}

      {tab === "invoices" ? (
        <RelatedList
          empty={t.staffUi.invoices.emptyTitle}
          rows={(invoices?.items ?? []).map((i) => ({
            id: i.id,
            title: i.code,
            sub: i.status,
            href: `/app/invoices/${i.id}`,
            meta: formatMoney(i.balance, i.currency),
          }))}
        />
      ) : null}

      {tab === "payments" ? (
        <RelatedList
          empty="No payments"
          rows={(payments?.items ?? []).map((p) => ({
            id: p.id,
            title: formatMoney(p.amount, p.currency),
            sub: `${p.method} · ${formatDate(p.paid_at)}`,
            href: `/app/payments`,
            meta: p.reference || "",
          }))}
        />
      ) : null}

      {tab === "tickets" ? (
        <RelatedList
          empty="No tickets"
          rows={(tickets?.items ?? []).map((tk) => ({
            id: tk.id,
            title: tk.code,
            sub: tk.subject,
            href: `/app/tickets/${tk.id}`,
            meta: tk.status,
          }))}
        />
      ) : null}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-surface-2/20 px-3 py-2.5">
      <div className="text-[11px] font-semibold text-text-3">{label}</div>
      <div className="mt-1 text-[13.5px] font-medium text-text">{value}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-surface-2/30 px-2.5 py-2 text-center">
      <div className="truncate text-[14px] font-semibold tabular-nums">{value}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-text-3">{label}</div>
    </div>
  );
}

function RelatedList({
  rows,
  empty,
}: {
  rows: Array<{ id: number; title: string; sub: string; href: string; meta: string }>;
  empty: string;
}) {
  if (!rows.length) {
    return (
      <Card>
        <CardBody className="py-10 text-center text-sm text-text-3">{empty}</CardBody>
      </Card>
    );
  }
  return (
    <Card>
      <CardBody className="divide-y divide-border/70">
        {rows.map((r) => (
          <Link
            key={r.id}
            to={r.href}
            className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0 hover:opacity-90"
          >
            <div>
              <div className="font-mono text-[13px] font-semibold text-brand">{r.title}</div>
              <div className="text-[12px] text-text-3">{r.sub}</div>
            </div>
            <div className="inline-flex items-center gap-1.5 text-[13px] font-medium">
              <Wallet className="size-3.5 text-text-3" />
              {r.meta}
            </div>
          </Link>
        ))}
      </CardBody>
    </Card>
  );
}
