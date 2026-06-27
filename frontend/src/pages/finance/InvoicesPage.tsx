import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Receipt } from "lucide-react";

import { financeApi } from "@/api/modules";
import { StatusBadge } from "@/components/ui/Badge";
import { Column, DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDate, formatMoney } from "@/lib/format";
import { useT } from "@/i18n/useT";
import type { Invoice } from "@/types/api";

export default function InvoicesPage() {
  const { t } = useT();
  const tt = t.staffUi.invoices;
  const navigate = useNavigate();
  const location = useLocation();
  const base = location.pathname.startsWith("/portal") ? "/portal/invoices" : "/app/invoices";
  const [page] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["invoices", page],
    queryFn: () => financeApi.invoices({ page, page_size: 20 }),
  });

  const columns: Column<Invoice>[] = [
    { key: "code", header: tt.colCode, render: (i) => <span className="font-mono text-[12px]">{i.code}</span> },
    { key: "status", header: tt.colStatus, render: (i) => <StatusBadge status={i.status} /> },
    { key: "issued", header: tt.colIssued, render: (i) => formatDate(i.issue_date) },
    { key: "due", header: tt.colDue, render: (i) => formatDate(i.due_date) },
    { key: "balance", header: tt.colBalance, align: "right",
      render: (i) => <span className={i.balance > 0 ? "text-danger font-semibold" : ""}>{formatMoney(i.balance, i.currency)}</span> },
    { key: "total", header: tt.colTotal, align: "right", render: (i) => formatMoney(i.grand_total, i.currency) },
  ];

  return (
    <div className="page-shell">
      <PageHeader title={tt.title} description={tt.description} />
      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        loading={isLoading}
        rowKey={(r) => r.id}
        onRowClick={(row) => navigate(`${base}/${row.id}`)}
        empty={<EmptyState icon={<Receipt className="size-7" />} title={tt.emptyTitle} description={tt.emptyDesc} />}
      />
    </div>
  );
}
