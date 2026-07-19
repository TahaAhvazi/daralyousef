import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileMinus, Plus, Search, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { salesApi } from "@/api/modules";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CustomerSearchSelect } from "@/components/ui/CustomerSearchSelect";
import { Column, DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { apiErrorMessage } from "@/lib/apiErrors";
import { formatDate, formatMoney } from "@/lib/format";
import { hasAnyPermission } from "@/lib/permissions";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { useAuthStore } from "@/store/auth";
import { useT } from "@/i18n/useT";

const PAGE_SIZE = 15;

export default function CreditNotesPage() {
  const { t, locale } = useT();
  const tt = t.staffUi.common;
  const fi = t.staffUi.invoices;
  const me = useAuthStore((s) => s.user);
  const canManage = hasAnyPermission(me, "finance:update", "finance:create");
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q.trim(), 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["credit-notes", page, debouncedQ],
    queryFn: () =>
      salesApi.creditNotes({
        page,
        page_size: PAGE_SIZE,
        q: debouncedQ || undefined,
      }),
    placeholderData: (prev) => prev,
  });
  const total = data?.total ?? 0;
  const [customerId, setCustomerId] = useState("");
  const [name, setName] = useState("");
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState("0");
  const [reason, setReason] = useState("");

  const create = useMutation({
    mutationFn: () =>
      salesApi.createCreditNote({
        customer_id: Number(customerId),
        issue_date: new Date().toISOString().slice(0, 10),
        currency: "IQD",
        reason: reason || undefined,
        items: [{ name: name || "Credit", quantity: Number(qty) || 1, unit_price: Number(price) || 0 }],
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["credit-notes"] });
      toast.success(tt.create);
      setOpen(false);
      setPage(1);
    },
    onError: (err) => toast.error(apiErrorMessage(err, locale)),
  });

  const remove = useMutation({
    mutationFn: (id: number) => salesApi.removeCreditNote(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["credit-notes"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success(fi.detail.creditNoteDeleted);
    },
    onError: (err) => toast.error(apiErrorMessage(err, locale)),
  });

  const cols: Column<any>[] = [
    { key: "code", header: "Code", render: (r) => <span className="font-mono text-[12px]">{r.code}</span> },
    { key: "date", header: "Date", render: (r) => formatDate(r.issue_date) },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge variant={r.status === "cancelled" ? "danger" : "success"}>{r.status}</Badge>
      ),
    },
    { key: "total", header: "Total", align: "right", render: (r) => formatMoney(r.grand_total, r.currency) },
    { key: "reason", header: "Reason", render: (r) => r.reason || "—" },
    ...(canManage
      ? [
          {
            key: "actions",
            header: "",
            align: "right" as const,
            render: (r: { id: number; code: string }) => (
              <Button
                variant="ghost"
                size="sm"
                icon={<Trash2 className="size-3.5" />}
                loading={remove.isPending && remove.variables === r.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(fi.detail.confirmDeleteCreditNote.replace("{code}", r.code))) {
                    remove.mutate(r.id);
                  }
                }}
              >
                {fi.detail.undoCreditNote}
              </Button>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="page-shell flex min-h-0 flex-col gap-3">
      <PageHeader
        title={t.staffUi.nav.creditNotes}
        description={t.staffUi.nav.modSales}
        actions={
          canManage ? (
            <Button icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>
              {tt.create}
            </Button>
          ) : null
        }
      />
      <div className="relative max-w-md">
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
        loading={isLoading || (isFetching && !data)}
        rowKey={(r) => r.id}
        empty={<EmptyState icon={<FileMinus className="size-7" />} title={tt.noResults} />}
      />
      {!isLoading ? (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          className="sticky bottom-0 z-10 shrink-0 border-border bg-bg/95 shadow-soft backdrop-blur-sm"
        />
      ) : null}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t.staffUi.nav.creditNotes}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>{tt.cancel}</Button>
            <Button loading={create.isPending} disabled={!customerId || !name} onClick={() => create.mutate()}>
              {tt.create}
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <label className="text-[12.5px] font-medium">
            {t.staffUi.nav.customers}
            <CustomerSearchSelect value={customerId} onChange={setCustomerId} />
          </label>
          <Input label="Line name" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Qty" value={qty} onChange={(e) => setQty(e.target.value)} />
            <Input label="Unit price" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <Input label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
}
