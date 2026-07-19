import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Filter, Package, Pencil, Plus, Search, Trash2, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { catalogApi } from "@/api/modules";
import { ProductFormModal } from "@/components/catalog/ProductFormModal";
import { PagePanel, PanelScroll } from "@/components/layout/PagePanel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Column, DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  localizedCategoryName,
  localizedProductName,
} from "@/lib/catalog";
import { formatMoney, formatNumber } from "@/lib/format";
import { canManageCatalog } from "@/lib/permissions";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { useAuthStore } from "@/store/auth";
import { useT } from "@/i18n/useT";
import type { Product } from "@/types/api";

function stockBadge(
  status: string | null | undefined,
  labels: { inStock: string; restock: string; outOfStock: string },
) {
  if (status === "out_of_stock") return <Badge variant="danger">{labels.outOfStock}</Badge>;
  if (status === "restock") return <Badge variant="warning">{labels.restock}</Badge>;
  return <Badge variant="success">{labels.inStock}</Badge>;
}

export default function ProductsPage() {
  const { t, locale } = useT();
  const tt = t.staffUi.products;
  const user = useAuthStore((s) => s.user);
  const canManage = canManageCatalog(user);
  const qc = useQueryClient();

  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q.trim(), 300);
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, categoryId]);

  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: catalogApi.categories });
  const { data: prods, isLoading } = useQuery({
    queryKey: ["products", page, debouncedQ, categoryId],
    queryFn: () =>
      catalogApi.products({
        page,
        page_size: 25,
        q: debouncedQ || undefined,
        category_id: categoryId ? Number(categoryId) : undefined,
        active_only: false,
      }),
    placeholderData: (prev) => prev,
  });

  const items = prods?.items ?? [];
  const total = prods?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / 25));

  const kpis = useMemo(() => {
    const active = items.filter((p) => p.is_active).length;
    const low = items.filter((p) => p.stock_status === "out_of_stock" || p.stock_status === "restock").length;
    const revenue = items.reduce((s, p) => s + p.base_price, 0);
    return { total, active, low, revenue };
  }, [items, total]);

  const remove = useMutation({
    mutationFn: (id: number) => catalogApi.removeProduct(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success(tt.form.deleted);
    },
  });

  const cols: Column<Product>[] = [
    {
      key: "product",
      header: tt.colProduct,
      render: (p) => (
        <div className="min-w-[180px]">
          <div className="font-medium text-[13.5px]">{localizedProductName(p, locale)}</div>
          <div className="text-[11px] text-text-3 font-mono mt-0.5">{p.sku}</div>
        </div>
      ),
    },
    {
      key: "price",
      header: tt.colPrice,
      align: "right",
      render: (p) => (
        <span className="font-semibold tabular-nums">
          {formatMoney(p.base_price)}
          <span className="text-text-3 font-normal text-[11px]">/{p.unit}</span>
        </span>
      ),
    },
    {
      key: "materials",
      header: tt.colMaterials,
      align: "right",
      render: (p) => (
        <span className="text-[13px] text-text-2 tabular-nums">
          {formatNumber(p.materials?.length ?? 0)}
        </span>
      ),
    },
    {
      key: "stock",
      header: tt.colStock,
      render: (p) => stockBadge(p.stock_status, tt.stockStatus),
    },
    {
      key: "status",
      header: tt.colStatus,
      render: (p) =>
        p.is_active ? (
          <Badge variant="brand">{tt.statusActive}</Badge>
        ) : (
          <Badge variant="default">{tt.statusInactive}</Badge>
        ),
    },
    {
      key: "cost",
      header: tt.colCost,
      align: "right",
      render: (p) => <span className="tabular-nums text-text-2">{formatMoney(p.cost)}</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (p) =>
        canManage ? (
          <div className="flex justify-end gap-1">
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditProduct(p); }}>
              <Pencil className="size-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(tt.form.confirmDelete)) remove.mutate(p.id);
              }}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <PagePanel>
      <PageHeader
        title={tt.title}
        description={tt.description}
        actions={
          canManage ? (
            <Button icon={<Plus className="size-4" />} onClick={() => setModalOpen(true)}>
              {tt.addBtn}
            </Button>
          ) : null
        }
      />

      <div className="grid shrink-0 grid-cols-4 gap-1.5 sm:gap-2.5">
        {[
          { label: tt.kpiTotal, value: formatNumber(kpis.total), hint: tt.kpiTotalHint },
          { label: tt.kpiActive, value: formatNumber(kpis.active), hint: tt.kpiActiveHint },
          { label: tt.kpiLowStock, value: formatNumber(kpis.low), hint: tt.kpiLowStockHint },
          { label: tt.kpiCatalogValue, value: formatMoney(kpis.revenue), hint: tt.kpiCatalogValueHint },
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
              onClick={() => { setCategoryId(""); setPage(1); }}
              className={`rounded-full px-3 py-1 text-[12px] border transition-colors ${
                categoryId === "" ? "bg-text text-bg border-text" : "border-border text-text-2 hover:bg-surface-2"
              }`}
            >
              {tt.allProducts}
            </button>
            {(categories ?? []).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => { setCategoryId(c.id); setPage(1); }}
                className={`rounded-full px-3 py-1 text-[12px] border transition-colors ${
                  categoryId === c.id ? "bg-text text-bg border-text" : "border-border text-text-2 hover:bg-surface-2"
                }`}
              >
                {localizedCategoryName(c, locale)}
              </button>
            ))}
          </div>
          <Input
            iconLeft={<Search className="size-4" />}
            placeholder={tt.searchPh}
            className="w-full lg:w-72"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <PanelScroll>
        <DataTable
          columns={cols}
          rows={items}
          loading={isLoading}
          rowKey={(r) => r.id}
          onRowClick={canManage ? (p) => setEditProduct(p) : undefined}
          empty={<EmptyState icon={<Package className="size-7" />} title={tt.emptyTitle} />}
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

      {canManage && modalOpen ? (
        <ProductFormModal open onClose={() => setModalOpen(false)} />
      ) : null}
      {canManage && editProduct ? (
        <ProductFormModal open product={editProduct} onClose={() => setEditProduct(null)} />
      ) : null}
    </PagePanel>
  );
}
