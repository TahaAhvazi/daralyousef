import type { Theme } from "@/store/theme";

import { ORDER_STATUSES } from "@/lib/orderStatuses";

/**
 * One distinct hue per order lifecycle status — tuned for dark surfaces.
 * Keep neighbours in the workflow visually far apart (e.g. awaiting vs paid).
 */
const ORDER_STATUS_COLORS: Record<Theme, Record<string, string>> = {
  light: {
    draft: "#9CA3AF",
    pending_review: "#7C3AED",
    awaiting_customer: "#EA580C",
    customer_approved: "#0D9488",
    confirmed: "#2563EB",
    paid: "#059669",
    in_production: "#0891B2",
    delivered: "#65A30D",
    closed: "#4F46E5",
    cancelled: "#DC2626",
    // legacy / workflow extras
    qa: "#D97706",
    ready: "#DB2777",
  },
  dark: {
    draft: "#9CA3AF",
    pending_review: "#A78BFA",
    awaiting_customer: "#FB923C",
    customer_approved: "#2DD4BF",
    confirmed: "#60A5FA",
    paid: "#34D399",
    in_production: "#22D3EE",
    delivered: "#A3E635",
    closed: "#818CF8",
    cancelled: "#F87171",
    qa: "#FBBF24",
    ready: "#F472B6",
  },
};

/** Extra distinct colours when an unknown status appears in chart data. */
const CHART_DISTINCT_PALETTE: Record<Theme, string[]> = {
  light: [
    "#2563EB",
    "#EA580C",
    "#059669",
    "#DB2777",
    "#7C3AED",
    "#D97706",
    "#0891B2",
    "#DC2626",
    "#65A30D",
    "#4F46E5",
    "#0D9488",
    "#E11D48",
  ],
  dark: [
    "#60A5FA",
    "#FB923C",
    "#34D399",
    "#F472B6",
    "#A78BFA",
    "#FBBF24",
    "#22D3EE",
    "#F87171",
    "#A3E635",
    "#818CF8",
    "#2DD4BF",
    "#FB7185",
  ],
};

/** Stable index per known status so colours stay consistent across refreshes. */
const STATUS_INDEX = new Map(ORDER_STATUSES.map((s, i) => [s, i]));

export function orderStatusChartColor(theme: Theme, status: string, index = 0): string {
  const mapped = ORDER_STATUS_COLORS[theme][status];
  if (mapped) return mapped;

  const stableIndex = STATUS_INDEX.get(status as (typeof ORDER_STATUSES)[number]) ?? index;
  const palette = CHART_DISTINCT_PALETTE[theme];
  return palette[stableIndex % palette.length];
}

export function revenueChartColor(theme: Theme): { stroke: string; fill: string } {
  return theme === "dark"
    ? { stroke: "#34D399", fill: "#10B981" }
    : { stroke: "#2563EB", fill: "#3B82F6" };
}

export function chartAxisColor(): string {
  return "rgb(var(--text-3))";
}

export function chartLegendColor(): string {
  return "rgb(var(--text-2))";
}
