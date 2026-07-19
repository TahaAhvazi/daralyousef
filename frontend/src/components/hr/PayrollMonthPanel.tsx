import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Plus, Trash2, Wallet } from "lucide-react";
import toast from "react-hot-toast";

import { hrApi } from "@/api/modules";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatNumber } from "@/lib/format";

type Labels = {
  thisMonth: string;
  thisMonthSub: string;
  baseSalary: string;
  dailyRate: string;
  absentDays: string;
  absenceDeduction: string;
  overtime: string;
  bonus: string;
  extraDeduction: string;
  gross: string;
  net: string;
  adjustments: string;
  addAdjustment: string;
  amount: string;
  reason: string;
  kindBonus: string;
  kindDeduction: string;
  kindOvertime: string;
  generateDraft: string;
  confirmPaid: string;
  draftStatus: string;
  paidStatus: string;
  saved: string;
  saveFailed: string;
  noAdjustments: string;
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

export function PayrollMonthPanel({
  employeeId,
  canManage,
  labels,
  locale,
}: {
  employeeId: number;
  canManage: boolean;
  labels: Labels;
  locale: string;
}) {
  const qc = useQueryClient();
  const now = new Date();
  const [year] = useState(now.getFullYear());
  const [month] = useState(now.getMonth() + 1);
  const [kind, setKind] = useState("bonus");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["hr.payslipPreview", employeeId, year, month],
    queryFn: () => hrApi.payslipPreview(employeeId, { year, month }),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["hr.payslipPreview", employeeId] });
    qc.invalidateQueries({ queryKey: ["hr.employee", employeeId] });
  };

  const addAdj = useMutation({
    mutationFn: () =>
      hrApi.createAdjustment(employeeId, {
        period_year: year,
        period_month: month,
        kind,
        amount: Number(amount),
        currency: data?.currency || "IQD",
        reason: reason || undefined,
      }),
    onSuccess: () => {
      toast.success(labels.saved);
      setAmount("");
      setReason("");
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

  const draft = useMutation({
    mutationFn: () => hrApi.createPayslipDraft(employeeId, { year, month }),
    onSuccess: () => {
      toast.success(labels.saved);
      invalidate();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.error?.message || labels.saveFailed),
  });

  const confirm = useMutation({
    mutationFn: (payslipId: number) => hrApi.confirmPayslip(payslipId),
    onSuccess: () => {
      toast.success(labels.saved);
      invalidate();
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.error?.message || labels.saveFailed),
  });

  if (isLoading || !data) {
    return <Skeleton className="h-48 w-full" />;
  }

  const currency = data.currency || "IQD";
  const slip = data.draft_payslip;
  const isPaid = slip?.status === "paid" || slip?.paid;

  const rows = [
    { label: labels.baseSalary, value: money(data.base_salary, currency, locale) },
    { label: labels.dailyRate, value: money(data.daily_rate, currency, locale) },
    { label: labels.absentDays, value: formatNumber(data.absent_days) },
    { label: labels.absenceDeduction, value: money(data.absence_deduction, currency, locale), danger: true },
    { label: labels.overtime, value: money(data.overtime, currency, locale) },
    { label: labels.bonus, value: money(data.bonus, currency, locale) },
    { label: labels.extraDeduction, value: money(data.extra_deduction, currency, locale), danger: true },
    { label: labels.gross, value: money(data.gross_pay, currency, locale) },
    { label: labels.net, value: money(data.net_pay, currency, locale), strong: true },
  ];

  return (
    <Card>
      <CardHeader
        title={labels.thisMonth}
        subtitle={labels.thisMonthSub}
        action={
          slip ? (
            <Badge variant={isPaid ? "success" : "warning"}>
              {isPaid ? labels.paidStatus : labels.draftStatus}
            </Badge>
          ) : null
        }
      />
      <CardBody className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <div
              key={r.label}
              className={`rounded-xl bg-surface-2/30 px-3 py-2 ${r.strong ? "ring-1 ring-brand/30 bg-brand/5" : ""}`}
            >
              <div className="text-[11px] text-text-3">{r.label}</div>
              <div className={`mt-0.5 text-[14px] font-semibold tabular-nums ${r.danger ? "text-danger" : "text-text"}`}>
                {r.value}
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="mb-2 text-[13px] font-semibold">{labels.adjustments}</div>
          {data.adjustments.length === 0 ? (
            <p className="text-[12px] text-text-3">{labels.noAdjustments}</p>
          ) : (
            <div className="divide-y divide-border/70">
              {data.adjustments.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-2 py-2">
                  <div>
                    <div className="text-[13px] font-medium">
                      {a.kind === "bonus"
                        ? labels.kindBonus
                        : a.kind === "overtime"
                          ? labels.kindOvertime
                          : labels.kindDeduction}
                      {" · "}
                      <span className="tabular-nums">{money(a.amount, a.currency, locale)}</span>
                    </div>
                    {a.reason ? <div className="text-[12px] text-text-3">{a.reason}</div> : null}
                  </div>
                  {canManage && !isPaid ? (
                    <Button
                      variant="ghost"
                      className="min-h-8 text-danger"
                      icon={<Trash2 className="size-3.5" />}
                      loading={removeAdj.isPending}
                      onClick={() => removeAdj.mutate(a.id)}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        {canManage && !isPaid ? (
          <div className="grid gap-2 rounded-xl border border-border/70 bg-surface-2/20 p-3 sm:grid-cols-4">
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
            <Input
              label={labels.amount}
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Input
              label={labels.reason}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="flex items-end">
              <Button
                className="w-full"
                icon={<Plus className="size-4" />}
                loading={addAdj.isPending}
                disabled={!amount || Number(amount) <= 0}
                onClick={() => addAdj.mutate()}
              >
                {labels.addAdjustment}
              </Button>
            </div>
          </div>
        ) : null}

        {canManage ? (
          <div className="flex flex-wrap gap-2">
            {!isPaid ? (
              <Button
                icon={<Wallet className="size-4" />}
                loading={draft.isPending}
                onClick={() => draft.mutate()}
              >
                {labels.generateDraft}
              </Button>
            ) : null}
            {slip && !isPaid ? (
              <Button
                variant="secondary"
                icon={<CheckCircle2 className="size-4" />}
                loading={confirm.isPending}
                onClick={() => confirm.mutate(slip.id)}
              >
                {labels.confirmPaid}
              </Button>
            ) : null}
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
