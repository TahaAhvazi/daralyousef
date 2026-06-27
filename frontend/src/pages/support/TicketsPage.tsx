import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { LifeBuoy, Plus } from "lucide-react";
import toast from "react-hot-toast";

import { ticketsApi, filesApi } from "@/api/modules";
import { FileUploadPanel, uploadFiles } from "@/components/files/FileUploadPanel";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Column, DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDateTime } from "@/lib/format";
import { useT } from "@/i18n/useT";
import type { Ticket } from "@/types/api";

export default function TicketsPage() {
  const { t } = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const base = location.pathname.startsWith("/portal") ? "/portal/tickets" : "/app/tickets";
  const tt = t.staffUi.tickets;
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["tickets"],
    queryFn: () => ticketsApi.list({ page: 1, page_size: 50 }),
  });

  const priorityLabel = (p: string) =>
    t.staffUi.priorities[p as keyof typeof t.staffUi.priorities] ?? p;

  const cols: Column<Ticket>[] = [
    { key: "code", header: tt.colCode, render: (t) => <span className="font-mono text-[12px]">{t.code}</span> },
    { key: "subject", header: tt.colSubject, render: (tk) => (
      <div>
        <div className="font-medium">{tk.subject}</div>
        <div className="text-[11.5px] text-text-3">
          {tk.category ?? tt.defaultCategory}
          {tk.assignee_name ? ` · ${tk.assignee_name}` : ""}
        </div>
      </div>
    ) },
    { key: "priority", header: tt.colPriority, render: (tk) => priorityLabel(tk.priority) },
    { key: "status", header: tt.colStatus, render: (tk) => <StatusBadge status={tk.status} /> },
    { key: "created", header: tt.colCreated, render: (tk) => formatDateTime(tk.created_at) },
  ];

  return (
    <div className="page-shell">
      <PageHeader title={tt.title} description={tt.description}
                  actions={<Button icon={<Plus className="size-4" />} onClick={() => setOpen(true)} className="w-full sm:w-auto">{tt.newBtn}</Button>} />
      <DataTable
        columns={cols}
        rows={data?.items ?? []}
        loading={isLoading}
        rowKey={(r) => r.id}
        onRowClick={(row) => navigate(`${base}/${row.id}`)}
        empty={<EmptyState icon={<LifeBuoy className="size-7" />} title={tt.emptyTitle} />}
      />
      <NewTicketModal open={open} onClose={() => setOpen(false)} base={base} />
    </div>
  );
}

function NewTicketModal({ open, onClose, base }: { open: boolean; onClose: () => void; base: string }) {
  const { t } = useT();
  const navigate = useNavigate();
  const tt = t.staffUi.tickets;
  const qc = useQueryClient();
  const [form, setForm] = useState<Partial<Ticket>>({ subject: "", body: "", priority: "normal" });
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const create = useMutation({
    mutationFn: async () => {
      const ticket = await ticketsApi.create(form);
      if (pendingFiles.length) {
        await uploadFiles("ticket", ticket.id, pendingFiles, filesApi.upload);
      }
      return ticket;
    },
    onSuccess: (ticket) => {
      qc.invalidateQueries({ queryKey: ["tickets"] });
      toast.success(tt.created); onClose();
      setForm({ subject: "", body: "", priority: "normal" });
      setPendingFiles([]);
      navigate(`${base}/${ticket.id}`);
    },
  });
  return (
    <Modal open={open} onClose={onClose} title={tt.newTitle}
      footer={<><Button variant="secondary" onClick={onClose}>{t.staffUi.common.cancel}</Button>
                <Button loading={create.isPending} onClick={() => create.mutate()}>{t.staffUi.common.send}</Button></>}>
      <div className="grid gap-3.5">
        <Input label={tt.subject} required value={form.subject ?? ""} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
        <Select label={tt.priority} value={form.priority ?? "normal"}
                options={(["low", "normal", "high", "urgent"] as const).map((p) => ({ value: p, label: tt.priorities[p] }))}
                onChange={(e) => setForm({ ...form, priority: (e.target as HTMLSelectElement).value })} />
        <Textarea label={tt.describeIssue} rows={5} value={form.body ?? ""}
                  onChange={(e) => setForm({ ...form, body: e.target.value })} />
        <FileUploadPanel
          compact
          pendingFiles={pendingFiles}
          onAddFiles={(files) => setPendingFiles((prev) => [...prev, ...files])}
          onRemovePending={(i) => setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))}
          label={t.staffUi.messages.attach}
          hint={t.staffUi.newOrder.uploadHint}
          disabled={create.isPending}
        />
      </div>
    </Modal>
  );
}
