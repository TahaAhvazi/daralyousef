import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GitCommitVertical, Plus, Sparkles, UserPlus } from "lucide-react";
import toast from "react-hot-toast";

import { crmApi } from "@/api/modules";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Column, DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageToolbar, TOOLBAR_SELECT } from "@/components/ui/PageToolbar";
import { formatMoney } from "@/lib/format";
import { useT } from "@/i18n/useT";
import type { Lead } from "@/types/api";

const STAGES = ["new", "contacted", "qualified", "proposal", "won", "lost"];

export default function LeadsPage() {
  const { t } = useT();
  const tt = t.staffUi.leads;
  const [stage, setStage] = useState<string>("");
  const [page, setPage] = useState(1);
  const [openCreate, setOpenCreate] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["leads", page, stage],
    queryFn: () => crmApi.listLeads({ page, page_size: 20, stage: stage || undefined }),
  });

  const convert = useMutation({
    mutationFn: (id: number) => crmApi.convertLead(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["leads"] }); toast.success(tt.convertedToast); },
  });

  const stageLabel = (s: string) => t.portalUi.statuses[s] ?? s;

  const columns: Column<Lead>[] = [
    { key: "name", header: tt.colLead,
      render: (l) => (
        <div>
          <div className="font-medium">{l.full_name}</div>
          <div className="text-[11.5px] text-text-3">{l.company_name ?? l.email ?? t.common.none}</div>
        </div>
      ),
    },
    { key: "source", header: tt.colSource, render: (l) => l.source ?? t.common.none },
    { key: "stage", header: tt.colStage, render: (l) => <StatusBadge status={l.stage} /> },
    { key: "score", header: tt.colScore, render: (l) => <Badge variant="brand">{l.score}</Badge> },
    { key: "value", header: tt.colValue, align: "right", render: (l) => formatMoney(l.estimated_value) },
    { key: "actions", header: "", align: "right",
      render: (l) => (
        <Button
          size="sm"
          variant="secondary"
          icon={<UserPlus className="size-3.5" />}
          disabled={!!l.converted_customer_id}
          onClick={(e) => { e.stopPropagation(); convert.mutate(l.id); }}
        >
          {l.converted_customer_id ? tt.converted : tt.convert}
        </Button>
      ),
    },
  ];

  return (
    <div className="page-shell">
      <PageHeader
        title={tt.title}
        description={tt.description}
        actions={
          <Button icon={<Plus className="size-4" />} onClick={() => setOpenCreate(true)} className="w-full sm:w-auto">
            {tt.newBtn}
          </Button>
        }
      />

      <PageToolbar>
        <Select
          options={[{ value: "", label: tt.allStages }, ...STAGES.map((s) => ({ value: s, label: stageLabel(s) }))]}
          value={stage}
          onChange={(e) => { setPage(1); setStage((e.target as HTMLSelectElement).value); }}
          className={TOOLBAR_SELECT}
        />
      </PageToolbar>

      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        loading={isLoading}
        rowKey={(r) => r.id}
        empty={<EmptyState icon={<Sparkles className="size-7" />} title={tt.emptyTitle} description={tt.emptyDesc} />}
      />

      <CreateLeadModal open={openCreate} onClose={() => setOpenCreate(false)} />

      <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {STAGES.map((s) => {
          const count = (data?.items ?? []).filter((l) => l.stage === s).length;
          return (
            <div key={s} className="card p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] uppercase tracking-wider text-text-3 font-semibold">{stageLabel(s)}</span>
                <GitCommitVertical className="size-3.5 text-text-3" />
              </div>
              <div className="mt-1 text-2xl font-semibold">{count}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CreateLeadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useT();
  const tt = t.staffUi.leads;
  const qc = useQueryClient();
  const stageLabel = (s: string) => t.portalUi.statuses[s] ?? s;
  const [form, setForm] = useState<Partial<Lead>>({
    full_name: "", stage: "new", score: 50, estimated_value: 0,
  });
  const create = useMutation({
    mutationFn: () => crmApi.createLead(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast.success(tt.created); onClose();
      setForm({ full_name: "", stage: "new", score: 50, estimated_value: 0 });
    },
  });

  return (
    <Modal
      open={open} onClose={onClose} title={tt.newTitle}
      footer={<>
        <Button variant="secondary" onClick={onClose}>{t.staffUi.common.cancel}</Button>
        <Button loading={create.isPending} onClick={() => create.mutate()}>{t.staffUi.common.save}</Button>
      </>}
    >
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Input label={tt.fullName} required value={form.full_name ?? ""} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        <Input label={tt.company} value={form.company_name ?? ""} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
        <Input label={tt.email} type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input label={tt.phone} value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input label={tt.source} value={form.source ?? ""} onChange={(e) => setForm({ ...form, source: e.target.value })} />
        <Select
          label={tt.stage} value={form.stage ?? "new"}
          options={STAGES.map((s) => ({ value: s, label: stageLabel(s) }))}
          onChange={(e) => setForm({ ...form, stage: (e.target as HTMLSelectElement).value })}
        />
        <Input label={tt.score} type="number" value={form.score ?? 0} onChange={(e) => setForm({ ...form, score: Number(e.target.value) })} />
        <Input label={tt.estValue} type="number" value={form.estimated_value ?? 0}
               onChange={(e) => setForm({ ...form, estimated_value: Number(e.target.value) })} />
      </div>
    </Modal>
  );
}
