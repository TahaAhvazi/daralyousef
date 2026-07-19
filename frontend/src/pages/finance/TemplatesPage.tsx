import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileStack, Plus } from "lucide-react";
import toast from "react-hot-toast";

import { salesApi } from "@/api/modules";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Column, DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { useT } from "@/i18n/useT";

export default function TemplatesPage() {
  const { t } = useT();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [docType, setDocType] = useState("invoice");
  const [header, setHeader] = useState("");
  const [footer, setFooter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["doc-templates"],
    queryFn: () => salesApi.templates({ page: 1, page_size: 50 }),
  });

  const create = useMutation({
    mutationFn: () =>
      salesApi.createTemplate({
        name,
        doc_type: docType,
        header_html: header || undefined,
        footer_html: footer || undefined,
        is_default: true,
        locale: "en",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doc-templates"] });
      toast.success(t.staffUi.common.create);
      setOpen(false);
    },
  });

  const cols: Column<any>[] = [
    { key: "code", header: "Code", render: (r) => <span className="font-mono text-[12px]">{r.code}</span> },
    { key: "name", header: "Name", render: (r) => r.name },
    { key: "type", header: "Type", render: (r) => r.doc_type },
    {
      key: "default",
      header: "Default",
      render: (r) => (r.is_default ? <Badge variant="success">Default</Badge> : "—"),
    },
  ];

  return (
    <div className="page-shell">
      <PageHeader
        title={t.staffUi.nav.docTemplates}
        actions={<Button icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>{t.staffUi.common.create}</Button>}
      />
      <DataTable
        columns={cols}
        rows={data?.items ?? []}
        loading={isLoading}
        rowKey={(r) => r.id}
        empty={<EmptyState icon={<FileStack className="size-7" />} title={t.staffUi.common.noResults} />}
      />
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t.staffUi.nav.docTemplates}
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
          <select className="input w-full" value={docType} onChange={(e) => setDocType(e.target.value)}>
            <option value="invoice">Invoice</option>
            <option value="quotation">Quotation</option>
            <option value="credit_note">Credit note</option>
          </select>
          <Input label="Header text" value={header} onChange={(e) => setHeader(e.target.value)} />
          <Input label="Footer text" value={footer} onChange={(e) => setFooter(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
}
