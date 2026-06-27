import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, FileText, Receipt } from "lucide-react";
import toast from "react-hot-toast";

import { financeApi } from "@/api/modules";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Column, DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDate, formatMoney } from "@/lib/format";
import { useT } from "@/i18n/useT";
import type { Quotation } from "@/types/api";

export default function QuotationsPage() {
  const { t } = useT();
  const tt = t.staffUi.quotations;
  const [page] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["quotations", page],
    queryFn: () => financeApi.quotations({ page, page_size: 20 }),
  });

  const accept = useMutation({
    mutationFn: (id: number) => financeApi.acceptQuotation(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["quotations"] }); toast.success(tt.accepted); },
  });
  const toInvoice = useMutation({
    mutationFn: (id: number) => financeApi.invoiceFromQuotation(id),
    onSuccess: (inv) => { toast.success(tt.invoiceCreated.replace("{code}", inv.code)); },
  });

  const columns: Column<Quotation>[] = [
    { key: "code", header: tt.colCode, render: (q) => <span className="font-mono text-[12px]">{q.code}</span> },
    { key: "status", header: tt.colStatus, render: (q) => <StatusBadge status={q.status} /> },
    { key: "issued", header: tt.colIssued, render: (q) => formatDate(q.issue_date) },
    { key: "valid", header: tt.colValid, render: (q) => formatDate(q.valid_until) },
    { key: "total", header: tt.colTotal, align: "right", render: (q) => formatMoney(q.grand_total, q.currency) },
    {
      key: "actions", header: "", align: "right",
      render: (q) => (
        <div className="flex justify-end gap-1.5">
          <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); accept.mutate(q.id); }}
                  disabled={q.status === "accepted"} icon={<CheckCircle2 className="size-3.5" />}>
            {tt.accept}
          </Button>
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); toInvoice.mutate(q.id); }}
                  disabled={q.status !== "accepted"} icon={<Receipt className="size-3.5" />}>
            {tt.invoice}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-shell">
      <PageHeader title={tt.title} description={tt.description} />
      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        loading={isLoading}
        rowKey={(r) => r.id}
        empty={<EmptyState icon={<FileText className="size-7" />} title={tt.emptyTitle} description={tt.emptyDesc} />}
      />
    </div>
  );
}
