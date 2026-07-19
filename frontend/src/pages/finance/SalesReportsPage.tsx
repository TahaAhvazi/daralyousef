import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";

import { salesApi } from "@/api/modules";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { useT } from "@/i18n/useT";

export default function SalesReportsPage() {
  const { t } = useT();
  const [days, setDays] = useState(30);
  const [currency, setCurrency] = useState("IQD");
  const { data, isLoading } = useQuery({
    queryKey: ["sales-report", days, currency],
    queryFn: () => salesApi.salesReport({ days, currency }),
  });

  return (
    <div className="page-shell space-y-4">
      <PageHeader
        title={t.staffUi.nav.salesReports}
        description={t.staffUi.nav.modReports}
        actions={
          <div className="flex flex-wrap gap-2">
            <select className="input min-h-10 w-auto" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="IQD">IQD</option>
              <option value="USD">USD</option>
            </select>
            <select className="input min-h-10 w-auto" value={days} onChange={(e) => setDays(Number(e.target.value))}>
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>
        }
      />

      {isLoading || !data ? (
        <Card><CardBody className="py-10 text-center text-sm text-text-3">Loading…</CardBody></Card>
      ) : (
        <>
          <p className="text-[13px] text-text-3">
            {formatDate(data.period_start)} – {formatDate(data.period_end)}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Invoices" value={formatNumber(data.invoice_count)} icon={<BarChart3 className="size-4" />} />
            <Stat label="Invoice total" value={formatMoney(data.invoice_total, data.currency)} />
            <Stat label="Paid" value={formatMoney(data.paid_total, data.currency)} />
            <Stat label="Open AR" value={formatMoney(data.unpaid_balance, data.currency)} />
            <Stat label="Credit notes" value={formatMoney(data.credit_note_total, data.currency)} />
            <Stat label="Payments" value={formatNumber(data.payment_count)} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="By status" />
              <CardBody className="divide-y divide-border/70">
                {(data.by_status ?? []).map((row: any) => (
                  <div key={row.status} className="flex justify-between py-2 text-[13px]">
                    <span>{row.status}</span>
                    <span className="font-semibold tabular-nums">{row.count}</span>
                  </div>
                ))}
                {(data.by_status ?? []).length === 0 ? (
                  <p className="py-6 text-center text-sm text-text-3">{t.staffUi.common.noResults}</p>
                ) : null}
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Top customers" />
              <CardBody className="divide-y divide-border/70">
                {(data.top_customers ?? []).map((row: any) => (
                  <div key={row.customer_id} className="flex justify-between gap-3 py-2 text-[13px]">
                    <span className="truncate">{row.name}</span>
                    <span className="shrink-0 font-semibold tabular-nums">{formatMoney(row.total, data.currency)}</span>
                  </div>
                ))}
                {(data.top_customers ?? []).length === 0 ? (
                  <p className="py-6 text-center text-sm text-text-3">{t.staffUi.common.noResults}</p>
                ) : null}
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <Card>
      <CardBody className="py-3">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-text-3">
          {icon}
          {label}
        </div>
        <div className="mt-1 truncate text-[1.05rem] font-semibold tabular-nums">{value}</div>
      </CardBody>
    </Card>
  );
}
