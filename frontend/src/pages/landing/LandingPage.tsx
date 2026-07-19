import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
  const { t, isRtl } = useT();
  const brand = useBrand();
  const mobileMenus = useLandingMobileMenus();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showBrand, setShowBrand] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      setShowBrand(y > 260);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: easeOut }}
      className={`landing-dar-nav${scrolled ? " is-scrolled" : ""}`}
    >
      <div className="landing-shell flex h-full items-center justify-between gap-3 py-2 sm:py-3">
        <span className="sr-only">{brand.name}</span>

        <Link
          to="/"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className={`landing-dar-nav-brand${showBrand ? " is-visible" : ""}`}
          aria-label={brand.name}
          tabIndex={showBrand ? 0 : -1}
        >
          <img src={landingLogoName} alt="" decoding="async" />
        </Link>

        <div className="hidden sm:flex flex-1 justify-center px-2">
          <LandingNavMenus />
        </div>

        <div className="ms-auto sm:ms-0 flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher variant="minimal" align="end" className="hidden xs:block" />

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="grid size-9 sm:size-10 place-items-center rounded-full border border-white/25 bg-[#0d2d6b]/50 text-white backdrop-blur-sm transition-colors hover:bg-[#0d2d6b]/75 sm:hidden"
            aria-label={t.nav.openMenu}
          >
            <Menu className="size-4" />
          </button>

          <Link to="/register" className="landing-dar-shine landing-dar-nav-cta group hidden xs:inline-flex">
            <span>{t.nav.startOrder}</span>
            <span className="landing-dar-nav-cta-arrow" aria-hidden>
              <ArrowRight data-rtl-mirror="true" className="size-3.5" />
            </span>
          </Link>
        </div>
      </div>

      {/* Portal: the nav's backdrop-filter creates a containing block that
          would clip a position:fixed drawer to the nav's own height. */}
      {createPortal(
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
              initial={{ x: isRtl ? "-104%" : "104%" }}
              animate={{ x: 0 }}
              exit={{ x: isRtl ? "-104%" : "104%" }}
              transition={{ type: "spring", stiffness: 340, damping: 34 }}
              className="landing-dar-drawer"
            >
              <div className="landing-dar-drawer-head">
                <img
                  src={landingLogoName}
                  alt={brand.name}
                  className="landing-dar-drawer-logo"
                  decoding="async"
                />
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="landing-dar-drawer-close"
                  aria-label={t.nav.closeMenu}
                >
                  <X className="size-5" />
                </button>
              </div>

              <ul className="landing-dar-drawer-list">
                {mobileMenus.map((menu) => (
                  <LandingMobileMenuSection
                    key={menu.id}
                    menu={menu}
                    onNavigate={() => setMenuOpen(false)}
                  />
                ))}
              </ul>

              <div className="landing-dar-drawer-foot">
                <LanguageSwitcher variant="minimal" align="end" className="w-full" />
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="landing-dar-shine landing-dar-drawer-cta"
                >
                  {t.nav.startOrder}
                  <ArrowRight data-rtl-mirror="true" className="size-4" />
                </Link>
                <p className="landing-dar-drawer-tagline">{brand.tagline}</p>
              </div>
            </motion.nav>
            </motion.div>
          ) : null}
        </AnimatePresence>,
        document.body,
      )}
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
          <div className="landing-dar-glow" aria-hidden>
            <span />
            <span />
          </div>

          <div className="landing-dar-brand">
            <div className="landing-dar-halo" aria-hidden />
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
