import type { Locale } from "@/i18n/config";
import type { Product } from "@/types/api";

export interface ProductOptionChoice {
  value: string;
  label: string;
}

export interface ProductOptionGroup {
  key: string;
  label: string;
  choices: ProductOptionChoice[];
}

type CatalogOptionsI18n = {
  attrs: Record<string, string>;
  values: Record<string, string>;
  breakdown: Record<string, string>;
};

type StructuredOptionMeta = {
  values?: string[];
  label_en?: string;
  label_ar?: string;
  labels?: Record<string, { en?: string; ar?: string } | string>;
};

function humanizeToken(token: string): string {
  return token
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function resolveValueLabel(
  attr: string,
  value: string,
  locale: Locale,
  i18n: CatalogOptionsI18n,
): string {
  return (
    i18n.values[`${attr}.${value}`]
    ?? i18n.values[value]
    ?? humanizeToken(value)
  );
}

function resolveAttrLabel(
  attr: string,
  locale: Locale,
  i18n: CatalogOptionsI18n,
  meta?: StructuredOptionMeta,
): string {
  if (meta) {
    const fromMeta = locale === "ar" ? meta.label_ar : meta.label_en;
    if (fromMeta) return fromMeta;
  }
  return i18n.attrs[attr] ?? humanizeToken(attr);
}

function resolveEmbeddedValueLabel(
  value: string,
  locale: Locale,
  meta?: StructuredOptionMeta,
): string | undefined {
  const entry = meta?.labels?.[value];
  if (!entry) return undefined;
  if (typeof entry === "string") return entry;
  return locale === "ar" ? entry.ar ?? entry.en : entry.en ?? entry.ar;
}

function parseLegacyOption(
  attr: string,
  values: string[],
  locale: Locale,
  i18n: CatalogOptionsI18n,
): ProductOptionGroup {
  return {
    key: attr,
    label: resolveAttrLabel(attr, locale, i18n),
    choices: values.map((value) => ({
      value,
      label: resolveValueLabel(attr, value, locale, i18n),
    })),
  };
}

function parseStructuredOption(
  attr: string,
  meta: StructuredOptionMeta,
  locale: Locale,
  i18n: CatalogOptionsI18n,
): ProductOptionGroup | null {
  const values = meta.values ?? [];
  if (values.length === 0) return null;

  return {
    key: attr,
    label: resolveAttrLabel(attr, locale, i18n, meta),
    choices: values.map((value) => ({
      value,
      label:
        resolveEmbeddedValueLabel(value, locale, meta)
        ?? resolveValueLabel(attr, value, locale, i18n),
    })),
  };
}

/** Normalize product.options into localized select groups (canonical values unchanged). */
export function getProductOptionGroups(
  product: Pick<Product, "options"> | null | undefined,
  locale: Locale,
  i18n: CatalogOptionsI18n,
): ProductOptionGroup[] {
  const options = product?.options;
  if (!options || typeof options !== "object") return [];

  return Object.entries(options).flatMap(([attr, raw]) => {
    if (Array.isArray(raw)) {
      return [parseLegacyOption(attr, raw.filter((v): v is string => typeof v === "string"), locale, i18n)];
    }
    if (raw && typeof raw === "object") {
      const group = parseStructuredOption(attr, raw as StructuredOptionMeta, locale, i18n);
      return group ? [group] : [];
    }
    return [];
  });
}

/** Human-readable option rows for an order line item spec JSON. */
export function formatLineItemSpecs(
  spec: Record<string, string> | null | undefined,
  locale: Locale,
  i18n: CatalogOptionsI18n,
): { label: string; value: string }[] {
  if (!spec || typeof spec !== "object") return [];
  return Object.entries(spec)
    .filter(([, value]) => value != null && String(value).trim() !== "")
    .map(([key, value]) => ({
      label: resolveAttrLabel(key, locale, i18n),
      value: resolveValueLabel(key, String(value), locale, i18n),
    }));
}

/** Localize pricing breakdown keys such as `base`, `binding:paperback`, `volume_discount`. */
export function localizedBreakdownKey(
  key: string,
  locale: Locale,
  i18n: CatalogOptionsI18n,
): string {
  if (i18n.breakdown[key]) return i18n.breakdown[key];

  const [attr, value] = key.split(":");
  if (value) {
    const attrLabel = resolveAttrLabel(attr, locale, i18n);
    const valueLabel = resolveValueLabel(attr, value, locale, i18n);
    return `${attrLabel} · ${valueLabel}`;
  }

  return humanizeToken(key);
}
