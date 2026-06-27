import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { catalogApi, customersApi, filesApi, ordersApi } from "@/api/modules";
import { ProductFormModal } from "@/components/catalog/ProductFormModal";
import { FileUploadPanel, uploadFiles } from "@/components/files/FileUploadPanel";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatMoney } from "@/lib/format";
import { localizedProductName } from "@/lib/catalog";
import { getProductOptionGroups } from "@/lib/productOptions";
import { canManageOrdersAdmin } from "@/lib/permissions";
import {
  WorkflowAssignmentForm,
  applySuggestedStages,
  draftsToPayload,
  emptyAssignmentDrafts,
  suggestedStagesFromProducts,
  type WorkflowAssignmentDraft,
} from "@/components/orders/WorkflowAssignmentForm";
import { useAuthStore } from "@/store/auth";
import { useT } from "@/i18n/useT";

interface LineDraft {
  product_id: number | null;
  name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  spec: Record<string, string>;
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

  const { data: products } = useQuery({
    queryKey: ["products", "all"],
    queryFn: () => catalogApi.products({ page: 1, page_size: 100 }),
  });

  // Refresh line item names when locale changes
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
  const { data: customers } = useQuery({
    queryKey: ["customers", "all"],
    queryFn: () => customersApi.list({ page: 1, page_size: 200 }),
    enabled: isStaff,
  });

  const [customerId, setCustomerId] = useState<number | "">("");
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState<string>("");
  const [priority, setPriority] = useState("normal");
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState(1);
  const [lines, setLines] = useState<LineDraft[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const canAssignStaff = isStaff && canManageOrdersAdmin(user);
  const [assignments, setAssignments] = useState<WorkflowAssignmentDraft[]>(() => emptyAssignmentDrafts());

  const lineProductKey = lines.map((l) => l.product_id ?? "").join(",");
  useEffect(() => {
    if (!canAssignStaff) return;
    const suggested = suggestedStagesFromProducts(products?.items ?? [], lines.map((l) => l.product_id));
    setAssignments((prev) => applySuggestedStages(prev, suggested));
  }, [lineProductKey, products?.items, canAssignStaff]);

  const totals = useMemo(() => {
    const subtotal = lines.reduce((s, l) => s + (l.unit_price * l.quantity), 0);
    const tax = lines.reduce((s, l) => s + (l.unit_price * l.quantity) * (l.tax_rate / 100), 0);
    return { subtotal, tax, grand: subtotal + tax };
  }, [lines]);

  const addLine = () => {
    setLines((rows) => [
      ...rows,
      { product_id: null, name: "", unit: "pcs", quantity: 1, unit_price: 0, tax_rate: 0, spec: {} },
    ]);
  };

  const create = useMutation({
    mutationFn: async () => {
      const order = await ordersApi.create({
        customer_id: isStaff ? Number(customerId) : 0,
        title,
        notes,
        deadline: isPortal ? undefined : (deadline || undefined),
        priority: isPortal ? "normal" : priority,
        currency: "USD",
        items: lines.map((l) => ({
          product_id: l.product_id ?? undefined,
          name: l.name,
          quantity: l.quantity,
          unit: l.unit,
          unit_price: isPortal ? 0 : l.unit_price,
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
  });

  return (
    <div className="page-shell">
      <PageHeader
        title={tt.title}
        description={tt.description}
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate(-1)} className="w-full sm:w-auto">{tt.cancel}</Button>
            {step > 1 ? (
              <Button variant="secondary" onClick={() => setStep((s) => s - 1)} className="w-full sm:w-auto">{t.staffUi.common.previous}</Button>
            ) : null}
            {step < 3 ? (
              <Button
                className="w-full sm:w-auto"
                onClick={() => setStep((s) => s + 1)}
                disabled={step === 1 && isStaff && !customerId}
              >
                {t.staffUi.common.next}
              </Button>
            ) : (
              <Button
                className="w-full sm:w-auto"
                loading={create.isPending}
                onClick={() => create.mutate()}
                disabled={lines.length === 0 || (isStaff && !customerId)}
              >
                {tt.submit}
              </Button>
            )}
          </>
        }
      />

      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        {[
          { n: 1, label: tt.detailsTitle },
          { n: 2, label: tt.lineItemsTitle },
          { n: 3, label: tt.summaryTitle },
        ].map(({ n, label }) => (
          <button
            key={n}
            type="button"
            onClick={() => setStep(n)}
            className={`flex w-full sm:w-auto items-center gap-2 rounded-lg px-3 py-2.5 text-[13px] transition ${
              step === n ? "bg-brand/10 text-brand font-semibold" : "text-text-2 hover:bg-surface-2"
            }`}
          >
            <span className={`grid place-items-center size-6 rounded-full text-[11px] font-bold ${
              step >= n ? "bg-brand text-white" : "bg-surface-2 text-text-3"
            }`}>{n}</span>
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {step === 1 ? (
          <Card>
            <CardHeader title={tt.detailsTitle} subtitle={tt.detailsSub} />
            <CardBody className="grid gap-4 sm:grid-cols-2">
              {isStaff ? (
                <Select
                  label={tt.customerLabel} required
                  options={[
                    { value: "", label: tt.selectCustomer },
                    ...(customers?.items ?? []).map((c) => ({ value: c.id, label: `${c.full_name} (${c.code})` })),
                  ]}
                  value={customerId === "" ? "" : String(customerId)}
                  onChange={(e) => setCustomerId(Number((e.target as HTMLSelectElement).value) || "")}
                />
              ) : (
                <div className="badge badge-brand col-span-2">{tt.placingAs.replace("{name}", user?.full_name ?? "")}</div>
              )}
              <Input label={tt.orderTitleLabel} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={tt.orderTitlePh} />
              {!isPortal ? (
                <>
                  <Input label={tt.deadline} type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                  <Select
                    label={tt.priority} value={priority}
                    options={[
                      { value: "low", label: tt.priorities.low },
                      { value: "normal", label: tt.priorities.normal },
                      { value: "high", label: tt.priorities.high },
                      { value: "urgent", label: tt.priorities.urgent },
                    ]}
                    onChange={(e) => setPriority((e.target as HTMLSelectElement).value)}
                  />
                </>
              ) : null}
              <Textarea label={tt.notes} rows={3} className="sm:col-span-2" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </CardBody>
          </Card>
          ) : null}

          {step === 2 ? (
          <Card>
            <CardHeader
              title={tt.lineItemsTitle}
              subtitle={tt.lineItemsSub}
              action={
                <div className="flex flex-wrap gap-2">
                  {canManageCatalog ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<Plus className="size-3.5" />}
                      onClick={() => { setPendingLineIdx(null); setProductModalOpen(true); }}
                    >
                      {tt.addProduct}
                    </Button>
                  ) : null}
                  <Button size="sm" icon={<Plus className="size-3.5" />} onClick={addLine}>
                    {tt.addLine}
                  </Button>
                </div>
              }
            />
            <CardBody className="space-y-4">
              {lines.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-surface-2/40 px-4 py-10 text-center text-text-3 text-[13px]">
                  {tt.noItems}{tt.noItemsHintBefore}<span className="text-text">{tt.noItemsHintLink}</span>{tt.noItemsHintAfter}
                </div>
              ) : (
                lines.map((line, idx) => (
                  <OrderLineRow
                    key={idx}
                    products={products?.items ?? []}
                    line={line}
                    readOnlyPricing={isPortal}
                    canAddProduct={canManageCatalog}
                    onAddProduct={() => { setPendingLineIdx(idx); setProductModalOpen(true); }}
                    onChange={(next) =>
                      setLines((rows) => rows.map((r, i) => (i === idx ? next : r)))
                    }
                    onRemove={() => setLines((rows) => rows.filter((_, i) => i !== idx))}
                  />
                ))
              )}
            </CardBody>
          </Card>
          ) : null}

          {step === 3 ? (
          <Card>
            <CardHeader title={tt.reviewTitle} subtitle={tt.reviewSub} />
            <CardBody className="space-y-3 text-[13.5px]">
              {title ? <Row k={tt.orderTitleLabel} v={title} /> : null}
              {deadline ? <Row k={tt.deadline} v={deadline} /> : null}
              <Row k={tt.priority} v={tt.priorities[priority as keyof typeof tt.priorities] ?? priority} />
              <Row k={tt.lineItemsTitle} v={tt.itemCount.replace("{count}", String(lines.length))} />
              {lines.map((l, i) => (
                <div key={i} className="rounded-lg border border-border px-3 py-2">
                  <div className="font-medium">{l.name || tt.itemFallback.replace("{n}", String(i + 1))}</div>
                  <div className="text-text-3 text-[12px]">
                    {l.quantity} {l.unit} × {formatMoney(l.unit_price)} = {formatMoney(l.unit_price * l.quantity)}
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
          ) : null}

          {step === 3 && canAssignStaff ? (
            <Card>
              <CardHeader
                title={t.staffUi.workflowAssignments.title}
                subtitle={t.staffUi.workflowAssignments.subtitle}
              />
              <CardBody>
                <WorkflowAssignmentForm value={assignments} onChange={setAssignments} />
              </CardBody>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title={tt.summaryTitle} subtitle={tt.summarySub} />
            <CardBody className="space-y-2 text-[13.5px]">
              {isPortal ? (
                <p className="text-text-2 text-[13px] rounded-lg bg-surface-2/50 border border-border px-3 py-2">
                  {t.portalUi.orders.pricingPending}
                </p>
              ) : (
                <>
              <Row k={tt.subtotal} v={formatMoney(totals.subtotal)} />
              <Row k={tt.tax} v={formatMoney(totals.tax)} />
              <div className="border-t border-border/70 pt-2 mt-2 flex items-center justify-between">
                <span className="text-text-2">{tt.grandTotal}</span>
                <span className="text-xl font-semibold">{formatMoney(totals.grand)}</span>
              </div>
                </>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={tt.attachTitle} subtitle={tt.attachSub} />
            <CardBody>
              <FileUploadPanel
                pendingFiles={pendingFiles}
                onAddFiles={(files) => setPendingFiles((prev) => [...prev, ...files])}
                onRemovePending={(i) => setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))}
                label={tt.uploadCta}
                hint={tt.uploadHint}
                disabled={create.isPending}
              />
            </CardBody>
          </Card>
        </div>
      </div>

      {canManageCatalog ? (
        <ProductFormModal
          open={productModalOpen}
          onClose={() => { setProductModalOpen(false); setPendingLineIdx(null); }}
          onCreated={(product) => {
            qc.invalidateQueries({ queryKey: ["products", "all"] });
            const displayName = localizedProductName(product, locale);
            if (pendingLineIdx !== null) {
              setLines((rows) =>
                rows.map((r, i) =>
                  i === pendingLineIdx
                    ? {
                        ...r,
                        product_id: product.id,
                        name: displayName,
                        unit: product.unit,
                        unit_price: 0,
                        tax_rate: product.tax_rate,
                      }
                    : r,
                ),
              );
            } else {
              setLines((rows) => [
                ...rows,
                {
                  product_id: product.id,
                  name: displayName,
                  unit: product.unit,
                  quantity: 1,
                  unit_price: 0,
                  tax_rate: product.tax_rate,
                  spec: {},
                },
              ]);
            }
            setPendingLineIdx(null);
          }}
        />
      ) : null}
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex items-center justify-between"><span className="text-text-2">{k}</span><span>{v}</span></div>;
}

function OrderLineRow({
  products, line, onChange, onRemove, canAddProduct, onAddProduct, readOnlyPricing = false,
}: {
  products: any[];
  line: LineDraft;
  onChange: (l: LineDraft) => void;
  onRemove: () => void;
  canAddProduct?: boolean;
  onAddProduct?: () => void;
  readOnlyPricing?: boolean;
}) {
  const { t, locale } = useT();
  const tt = t.staffUi.newOrder;
  const product = products.find((p) => p.id === line.product_id);
  const productLabel = (p: { id: number; name: string; name_ar?: string | null }) =>
    localizedProductName(p, locale);

  const updateSpec = (attr: string, value: string) =>
    onChange({ ...line, spec: { ...line.spec, [attr]: value } });

  const optionGroups = getProductOptionGroups(product, locale, t.staffUi.catalogOptions);
  const lineTotal = line.unit_price * line.quantity;

  return (
    <div className="rounded-xl border border-border bg-surface-2/30 p-3 sm:p-4 space-y-4">
      {/* Summary header — always visible on mobile */}
      <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-text-3">{tt.product}</div>
          <div className="mt-0.5 text-[14px] font-semibold text-text truncate">
            {product ? productLabel(product) : line.name ?? tt.selectProduct}
          </div>
          {product && !readOnlyPricing ? (
            <div className="mt-1 text-[12px] text-text-2 tabular-nums">
              {formatMoney(line.unit_price)} / {line.unit}
            </div>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {!readOnlyPricing ? (
            <span className="text-[15px] font-bold tabular-nums text-brand">
              {formatMoney(lineTotal)}
            </span>
          ) : null}
          <Button variant="ghost" size="sm" onClick={onRemove} className="h-8 px-2">
            <Trash2 className="size-4 text-danger" />
          </Button>
        </div>
      </div>

      {/* Product picker — full width */}
      <div className="space-y-2">
        <Select
          label={tt.product}
          wrapperClassName="w-full"
          options={[
            { value: "", label: tt.selectProduct },
            ...products.map((p) => ({
              value: p.id,
              label: productLabel(p),
            })),
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
              unit_price: picked ? 0 : line.unit_price,
              tax_rate: picked?.tax_rate ?? line.tax_rate,
              spec: {},
            });
          }}
        />
        {canAddProduct ? (
          <Button size="sm" variant="secondary" icon={<Plus className="size-3.5" />} onClick={onAddProduct}>
            {tt.addProduct}
          </Button>
        ) : null}
      </div>

      {/* Qty / unit / price — stacks on mobile, row on desktop */}
      <div className={`grid grid-cols-1 gap-3 ${readOnlyPricing ? "sm:grid-cols-1" : "sm:grid-cols-2 md:grid-cols-3"}`}>
        <Input
          label={tt.quantity}
          type="number"
          min={0}
          step="0.5"
          inputMode="decimal"
          wrapperClassName="min-w-0"
          value={line.quantity}
          onChange={(e) => onChange({ ...line, quantity: Number(e.target.value) || 0 })}
        />
        {!readOnlyPricing ? (
          <>
            <Input
              label={tt.unit}
              wrapperClassName="min-w-0"
              value={line.unit}
              onChange={(e) => onChange({ ...line, unit: e.target.value })}
            />
            <Input
              label={tt.unitPrice}
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              wrapperClassName="min-w-0 sm:col-span-2 md:col-span-1"
              value={line.unit_price}
              onChange={(e) => onChange({ ...line, unit_price: Number(e.target.value) || 0 })}
            />
          </>
        ) : product ? (
          <Input label={tt.unit} wrapperClassName="min-w-0" value={line.unit} disabled />
        ) : null}
      </div>

      {product && optionGroups.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {optionGroups.map((group) => (
            <Select
              key={group.key}
              label={group.label}
              wrapperClassName="min-w-0"
              options={[
                { value: "", label: t.common.none },
                ...group.choices.map((choice) => ({ value: choice.value, label: choice.label })),
              ]}
              value={line.spec[group.key] ?? ""}
              onChange={(e) => updateSpec(group.key, (e.target as HTMLSelectElement).value)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
