import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FilePenLine,
  LogIn,
  MoreHorizontal,
  Package,
} from "lucide-react";
import dayjs from "dayjs";

import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { useT } from "@/i18n/useT";
import { formatDate, formatNumber } from "@/lib/format";
import type { ActivityFeedItem, LowStockItem, ScheduleItem } from "@/types/api";

export function DashboardOpsPanels({
  schedules,
  schedulesTotal,
  lowStock,
  lowStockTotal,
}: {
  schedules: ScheduleItem[];
  schedulesTotal: number;
  lowStock: LowStockItem[];
  lowStockTotal: number;
}) {
  const { t, locale } = useT();
  const dash = t.staffUi.dashboard;

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <Card className="overflow-hidden">
        <CardHeader
          title={dash.schedulesTitle}
          subtitle={dash.schedulesSub}
          action={
            <div className="flex items-center gap-2">
              <Badge variant="danger">{formatNumber(schedulesTotal)}</Badge>
              <Link to="/app/orders" className="text-[12px] font-semibold text-brand hover:underline">
                {dash.showAll}
              </Link>
            </div>
          }
        />
        <CardBody className="space-y-0 p-0">
          {schedules.length === 0 ? (
            <EmptyRow text={dash.schedulesEmpty} />
          ) : (
            schedules.map((item) => (
              <ScheduleRow key={item.id} item={item} locale={locale} labels={dash} />
            ))
          )}
        </CardBody>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader
          title={dash.lowStockPanelTitle}
          subtitle={dash.lowStockPanelSub}
          action={
            <div className="flex items-center gap-2">
              <Badge variant="danger">{formatNumber(lowStockTotal || lowStock.length)}</Badge>
              <Link to="/app/materials?low_stock=1" className="text-[12px] font-semibold text-brand hover:underline">
                {dash.showAll}
              </Link>
            </div>
          }
        />
        <CardBody className="space-y-0 p-0">
          {lowStock.length === 0 ? (
            <EmptyRow text={dash.lowStockOk} />
          ) : (
            lowStock.map((item) => (
              <LowStockRow key={item.id} item={item} labels={dash} />
            ))
          )}
        </CardBody>
      </Card>
    </section>
  );
}

export function DashboardActivityPanel({ activity }: { activity: ActivityFeedItem[] }) {
  const { t, locale } = useT();
  const dash = t.staffUi.dashboard;
  const [todayOnly, setTodayOnly] = useState(true);

  const filteredActivity = useMemo(() => {
    if (!todayOnly) return activity;
    return activity.filter((item) => dayjs(item.occurred_at).isSame(dayjs(), "day"));
  }, [activity, todayOnly]);

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title={dash.liveActivityTitle}
        subtitle={dash.liveActivitySub}
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTodayOnly((v) => !v)}
              className={`rounded-full px-3 py-1 text-[12px] font-semibold transition-colors focus-ring ${
                todayOnly
                  ? "bg-brand text-white"
                  : "bg-surface-2 text-text-2 hover:bg-surface-3"
              }`}
            >
              {dash.todayFilter}
            </button>
            <Link to="/app/audit" className="text-[12px] font-semibold text-brand hover:underline">
              {dash.showAll}
            </Link>
          </div>
        }
      />
      <CardBody className={filteredActivity.length === 0 ? "py-3" : undefined}>
        {filteredActivity.length === 0 ? (
          <p className="py-2 text-center text-[13px] text-text-3">{dash.noActivity}</p>
        ) : (
          <ol className="relative max-h-[280px] space-y-3 overflow-y-auto overscroll-contain ps-0">
            {filteredActivity.map((item, index) => (
              <ActivityRow
                key={item.id}
                item={item}
                isLast={index === filteredActivity.length - 1}
                locale={locale}
              />
            ))}
          </ol>
        )}
      </CardBody>
    </Card>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 px-5 py-8 text-[13px] text-text-3">
      <CheckCircle2 className="size-4 shrink-0 text-success" />
      {text}
    </div>
  );
}

function ScheduleRow({
  item,
  locale,
  labels,
}: {
  item: ScheduleItem;
  locale: string;
  labels: ReturnType<typeof useT>["t"]["staffUi"]["dashboard"];
}) {
  const dateLabel = formatDate(item.starts_at, locale === "ar" ? "DD/MM/YYYY" : "MMM D, YYYY", locale);
  const start = dayjs(item.starts_at).format("hh:mmA");
  const end = item.ends_at ? dayjs(item.ends_at).format("hh:mmA") : null;
  const kindLabel = item.kind === "follow_up" ? labels.scheduleFollowUp : labels.scheduleOrder;
  const href =
    item.kind === "order_deadline" && item.reference_id
      ? `/app/orders/${item.reference_id}`
      : "/app/orders";

  return (
    <Link
      to={href}
      className="group flex items-stretch gap-3 border-b border-border/70 px-4 py-3 transition-colors last:border-b-0 hover:bg-surface-2/70"
    >
      <span className={`w-1 shrink-0 rounded-full ${item.overdue ? "bg-danger" : "bg-brand"}`} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-text-3">
          <span className="inline-flex items-center gap-1 font-medium text-text-2">
            <CalendarClock className="size-3.5" />
            {dateLabel}
          </span>
          <span>
            {start}
            {end ? ` – ${end}` : ""}
          </span>
          {item.reference_code ? (
            <span className="font-mono text-[11px] text-brand">{item.reference_code}</span>
          ) : null}
        </div>
        <div className="mt-1 truncate text-[13.5px] font-semibold text-text">
          {kindLabel}: {item.title}
        </div>
        <div className="mt-0.5 truncate text-[12px] text-text-3">
          {item.owner_name
            ? labels.scheduleBy.replace("{name}", item.owner_name)
            : item.subtitle || labels.scheduleNoOwner}
        </div>
      </div>
      <span className="grid size-8 shrink-0 place-items-center rounded-lg text-text-3 opacity-0 transition-opacity group-hover:opacity-100">
        <MoreHorizontal className="size-4" />
      </span>
    </Link>
  );
}

function LowStockRow({
  item,
  labels,
}: {
  item: LowStockItem;
  labels: ReturnType<typeof useT>["t"]["staffUi"]["dashboard"];
}) {
  const status =
    item.stock_status === "critical"
      ? { label: labels.stockCritical, className: "badge-danger" }
      : item.stock_status === "low"
        ? { label: labels.stockLow, className: "badge-warning" }
        : { label: labels.stockOk, className: "badge-success" };

  return (
    <Link
      to="/app/materials"
      className="group flex items-center gap-3 border-b border-border/70 px-4 py-3 transition-colors last:border-b-0 hover:bg-surface-2/70"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-warning/10 text-warning">
        <Package className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-semibold">{item.name}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-text-3">
          <span className="font-mono">#{item.id}</span>
          <span className="font-mono">{item.sku}</span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className={`badge ${status.className}`}>{status.label}</span>
        <span className="text-[11px] text-text-3">
          {labels.stockAvailable.replace("{count}", formatNumber(item.on_hand)).replace("{unit}", item.unit)}
        </span>
      </div>
    </Link>
  );
}

function ActivityRow({
  item,
  isLast,
  locale,
}: {
  item: ActivityFeedItem;
  isLast: boolean;
  locale: string;
}) {
  const Icon = activityIcon(item.action, item.module);
  const time = dayjs(item.occurred_at).format("HH:mm:ss");

  return (
    <li className="relative flex gap-3">
      <div className="relative flex w-8 shrink-0 flex-col items-center">
        <span className="grid size-8 place-items-center rounded-full bg-brand/10 text-brand ring-4 ring-surface">
          <Icon className="size-3.5" />
        </span>
        {!isLast ? <span className="mt-1 w-px flex-1 bg-border" /> : null}
      </div>
      <div className="mb-1 min-w-0 flex-1 rounded-xl bg-info/5 px-3 py-2.5 ring-1 ring-border/60">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[13px] leading-snug text-text">{item.summary}</p>
          <time className="shrink-0 text-[11px] font-medium text-text-3" dateTime={item.occurred_at}>
            {time}
          </time>
        </div>
        <div className="mt-1 text-[11px] text-text-3">
          {item.user_name || item.user_email || "system"}
          {locale === "ar" ? " · " : " · "}
          {item.module}
        </div>
      </div>
    </li>
  );
}

function activityIcon(action: string, module: string) {
  const key = `${action}:${module}`.toLowerCase();
  if (key.includes("login") || action === "login") return LogIn;
  if (module === "users" || action.includes("create")) return FilePenLine;
  if (module === "orders") return ClipboardList;
  return CheckCircle2;
}
