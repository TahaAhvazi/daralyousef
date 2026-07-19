import { useMemo, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  Clock3,
  Copy,
  CreditCard,
  FileText,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Printer,
  RotateCcw,
  Send,
  Trash2,
  UserRound,
  Wallet,
} from "lucide-react";
import toast from "react-hot-toast";

import { financeApi, salesApi } from "@/api/modules";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs } from "@/components/ui/Tabs";
import { useBrand } from "@/hooks/useBrand";
import { apiErrorMessage } from "@/lib/apiErrors";
import { staffBreadcrumbs } from "@/lib/breadcrumbs";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { hasAnyPermission } from "@/lib/permissions";
import { useAuthStore } from "@/store/auth";
import { useT } from "@/i18n/useT";
import type { Invoice, InvoiceActivityEvent } from "@/types/api";

type DetailTab = "invoice" | "details" | "stock" | "activity";

async function savePdfBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function displayStatus(inv: Invoice): string {
  if (inv.paid_total > inv.grand_total + 0.01) return "overpaid";
  const today = new Date().toISOString().slice(0, 10);
  if (inv.balance > 0 && inv.due_date && inv.due_date < today) return "late";
  return inv.status;
}

function statusVariant(status: string): "success" | "warning" | "danger" | "brand" | "default" {
  if (status === "paid") return "success";
  if (status === "partial") return "warning";
  if (status === "unpaid" || status === "late") return "danger";
  if (status === "overpaid") return "brand";
  return "default";
}

function parseSoldBy(notes?: string | null): string | null {
  if (!notes) return null;
  for (const line of notes.split("\n")) {
    const raw = line.trim();
    for (const p of ["Salesperson:", "مسؤول المبيعات:", "salesperson:"]) {
      if (raw.toLowerCase().startsWith(p.toLowerCase())) {
        return raw.slice(p.length).trim().replace(/^[:：]\s*/, "") || null;
      }
    }
  }
  return null;
}

function parseWarehouse(notes?: string | null): string | null {
  if (!notes) return null;
  for (const line of notes.split("\n")) {
    const raw = line.trim();
    for (const p of ["Warehouse:", "المستودع:"]) {
      if (raw.toLowerCase().startsWith(p.toLowerCase())) {
        return raw.slice(p.length).trim().replace(/^[:：]\s*/, "") || null;
      }
    }
  }
  return null;
}

function formatActivityTitle(
  ev: InvoiceActivityEvent,
  d: {
    activityCreated: string;
    activityPayment: string;
    activityStock: string;
    activityUpdate: string;
    stockIssueUndone: string;
  },
  invoice: Invoice,
) {
  const who = ev.user_name || (ev.user_id ? `#${ev.user_id}` : "");
  if (ev.kind === "create" || ev.action === "create") {
    return `${d.activityCreated}${who ? ` · ${who}` : ""} · ${invoice.code}`;
  }
  if (ev.kind === "payment" || ev.action === "payment") {
    return `${d.activityPayment}${who ? ` · ${who}` : ""}${ev.detail ? ` · ${ev.detail}` : ""}`;
  }
  if (ev.kind === "stock_issue" || ev.action === "stock_issue") {
    return `${d.activityStock}${who ? ` · ${who}` : ""}${ev.detail ? ` · #${ev.detail}` : ""}`;
  }
  if (ev.kind === "stock_issue_void" || ev.action === "stock_issue_void") {
    return `${d.stockIssueUndone}${who ? ` · ${who}` : ""}${ev.detail ? ` · ${ev.detail}` : ""}`;
  }
  if (ev.kind === "update" || ev.action === "update") {
    return `${d.activityUpdate}${who ? ` · ${who}` : ""} · ${invoice.code}`;
  }
  return ev.title;
}

function groupActivityByDay(items: InvoiceActivityEvent[], locale: string) {
  const fmt = new Intl.DateTimeFormat(locale.startsWith("ar") ? "ar" : "en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const dayKey = (iso: string) => iso.slice(0, 10);
  const labelFor = (key: string) => {
    const tKey = dayKey(today.toISOString());
    const yKey = dayKey(yesterday.toISOString());
    if (key === tKey) return locale.startsWith("ar") ? "اليوم" : "Today";
    if (key === yKey) return locale.startsWith("ar") ? "الأمس" : "Yesterday";
    return fmt.format(new Date(`${key}T12:00:00`));
  };
  const map = new Map<string, InvoiceActivityEvent[]>();
  for (const ev of items) {
    const k = dayKey(ev.occurred_at);
    const arr = map.get(k) ?? [];
    arr.push(ev);
    map.set(k, arr);
  }
  return [...map.entries()].map(([key, events]) => ({
    key,
    label: labelFor(key),
    events,
  }));
}

function publicNotes(notes?: string | null): string {
  if (!notes) return "";
  return notes
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => {
      if (!l) return false;
      const lower = l.toLowerCase();
      return !(
        lower.startsWith("salesperson") ||
        lower.startsWith("مسؤول") ||
        lower.startsWith("warehouse") ||
        lower.startsWith("المستودع") ||
        lower.startsWith("invoice template") ||
        lower.startsWith("قالب") ||
        lower.startsWith("invoice date") ||
        lower.startsWith("تاريخ الفاتورة") ||
        lower.startsWith("invoice discount") ||
        lower.startsWith("خصم") ||
        lower.startsWith("settlement") ||
        lower.startsWith("التسوية") ||
        lower.startsWith("advance") ||
        lower.startsWith("الدفعة") ||
        lower.startsWith("deposit") ||
        lower.startsWith("إيداع")
      );
    })
    .join("\n");
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const invoiceId = Number(id);
  const navigate = useNavigate();
  const location = useLocation();
  const isPortal = location.pathname.startsWith("/portal");
  const base = isPortal ? "/portal/invoices" : "/app/invoices";
  const user = useAuthStore((s) => s.user);
  const { t, locale } = useT();
  const fi = t.staffUi.invoices;
  const d = fi.detail;
  const listSt = fi.list.statuses;
  const qc = useQueryClient();
  const brand = useBrand();
  const canManage = hasAnyPermission(user, "finance:update", "finance:create");
  const canPay = hasAnyPermission(user, "finance:create", "finance:update");

  const [tab, setTab] = useState<DetailTab>("invoice");
  const [payOpen, setPayOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [editDue, setEditDue] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [instCount, setInstCount] = useState("3");
  const [instFirstDue, setInstFirstDue] = useState(new Date().toISOString().slice(0, 10));
  const [activityAction, setActivityAction] = useState("");
  const [activityFrom, setActivityFrom] = useState("");
  const [activityTo, setActivityTo] = useState("");

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: () => financeApi.getInvoice(invoiceId),
    enabled: !!invoiceId,
  });

  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ["invoice-activity", invoiceId, activityAction, activityFrom, activityTo],
    queryFn: () =>
      financeApi.invoiceActivity(invoiceId, {
        action: activityAction || undefined,
        from_date: activityFrom ? `${activityFrom}T00:00:00` : undefined,
        to_date: activityTo ? `${activityTo}T23:59:59` : undefined,
      }),
    enabled: !!invoiceId && tab === "activity",
  });

  const { data: installments } = useQuery({
    queryKey: ["installments", "invoice", invoiceId],
    queryFn: () => salesApi.installments({ page: 1, page_size: 50 }),
    enabled: !!invoiceId && !isPortal,
  });

  const linkedPlans = useMemo(
    () => (installments?.items ?? []).filter((p: { invoice_id: number }) => p.invoice_id === invoiceId),
    [installments, invoiceId],
  );

  const activityItems = activityData?.items ?? [];
  const activityGroups = useMemo(
    () => groupActivityByDay(activityItems, locale),
    [activityItems, locale],
  );

  const togglePortal = useMutation({
    mutationFn: (portal_visible: boolean) => financeApi.updateInvoice(invoiceId, { portal_visible }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      toast.success(fi.portalUpdated);
    },
    onError: (err) => toast.error(apiErrorMessage(err, locale)),
  });

  const download = useMutation({
    mutationFn: async (lang: "en" | "ar") => {
      if (!invoice) return;
      const blob = await financeApi.downloadInvoicePdf(invoiceId, lang);
      await savePdfBlob(blob, `${invoice.code}_${lang}.pdf`);
    },
    onSuccess: () => toast.success(fi.pdfDownloaded),
    onError: (err) => toast.error(apiErrorMessage(err, locale)),
  });

  const saveEdit = useMutation({
    mutationFn: () =>
      financeApi.updateInvoice(invoiceId, {
        due_date: editDue || null,
        notes: editNotes,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      setEditOpen(false);
      toast.success(d.saved);
    },
    onError: (err) => toast.error(apiErrorMessage(err, locale)),
  });

  const recordPay = useMutation({
    mutationFn: () =>
      financeApi.recordPayment({
        customer_id: invoice!.customer_id,
        invoice_id: invoiceId,
        amount: Number(payAmount),
        method: payMethod,
        currency: invoice!.currency,
        paid_at: new Date().toISOString(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["invoice-activity", invoiceId] });
      setPayOpen(false);
      toast.success(d.paymentRecorded);
    },
    onError: (err) => toast.error(apiErrorMessage(err, locale)),
  });

  const createInstallment = useMutation({
    mutationFn: () =>
      salesApi.createInstallmentPlan({
        invoice_id: invoiceId,
        count: Number(instCount) || 3,
        first_due: instFirstDue,
        interval_days: 30,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["installments"] });
      setInstallOpen(false);
      toast.success(d.installmentCreated);
    },
    onError: (err) => toast.error(apiErrorMessage(err, locale)),
  });

  const copyInvoice = useMutation({
    mutationFn: async () => {
      if (!invoice) throw new Error("missing");
      return financeApi.createInvoice({
        customer_id: invoice.customer_id,
        order_id: invoice.order_id ?? undefined,
        issue_date: new Date().toISOString().slice(0, 10),
        due_date: invoice.due_date ?? undefined,
        currency: invoice.currency,
        notes: invoice.notes ?? undefined,
        items: (invoice.items ?? []).map((it) => ({
          name: it.name,
          description: it.description ?? undefined,
          quantity: it.quantity,
          unit: it.unit,
          unit_price: it.unit_price,
          discount_pct: it.discount_pct,
          tax_rate: it.tax_rate,
        })),
      });
    },
    onSuccess: (inv) => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success(d.copied.replace("{code}", inv.code));
      navigate(`/app/invoices/${inv.id}`);
    },
    onError: (err) => toast.error(apiErrorMessage(err, locale)),
  });

  const createCredit = useMutation({
    mutationFn: async () => {
      if (!invoice) throw new Error("missing");
      return salesApi.createCreditNote({
        customer_id: invoice.customer_id,
        invoice_id: invoice.id,
        issue_date: new Date().toISOString().slice(0, 10),
        currency: invoice.currency,
        reason: d.creditReason,
        items: (invoice.items ?? []).slice(0, 1).map((it) => ({
          name: it.name,
          quantity: 1,
          unit_price: it.unit_price,
          tax_rate: it.tax_rate,
        })),
      });
    },
    onSuccess: (cn) => {
      toast.success(d.creditCreated.replace("{code}", cn.code ?? ""));
      navigate("/app/credit-notes");
    },
    onError: (err) => toast.error(apiErrorMessage(err, locale)),
  });

  const createReturn = useMutation({
    mutationFn: async () => {
      if (!invoice) throw new Error("missing");
      return salesApi.createReturn({
        customer_id: invoice.customer_id,
        invoice_id: invoice.id,
        return_date: new Date().toISOString().slice(0, 10),
        currency: invoice.currency,
        create_credit_note: true,
        items: (invoice.items ?? []).slice(0, 1).map((it) => ({
          name: it.name,
          quantity: 1,
          unit_price: it.unit_price,
          tax_rate: it.tax_rate,
        })),
      });
    },
    onSuccess: () => {
      toast.success(d.returnCreated);
      navigate("/app/returns");
    },
    onError: (err) => toast.error(apiErrorMessage(err, locale)),
  });

  const issueStock = useMutation({
    mutationFn: (warehouseName?: string) =>
      financeApi.issueInvoiceStock(invoiceId, {
        warehouse_name: warehouseName,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      qc.invalidateQueries({ queryKey: ["invoice-activity", invoiceId] });
      toast.success(d.stockIssued);
    },
    onError: (err) => toast.error(apiErrorMessage(err, locale)),
  });

  const voidStock = useMutation({
    mutationFn: () => financeApi.voidInvoiceStock(invoiceId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      qc.invalidateQueries({ queryKey: ["invoice-activity", invoiceId] });
      toast.success(d.stockIssueUndone);
    },
    onError: (err) => toast.error(apiErrorMessage(err, locale)),
  });

  if (isLoading || !invoice) {
    return <div className="page-shell py-8 text-sm text-text-3">{fi.loading}</div>;
  }

  const st = displayStatus(invoice);
  const statusLabel =
    (listSt as Record<string, string>)[st] ??
    (t.portalUi.statuses as Record<string, string>)[st] ??
    st;
  const soldBy = parseSoldBy(invoice.notes) || invoice.sold_by;
  const warehouse = invoice.warehouse_name || parseWarehouse(invoice.notes);
  const createdByName = invoice.created_by_name || soldBy || null;
  const createdById = invoice.created_by_id ?? (!invoice.created_by_name ? invoice.salesperson_id ?? null : null);
  const salespersonName = soldBy || invoice.created_by_name || null;
  const salespersonId = invoice.salesperson_id ?? (!soldBy ? invoice.created_by_id ?? null : null);
  const notesBody = publicNotes(invoice.notes);
  const paidPct =
    invoice.grand_total > 0
      ? Math.min(100, Math.round((invoice.paid_total / invoice.grand_total) * 100))
      : 0;

  const openEdit = () => {
    setEditDue(invoice.due_date ?? "");
    setEditNotes(invoice.notes ?? "");
    setEditOpen(true);
  };

  const openPay = () => {
    setPayAmount(String(invoice.balance > 0 ? invoice.balance : invoice.grand_total));
    setPayOpen(true);
  };

  const printSheet = () => {
    setTab("invoice");
    setTimeout(() => window.print(), 50);
  };

  return (
    <div className="page-shell space-y-4">
      <PageHeader
        title={`${d.invoiceTitle} ${invoice.code}`}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {invoice.customer_name ? (
              <Link
                to={isPortal ? "#" : `/app/customers/${invoice.customer_id}`}
                className={isPortal ? "text-text-2" : "text-brand hover:underline"}
                onClick={(e) => isPortal && e.preventDefault()}
              >
                {invoice.customer_name}
              </Link>
            ) : null}
            <Badge variant={statusVariant(st)}>{statusLabel}</Badge>
            {invoice.order_code ? (
              <Link to={`/app/orders`} className="font-mono text-[12px] text-text-3 hover:text-brand">
                {invoice.order_code}
              </Link>
            ) : null}
          </span>
        }
        breadcrumbs={isPortal ? undefined : staffBreadcrumbs(location.pathname, t.staffUi.nav)}
        actions={
          <Button variant="secondary" className="min-h-10 print:hidden" icon={<Printer className="size-4" />} onClick={printSheet}>
            {d.print}
          </Button>
        }
      />

      {/* Toolbar */}
      {!isPortal && canManage ? (
        <div className="print:hidden -mx-1 overflow-x-auto overscroll-x-contain px-1 [scrollbar-width:thin]">
          <div className="flex min-w-max flex-nowrap items-center gap-1 rounded-2xl border border-border/80 bg-surface px-2 py-1.5 shadow-soft sm:gap-1.5 sm:px-2.5 sm:py-2">
          <ToolBtn icon={<Pencil className="size-3.5" />} label={d.edit} onClick={openEdit} />
          <ToolBtn icon={<Printer className="size-3.5" />} label={d.print} onClick={printSheet} />
          <ToolBtn
            icon={<FileText className="size-3.5" />}
            label={d.pdf}
            loading={download.isPending}
            onClick={() => download.mutate(locale.startsWith("ar") ? "ar" : "en")}
          />
          {canPay ? (
            <ToolBtn icon={<Wallet className="size-3.5" />} label={d.addPayment} onClick={openPay} />
          ) : null}
          <ToolBtn
            icon={<CreditCard className="size-3.5" />}
            label={d.creditNote}
            loading={createCredit.isPending}
            onClick={() => createCredit.mutate()}
          />
          <ToolBtn
            icon={<RotateCcw className="size-3.5" />}
            label={d.return}
            loading={createReturn.isPending}
            onClick={() => createReturn.mutate()}
          />
          <ToolBtn
            icon={<Copy className="size-3.5" />}
            label={d.copy}
            loading={copyInvoice.isPending}
            onClick={() => copyInvoice.mutate()}
          />
          <ToolBtn
            icon={<CalendarClock className="size-3.5" />}
            label={d.addInstallment}
            onClick={() => setInstallOpen(true)}
          />
          <ToolBtn
            icon={<Send className="size-3.5" />}
            label={invoice.portal_visible ? fi.hideFromPortal : fi.showInPortal}
            loading={togglePortal.isPending}
            onClick={() => togglePortal.mutate(!invoice.portal_visible)}
          />
          <div className="relative shrink-0">
            <ToolBtn
              icon={<MoreHorizontal className="size-3.5" />}
              label={d.more}
              onClick={() => setMoreOpen((v) => !v)}
            />
            {moreOpen ? (
              <div className="absolute end-0 z-20 mt-1 min-w-[180px] overflow-hidden rounded-xl border border-border bg-surface shadow-soft">
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-start text-[13px] hover:bg-surface-2"
                  onClick={() => {
                    setMoreOpen(false);
                    download.mutate("en");
                  }}
                >
                  {fi.downloadEn}
                </button>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-start text-[13px] hover:bg-surface-2"
                  onClick={() => {
                    setMoreOpen(false);
                    download.mutate("ar");
                  }}
                >
                  {fi.downloadAr}
                </button>
                <Link
                  to="/app/payments"
                  className="block w-full px-3 py-2 text-start text-[13px] hover:bg-surface-2"
                  onClick={() => setMoreOpen(false)}
                >
                  {d.allPayments}
                </Link>
              </div>
            ) : null}
          </div>
          </div>
        </div>
      ) : !isPortal ? (
        <div className="print:hidden flex flex-wrap gap-2">
          <Button variant="secondary" icon={<FileText className="size-4" />} loading={download.isPending} onClick={() => download.mutate("en")}>
            {fi.downloadEn}
          </Button>
          <Button variant="secondary" icon={<FileText className="size-4" />} loading={download.isPending} onClick={() => download.mutate("ar")}>
            {fi.downloadAr}
          </Button>
        </div>
      ) : (
        <div className="print:hidden">
          <Button variant="secondary" icon={<FileText className="size-4" />} loading={download.isPending} onClick={() => download.mutate(locale.startsWith("ar") ? "ar" : "en")}>
            {d.pdf}
          </Button>
        </div>
      )}

      <div className="print:hidden">
        <Tabs
          value={tab}
          onChange={(id) => setTab(id as DetailTab)}
          items={[
            { id: "invoice", label: d.tabInvoice },
            { id: "details", label: d.tabDetails },
            { id: "stock", label: d.tabStock },
            { id: "activity", label: d.tabActivity },
          ]}
        />
      </div>

      {/* Invoice document — visible on Invoice tab; always printable */}
      <div className={tab === "invoice" ? "block" : "hidden print:block"}>
        <InvoiceDocument
          invoice={invoice}
          brandName={brand.name}
          brandTagline={brand.tagline}
          logoUrl={brand.logoUrl}
          soldBy={soldBy}
          notesBody={notesBody}
          labels={{
            invoice: d.docTitle,
            invoiceNo: d.docNumber,
            invoiceDate: d.docDate,
            billTo: d.docBillTo,
            item: d.docItem,
            description: d.docDescription,
            unitPrice: d.docUnitPrice,
            qty: d.docQty,
            total: d.docLineTotal,
            subtotal: fi.colSubtotal,
            tax: fi.colTaxTotal,
            grand: fi.colTotal,
            paid: fi.colPaid,
            due: d.amountDue,
            notes: fi.notes,
          }}
        />
      </div>

      {tab === "details" ? (
        <div className="print:hidden space-y-4">
          {/* Summary header */}
          <Card>
            <CardBody className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1.2fr] lg:items-center">
              <div className="flex items-start gap-3">
                <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand/15 text-[16px] font-semibold text-brand">
                  {(invoice.customer_name || "?").slice(0, 1)}
                </div>
                <div>
                  <div className="text-[11.5px] font-semibold uppercase tracking-wide text-text-3">{d.docBillTo}</div>
                  <div className="mt-0.5 text-[15px] font-semibold">
                    {invoice.customer_name || `#${invoice.customer_id}`}
                    <span className="ms-1.5 font-mono text-[12px] font-normal text-text-3">#{invoice.customer_id}</span>
                  </div>
                  {invoice.customer_email ? (
                    <div className="text-[12.5px] text-text-3">{invoice.customer_email}</div>
                  ) : null}
                </div>
              </div>
              <div>
                <div className="text-[11.5px] text-text-3">{d.issueDate}</div>
                <div className="mt-0.5 text-[14px] font-medium tabular-nums">{formatDate(invoice.issue_date)}</div>
              </div>
              <div>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[11.5px] text-text-3">{d.totalAmount}</span>
                  <span className="text-[16px] font-semibold tabular-nums">
                    {formatMoney(invoice.grand_total, invoice.currency)}
                  </span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[rgb(var(--danger)/0.2)]">
                  <div
                    className="h-full rounded-full bg-[rgb(var(--success))] transition-all"
                    style={{ width: `${paidPct}%` }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between gap-3 text-[12px]">
                  <span className="text-text-3">
                    {fi.colPaid}: <span className="font-medium text-text tabular-nums">{formatMoney(invoice.paid_total, invoice.currency)}</span>
                  </span>
                  <span className="text-danger">
                    {d.amountDue}: <span className="font-semibold tabular-nums">{formatMoney(invoice.balance, invoice.currency)}</span>
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Attribution */}
          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <CardBody className="space-y-1.5">
                <div className="text-[11.5px] font-semibold uppercase tracking-wide text-text-3">{d.createdBy}</div>
                <div className="flex items-center gap-2">
                  <div className="grid size-8 place-items-center rounded-full bg-surface-2 text-text-3">
                    <UserRound className="size-4" />
                  </div>
                  <div>
                    {createdByName && createdById ? (
                      <Link
                        to={`/app/hr/employees/${createdById}`}
                        className="text-[13.5px] font-medium text-brand hover:underline"
                      >
                        {createdByName}
                      </Link>
                    ) : (
                      <div className="text-[13.5px] font-medium">{createdByName || "—"}</div>
                    )}
                    <div className="text-[12px] tabular-nums text-text-3">{formatDateTime(invoice.created_at)}</div>
                  </div>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="space-y-1.5">
                <div className="text-[11.5px] font-semibold uppercase tracking-wide text-text-3">{d.lastAction}</div>
                <Badge variant={statusVariant(st)}>{d.actionCreated}</Badge>
                <div className="flex items-center gap-1.5 text-[12px] text-text-3">
                  <Clock3 className="size-3.5" />
                  <span className="tabular-nums">{formatDateTime(invoice.created_at)}</span>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="space-y-1.5">
                <div className="text-[11.5px] font-semibold uppercase tracking-wide text-text-3">{d.salesperson}</div>
                <div className="flex items-center gap-2">
                  <div className="grid size-8 place-items-center rounded-full bg-surface-2 text-text-3">
                    <UserRound className="size-4" />
                  </div>
                  {salespersonName && salespersonId ? (
                    <Link
                      to={`/app/hr/employees/${salespersonId}`}
                      className="text-[13.5px] font-medium text-brand hover:underline"
                    >
                      {salespersonName}
                    </Link>
                  ) : (
                    <div className="text-[13.5px] font-medium">{salespersonName || "—"}</div>
                  )}
                </div>
                {invoice.order_code ? (
                  <Link to={`/app/orders`} className="inline-block text-[12.5px] text-brand hover:underline">
                    {d.salesRecord}: {invoice.order_code}
                  </Link>
                ) : null}
              </CardBody>
            </Card>
          </div>

          {/* Line items */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-start text-[13px]">
                <thead>
                  <tr className="border-b border-border bg-surface-2/50 text-[11px] font-semibold uppercase tracking-wide text-text-3">
                    <th className="px-4 py-2.5">{d.docItem}</th>
                    <th className="px-4 py-2.5">{d.docDescription}</th>
                    <th className="px-4 py-2.5 text-end">{d.docUnitPrice}</th>
                    <th className="px-4 py-2.5 text-end">{d.docQty}</th>
                    <th className="px-4 py-2.5 text-end">{d.docLineTotal}</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoice.items ?? []).map((it, i) => (
                    <tr key={it.id ?? i} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-2.5 font-medium">{it.name}</td>
                      <td className="px-4 py-2.5 text-text-2">{it.description || "—"}</td>
                      <td className="px-4 py-2.5 text-end tabular-nums">{formatMoney(it.unit_price, invoice.currency)}</td>
                      <td className="px-4 py-2.5 text-end tabular-nums">{it.quantity}</td>
                      <td className="px-4 py-2.5 text-end font-semibold tabular-nums">
                        {formatMoney(it.line_total ?? 0, invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <CardBody className="flex justify-end border-t border-border">
              <div className="min-w-[220px] space-y-1.5 text-[13.5px]">
                <TotRow label={fi.colTotal} value={formatMoney(invoice.grand_total, invoice.currency)} bold />
                <TotRow label={fi.colPaid} value={formatMoney(invoice.paid_total, invoice.currency)} />
                <TotRow label={d.amountDue} value={formatMoney(invoice.balance, invoice.currency)} bold danger={invoice.balance > 0} />
              </div>
            </CardBody>
          </Card>

          {/* Shipping */}
          <Card>
            <CardBody>
              <div className="mb-2 text-[13px] font-semibold">{d.shippingData}</div>
              <DetailRow label={d.warehouse} value={warehouse || d.noWarehouse} />
            </CardBody>
          </Card>
        </div>
      ) : null}

      {tab === "stock" ? (
        <div className="print:hidden space-y-4">
          <Card>
            <div className="border-b border-border px-4 py-3 text-[13px] font-semibold sm:px-5">
              {d.productsList}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-start text-[13px]">
                <thead>
                  <tr className="border-b border-border bg-surface-2/50 text-[11px] font-semibold uppercase tracking-wide text-text-3">
                    <th className="px-4 py-2.5">{d.docItem}</th>
                    <th className="px-4 py-2.5 text-end">{d.docUnitPrice}</th>
                    <th className="px-4 py-2.5 text-end">{d.qtyRequired}</th>
                    <th className="px-4 py-2.5 text-end">{d.qtyReceived}</th>
                    <th className="px-4 py-2.5 text-end">{fi.colTotal}</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoice.items ?? []).map((it, i) => (
                    <tr key={it.id ?? i} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-2.5">
                        <span className="font-medium">{it.name}</span>
                        {it.id ? <span className="ms-1.5 font-mono text-[11.5px] text-text-3">#{it.id}</span> : null}
                      </td>
                      <td className="px-4 py-2.5 text-end tabular-nums">{formatMoney(it.unit_price, invoice.currency)}</td>
                      <td className="px-4 py-2.5 text-end tabular-nums">{it.quantity}</td>
                      <td className="px-4 py-2.5 text-end tabular-nums">
                        {invoice.stock_issued ? it.quantity : 0}
                      </td>
                      <td className="px-4 py-2.5 text-end font-semibold tabular-nums">
                        {formatMoney(it.line_total ?? 0, invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <CardBody className="flex justify-end border-t border-border text-[14px] font-semibold">
              <span className="me-6 text-text-3">{fi.colTotal}</span>
              <span className="tabular-nums text-brand">{formatMoney(invoice.grand_total, invoice.currency)}</span>
            </CardBody>
          </Card>

          {invoice.stock_issued ? (
            <Card>
              <CardBody className="grid gap-3 lg:grid-cols-[1.4fr_1fr_auto] lg:items-center">
                <div className="space-y-1">
                  <div className="text-[13px] font-semibold tabular-nums">
                    {formatDate(invoice.stock_issue_at || invoice.issue_date)} · #{invoice.stock_issue_code}
                  </div>
                  <div className="text-[13px] text-text-2">
                    {invoice.customer_name} · {d.invoiceTitle} #{invoice.code}
                  </div>
                  <div className="flex items-center gap-1.5 text-[12.5px] text-text-3">
                    <Package className="size-3.5" />
                    {d.stockIssueBy
                      .replace("{warehouse}", warehouse || "Primary")
                      .replace("{user}", invoice.created_by_name || soldBy || "—")}
                  </div>
                </div>
                <div>
                  <div className="text-[13px] font-medium">{d.actionCreated}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-text-3">
                    <Clock3 className="size-3.5" />
                    <span className="tabular-nums">{formatDateTime(invoice.stock_issue_at || invoice.created_at)}</span>
                  </div>
                </div>
                <div className="flex flex-col items-stretch gap-2 sm:items-end">
                  <Badge variant="warning">{d.underDelivery}</Badge>
                  {!isPortal && canManage ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Trash2 className="size-3.5" />}
                      loading={voidStock.isPending}
                      onClick={() => {
                        if (window.confirm(d.confirmUndoStock)) voidStock.mutate();
                      }}
                    >
                      {d.undoStockVoucher}
                    </Button>
                  ) : null}
                </div>
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardBody className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-[14px] font-semibold">{d.noStockVoucher}</div>
                  <p className="mt-1 text-[13px] text-text-3">{d.stockHint}</p>
                </div>
                {!isPortal && canManage ? (
                  <Button
                    icon={<Plus className="size-4" />}
                    loading={issueStock.isPending}
                    onClick={() => issueStock.mutate(warehouse || undefined)}
                  >
                    {d.createStockVoucher}
                  </Button>
                ) : null}
              </CardBody>
            </Card>
          )}

          {linkedPlans.length > 0 ? (
            <Card>
              <CardBody className="space-y-2">
                <div className="text-[13px] font-semibold">{d.linkedInstallments}</div>
                {linkedPlans.map((p: { id: number; code: string; status: string }) => (
                  <Link key={p.id} to="/app/installments" className="block text-[13px] text-brand hover:underline">
                    {p.code} · {p.status}
                  </Link>
                ))}
              </CardBody>
            </Card>
          ) : null}
        </div>
      ) : null}

      {tab === "activity" ? (
        <div className="print:hidden space-y-4">
          <Card>
            <CardBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Select
                label={d.filterActions}
                options={[
                  { value: "", label: d.allActions },
                  { value: "create", label: d.actionCreated },
                  { value: "payment", label: d.activityPayment },
                  { value: "stock_issue", label: d.activityStock },
                  { value: "update", label: d.activityUpdate },
                ]}
                value={activityAction}
                onChange={(e) => setActivityAction((e.target as HTMLSelectElement).value)}
              />
              <Input
                label={d.periodFrom}
                type="date"
                value={activityFrom}
                onChange={(e) => setActivityFrom(e.target.value)}
              />
              <Input
                label={d.periodTo}
                type="date"
                value={activityTo}
                onChange={(e) => setActivityTo(e.target.value)}
              />
              <div className="flex items-end">
                <Button
                  variant="secondary"
                  className="min-h-10 w-full"
                  onClick={() => {
                    setActivityAction("");
                    setActivityFrom("");
                    setActivityTo("");
                  }}
                >
                  {fi.list.clearFilters}
                </Button>
              </div>
            </CardBody>
          </Card>

          {activityLoading ? (
            <Card>
              <CardBody className="py-8 text-center text-[13px] text-text-3">{fi.loading}</CardBody>
            </Card>
          ) : activityGroups.length === 0 ? (
            <Card>
              <CardBody className="py-8 text-center text-[13px] text-text-3">{d.noActivityExtra}</CardBody>
            </Card>
          ) : (
            <div className="space-y-6">
              {activityGroups.map((group) => (
                <div key={group.key} className="relative ps-6">
                  <div className="absolute start-[7px] top-8 bottom-0 w-px bg-border" />
                  <div className="mb-3 inline-flex rounded-full bg-surface-2 px-3 py-1 text-[12px] font-medium text-text-2">
                    {group.label}
                  </div>
                  <div className="space-y-3">
                    {group.events.map((ev) => (
                      <div key={ev.id} className="relative">
                        <div className="absolute -start-6 top-4 grid size-4 place-items-center rounded-full bg-[rgb(var(--success))] text-white shadow-soft">
                          <Plus className="size-2.5" strokeWidth={3} />
                        </div>
                        <Card>
                          <CardBody className="space-y-2">
                            <p className="text-[13.5px] leading-relaxed text-text">
                              {formatActivityTitle(ev, d, invoice)}
                            </p>
                            {ev.detail ? (
                              <p className="text-[12.5px] text-text-3">{ev.detail}</p>
                            ) : null}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/70 pt-2 text-[12px] text-text-3">
                              <span className="inline-flex items-center gap-1 tabular-nums">
                                <Clock3 className="size-3.5" />
                                {formatDateTime(ev.occurred_at)}
                              </span>
                              {ev.user_name || ev.user_id ? (
                                <span className="inline-flex items-center gap-1">
                                  <UserRound className="size-3.5" />
                                  {ev.user_name || `#${ev.user_id}`}
                                  {ev.user_id ? (
                                    <span className="font-mono text-[11px]">(#{String(ev.user_id).padStart(6, "0")})</span>
                                  ) : null}
                                </span>
                              ) : null}
                            </div>
                          </CardBody>
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* Payment modal */}
      <Modal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        title={d.addPayment}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPayOpen(false)}>{t.staffUi.common.cancel}</Button>
            <Button
              loading={recordPay.isPending}
              disabled={!payAmount || Number(payAmount) <= 0}
              onClick={() => recordPay.mutate()}
            >
              {t.staffUi.common.record}
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <Input label={d.amount} type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
          <Select
            label={d.method}
            options={[
              { value: "cash", label: fi.createForm.payMethodCash },
              { value: "card", label: fi.createForm.payMethodCard },
              { value: "transfer", label: fi.createForm.payMethodTransfer },
              { value: "deposit", label: fi.createForm.payMethodDeposit },
            ]}
            value={payMethod}
            onChange={(e) => setPayMethod((e.target as HTMLSelectElement).value)}
          />
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={d.edit}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>{t.staffUi.common.cancel}</Button>
            <Button loading={saveEdit.isPending} onClick={() => saveEdit.mutate()}>{t.staffUi.common.save}</Button>
          </>
        }
      >
        <div className="grid gap-3">
          <Input label={fi.colDue} type="date" value={editDue} onChange={(e) => setEditDue(e.target.value)} />
          <Textarea label={fi.notes} rows={5} value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
        </div>
      </Modal>

      {/* Installment modal */}
      <Modal
        open={installOpen}
        onClose={() => setInstallOpen(false)}
        title={d.addInstallment}
        footer={
          <>
            <Button variant="secondary" onClick={() => setInstallOpen(false)}>{t.staffUi.common.cancel}</Button>
            <Button loading={createInstallment.isPending} onClick={() => createInstallment.mutate()}>
              {t.staffUi.common.create}
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <Input label={d.installmentCount} type="number" value={instCount} onChange={(e) => setInstCount(e.target.value)} />
          <Input label={d.firstDue} type="date" value={instFirstDue} onChange={(e) => setInstFirstDue(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
}

function ToolBtn({
  icon,
  label,
  onClick,
  loading,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-9 shrink-0 gap-1.5 whitespace-nowrap px-2.5 text-[12.5px] sm:h-9 sm:px-3 sm:text-[13px]"
      icon={icon}
      loading={loading}
      onClick={onClick}
    >
      <span>{label}</span>
    </Button>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11.5px] text-text-3">{label}</div>
      <div className="mt-0.5 font-medium text-text">{value}</div>
    </div>
  );
}

function InvoiceDocument({
  invoice,
  brandName,
  brandTagline,
  logoUrl,
  soldBy,
  notesBody,
  labels,
}: {
  invoice: Invoice;
  brandName: string;
  brandTagline: string;
  logoUrl: string;
  soldBy: string | null | undefined;
  notesBody: string;
  labels: Record<string, string>;
}) {
  return (
    <Card className="invoice-print-sheet overflow-hidden">
      <CardBody className="space-y-6 p-5 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <img src={logoUrl} alt="" className="size-14 rounded-xl object-cover border border-border" />
            <div>
              <div className="text-[16px] font-semibold text-text">{brandName}</div>
              <div className="mt-0.5 max-w-xs text-[12.5px] text-text-3">{brandTagline}</div>
            </div>
          </div>
          <div className="sm:text-end">
            <div className="text-[22px] font-semibold tracking-tight text-brand">{labels.invoice}</div>
            <div className="mt-1 text-[13px] text-text-2">
              {labels.invoiceNo}: <span className="font-mono font-semibold text-text">{invoice.code}</span>
            </div>
            <div className="text-[13px] text-text-2">
              {labels.invoiceDate}: <span className="tabular-nums">{formatDate(invoice.issue_date)}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-[11.5px] font-semibold uppercase tracking-wide text-text-3">{labels.billTo}</div>
            <div className="mt-1 text-[14.5px] font-semibold">{invoice.customer_name || `#${invoice.customer_id}`}</div>
            {invoice.customer_email ? <div className="text-[12.5px] text-text-3">{invoice.customer_email}</div> : null}
            {soldBy ? <div className="mt-1 text-[12.5px] text-text-3">{soldBy}</div> : null}
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[640px] text-start text-[13px]">
            <thead>
              <tr className="border-b border-border bg-surface-2/60 text-[11px] font-semibold uppercase tracking-wide text-text-3">
                <th className="px-3 py-2.5">{labels.item}</th>
                <th className="px-3 py-2.5">{labels.description}</th>
                <th className="px-3 py-2.5 text-end">{labels.unitPrice}</th>
                <th className="px-3 py-2.5 text-end">{labels.qty}</th>
                <th className="px-3 py-2.5 text-end">{labels.total}</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items ?? []).map((it, i) => (
                <tr key={it.id ?? i} className="border-b border-border/60 last:border-0">
                  <td className="px-3 py-2.5 font-medium">{it.name}</td>
                  <td className="px-3 py-2.5 text-text-2">{it.description || "—"}</td>
                  <td className="px-3 py-2.5 text-end tabular-nums">{formatMoney(it.unit_price, invoice.currency)}</td>
                  <td className="px-3 py-2.5 text-end tabular-nums">{it.quantity}</td>
                  <td className="px-3 py-2.5 text-end font-semibold tabular-nums">
                    {formatMoney(it.line_total ?? 0, invoice.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
          <div className="max-w-md text-[13px] text-text-2">
            {notesBody ? (
              <>
                <div className="mb-1 text-[11.5px] font-semibold uppercase tracking-wide text-text-3">{labels.notes}</div>
                <p className="whitespace-pre-wrap">{notesBody}</p>
              </>
            ) : null}
          </div>
          <div className="min-w-[220px] space-y-1.5 text-[13.5px]">
            <TotRow label={labels.subtotal} value={formatMoney(invoice.subtotal, invoice.currency)} />
            <TotRow label={labels.tax} value={formatMoney(invoice.tax_total, invoice.currency)} />
            <TotRow label={labels.grand} value={formatMoney(invoice.grand_total, invoice.currency)} bold />
            <TotRow label={labels.paid} value={formatMoney(invoice.paid_total, invoice.currency)} />
            <TotRow label={labels.due} value={formatMoney(invoice.balance, invoice.currency)} bold danger={invoice.balance > 0} />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function TotRow({
  label,
  value,
  bold,
  danger,
}: {
  label: string;
  value: string;
  bold?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="flex justify-between gap-6">
      <span className="text-text-3">{label}</span>
      <span className={`tabular-nums ${bold ? "font-semibold" : ""} ${danger ? "text-danger" : "text-text"}`}>
        {value}
      </span>
    </div>
  );
}
