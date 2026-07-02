import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { LanguageSwitcher } from "@/components/brand/LanguageSwitcher";
import { applyLocaleToHtml, useLocaleStore } from "@/store/locale";
import { useT } from "@/i18n/useT";
import { getServiceCategory } from "@/pages/landing/serviceCategories";

export default function ServiceCategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const category = getServiceCategory(slug);
  const locale = useLocaleStore((s) => s.locale);
  const { t, isRtl } = useT();

  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);

  useEffect(() => {
    applyLocaleToHtml(locale);
  }, [locale]);

  if (!category) {
    return <Navigate to="/" replace />;
  }

  const title = isRtl ? category.titleAr : category.titleEn;
  const description = isRtl ? category.descriptionAr : category.descriptionEn;
  const items = isRtl ? category.itemsAr : category.itemsEn;

  return (
    <div className="landing-dar relative min-h-[100dvh] w-full overflow-x-hidden text-white">
      <div className="landing-dar-bg" aria-hidden />
      <div className="landing-dar-wave" aria-hidden />

      <header className="landing-dar-nav">
        <div className="landing-shell flex h-full items-center justify-between gap-3 py-2 sm:py-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[13px] font-medium text-white/85 hover:text-white transition-colors"
          >
            <ArrowLeft data-rtl-mirror="true" className="size-4" />
            {isRtl ? "الرئيسية" : "Home"}
          </Link>
          <LanguageSwitcher variant="minimal" align="end" />
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-3xl px-4 pb-16 pt-[calc(var(--landing-nav-h)+2rem)]">
        <h1 className={`text-2xl sm:text-3xl font-semibold leading-snug ${isRtl ? "font-arabic" : ""}`}>
          {title}
        </h1>
        <p className={`mt-4 text-[15px] leading-relaxed text-white/80 ${isRtl ? "font-arabic" : ""}`}>
          {description}
        </p>

        <section className="mt-8 rounded-2xl border border-white/15 bg-[#0d2d6b]/55 p-5 sm:p-6 backdrop-blur-md">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#f5c518]">
            {isRtl ? "المنتجات والخدمات" : "Products & services"}
          </h2>
          <ul className={`mt-4 grid gap-2 sm:grid-cols-2 ${isRtl ? "font-arabic" : ""}`}>
            {items.map((item) => (
              <li
                key={item}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[14px] text-white/90"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/register" className="landing-dar-cta-primary">
            {t.hero.primaryCta}
          </Link>
          <Link to="/portal" className="landing-dar-cta-secondary">
            {t.landing.explorePortal}
          </Link>
        </div>
      </main>
    </div>
  );
}
