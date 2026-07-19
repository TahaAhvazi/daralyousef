import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleHelp, Eye, MinusCircle, Plus, Save } from "lucide-react";
import toast from "react-hot-toast";

import {
  catalogApi,
  customersApi,
  financeApi,
  inventoryApi,
  salesApi,
  usersApi,
} from "@/api/modules";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs } from "@/components/ui/Tabs";
import { formatMoney } from "@/lib/format";
import { localizedProductName } from "@/lib/catalog";
import { staffBreadcrumbs } from "@/lib/breadcrumbs";
import { apiErrorMessage } from "@/lib/apiErrors";
import { useAuthStore } from "@/store/auth";
import { useT } from "@/i18n/useT";

interface LineDraft {
  product_id: number | null;
  name: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_pct: number;
  tax_rate: number;
}

type FooterTab = "settlement" | "deposit" | "warehouse" | "attachments";

function emptyLine(tax = 0): LineDraft {
  return {
    product_id: null,
    name: "",
    description: "",
    quantity: 1,
    unit_price: 0,
    discount_pct: 0,
    tax_rate: tax,
  };
}

function lineNet(l: LineDraft) {
  const base = l.unit_price * l.quantity;
  const afterDisc = base * (1 - (l.discount_pct || 0) / 100);
  const tax = afterDisc * ((l.tax_rate || 0) / 100);
  return { afterDisc, tax, total: afterDisc + tax };
}

export default function NewInvoicePage() {
  const { t, locale } = useT();
  const ni = t.staffUi.invoices.createForm;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const { data: customers } = useQuery({
    queryKey: ["customers", "pick"],
    queryFn: () => customersApi.list({ page: 1, page_size: 200 }),
  });
  const { data: products } = useQuery({
    queryKey: ["products", "invoice"],
    queryFn: () => catalogApi.products({ page: 1, page_size: 100, active_only: true }),
  });
  const { data: settings } = useQuery({
    queryKey: ["sales-settings"],
    queryFn: () => salesApi.salesSettings(),
  });
  const { data: templates } = useQuery({
    queryKey: ["doc-templates"],
    queryFn: () => salesApi.templates({ page: 1, page_size: 50 }),
  });
  const { data: staffUsers } = useQuery({
    queryKey: ["users", "staff-pick"],
    queryFn: () => usersApi.list({ page: 1, page_size: 100 }),
  });
  const { data: warehouses } = useQuery({
    queryKey: ["warehouses"],
    queryFn: () => inventoryApi.warehouses(),
  });

  const defaultTax = settings?.default_tax_pct ?? 0;
  const defaultDue = settings?.default_due_days ?? 14;
  const [currency, setCurrency] = useState("IQD");

  const [customerId, setCustomerId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [issueDate, setIssueDate] = useState(today);
  const [invoiceDate, setInvoiceDate] = useState(today);
  const [dueDays, setDueDays] = useState(String(defaultDue));
  const [salespersonId, setSalespersonId] = useState(String(user?.id ?? ""));
  const [lines, setLines] = useState<LineDraft[]>([emptyLine(defaultTax)]);
  const [discountValue, setDiscountValue] = useState(0);
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [settlementNote, setSettlementNote] = useState("");
  const [settlementAdj, setSettlementAdj] = useState(0);
  const [advancePayment, setAdvancePayment] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);
  const [depositMethod, setDepositMethod] = useState("cash");
  const [warehouseId, setWarehouseId] = useState("");
  const [notes, setNotes] = useState("");
  const [alreadyPaid, setAlreadyPaid] = useState(false);
  const [footerTab, setFooterTab] = useState<FooterTab>("settlement");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");

  // Sync defaults when settings load
  useEffect(() => {
    if (settings?.default_currency) setCurrency(settings.default_currency);
    if (settings?.default_due_days != null) setDueDays(String(settings.default_due_days));
  }, [settings?.default_currency, settings?.default_due_days]);

  const totals = useMemo(() => {
    let subtotal = 0;
    let tax = 0;
    for (const l of lines) {
      const n = lineNet(l);
      subtotal += n.afterDisc;
      tax += n.tax;
    }
    const orderDisc =
      discountType === "percent"
        ? subtotal * ((discountValue || 0) / 100)
        : Math.min(subtotal, discountValue || 0);
    const afterDisc = subtotal - orderDisc;
    const grand = Math.max(0, afterDisc + tax + (settlementAdj || 0));
    return { subtotal, tax, orderDisc, grand };
  }, [lines, discountValue, discountType, settlementAdj]);

  const validLines = lines.filter((l) => l.name.trim() || l.product_id);
  const canSubmit = !!customerId && validLines.length > 0;

  const dueDate = useMemo(() => {
    const d = new Date(issueDate || today);
    d.setDate(d.getDate() + (Number(dueDays) || 0));
    return d.toISOString().slice(0, 10);
  }, [issueDate, dueDays, today]);

  const createCustomer = useMutation({
    mutationFn: () =>
      customersApi.create({
        full_name: newCustName.trim(),
        phone: newCustPhone || undefined,
        email: newCustEmail || undefined,
      }),
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      setCustomerId(String(c.id));
      setCustomerModalOpen(false);
      setNewCustName("");
      setNewCustPhone("");
      setNewCustEmail("");
      toast.success(t.staffUi.common.create);
    },
    onError: (err) => toast.error(apiErrorMessage(err, locale)),
  });

  const create = useMutation({
    mutationFn: async () => {
      const salesName = (staffUsers?.items ?? []).find((u) => String(u.id) === salespersonId)?.full_name;
      const whName = (warehouses ?? []).find((w) => String(w.id) === warehouseId)?.name;
      const tplName = (templates?.items ?? []).find((x: { id: number }) => String(x.id) === templateId)?.name;

      const discLabel =
        discountType === "percent" ? `${discountValue}%` : formatMoney(discountValue, currency);
      const metaNotes = [
        notes.trim(),
        salesName ? `${ni.salesperson}: ${salesName}` : "",
        invoiceDate && invoiceDate !== issueDate ? `${ni.invoiceDate}: ${invoiceDate}` : "",
        whName ? `${ni.warehouse}: ${whName}` : "",
        tplName ? `${ni.template}: ${tplName}` : "",
        totals.orderDisc > 0 ? `${ni.orderDiscount}: ${discLabel}` : "",
        settlementAdj
          ? `${ni.settlement}: ${settlementAdj}${settlementNote ? ` (${settlementNote})` : ""}`
          : "",
        advancePayment ? `${ni.advancePayment}: ${advancePayment}` : "",
        depositAmount ? `${ni.depositAmount}: ${depositAmount} (${depositMethod})` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const items = validLines.map((l) => ({
        name: l.name || ni.itemFallback,
        description: l.description || undefined,
        quantity: l.quantity,
        unit: "pcs",
        unit_price: l.unit_price,
        discount_pct: l.discount_pct,
        tax_rate: l.tax_rate,
      }));

      if (settlementAdj !== 0) {
        items.push({
          name: ni.settlement,
          description: settlementNote || undefined,
          quantity: 1,
          unit: "pcs",
          unit_price: settlementAdj,
          discount_pct: 0,
          tax_rate: 0,
        });
      }
      if (totals.orderDisc > 0) {
        const discAmt = -Math.round(totals.orderDisc * 100) / 100;
        items.push({
          name: ni.orderDiscount,
          description: discLabel,
          quantity: 1,
          unit: "pcs",
          unit_price: discAmt,
          discount_pct: 0,
          tax_rate: 0,
        });
      }

      const inv = await financeApi.createInvoice({
        customer_id: Number(customerId),
        issue_date: issueDate,
        due_date: dueDate,
        currency,
        notes: metaNotes || undefined,
        items,
      });

      const payAmount = alreadyPaid
        ? inv.grand_total
        : Math.min(
            (depositAmount > 0 ? depositAmount : advancePayment) || 0,
            inv.grand_total,
          );

      if (payAmount > 0) {
        await financeApi.recordPayment({
          customer_id: Number(customerId),
          invoice_id: inv.id,
          amount: payAmount,
          method: alreadyPaid ? "cash" : depositMethod || "deposit",
          currency,
          paid_at: new Date().toISOString(),
          reference: alreadyPaid ? "already-paid" : "deposit",
          notes: alreadyPaid ? ni.alreadyPaid : ni.advancePayment,
        });
      }

      return inv;
    },
    onSuccess: (inv) => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["payments"] });
      toast.success(t.staffUi.invoices.generated.replace("{code}", inv.code));
      navigate(`/app/invoices/${inv.id}`);
    },
    onError: (err) => toast.error(apiErrorMessage(err, locale)),
  });

  const addLine = () => setLines((rows) => [...rows, emptyLine(defaultTax)]);
  const removeLine = (idx: number) =>
    setLines((rows) => (rows.length <= 1 ? [emptyLine(defaultTax)] : rows.filter((_, i) => i !== idx)));
  const updateLine = (idx: number, next: LineDraft) =>
    setLines((rows) => rows.map((r, i) => (i === idx ? next : r)));

  return (
    <div className="page-shell space-y-4">
      <PageHeader
        title={ni.title}
        description={ni.description}
        breadcrumbs={staffBreadcrumbs("/app/invoices/new", t.staffUi.nav)}
      />

      {/* Actions */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/80 bg-surface/95 px-3 py-2.5 shadow-soft backdrop-blur">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            className="min-h-10"
            icon={<Eye className="size-4" />}
            disabled={!canSubmit}
            onClick={() => setPreviewOpen(true)}
          >
            {ni.preview}
          </Button>
          <Button
            variant="secondary"
            className="min-h-10"
            icon={<Save className="size-4" />}
            loading={create.isPending}
            disabled={!canSubmit}
            onClick={() => create.mutate()}
          >
            {ni.saveDraft}
          </Button>
        </div>
        <Button
          className="min-h-10"
          loading={create.isPending}
          disabled={!canSubmit}
          onClick={() => create.mutate()}
        >
          {ni.saveSubmit}
        </Button>
      </div>

      {/* Header */}
      <Card>
        <CardBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Select
            label={ni.template}
            options={[
              { value: "", label: ni.defaultTemplate },
              ...(templates?.items ?? []).map((tpl: { id: number; name: string }) => ({
                value: String(tpl.id),
                label: tpl.name,
              })),
            ]}
            value={templateId}
            onChange={(e) => setTemplateId((e.target as HTMLSelectElement).value)}
          />

          <div className="sm:col-span-2">
            <div className="mb-1 text-[12.5px] font-medium text-text">{ni.customer}</div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                className="input min-h-10 flex-1"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              >
                <option value="">{ni.selectCustomer}</option>
                {(customers?.items ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.code})
                  </option>
                ))}
              </select>
              <select
                className="input min-h-10 w-full sm:w-28"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="IQD">IQD</option>
                <option value="USD">USD</option>
              </select>
              <Button
                type="button"
                variant="secondary"
                className="min-h-10 shrink-0"
                icon={<Plus className="size-4" />}
                onClick={() => setCustomerModalOpen(true)}
              >
                {ni.newCustomer}
              </Button>
            </div>
          </div>

          <Input label={ni.invoiceNumber} value={ni.invoiceNumberHint} disabled />
          <Input
            label={ni.invoiceDate}
            type="date"
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
          />
          <Input
            label={ni.issueDate}
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
          />
          <Select
            label={ni.salesperson}
            options={[
              { value: "", label: ni.selectSalesperson },
              ...(staffUsers?.items ?? [])
                .filter((u) => u.is_staff)
                .map((u) => ({ value: String(u.id), label: u.full_name })),
            ]}
            value={salespersonId}
            onChange={(e) => setSalespersonId((e.target as HTMLSelectElement).value)}
          />
          <Input
            label={ni.paymentTerms}
            type="number"
            value={dueDays}
            onChange={(e) => setDueDays(e.target.value)}
          />
          <Input label={ni.dueDate} type="date" value={dueDate} disabled />
        </CardBody>
      </Card>

      {/* Lines */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 sm:px-5">
          <div>
            <div className="text-[13px] font-semibold">{ni.lineItems}</div>
            <div className="text-[12px] text-text-3">{ni.lineItemsSub}</div>
          </div>
          <Button size="sm" icon={<Plus className="size-3.5" />} onClick={addLine}>
            {ni.addLine}
          </Button>
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[920px] text-start text-[13px]">
            <thead>
              <tr className="border-b border-border bg-surface-2/50 text-[11px] font-semibold uppercase tracking-wide text-text-3">
                <th className="px-3 py-2.5">{ni.colItem}</th>
                <th className="px-3 py-2.5">{ni.colDescription}</th>
                <th className="px-3 py-2.5">{ni.colUnitPrice}</th>
                <th className="px-3 py-2.5">{ni.colQty}</th>
                <th className="px-3 py-2.5">{ni.colDiscount}</th>
                <th className="px-3 py-2.5">{ni.colTax}</th>
                <th className="px-3 py-2.5 text-end">{ni.colLineTotal}</th>
                <th className="w-10 px-2 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx} className="border-b border-border/60 align-top">
                  <td className="px-3 py-2.5">
                    <select
                      className="input min-h-9 w-full min-w-[160px] py-1.5 text-[13px]"
                      value={line.product_id ?? ""}
                      onChange={(e) => {
                        const pid = Number(e.target.value) || null;
                        const p = (products?.items ?? []).find((x) => x.id === pid);
                        updateLine(idx, {
                          ...line,
                          product_id: pid,
                          name: p ? localizedProductName(p, locale) : line.name,
                          unit_price: p ? p.base_price ?? 0 : line.unit_price,
                          tax_rate: p?.tax_rate ?? line.tax_rate,
                        });
                      }}
                    >
                      <option value="">{ni.selectItem}</option>
                      {(products?.items ?? []).map((p) => (
                        <option key={p.id} value={p.id}>
                          {localizedProductName(p, locale)}
                        </option>
                      ))}
                    </select>
                    {!line.product_id ? (
                      <input
                        className="input mt-1.5 min-h-9 w-full py-1.5 text-[13px]"
                        placeholder={ni.customItem}
                        value={line.name}
                        onChange={(e) => updateLine(idx, { ...line, name: e.target.value })}
                      />
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5">
                    <input
                      className="input min-h-9 w-full min-w-[140px] py-1.5 text-[13px]"
                      value={line.description}
                      onChange={(e) => updateLine(idx, { ...line, description: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <input
                      type="number"
                      className="input min-h-9 w-28 py-1.5 text-[13px] tabular-nums"
                      value={line.unit_price}
                      onChange={(e) => updateLine(idx, { ...line, unit_price: Number(e.target.value) || 0 })}
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <input
                      type="number"
                      className="input min-h-9 w-20 py-1.5 text-[13px] tabular-nums"
                      value={line.quantity}
                      onChange={(e) => updateLine(idx, { ...line, quantity: Number(e.target.value) || 0 })}
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <input
                      type="number"
                      className="input min-h-9 w-20 py-1.5 text-[13px] tabular-nums"
                      value={line.discount_pct}
                      onChange={(e) => updateLine(idx, { ...line, discount_pct: Number(e.target.value) || 0 })}
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <select
                      className="input min-h-9 w-28 py-1.5 text-[13px]"
                      value={String(line.tax_rate)}
                      onChange={(e) => updateLine(idx, { ...line, tax_rate: Number(e.target.value) || 0 })}
                    >
                      <option value="0">{ni.noTax}</option>
                      <option value="5">5%</option>
                      <option value="10">10%</option>
                      <option value="15">15%</option>
                      <option value={String(defaultTax)}>{defaultTax}%</option>
                    </select>
                  </td>
                  <td className="px-3 py-2.5 text-end font-semibold tabular-nums">
                    {formatMoney(lineNet(line).total, currency)}
                  </td>
                  <td className="px-2 py-2.5">
                    <button
                      type="button"
                      className="grid size-8 place-items-center rounded-lg text-danger hover:bg-danger/10"
                      onClick={() => removeLine(idx)}
                    >
                      <MinusCircle className="size-4.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="space-y-3 p-3 lg:hidden">
          {lines.map((line, idx) => (
            <div key={idx} className="space-y-2 rounded-xl border border-border bg-surface-2/20 p-3">
              <div className="flex gap-2">
                <select
                  className="input min-h-10 flex-1"
                  value={line.product_id ?? ""}
                  onChange={(e) => {
                    const pid = Number(e.target.value) || null;
                    const p = (products?.items ?? []).find((x) => x.id === pid);
                    updateLine(idx, {
                      ...line,
                      product_id: pid,
                      name: p ? localizedProductName(p, locale) : line.name,
                      unit_price: p ? p.base_price ?? 0 : line.unit_price,
                      tax_rate: p?.tax_rate ?? line.tax_rate,
                    });
                  }}
                >
                  <option value="">{ni.selectItem}</option>
                  {(products?.items ?? []).map((p) => (
                    <option key={p.id} value={p.id}>{localizedProductName(p, locale)}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="grid size-10 place-items-center rounded-lg text-danger hover:bg-danger/10"
                  onClick={() => removeLine(idx)}
                >
                  <MinusCircle className="size-5" />
                </button>
              </div>
              {!line.product_id ? (
                <Input label={ni.customItem} value={line.name} onChange={(e) => updateLine(idx, { ...line, name: e.target.value })} />
              ) : null}
              <Input label={ni.colDescription} value={line.description} onChange={(e) => updateLine(idx, { ...line, description: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <Input label={ni.colUnitPrice} type="number" value={String(line.unit_price)} onChange={(e) => updateLine(idx, { ...line, unit_price: Number(e.target.value) || 0 })} />
                <Input label={ni.colQty} type="number" value={String(line.quantity)} onChange={(e) => updateLine(idx, { ...line, quantity: Number(e.target.value) || 0 })} />
                <Input label={ni.colDiscount} type="number" value={String(line.discount_pct)} onChange={(e) => updateLine(idx, { ...line, discount_pct: Number(e.target.value) || 0 })} />
                <Input label={ni.colTax} type="number" value={String(line.tax_rate)} onChange={(e) => updateLine(idx, { ...line, tax_rate: Number(e.target.value) || 0 })} />
              </div>
              <div className="text-end text-[14px] font-semibold tabular-nums text-brand">
                {formatMoney(lineNet(line).total, currency)}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <Button size="sm" variant="secondary" icon={<Plus className="size-3.5" />} onClick={addLine}>
            {ni.addLine}
          </Button>
          <div className="space-y-1 text-[13px] sm:min-w-[220px]">
            <div className="flex justify-between gap-6 text-text-2">
              <span>{ni.subtotal}</span>
              <span className="tabular-nums font-medium">{formatMoney(totals.subtotal, currency)}</span>
            </div>
            {totals.orderDisc > 0 ? (
              <div className="flex justify-between gap-6 text-text-2">
                <span>{ni.orderDiscount}</span>
                <span className="tabular-nums">−{formatMoney(totals.orderDisc, currency)}</span>
              </div>
            ) : null}
            <div className="flex justify-between gap-6 text-text-2">
              <span>{ni.tax}</span>
              <span className="tabular-nums font-medium">{formatMoney(totals.tax, currency)}</span>
            </div>
            <div className="flex justify-between gap-6 border-t border-border/70 pt-1.5 text-[14px] font-semibold">
              <span>{ni.grandTotal}</span>
              <span className="tabular-nums text-brand">{formatMoney(totals.grand, currency)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Footer tabs */}
      <Card>
        <div className="border-b border-border px-3 pt-3 sm:px-4">
          <Tabs
            value={footerTab}
            onChange={(id) => setFooterTab(id as FooterTab)}
            items={[
              { id: "settlement", label: ni.tabSettlement },
              { id: "deposit", label: ni.tabDeposit },
              { id: "warehouse", label: ni.tabWarehouse },
              { id: "attachments", label: ni.tabAttachments },
            ]}
          />
        </div>
        <CardBody className="space-y-4">
          {footerTab === "settlement" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[12.5px] font-medium text-text">{ni.orderDiscount}</label>
                <div className="flex min-h-10 overflow-hidden rounded-xl border border-border bg-surface">
                  <input
                    type="number"
                    className="min-w-0 flex-1 border-0 bg-transparent px-3 text-[13px] outline-none"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
                  />
                  <select
                    className="shrink-0 border-s border-border bg-surface-2/40 px-2.5 text-[12.5px] outline-none"
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as "percent" | "fixed")}
                  >
                    <option value="percent">{ni.discountTypePct}</option>
                    <option value="fixed">{ni.discountTypeFixed}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-[12.5px] font-medium text-text">
                  {ni.settlement}
                  <span title={ni.settlementHint} className="text-text-3">
                    <CircleHelp className="size-3.5" />
                  </span>
                </label>
                <div className="flex min-h-10 overflow-hidden rounded-xl border border-border bg-surface">
                  <input
                    type="text"
                    className="min-w-0 flex-1 border-0 bg-transparent px-3 text-[13px] outline-none"
                    placeholder={ni.settlementNotePh}
                    value={settlementNote}
                    onChange={(e) => setSettlementNote(e.target.value)}
                  />
                  <input
                    type="number"
                    className="w-28 shrink-0 border-s border-border bg-transparent px-3 text-end text-[13px] tabular-nums outline-none"
                    value={settlementAdj}
                    onChange={(e) => setSettlementAdj(Number(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {footerTab === "deposit" ? (
            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="w-full sm:max-w-xs">
                  <label className="mb-1 flex items-center gap-1.5 text-[12.5px] font-medium text-text">
                    {ni.advancePayment}
                    <span title={ni.advancePaymentHint} className="text-text-3">
                      <CircleHelp className="size-3.5" />
                    </span>
                  </label>
                  <input
                    type="number"
                    className="input min-h-10 w-full"
                    value={advancePayment}
                    onChange={(e) => setAdvancePayment(Number(e.target.value) || 0)}
                  />
                </div>
                <label className="flex items-center gap-2.5 pb-1 text-[13px] text-text-2 select-none">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={alreadyPaid}
                    onClick={() => setAlreadyPaid((v) => !v)}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                      alreadyPaid ? "bg-brand" : "bg-border"
                    }`}
                  >
                    <span
                    className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform ${
                      alreadyPaid
                        ? "ltr:translate-x-5 rtl:-translate-x-5"
                        : "ltr:translate-x-0.5 rtl:-translate-x-0.5"
                    }`}
                    />
                  </button>
                  <span className="flex items-center gap-1">
                    {ni.alreadyPaidQ}
                    <span title={ni.alreadyPaidHint} className="text-text-3">
                      <CircleHelp className="size-3.5" />
                    </span>
                  </span>
                </label>
              </div>
              <div>
                <label className="mb-1 block text-[12.5px] font-medium text-text">{ni.depositAmount}</label>
                <div className="flex min-h-10 overflow-hidden rounded-xl border border-border bg-surface sm:max-w-md">
                  <select
                    className="shrink-0 border-e border-border bg-surface-2/40 px-2.5 text-[12.5px] outline-none"
                    value={depositMethod}
                    onChange={(e) => setDepositMethod(e.target.value)}
                  >
                    <option value="cash">{ni.payMethodCash}</option>
                    <option value="card">{ni.payMethodCard}</option>
                    <option value="transfer">{ni.payMethodTransfer}</option>
                    <option value="deposit">{ni.payMethodDeposit}</option>
                  </select>
                  <input
                    type="number"
                    className="min-w-0 flex-1 border-0 bg-transparent px-3 text-[13px] outline-none"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {footerTab === "warehouse" ? (
            <div className="sm:max-w-md">
              <Select
                label={ni.warehouse}
                options={[
                  { value: "", label: ni.selectWarehouse },
                  ...(warehouses ?? []).map((w) => ({ value: String(w.id), label: w.name })),
                ]}
                value={warehouseId}
                onChange={(e) => setWarehouseId((e.target as HTMLSelectElement).value)}
              />
            </div>
          ) : null}

          {footerTab === "attachments" ? (
            <p className="text-[13px] text-text-3">{ni.attachmentsHint}</p>
          ) : null}

          <Textarea label={ni.notesTerms} rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </CardBody>
      </Card>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={ni.preview}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPreviewOpen(false)}>
              {t.staffUi.common.cancel}
            </Button>
            <Button loading={create.isPending} disabled={!canSubmit} onClick={() => create.mutate()}>
              {ni.saveSubmit}
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-[13.5px]">
          <div className="flex justify-between gap-3">
            <span className="text-text-3">{ni.customer}</span>
            <span className="font-medium">
              {(customers?.items ?? []).find((c) => String(c.id) === customerId)?.full_name ?? "—"}
            </span>
          </div>
          <div className="divide-y divide-border/70 rounded-xl border border-border">
            {validLines.map((l, i) => (
              <div key={i} className="flex justify-between gap-3 px-3 py-2.5">
                <div>
                  <div className="font-medium">{l.name || ni.itemFallback}</div>
                  <div className="text-[12px] text-text-3">
                    {l.quantity} × {formatMoney(l.unit_price, currency)}
                  </div>
                </div>
                <span className="font-semibold tabular-nums">{formatMoney(lineNet(l).total, currency)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between border-t border-border pt-2 font-semibold">
            <span>{ni.grandTotal}</span>
            <span className="text-brand">{formatMoney(totals.grand, currency)}</span>
          </div>
        </div>
      </Modal>

      <Modal
        open={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        title={ni.newCustomer}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCustomerModalOpen(false)}>
              {t.staffUi.common.cancel}
            </Button>
            <Button
              loading={createCustomer.isPending}
              disabled={!newCustName.trim()}
              onClick={() => createCustomer.mutate()}
            >
              {t.staffUi.common.create}
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <Input label={ni.customer} required value={newCustName} onChange={(e) => setNewCustName(e.target.value)} />
          <Input label={t.staffUi.customers.colPhone} value={newCustPhone} onChange={(e) => setNewCustPhone(e.target.value)} />
          <Input label="Email" type="email" value={newCustEmail} onChange={(e) => setNewCustEmail(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
}
