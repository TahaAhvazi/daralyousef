import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ImageUp, MonitorSmartphone, RefreshCw, ShieldAlert, Trash2, Wifi } from "lucide-react";

import { authApi } from "@/api/auth";
import { brandApi } from "@/api/brand";
import { daftraApi, type DaftraSyncReport } from "@/api/modules";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuthStore } from "@/store/auth";
import { useThemeStore } from "@/store/theme";
import { useWebPush } from "@/hooks/useWebPush";
import { ProfilePhotoCard } from "@/components/profile/ProfilePhotoCard";
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
  const push = useWebPush();
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

        <ProfilePhotoCard />

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

        <Card className="lg:col-span-3">
          <CardHeader
            title={
              <span className="inline-flex items-center gap-2">
                <MonitorSmartphone className="size-4 text-brand" />
                {tt.pushTitle}
              </span>
            }
            subtitle={tt.pushSub}
          />
          <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-1">
              <p className="text-[13px] text-text-2">{tt.pushHint}</p>
              <p className="text-[12px] text-text-3">
                {!push.supported
                  ? tt.pushUnsupported
                  : push.active
                    ? tt.pushStatusOn
                    : push.permission === "denied"
                      ? tt.pushDenied
                      : tt.pushStatusOff}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              {push.active ? (
                <Button
                  variant="secondary"
                  loading={push.isDisabling}
                  onClick={() => push.disable()}
                >
                  {tt.pushDisable}
                </Button>
              ) : (
                <Button
                  loading={push.isEnabling}
                  disabled={!push.supported || push.permission === "denied"}
                  onClick={() => push.enable()}
                >
                  {tt.pushEnable}
                </Button>
              )}
            </div>
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

        {isAdmin ? <DaftraSyncCard /> : null}
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

function DaftraSyncCard() {
  const { t } = useT();
  const tt = t.staffUi.settings;
  const queryClient = useQueryClient();

  const statusQ = useQuery({
    queryKey: ["daftra-status"],
    queryFn: () => daftraApi.status(),
    refetchInterval: (q) => {
      const d = q.state.data;
      const running =
        !!d?.sync_running ||
        (d?.last_sync as DaftraSyncReport | undefined)?.status === "running";
      return running ? 3000 : false;
    },
  });

  const testM = useMutation({
    mutationFn: () => daftraApi.test(),
    onSuccess: (res) => {
      if (res.ok) toast.success(`${tt.daftraTestOk}: ${res.message}`);
      else toast.error(`${tt.daftraTestFail}: ${res.message}`);
    },
    onError: (err: any) => {
      toast.error(err?.message || tt.daftraTestFail);
    },
  });

  const syncM = useMutation({
    mutationFn: () => daftraApi.sync(),
    onSuccess: () => {
      toast.success(tt.daftraSyncStarted);
      queryClient.invalidateQueries({ queryKey: ["daftra-status"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || tt.daftraSyncFail);
    },
  });

  const status = statusQ.data;
  const last = status?.last_sync as DaftraSyncReport | undefined;
  const running =
    !!status?.sync_running || last?.status === "running" || syncM.isPending;
  const counts = status?.mapped_counts ?? {};
  const lastAt = last?.finished_at || last?.started_at || null;

  // Toast once when a running sync finishes
  const prevRunning = useRef(false);
  useEffect(() => {
    if (prevRunning.current && !running && last?.status) {
      if (last.status === "done" && last.ok) toast.success(tt.daftraSyncOk);
      else if (last.status === "error" || last.ok === false) toast.error(tt.daftraSyncFail);
      queryClient.invalidateQueries({ queryKey: ["daftra-status"] });
    }
    prevRunning.current = running;
  }, [running, last?.status, last?.ok, queryClient, tt.daftraSyncFail, tt.daftraSyncOk]);

  return (
    <Card className="lg:col-span-3">
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            <RefreshCw className={`size-4 text-brand ${running ? "animate-spin" : ""}`} />
            {tt.daftraTitle}
          </span>
        }
        subtitle={tt.daftraSub}
      />
      <CardBody className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2 text-[13px]">
          <p>
            <span className="text-text-3">{tt.daftraBaseUrl}: </span>
            <span className="break-all">{status?.base_url || "—"}</span>
          </p>
          <p>
            {status?.enabled ? tt.daftraEnabled : tt.daftraDisabled}
            {" · "}
            {status?.configured ? tt.daftraConfigured : tt.daftraNotConfigured}
            {running ? ` · ${tt.daftraSyncRunning}` : null}
            {last?.current_module ? ` (${last.current_module})` : null}
          </p>
          <p className="sm:col-span-2">
            <span className="text-text-3">{tt.daftraLastSync}: </span>
            {lastAt ? new Date(lastAt).toLocaleString() : tt.daftraNever}
            {last?.message ? ` — ${last.message}` : null}
          </p>
          <p className="sm:col-span-2 text-text-2">
            <span className="text-text-3">{tt.daftraMapped}: </span>
            {Object.entries(counts)
              .map(([k, v]) => `${k}: ${v}`)
              .join(" · ") || "—"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            loading={testM.isPending}
            disabled={running}
            onClick={() => testM.mutate()}
          >
            <Wifi className="size-4" />
            {tt.daftraTest}
          </Button>
          <Button
            loading={syncM.isPending}
            disabled={!status?.enabled || !status?.configured || running}
            onClick={() => syncM.mutate()}
          >
            <RefreshCw className="size-4" />
            {running ? tt.daftraSyncRunning : tt.daftraSync}
          </Button>
        </div>

        {last?.modules?.length ? (
          <div className="rounded-lg border border-border bg-surface-2/40 p-3 text-[12px] space-y-1.5">
            {last.modules.map((m) => (
              <div key={m.module} className="flex flex-wrap gap-x-3 gap-y-0.5">
                <span className="font-medium min-w-[5.5rem]">{m.module}</span>
                <span>{m.created} {tt.daftraCreated}</span>
                <span>{m.updated} {tt.daftraUpdated}</span>
                <span>{m.skipped} {tt.daftraSkipped}</span>
                {m.pages_done ? (
                  <span className="text-text-3">
                    {m.pages_done}{m.total_pages ? `/${m.total_pages}` : ""} {tt.daftraPages}
                  </span>
                ) : null}
                {m.errors?.length ? (
                  <span className="text-danger">{m.errors.length} {tt.daftraErrors}</span>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
