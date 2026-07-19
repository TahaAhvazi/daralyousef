import { forwardRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface FieldShellProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
  wrapperClassName?: string;
  required?: boolean;
  children: ReactNode;
}

export function FieldShell({
  label, hint, error, className, wrapperClassName, required, children,
}: FieldShellProps) {
  return (
    <div className={cn("min-w-0", wrapperClassName)}>
      <label className={cn("block w-full", className)}>
        {label ? (
          <span className="mb-1.5 block text-[12.5px] font-medium text-text-2">
            {label}
            {required ? <span className="ms-0.5 text-danger">*</span> : null}
          </span>
        ) : null}
        {children}
        {error ? (
          <span className="mt-1 block text-[12px] text-danger">{error}</span>
        ) : hint ? (
          <span className="mt-1 block text-[12px] text-text-3">{hint}</span>
        ) : null}
      </label>
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, iconLeft, iconRight, className, wrapperClassName, ...rest },
  ref
) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={rest.required} wrapperClassName={wrapperClassName}>
      <div className="relative">
        {iconLeft ? (
          <span className="pointer-events-none absolute inset-y-0 start-3 z-[1] grid w-5 place-items-center text-text-3">
            {iconLeft}
          </span>
        ) : null}
        <input
          ref={ref}
          className={cn(
            "input text-[13.5px] font-medium",
            iconLeft && "input-icon-start",
            iconRight && "input-icon-end",
            !iconLeft && !iconRight && "tabular-nums",
            error ? "border-danger focus:border-danger focus:!shadow-[0_0_0_4px_rgb(239_68_68_/_0.15)]" : "",
            className
          )}
          {...rest}
        />
        {iconRight ? (
          <span className="absolute inset-y-0 end-3 z-[1] grid w-5 place-items-center text-text-3">
            {iconRight}
          </span>
        ) : null}
      </div>
    </FieldShell>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  wrapperClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, wrapperClassName, ...rest },
  ref
) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={rest.required} wrapperClassName={wrapperClassName}>
      <textarea ref={ref} className={cn("input text-[13.5px]", className)} {...rest} />
    </FieldShell>
  );
});

interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  wrapperClassName?: string;
  options: { value: string | number; label: string }[];
}

export function Select({
  label, hint, error, options, className, wrapperClassName, ...rest
}: SelectProps) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={rest.required} wrapperClassName={wrapperClassName}>
      <select
        className={cn(
          "input min-w-0 w-full truncate text-[13.5px] font-medium text-text",
          className,
        )}
        {...(rest as any)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
