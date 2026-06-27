import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Download, Link2 } from "lucide-react";
import toast from "react-hot-toast";

import { financeApi } from "@/api/modules";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDate, formatMoney } from "@/lib/format";
import { hasAnyPermission } from "@/lib/permissions";
import { useAuthStore } from "@/store/auth";
import { useT } from "@/i18n/useT";
import type { LineItem } from "@/types/api";

async function savePdfBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const invoiceId = Number(id);
  const navigate = useNavigate();
  const location = useLocation();
  const isPortal = location.pathname.startsWith("/portal");
  const base = isPortal ? "/portal/invoices" : "/app/invoices";
  const user = useAuthStore((s) => s.user);
  const { t } = useT();
  const fi = t.staffUi.invoices;
  const qc = useQueryClient();
  const canManage = hasAnyPermission(user, "finance:update", "finance:create");

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: () => financeApi.getInvoice(invoiceId),
    enabled: !!invoiceId,
  });

  const togglePortal = useMutation({
    mutationFn: (portal_visible: boolean) => financeApi.updateInvoice(invoiceId, { portal_visible }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      toast.success(fi.portalUpdated);
    },
  });

  const download = useMutation({
    mutationFn: async (lang: "en" | "ar") => {
      if (!invoice) return;
      const blob = await financeApi.downloadInvoicePdf(invoiceId, lang);
      await savePdfBlob(blob, `${invoice.code}_${lang}.pdf`);
    },
    onSuccess: () => toast.success(fi.pdfDownloaded),
  });

  if (isLoading || !invoice) {
    return <div className="page-shell py-8 text-text-3 text-sm">{fi.loading}</div>;
  }

  const itemCols: Column<LineItem>[] = [
    { key: "name", header: fi.colDescription, render: (it) => (
      <div>
        <div className="font-medium">{it.name}</div>
        {it.description ? <div className="text-[11px] text-text-3">{it.description}</div> : null}
      </div>
    ) },
    { key: "qty", header: fi.colQty, render: (it) => `${it.quantity} ${it.unit}` },
    { key: "price", header: fi.colUnitPrice, align: "right", render: (it) => formatMoney(it.unit_price, invoice.currency) },
    { key: "tax", header: fi.colTax, align: "right", render: (it) => `${it.tax_rate}%` },
    { key: "total", header: fi.colLineTotal, align: "right", render: (it) => formatMoney(it.line_total ?? 0, invoice.currency) },
  ];

  return (
    <div className="page-shell">
      <PageHeader
        title={invoice.code}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge status={invoice.status} />
            {invoice.customer_name ? <span>{invoice.customer_name}</span> : null}
            {invoice.order_code ? (
              <span className="font-mono text-[12px] text-text-3">{invoice.order_code}</span>
            ) : null}
          </span>
        }
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate(base)} className="w-full sm:w-auto">
              <ArrowLeft className="size-4" /> {fi.back}
            </Button>
            <Button
              variant="primary"
              icon={<Download className="size-4" />}
              loading={download.isPending}
              onClick={() => download.mutate("en")}
              className="w-full sm:w-auto"
            >
              {fi.downloadEn}
            </Button>
            <Button
              variant="secondary"
              icon={<Download className="size-4" />}
              loading={download.isPending}
              onClick={() => download.mutate("ar")}
              className="w-full sm:w-auto"
            >
              {fi.downloadAr}
            </Button>
            {canManage && !isPortal ? (
              <Button
                variant="ghost"
                icon={<Link2 className="size-4" />}
                onClick={() => togglePortal.mutate(!invoice.portal_visible)}
                className="w-full sm:w-auto"
              >
                {invoice.portal_visible ? fi.hideFromPortal : fi.showInPortal}
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title={fi.lineItems} />
          <CardBody className="p-0 sm:p-0">
            <DataTable columns={itemCols} rows={invoice.items} rowKey={(r, i) => r.id ?? i} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={fi.summary} />
          <CardBody className="space-y-2 text-[13px]">
            <Row label={fi.colIssued} value={formatDate(invoice.issue_date)} />
            <Row label={fi.colDue} value={formatDate(invoice.due_date)} />
            <Row label={fi.colSubtotal} value={formatMoney(invoice.subtotal, invoice.currency)} />
            <Row label={fi.colTaxTotal} value={formatMoney(invoice.tax_total, invoice.currency)} />
            <Row label={fi.colTotal} value={formatMoney(invoice.grand_total, invoice.currency)} bold />
            <Row label={fi.colPaid} value={formatMoney(invoice.paid_total, invoice.currency)} />
            <Row label={fi.colBalance} value={formatMoney(invoice.balance, invoice.currency)} bold danger={invoice.balance > 0} />
            {invoice.notes ? (
              <div className="pt-2 border-t border-border">
                <div className="text-text-3 text-[11px] uppercase tracking-wide mb-1">{fi.notes}</div>
                <p className="text-text-2">{invoice.notes}</p>
              </div>
            ) : null}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value, bold, danger }: { label: string; value: string; bold?: boolean; danger?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-text-3">{label}</span>
      <span className={bold ? `font-semibold ${danger ? "text-danger" : "text-text"}` : "text-text"}>{value}</span>
    </div>
  );
}
