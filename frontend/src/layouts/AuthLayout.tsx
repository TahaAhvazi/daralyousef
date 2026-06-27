import { Outlet, Link } from "react-router-dom";
import { Moon, ShieldCheck, Sparkles, Sun, Workflow, ArrowLeft } from "lucide-react";
import { useEffect } from "react";

import { applyThemeClass, useThemeStore } from "@/store/theme";
import { applyLocaleToHtml, useLocaleStore } from "@/store/locale";
import { useT } from "@/i18n/useT";
import { BrandMark } from "@/components/brand/BrandMark";
import { LanguageSwitcher } from "@/components/brand/LanguageSwitcher";
import { useBrand } from "@/hooks/useBrand";

export function AuthLayout() {
  const { t, isRtl } = useT();
  const { theme, toggle } = useThemeStore();
  const locale = useLocaleStore((s) => s.locale);
  const brand = useBrand();
  useEffect(() => applyThemeClass(theme), [theme]);
  useEffect(() => applyLocaleToHtml(locale), [locale]);

  return (
    <div className="relative flex h-dvh max-h-dvh w-full flex-col overflow-hidden bg-bg text-text">
      <div className="ambient" />

      <div className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex h-16 max-w-[1300px] items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-2 text-[13px] font-medium text-text-2 transition-colors hover:text-text">
            <ArrowLeft data-rtl-mirror="true" className="size-4" />
            <span className="hidden sm:inline">{brand.name}</span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher variant="ghost" />
            <button
              onClick={toggle}
              className="btn btn-ghost h-9 w-9 p-0"
              aria-label={t.nav.themeToggle}
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 lg:grid-cols-2">
        <div className="hidden flex-col justify-between overflow-y-auto overscroll-contain bg-grad-mesh p-10 pt-20 lg:flex">
          <div className="flex items-center gap-3">
            <BrandMark size={44} className="shadow-glow" />
            <div>
              <div className={`text-base font-semibold tracking-tight ${isRtl ? "font-arabic" : ""}`}>{brand.name}</div>
              <div className="-mt-0.5 text-[12px] text-text-3">{brand.tagline}</div>
            </div>
          </div>

          <div>
            <h1 className={`text-4xl font-semibold leading-[1.15] tracking-tight ${isRtl ? "font-arabic" : ""}`}>
              {t.auth.heroH1A}
              <br />
              {t.auth.heroH1B}
            </h1>
            <p className="mt-4 max-w-md text-[14.5px] text-text-2">{t.auth.heroLead}</p>
            <ul className="mt-8 grid max-w-md gap-3">
              {[
                { icon: <Sparkles className="size-4" />, text: t.auth.heroFeatures.instant },
                { icon: <Workflow className="size-4" />, text: t.auth.heroFeatures.live },
                { icon: <ShieldCheck className="size-4" />, text: t.auth.heroFeatures.audit },
              ].map((f, i) => (
                <li key={i} className="glass flex items-center gap-3 rounded-xl px-4 py-3">
                  <span className="grid size-8 place-items-center rounded-lg bg-grad-brand text-white">
                    {f.icon}
                  </span>
                  <span className="text-[13.5px]">{f.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-[12px] text-text-3">{t.auth.footer}</div>
        </div>

        <div className="flex min-h-0 flex-col items-center overflow-y-auto overscroll-contain p-6 pt-20 sm:p-10">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
