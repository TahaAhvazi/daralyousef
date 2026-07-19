import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock3,
  Pencil,
  Plus,
  Trash2,
  Wallet,
  Play,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { hrApi } from "@/api/modules";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { formatDate, formatNumber } from "@/lib/format";
import type { EmployeeHrProfile } from "@/types/api";

type Slip = EmployeeHrProfile["payslips"][number];

type Labels = {
  payrollOverview: string;
  payrollOverviewSub: string;
  avgGross: string;
  avgNet: string;
  totalNet: string;
  payrollChart: string;
  payrollMatrix: string;
  rowSalary: string;
  rowOvertime: string;
  rowAbsence: string;
  rowBonus: string;
  rowTotal: string;
  colTotal: string;
  payslipList: string;
  payslipEmpty: string;
  voucherId: string;
  voucherPeriod: string;
  voucherAmount: string;
  voucherStatus: string;
  paid: string;
  unpaid: string;
  draftStatus: string;
  addPayslip: string;
  editPayslip: string;
  runPayroll: string;
  generateDraft: string;
  confirmPaid: string;
  unpay: string;
  delete: string;
  save: string;
  cancel: string;
  baseSalary: string;
  overtime: string;
  absence: string;
  bonus: string;
  notes: string;
  periodStart: string;
  periodEnd: string;
  currency: string;
  markPaid: string;
  saved: string;
  saveFailed: string;
  confirmDelete: string;
  runFromAttendance: string;
  monthLabel: string;
  adjustments: string;
  addAdjustment: string;
  amount: string;
  reason: string;
  kindBonus: string;
  kindDeduction: string;
  kindOvertime: string;
  noAdjustments: string;
  dailyRate: string;
  absentDays: string;
  actions: string;
};

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

function monthEnd(year: number, month: number) {
  const last = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
}

function emptyForm(currency: string, year: number, month: number) {
  return {
    period_start: `${year}-${String(month).padStart(2, "0")}-01`,
    period_end: monthEnd(year, month),
    base_salary: "",
    overtime: "0",
    absence: "0",
    bonus: "0",
    currency,
    notes: "",
    mark_paid: false,
  };
}

export function PayrollManagerPanel({
  data,
  employeeId,
  canManage,
  labels,
  locale,
  isRtl,
}: {
  data: EmployeeHrProfile;
  employeeId: number;
  canManage: boolean;
  labels: Labels;
  locale: string;
  isRtl: boolean;
}) {
  const qc = useQueryClient();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [editing, setEditing] = useState<Slip | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(() => emptyForm("IQD", now.getFullYear(), now.getMonth() + 1));
  const [kind, setKind] = useState("bonus");
  const [adjAmount, setAdjAmount] = useState("");
  const [adjReason, setAdjReason] = useState("");

  const overview = data.payroll_overview;
  const currency = overview?.currency || data.payroll_totals.currency || "IQD";
  const monthsAsc = overview?.months ?? [];
  const monthsDesc = [...monthsAsc].reverse();
  const chartData = monthsAsc.map((m) => ({
    label: locale === "ar"
      ? `${m.month}/${String(m.year).slice(2)}`
      : new Date(m.year, m.month - 1, 1).toLocaleDateString("en", {
          month: "short",
          year: "2-digit",
        }),
    net: m.net_pay,
  }));

  const preview = useQuery({
    queryKey: ["hr.payslipPreview", employeeId, year, month],
    queryFn: () => hrApi.payslipPreview(employeeId, { year, month }),
    enabled: canManage,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["hr.employee", employeeId] });
    qc.invalidateQueries({ queryKey: ["hr.payslipPreview", employeeId] });
  };

  const openCreate = () => {
    setEditing(null);
    setCreating(true);
    setForm(emptyForm(currency, year, month));
  };

  const openEdit = (p: Slip) => {
    setCreating(false);
    setEditing(p);
    setForm({
      period_start: p.period_start.slice(0, 10),
      period_end: p.period_end.slice(0, 10),
      base_salary: String(p.base_salary ?? 0),
      overtime: String(p.overtime ?? 0),
      absence: String(p.absence ?? 0),
      bonus: String(p.bonus ?? 0),
      currency: p.currency || currency,
      notes: p.notes || "",
      mark_paid: !!p.paid,
    });
  };

  const closeForm = () => {
    setCreating(false);
    setEditing(null);
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        period_start: form.period_start,
        period_end: form.period_end,
        base_salary: Number(form.base_salary) || 0,
        overtime: Number(form.overtime) || 0,
        absence: Number(form.absence) || 0,
        bonus: Number(form.bonus) || 0,
        currency: form.currency || "IQD",
        notes: form.notes || undefined,
        mark_paid: form.mark_paid,
        status: form.mark_paid ? "paid" : "draft",
      };
      if (editing) return hrApi.updatePayslip(editing.id, payload);
      return hrApi.createPayslip(employeeId, payload);
    },
    onSuccess: () => {
      toast.success(labels.saved);
      closeForm();
      invalidate();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.error?.message || labels.saveFailed),
  });

  const removeMut = useMutation({
    mutationFn: (id: number) => hrApi.deletePayslip(id),
    onSuccess: () => {
      toast.success(labels.saved);
      invalidate();
    },
    onError: () => toast.error(labels.saveFailed),
  });

  const confirmMut = useMutation({
    mutationFn: (id: number) => hrApi.confirmPayslip(id),
    onSuccess: () => {
      toast.success(labels.saved);
      invalidate();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.error?.message || labels.saveFailed),
  });

  const unpayMut = useMutation({
    mutationFn: (id: number) =>
      hrApi.updatePayslip(id, { mark_paid: false, status: "draft" }),
    onSuccess: () => {
      toast.success(labels.saved);
      invalidate();
    },
    onError: () => toast.error(labels.saveFailed),
  });

  const runDraft = useMutation({
    mutationFn: () => hrApi.createPayslipDraft(employeeId, { year, month }),
    onSuccess: () => {
      toast.success(labels.saved);
      invalidate();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.error?.message || labels.saveFailed),
  });

  const addAdj = useMutation({
    mutationFn: () =>
      hrApi.createAdjustment(employeeId, {
        period_year: year,
        period_month: month,
        kind,
        amount: Number(adjAmount),
        currency,
        reason: adjReason || undefined,
      }),
    onSuccess: () => {
      toast.success(labels.saved);
      setAdjAmount("");
      setAdjReason("");
      invalidate();
    },
    onError: () => toast.error(labels.saveFailed),
  });

  const removeAdj = useMutation({
    mutationFn: (id: number) => hrApi.deleteAdjustment(employeeId, id),
    onSuccess: () => {
      toast.success(labels.saved);
      invalidate();
    },
    onError: () => toast.error(labels.saveFailed),
  });

  const fmtCell = (n: number, asDeduction = false) => {
    if (!n) return "0";
    if (asDeduction) return `-${formatNumber(n)}`;
    return money(n, currency, locale);
  };

  const matrixRows = [
    { key: "base_salary" as const, label: labels.rowSalary, deduction: false },
    { key: "overtime" as const, label: labels.rowOvertime, deduction: false },
    { key: "bonus" as const, label: labels.rowBonus, deduction: false },
    { key: "absence" as const, label: labels.rowAbsence, deduction: true },
    { key: "net_pay" as const, label: labels.rowTotal, deduction: false, highlight: true },
  ];

  const monthOptions = useMemo(() => {
    const opts: { y: number; m: number; label: string }[] = [];
    for (let i = 0; i < 18; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      opts.push({
        y,
        m,
        label: d.toLocaleDateString(locale === "ar" ? "ar" : "en", {
          month: "long",
          year: "numeric",
        }),
      });
    }
    return opts;
  }, [locale]);

  const previewData = preview.data;
  const showForm = creating || !!editing;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title={labels.payrollOverview}
          subtitle={labels.payrollOverviewSub}
          action={
            canManage ? (
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" className="min-h-9" icon={<Plus className="size-3.5" />} onClick={openCreate}>
                  {labels.addPayslip}
                </Button>
              </div>
            ) : null
          }
        />
        <CardBody className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatBox label={labels.avgGross} value={money(overview?.average_gross ?? 0, currency, locale)} />
            <StatBox label={labels.avgNet} value={money(overview?.average_net ?? 0, currency, locale)} />
            <StatBox
              label={labels.totalNet}
              value={money(overview?.total_net ?? data.payroll_totals.total_net, currency, locale)}
              tone="text-success"
            />
          </div>

          {chartData.length > 0 ? (
            <div className="h-52 w-full">
              <div className="mb-2 text-[12px] font-medium text-text-2">{labels.payrollChart}</div>
              <ResponsiveContainer width="100%" height="90%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="payNetFill2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgb(var(--brand))" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="rgb(var(--brand))" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgb(var(--border))" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="rgb(var(--text-3))" />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="rgb(var(--text-3))"
                    width={56}
                    tickFormatter={(v) => formatNumber(Number(v))}
                    orientation={isRtl ? "right" : "left"}
                  />
                  <Tooltip
                    formatter={(value: number) => [money(Number(value), currency, locale), labels.totalNet]}
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid rgb(var(--border))",
                      background: "rgb(var(--surface))",
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="net"
                    stroke="rgb(var(--brand))"
                    fill="url(#payNetFill2)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "rgb(var(--brand))" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : null}

          {monthsDesc.length > 0 ? (
            <div className="overflow-x-auto">
              <div className="mb-2 text-[12px] font-medium text-text-2">{labels.payrollMatrix}</div>
              <table className="min-w-full border-collapse text-[12.5px]">
                <thead>
                  <tr className="border-b border-border text-text-3">
                    <th className="sticky start-0 bg-surface px-3 py-2 text-start font-medium" />
                    {monthsDesc.map((m) => (
                      <th key={m.label} className="whitespace-nowrap px-3 py-2 text-center font-medium">
                        {locale === "ar"
                          ? `${String(m.month).padStart(2, "0")}/${m.year}`
                          : new Date(m.year, m.month - 1, 1).toLocaleDateString("en", {
                              month: "short",
                              year: "numeric",
                            })}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-center font-medium">{labels.colTotal}</th>
                  </tr>
                </thead>
                <tbody>
                  {matrixRows.map((row) => {
                    const total =
                      row.key === "base_salary"
                        ? overview?.total_base_salary ?? 0
                        : row.key === "overtime"
                          ? overview?.total_overtime ?? 0
                          : row.key === "absence"
                            ? overview?.total_absence ?? 0
                            : row.key === "bonus"
                              ? overview?.total_bonus ?? 0
                              : overview?.total_net ?? 0;
                    return (
                      <tr
                        key={row.key}
                        className={cn(
                          "border-b border-border/60",
                          row.highlight && "bg-brand/5 font-semibold text-brand",
                        )}
                      >
                        <td className="sticky start-0 bg-surface px-3 py-2 text-start font-medium text-text-2">
                          {row.label}
                        </td>
                        {monthsDesc.map((m) => (
                          <td
                            key={`${row.key}-${m.label}`}
                            className={cn(
                              "px-3 py-2 text-center tabular-nums",
                              row.deduction && (m[row.key] as number) > 0 && "text-danger",
                            )}
                          >
                            {fmtCell((m[row.key] as number) || 0, row.deduction)}
                          </td>
                        ))}
                        <td
                          className={cn(
                            "px-3 py-2 text-center tabular-nums",
                            row.deduction && total > 0 && "text-danger",
                          )}
                        >
                          {fmtCell(total, row.deduction)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}

          {canManage ? (
            <div className="rounded-xl border border-border/70 bg-surface-2/20 p-4 space-y-3">
              <div className="flex flex-wrap items-end gap-3">
                <Select
                  label={labels.monthLabel}
                  wrapperClassName="min-w-[12rem]"
                  value={`${year}-${month}`}
                  onChange={(e) => {
                    const [y, m] = e.target.value.split("-").map(Number);
                    setYear(y);
                    setMonth(m);
                  }}
                  options={monthOptions.map((o) => ({
                    value: `${o.y}-${o.m}`,
                    label: o.label,
                  }))}
                />
                <Button
                  icon={<Play className="size-4" />}
                  loading={runDraft.isPending}
                  onClick={() => runDraft.mutate()}
                >
                  {labels.runFromAttendance}
                </Button>
                {previewData?.draft_payslip && !previewData.draft_payslip.paid ? (
                  <Button
                    variant="secondary"
                    icon={<CheckCircle2 className="size-4" />}
                    loading={confirmMut.isPending}
                    onClick={() => confirmMut.mutate(previewData.draft_payslip!.id)}
                  >
                    {labels.confirmPaid}
                  </Button>
                ) : null}
              </div>
              {previewData ? (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-[12.5px]">
                  <div>{labels.baseSalary}: <strong className="tabular-nums">{money(previewData.base_salary, currency, locale)}</strong></div>
                  <div>{labels.dailyRate}: <strong className="tabular-nums">{money(previewData.daily_rate, currency, locale)}</strong></div>
                  <div>{labels.absentDays}: <strong>{formatNumber(previewData.absent_days)}</strong></div>
                  <div>{labels.totalNet}: <strong className="tabular-nums text-success">{money(previewData.net_pay, currency, locale)}</strong></div>
                </div>
              ) : null}

              <div>
                <div className="mb-2 text-[13px] font-semibold">{labels.adjustments}</div>
                {(previewData?.adjustments ?? []).length === 0 ? (
                  <p className="text-[12px] text-text-3">{labels.noAdjustments}</p>
                ) : (
                  <div className="divide-y divide-border/60 mb-2">
                    {previewData!.adjustments.map((a) => (
                      <div key={a.id} className="flex items-center justify-between py-1.5 gap-2">
                        <span className="text-[13px]">
                          {a.kind === "bonus" ? labels.kindBonus : a.kind === "overtime" ? labels.kindOvertime : labels.kindDeduction}
                          {" · "}
                          <span className="tabular-nums">{money(a.amount, a.currency, locale)}</span>
                          {a.reason ? <span className="text-text-3"> — {a.reason}</span> : null}
                        </span>
                        <Button
                          variant="ghost"
                          className="min-h-8 text-danger"
                          icon={<Trash2 className="size-3.5" />}
                          onClick={() => removeAdj.mutate(a.id)}
                        />
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid gap-2 sm:grid-cols-4">
                  <Select
                    label={"\u00A0"}
                    value={kind}
                    onChange={(e) => setKind(e.target.value)}
                    options={[
                      { value: "bonus", label: labels.kindBonus },
                      { value: "overtime", label: labels.kindOvertime },
                      { value: "deduction", label: labels.kindDeduction },
                    ]}
                  />
                  <Input label={labels.amount} type="number" value={adjAmount} onChange={(e) => setAdjAmount(e.target.value)} />
                  <Input label={labels.reason} value={adjReason} onChange={(e) => setAdjReason(e.target.value)} />
                  <div className="flex items-end">
                    <Button
                      className="w-full"
                      icon={<Plus className="size-4" />}
                      loading={addAdj.isPending}
                      disabled={!adjAmount || Number(adjAmount) <= 0}
                      onClick={() => addAdj.mutate()}
                    >
                      {labels.addAdjustment}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {showForm ? (
            <div className="rounded-xl border border-brand/30 bg-brand/5 p-4 space-y-3">
              <div className="text-[13px] font-semibold">
                {editing ? labels.editPayslip : labels.addPayslip}
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <Input label={labels.periodStart} type="date" value={form.period_start} onChange={(e) => setForm((f) => ({ ...f, period_start: e.target.value }))} />
                <Input label={labels.periodEnd} type="date" value={form.period_end} onChange={(e) => setForm((f) => ({ ...f, period_end: e.target.value }))} />
                <Input label={labels.currency} value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} />
                <Input label={labels.baseSalary} type="number" value={form.base_salary} onChange={(e) => setForm((f) => ({ ...f, base_salary: e.target.value }))} />
                <Input label={labels.overtime} type="number" value={form.overtime} onChange={(e) => setForm((f) => ({ ...f, overtime: e.target.value }))} />
                <Input label={labels.absence} type="number" value={form.absence} onChange={(e) => setForm((f) => ({ ...f, absence: e.target.value }))} />
                <Input label={labels.bonus} type="number" value={form.bonus} onChange={(e) => setForm((f) => ({ ...f, bonus: e.target.value }))} />
                <Input label={labels.notes} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
                <label className="flex items-center gap-2 text-[13px] pt-6">
                  <input
                    type="checkbox"
                    checked={form.mark_paid}
                    onChange={(e) => setForm((f) => ({ ...f, mark_paid: e.target.checked }))}
                  />
                  {labels.markPaid}
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button loading={saveMut.isPending} onClick={() => saveMut.mutate()}>
                  {labels.save}
                </Button>
                <Button variant="secondary" onClick={closeForm}>
                  {labels.cancel}
                </Button>
              </div>
            </div>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={labels.payslipList}
          action={
            canManage ? (
              <Button variant="secondary" className="min-h-9" icon={<Plus className="size-3.5" />} onClick={openCreate}>
                {labels.addPayslip}
              </Button>
            ) : null
          }
        />
        <CardBody className="overflow-x-auto p-0">
          {data.payslips.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-text-3">{labels.payslipEmpty}</p>
          ) : (
            <table className="min-w-full text-[13px]">
              <thead>
                <tr className="border-b border-border bg-surface-2/40 text-[11px] uppercase tracking-wide text-text-3">
                  <th className="px-4 py-3 text-start font-medium">{labels.voucherId}</th>
                  <th className="px-4 py-3 text-start font-medium">{labels.voucherPeriod}</th>
                  <th className="px-4 py-3 text-start font-medium">{labels.baseSalary}</th>
                  <th className="px-4 py-3 text-start font-medium">{labels.overtime}</th>
                  <th className="px-4 py-3 text-start font-medium">{labels.absence}</th>
                  <th className="px-4 py-3 text-start font-medium">{labels.bonus}</th>
                  <th className="px-4 py-3 text-start font-medium">{labels.voucherAmount}</th>
                  <th className="px-4 py-3 text-start font-medium">{labels.voucherStatus}</th>
                  {canManage ? <th className="px-4 py-3 text-start font-medium">{labels.actions}</th> : null}
                </tr>
              </thead>
              <tbody>
                {data.payslips.map((p) => {
                  const isPaid = p.paid || p.status === "paid";
                  return (
                    <tr key={p.id} className="border-b border-border/70 last:border-0">
                      <td className="px-4 py-3 font-mono text-[12.5px] font-semibold">
                        {p.daftra_id || p.code.replace(/^(DFT-PS-|LOC-PS-)/, "") || p.id}
                      </td>
                      <td className="px-4 py-3 text-text-2 whitespace-nowrap">
                        {formatDate(p.period_start, "DD/MM/YYYY")} – {formatDate(p.period_end, "DD/MM/YYYY")}
                      </td>
                      <td className="px-4 py-3 tabular-nums">{formatNumber(p.base_salary ?? 0)}</td>
                      <td className="px-4 py-3 tabular-nums">{formatNumber(p.overtime ?? 0)}</td>
                      <td className="px-4 py-3 tabular-nums text-danger">{formatNumber(p.absence ?? 0)}</td>
                      <td className="px-4 py-3 tabular-nums">{formatNumber(p.bonus ?? 0)}</td>
                      <td className="px-4 py-3 font-semibold tabular-nums">
                        {money(p.net_pay, p.currency, locale)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={isPaid ? "success" : "warning"}>
                          {isPaid ? labels.paid : p.status === "draft" ? labels.draftStatus : labels.unpaid}
                        </Badge>
                        {p.source ? (
                          <div className="mt-0.5 text-[10px] text-text-3">{p.source}</div>
                        ) : null}
                      </td>
                      {canManage ? (
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            <Button variant="ghost" className="min-h-8 px-2" icon={<Pencil className="size-3.5" />} onClick={() => openEdit(p)} />
                            {!isPaid ? (
                              <Button
                                variant="ghost"
                                className="min-h-8 px-2 text-success"
                                icon={<CheckCircle2 className="size-3.5" />}
                                onClick={() => confirmMut.mutate(p.id)}
                              />
                            ) : (
                              <Button
                                variant="ghost"
                                className="min-h-8 px-2"
                                icon={<Clock3 className="size-3.5" />}
                                onClick={() => unpayMut.mutate(p.id)}
                                title={labels.unpay}
                              />
                            )}
                            <Button
                              variant="ghost"
                              className="min-h-8 px-2 text-danger"
                              icon={<Trash2 className="size-3.5" />}
                              onClick={() => {
                                if (window.confirm(labels.confirmDelete)) removeMut.mutate(p.id);
                              }}
                            />
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function StatBox({
  label,
  value,
  tone = "text-text",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3 shadow-soft">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-text-3">
        <Wallet className={cn("size-3.5", tone)} />
        {label}
      </div>
      <div className={cn("mt-1.5 truncate text-[1.05rem] font-semibold tabular-nums", tone)}>{value}</div>
    </div>
  );
}
