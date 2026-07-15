import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  full?: boolean;
  size?: "sm" | "md" | "lg";
}

const VARIANT: Record<Variant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  danger: "btn-danger",
};

const SIZE = {
  sm: "h-8 px-3 text-xs rounded-lg",
  md: "h-9 px-3.5 text-[13.5px] rounded-[10px]",
  lg: "h-11 px-5 text-sm rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", loading, icon, iconRight, full, size = "md", className, children, disabled, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={loading || disabled}
      className={cn(
        "btn focus-ring",
        VARIANT[variant],
        SIZE[size],
        full && "w-full",
        (loading || disabled) && "opacity-60 cursor-not-allowed pointer-events-none",
        className
      )}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children ? <span className="whitespace-nowrap">{children}</span> : null}
      {iconRight}
    </button>
  );
});
