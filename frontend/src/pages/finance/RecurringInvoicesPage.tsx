import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw } from "lucide-react";
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

export default function RecurringInvoicesPage() {
  const { t } = useT();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["recurring"],
    queryFn: () => salesApi.recurring({ page: 1, page_size: 50 }),
  });
  const { data: customers } = useQuery({
    queryKey: ["customers", "pick"],
    queryFn: () => customersApi.list({ page: 1, page_size: 100 }),
    enabled: open,
  });

  const [customerId, setCustomerId] = useState("");
  const [title, setTitle] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("0");

  const create = useMutation({
    mutationFn: () =>
      salesApi.createRecurring({
        customer_id: Number(customerId),
        title: title || "Recurring",
        interval: "monthly",
        next_run: new Date().toISOString().slice(0, 10),
        currency: "IQD",
        items: [{ name: name || title || "Service", quantity: 1, unit_price: Number(price) || 0 }],
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recurring"] });
      toast.success(t.staffUi.common.create);
      setOpen(false);
    },
  });

  const run = useMutation({
    mutationFn: (id: number) => salesApi.runRecurring(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recurring"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice generated");
    },
  });

  const cols: Column<any>[] = [
    { key: "code", header: "Code", render: (r) => <span className="font-mono text-[12px]">{r.code}</span> },
    { key: "title", header: "Title", render: (r) => r.title },
    { key: "next", header: "Next run", render: (r) => formatDate(r.next_run) },
    { key: "total", header: "Total", align: "right", render: (r) => formatMoney(r.grand_total, r.currency) },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        <Button size="sm" variant="secondary" loading={run.isPending} disabled={!r.is_active} onClick={() => run.mutate(r.id)}>
          Run now
        </Button>
      ),
    },
  ];

  return (
    <div className="page-shell">
      <PageHeader
        title={t.staffUi.nav.recurringInvoices}
        actions={<Button icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>{t.staffUi.common.create}</Button>}
      />
      <DataTable
        columns={cols}
        rows={data?.items ?? []}
        loading={isLoading}
        rowKey={(r) => r.id}
        empty={<EmptyState icon={<RefreshCw className="size-7" />} title={t.staffUi.common.noResults} />}
      />
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t.staffUi.nav.recurringInvoices}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>{t.staffUi.common.cancel}</Button>
            <Button loading={create.isPending} disabled={!customerId || !title} onClick={() => create.mutate()}>
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
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input label="Line" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Amount" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
}
