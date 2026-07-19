import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Store } from "lucide-react";
import toast from "react-hot-toast";

import { salesApi } from "@/api/modules";
import { Button } from "@/components/ui/Button";
import { Column, DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useT } from "@/i18n/useT";

export default function VendorsPage() {
  const { t } = useT();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["vendors"],
    queryFn: () => salesApi.vendors({ page: 1, page_size: 50 }),
  });

  const create = useMutation({
    mutationFn: () => salesApi.createVendor({ name, phone: phone || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendors"] });
      toast.success(t.staffUi.common.create);
      setOpen(false);
      setName("");
    },
  });

  const cols: Column<any>[] = [
    { key: "code", header: "Code", render: (r) => <span className="font-mono text-[12px]">{r.code}</span> },
    { key: "name", header: "Name", render: (r) => r.name },
    { key: "phone", header: "Phone", render: (r) => r.phone || "—" },
    { key: "email", header: "Email", render: (r) => r.email || "—" },
  ];

  return (
    <div className="page-shell">
      <PageHeader
        title={t.staffUi.nav.vendors}
        actions={<Button icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>{t.staffUi.common.create}</Button>}
      />
      <DataTable
        columns={cols}
        rows={data?.items ?? []}
        loading={isLoading}
        rowKey={(r) => r.id}
        empty={<EmptyState icon={<Store className="size-7" />} title={t.staffUi.common.noResults} />}
      />
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t.staffUi.nav.vendors}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>{t.staffUi.common.cancel}</Button>
            <Button loading={create.isPending} disabled={!name.trim()} onClick={() => create.mutate()}>
              {t.staffUi.common.create}
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
}
