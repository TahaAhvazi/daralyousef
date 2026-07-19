import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  FolderKanban,
  Mail,
  Pencil,
  Phone,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

import { hrApi, usersApi } from "@/api/modules";
import { AttendanceCalendarPanel } from "@/components/hr/AttendanceCalendarPanel";
import { PayrollManagerPanel } from "@/components/hr/PayrollManagerPanel";
import { StaffUserFormModal } from "@/components/users/StaffUserFormModal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs } from "@/components/ui/Tabs";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useT } from "@/i18n/useT";
import { staffBreadcrumbs } from "@/lib/breadcrumbs";
import { formatDate, formatNumber, fromNow } from "@/lib/format";
import { cn } from "@/lib/cn";
import {
  canDeleteUsers,
  canManageHr,
  canUpdateUsers,
} from "@/lib/permissions";
import { useAuthStore } from "@/store/auth";
import type { EmployeeHrProfile, User } from "@/types/api";

type TabId = "details" | "projects" | "attendance" | "payroll" | "requests" | "activity";

function profileToUser(data: EmployeeHrProfile): User {
  const slugs = data.role_slugs?.length
    ? data.role_slugs
    : data.roles.map((name) => name.toLowerCase().replace(/\s+/g, "_"));
  return {
    id: data.id,
    email: data.email,
    full_name: data.full_name,
    phone: data.phone,
    avatar_url: data.avatar_url,
    department: data.department,
    title: data.title,
    is_active: data.is_active,
    is_staff: data.is_staff ?? true,
    is_superuser: false,
    theme: "system",
    locale: "en",
    roles: slugs.map((slug, i) => ({
      id: i + 1,
      slug,
      name: data.roles[i] ?? slug,
    })),
    permissions: [],
  };
}

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const employeeId = Number(id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const me = useAuthStore((s) => s.user);
  const { t, locale, isRtl } = useT();
  const hr = t.staffUi.hr;
  const emp = hr.employee;
  const boardColumns = t.staffUi.orderBoard.columns as Record<string, string>;
  const [tab, setTab] = useState<TabId>("details");
  const [editOpen, setEditOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["hr.employee", employeeId],
    queryFn: () => hrApi.employee(employeeId),
    enabled: Number.isFinite(employeeId) && employeeId > 0,
  });

  const remove = useMutation({
    mutationFn: () => usersApi.remove(employeeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["hr.summary"] });
      toast.success(t.staffUi.users.deleted);
      navigate("/app/hr");
    },
    onError: () => toast.error(t.staffUi.users.confirmDelete),
  });

  const breadcrumbs = useMemo(() => {
    const base = staffBreadcrumbs("/app/hr", t.staffUi.nav);
    if (data) base.push({ label: data.full_name });
    return base;
  }, [data, t.staffUi.nav]);

  if (isLoading) {
    return (
      <div className="page-shell space-y-4">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="page-shell space-y-4">
        <PageHeader title={emp.notFound} breadcrumbs={breadcrumbs} />
        <Card>
          <CardBody className="py-10 text-center text-sm text-text-3">
            {emp.notFoundHint}
            <div className="mt-4">
              <Link to="/app/hr" className="btn btn-secondary">
                {emp.backToHr}
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  const contract = data.primary_contract;
  const statusKey = contract?.status ?? (data.is_active ? "active" : "suspended");
  const statusLabel =
    hr.contractStatuses[statusKey as keyof typeof hr.contractStatuses] ?? statusKey;
  const statusVariant =
    statusKey === "active"
      ? "success"
      : statusKey === "expired" || statusKey === "cancelled"
        ? "danger"
        : statusKey === "under_review" || statusKey === "draft"
          ? "warning"
          : "brand";

  const contractLabel = (s: string) =>
    hr.contractStatuses[s as keyof typeof hr.contractStatuses] ?? s;
  const attendanceLabel = (s: string) =>
    hr.attendanceStatuses[s as keyof typeof hr.attendanceStatuses] ?? s;
  const requestTypeLabel = (s: string) =>
    hr.requestTypes[s as keyof typeof hr.requestTypes] ?? s;
  const templateLabel = (s?: string | null) => {
    if (!s) return "—";
    return emp.salaryTemplates[s as keyof typeof emp.salaryTemplates] ?? s;
  };

  const dateFmt = locale === "ar" ? "DD/MM/YYYY" : "MMM D, YYYY";
  const projects = data.projects ?? [];
  const canEdit = canUpdateUsers(me);
  const canDelete = canDeleteUsers(me) && me?.id !== data.id;
  const canHrWrite = canManageHr(me);

  return (
    <div className="page-shell space-y-5">
      <PageHeader
        title={data.full_name}
        description={[data.title, data.department].filter(Boolean).join(" · ") || emp.defaultSubtitle}
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant as "success" | "danger" | "warning" | "brand"}>
              {statusLabel}
            </Badge>
            <Link to="/app/hr" className="btn btn-secondary min-h-10">
              <ArrowLeft className={cn("size-4", isRtl && "rotate-180")} />
              {emp.backToHr}
            </Link>
            {canEdit ? (
              <Button
                variant="secondary"
                className="min-h-10"
                icon={<Pencil className="size-4" />}
                onClick={() => setEditOpen(true)}
              >
                {emp.editEmployee}
              </Button>
            ) : (
              <Link to="/app/users" className="btn btn-ghost min-h-10">
                {emp.editInUsers}
              </Link>
            )}
            {canDelete ? (
              <Button
                variant="ghost"
                className="min-h-10 text-danger"
                loading={remove.isPending}
                icon={<Trash2 className="size-4" />}
                onClick={() => {
                  if (window.confirm(t.staffUi.users.confirmDelete)) remove.mutate();
                }}
              >
                {emp.deleteEmployee}
              </Button>
            ) : null}
          </div>
        }
      />

      <Card>
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <UserAvatar name={data.full_name} seed={data.id} src={data.avatar_url} size="xl" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-heading">{data.full_name}</h2>
              <span className="font-mono text-[12px] text-text-3">
                #{data.profile?.employee_code || data.daftra_id || data.id}
              </span>
              <Badge variant={data.is_active ? "success" : "danger"}>
                {data.is_active ? statusLabel : emp.inactive}
              </Badge>
            </div>
            <div className="text-[13px] text-text-2">
              ({data.title || emp.defaultSubtitle})
              {data.department ? ` · ${data.department}` : ""}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-text-2">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="size-3.5 text-text-3" />
                {data.email}
              </span>
              {(data.phone || data.profile?.business_phone || data.profile?.home_phone) ? (
                <a
                  href={`tel:${data.phone || data.profile?.business_phone || data.profile?.home_phone}`}
                  className="inline-flex items-center gap-1.5 text-brand hover:underline"
                >
                  <Phone className="size-3.5" />
                  {data.phone || data.profile?.business_phone || data.profile?.home_phone}
                </a>
              ) : null}
              {contract ? (
                <span className="inline-flex items-center gap-1.5">
                  <Briefcase className="size-3.5 text-text-3" />
                  {emp.contractCode}: {contract.code}
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-1 pt-1">
              {data.roles.map((role) => (
                <Badge key={role} variant="brand">{role}</Badge>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:w-56">
            <MiniStat label={emp.statPresent} value={formatNumber(data.attendance_summary.find((x) => x.status === "present")?.count ?? 0)} />
            <MiniStat label={emp.statProjects} value={formatNumber(projects.length)} />
            <MiniStat label={emp.statPayslips} value={formatNumber(data.payslips.length)} />
            <MiniStat label={emp.statRequests} value={formatNumber(data.requests.length)} />
          </div>
        </CardBody>
      </Card>

      <Tabs
        fullWidth
        value={tab}
        onChange={(id) => setTab(id as TabId)}
        items={[
          { id: "details", label: emp.tabDetails },
          { id: "projects", label: emp.tabProjects, badge: projects.length || undefined },
          { id: "attendance", label: emp.tabAttendance, badge: data.attendance.length || undefined },
          { id: "payroll", label: emp.tabPayroll, badge: data.payslips.length || undefined },
          { id: "requests", label: emp.tabRequests, badge: data.requests.length || undefined },
          { id: "activity", label: emp.tabActivity },
        ]}
      />

      {tab === "details" ? (
        <div className="space-y-4">
          <SectionCard title={emp.profileInfo}>
            <FieldGrid
              items={[
                { label: emp.fieldCodeStaff, value: data.profile?.employee_code || data.daftra_id || "—" },
                { label: emp.fieldDaftraId, value: data.daftra_id || data.profile?.daftra_id || "—" },
                { label: emp.fieldStaffType, value: data.profile?.staff_type || "—" },
                {
                  label: emp.fieldSystemAccess,
                  value: data.profile?.can_access_system ? emp.yes : emp.no,
                },
                { label: emp.fieldJobTitle, value: data.title || "—" },
                { label: emp.fieldGender, value: data.profile?.gender || "—" },
                { label: emp.fieldNationality, value: data.profile?.nationality || "—" },
                { label: emp.fieldCitizenship, value: data.profile?.citizenship_status || "—" },
                { label: emp.fieldOfficialId, value: data.profile?.official_id || "—" },
                { label: emp.fieldHireDate, value: formatDate(data.profile?.hire_date, dateFmt) },
                { label: emp.fieldBirthDate, value: formatDate(data.profile?.birth_date, dateFmt) },
                { label: emp.fieldResidenceExpiry, value: formatDate(data.profile?.residence_expiry, dateFmt) },
                {
                  label: emp.fieldHourlyRate,
                  value: data.profile?.hourly_rate != null
                    ? formatMoneyLocal(data.profile.hourly_rate, data.profile.hourly_rate_currency || "IQD", locale)
                    : "—",
                },
                { label: emp.fieldCreated, value: formatDate(data.created_at, dateFmt) },
                { label: emp.fieldLastLogin, value: formatDate(data.last_login_at, dateFmt) },
                { label: emp.fieldNotes, value: data.profile?.notes || "—" },
              ]}
            />
          </SectionCard>

          <SectionCard title={emp.contactInfo}>
            <FieldGrid
              items={[
                { label: emp.fieldEmail, value: data.email || "—" },
                { label: emp.fieldMobile, value: data.phone || "—" },
                { label: emp.fieldHomePhone, value: data.profile?.home_phone || "—" },
                { label: emp.fieldBusinessPhone, value: data.profile?.business_phone || "—" },
                { label: emp.fieldFax, value: data.profile?.fax || "—" },
                { label: emp.fieldAddress, value: data.profile?.address1 || "—" },
                { label: emp.fieldAddress2, value: data.profile?.address2 || "—" },
                { label: emp.fieldCity, value: data.profile?.city || "—" },
                { label: emp.fieldState, value: data.profile?.state || "—" },
                { label: emp.fieldPostal, value: data.profile?.postal_code || "—" },
                { label: emp.fieldCountry, value: data.profile?.country_code || "—" },
              ]}
            />
          </SectionCard>

          <SectionCard title={emp.contractInfo}>
            <FieldGrid
              items={[
                { label: emp.fieldEmployee, value: `#${data.id} ${data.full_name}` },
                { label: emp.fieldJobTitle, value: contract?.job_title || data.title || "—" },
                { label: emp.fieldJobLevel, value: contract?.job_level || "—" },
                { label: emp.fieldCode, value: contract?.code || "—" },
                { label: emp.fieldPrimary, value: contract?.is_primary ? emp.yes : emp.no },
                { label: emp.fieldDescription, value: contract?.description || contract?.notes || "—" },
              ]}
            />
          </SectionCard>

          <SectionCard title={emp.timeline}>
            <FieldGrid
              items={[
                { label: emp.fieldStart, value: formatDate(contract?.start_date, dateFmt) },
                { label: emp.fieldJoin, value: formatDate(contract?.join_date, dateFmt) },
                { label: emp.fieldSigned, value: formatDate(contract?.signed_at, dateFmt) },
                { label: emp.fieldEnd, value: formatDate(contract?.end_date, dateFmt) },
                { label: emp.fieldProbation, value: formatDate(contract?.probation_end, dateFmt) },
                {
                  label: emp.fieldDuration,
                  value: contract?.start_date && contract?.end_date
                    ? `${formatDate(contract.start_date, "DD/MM/YYYY")} – ${formatDate(contract.end_date, "DD/MM/YYYY")}`
                    : "—",
                },
              ]}
            />
          </SectionCard>

          <SectionCard title={emp.salaryData}>
            <FieldGrid
              items={[
                { label: emp.fieldCurrency, value: contract?.currency || data.payroll_totals.currency },
                { label: emp.fieldSalary, value: formatMoneyLocal(contract?.salary ?? 0, contract?.currency || "IQD", locale) },
                { label: emp.fieldTemplate, value: templateLabel(contract?.salary_template) },
                {
                  label: emp.fieldNetPeriod,
                  value: formatMoneyLocal(data.payroll_totals.total_net, data.payroll_totals.currency, locale),
                },
              ]}
            />
          </SectionCard>

          {data.contracts.length > 1 ? (
            <SectionCard title={emp.allContracts}>
              <div className="divide-y divide-border/70">
                {data.contracts.map((c) => (
                  <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                    <div>
                      <div className="font-medium text-text">{c.code}</div>
                      <div className="text-[12px] text-text-3">
                        {c.job_title || c.title || "—"} · {formatDate(c.start_date, dateFmt)}
                        {c.end_date ? ` – ${formatDate(c.end_date, dateFmt)}` : ""}
                      </div>
                    </div>
                    <Badge variant={c.status === "active" ? "success" : "default"}>
                      {contractLabel(c.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            </SectionCard>
          ) : null}
        </div>
      ) : null}

      {tab === "projects" ? (
        <Card>
          <CardHeader
            title={emp.projectsTitle}
            subtitle={emp.projectsSub}
            action={
              <Link to="/app/orders/board" className="btn btn-secondary min-h-9 text-[12.5px]">
                <FolderKanban className="size-3.5" />
                {emp.openBoard}
              </Link>
            }
          />
          <CardBody className="space-y-2">
            {projects.length === 0 ? (
              <Empty text={emp.projectsEmpty} />
            ) : (
              projects.map((p) => (
                <div
                  key={`${p.order_id}-${p.role}-${p.workflow_status ?? "none"}`}
                  className="flex flex-col gap-3 rounded-xl border border-border/70 bg-surface-2/20 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/app/orders/${p.order_id}`}
                        className="font-mono text-[13px] font-semibold text-brand hover:underline"
                      >
                        {p.code}
                      </Link>
                      <Badge variant={p.on_board ? "success" : "default"}>
                        {p.on_board ? emp.projectOnBoard : emp.projectOffBoard}
                      </Badge>
                      <Badge variant="brand">
                        {p.role === "owner" ? emp.projectRoleOwner : emp.projectRoleAssignee}
                      </Badge>
                    </div>
                    <div className="truncate text-[13.5px] font-medium text-text">
                      {p.title || p.code}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-text-3">
                      <span>{p.status.replace(/_/g, " ")}</span>
                      {p.workflow_status ? (
                        <span>
                          {emp.stageLabel}: {boardColumns[p.workflow_status] ?? p.workflow_status}
                        </span>
                      ) : null}
                      {p.deadline ? <span>{formatDate(p.deadline, dateFmt)}</span> : null}
                    </div>
                  </div>
                  <Link
                    to={`/app/orders/${p.order_id}`}
                    className="btn btn-secondary min-h-9 shrink-0 text-[12.5px]"
                  >
                    {emp.openOrder}
                  </Link>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      ) : null}

      {tab === "attendance" ? (
        <AttendanceCalendarPanel
          employeeId={data.id}
          canManage={canHrWrite}
          locale={locale}
          isRtl={isRtl}
          labels={{
            title: emp.attendanceCalendar,
            markWeekdays: emp.markWeekdaysPresent,
            dailyRate: emp.dailyRate,
            save: emp.saveAttendance,
            notes: emp.fieldNotes,
            checkIn: emp.checkIn,
            checkOut: emp.checkOut,
            deductionOverride: emp.deductionOverride,
            clearDay: emp.clearDay,
            statuses: {
              present: hr.attendanceStatuses.present,
              absent: hr.attendanceStatuses.absent,
              late: hr.attendanceStatuses.late,
              on_leave: hr.attendanceStatuses.on_leave,
            },
            saved: emp.attendanceSaved,
            saveFailed: emp.attendanceSaveFailed,
          }}
        />
      ) : null}

      {tab === "payroll" ? (
        <PayrollManagerPanel
          data={data}
          employeeId={data.id}
          canManage={canHrWrite}
          locale={locale}
          isRtl={isRtl}
          labels={{
            payrollOverview: emp.payrollOverview,
            payrollOverviewSub: emp.payrollOverviewSub,
            avgGross: emp.avgGross,
            avgNet: emp.avgNet,
            totalNet: emp.totalNet,
            payrollChart: emp.payrollChart,
            payrollMatrix: emp.payrollMatrix,
            rowSalary: emp.rowSalary,
            rowOvertime: emp.rowOvertime,
            rowAbsence: emp.rowAbsence,
            rowBonus: emp.rowBonus,
            rowTotal: emp.rowTotal,
            colTotal: emp.colTotal,
            payslipList: emp.payslipList,
            payslipEmpty: emp.payslipEmpty,
            voucherId: emp.voucherId,
            voucherPeriod: emp.voucherPeriod,
            voucherAmount: emp.voucherAmount,
            voucherStatus: emp.voucherStatus,
            paid: emp.paid,
            unpaid: emp.unpaid,
            draftStatus: emp.draftStatus,
            addPayslip: emp.addPayslip,
            editPayslip: emp.editPayslip,
            runPayroll: emp.runPayroll,
            generateDraft: emp.generateDraft,
            confirmPaid: emp.confirmPaid,
            unpay: emp.unpayPayslip,
            delete: emp.deletePayslip,
            save: emp.saveAttendance,
            cancel: t.staffUi.common.cancel,
            baseSalary: emp.fieldSalary,
            overtime: emp.rowOvertime,
            absence: emp.rowAbsence,
            bonus: emp.rowBonus,
            notes: emp.fieldNotes,
            periodStart: emp.fieldStart,
            periodEnd: emp.fieldEnd,
            currency: emp.fieldCurrency,
            markPaid: emp.markPaid,
            saved: emp.attendanceSaved,
            saveFailed: emp.attendanceSaveFailed,
            confirmDelete: emp.confirmDeletePayslip,
            runFromAttendance: emp.runFromAttendance,
            monthLabel: emp.payrollMonth,
            adjustments: emp.adjustments,
            addAdjustment: emp.addAdjustment,
            amount: emp.adjAmount,
            reason: emp.adjReason,
            kindBonus: emp.kindBonus,
            kindDeduction: emp.kindDeduction,
            kindOvertime: emp.kindOvertime,
            noAdjustments: emp.noAdjustments,
            dailyRate: emp.dailyRate,
            absentDays: emp.absentDays,
            actions: emp.actions,
          }}
        />
      ) : null}

      {tab === "requests" ? (
        <Card>
          <CardHeader title={emp.requestsTitle} />
          <CardBody className="divide-y divide-border/70">
            {data.requests.length === 0 ? (
              <Empty text={emp.requestsEmpty} />
            ) : (
              data.requests.map((r) => (
                <div key={r.id} className="flex flex-wrap items-start justify-between gap-2 py-3 first:pt-0 last:pb-0">
                  <div>
                    <div className="text-[13px] font-medium text-text">{r.subject}</div>
                    <div className="mt-0.5 text-[12px] text-text-3">
                      {requestTypeLabel(r.request_type)}
                      {r.starts_on ? ` · ${formatDate(r.starts_on, dateFmt)}` : ""}
                      {r.ends_on ? ` – ${formatDate(r.ends_on, dateFmt)}` : ""}
                    </div>
                  </div>
                  <Badge variant={r.status === "pending" ? "warning" : r.status === "approved" ? "success" : "default"}>
                    {emp.requestStatuses[r.status as keyof typeof emp.requestStatuses] ?? r.status}
                  </Badge>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      ) : null}

      {tab === "activity" ? (
        <Card>
          <CardHeader title={emp.activityTitle} subtitle={emp.activitySub} />
          <CardBody>
            {data.activity.length === 0 ? (
              <Empty text={emp.activityEmpty} />
            ) : (
              <ol className="space-y-3">
                {data.activity.map((item, index) => (
                  <li key={item.id} className="relative flex gap-3">
                    <div className="relative flex w-8 shrink-0 flex-col items-center">
                      <span className="grid size-8 place-items-center rounded-full bg-brand/10 text-brand ring-4 ring-surface">
                        <CheckCircle2 className="size-3.5" />
                      </span>
                      {index < data.activity.length - 1 ? <span className="mt-1 w-px flex-1 bg-border" /> : null}
                    </div>
                    <div className="mb-1 min-w-0 flex-1 rounded-xl bg-info/5 px-3 py-2.5 ring-1 ring-border/60">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[13px] font-medium text-text">{item.summary}</p>
                        <time className="shrink-0 text-[11px] text-text-3">{fromNow(item.occurred_at)}</time>
                      </div>
                      <div className="mt-1 text-[11px] text-text-3">
                        {emp.activityKinds[item.kind as keyof typeof emp.activityKinds] ?? item.kind}
                        {item.meta ? ` · ${item.meta}` : ""}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardBody>
        </Card>
      ) : null}

      {editOpen ? (
        <StaffUserFormModal
          open
          user={profileToUser(data)}
          onClose={() => setEditOpen(false)}
        />
      ) : null}
    </div>
  );
}
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <div className="border-b border-border bg-surface-2/50 px-5 py-3 text-[13px] font-semibold">{title}</div>
      <CardBody>{children}</CardBody>
    </Card>
  );
}

function FieldGrid({ items }: { items: Array<{ label: string; value: React.ReactNode }> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-xl border border-border/70 bg-surface-2/20 px-3 py-2.5">
          <div className="text-[11px] font-semibold text-text-3">{item.label}</div>
          <div className="mt-1 text-[13.5px] font-medium text-text">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-surface-2/30 px-2.5 py-2 text-center">
      <div className="text-[15px] font-semibold tabular-nums">{value}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-text-3">{label}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm text-text-3">{text}</p>;
}

function formatMoneyLocal(amount: number, currency: string, locale: string) {
  try {
    return new Intl.NumberFormat(locale === "ar" ? "ar" : "en", {
      style: "currency",
      currency: currency === "IQD" ? "IQD" : currency,
      maximumFractionDigits: currency === "IQD" ? 0 : 2,
    }).format(amount);
  } catch {
    return `${formatNumber(amount)} ${currency}`;
  }
}
