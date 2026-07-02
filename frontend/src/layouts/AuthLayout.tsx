import { Outlet, Link } from "react-router-dom";
import { ArrowLeft, Moon, ShieldCheck, Sparkles, Sun, Workflow } from "lucide-react";
import { useEffect } from "react";

import { applyLocaleToHtml, useLocaleStore } from "@/store/locale";
import { applyThemeClass, useThemeStore } from "@/store/theme";
import { useT } from "@/i18n/useT";
import { BrandMark } from "@/components/brand/BrandMark";
import { LanguageSwitcher } from "@/components/brand/LanguageSwitcher";
import { useBrand } from "@/hooks/useBrand";

export function AuthLayout() {
  const { t, isRtl } = useT();
  const { theme, toggle } = useThemeStore();
  const locale = useLocaleStore((s) => s.locale);
  const brand = useBrand();

  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);

  useEffect(() => applyThemeClass(theme), [theme]);
  useEffect(() => applyLocaleToHtml(locale), [locale]);

  return (
    <div className="landing-dar landing-dar-auth relative flex h-dvh max-h-dvh w-full flex-col overflow-hidden text-white">
      <div className="landing-dar-bg" aria-hidden />
      <div className="landing-dar-wave" aria-hidden />

      <div className="absolute inset-x-0 top-0 z-30">
        <div className="landing-shell flex h-16 items-center justify-between px-5 sm:px-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-[13px] font-medium text-white/80 transition-colors hover:text-white"
          >
            <ArrowLeft data-rtl-mirror="true" className="size-4" />
            <span className="hidden sm:inline">{brand.name}</span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher variant="minimal" align="end" />
            <button
              onClick={toggle}
              className="grid size-9 place-items-center rounded-full border border-white/20 bg-[#0d2d6b]/50 text-white hover:bg-[#0d2d6b]/75 transition-colors"
              aria-label={t.nav.themeToggle}
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 grid min-h-0 flex-1 lg:grid-cols-2">
        <div className="landing-dar-auth-hero hidden flex-col justify-between overflow-y-auto overscroll-contain p-10 pt-20 lg:flex">
          <div className="flex items-center gap-3">
            <BrandMark size={44} className="shadow-glow" />
            <div>
              <div className={`text-base font-semibold tracking-tight ${isRtl ? "font-arabic" : ""}`}>
                {brand.name}
              </div>
              <div className="-mt-0.5 text-[12px] text-white/55">{brand.tagline}</div>
            </div>
          </div>

          <div>
            <h1 className={`text-4xl font-semibold leading-[1.15] tracking-tight ${isRtl ? "font-arabic" : ""}`}>
              {t.auth.heroH1A}
              <br />
              {t.auth.heroH1B}
            </h1>
            <p className="mt-4 max-w-md text-[14.5px] text-white/75">{t.auth.heroLead}</p>
            <ul className="mt-8 grid max-w-md gap-3">
              {[
                { icon: <Sparkles className="size-4" />, text: t.auth.heroFeatures.instant },
                { icon: <Workflow className="size-4" />, text: t.auth.heroFeatures.live },
                { icon: <ShieldCheck className="size-4" />, text: t.auth.heroFeatures.audit },
              ].map((f, i) => (
                <li key={i} className="landing-dar-auth-feature flex items-center gap-3 rounded-xl px-4 py-3">
                  <span className="grid size-8 place-items-center rounded-lg bg-[#f5c518] text-[#0a1f4d]">
                    {f.icon}
                  </span>
                  <span className="text-[13.5px] text-white/90">{f.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-[12px] text-white/45">{t.auth.footer}</div>
        </div>

        <div className="flex min-h-0 flex-col items-center overflow-y-auto overscroll-contain p-6 pt-20 sm:p-10">
          <div className={`w-full max-w-md ${isRtl ? "font-arabic" : ""}`}>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
