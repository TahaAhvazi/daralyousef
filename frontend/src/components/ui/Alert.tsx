import type { ReactNode } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

import { cn } from "@/lib/cn";

type AlertVariant = "success" | "warning" | "danger" | "info";

const ICONS: Record<AlertVariant, typeof Info> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertCircle,
  info: Info,
};

const VARIANT_CLASS: Record<AlertVariant, string> = {
  success: "alert alert-success",
  warning: "alert alert-warning",
  danger: "alert alert-danger",
  info: "alert alert-info",
};

export function Alert({
  variant = "info",
  title,
  children,
  icon,
  onDismiss,
  className,
}: {
  variant?: AlertVariant;
  title?: ReactNode;
  children?: ReactNode;
  icon?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}) {
  const Icon = ICONS[variant];
  return (
    <div className={cn(VARIANT_CLASS[variant], className)} role="alert">
      <span className="mt-0.5 shrink-0 opacity-90" aria-hidden>
        {icon ?? <Icon className="size-4" />}
      </span>
      <div className="min-w-0 flex-1">
        {title ? <div className="font-semibold text-text mb-0.5">{title}</div> : null}
        {children ? <div className="text-text-2">{children}</div> : null}
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="btn btn-ghost h-7 w-7 shrink-0 p-0 self-start"
          aria-label="Dismiss"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
