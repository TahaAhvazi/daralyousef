import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Eye, ListChecks, Plus, Search, Columns3 } from "lucide-react";

import { ordersApi } from "@/api/modules";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Column, DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Select } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageTip } from "@/components/ui/PageTip";
import { PageToolbar, TOOLBAR_INPUT, TOOLBAR_SELECT } from "@/components/ui/PageToolbar";
import { Pagination } from "@/components/ui/Pagination";
import { formatDate, formatMoney } from "@/lib/format";
import { canOpenOrderDetail } from "@/lib/permissions";
import { useAuthStore } from "@/store/auth";
import { useT } from "@/i18n/useT";
import type { Order } from "@/types/api";

import { orderBoardColumn } from "@/lib/workflow";
import { ORDER_LIST_FILTER_STATUSES } from "@/lib/orderStatuses";

export default function OrdersPage() {
  const { t } = useT();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const canOpenDetail = canOpenOrderDetail(user);
  const tt = t.staffUi.orders;
  const common = t.staffUi.common;
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["orders", page, q, status],
    queryFn: () => ordersApi.list({ page, page_size: 20, q: q || undefined, status: status || undefined }),
    placeholderData: (p) => p,
  });

  const columnLabels = t.staffUi.orderBoard.columns as Record<string, string>;
  const tPriority = (p: string) => t.staffUi.priorities[p as keyof typeof t.staffUi.priorities] ?? p;
  const tChannel = (c: string) => t.staffUi.placedVia[c] ?? c;

  const columns: Column<Order>[] = [
    { key: "code", header: tt.colCode, render: (o) => (
      <span className={`font-mono text-[12px] font-semibold ${canOpenDetail ? "text-brand" : "text-text-2"}`}>{o.code}</span>
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
    { key: "priority", header: tt.colPriority, hideOnMobile: true, render: (o) => tPriority(o.priority) },
    { key: "deadline", header: tt.colDeadline, hideOnMobile: true, render: (o) => formatDate(o.deadline) },
    { key: "total", header: tt.colTotal, align: "right", render: (o) => formatMoney(o.grand_total, o.currency) },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (o) => canOpenDetail ? (
        <Button
          variant="secondary"
          size="sm"
          icon={<Eye className="size-3.5" />}
          onClick={(e) => { e.stopPropagation(); navigate(`/app/orders/${o.id}`); }}
        >
          {common.open}
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
          <>
            <Link to="/app/orders/board" className="btn btn-secondary w-full sm:w-auto min-h-11">
              <Columns3 className="size-4" /> {t.staffUi.nav.orderBoard}
            </Link>
            <Link to="/app/orders/new" className="btn btn-primary w-full sm:w-auto min-h-11">
              <Plus className="size-4" /> {tt.newBtn}
            </Link>
          </>
        }
      />

      <PageTip storageKey="orders-list">
        {canOpenDetail ? common.clickRowToOpen : tt.description}
      </PageTip>

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
        empty={
          <EmptyState
            icon={<ListChecks className="size-7" />}
            title={tt.emptyTitle}
            description={tt.emptyDesc}
            action={
              <Link to="/app/orders/new">
                <Button icon={<Plus className="size-4" />}>{tt.newBtn}</Button>
              </Link>
            }
          />
        }
      />

      {data ? (
        <Pagination
          className="mt-4"
          page={page}
          pageSize={20}
          total={data.total}
          onPageChange={setPage}
        />
      ) : null}
    </div>
  );
}
