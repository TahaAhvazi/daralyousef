import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";

import { customersApi } from "@/api/modules";
import { cn } from "@/lib/cn";
import { useT } from "@/i18n/useT";

function useDebounced<T>(value: T, ms = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setV(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function CustomerSearchSelect({
  value,
  onChange,
  className,
  disabled,
  placeholder,
}: {
  value: string;
  onChange: (customerId: string) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}) {
  const { t } = useT();
  const searchPh = placeholder ?? t.staffUi.dashboard.searchCustomers;
  const noResults = t.staffUi.common.noResults;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQ = useDebounced(query.trim(), 280);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isFetching } = useQuery({
    queryKey: ["customers", "search-pick", debouncedQ],
    queryFn: () =>
      customersApi.list({
        page: 1,
        page_size: 40,
        ...(debouncedQ ? { q: debouncedQ } : {}),
      }),
    enabled: open,
    staleTime: 30_000,
  });

  const { data: selectedCustomer } = useQuery({
    queryKey: ["customers", "by-id", value],
    queryFn: () => customersApi.get(Number(value)),
    enabled: !!value && Number.isFinite(Number(value)),
    staleTime: 60_000,
  });

  const items = data?.items ?? [];

  const selectedLabel = useMemo(() => {
    if (!value) return "";
    const fromList = items.find((c) => String(c.id) === value);
    const c = fromList ?? selectedCustomer;
    if (!c) return `#${value}`;
    return c.code ? `${c.full_name} · ${c.code}` : c.full_name;
  }, [value, items, selectedCustomer]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "input mt-1 flex w-full items-center gap-2 text-start",
          !value && "text-text-3",
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="min-w-0 flex-1 truncate">{value ? selectedLabel : "—"}</span>
        <span className="flex shrink-0 items-center gap-1">
          {value ? (
            <span
              role="button"
              tabIndex={-1}
              className="rounded p-0.5 text-text-3 hover:bg-surface-2 hover:text-text"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange("");
                }
              }}
              aria-label="Clear"
            >
              <X className="size-3.5" />
            </span>
          ) : null}
          <ChevronsUpDown className="size-4 text-text-3" />
        </span>
      </button>

      {open ? (
        <div className="absolute z-[60] mt-1 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-medium">
          <div className="relative border-b border-border/70 p-2">
            <Search className="pointer-events-none absolute start-4 top-1/2 size-3.5 -translate-y-1/2 text-text-3" />
            <input
              ref={inputRef}
              className="input !h-9 !ps-8 !text-[13px]"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPh}
              autoComplete="off"
            />
          </div>
          <ul className="max-h-56 overflow-y-auto overscroll-contain py-1" role="listbox">
            {items.length === 0 ? (
              <li className="px-3 py-6 text-center text-[12.5px] text-text-3">
                {isFetching ? "…" : noResults}
              </li>
            ) : (
              items.map((c) => {
                const selected = String(c.id) === value;
                return (
                  <li key={c.id} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2.5 text-start text-[13px] transition-colors hover:bg-surface-2",
                        selected && "bg-brand/8 text-brand",
                      )}
                      onClick={() => {
                        onChange(String(c.id));
                        setOpen(false);
                      }}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{c.full_name}</span>
                        <span className="mt-0.5 flex flex-wrap gap-x-2 text-[11px] text-text-3">
                          {c.code ? <span className="font-mono">{c.code}</span> : null}
                          {c.phone ? <span>{c.phone}</span> : null}
                          {!c.phone && c.email ? <span className="truncate">{c.email}</span> : null}
                        </span>
                      </span>
                      {selected ? <Check className="size-3.5 shrink-0" /> : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
