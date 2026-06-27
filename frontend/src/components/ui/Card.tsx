import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type CardProps = HTMLAttributes<HTMLDivElement> & { glass?: boolean };

export function Card({ glass, className, ...rest }: CardProps) {
  return <div className={cn(glass ? "glass rounded-2xl" : "card", className)} {...rest} />;
}

interface CardHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, action, className }: CardHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4 px-5 pt-5", className)}>
      <div className="min-w-0">
        <h3 className="text-base font-semibold tracking-tight text-text truncate">{title}</h3>
        {subtitle ? <p className="mt-0.5 min-w-0 text-[13px] text-text-2 break-words">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function CardBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...rest} />;
}

export function CardFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-5 py-3 border-t border-border/70 bg-surface-2/40 rounded-b-2xl",
        className
      )}
      {...rest}
    />
  );
}
