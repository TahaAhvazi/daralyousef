import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

import { hrApi } from "@/api/modules";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import type { AttendanceMonthDay } from "@/types/api";

const STATUSES = ["present", "absent", "late", "on_leave"] as const;

const STATUS_BG: Record<string, string> = {
  present: "bg-success/15 text-success ring-success/30",
  absent: "bg-danger/15 text-danger ring-danger/30",
  late: "bg-warning/20 text-warning ring-warning/40",
  on_leave: "bg-info/15 text-info ring-info/30",
};

type Labels = {
  title: string;
  markWeekdays: string;
  dailyRate: string;
  save: string;
  notes: string;
  checkIn: string;
  checkOut: string;
  deductionOverride: string;
  clearDay: string;
  statuses: Record<string, string>;
  saved: string;
  saveFailed: string;
};

function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function AttendanceCalendarPanel({
  employeeId,
  canManage,
  labels,
  locale,
  isRtl,
}: {
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
  const [selected, setSelected] = useState<AttendanceMonthDay | null>(null);
  const [form, setForm] = useState({
    status: "present",
    check_in: "",
    check_out: "",
    notes: "",
    deduction_amount: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["hr.attendance", employeeId, year, month],
    queryFn: () => hrApi.attendanceMonth(employeeId, { year, month }),
  });

  const save = useMutation({
    mutationFn: () =>
      hrApi.upsertAttendance(employeeId, {
        date: selected!.date.slice(0, 10),
        status: form.status,
        check_in: form.check_in || null,
        check_out: form.check_out || null,
        notes: form.notes || null,
        deduction_amount:
          form.status === "absent" && form.deduction_amount !== ""
            ? Number(form.deduction_amount)
            : null,
      }),
    onSuccess: () => {
      toast.success(labels.saved);
      qc.invalidateQueries({ queryKey: ["hr.attendance", employeeId] });
      qc.invalidateQueries({ queryKey: ["hr.employee", employeeId] });
      qc.invalidateQueries({ queryKey: ["hr.payslipPreview", employeeId] });
    },
    onError: () => toast.error(labels.saveFailed),
  });

  const bulk = useMutation({
    mutationFn: () => {
      const start = `${year}-${String(month).padStart(2, "0")}-01`;
      const last = new Date(year, month, 0).getDate();
      const end = `${year}-${String(month).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
      return hrApi.bulkAttendance(employeeId, {
        start_date: start,
        end_date: end,
        status: "present",
        weekdays_only: true,
      });
    },
    onSuccess: () => {
      toast.success(labels.saved);
      qc.invalidateQueries({ queryKey: ["hr.attendance", employeeId] });
      qc.invalidateQueries({ queryKey: ["hr.employee", employeeId] });
    },
    onError: () => toast.error(labels.saveFailed),
  });

  const monthLabel = useMemo(() => {
    const d = new Date(year, month - 1, 1);
    return d.toLocaleDateString(locale === "ar" ? "ar" : "en", { month: "long", year: "numeric" });
  }, [year, month, locale]);

  const weekdays = locale === "ar"
    ? ["ن", "ث", "ر", "خ", "ج", "س", "ح"]
    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
    setSelected(null);
  };

  const openDay = (day: AttendanceMonthDay) => {
    setSelected(day);
    setForm({
      status: day.status || "present",
      check_in: day.check_in || "",
      check_out: day.check_out || "",
      notes: day.notes || "",
      deduction_amount: day.deduction_amount != null ? String(day.deduction_amount) : "",
    });
  };

  // Pad grid: first day weekday (Mon=0)
  const padStart = data?.days?.[0]?.weekday ?? 0;
  const cells: Array<AttendanceMonthDay | null> = [
    ...Array.from({ length: padStart }, () => null),
    ...(data?.days ?? []),
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader
          title={labels.title}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="ghost" className="min-h-9 px-2" onClick={() => shiftMonth(-1)}>
                {isRtl ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
              </Button>
              <span className="min-w-[8rem] text-center text-[13px] font-semibold">{monthLabel}</span>
              <Button variant="ghost" className="min-h-9 px-2" onClick={() => shiftMonth(1)}>
                {isRtl ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
              </Button>
              {canManage ? (
                <Button
                  variant="secondary"
                  className="min-h-9 text-[12px]"
                  loading={bulk.isPending}
                  onClick={() => bulk.mutate()}
                >
                  {labels.markWeekdays}
                </Button>
              ) : null}
            </div>
          }
        />
        <CardBody>
          {isLoading || !data ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <>
              <div className="mb-3 flex flex-wrap gap-2 text-[12px] text-text-2">
                <span>
                  {labels.dailyRate}:{" "}
                  <strong className="tabular-nums text-text">
                    {formatNumber(data.daily_rate)} {data.currency}
                  </strong>
                </span>
                {STATUSES.map((s) => (
                  <Badge key={s} variant="default">
                    {labels.statuses[s] ?? s}: {data.counts[s] ?? 0}
                  </Badge>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {weekdays.map((w) => (
                  <div key={w} className="py-1 text-center text-[11px] font-medium text-text-3">
                    {w}
                  </div>
                ))}
                {cells.map((day, i) => {
                  if (!day) return <div key={`pad-${i}`} />;
                  const active = selected?.date === day.date;
                  return (
                    <button
                      key={day.date}
                      type="button"
                      onClick={() => openDay(day)}
                      className={cn(
                        "aspect-square rounded-lg text-[12px] font-medium ring-1 ring-border/60 transition",
                        day.status ? STATUS_BG[day.status] : "bg-surface-2/40 text-text-2 hover:bg-surface-2",
                        active && "ring-2 ring-brand",
                      )}
                    >
                      <div>{day.day}</div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={
            selected
              ? selected.date.slice(0, 10)
              : labels.title
          }
        />
        <CardBody className="space-y-3">
          {!selected ? (
            <p className="py-8 text-center text-sm text-text-3">—</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-1.5">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={!canManage}
                    onClick={() => setForm((f) => ({ ...f, status: s }))}
                    className={cn(
                      "rounded-lg px-2.5 py-1.5 text-[12px] font-medium ring-1 transition",
                      form.status === s ? STATUS_BG[s] : "bg-surface-2/30 text-text-2 ring-border/50",
                      !canManage && "opacity-70",
                    )}
                  >
                    {labels.statuses[s] ?? s}
                  </button>
                ))}
              </div>
              <Input
                label={labels.checkIn}
                value={form.check_in}
                disabled={!canManage}
                placeholder="09:00"
                onChange={(e) => setForm((f) => ({ ...f, check_in: e.target.value }))}
              />
              <Input
                label={labels.checkOut}
                value={form.check_out}
                disabled={!canManage}
                placeholder="17:00"
                onChange={(e) => setForm((f) => ({ ...f, check_out: e.target.value }))}
              />
              <Input
                label={labels.notes}
                value={form.notes}
                disabled={!canManage}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
              {form.status === "absent" ? (
                <Input
                  label={labels.deductionOverride}
                  type="number"
                  value={form.deduction_amount}
                  disabled={!canManage}
                  placeholder={data ? String(data.daily_rate) : ""}
                  onChange={(e) => setForm((f) => ({ ...f, deduction_amount: e.target.value }))}
                />
              ) : null}
              {canManage ? (
                <Button
                  className="w-full"
                  loading={save.isPending}
                  onClick={() => save.mutate()}
                >
                  {labels.save}
                </Button>
              ) : null}
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

// silence unused helper in some builds
void ymd;
