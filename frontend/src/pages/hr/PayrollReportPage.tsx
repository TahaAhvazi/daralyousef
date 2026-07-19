import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Wallet } from "lucide-react";
import { Link } from "react-router-dom";

import { departmentsApi, hrApi } from "@/api/modules";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { useT } from "@/i18n/useT";
import { staffBreadcrumbs } from "@/lib/breadcrumbs";
import { formatDate, formatNumber } from "@/lib/format";

function money(n: number, currency: string, locale: string) {
  try {
    return new Intl.NumberFormat(locale === "ar" ? "ar" : "en", {
      style: "currency",
      currency: currency === "IQD" ? "IQD" : currency,
      maximumFractionDigits: currency === "IQD" ? 0 : 2,
    }).format(n);
  } catch {
    return `${formatNumber(n)} ${currency}`;
  }
}

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default function PayrollReportPage() {
  const { t, locale } = useT();
  const hr = t.staffUi.hr;
  const [from, setFrom] = useState(isoDaysAgo(365));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [departmentId, setDepartmentId] = useState<number | "">("");

  const depts = useQuery({
    queryKey: ["departments"],
    queryFn: () => departmentsApi.list(),
  });

  const report = useQuery({
    queryKey: ["hr.payrollReport", from, to, departmentId],
    queryFn: () =>
      hrApi.payrollReport({
        from,
        to,
        department_id: departmentId === "" ? undefined : Number(departmentId),
      }),
  });

  const breadcrumbs = useMemo(
    () => [...staffBreadcrumbs("/app/hr", t.staffUi.nav), { label: hr.payrollReportTitle }],
    [t.staffUi.nav, hr.payrollReportTitle],
  );

  const exportCsv = () => {
    const rows = report.data?.rows ?? [];
    const header = [
      "employee", "department", "code", "period_start", "period_end",
      "base", "overtime", "absence", "bonus", "gross", "deductions", "net",
      "currency", "status", "source", "paid_at",
    ];
    const lines = [header.join(",")];
    for (const r of rows) {
      lines.push([
        JSON.stringify(r.employee_name),
        JSON.stringify(r.department || ""),
        r.code,
        r.period_start,
        r.period_end,
        r.base_salary,
        r.overtime,
        r.absence,
        r.bonus,
        r.gross_pay,
        r.deductions,
        r.net_pay,
        r.currency,
        r.status,
        r.source,
        r.paid_at || "",
      ].join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll-report-${from}-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const data = report.data;
  const currency = data?.currency || "IQD";
  const dateFmt = locale === "ar" ? "DD/MM/YYYY" : "MMM D, YYYY";

  return (
    <div className="page-shell space-y-5">
      <PageHeader
        title={hr.payrollReportTitle}
        description={hr.payrollReportSub}
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/app/hr" className="btn btn-secondary min-h-10">
              {hr.title}
            </Link>
            <Button
              variant="secondary"
              className="min-h-10"
              icon={<Download className="size-4" />}
              disabled={!data?.rows?.length}
              onClick={exportCsv}
            >
              {hr.payrollReportExport}
            </Button>
          </div>
        }
      />

      <Card>
        <CardBody className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-[12px] text-text-2">
            {hr.payrollReportFrom}
            <input
              type="date"
              className="input min-h-10"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-[12px] text-text-2">
            {hr.payrollReportTo}
            <input
              type="date"
              className="input min-h-10"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-[12px] text-text-2">
            {hr.payrollReportDept}
            <select
              className="input min-h-10 min-w-[12rem]"
              value={departmentId}
              onChange={(e) =>
                setDepartmentId(e.target.value ? Number(e.target.value) : "")
              }
            >
              <option value="">{hr.payrollReportAllDepts}</option>
              {(depts.data ?? []).map((d: { id: number; name: string }) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </label>
        </CardBody>
      </Card>

      {report.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { label: hr.totalGross, value: money(data.total_gross, currency, locale) },
              { label: hr.totalDeductions, value: money(data.total_deductions, currency, locale) },
              { label: hr.payrollReportBonus, value: money(data.total_bonus, currency, locale) },
              { label: hr.totalNet, value: money(data.total_net, currency, locale) },
              { label: hr.payrollReportHeadcount, value: formatNumber(data.headcount) },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border/70 bg-surface px-4 py-3">
                <div className="flex items-center gap-1.5 text-[11px] text-text-3">
                  <Wallet className="size-3.5" />
                  {s.label}
                </div>
                <div className="mt-1 text-[1.05rem] font-semibold tabular-nums">{s.value}</div>
              </div>
            ))}
          </div>

          <Card>
            <CardHeader title={hr.payslips} subtitle={`${formatNumber(data.payslip_count)}`} />
            <CardBody className="overflow-x-auto p-0">
              {data.rows.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-text-3">{hr.payrollReportEmpty}</p>
              ) : (
                <table className="min-w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border bg-surface-2/40 text-[11px] uppercase tracking-wide text-text-3">
                      <th className="px-4 py-3 text-start font-medium">Employee</th>
                      <th className="px-4 py-3 text-start font-medium">Period</th>
                      <th className="px-4 py-3 text-end font-medium">Base</th>
                      <th className="px-4 py-3 text-end font-medium">OT</th>
                      <th className="px-4 py-3 text-end font-medium">Absence</th>
                      <th className="px-4 py-3 text-end font-medium">Bonus</th>
                      <th className="px-4 py-3 text-end font-medium">Net</th>
                      <th className="px-4 py-3 text-start font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((r) => (
                      <tr key={r.payslip_id} className="border-b border-border/70 last:border-0">
                        <td className="px-4 py-3">
                          <Link
                            to={`/app/hr/employees/${r.employee_id}`}
                            className="font-medium text-brand hover:underline"
                          >
                            {r.employee_name}
                          </Link>
                          <div className="text-[11px] text-text-3">
                            {r.department || "—"} · {r.code}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-text-2 whitespace-nowrap">
                          {formatDate(r.period_start, dateFmt)} – {formatDate(r.period_end, dateFmt)}
                        </td>
                        <td className="px-4 py-3 text-end tabular-nums">{formatNumber(r.base_salary)}</td>
                        <td className="px-4 py-3 text-end tabular-nums">{formatNumber(r.overtime)}</td>
                        <td className="px-4 py-3 text-end tabular-nums text-danger">{formatNumber(r.absence)}</td>
                        <td className="px-4 py-3 text-end tabular-nums">{formatNumber(r.bonus)}</td>
                        <td className="px-4 py-3 text-end font-semibold tabular-nums">
                          {money(r.net_pay, r.currency, locale)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={r.paid || r.status === "paid" ? "success" : "warning"}>
                            {r.status}
                          </Badge>
                          <div className="mt-0.5 text-[10px] text-text-3">{r.source}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardBody>
          </Card>
        </>
      ) : null}
    </div>
  );
}
