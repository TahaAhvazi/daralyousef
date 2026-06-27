import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { catalogApi, inventoryApi } from "@/api/modules";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { localizedCategoryName } from "@/lib/catalog";
import { useT } from "@/i18n/useT";
import type { Product, ProductMaterial } from "@/types/api";

const UNITS = ["pcs", "m²", "m", "pkg", "month", "L", "pack", "spool"];

const PRICING_MODELS = [
  { value: "fixed", labelKey: "fixed" as const },
  { value: "variable", labelKey: "variable" as const },
  { value: "custom_quote", labelKey: "customQuote" as const },
];

type BomLine = { material_id: number | ""; quantity_per_unit: number };

export function ProductFormModal({
  open,
  onClose,
  product,
  onSaved,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  product?: Product | null;
  onSaved?: (product: Product) => void;
  /** @deprecated use onSaved */
  onCreated?: (product: Product) => void;
}) {
  const { t, locale } = useT();
  const pf = t.staffUi.products.form;
  const bomT = t.staffUi.products.bom;
  const qc = useQueryClient();
  const isEdit = !!product;

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: catalogApi.categories,
    enabled: open,
  });

  const { data: materialsPage } = useQuery({
    queryKey: ["materials", "all"],
    queryFn: () => inventoryApi.materials({ page: 1, page_size: 200 }),
    enabled: open,
  });

  const { data: existingBom } = useQuery({
    queryKey: ["product-bom", product?.id],
    queryFn: () => catalogApi.productMaterials(product!.id),
    enabled: open && !!product?.id,
  });

  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [unit, setUnit] = useState("pcs");
  const [basePrice, setBasePrice] = useState(0);
  const [cost, setCost] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [pricingModel, setPricingModel] = useState("variable");
  const [description, setDescription] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [bomLines, setBomLines] = useState<BomLine[]>([{ material_id: "", quantity_per_unit: 1 }]);

  useEffect(() => {
    if (!open) return;
    if (product) {
      setName(product.name);
      setNameAr(product.name_ar ?? "");
      setCategoryId(product.category_id ?? "");
      setUnit(product.unit);
      setBasePrice(product.base_price);
      setCost(product.cost);
      setTaxRate(product.tax_rate);
      setPricingModel(product.pricing_model);
      setDescription(product.description ?? "");
      setDescriptionAr(product.description_ar ?? "");
    } else {
      setName("");
      setNameAr("");
      setCategoryId("");
      setUnit("pcs");
      setBasePrice(0);
      setCost(0);
      setTaxRate(0);
      setPricingModel("variable");
      setDescription("");
      setDescriptionAr("");
      setBomLines([{ material_id: "", quantity_per_unit: 1 }]);
    }
  }, [open, product]);

  useEffect(() => {
    if (!open || !existingBom) return;
    if (existingBom.length === 0) {
      setBomLines([{ material_id: "", quantity_per_unit: 1 }]);
      return;
    }
    setBomLines(
      existingBom.map((line: ProductMaterial) => ({
        material_id: line.material_id,
        quantity_per_unit: line.quantity_per_unit,
      })),
    );
  }, [open, existingBom]);

  const payload = () => ({
    name,
    name_ar: nameAr || undefined,
    category_id: categoryId ? Number(categoryId) : undefined,
    unit,
    base_price: basePrice,
    cost,
    tax_rate: taxRate,
    pricing_model: pricingModel,
    description: description || undefined,
    description_ar: descriptionAr || undefined,
  });

  const save = useMutation({
    mutationFn: async () => {
      const saved = isEdit
        ? await catalogApi.updateProduct(product!.id, payload())
        : await catalogApi.createProduct(payload());

      const lines = bomLines
        .filter((l) => l.material_id && l.quantity_per_unit > 0)
        .map((l) => ({
          material_id: Number(l.material_id),
          quantity_per_unit: l.quantity_per_unit,
        }));

      if (lines.length > 0 || isEdit) {
        await catalogApi.setProductMaterials(saved.id, lines);
      }
      return saved;
    },
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["product-bom", saved.id] });
      toast.success(isEdit ? pf.updated : pf.created);
      (onSaved ?? onCreated)?.(saved);
      onClose();
    },
    onError: () => toast.error(pf.failed),
  });

  const materialOptions = (materialsPage?.items ?? []).map((m) => ({
    value: m.id,
    label: `${m.name} (${m.sku})`,
  }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? pf.editTitle : pf.title}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t.staffUi.common.cancel}
          </Button>
          <Button
            loading={save.isPending}
            disabled={!name.trim()}
            onClick={() => save.mutate()}
          >
            {isEdit ? t.staffUi.common.save : t.staffUi.common.create}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={pf.nameEn}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={pf.nameEnPh}
          wrapperClassName="sm:col-span-1"
        />
        <Input
          label={pf.nameAr}
          value={nameAr}
          onChange={(e) => setNameAr(e.target.value)}
          placeholder={pf.nameArPh}
          dir="rtl"
          wrapperClassName="sm:col-span-1"
        />
        <Select
          label={pf.category}
          wrapperClassName="sm:col-span-2"
          value={categoryId === "" ? "" : String(categoryId)}
          onChange={(e) => setCategoryId(Number((e.target as HTMLSelectElement).value) || "")}
          options={[
            { value: "", label: pf.selectCategory },
            ...(categories ?? []).map((c) => ({
              value: c.id,
              label: localizedCategoryName(c, locale),
            })),
          ]}
        />
        <Select
          label={pf.unit}
          value={unit}
          onChange={(e) => setUnit((e.target as HTMLSelectElement).value)}
          options={UNITS.map((u) => ({ value: u, label: u }))}
        />
        <Select
          label={pf.pricingModel}
          value={pricingModel}
          onChange={(e) => setPricingModel((e.target as HTMLSelectElement).value)}
          options={PRICING_MODELS.map((m) => ({
            value: m.value,
            label: pf.models[m.labelKey],
          }))}
        />
        <Input
          label={pf.basePrice}
          type="number"
          min={0}
          step="0.01"
          inputMode="decimal"
          value={basePrice}
          onChange={(e) => setBasePrice(Number(e.target.value) || 0)}
        />
        <Input
          label={pf.cost}
          type="number"
          min={0}
          step="0.01"
          inputMode="decimal"
          value={cost}
          onChange={(e) => setCost(Number(e.target.value) || 0)}
        />
        <Input
          label={pf.taxRate}
          type="number"
          min={0}
          step="0.01"
          inputMode="decimal"
          value={taxRate}
          onChange={(e) => setTaxRate(Number(e.target.value) || 0)}
        />
        <Textarea
          label={pf.descriptionEn}
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          wrapperClassName="sm:col-span-2"
        />
        <Textarea
          label={pf.descriptionAr}
          rows={2}
          value={descriptionAr}
          onChange={(e) => setDescriptionAr(e.target.value)}
          dir="rtl"
          wrapperClassName="sm:col-span-2"
        />
      </div>

      <div className="mt-6 pt-5 border-t border-border">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-[14px] font-semibold">{bomT.title}</h3>
            <p className="text-[12px] text-text-3 mt-0.5">{bomT.description}</p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            icon={<Plus className="size-3.5" />}
            onClick={() => setBomLines((lines) => [...lines, { material_id: "", quantity_per_unit: 1 }])}
          >
            {bomT.addLine}
          </Button>
        </div>
        <div className="space-y-2">
          {bomLines.map((line, idx) => (
            <div key={idx} className="grid gap-2 sm:grid-cols-[1fr_140px_auto] items-end">
              <Select
                label={idx === 0 ? bomT.material : undefined}
                value={line.material_id === "" ? "" : String(line.material_id)}
                onChange={(e) => {
                  const v = Number((e.target as HTMLSelectElement).value) || "";
                  setBomLines((lines) => lines.map((l, i) => (i === idx ? { ...l, material_id: v } : l)));
                }}
                options={[{ value: "", label: bomT.selectMaterial }, ...materialOptions]}
              />
              <Input
                label={idx === 0 ? bomT.qtyPerUnit : undefined}
                type="number"
                min={0}
                step="0.01"
                value={line.quantity_per_unit}
                onChange={(e) => {
                  const v = Number(e.target.value) || 0;
                  setBomLines((lines) => lines.map((l, i) => (i === idx ? { ...l, quantity_per_unit: v } : l)));
                }}
              />
              <Button
                size="sm"
                variant="ghost"
                className="mb-0.5"
                onClick={() => setBomLines((lines) => lines.filter((_, i) => i !== idx))}
                disabled={bomLines.length <= 1}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
