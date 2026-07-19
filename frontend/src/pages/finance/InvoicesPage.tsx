import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Clock3,
  MoreHorizontal,
  Plus,
  Receipt,
  Search,
  Settings2,
  UserRound,
} from "lucide-react";

import { financeApi } from "@/api/modules";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { CustomerSearchSelect } from "@/components/ui/CustomerSearchSelect";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Select } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { Tabs } from "@/components/ui/Tabs";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { hasAnyPermission } from "@/lib/permissions";
import { useAuthStore } from "@/store/auth";
import { useT } from "@/i18n/useT";
import type { Invoice } from "@/types/api";

type Bucket = "results" | "all" | "late" | "due" | "unpaid" | "draft" | "overpaid";
type SortKey = "newest" | "oldest" | "amount_desc" | "amount_asc" | "due_asc";

const PAGE_SIZE = 20;

function displayStatus(inv: Invoice): string {
  if (inv.paid_total > inv.grand_total + 0.01) return "overpaid";
  const today = new Date().toISOString().slice(0, 10);
  if (inv.balance > 0 && inv.due_date && inv.due_date < today) return "late";
  return inv.status;
}

function statusVariant(status: string): "success" | "warning" | "danger" | "brand" | "default" {
  if (status === "paid") return "success";
  if (status === "partial" || status === "due") return "warning";
  if (status === "unpaid" || status === "late" || status === "overdue") return "danger";
  if (status === "overpaid") return "brand";
  return "default";
}

function publicNotes(notes?: string | null): string {
  if (!notes) return "";
  return notes
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => {
      if (!l) return false;
      const lower = l.toLowerCase();
      return !(
        lower.startsWith("salesperson:") ||
        lower.startsWith("مسؤول المبيعات") ||
        lower.startsWith("warehouse:") ||
        lower.startsWith("المستودع") ||
        lower.startsWith("invoice template:") ||
        lower.startsWith("قالب") ||
        lower.startsWith("invoice date:") ||
        lower.startsWith("تاريخ الفاتورة") ||
        lower.startsWith("invoice discount:") ||
        lower.startsWith("خصم") ||
        lower.startsWith("settlement:") ||
        lower.startsWith("التسوية") ||
        lower.startsWith("advance") ||
        lower.startsWith("الدفعة") ||
        lower.startsWith("deposit") ||
        lower.startsWith("إيداع") ||
        lower.startsWith("amount:")
      );
    })
    .join(" · ");
}

export default function InvoicesPage() {
  const { t } = useT();
  const tt = t.staffUi.invoices;
  const list = tt.list;
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const base = location.pathname.startsWith("/portal") ? "/portal/invoices" : "/app/invoices";
  const isPortal = location.pathname.startsWith("/portal");
  const canCreate = !isPortal && hasAnyPermission(user, "finance:create");

  const [page, setPage] = useState(1);
  const [customerId, setCustomerId] = useState("");
  const [codeQ, setCodeQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [appliedCustomerId, setAppliedCustomerId] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  const [appliedStatus, setAppliedStatus] = useState("");
  const [bucket, setBucket] = useState<Bucket>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  useEffect(() => {
    if (openMenuId == null) return;
    const onDoc = () => setOpenMenuId(null);
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [openMenuId]);

  const queryQ = appliedCode.trim() || undefined;
  const queryCustomer = appliedCustomerId ? Number(appliedCustomerId) : undefined;
  const queryStatus = appliedStatus || undefined;
  const queryBucket = bucket === "results" ? "all" : bucket;

  const { data, isLoading } = useQuery({
    queryKey: ["invoices", page, queryQ, queryStatus, queryCustomer, queryBucket, sort],
    queryFn: () =>
      financeApi.invoices({
        page,
        page_size: PAGE_SIZE,
        q: queryQ,
        status: queryStatus,
        customer_id: queryCustomer,
        bucket: queryBucket,
        sort,
      }),
    placeholderData: (p) => p,
  });

  const items = data?.items ?? [];

  const applySearch = () => {
    setPage(1);
    setAppliedCustomerId(customerId);
    setAppliedCode(codeQ);
    setAppliedStatus(statusFilter);
    setBucket("results");
  };

  const clearFilters = () => {
    setCustomerId("");
    setCodeQ("");
    setStatusFilter("");
    setAppliedCustomerId("");
    setAppliedCode("");
    setAppliedStatus("");
    setBucket("all");
    setPage(1);
  };

  const bucketTabs = useMemo(
    () => [
      { id: "results", label: list.tabResults },
      { id: "all", label: list.tabAll },
      { id: "late", label: list.tabLate },
      { id: "due", label: list.tabDue },
      { id: "unpaid", label: list.tabUnpaid },
      { id: "draft", label: list.tabDraft },
      { id: "overpaid", label: list.tabOverpaid },
    ],
    [list],
  );

  const activityLabel = (inv: Invoice) => {
    if (inv.last_activity === "payment_added") return list.activityPayment;
    return list.activityCreated;
  };

  const statusLabel = (status: string) => {
    const map = list.statuses as Record<string, string>;
    return map[status] ?? (t.portalUi.statuses as Record<string, string>)[status] ?? status;
  };

  return (
    <div className="page-shell space-y-4">
      <PageHeader
        title={tt.title}
        description={tt.description}
        actions={
          !isPortal ? (
            <div className="flex flex-wrap items-center gap-2">
              <Link to="/app/reports/sales" className="btn btn-secondary min-h-10">
                <BarChart3 className="size-4" />
                {list.reports}
              </Link>
              <Link to="/app/sales-settings" className="btn btn-secondary min-h-10">
                <Settings2 className="size-4" />
                {list.settings}
              </Link>
              {canCreate ? (
                <Link to="/app/invoices/new" className="btn btn-primary min-h-10">
                  <Plus className="size-4" />
                  {list.newInvoice}
                </Link>
              ) : null}
            </div>
          ) : null
        }
      />

      {/* Search panel */}
      {!isPortal ? (
        <Card>
          <CardBody className="space-y-3">
            <div className="text-[13px] font-semibold">{list.searchTitle}</div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="min-w-0">
                <div className="mb-1.5 text-[12.5px] font-medium text-text-2">{list.filterCustomer}</div>
                <CustomerSearchSelect
                  value={customerId}
                  onChange={setCustomerId}
                  placeholder={list.searchCustomerPh}
                />
              </div>
              <Input
                label={list.filterCode}
                hint={list.searchInvoiceHint}
                value={codeQ}
                onChange={(e) => setCodeQ(e.target.value)}
                placeholder={list.searchInvoicePh}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applySearch();
                }}
              />
              <Select
                label={list.filterStatus}
                options={[
                  { value: "", label: list.anyStatus },
                  { value: "unpaid", label: list.statuses.unpaid },
                  { value: "partial", label: list.statuses.partial },
                  { value: "paid", label: list.statuses.paid },
                  { value: "draft", label: list.statuses.draft },
                ]}
                value={statusFilter}
                onChange={(e) => setStatusFilter((e.target as HTMLSelectElement).value)}
              />
              <div className="flex items-end gap-2">
                <Button className="min-h-10 flex-1" icon={<Search className="size-4" />} onClick={applySearch}>
                  {list.searchBtn}
                </Button>
                <Button variant="secondary" className="min-h-10" onClick={clearFilters}>
                  {list.clearFilters}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      ) : null}

      {/* Tabs + sort */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          value={bucket}
          onChange={(id) => {
            setBucket(id as Bucket);
            setPage(1);
          }}
          items={bucketTabs}
          className="w-full lg:w-auto"
        />
        <Select
          options={[
            { value: "newest", label: list.sortNewest },
            { value: "oldest", label: list.sortOldest },
            { value: "amount_desc", label: list.sortAmountDesc },
            { value: "amount_asc", label: list.sortAmountAsc },
            { value: "due_asc", label: list.sortDue },
          ]}
          value={sort}
          onChange={(e) => {
            setSort((e.target as HTMLSelectElement).value as SortKey);
            setPage(1);
          }}
          className="w-full sm:w-56"
        />
      </div>

      {/* Rows */}
      <Card>
            {isLoading && !data ? (
          <CardBody className="py-10 text-center text-[13px] text-text-3">{tt.loading}</CardBody>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Receipt className="size-7" />}
            title={tt.emptyTitle}
            description={tt.emptyDesc}
            action={
              canCreate ? (
                <Link to="/app/invoices/new">
                  <Button icon={<Plus className="size-4" />}>{list.newInvoice}</Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <ul className="divide-y divide-border/70">
            {items.map((inv) => {
              const st = displayStatus(inv);
              const note = publicNotes(inv.notes);
              return (
                <li
                  key={inv.id}
                  className="relative grid cursor-pointer gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2/40 sm:px-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto_auto] lg:items-center"
                  onClick={() => navigate(`${base}/${inv.id}`)}
                >
                  {/* Main details */}
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12.5px] text-text-3">
                      <span className="tabular-nums">{formatDate(inv.issue_date)}</span>
                      <span aria-hidden>·</span>
                      <span className="font-mono font-semibold text-brand">{inv.code}</span>
                    </div>
                    <div className="truncate text-[14.5px] font-semibold text-text">
                      {inv.customer_name || `#${inv.customer_id}`}
                    </div>
                    {note ? <div className="line-clamp-1 text-[12.5px] text-text-3">{note}</div> : null}
                    <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-text-3">
                      <UserRound className="size-3.5 shrink-0" />
                      <span>
                        {list.soldBy}{" "}
                        <span className="font-medium text-text-2">{inv.sold_by || "—"}</span>
                      </span>
                    </div>
                  </div>

                  {/* Activity */}
                  <div className="min-w-0 space-y-1 text-[12.5px] text-text-2">
                    <div className="font-medium text-text">{activityLabel(inv)}</div>
                    <div className="flex items-center gap-1.5 text-text-3">
                      <Clock3 className="size-3.5 shrink-0" />
                      <span className="tabular-nums">{formatDateTime(inv.created_at)}</span>
                    </div>
                    {inv.order_code ? (
                      <div className="text-[12px] text-text-3">
                        {list.linkedOrder}: {inv.order_code}
                      </div>
                    ) : null}
                  </div>

                  {/* Amount + status */}
                  <div className="flex flex-col items-start gap-1.5 lg:items-end">
                    <div className="text-[15px] font-semibold tabular-nums text-text">
                      {formatMoney(inv.grand_total, inv.currency)}
                    </div>
                    <Badge variant={statusVariant(st)}>{statusLabel(st)}</Badge>
                    {inv.balance > 0 && st !== "unpaid" ? (
                      <div className="text-[11.5px] tabular-nums text-danger">
                        {list.balance}: {formatMoney(inv.balance, inv.currency)}
                      </div>
                    ) : null}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                    <div className="relative">
                      <button
                        type="button"
                        className="grid size-9 place-items-center rounded-lg border border-border text-text-2 hover:bg-surface-2"
                        aria-label={list.actions}
                        onClick={() => setOpenMenuId((id) => (id === inv.id ? null : inv.id))}
                      >
                        <MoreHorizontal className="size-4" />
                      </button>
                      {openMenuId === inv.id ? (
                        <div className="absolute end-0 z-20 mt-1 min-w-[160px] overflow-hidden rounded-xl border border-border bg-surface shadow-soft">
                          <button
                            type="button"
                            className="block w-full px-3 py-2 text-start text-[13px] hover:bg-surface-2"
                            onClick={() => navigate(`${base}/${inv.id}`)}
                          >
                            {list.open}
                          </button>
                          {!isPortal && canCreate ? (
                            <Link
                              to="/app/payments"
                              className="block w-full px-3 py-2 text-start text-[13px] hover:bg-surface-2"
                              onClick={() => setOpenMenuId(null)}
                            >
                              {list.recordPayment}
                            </Link>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {data ? (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={data.total}
          onPageChange={setPage}
        />
      ) : null}
    </div>
  );
}
