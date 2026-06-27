import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Trash2, Users } from "lucide-react";
import toast from "react-hot-toast";

import { customersApi } from "@/api/modules";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Column, DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageToolbar, TOOLBAR_INPUT } from "@/components/ui/PageToolbar";
import { useAuthStore } from "@/store/auth";
import { canCreateCrm, canDeleteCrm } from "@/lib/permissions";
import { useT } from "@/i18n/useT";
import type { Customer } from "@/types/api";

export default function CustomersPage() {
  const { t } = useT();
  const tt = t.staffUi.customers;
  const user = useAuthStore((s) => s.user);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [openCreate, setOpenCreate] = useState(false);

  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["customers", page, q],
    queryFn: () => customersApi.list({ page, page_size: 20, q: q || undefined }),
    placeholderData: (prev) => prev,
  });

  const remove = useMutation({
    mutationFn: (id: number) => customersApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["customers"] }); toast.success(tt.archived); },
  });

  const columns: Column<Customer>[] = [
    {
      key: "name",
      header: tt.colCustomer,
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-full bg-grad-brand grid place-items-center text-white text-[12px] font-semibold">
            {c.full_name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
          </div>
          <div>
            <div className="font-medium">{c.full_name}</div>
            <div className="text-[11.5px] text-text-3">{c.email ?? t.common.none}</div>
          </div>
        </div>
      ),
    },
    { key: "code", header: tt.colCode, render: (c) => <span className="font-mono text-[12px]">{c.code}</span> },
    { key: "phone", header: tt.colPhone, render: (c) => c.phone ?? t.common.none },
    { key: "city", header: tt.colLocation, render: (c) => [c.city, c.country].filter(Boolean).join(", ") || t.common.none },
    { key: "tags", header: tt.colTags, render: (c) => c.tags ? <Badge variant="brand">{c.tags}</Badge> : t.common.none },
    {
      key: "actions", header: "", align: "right",
      render: (c) => canDeleteCrm(user) ? (
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); remove.mutate(c.id); }}>
          <Trash2 className="size-3.5" />
        </Button>
      ) : null,
    },
  ];

  return (
    <div className="page-shell">
      <PageHeader
        title={tt.title}
        description={tt.description}
        actions={
          canCreateCrm(user) ? (
            <Button icon={<Plus className="size-4" />} onClick={() => setOpenCreate(true)} className="w-full sm:w-auto">
              {tt.newBtn}
            </Button>
          ) : null
        }
      />

      <PageToolbar>
        <Input
          iconLeft={<Search className="size-4" />}
          placeholder={tt.searchPh}
          value={q}
          onChange={(e) => { setPage(1); setQ(e.target.value); }}
          className={TOOLBAR_INPUT}
        />
      </PageToolbar>

      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        loading={isLoading}
        rowKey={(r) => r.id}
        empty={<EmptyState icon={<Users className="size-7" />} title={tt.emptyTitle} description={tt.emptyDesc} />}
      />

      {data && data.total > 20 ? (
        <div className="mt-4 flex flex-col gap-2 text-[12.5px] text-text-2 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {tt.showing
              .replace("{p}", String(page))
              .replace("{n}", String(Math.max(1, Math.ceil(data.total / 20))))
              .replace("{t}", String(data.total))}
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>{t.staffUi.common.previous}</Button>
            <Button variant="secondary" size="sm" disabled={page * 20 >= data.total} onClick={() => setPage((p) => p + 1)}>{t.staffUi.common.next}</Button>
          </div>
        </div>
      ) : null}

      <CreateCustomerModal open={openCreate} onClose={() => setOpenCreate(false)} />
    </div>
  );
}

function CreateCustomerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useT();
  const tt = t.staffUi.customers;
  const qc = useQueryClient();
  const [form, setForm] = useState<Partial<Customer>>({ full_name: "" });

  const create = useMutation({
    mutationFn: () => customersApi.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success(tt.saved);
      onClose();
      setForm({ full_name: "" });
    },
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={tt.newTitle}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{t.staffUi.common.cancel}</Button>
          <Button loading={create.isPending} onClick={() => create.mutate()}>{t.staffUi.common.save}</Button>
        </>
      }
    >
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Input label={tt.fullName} required value={form.full_name ?? ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        <Input label={tt.email} type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input label={tt.phone} value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input label={tt.jobTitle} value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Input label={tt.city} value={form.city ?? ""} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        <Input label={tt.country} value={form.country ?? ""} onChange={(e) => setForm({ ...form, country: e.target.value })} />
        <Input label={tt.tags} value={form.tags ?? ""} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
        <Input label={tt.notes} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>
    </Modal>
  );
}
