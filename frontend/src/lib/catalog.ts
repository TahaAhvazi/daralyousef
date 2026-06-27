import type { Locale } from "@/i18n/config";
import type { Product, ProductCategory } from "@/types/api";

export function localizedProductName(
  product: Pick<Product, "name" | "name_ar">,
  locale: Locale,
): string {
  if (locale === "ar" && product.name_ar) return product.name_ar;
  return product.name;
}

export function localizedProductDescription(
  product: Pick<Product, "description" | "description_ar">,
  locale: Locale,
): string | null {
  if (locale === "ar" && product.description_ar) return product.description_ar;
  return product.description ?? null;
}

export function localizedCategoryName(
  category: Pick<ProductCategory, "name" | "name_ar">,
  locale: Locale,
): string {
  if (locale === "ar" && category.name_ar) return category.name_ar;
  return category.name;
}
