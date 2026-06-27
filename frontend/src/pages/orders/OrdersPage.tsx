import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ListChecks, Plus, Search, Columns3 } from "lucide-react";

import { ordersApi } from "@/api/modules";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Column, DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Select } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageToolbar, TOOLBAR_INPUT, TOOLBAR_SELECT } from "@/components/ui/PageToolbar";
import { formatDate, formatMoney } from "@/lib/format";
import { canManageOrdersAdmin } from "@/lib/permissions";
import { useAuthStore } from "@/store/auth";
import { useT } from "@/i18n/useT";
import type { Order } from "@/types/api";

import { orderBoardColumn } from "@/lib/workflow";
import { ORDER_LIST_FILTER_STATUSES } from "@/lib/orderStatuses";

export default function OrdersPage() {
  const { t } = useT();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const canOpenDetail = canManageOrdersAdmin(user);
  const tt = t.staffUi.orders;
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["orders", page, q, status],
    queryFn: () => ordersApi.list({ page, page_size: 20, q: q || undefined, status: status || undefined }),
    placeholderData: (p) => p,
  });

  const columnLabels = t.staffUi.orderBoard.columns as Record<string, string>;
  const tStatus = (s: string) => columnLabels[s] ?? t.portalUi.statuses[s] ?? s;
  const tPriority = (p: string) => t.staffUi.priorities[p as keyof typeof t.staffUi.priorities] ?? p;
  const tChannel = (c: string) => t.staffUi.placedVia[c] ?? c;

  const columns: Column<Order>[] = [
    { key: "code", header: tt.colCode, render: (o) => (
      <span className={`font-mono text-[12px] ${canOpenDetail ? "text-brand" : "text-text-2"}`}>{o.code}</span>
    ) },
    { key: "title", header: tt.colTitle, render: (o) => (
      <div>
        <div className="font-medium">{o.title ?? t.common.none}</div>
        <div className="text-[11.5px] text-text-3">{tt.placedVia.replace("{ch}", tChannel(o.placed_via))}</div>
      </div>
    ) },
    { key: "status", header: tt.colStatus, render: (o) => {
      const col = orderBoardColumn(o);
      return <Badge variant="brand">{columnLabels[col] ?? col}</Badge>;
    } },
    { key: "priority", header: tt.colPriority, render: (o) => tPriority(o.priority) },
    { key: "deadline", header: tt.colDeadline, render: (o) => formatDate(o.deadline) },
    { key: "total", header: tt.colTotal, align: "right", render: (o) => formatMoney(o.grand_total, o.currency) },
  ];

  return (
    <div className="page-shell">
      <PageHeader
        title={tt.title}
        description={tt.description}
        actions={
          <>
            <Link to="/app/orders/board" className="btn btn-secondary w-full sm:w-auto">
              <Columns3 className="size-4" /> Board
            </Link>
            <Link to="/app/orders/new" className="btn btn-primary w-full sm:w-auto">
              <Plus className="size-4" /> {tt.newBtn}
            </Link>
          </>
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
        <Select
          options={[{ value: "", label: tt.allStatuses }, ...ORDER_LIST_FILTER_STATUSES.map((s) => ({ value: s, label: t.portalUi.statuses[s] ?? s }))]}
          value={status}
          onChange={(e) => { setPage(1); setStatus((e.target as HTMLSelectElement).value); }}
          className={TOOLBAR_SELECT}
        />
      </PageToolbar>

      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        loading={isLoading}
        rowKey={(r) => r.id}
        onRowClick={canOpenDetail ? (row) => navigate(`/app/orders/${row.id}`) : undefined}
        empty={<EmptyState icon={<ListChecks className="size-7" />} title={tt.emptyTitle} description={tt.emptyDesc} />}
      />

      {data && data.total > 20 ? (
        <div className="mt-4 flex flex-col gap-2 text-[12.5px] text-text-2 sm:flex-row sm:items-center sm:justify-between">
          <span>{t.staffUi.common.page} {page} {t.staffUi.common.of} {Math.ceil(data.total / 20)}</span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>{t.staffUi.common.previous}</Button>
            <Button variant="secondary" size="sm" disabled={page * 20 >= data.total} onClick={() => setPage((p) => p + 1)}>{t.staffUi.common.next}</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
