import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCard } from "lucide-react";
import toast from "react-hot-toast";

import { salesApi } from "@/api/modules";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Column, DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDate, formatMoney } from "@/lib/format";
import { useT } from "@/i18n/useT";

export default function PosSessionsPage() {
  const { t } = useT();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["pos-sessions"],
    queryFn: () => salesApi.posSessions({ page: 1, page_size: 50 }),
  });

  const close = useMutation({
    mutationFn: (id: number) => salesApi.closePosSession(id, { closing_cash: 0 }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pos-sessions"] });
      toast.success("Session closed");
    },
  });

  const cols: Column<any>[] = [
    { key: "code", header: "Code", render: (r) => <span className="font-mono text-[12px]">{r.code}</span> },
    { key: "opened", header: "Opened", render: (r) => formatDate(r.opened_at) },
    { key: "float", header: "Opening float", render: (r) => formatMoney(r.opening_float, "IQD") },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge variant={r.status === "open" ? "success" : "default"}>{r.status}</Badge>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) =>
        r.status === "open" ? (
          <Button size="sm" variant="secondary" loading={close.isPending} onClick={() => close.mutate(r.id)}>
            Close
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="page-shell">
      <PageHeader title={t.staffUi.nav.posSessions} />
      <DataTable
        columns={cols}
        rows={data?.items ?? []}
        loading={isLoading}
        rowKey={(r) => r.id}
        empty={<EmptyState icon={<CreditCard className="size-7" />} title={t.staffUi.common.noResults} />}
      />
    </div>
  );
}
