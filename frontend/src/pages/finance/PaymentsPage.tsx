import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Wallet } from "lucide-react";
import toast from "react-hot-toast";

import { financeApi } from "@/api/modules";
import { Button } from "@/components/ui/Button";
import { CustomerSearchSelect } from "@/components/ui/CustomerSearchSelect";
import { Column, DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { formatDate, formatMoney } from "@/lib/format";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { useT } from "@/i18n/useT";

const PAGE_SIZE = 25;

export default function PaymentsPage() {
  const { t } = useT();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q.trim(), 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ]);

  const { data, isLoading } = useQuery({
    queryKey: ["payments", page, debouncedQ],
    queryFn: () =>
      financeApi.payments({
        page,
        page_size: PAGE_SIZE,
        q: debouncedQ || undefined,
      }),
    placeholderData: (prev) => prev,
  });
  const { data: invoices } = useQuery({
    queryKey: ["invoices", "pick"],
    queryFn: () => financeApi.invoices({ page: 1, page_size: 100 }),
    enabled: open,
  });

  const [customerId, setCustomerId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");

  const create = useMutation({
    mutationFn: () =>
      financeApi.recordPayment({
        customer_id: Number(customerId),
        invoice_id: invoiceId ? Number(invoiceId) : null,
        amount: Number(amount),
        method,
        currency: "IQD",
        paid_at: new Date().toISOString(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success(t.staffUi.common.create);
      setOpen(false);
      setPage(1);
    },
  });

  const cols: Column<any>[] = [
    { key: "date", header: "Paid at", render: (r) => formatDate(r.paid_at) },
    { key: "method", header: "Method", render: (r) => r.method },
    { key: "amount", header: "Amount", align: "right", render: (r) => formatMoney(r.amount, r.currency) },
    { key: "ref", header: "Reference", render: (r) => r.reference || "—" },
  ];

  return (
    <div className="page-shell">
      <PageHeader
        title={t.staffUi.nav.customerPayments}
        actions={<Button icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>{t.staffUi.common.record}</Button>}
      />
      <div className="relative mb-3 max-w-md">
        <Search className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-text-3" />
        <Input
          className="!ps-8"
          placeholder={t.staffUi.common.search}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <DataTable
        columns={cols}
        rows={data?.items ?? []}
        loading={isLoading}
        rowKey={(r) => r.id}
        empty={<EmptyState icon={<Wallet className="size-7" />} title={t.staffUi.common.noResults} />}
      />
      {data ? (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={data.total}
          onPageChange={setPage}
          className="mt-3"
        />
      ) : null}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t.staffUi.nav.customerPayments}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>{t.staffUi.common.cancel}</Button>
            <Button loading={create.isPending} disabled={!customerId || !amount} onClick={() => create.mutate()}>
              {t.staffUi.common.record}
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <label className="text-[12.5px] font-medium">
            {t.staffUi.nav.customers}
            <CustomerSearchSelect value={customerId} onChange={setCustomerId} />
          </label>
          <select className="input w-full" value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)}>
            <option value="">Invoice (optional)…</option>
            {(invoices?.items ?? []).map((i) => (
              <option key={i.id} value={i.id}>{i.code} · {formatMoney(i.balance, i.currency)}</option>
            ))}
          </select>
          <Input label="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <select className="input w-full" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="transfer">Transfer</option>
          </select>
        </div>
      </Modal>
    </div>
  );
}
