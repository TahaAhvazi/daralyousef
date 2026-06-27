import { useQuery } from "@tanstack/react-query";

import { brandApi } from "@/api/brand";
import { resolveBackendAssetUrl } from "@/config/backend";
import { useT } from "@/i18n/useT";
import type { BrandSettings } from "@/types/api";

const DEFAULT_LOGO_URL = "/logo.jpg";

export const BRAND_QUERY_KEY = ["brand-settings"] as const;

/**
 * Returns the live brand identity for the current locale, with sensible
 * fallbacks to the static i18n dictionary while the network request is
 * in-flight or when the API is unreachable.
 *
 * Public — does not require an authenticated session, so the landing page
 * and login screen can call it freely.
 */
export function useBrand() {
  const { t, locale, isRtl } = useT();

  const query = useQuery<BrandSettings>({
    queryKey: BRAND_QUERY_KEY,
    queryFn: brandApi.get,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const data = query.data;
  const isAr = locale.startsWith("ar");

  const name =
    (isAr ? data?.app_name_ar : data?.app_name) || t.brand.name;
  const tagline =
    (isAr ? data?.tagline_ar : data?.tagline) || t.brand.tagline;
  const sidebarSubtitle =
    (isAr ? data?.sidebar_subtitle_ar : data?.sidebar_subtitle) ||
    t.staffUi.brand.subtitle;
  const logoUrl = data?.logo_url
    ? resolveBackendAssetUrl(data.logo_url)
    : DEFAULT_LOGO_URL;

  return {
    name,
    tagline,
    sidebarSubtitle,
    logoUrl,
    raw: data,
    isLoading: query.isLoading,
    isRtl,
    refetch: query.refetch,
  };
}
