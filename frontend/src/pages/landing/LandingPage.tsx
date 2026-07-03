import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";

import landingLogoName from "@/assets/landing-logo-name.png";
import { LanguageSwitcher } from "@/components/brand/LanguageSwitcher";
import { useBrand } from "@/hooks/useBrand";
import { applyLocaleToHtml, useLocaleStore } from "@/store/locale";
import { useT } from "@/i18n/useT";
import { LandingMobileMenuSection, LandingNavMenus, useLandingMobileMenus } from "@/pages/landing/LandingNavMenus";
import { LandingScrollSections } from "@/pages/landing/LandingScrollSections";
import { SlicedVideoColumns } from "@/pages/landing/SlicedVideoColumns";

const easeOut = [0.2, 0.7, 0.2, 1] as const;

function LandingNav() {
  const { t } = useT();
  const brand = useBrand();
  const mobileMenus = useLandingMobileMenus();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: easeOut }}
      className="landing-dar-nav"
    >
      <div className="landing-shell flex h-full items-center justify-between gap-3 py-2 sm:py-3">
        <span className="sr-only">{brand.name}</span>

        <div className="ms-auto flex items-center gap-2 sm:gap-3">
          <LandingNavMenus />

          <LanguageSwitcher variant="minimal" align="end" className="hidden xs:block" />

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="grid size-9 sm:size-10 place-items-center rounded-full border border-white/25 bg-[#0d2d6b]/50 text-white backdrop-blur-sm transition-colors hover:bg-[#0d2d6b]/75 sm:hidden"
            aria-label={t.nav.openMenu}
          >
            <Menu className="size-4" />
          </button>

          <Link
            to="/register"
            className="group hidden xs:inline-flex items-center gap-2 rounded-full bg-[#0a1f4d] ps-4 pe-1.5 py-1.5 text-[12px] font-medium text-white ring-1 ring-white/20 hover:bg-[#081a40] transition-colors"
          >
            <span>{t.nav.startOrder}</span>
            <span className="grid size-7 place-items-center rounded-full bg-[#f5c518] text-[#0a1f4d] group-hover:scale-105 transition-transform">
              <ArrowRight data-rtl-mirror="true" className="size-3.5" />
            </span>
          </Link>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            className="fixed inset-0 z-[70] sm:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-[#061535]/80 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
              aria-hidden
            />
            <motion.nav
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="absolute inset-x-4 top-16 rounded-2xl border border-white/15 bg-[#0d2d6b]/95 p-4 shadow-2xl backdrop-blur-xl"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[13px] font-medium text-white/75">{brand.name}</span>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="grid size-9 place-items-center rounded-full text-white/80 hover:bg-white/10"
                  aria-label={t.nav.closeMenu}
                >
                  <X className="size-5" />
                </button>
              </div>
              <ul className="space-y-1">
                {mobileMenus.map((menu) => (
                  <LandingMobileMenuSection
                    key={menu.id}
                    menu={menu}
                    onNavigate={() => setMenuOpen(false)}
                  />
                ))}
              </ul>
              <div className="mt-4 border-t border-white/10 pt-4">
                <LanguageSwitcher variant="minimal" align="end" className="w-full" />
              </div>
              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="mt-4 flex h-11 items-center justify-center rounded-full bg-[#f5c518] text-[13px] font-semibold text-[#0a1f4d]"
              >
                {t.nav.startOrder}
              </Link>
            </motion.nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.header>
  );
}

export default function LandingPage() {
  const locale = useLocaleStore((s) => s.locale);

  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);

  useEffect(() => {
    applyLocaleToHtml(locale);
  }, [locale]);

  return (
    <div className="landing-dar relative w-full text-white">
      <div className="landing-dar-bg" aria-hidden />

      <LandingNav />

      <main className="landing-dar-main">
        <section className="landing-dar-hero" aria-label="Hero">
          <div className="landing-dar-brand">
            <Link
              to="/"
              className="landing-dar-logo-link"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              aria-label="Dar Alyousif — Home"
            >
              <img
                src={landingLogoName}
                alt="Dar Alyousif — Printing & Advertising"
                width={1200}
                height={420}
                className="landing-dar-logo"
                decoding="async"
                fetchPriority="high"
              />
            </Link>
          </div>

          <div className="landing-dar-columns-shell">
            <SlicedVideoColumns />
          </div>

          <div className="landing-dar-hero-wave" aria-hidden />
        </section>

        <LandingScrollSections />
      </main>
    </div>
  );
}
