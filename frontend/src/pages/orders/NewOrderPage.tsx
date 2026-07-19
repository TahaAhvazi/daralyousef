import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, MinusCircle, Plus, Save } from "lucide-react";
import toast from "react-hot-toast";

import { catalogApi, customersApi, filesApi, inventoryApi, ordersApi, salesApi, usersApi } from "@/api/modules";
import { ProductFormModal } from "@/components/catalog/ProductFormModal";
import { FileUploadPanel, uploadFiles } from "@/components/files/FileUploadPanel";
import {
  WorkflowAssignmentForm,
  applySuggestedStages,
  draftsToPayload,
  emptyAssignmentDrafts,
  suggestedStagesFromProducts,
  type WorkflowAssignmentDraft,
} from "@/components/orders/WorkflowAssignmentForm";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs } from "@/components/ui/Tabs";
import { formatMoney } from "@/lib/format";
import { localizedProductName } from "@/lib/catalog";
import { getProductOptionGroups } from "@/lib/productOptions";
import { canManageOrdersAdmin } from "@/lib/permissions";
import { useAuthStore } from "@/store/auth";
import { useT } from "@/i18n/useT";
import { staffBreadcrumbs } from "@/lib/breadcrumbs";
import { apiErrorMessage } from "@/lib/apiErrors";

interface LineDraft {
  product_id: number | null;
  name: string;
  description: string;
  unit: string;
  quantity: number;
  unit_price: number;
  discount_pct: number;
  tax_rate: number;
  spec: Record<string, string>;
}

type FooterTab = "settlement" | "warehouse" | "attachments" | "team";

function emptyLine(): LineDraft {
  return {
    product_id: null,
    name: "",
    description: "",
    unit: "pcs",
    quantity: 1,
    unit_price: 0,
    discount_pct: 0,
    tax_rate: 0,
    spec: {},
  };
}

function lineNet(l: LineDraft) {
  const base = l.unit_price * l.quantity;
  const afterDisc = base * (1 - (l.discount_pct || 0) / 100);
  const tax = afterDisc * ((l.tax_rate || 0) / 100);
  return { base, afterDisc, tax, total: afterDisc + tax };
}

export default function NewOrderPage() {
  const { t, locale } = useT();
  const tt = t.staffUi.newOrder;
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isStaff = !!(user?.is_staff || user?.is_superuser);
  const isPortal = !isStaff;
  const canManageCatalog =
    !!user?.is_superuser ||
    (user?.permissions ?? []).includes("*") ||
    (user?.permissions ?? []).includes("catalog:manage");
  const qc = useQueryClient();

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [pendingLineIdx, setPendingLineIdx] = useState<number | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [footerTab, setFooterTab] = useState<FooterTab>("settlement");

  const { data: products } = useQuery({
    queryKey: ["products", "all"],
    queryFn: () => catalogApi.products({ page: 1, page_size: 100 }),
  });
  const { data: customers } = useQuery({
    queryKey: ["customers", "all"],
    queryFn: () => customersApi.list({ page: 1, page_size: 200 }),
    enabled: isStaff,
  });
  const { data: staffUsers } = useQuery({
    queryKey: ["users", "staff-pick"],
    queryFn: () => usersApi.list({ page: 1, page_size: 100 }),
    enabled: isStaff,
  });
  const { data: warehouses } = useQuery({
    queryKey: ["warehouses"],
    queryFn: () => inventoryApi.warehouses(),
    enabled: isStaff,
  });
  const { data: salesSettings } = useQuery({
    queryKey: ["sales-settings"],
    queryFn: () => salesApi.salesSettings(),
    enabled: isStaff,
  });
  const { data: templates } = useQuery({
    queryKey: ["doc-templates"],
    queryFn: () => salesApi.templates({ page: 1, page_size: 50 }),
    enabled: isStaff,
  });

  const currency = salesSettings?.default_currency ?? "IQD";
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [customerId, setCustomerId] = useState<number | "">("");
  const [title, setTitle] = useState("");
  const [orderDate, setOrderDate] = useState(today);
  const [deadline, setDeadline] = useState("");
  const [ownerId, setOwnerId] = useState<number | "">(user?.id ?? "");
  const [templateId, setTemplateId] = useState("");
  const [priority, setPriority] = useState("normal");
  const [notes, setNotes] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [orderDiscountPct, setOrderDiscountPct] = useState(0);
  const [settlementAdj, setSettlementAdj] = useState(0);
  const [lines, setLines] = useState<LineDraft[]>([emptyLine()]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const canAssignStaff = isStaff && canManageOrdersAdmin(user);
  const [assignments, setAssignments] = useState<WorkflowAssignmentDraft[]>(() => emptyAssignmentDrafts());

  // Quick customer create
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");

  useEffect(() => {
    if (!products?.items?.length) return;
    setLines((rows) =>
      rows.map((l) => {
        if (!l.product_id) return l;
        const p = products.items.find((x) => x.id === l.product_id);
        if (!p) return l;
        return { ...l, name: localizedProductName(p, locale) };
      }),
    );
  }, [locale, products?.items]);

  const lineProductKey = lines.map((l) => l.product_id ?? "").join(",");
  useEffect(() => {
    if (!canAssignStaff) return;
    const suggested = suggestedStagesFromProducts(products?.items ?? [], lines.map((l) => l.product_id));
    setAssignments((prev) => applySuggestedStages(prev, suggested));
  }, [lineProductKey, products?.items, canAssignStaff]);

  const totals = useMemo(() => {
    let subtotal = 0;
    let tax = 0;
    for (const l of lines) {
      const n = lineNet(l);
      subtotal += n.afterDisc;
      tax += n.tax;
    }
    const orderDisc = subtotal * ((orderDiscountPct || 0) / 100);
    const afterOrderDisc = subtotal - orderDisc;
    const grand = Math.max(0, afterOrderDisc + tax + (settlementAdj || 0));
    return { subtotal, tax, orderDisc, grand };
  }, [lines, orderDiscountPct, settlementAdj]);

  const validLines = lines.filter((l) => l.name.trim() || l.product_id);
  const canSubmit = validLines.length > 0 && (!isStaff || !!customerId);

  const createCustomer = useMutation({
    mutationFn: () =>
      customersApi.create({
        full_name: newCustName.trim(),
        phone: newCustPhone || undefined,
        email: newCustEmail || undefined,
      }),
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      setCustomerId(c.id);
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
      const whNote = warehouseId
        ? (warehouses ?? []).find((w) => String(w.id) === warehouseId)?.name
        : null;
      const tplNote = templateId
        ? (templates?.items ?? []).find((x: { id: number }) => String(x.id) === templateId)?.name
        : null;
      const extraNotes = [
        notes.trim(),
        whNote ? `${tt.warehouse}: ${whNote}` : "",
        tplNote ? `${tt.template}: ${tplNote}` : "",
        orderDiscountPct ? `${tt.orderDiscount}: ${orderDiscountPct}%` : "",
        settlementAdj ? `${tt.settlement}: ${settlementAdj}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const order = await ordersApi.create({
        customer_id: isStaff ? Number(customerId) : 0,
        owner_id: isStaff && ownerId ? Number(ownerId) : undefined,
        title: title || undefined,
        notes: extraNotes || undefined,
        deadline: isPortal ? undefined : deadline || undefined,
        priority: isPortal ? "normal" : priority,
        currency,
        items: validLines.map((l) => ({
          product_id: l.product_id ?? undefined,
          name: l.name || tt.itemFallback.replace("{n}", "1"),
          description: l.description || undefined,
          quantity: l.quantity,
          unit: l.unit,
          unit_price: isPortal ? 0 : l.unit_price,
          discount_pct: isPortal ? 0 : l.discount_pct,
          tax_rate: isPortal ? 0 : l.tax_rate,
          spec: l.spec,
        })),
        ...(canAssignStaff ? { workflow_assignments: draftsToPayload(assignments) } : {}),
      } as any);
      if (pendingFiles.length > 0) {
        await uploadFiles("order", order.id, pendingFiles, filesApi.upload);
      }
      return order;
    },
    onSuccess: (order) => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success(
        isPortal
          ? t.portalUi.orders.requestSubmitted
          : tt.created.replace("{code}", order.code),
      );
      setPendingFiles([]);
      navigate(isStaff ? `/app/orders/${order.id}` : `/portal/orders/${order.id}`);
    },
    onError: (err) => toast.error(apiErrorMessage(err, locale)),
  });

  const addLine = () => setLines((rows) => [...rows, emptyLine()]);
  const removeLine = (idx: number) =>
    setLines((rows) => (rows.length <= 1 ? [emptyLine()] : rows.filter((_, i) => i !== idx)));

  const updateLine = (idx: number, next: LineDraft) =>
    setLines((rows) => rows.map((r, i) => (i === idx ? next : r)));

  const footerItems = [
    { id: "settlement", label: tt.tabSettlement },
    ...(isStaff ? [{ id: "warehouse", label: tt.tabWarehouse }] : []),
    { id: "attachments", label: tt.tabAttachments },
    ...(canAssignStaff ? [{ id: "team", label: t.staffUi.workflowAssignments.title }] : []),
  ];

  return (
    <div className="page-shell space-y-4">
      <PageHeader
        title={tt.title}
        description={tt.description}
        breadcrumbs={isStaff ? staffBreadcrumbs("/app/orders/new", t.staffUi.nav) : undefined}
      />

      {/* Action bar */}
      <div className="sticky top-0 z-10 -mx-1 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/80 bg-surface/95 px-3 py-2.5 shadow-soft backdrop-blur supports-[backdrop-filter]:bg-surface/80">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            className="min-h-10"
            icon={<Eye className="size-4" />}
            onClick={() => setPreviewOpen(true)}
            disabled={!canSubmit}
          >
            {tt.preview}
          </Button>
          <Button
            variant="secondary"
            className="min-h-10"
            icon={<Save className="size-4" />}
            loading={create.isPending}
            disabled={!canSubmit}
            onClick={() => create.mutate()}
          >
            {tt.saveDraft}
          </Button>
        </div>
        <Button
          className="min-h-10"
          loading={create.isPending}
          disabled={!canSubmit}
          onClick={() => create.mutate()}
        >
          {tt.saveSubmit}
        </Button>
      </div>

      {/* Header fields */}
      <Card>
        <CardBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {isStaff ? (
            <Select
              label={tt.template}
              options={[
                { value: "", label: tt.defaultTemplate },
                ...(templates?.items ?? []).map((tpl: { id: number; name: string }) => ({
                  value: String(tpl.id),
                  label: tpl.name,
                })),
              ]}
              value={templateId}
              onChange={(e) => setTemplateId((e.target as HTMLSelectElement).value)}
            />
          ) : null}

          {isStaff ? (
            <div className="sm:col-span-2 lg:col-span-2">
              <div className="mb-1 text-[12.5px] font-medium text-text">{tt.customerLabel}</div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  className="input min-h-10 flex-1"
                  value={customerId === "" ? "" : String(customerId)}
                  onChange={(e) => setCustomerId(Number(e.target.value) || "")}
                >
                  <option value="">{tt.selectCustomer}</option>
                  {(customers?.items ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.code})
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-10 shrink-0"
                  icon={<Plus className="size-4" />}
                  onClick={() => setCustomerModalOpen(true)}
                >
                  {tt.newCustomer}
                </Button>
              </div>
            </div>
          ) : (
            <div className="badge badge-brand sm:col-span-2 lg:col-span-3">
              {tt.placingAs.replace("{name}", user?.full_name ?? "")}
            </div>
          )}

          <Input label={tt.orderNumber} value={tt.orderNumberHint} disabled />
          <Input
            label={tt.orderDate}
            type="date"
            value={orderDate}
            onChange={(e) => setOrderDate(e.target.value)}
          />
          {!isPortal ? (
            <Input
              label={tt.deadline}
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          ) : null}

          {isStaff ? (
            <Select
              label={tt.salesperson}
              options={[
                { value: "", label: tt.selectSalesperson },
                ...(staffUsers?.items ?? [])
                  .filter((u) => u.is_staff)
                  .map((u) => ({ value: String(u.id), label: u.full_name })),
              ]}
              value={ownerId === "" ? "" : String(ownerId)}
              onChange={(e) => setOwnerId(Number((e.target as HTMLSelectElement).value) || "")}
            />
          ) : null}

          <Input
            label={tt.orderTitleLabel}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={tt.orderTitlePh}
            wrapperClassName="sm:col-span-2"
          />

          {!isPortal ? (
            <Select
              label={tt.priority}
              value={priority}
              options={[
                { value: "low", label: tt.priorities.low },
                { value: "normal", label: tt.priorities.normal },
                { value: "high", label: tt.priorities.high },
                { value: "urgent", label: tt.priorities.urgent },
              ]}
              onChange={(e) => setPriority((e.target as HTMLSelectElement).value)}
            />
          ) : null}
        </CardBody>
      </Card>

      {/* Line items */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 sm:px-5">
          <div>
            <div className="text-[13px] font-semibold">{tt.lineItemsTitle}</div>
            <div className="text-[12px] text-text-3">{tt.lineItemsSub}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {canManageCatalog ? (
              <Button
                size="sm"
                variant="secondary"
                icon={<Plus className="size-3.5" />}
                onClick={() => {
                  setPendingLineIdx(null);
                  setProductModalOpen(true);
                }}
              >
                {tt.addProduct}
              </Button>
            ) : null}
            <Button size="sm" icon={<Plus className="size-3.5" />} onClick={addLine}>
              {tt.addLine}
            </Button>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[920px] text-start text-[13px]">
            <thead>
              <tr className="border-b border-border bg-surface-2/50 text-[11px] font-semibold uppercase tracking-wide text-text-3">
                <th className="px-3 py-2.5 font-semibold">{tt.colItem}</th>
                <th className="px-3 py-2.5 font-semibold">{tt.colDescription}</th>
                <th className="px-3 py-2.5 font-semibold">{tt.unitPrice}</th>
                <th className="px-3 py-2.5 font-semibold">{tt.quantity}</th>
                <th className="px-3 py-2.5 font-semibold">{tt.colDiscount}</th>
                <th className="px-3 py-2.5 font-semibold">{tt.colTax}</th>
                <th className="px-3 py-2.5 text-end font-semibold">{tt.colLineTotal}</th>
                <th className="w-10 px-2 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => (
                <LineTableRow
                  key={idx}
                  products={products?.items ?? []}
                  line={line}
                  currency={currency}
                  readOnlyPricing={isPortal}
                  onChange={(next) => updateLine(idx, next)}
                  onRemove={() => removeLine(idx)}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="space-y-3 p-3 lg:hidden">
          {lines.map((line, idx) => (
            <MobileLineCard
              key={idx}
              products={products?.items ?? []}
              line={line}
              currency={currency}
              readOnlyPricing={isPortal}
              onChange={(next) => updateLine(idx, next)}
              onRemove={() => removeLine(idx)}
              canAddProduct={canManageCatalog}
              onAddProduct={() => {
                setPendingLineIdx(idx);
                setProductModalOpen(true);
              }}
            />
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <Button size="sm" variant="secondary" icon={<Plus className="size-3.5" />} onClick={addLine}>
            {tt.addLine}
          </Button>
          {!isPortal ? (
            <div className="space-y-1 text-[13px] sm:min-w-[220px]">
              <div className="flex justify-between gap-6 text-text-2">
                <span>{tt.subtotal}</span>
                <span className="tabular-nums font-medium">{formatMoney(totals.subtotal, currency)}</span>
              </div>
              {totals.orderDisc > 0 ? (
                <div className="flex justify-between gap-6 text-text-2">
                  <span>{tt.orderDiscount}</span>
                  <span className="tabular-nums">−{formatMoney(totals.orderDisc, currency)}</span>
                </div>
              ) : null}
              <div className="flex justify-between gap-6 text-text-2">
                <span>{tt.tax}</span>
                <span className="tabular-nums font-medium">{formatMoney(totals.tax, currency)}</span>
              </div>
              <div className="flex justify-between gap-6 border-t border-border/70 pt-1.5 text-[14px] font-semibold">
                <span>{tt.grandTotal}</span>
                <span className="tabular-nums text-brand">{formatMoney(totals.grand, currency)}</span>
              </div>
            </div>
          ) : (
            <p className="text-[12.5px] text-text-3">{t.portalUi.orders.pricingPending}</p>
          )}
        </div>
      </Card>

      {/* Footer tabs */}
      <Card>
        <div className="border-b border-border px-3 pt-3 sm:px-4">
          <Tabs
            value={footerTab}
            onChange={(id) => setFooterTab(id as FooterTab)}
            items={footerItems}
          />
        </div>
        <CardBody className="space-y-3">
          {footerTab === "settlement" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label={tt.orderDiscountPct}
                type="number"
                value={String(orderDiscountPct)}
                onChange={(e) => setOrderDiscountPct(Number(e.target.value) || 0)}
                disabled={isPortal}
              />
              <Input
                label={tt.settlement}
                type="number"
                value={String(settlementAdj)}
                onChange={(e) => setSettlementAdj(Number(e.target.value) || 0)}
                disabled={isPortal}
              />
              <Textarea
                label={tt.notes}
                rows={3}
                className="sm:col-span-2"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          ) : null}

          {footerTab === "warehouse" && isStaff ? (
            <Select
              label={tt.warehouse}
              options={[
                { value: "", label: tt.selectWarehouse },
                ...(warehouses ?? []).map((w) => ({ value: String(w.id), label: w.name })),
              ]}
              value={warehouseId}
              onChange={(e) => setWarehouseId((e.target as HTMLSelectElement).value)}
            />
          ) : null}

          {footerTab === "attachments" ? (
            <FileUploadPanel
              pendingFiles={pendingFiles}
              onAddFiles={(files) => setPendingFiles((prev) => [...prev, ...files])}
              onRemovePending={(i) => setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))}
              label={tt.uploadCta}
              hint={tt.uploadHint}
              disabled={create.isPending}
            />
          ) : null}

          {footerTab === "team" && canAssignStaff ? (
            <WorkflowAssignmentForm value={assignments} onChange={setAssignments} />
          ) : null}
        </CardBody>
      </Card>

      {/* Preview modal */}
      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={tt.preview}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPreviewOpen(false)}>
              {t.staffUi.common.cancel}
            </Button>
            <Button loading={create.isPending} disabled={!canSubmit} onClick={() => create.mutate()}>
              {tt.saveSubmit}
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-[13.5px]">
          <PreviewRow label={tt.customerLabel} value={
            isStaff
              ? (customers?.items ?? []).find((c) => c.id === customerId)?.full_name ?? "—"
              : user?.full_name ?? "—"
          } />
          <PreviewRow label={tt.orderTitleLabel} value={title || "—"} />
          <PreviewRow label={tt.orderDate} value={orderDate} />
          <PreviewRow label={tt.deadline} value={deadline || "—"} />
          <div className="divide-y divide-border/70 rounded-xl border border-border">
            {validLines.map((l, i) => {
              const n = lineNet(l);
              return (
                <div key={i} className="flex items-start justify-between gap-3 px-3 py-2.5">
                  <div>
                    <div className="font-medium">{l.name || tt.itemFallback.replace("{n}", String(i + 1))}</div>
                    <div className="text-[12px] text-text-3">
                      {l.quantity} × {formatMoney(l.unit_price, currency)}
                      {l.discount_pct ? ` · −${l.discount_pct}%` : ""}
                    </div>
                  </div>
                  {!isPortal ? (
                    <span className="tabular-nums font-semibold">{formatMoney(n.total, currency)}</span>
                  ) : null}
                </div>
              );
            })}
          </div>
          {!isPortal ? (
            <div className="flex justify-between border-t border-border pt-2 font-semibold">
              <span>{tt.grandTotal}</span>
              <span className="text-brand">{formatMoney(totals.grand, currency)}</span>
            </div>
          ) : null}
        </div>
      </Modal>

      {/* New customer modal */}
      <Modal
        open={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        title={tt.newCustomer}
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
          <Input label={tt.customerLabel} required value={newCustName} onChange={(e) => setNewCustName(e.target.value)} />
          <Input label={t.staffUi.customers.colPhone} value={newCustPhone} onChange={(e) => setNewCustPhone(e.target.value)} />
          <Input label="Email" type="email" value={newCustEmail} onChange={(e) => setNewCustEmail(e.target.value)} />
        </div>
      </Modal>

      {canManageCatalog ? (
        <ProductFormModal
          open={productModalOpen}
          onClose={() => {
            setProductModalOpen(false);
            setPendingLineIdx(null);
          }}
          onCreated={(product) => {
            qc.invalidateQueries({ queryKey: ["products", "all"] });
            const displayName = localizedProductName(product, locale);
            const patch = {
              product_id: product.id,
              name: displayName,
              unit: product.unit,
              unit_price: product.base_price ?? 0,
              tax_rate: product.tax_rate,
              discount_pct: 0,
              description: "",
              spec: {} as Record<string, string>,
            };
            if (pendingLineIdx !== null) {
              setLines((rows) =>
                rows.map((r, i) => (i === pendingLineIdx ? { ...r, ...patch, quantity: r.quantity || 1 } : r)),
              );
            } else {
              setLines((rows) => [...rows, { ...emptyLine(), ...patch }]);
            }
            setPendingLineIdx(null);
          }}
        />
      ) : null}
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-text-3">{label}</span>
      <span className="font-medium text-end">{value}</span>
    </div>
  );
}

function LineTableRow({
  products,
  line,
  currency,
  readOnlyPricing,
  onChange,
  onRemove,
}: {
  products: any[];
  line: LineDraft;
  currency: string;
  readOnlyPricing: boolean;
  onChange: (l: LineDraft) => void;
  onRemove: () => void;
}) {
  const { t, locale } = useT();
  const tt = t.staffUi.newOrder;
  const product = products.find((p) => p.id === line.product_id);
  const productLabel = (p: { id: number; name: string; name_ar?: string | null }) =>
    localizedProductName(p, locale);
  const total = lineNet(line).total;
  const optionGroups = getProductOptionGroups(product, locale, t.staffUi.catalogOptions);

  return (
    <>
      <tr className="border-b border-border/60 align-top">
        <td className="px-3 py-2.5">
          <select
            className="input min-h-9 w-full min-w-[160px] py-1.5 text-[13px]"
            value={line.product_id ?? ""}
            onChange={(e) => {
              const pid = Number(e.target.value) || null;
              const picked = products.find((p) => p.id === pid);
              onChange({
                ...line,
                product_id: pid,
                name: picked ? productLabel(picked) : line.name,
                unit: picked?.unit ?? line.unit,
                unit_price: picked ? (picked.base_price ?? 0) : line.unit_price,
                tax_rate: picked?.tax_rate ?? line.tax_rate,
                spec: {},
              });
            }}
          >
            <option value="">{tt.selectProduct}</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {productLabel(p)}
              </option>
            ))}
          </select>
        </td>
        <td className="px-3 py-2.5">
          <input
            className="input min-h-9 w-full min-w-[140px] py-1.5 text-[13px]"
            value={line.description}
            placeholder={tt.colDescription}
            onChange={(e) => onChange({ ...line, description: e.target.value })}
          />
        </td>
        <td className="px-3 py-2.5">
          <input
            type="number"
            className="input min-h-9 w-28 py-1.5 text-[13px] tabular-nums"
            value={line.unit_price}
            disabled={readOnlyPricing}
            onChange={(e) => onChange({ ...line, unit_price: Number(e.target.value) || 0 })}
          />
        </td>
        <td className="px-3 py-2.5">
          <input
            type="number"
            className="input min-h-9 w-20 py-1.5 text-[13px] tabular-nums"
            value={line.quantity}
            onChange={(e) => onChange({ ...line, quantity: Number(e.target.value) || 0 })}
          />
        </td>
        <td className="px-3 py-2.5">
          <input
            type="number"
            className="input min-h-9 w-20 py-1.5 text-[13px] tabular-nums"
            value={line.discount_pct}
            disabled={readOnlyPricing}
            onChange={(e) => onChange({ ...line, discount_pct: Number(e.target.value) || 0 })}
          />
        </td>
        <td className="px-3 py-2.5">
          <input
            type="number"
            className="input min-h-9 w-20 py-1.5 text-[13px] tabular-nums"
            value={line.tax_rate}
            disabled={readOnlyPricing}
            onChange={(e) => onChange({ ...line, tax_rate: Number(e.target.value) || 0 })}
          />
        </td>
        <td className="px-3 py-2.5 text-end tabular-nums font-semibold">
          {readOnlyPricing ? "—" : formatMoney(total, currency)}
        </td>
        <td className="px-2 py-2.5">
          <button
            type="button"
            className="grid size-8 place-items-center rounded-lg text-danger hover:bg-danger/10"
            onClick={onRemove}
            aria-label={t.staffUi.common.delete}
          >
            <MinusCircle className="size-4.5" />
          </button>
        </td>
      </tr>
      {optionGroups.length > 0 ? (
        <tr className="border-b border-border/40 bg-surface-2/20">
          <td colSpan={8} className="px-3 py-2">
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {optionGroups.map((g) => (
                <Select
                  key={g.key}
                  label={g.label}
                  options={g.choices.map((o) => ({ value: o.value, label: o.label }))}
                  value={line.spec[g.key] ?? ""}
                  onChange={(e) =>
                    onChange({
                      ...line,
                      spec: { ...line.spec, [g.key]: (e.target as HTMLSelectElement).value },
                    })
                  }
                />
              ))}
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

function MobileLineCard({
  products,
  line,
  currency,
  readOnlyPricing,
  onChange,
  onRemove,
  canAddProduct,
  onAddProduct,
}: {
  products: any[];
  line: LineDraft;
  currency: string;
  readOnlyPricing: boolean;
  onChange: (l: LineDraft) => void;
  onRemove: () => void;
  canAddProduct?: boolean;
  onAddProduct?: () => void;
}) {
  const { t, locale } = useT();
  const tt = t.staffUi.newOrder;
  const product = products.find((p) => p.id === line.product_id);
  const productLabel = (p: { id: number; name: string; name_ar?: string | null }) =>
    localizedProductName(p, locale);
  const total = lineNet(line).total;
  const optionGroups = getProductOptionGroups(product, locale, t.staffUi.catalogOptions);

  return (
    <div className="rounded-xl border border-border bg-surface-2/20 p-3 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Select
            label={tt.colItem}
            options={[
              { value: "", label: tt.selectProduct },
              ...products.map((p) => ({ value: p.id, label: productLabel(p) })),
            ]}
            value={line.product_id ?? ""}
            onChange={(e) => {
              const pid = Number((e.target as HTMLSelectElement).value) || null;
              const picked = products.find((p) => p.id === pid);
              onChange({
                ...line,
                product_id: pid,
                name: picked ? productLabel(picked) : line.name,
                unit: picked?.unit ?? line.unit,
                unit_price: picked ? (picked.base_price ?? 0) : line.unit_price,
                tax_rate: picked?.tax_rate ?? line.tax_rate,
                spec: {},
              });
            }}
          />
        </div>
        <button
          type="button"
          className="mt-6 grid size-9 place-items-center rounded-lg text-danger hover:bg-danger/10"
          onClick={onRemove}
        >
          <MinusCircle className="size-5" />
        </button>
      </div>
      <Input
        label={tt.colDescription}
        value={line.description}
        onChange={(e) => onChange({ ...line, description: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-2">
        <Input
          label={tt.unitPrice}
          type="number"
          value={String(line.unit_price)}
          disabled={readOnlyPricing}
          onChange={(e) => onChange({ ...line, unit_price: Number(e.target.value) || 0 })}
        />
        <Input
          label={tt.quantity}
          type="number"
          value={String(line.quantity)}
          onChange={(e) => onChange({ ...line, quantity: Number(e.target.value) || 0 })}
        />
        <Input
          label={tt.colDiscount}
          type="number"
          value={String(line.discount_pct)}
          disabled={readOnlyPricing}
          onChange={(e) => onChange({ ...line, discount_pct: Number(e.target.value) || 0 })}
        />
        <Input
          label={tt.colTax}
          type="number"
          value={String(line.tax_rate)}
          disabled={readOnlyPricing}
          onChange={(e) => onChange({ ...line, tax_rate: Number(e.target.value) || 0 })}
        />
      </div>
      {optionGroups.map((g) => (
        <Select
          key={g.key}
          label={g.label}
          options={g.choices.map((o) => ({ value: o.value, label: o.label }))}
          value={line.spec[g.key] ?? ""}
          onChange={(e) =>
            onChange({
              ...line,
              spec: { ...line.spec, [g.key]: (e.target as HTMLSelectElement).value },
            })
          }
        />
      ))}
      <div className="flex items-center justify-between border-t border-border/60 pt-2">
        {canAddProduct ? (
          <Button size="sm" variant="ghost" onClick={onAddProduct}>
            {tt.addProduct}
          </Button>
        ) : (
          <span />
        )}
        {!readOnlyPricing ? (
          <span className="text-[14px] font-semibold tabular-nums text-brand">
            {formatMoney(total, currency)}
          </span>
        ) : null}
      </div>
    </div>
  );
}
