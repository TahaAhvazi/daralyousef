import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Boxes, Filter, Pencil, Plus, Search, Trash2, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";

import { inventoryApi } from "@/api/modules";
import { PagePanel, PanelScroll } from "@/components/layout/PagePanel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Column, DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatMoney, formatNumber } from "@/lib/format";
import {
  canCreateInventory,
  canDeleteInventory,
  canUpdateInventory,
} from "@/lib/permissions";
import { useAuthStore } from "@/store/auth";
import { useT } from "@/i18n/useT";
import type { Material } from "@/types/api";

function materialStatus(m: Material, labels: { low: string; ok: string; out: string }) {
  if (m.on_hand <= 0) return <Badge variant="danger">{labels.out}</Badge>;
  if (m.on_hand <= m.reorder_level && m.reorder_level > 0) return <Badge variant="warning">{labels.low}</Badge>;
  return <Badge variant="success">{labels.ok}</Badge>;
}

export default function MaterialsPage() {
  const { t } = useT();
  const tt = t.staffUi.materials;
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [low, setLow] = useState(false);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editMaterial, setEditMaterial] = useState<Material | null>(null);
  const [movementFor, setMovementFor] = useState<Material | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["materials", page, q, low],
    queryFn: () => inventoryApi.materials({ page, page_size: 25, q: q || undefined, low_stock: low }),
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / 25));

  const kpis = useMemo(() => {
    const lowCount = items.filter((m) => m.on_hand <= m.reorder_level && m.reorder_level > 0).length;
    const outCount = items.filter((m) => m.on_hand <= 0).length;
    const value = items.reduce((s, m) => s + m.on_hand * m.cost, 0);
    return { total, lowCount, outCount, value };
  }, [items, total]);

  const remove = useMutation({
    mutationFn: (id: number) => inventoryApi.removeMaterial(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["materials"] });
      toast.success(tt.deleted);
    },
  });

  const cols: Column<Material>[] = [
    {
      key: "material",
      header: tt.colMaterial,
      render: (m) => (
        <div className="min-w-[160px]">
          <div className="font-medium text-[13.5px]">{m.name}</div>
          <div className="text-[11px] text-text-3 font-mono mt-0.5">{m.sku}</div>
        </div>
      ),
    },
    {
      key: "price",
      header: tt.colUnitCost,
      align: "right",
      render: (m) => <span className="font-semibold tabular-nums">{formatMoney(m.cost)}</span>,
    },
    {
      key: "stock",
      header: tt.colOnHand,
      align: "right",
      render: (m) => (
        <span className={`tabular-nums ${m.on_hand <= m.reorder_level && m.reorder_level > 0 ? "text-warning font-semibold" : ""}`}>
          {formatNumber(m.on_hand, 2)} {m.unit}
        </span>
      ),
    },
    {
      key: "status",
      header: tt.colStatus,
      render: (m) => materialStatus(m, { low: tt.stockLow, ok: tt.stockOk, out: tt.stockOut }),
    },
    {
      key: "value",
      header: tt.colStockValue,
      align: "right",
      render: (m) => <span className="tabular-nums text-text-2">{formatMoney(m.on_hand * m.cost)}</span>,
    },
    {
      key: "category",
      header: tt.category,
      render: (m) => <span className="text-[12.5px] text-text-2">{m.category ?? t.common.none}</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (m) => (
        <div className="flex justify-end gap-1">
          {canUpdateInventory(user) ? (
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditMaterial(m); }}>
              <Pencil className="size-3.5" />
            </Button>
          ) : null}
          {canUpdateInventory(user) ? (
            <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); setMovementFor(m); }}>
              {tt.movement}
            </Button>
          ) : null}
          {canDeleteInventory(user) ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(t.staffUi.common.delete + "?")) remove.mutate(m.id);
              }}
            >
              <Trash2 className="size-3.5" />
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <PagePanel>
      <PageHeader
        title={tt.title}
        description={tt.description}
        actions={
          canCreateInventory(user) ? (
            <Button icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>
              {tt.newBtn}
            </Button>
          ) : null
        }
      />

      <div className="grid shrink-0 grid-cols-4 gap-1.5 sm:gap-2.5">
        {[
          { label: tt.kpiTotal, value: formatNumber(kpis.total), hint: tt.kpiTotalHint },
          { label: tt.kpiLowStock, value: formatNumber(kpis.lowCount), hint: tt.kpiLowStockHint },
          { label: tt.kpiOutOfStock, value: formatNumber(kpis.outCount), hint: tt.kpiOutOfStockHint },
          { label: tt.kpiStockValue, value: formatMoney(kpis.value), hint: tt.kpiStockValueHint },
        ].map((k) => (
          <div key={k.label} className="card min-w-0 px-2.5 py-2 sm:px-3 sm:py-2.5">
            <div className="flex items-start justify-between gap-1">
              <span className="text-[9px] font-semibold uppercase leading-tight tracking-wide text-text-3 sm:text-[10px] line-clamp-2">
                {k.label}
              </span>
              <span className="size-5 shrink-0 grid place-items-center rounded-md bg-brand/10 text-brand sm:size-6">
                <TrendingUp className="size-3" />
              </span>
            </div>
            <div className="mt-1 text-base font-semibold tracking-tight tabular-nums truncate sm:text-lg">
              {k.value}
            </div>
            <div className="mt-0.5 text-[9px] text-text-3 truncate sm:text-[10px]">{k.hint}</div>
          </div>
        ))}
      </div>

      <div className="card flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-4">
        <div className="flex shrink-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" icon={<Filter className="size-3.5" />}>
              {tt.filters}
            </Button>
            <button
              type="button"
              onClick={() => { setLow(false); setPage(1); }}
              className={`rounded-full px-3 py-1 text-[12px] border transition-colors ${
                !low ? "bg-text text-bg border-text" : "border-border text-text-2 hover:bg-surface-2"
              }`}
            >
              {tt.allMaterials}
            </button>
            <button
              type="button"
              onClick={() => { setLow(true); setPage(1); }}
              className={`rounded-full px-3 py-1 text-[12px] border transition-colors ${
                low ? "bg-text text-bg border-text" : "border-border text-text-2 hover:bg-surface-2"
              }`}
            >
              {tt.lowOnly}
            </button>
          </div>
          <Input
            iconLeft={<Search className="size-4" />}
            placeholder={tt.searchPh}
            className="w-full lg:w-72"
            value={q}
            onChange={(e) => { setPage(1); setQ(e.target.value); }}
          />
        </div>

        <PanelScroll>
        <DataTable
          columns={cols}
          rows={items}
          loading={isLoading}
          rowKey={(r) => r.id}
          empty={<EmptyState icon={<Boxes className="size-7" />} title={tt.emptyTitle} />}
        />

        {pageCount > 1 ? (
          <div className="flex shrink-0 items-center justify-center gap-1 pt-2">
            <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              {t.staffUi.common.previous}
            </Button>
            {Array.from({ length: Math.min(pageCount, 5) }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                className={`size-8 rounded-full text-[12px] font-medium ${
                  page === n ? "bg-text text-bg" : "text-text-2 hover:bg-surface-2"
                }`}
              >
                {n}
              </button>
            ))}
            <Button size="sm" variant="ghost" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>
              {t.staffUi.common.next}
            </Button>
          </div>
        ) : null}
        </PanelScroll>
      </div>

      {open ? <MaterialFormModal open onClose={() => setOpen(false)} /> : null}
      {editMaterial ? (
        <MaterialFormModal open material={editMaterial} onClose={() => setEditMaterial(null)} />
      ) : null}
      <MovementModal open={!!movementFor} onClose={() => setMovementFor(null)} material={movementFor} />
    </PagePanel>
  );
}

function MaterialFormModal({
  open,
  onClose,
  material,
}: {
  open: boolean;
  onClose: () => void;
  material?: Material;
}) {
  const { t } = useT();
  const tt = t.staffUi.materials;
  const qc = useQueryClient();
  const isEdit = !!material;
  const [form, setForm] = useState<Partial<Material>>({ unit: "pcs" });

  useEffect(() => {
    if (!open) return;
    setForm(material ?? { unit: "pcs" });
  }, [open, material]);

  const save = useMutation({
    mutationFn: () =>
      isEdit
        ? inventoryApi.updateMaterial(material!.id, form)
        : inventoryApi.createMaterial(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["materials"] });
      toast.success(isEdit ? tt.updated : tt.created);
      onClose();
      if (!isEdit) setForm({ unit: "pcs" });
    },
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? tt.editTitle : tt.newTitle}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{t.staffUi.common.cancel}</Button>
          <Button loading={save.isPending} onClick={() => save.mutate()}>
            {isEdit ? t.staffUi.common.save : t.staffUi.common.create}
          </Button>
        </>
      }
    >
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Input label={tt.name} required value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label={tt.sku} value={form.sku ?? ""} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
        <Input label={tt.unit} value={form.unit ?? ""} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
        <Input label={tt.category} value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })} />
        <Input label={tt.onHand} type="number" value={form.on_hand ?? 0} onChange={(e) => setForm({ ...form, on_hand: Number(e.target.value) })} />
        <Input label={tt.cost} type="number" step="0.01" value={form.cost ?? 0} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} />
        <Input label={tt.reorderLevel} type="number" value={form.reorder_level ?? 0} onChange={(e) => setForm({ ...form, reorder_level: Number(e.target.value) })} />
      </div>
    </Modal>
  );
}

function MovementModal({ open, onClose, material }: { open: boolean; onClose: () => void; material: Material | null }) {
  const { t } = useT();
  const tt = t.staffUi.materials;
  const qc = useQueryClient();
  const [type, setType] = useState("IN");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const create = useMutation({
    mutationFn: () =>
      inventoryApi.createMovement({
        material_id: material!.id, type, quantity, notes,
      } as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["materials"] });
      toast.success(tt.recorded); onClose(); setQuantity(1); setNotes("");
    },
  });

  return (
    <Modal open={open} onClose={onClose}
      title={material ? tt.movementTitle.replace("{name}", material.name) : tt.movementTitleEmpty}
      footer={<><Button variant="secondary" onClick={onClose}>{t.staffUi.common.cancel}</Button>
                <Button loading={create.isPending} onClick={() => create.mutate()} disabled={!material}>{tt.record}</Button></>}>
      <div className="grid gap-3.5">
        <Select label={tt.movementType} value={type}
          options={(["IN", "OUT", "DAMAGED", "ADJUSTMENT", "TRANSFER"] as const).map((mt) => ({ value: mt, label: tt.movementTypes[mt] }))}
          onChange={(e) => setType((e.target as HTMLSelectElement).value)} />
        <Input label={tt.movementQty} type="number" min={0} step="0.01"
               value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
        <Input label={tt.movementNotes} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
    </Modal>
  );
}
