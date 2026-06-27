import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Package, Plus } from "lucide-react";

import { ordersApi } from "@/api/modules";
import { StatusBadge } from "@/components/ui/Badge";
import { Column, DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDate, formatMoney } from "@/lib/format";
import type { Order } from "@/types/api";
import { useT } from "@/i18n/useT";

export default function PortalOrders() {
  const { t } = useT();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["portal.orders.all"], queryFn: () => ordersApi.list({ page_size: 100 }),
  });

  const cols: Column<Order>[] = [
    { key: "code", header: t.portalUi.orders.colOrder, render: (o) => (
      <div>
        <div className="font-medium">{o.title ?? o.code}</div>
        <div className="text-[11.5px] text-text-3 font-mono">{o.code}</div>
      </div>
    ) },
    { key: "status", header: t.portalUi.orders.colStatus, render: (o) => <StatusBadge status={o.status} /> },
    { key: "deadline", header: t.portalUi.orders.colDeadline, render: (o) => formatDate(o.deadline) },
    { key: "total", header: t.portalUi.orders.colTotal, align: "right", render: (o) => (
      <span className="tabular-nums">{formatMoney(o.grand_total, o.currency)}</span>
    ) },
  ];

  return (
    <div className="page-shell">
      <PageHeader
        title={t.portalUi.orders.title}
        description={t.portalUi.orders.description}
        actions={
          <Link to="/portal/orders/new" className="btn btn-primary w-full sm:w-auto">
            <Plus className="size-4" /> {t.portalUi.orders.startOrder}
          </Link>
        }
      />
      <DataTable
        columns={cols}
        rows={data?.items ?? []}
        loading={isLoading}
        rowKey={(r) => r.id}
        onRowClick={(row) => navigate(`/portal/orders/${row.id}`)}
        empty={<EmptyState icon={<Package className="size-7" />} title={t.portalUi.orders.emptyTitle} description={t.portalUi.orders.emptyDesc} />}
      />
    </div>
  );
}
