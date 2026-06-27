import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ImageUp, ShieldAlert, Trash2 } from "lucide-react";

import { authApi } from "@/api/auth";
import { brandApi } from "@/api/brand";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuthStore } from "@/store/auth";
import { useThemeStore } from "@/store/theme";
import { useT } from "@/i18n/useT";
import { resolveBackendAssetUrl } from "@/config/backend";
import { BRAND_QUERY_KEY, useBrand } from "@/hooks/useBrand";
import type { BrandSettings } from "@/types/api";

export default function SettingsPage() {
  const { t } = useT();
  const tt = t.staffUi.settings;
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const { theme, setTheme } = useThemeStore();
  const [form, setForm] = useState({
    full_name: user?.full_name ?? "",
    phone: user?.phone ?? "",
    theme: theme,
  });

  const save = useMutation({
    mutationFn: () => authApi.updateProfile(form),
    onSuccess: (me) => {
      setUser(me);
      setTheme(form.theme as any);
      toast.success(tt.saved);
    },
  });

  const isAdmin = !!user?.is_superuser;

  return (
    <div className="page-shell">
      <PageHeader title={tt.title} description={tt.description} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title={tt.profileTitle} subtitle={tt.profileSub} />
          <CardBody className="grid gap-3.5 sm:grid-cols-2">
            <Input label={tt.fullName} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            <Input label={tt.email} value={user?.email ?? ""} disabled />
            <Input label={tt.phone} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input label={tt.department} value={user?.department ?? t.common.none} disabled />
            <div className="sm:col-span-2 flex justify-end gap-2">
              <Button loading={save.isPending} onClick={() => save.mutate()}>{tt.save}</Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={tt.appearanceTitle} subtitle={tt.appearanceSub} />
          <CardBody className="space-y-3">
            <label className="flex flex-wrap items-start gap-x-2.5 gap-y-1 cursor-pointer p-2 rounded-lg hover:bg-surface-2">
              <input type="radio" name="theme" value="light"
                     checked={form.theme === "light"} onChange={() => setForm({ ...form, theme: "light" })}
                     className="accent-[rgb(var(--brand))] mt-0.5 shrink-0" />
              <span className="font-medium shrink-0">{tt.light}</span>
              <span className="min-w-0 text-text-3 text-[12px] break-words">{tt.lightHint}</span>
            </label>
            <label className="flex flex-wrap items-start gap-x-2.5 gap-y-1 cursor-pointer p-2 rounded-lg hover:bg-surface-2">
              <input type="radio" name="theme" value="dark"
                     checked={form.theme === "dark"} onChange={() => setForm({ ...form, theme: "dark" })}
                     className="accent-[rgb(var(--brand))] mt-0.5 shrink-0" />
              <span className="font-medium shrink-0">{tt.dark}</span>
              <span className="min-w-0 text-text-3 text-[12px] break-words">{tt.darkHint}</span>
            </label>
          </CardBody>
        </Card>

        {isAdmin ? <BrandIdentityCard /> : (
          <Card className="lg:col-span-3 border-dashed">
            <CardBody className="flex items-center gap-3 text-text-3 text-[13px]">
              <ShieldAlert className="size-4 shrink-0" />
              <span>{tt.adminOnly} — {tt.brandTitle}.</span>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}

interface BrandDraft {
  app_name: string;
  app_name_ar: string;
  tagline: string;
  tagline_ar: string;
  sidebar_subtitle: string;
  sidebar_subtitle_ar: string;
}

const EMPTY_DRAFT: BrandDraft = {
  app_name: "",
  app_name_ar: "",
  tagline: "",
  tagline_ar: "",
  sidebar_subtitle: "",
  sidebar_subtitle_ar: "",
};

/**
 * Admin-only card. Configures the system name (per locale), tagline and logo.
 */
function BrandIdentityCard() {
  const { t } = useT();
  const tt = t.staffUi.settings;
  const queryClient = useQueryClient();
  const brand = useBrand();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [draft, setDraft] = useState<BrandDraft>(EMPTY_DRAFT);

  // Hydrate the form once the brand response lands (or whenever it changes).
  useEffect(() => {
    if (brand.raw) {
      setDraft({
        app_name: brand.raw.app_name,
        app_name_ar: brand.raw.app_name_ar,
        tagline: brand.raw.tagline,
        tagline_ar: brand.raw.tagline_ar,
        sidebar_subtitle: brand.raw.sidebar_subtitle,
        sidebar_subtitle_ar: brand.raw.sidebar_subtitle_ar,
      });
    }
  }, [brand.raw]);

  const updateCache = (next: BrandSettings) =>
    queryClient.setQueryData(BRAND_QUERY_KEY, next);

  const save = useMutation({
    mutationFn: () => brandApi.update(draft),
    onSuccess: (next) => {
      updateCache(next);
      toast.success(tt.brandSaved);
    },
  });

  const upload = useMutation({
    mutationFn: (file: File) => brandApi.uploadLogo(file),
    onSuccess: (next) => {
      updateCache(next);
      toast.success(tt.logoUploaded);
    },
  });

  const remove = useMutation({
    mutationFn: () => brandApi.removeLogo(),
    onSuccess: (next) => {
      updateCache(next);
      toast.success(tt.brandSaved);
    },
  });

  const onPickFile: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const file = event.target.files?.[0];
    if (file) upload.mutate(file);
    event.target.value = "";
  };

  const previewSrc = brand.raw?.logo_url
    ? resolveBackendAssetUrl(brand.raw.logo_url)
    : "/logo.jpg";

  return (
    <Card className="lg:col-span-3">
      <CardHeader
        title={tt.brandTitle}
        subtitle={`${tt.brandSub} · ${tt.adminOnly}`}
      />
      <CardBody className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className="space-y-3">
          <div className="text-[12px] font-medium text-text-2">{tt.logoTitle}</div>
          <div className="rounded-xl border border-border bg-surface-2 p-3 flex flex-col items-center gap-3">
            <div className="size-32 rounded-2xl overflow-hidden border border-border bg-bg grid place-items-center">
              {previewSrc ? (
                <img
                  key={previewSrc}
                  src={previewSrc}
                  alt=""
                  className="size-full object-cover"
                  draggable={false}
                />
              ) : (
                <span className="text-[11px] text-text-3">{tt.noLogo}</span>
              )}
            </div>
            <div className="text-[11px] text-text-3 text-center leading-relaxed">
              {brand.raw?.logo_url ? tt.currentLogo : tt.noLogo}
            </div>
          </div>

          <p className="text-[11.5px] text-text-3 leading-relaxed">{tt.logoHint}</p>

          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={onPickFile}
            />
            <Button
              variant="secondary"
              icon={<ImageUp className="size-4" />}
              loading={upload.isPending}
              onClick={() => fileInputRef.current?.click()}
              full
            >
              {tt.uploadLogo}
            </Button>
            {brand.raw?.logo_url ? (
              <Button
                variant="ghost"
                icon={<Trash2 className="size-4" />}
                loading={remove.isPending}
                onClick={() => remove.mutate()}
                full
              >
                {remove.isPending ? tt.removingLogo : tt.removeLogo}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Input
              label={tt.appName}
              value={draft.app_name}
              onChange={(e) => setDraft({ ...draft, app_name: e.target.value })}
            />
            <Input
              label={tt.appNameAr}
              dir="rtl"
              className="font-arabic"
              value={draft.app_name_ar}
              onChange={(e) => setDraft({ ...draft, app_name_ar: e.target.value })}
            />
            <Input
              label={tt.tagline}
              value={draft.tagline}
              onChange={(e) => setDraft({ ...draft, tagline: e.target.value })}
            />
            <Input
              label={tt.taglineAr}
              dir="rtl"
              className="font-arabic"
              value={draft.tagline_ar}
              onChange={(e) => setDraft({ ...draft, tagline_ar: e.target.value })}
            />
            <Input
              label={tt.sidebarSubtitle}
              value={draft.sidebar_subtitle}
              onChange={(e) => setDraft({ ...draft, sidebar_subtitle: e.target.value })}
            />
            <Input
              label={tt.sidebarSubtitleAr}
              dir="rtl"
              className="font-arabic"
              value={draft.sidebar_subtitle_ar}
              onChange={(e) => setDraft({ ...draft, sidebar_subtitle_ar: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button loading={save.isPending} onClick={() => save.mutate()}>
              {tt.save}
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
