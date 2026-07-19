import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Briefcase,
  CalendarRange,
  CheckCircle2,
  ClipboardList,
  FileWarning,
  Plus,
  Users,
  Wallet,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import { hrApi } from "@/api/modules";
import { StaffUserFormModal } from "@/components/users/StaffUserFormModal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useT } from "@/i18n/useT";
import { staffBreadcrumbs } from "@/lib/breadcrumbs";
import { formatDate, formatNumber } from "@/lib/format";
import { canCreateUsers } from "@/lib/permissions";
import { useAuthStore } from "@/store/auth";
import { useThemeStore } from "@/store/theme";

const CONTRACT_DOT: Record<string, string> = {
  active: "bg-success",
  expired: "bg-accent",
  under_review: "bg-text-3",
  replacement: "bg-info",
  cancelled: "bg-danger",
  suspended: "bg-warning",
  draft: "bg-surface-3",
};

const ATTENDANCE_COLOR: Record<string, string> = {
  present: "rgb(var(--success))",
  absent: "rgb(var(--danger))",
  late: "rgb(var(--warning))",
  on_leave: "rgb(var(--info))",
};

export default function HrPage() {
  const { t, locale } = useT();
  const location = useLocation();
  const navigate = useNavigate();
  const me = useAuthStore((s) => s.user);
  const theme = useThemeStore((s) => s.theme);
  const hr = t.staffUi.hr;
  const [days, setDays] = useState(30);
  const [currency, setCurrency] = useState("IQD");
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["hr.summary", currency, days],
    queryFn: () => hrApi.summary({ currency, days }),
    refetchInterval: 30000,
  });

  const breadcrumbs = staffBreadcrumbs(location.pathname, t.staffUi.nav);
  const periodLabel = useMemo(() => {
    if (!data) return "";
    return `${formatDate(data.payroll.period_start, locale === "ar" ? "DD/MM/YYYY" : "MMM D")} – ${formatDate(data.payroll.period_end, locale === "ar" ? "DD/MM/YYYY" : "MMM D, YYYY")}`;
  }, [data, locale]);

  if (isLoading || !data) {
    return (
      <div className="page-shell space-y-4">
        <Skeleton className="h-10 w-56" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      </div>
    );
  }

  const contractLabel = (status: string) =>
    hr.contractStatuses[status as keyof typeof hr.contractStatuses] ?? status;
  const attendanceLabel = (status: string) =>
    hr.attendanceStatuses[status as keyof typeof hr.attendanceStatuses] ?? status;
  const requestTypeLabel = (type: string) =>
    hr.requestTypes[type as keyof typeof hr.requestTypes] ?? type;

  const wf = data.workforce ?? {
    employees_total: 0,
    employees_active: 0,
    employees_inactive: 0,
    synced_from_daftra: 0,
    with_department: 0,
    with_title: 0,
    with_contract: 0,
    by_department: [],
    by_title: [],
  };

  return (
    <div className="page-shell space-y-5">
      <PageHeader
        title={hr.title}
        description={hr.description}
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/app/hr/payroll-report" className="btn btn-secondary min-h-10">
              <Wallet className="size-4" />
              {hr.payrollReportTitle}
            </Link>
            {canCreateUsers(me) ? (
              <Button
                icon={<Plus className="size-4" />}
                className="min-h-10"
                onClick={() => setCreateOpen(true)}
              >
                {hr.newEmployee}
              </Button>
            ) : null}
            <select
              className="input min-h-10 w-auto py-2 pe-8 text-[13px]"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="IQD">IQD</option>
              <option value="USD">USD</option>
            </select>
            <select
              className="input min-h-10 w-auto py-2 pe-8 text-[13px]"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              <option value={7}>{hr.last7Days}</option>
              <option value={30}>{hr.last30Days}</option>
              <option value={90}>{hr.last90Days}</option>
            </select>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Workforce */}
        <Card className="lg:col-span-2">
          <CardHeader
            title={hr.workforceTitle}
            subtitle={hr.workforceSub}
            action={
              <Link to="/app/users" className="text-[12px] font-semibold text-brand hover:underline">
                {hr.viewEmployees}
              </Link>
            }
          />
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {[
                { label: hr.employeesTotal, value: wf.employees_total },
                { label: hr.employeesActive, value: wf.employees_active },
                { label: hr.employeesInactive, value: wf.employees_inactive },
                { label: hr.syncedDaftra, value: wf.synced_from_daftra },
                { label: hr.withDepartment, value: wf.with_department },
                { label: hr.withTitle, value: wf.with_title },
                { label: hr.withContract, value: wf.with_contract },
              ].map((s) => (
                <div key={s.label} className="rounded-lg bg-surface-2/50 px-3 py-2.5">
                  <div className="text-[11.5px] text-text-3">{s.label}</div>
                  <div className="mt-0.5 text-[18px] font-semibold tabular-nums text-text">
                    {formatNumber(s.value)}
                  </div>
                </div>
              ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center gap-1.5 text-[12.5px] font-semibold text-text-2">
                  <Users className="size-3.5" />
                  {hr.byDepartment}
                </div>
                <div className="max-h-48 space-y-1.5 overflow-y-auto overscroll-contain">
                  {(wf.by_department ?? []).length === 0 ? (
                    <div className="text-[12.5px] text-text-3">—</div>
                  ) : (
                    (wf.by_department ?? []).map((row) => (
                      <div
                        key={`${row.id ?? "x"}-${row.name}`}
                        className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-2.5 py-1.5 text-[12.5px]"
                      >
                        <span className="truncate text-text-2">{row.name}</span>
                        <span className="tabular-nums font-semibold">{formatNumber(row.count)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center gap-1.5 text-[12.5px] font-semibold text-text-2">
                  <Briefcase className="size-3.5" />
                  {hr.byTitle}
                </div>
                <div className="max-h-48 space-y-1.5 overflow-y-auto overscroll-contain">
                  {(wf.by_title ?? []).length === 0 ? (
                    <div className="text-[12.5px] text-text-3">—</div>
                  ) : (
                    (wf.by_title ?? []).map((row) => (
                      <div
                        key={row.name}
                        className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-2.5 py-1.5 text-[12.5px]"
                      >
                        <span className="truncate text-text-2">{row.name}</span>
                        <span className="tabular-nums font-semibold">{formatNumber(row.count)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Contracts summary */}
        <Card>
          <CardHeader
            title={hr.contractsTitle}
            subtitle={hr.contractsSub}
            action={
              <Link to="/app/users" className="text-[12px] font-semibold text-brand hover:underline">
                {hr.viewDetails}
              </Link>
            }
          />
          <CardBody>
            <div className="mb-3 flex items-center gap-2 text-[12px] text-text-3">
              <Briefcase className="size-3.5" />
              {hr.contractsTotal.replace("{n}", formatNumber(data.contracts_total))}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
              {data.contracts_by_status.map((row) => (
                <div key={row.status} className="flex items-center justify-between gap-2 rounded-lg bg-surface-2/50 px-2.5 py-2">
                  <span className="flex min-w-0 items-center gap-2 text-[12.5px] text-text-2">
                    <span className={`size-2 shrink-0 rounded-full ${CONTRACT_DOT[row.status] ?? "bg-text-3"}`} />
                    <span className="truncate">{contractLabel(row.status)}</span>
                  </span>
                  <span className="tabular-nums text-[13px] font-semibold text-text">{formatNumber(row.count)}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Pending requests */}
        <Card>
          <CardHeader
            title={hr.pendingTitle}
            subtitle={hr.pendingSub}
            action={
              <Badge variant={data.pending_requests_total ? "warning" : "default"}>
                {formatNumber(data.pending_requests_total)}
              </Badge>
            }
          />
            <CardBody className="max-h-[320px] space-y-0 overflow-y-auto overscroll-contain p-0">
            {data.pending_requests.length === 0 ? (
              <div className="flex items-center gap-2 px-5 py-8 text-[13px] text-text-3">
                <CheckCircle2 className="size-4 shrink-0 text-success" />
                {hr.pendingEmpty}
              </div>
            ) : (
              data.pending_requests.map((req) => (
                <Link
                  key={req.id}
                  to={`/app/hr/employees/${req.employee_id}`}
                  className="flex items-center gap-3 border-b border-border/70 px-4 py-3 transition-colors last:border-b-0 hover:bg-surface-2/70"
                >
                  <UserAvatar name={req.employee_name} seed={req.employee_id} src={req.employee_avatar} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold">{req.employee_name}</div>
                    <div className="truncate text-[12px] text-text-3">
                      {requestTypeLabel(req.request_type)} · {req.subject}
                    </div>
                  </div>
                  <Badge variant="warning">{hr.pendingBadge}</Badge>
                </Link>
              ))
            )}
          </CardBody>
        </Card>

        {/* Payroll */}
        <Card>
          <CardHeader
            title={hr.payrollTitle}
            subtitle={periodLabel}
            action={
              <span className="inline-flex items-center gap-1 text-[12px] text-text-3">
                <CalendarRange className="size-3.5" />
                {hr.lastNDays.replace("{n}", String(days))}
              </span>
            }
          />
          <CardBody>
            <div className="grid grid-cols-2 gap-3">
              <PayrollStat
                label={hr.totalGross}
                value={formatMoneyLocal(data.payroll.total_gross, data.payroll.currency, locale)}
                tone="text-success"
                icon={<Wallet className="size-4" />}
              />
              <PayrollStat
                label={hr.totalDeductions}
                value={formatMoneyLocal(data.payroll.total_deductions, data.payroll.currency, locale)}
                tone="text-warning"
                icon={<FileWarning className="size-4" />}
              />
              <PayrollStat
                label={hr.totalNet}
                value={formatMoneyLocal(data.payroll.total_net, data.payroll.currency, locale)}
                tone="text-brand"
                icon={<ClipboardList className="size-4" />}
              />
              <PayrollStat
                label={hr.payslips}
                value={formatNumber(data.payroll.payslip_count)}
                tone="text-info"
                icon={<Users className="size-4" />}
              />
            </div>
          </CardBody>
        </Card>

        {/* Expiring contracts */}
        <Card>
          <CardHeader
            title={hr.expiringTitle}
            subtitle={hr.expiringSub}
            action={
              <Link to="/app/users" className="text-[12px] font-semibold text-brand hover:underline">
                {hr.showAll}
              </Link>
            }
          />
          <CardBody className="max-h-[320px] space-y-0 overflow-y-auto overscroll-contain p-0">
            {data.expiring_contracts.length === 0 ? (
              <div className="flex items-center gap-2 px-5 py-8 text-[13px] text-text-3">
                <CheckCircle2 className="size-4 shrink-0 text-success" />
                {hr.expiringEmpty}
              </div>
            ) : (
              data.expiring_contracts.map((c) => (
                <Link
                  key={c.id}
                  to={`/app/hr/employees/${c.employee_id}`}
                  className="flex items-center gap-3 border-b border-border/70 px-4 py-3 transition-colors last:border-b-0 hover:bg-surface-2/70"
                >
                  <UserAvatar name={c.employee_name} seed={c.employee_id} src={c.employee_avatar} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold">{c.employee_name}</div>
                    <div className="truncate text-[11.5px] text-text-3">
                      <span className="font-mono text-brand">#{c.code}</span>
                      {" · "}
                      {formatDate(c.start_date, "DD/MM/YYYY")} – {formatDate(c.end_date, "DD/MM/YYYY")}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardBody>
        </Card>
      </div>

      {/* Attendance */}
      <Card>
        <CardHeader
          title={hr.attendanceTitle}
          subtitle={periodLabel}
          action={
            <Badge variant="brand">{formatNumber(data.attendance_total)}</Badge>
          }
        />
        <CardBody>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {data.attendance.map((row) => {
              const color = ATTENDANCE_COLOR[row.status] ?? (theme === "dark" ? "#94a3b8" : "#64748b");
              const chartData = [
                { name: "value", value: row.count || 0 },
                { name: "rest", value: Math.max(0, data.attendance_total - row.count) || 1 },
              ];
              return (
                <div key={row.status} className="flex flex-col items-center rounded-xl bg-surface-2/40 p-3">
                  <div className="relative h-[110px] w-[110px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          dataKey="value"
                          innerRadius={34}
                          outerRadius={48}
                          startAngle={90}
                          endAngle={-270}
                          stroke="none"
                        >
                          <Cell fill={color} />
                          <Cell fill="rgb(var(--border))" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 grid place-items-center">
                      <span className="text-[15px] font-semibold tabular-nums">{formatNumber(row.count)}</span>
                    </div>
                  </div>
                  <div className="mt-1 text-center text-[12px] font-semibold text-text-2">
                    {attendanceLabel(row.status)}
                  </div>
                  <div className="text-[11px] text-text-3">{formatNumber(row.pct, 0)}%</div>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {createOpen ? (
        <StaffUserFormModal
          open
          onClose={() => setCreateOpen(false)}
          onSaved={(user) => {
            if (user.is_staff) navigate(`/app/hr/employees/${user.id}`);
          }}
        />
      ) : null}
    </div>
  );
}

function PayrollStat({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-surface-2/30 p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-text-3">
        <span className={tone}>{icon}</span>
        {label}
      </div>
      <div className={`mt-1.5 truncate text-[1.05rem] font-semibold tabular-nums ${tone}`}>{value}</div>
    </div>
  );
}

function formatMoneyLocal(value: number, currency: string, locale: string) {
  try {
    return new Intl.NumberFormat(locale === "ar" ? "ar-IQ" : "en-US", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(value || 0) + ` ${currency}`;
  } catch {
    return `${Math.round(value || 0)} ${currency}`;
  }
}
