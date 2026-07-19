import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useT } from "@/i18n/useT";

type Variant = "default" | "success" | "warning" | "danger" | "brand" | "accent" | "info";

const VARIANTS: Record<Variant, string> = {
  default: "badge",
  success: "badge badge-success",
  warning: "badge badge-warning",
  danger: "badge badge-danger",
  brand: "badge badge-brand",
  accent: "badge badge-accent",
  info: "badge badge-info",
};

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return <span className={cn(VARIANTS[variant], "whitespace-nowrap shrink-0", className)}>{children}</span>;
}

const STATUS_MAP: Record<string, Variant> = {
  draft: "default",
  pending_review: "warning",
  awaiting_customer: "accent",
  customer_approved: "brand",
  confirmed: "brand",
  in_production: "accent",
  qa: "warning",
  ready: "warning",
  delivered: "success",
  closed: "default",
  cancelled: "danger",
  open: "brand",
  in_progress: "warning",
  waiting_customer: "accent",
  resolved: "success",
  paid: "success",
  partial: "warning",
  unpaid: "danger",
  overdue: "danger",
  late: "danger",
  overpaid: "brand",
  accepted: "success",
  rejected: "danger",
  new: "brand",
  contacted: "accent",
  qualified: "warning",
  proposal: "brand",
  won: "success",
  lost: "danger",
};

export function StatusBadge({ status }: { status: string }) {
  const v = STATUS_MAP[status] ?? "default";
  const { t } = useT();
  const label = (t.portalUi.statuses as Record<string, string>)[status] ?? status.replace(/_/g, " ");
  return <Badge variant={v}>{label}</Badge>;
}
