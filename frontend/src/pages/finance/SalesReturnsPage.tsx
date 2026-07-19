import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";

import { customersApi, salesApi } from "@/api/modules";
import { Button } from "@/components/ui/Button";
import { Column, DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDate, formatMoney } from "@/lib/format";
import { useT } from "@/i18n/useT";

export default function SalesReturnsPage() {
  const { t } = useT();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["sales-returns"],
    queryFn: () => salesApi.returns({ page: 1, page_size: 50 }),
  });
  const { data: customers } = useQuery({
    queryKey: ["customers", "pick"],
    queryFn: () => customersApi.list({ page: 1, page_size: 100 }),
    enabled: open,
  });

  const [customerId, setCustomerId] = useState("");
  const [name, setName] = useState("");
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState("0");

  const create = useMutation({
    mutationFn: () =>
      salesApi.createReturn({
        customer_id: Number(customerId),
        return_date: new Date().toISOString().slice(0, 10),
        currency: "IQD",
        create_credit_note: true,
        items: [{ name: name || "Return", quantity: Number(qty) || 1, unit_price: Number(price) || 0 }],
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales-returns"] });
      toast.success(t.staffUi.common.create);
      setOpen(false);
    },
  });

  const cols: Column<any>[] = [
    { key: "code", header: "Code", render: (r) => <span className="font-mono text-[12px]">{r.code}</span> },
    { key: "date", header: "Date", render: (r) => formatDate(r.return_date) },
    { key: "status", header: "Status", render: (r) => r.status },
    { key: "total", header: "Total", align: "right", render: (r) => formatMoney(r.grand_total, r.currency) },
  ];

  return (
    <div className="page-shell">
      <PageHeader
        title={t.staffUi.nav.salesReturns}
        actions={<Button icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>{t.staffUi.common.create}</Button>}
      />
      <DataTable
        columns={cols}
        rows={data?.items ?? []}
        loading={isLoading}
        rowKey={(r) => r.id}
        empty={<EmptyState icon={<RotateCcw className="size-7" />} title={t.staffUi.common.noResults} />}
      />
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t.staffUi.nav.salesReturns}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>{t.staffUi.common.cancel}</Button>
            <Button loading={create.isPending} disabled={!customerId || !name} onClick={() => create.mutate()}>
              {t.staffUi.common.create}
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <select className="input w-full" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">Customer…</option>
            {(customers?.items ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.full_name}</option>
            ))}
          </select>
          <Input label="Item" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Qty" value={qty} onChange={(e) => setQty(e.target.value)} />
            <Input label="Price" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
