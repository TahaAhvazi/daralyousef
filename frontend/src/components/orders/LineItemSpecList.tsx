import { formatLineItemSpecs } from "@/lib/productOptions";
import { useT } from "@/i18n/useT";

export function LineItemSpecList({
  spec,
  className = "",
}: {
  spec?: Record<string, string> | null;
  className?: string;
}) {
  const { locale, t } = useT();
  const entries = formatLineItemSpecs(spec, locale, t.staffUi.catalogOptions);
  if (entries.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`.trim()}>
      {entries.map(({ label, value }) => (
        <span key={`${label}:${value}`} className="badge badge-brand text-[10px] font-normal">
          {label}: {value}
        </span>
      ))}
    </div>
  );
}

export function LineItemHeading({
  name,
  quantity,
  unit,
  spec,
  description,
}: {
  name: string;
  quantity?: number;
  unit?: string;
  spec?: Record<string, string> | null;
  description?: string | null;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[13px] font-medium truncate">{name}</div>
      {quantity != null && unit ? (
        <p className="text-[11.5px] text-text-3 mt-0.5 tabular-nums">
          {quantity} {unit}
        </p>
      ) : null}
      {description ? (
        <p className="text-[11px] text-text-3 mt-0.5 line-clamp-2">{description}</p>
      ) : null}
      <LineItemSpecList spec={spec} className="mt-1.5" />
    </div>
  );
}
