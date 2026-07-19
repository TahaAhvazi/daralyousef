import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Truck } from "lucide-react";
import toast from "react-hot-toast";

import { inventoryApi, salesApi } from "@/api/modules";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Column, DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDate, formatMoney } from "@/lib/format";
import { useT } from "@/i18n/useT";

export default function PurchasesPage() {
  const { t } = useT();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["purchases"],
    queryFn: () => salesApi.purchases({ page: 1, page_size: 50 }),
  });
  const { data: vendors } = useQuery({
    queryKey: ["vendors"],
    queryFn: () => salesApi.vendors({ page: 1, page_size: 100 }),
    enabled: open,
  });
  const { data: materials } = useQuery({
    queryKey: ["materials", "pick"],
    queryFn: () => inventoryApi.materials({ page: 1, page_size: 100 }),
    enabled: open,
  });

  const [vendorId, setVendorId] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [name, setName] = useState("");
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState("0");

  const create = useMutation({
    mutationFn: () =>
      salesApi.createPurchase({
        vendor_id: Number(vendorId),
        order_date: new Date().toISOString().slice(0, 10),
        currency: "IQD",
        items: [{
          name: name || "Material",
          quantity: Number(qty) || 1,
          unit_price: Number(price) || 0,
          material_id: materialId ? Number(materialId) : null,
        }],
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchases"] });
      toast.success(t.staffUi.common.create);
      setOpen(false);
    },
  });

  const receive = useMutation({
    mutationFn: (id: number) => salesApi.receivePurchase(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchases"] });
      qc.invalidateQueries({ queryKey: ["materials"] });
      toast.success("Received");
    },
  });

  const cols: Column<any>[] = [
    { key: "code", header: "Code", render: (r) => <span className="font-mono text-[12px]">{r.code}</span> },
    { key: "date", header: "Date", render: (r) => formatDate(r.order_date) },
    { key: "status", header: "Status", render: (r) => <Badge variant={r.status === "received" ? "success" : "warning"}>{r.status}</Badge> },
    { key: "total", header: "Total", align: "right", render: (r) => formatMoney(r.grand_total, r.currency) },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) =>
        r.status !== "received" ? (
          <Button size="sm" variant="secondary" loading={receive.isPending} onClick={() => receive.mutate(r.id)}>
            Receive
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="page-shell">
      <PageHeader
        title={t.staffUi.nav.purchases}
        actions={<Button icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>{t.staffUi.common.create}</Button>}
      />
      <DataTable
        columns={cols}
        rows={data?.items ?? []}
        loading={isLoading}
        rowKey={(r) => r.id}
        empty={<EmptyState icon={<Truck className="size-7" />} title={t.staffUi.common.noResults} />}
      />
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t.staffUi.nav.purchases}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>{t.staffUi.common.cancel}</Button>
            <Button loading={create.isPending} disabled={!vendorId || !name} onClick={() => create.mutate()}>
              {t.staffUi.common.create}
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <select className="input w-full" value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
            <option value="">Vendor…</option>
            {(vendors?.items ?? []).map((v: any) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
          <select
            className="input w-full"
            value={materialId}
            onChange={(e) => {
              setMaterialId(e.target.value);
              const m = (materials?.items ?? []).find((x) => String(x.id) === e.target.value);
              if (m) setName(m.name);
            }}
          >
            <option value="">Material (optional)…</option>
            {(materials?.items ?? []).map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <Input label="Item name" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Qty" value={qty} onChange={(e) => setQty(e.target.value)} />
            <Input label="Unit price" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
