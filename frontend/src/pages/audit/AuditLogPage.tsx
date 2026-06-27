import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";

import { auditApi } from "@/api/modules";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Column, DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Select } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageToolbar, TOOLBAR_SELECT_SM } from "@/components/ui/PageToolbar";
import { formatDateTime } from "@/lib/format";
import { useT } from "@/i18n/useT";
import type { AuditLog } from "@/types/api";

type ModuleKey = "auth" | "users" | "crm" | "orders" | "finance" | "inventory" | "catalog" | "support" | "files";
const MODULES: ("" | ModuleKey)[] = ["", "auth", "users", "crm", "orders", "finance", "inventory", "catalog", "support", "files"];

export default function AuditLogPage() {
  const { t } = useT();
  const tt = t.staffUi.audit;
  const [module, setModule] = useState("");
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["audit", page, module, action],
    queryFn: () => auditApi.list({ page, page_size: 30,
                                    module: module || undefined,
                                    action: action || undefined }),
  });

  const moduleLabel = (m: string) =>
    m ? (tt.modules[m as ModuleKey] ?? m) : tt.allModules;

  const cols: Column<AuditLog>[] = [
    { key: "when", header: tt.colWhen, render: (a) => formatDateTime(a.occurred_at) },
    { key: "user", header: tt.colActor, render: (a) => (
      <div>
        <div className="font-medium">{a.user_email ?? t.common.none}</div>
        <div className="text-[11px] text-text-3">{a.department ?? t.common.none}</div>
      </div>
    ) },
    { key: "action", header: tt.colAction, render: (a) => <Badge variant="accent">{a.action}</Badge> },
    { key: "module", header: tt.colModule, render: (a) => <Badge variant="brand">{moduleLabel(a.module)}</Badge> },
    { key: "entity", header: tt.colEntity,
      render: (a) => a.entity_type ? `${a.entity_type}#${a.entity_id}` : t.common.none },
    { key: "ip", header: tt.colIp, render: (a) => <span className="font-mono text-[12px]">{a.ip_address ?? t.common.none}</span> },
  ];

  return (
    <div className="page-shell">
      <PageHeader title={tt.title} description={tt.description} />

      <PageToolbar>
        <Select
          className={TOOLBAR_SELECT_SM}
          value={module}
          options={MODULES.map((m) => ({ value: m, label: moduleLabel(m) }))}
          onChange={(e) => { setPage(1); setModule((e.target as HTMLSelectElement).value); }}
        />
        <Input
          className={TOOLBAR_SELECT_SM}
          placeholder={tt.actionPh}
          value={action}
          onChange={(e) => { setPage(1); setAction(e.target.value); }}
        />
      </PageToolbar>

      <DataTable columns={cols} rows={data?.items ?? []} loading={isLoading} rowKey={(r) => r.id}
        empty={<EmptyState icon={<ShieldCheck className="size-7" />} title={tt.emptyTitle} />} />

      {data && data.total > 30 ? (
        <div className="mt-4 flex flex-col gap-2 text-[12.5px] text-text-2 sm:flex-row sm:items-center sm:justify-between">
          <span>{tt.summary
            .replace("{p}", String(page))
            .replace("{n}", String(Math.ceil(data.total / 30)))
            .replace("{t}", String(data.total))}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>{t.staffUi.common.previous}</Button>
            <Button size="sm" variant="secondary" disabled={page * 30 >= data.total} onClick={() => setPage((p) => p + 1)}>{t.staffUi.common.next}</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
