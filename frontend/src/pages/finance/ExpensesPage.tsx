import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Receipt, Search } from "lucide-react";
import toast from "react-hot-toast";

import { financeApi } from "@/api/modules";
import { Button } from "@/components/ui/Button";
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

export default function ExpensesPage() {
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
    queryKey: ["expenses", page, debouncedQ],
    queryFn: () =>
      financeApi.expenses({
        page,
        page_size: PAGE_SIZE,
        q: debouncedQ || undefined,
      }),
    placeholderData: (prev) => prev,
  });

  const [category, setCategory] = useState("ops");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const create = useMutation({
    mutationFn: () =>
      financeApi.createExpense({
        category,
        amount: Number(amount),
        currency: "IQD",
        spent_at: new Date().toISOString().slice(0, 10),
        description: description || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      toast.success(t.staffUi.common.create);
      setOpen(false);
      setPage(1);
    },
  });

  const cols: Column<any>[] = [
    { key: "date", header: "Date", render: (r) => formatDate(r.spent_at) },
    { key: "cat", header: "Category", render: (r) => r.category },
    { key: "desc", header: "Description", render: (r) => r.description || "—" },
    { key: "amt", header: "Amount", align: "right", render: (r) => formatMoney(r.amount, r.currency) },
  ];

  return (
    <div className="page-shell">
      <PageHeader
        title={t.staffUi.nav.expenses}
        actions={<Button icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>{t.staffUi.common.create}</Button>}
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
        empty={<EmptyState icon={<Receipt className="size-7" />} title={t.staffUi.common.noResults} />}
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
        title={t.staffUi.nav.expenses}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>{t.staffUi.common.cancel}</Button>
            <Button loading={create.isPending} disabled={!amount} onClick={() => create.mutate()}>
              {t.staffUi.common.create}
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <Input label="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
          <Input label="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
}
