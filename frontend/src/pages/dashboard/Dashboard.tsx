import { useQuery } from "@tanstack/react-query";
import type { ComponentType, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Activity, AlertTriangle, ArrowUpRight, Boxes, CheckCircle2, Clock, FileWarning, TrendingUp, Users, Zap } from "lucide-react";
import {
  Area, AreaChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

import { dashboardApi } from "@/api/modules";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatCard } from "@/components/ui/StatCard";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { formatMoney, formatNumber, fromNow } from "@/lib/format";
import {
  chartAxisColor,
  chartLegendColor,
  orderStatusChartColor,
  revenueChartColor,
} from "@/lib/chartColors";
import { useT } from "@/i18n/useT";
import { useThemeStore } from "@/store/theme";
import { staffBreadcrumbs } from "@/lib/breadcrumbs";

// Backend returns English KPI labels; map them to translation keys
const KPI_LABEL_MAP: Record<string, { labelKey: keyof ReturnType<typeof getKpiDict>; hintKey: keyof ReturnType<typeof getKpiDict> }> = {
  "Revenue Today": { labelKey: "revenueToday", hintKey: "revenueTodayHint" },
  "Revenue MTD": { labelKey: "revenueMTD", hintKey: "revenueMTDHint" },
  "Active Orders": { labelKey: "activeOrders", hintKey: "activeHint" },
  "Delayed Orders": { labelKey: "delayedOrders", hintKey: "delayedHint" },
  "Online Now": { labelKey: "onlineNow", hintKey: "onlineHint" },
  "Pending Approvals": { labelKey: "pendingApprovals", hintKey: "pendingHint" },
};

function getKpiDict(t: ReturnType<typeof useT>["t"]) {
  return t.staffUi.dashboard.kpis;
}

export default function DashboardPage() {
  const { t } = useT();
  const location = useLocation();
  const theme = useThemeStore((s) => s.theme);
  const revenueColors = revenueChartColor(theme);
  const axisColor = chartAxisColor();
  const legendColor = chartLegendColor();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard.summary"],
    queryFn: dashboardApi.summary,
    refetchInterval: 15000,
  });

  if (isLoading || !data) return <DashboardSkeleton />;

  const revenueToday = data.kpis.find((k) => k.label === "Revenue Today");
  const revenueMTD = data.kpis.find((k) => k.label === "Revenue MTD");
  const kpiDict = getKpiDict(t);
  const tDash = t.staffUi.dashboard;
  const breadcrumbs = staffBreadcrumbs(location.pathname, t.staffUi.nav, {
    notifications: t.staffUi.topbar.notifications,
  });

  const translateStatus = (s: string) =>
    t.portalUi.statuses[s] ?? s.replace(/_/g, " ");

  return (
    <div className="page-shell space-y-6">
      <PageHeader
        title={tDash.title}
        description={tDash.description}
        breadcrumbs={breadcrumbs}
        actions={
          <span className="badge badge-brand">
            <Activity className="size-3" /> {t.staffUi.common.autoRefresh}
          </span>
        }
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(11.5rem,1fr))] gap-3 sm:gap-4">
        {data.kpis.map((k) => {
          const m = KPI_LABEL_MAP[k.label];
          const label = m ? kpiDict[m.labelKey] : k.label;
          const hint = m && k.hint ? kpiDict[m.hintKey] : k.hint;
          return (
            <StatCard
              key={k.label}
              label={label}
              value={
                k.currency
                  ? formatMoney(k.value, k.currency)
                  : formatNumber(k.value)
              }
              hint={hint}
              tone={kpiTone(k.label)}
              icon={<KpiIcon label={k.label} />}
            />
          );
        })}
      </div>

      {/* Operational alerts — compact row next to KPIs */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        <DashboardAlertCard
          title={tDash.lowStockTitle}
          subtitle={tDash.lowStockSub}
          icon={AlertTriangle}
          tone="warning"
          count={data.low_stock.length}
          isEmpty={data.low_stock.length === 0}
          emptyText={tDash.lowStockOk}
        >
          {data.low_stock.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-2 text-[12.5px]">
              <div className="min-w-0">
                <div className="font-medium truncate">{m.name}</div>
                <div className="text-[11px] text-text-3 truncate">{m.sku}</div>
              </div>
              <span className="badge badge-warning shrink-0">
                <Boxes className="size-3" />
                {m.on_hand}/{m.reorder_level}
              </span>
            </div>
          ))}
        </DashboardAlertCard>

        <DashboardAlertCard
          title={tDash.overdueTitle}
          subtitle={tDash.overdueSub}
          icon={FileWarning}
          tone="danger"
          count={data.overdue_invoices.length}
          isEmpty={data.overdue_invoices.length === 0}
          emptyText={tDash.overdueOk}
        >
          {data.overdue_invoices.map((i) => (
            <div key={i.id} className="flex items-center justify-between gap-2 text-[12.5px]">
              <div className="min-w-0">
                <div className="font-medium truncate">{i.code}</div>
                <div className="text-[11px] text-text-3">{tDash.due} {i.due_date}</div>
              </div>
              <span className="badge badge-danger shrink-0">
                {formatMoney(i.balance, i.currency)}
              </span>
            </div>
          ))}
        </DashboardAlertCard>

        <DashboardAlertCard
          title={tDash.approvalsTitle}
          subtitle={tDash.approvalsSub}
          icon={Clock}
          tone="accent"
          count={data.pending_approvals.length}
          isEmpty={data.pending_approvals.length === 0}
          emptyText={tDash.noApprovals}
        >
          {data.pending_approvals.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-2 text-[12.5px]">
              <div className="min-w-0">
                <div className="font-medium truncate">
                  {a.title ?? `${tDash.revisionPrefix}${a.version}`}
                </div>
                <div className="text-[11px] text-text-3">{tDash.orderNumber}{a.order_id}</div>
              </div>
              <Badge variant="accent" className="shrink-0">v{a.version}</Badge>
            </div>
          ))}
        </DashboardAlertCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Revenue trend */}
        <Card className="lg:col-span-2">
          <CardHeader
            title={tDash.revenueTitle}
            subtitle={tDash.revenueSubtitle
              .replace("{today}", formatMoney(revenueToday?.value ?? 0))
              .replace("{mtd}", formatMoney(revenueMTD?.value ?? 0))}
            action={<span className="badge badge-success"><TrendingUp className="size-3" /> {tDash.paid}</span>}
          />
          <CardBody>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.revenue_series} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor={revenueColors.fill} stopOpacity={theme === "dark" ? 0.55 : 0.4} />
                      <stop offset="100%" stopColor={revenueColors.fill} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="t" tick={{ fontSize: 11, fill: axisColor }} stroke={axisColor} />
                  <YAxis tick={{ fontSize: 11, fill: axisColor }} stroke={axisColor} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 10, background: "rgb(var(--surface))",
                      border: "1px solid rgb(var(--border))", fontSize: 12,
                      color: "rgb(var(--text))",
                    }}
                    formatter={(v: any) => formatMoney(Number(v))}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={revenueColors.stroke}
                    fill="url(#rev)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        {/* Orders by status */}
        <Card>
          <CardHeader title={tDash.ordersByStatusTitle} subtitle={tDash.ordersByStatusSub} />
          <CardBody>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.orders_by_status.map((s) => ({ ...s, label: translateStatus(s.status) }))}
                    dataKey="count"
                    nameKey="label"
                    innerRadius={55}
                    outerRadius={88}
                    paddingAngle={2}
                  >
                    {data.orders_by_status.map((s, i) => (
                      <Cell key={s.status} fill={orderStatusChartColor(theme, s.status, i)} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 10, background: "rgb(var(--surface))",
                      border: "1px solid rgb(var(--border))", fontSize: 12,
                      color: "rgb(var(--text))",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, color: legendColor }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {/* Online users */}
        <Card>
          <CardHeader title={tDash.onlineTitle} subtitle={tDash.onlineSub} action={<Badge variant="brand">{data.online_users.length}</Badge>} />
          <CardBody className="space-y-2.5">
            {data.online_users.length === 0 ? (
              <p className="text-[13px] text-text-3">{tDash.nobodyOnline}</p>
            ) : (
              data.online_users.map((u) => (
                <div key={u.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-full bg-grad-brand grid place-items-center text-white text-[11px] font-semibold">
                      {u.full_name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                    </div>
                    <div>
                      <div className="text-[13px] font-medium">{u.full_name}</div>
                      <div className="text-[11px] text-text-3">{u.department ?? t.common.none}</div>
                    </div>
                  </div>
                  <span className="text-[11px] text-text-3">{fromNow(u.last_seen_at)}</span>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        {/* Activity feed */}
        <Card>
          <CardHeader title={tDash.liveActivityTitle} subtitle={tDash.liveActivitySub} action={<Zap className="size-4 text-warning" />} />
          <CardBody className="space-y-3">
            {data.activity_feed.length === 0 ? (
              <p className="text-[13px] text-text-3">{tDash.noActivity}</p>
            ) : (
              data.activity_feed.map((a) => (
                <div key={a.id} className="flex items-start gap-3">
                  <div className="mt-0.5 size-7 grid place-items-center rounded-md bg-surface-2 text-text-2">
                    <CheckCircle2 className="size-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate">{a.summary}</div>
                    <div className="text-[11px] text-text-3">{fromNow(a.occurred_at)}</div>
                  </div>
                  <Badge variant="default">{a.module}</Badge>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        {/* Department load */}
        <Card>
          <CardHeader title={tDash.deptLoadTitle} subtitle={tDash.deptLoadSub} />
          <CardBody className="space-y-2.5">
            {data.department_load.length === 0 ? (
              <p className="text-[13px] text-text-3">{tDash.noWorkload}</p>
            ) : (
              data.department_load.map((d) => (
                <div key={d.department}>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-medium">{d.department}</span>
                    <span className="text-text-3">
                      {d.active} {tDash.activeLabel} · <span className="text-danger">{d.delayed} {tDash.delayedLabel}</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-surface-2 overflow-hidden">
                    <div className="h-full bg-grad-brand" style={{ width: `${Math.min(100, (d.active / 10) * 100)}%` }} />
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

type AlertTone = "warning" | "danger" | "accent";

const ALERT_TONE_STYLES: Record<AlertTone, { bg: string; text: string; ring: string }> = {
  warning: { bg: "bg-warning/12", text: "text-warning", ring: "ring-warning/25" },
  danger: { bg: "bg-danger/12", text: "text-danger", ring: "ring-danger/25" },
  accent: { bg: "bg-accent/12", text: "text-accent", ring: "ring-accent/25" },
};

function DashboardAlertCard({
  title,
  subtitle,
  icon: Icon,
  tone,
  count,
  isEmpty,
  emptyText,
  children,
}: {
  title: string;
  subtitle: string;
  icon: ComponentType<{ className?: string }>;
  tone: AlertTone;
  count: number;
  isEmpty: boolean;
  emptyText: string;
  children: ReactNode;
}) {
  const styles = ALERT_TONE_STYLES[tone];

  return (
    <Card className={`ring-1 ${styles.ring} ${isEmpty ? "opacity-90" : ""}`}>
      <CardBody className="p-4">
        <div className="flex items-center gap-3">
          <div className={`size-9 shrink-0 rounded-lg grid place-items-center ${styles.bg}`}>
            <Icon className={`size-4 ${styles.text}`} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[13px] font-semibold leading-tight truncate">{title}</h3>
              {!isEmpty ? (
                <span className={`badge shrink-0 ${tone === "danger" ? "badge-danger" : tone === "warning" ? "badge-warning" : "badge-brand"}`}>
                  {count}
                </span>
              ) : null}
            </div>
            <p className="text-[11px] text-text-3 leading-snug mt-0.5 truncate">{subtitle}</p>
          </div>
        </div>

        <div className="mt-3 border-t border-border/60 pt-3">
          {isEmpty ? (
            <p className="flex items-center gap-1.5 text-[12px] text-text-3">
              <CheckCircle2 className="size-3.5 shrink-0 text-success" />
              <span className="truncate">{emptyText}</span>
            </p>
          ) : (
            <div className="space-y-2 max-h-[72px] overflow-y-auto overscroll-contain pr-0.5">
              {children}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

function kpiTone(label: string): "brand" | "success" | "warning" | "danger" | "info" {
  if (label.includes("Revenue")) return "brand";
  if (label.includes("Active")) return "success";
  if (label.includes("Delayed")) return "danger";
  if (label.includes("Online")) return "info";
  return "warning";
}

function KpiIcon({ label }: { label: string }) {
  if (label.includes("Revenue")) return <TrendingUp className="size-5" />;
  if (label.includes("Active")) return <ArrowUpRight className="size-5" />;
  if (label.includes("Delayed")) return <AlertTriangle className="size-5" />;
  if (label.includes("Online")) return <Users className="size-5" />;
  return <Clock className="size-5" />;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(11.5rem,1fr))] gap-3 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card p-5"><Skeleton className="h-3 w-24" /><Skeleton className="mt-3 h-6 w-32" /></div>
        ))}
      </div>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card p-4"><Skeleton className="h-9 w-full" /><Skeleton className="mt-3 h-4 w-3/4" /></div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2"><div className="p-5"><Skeleton className="h-[260px]" /></div></div>
        <div className="card"><div className="p-5"><Skeleton className="h-[260px]" /></div></div>
      </div>
    </div>
  );
}

// reuse to avoid lint warnings
void StatusBadge;
