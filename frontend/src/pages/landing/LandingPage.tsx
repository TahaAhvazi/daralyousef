import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";

import heroVideo from "@/assets/mixkit-busy-office-space-918-hd-ready.mp4";
import { LanguageSwitcher } from "@/components/brand/LanguageSwitcher";
import { useBrand } from "@/hooks/useBrand";
import { applyLocaleToHtml, useLocaleStore } from "@/store/locale";
import { useT } from "@/i18n/useT";

const easeOut = [0.2, 0.7, 0.2, 1] as const;

function useTypingLoop(text: string, typingMs = 50, pauseMs = 2600, deleteMs = 26) {
  const [display, setDisplay] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setDisplay("");
    setDeleting(false);
  }, [text]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (!deleting && display.length < text.length) {
      timeout = setTimeout(() => setDisplay(text.slice(0, display.length + 1)), typingMs);
    } else if (!deleting && display.length === text.length) {
      timeout = setTimeout(() => setDeleting(true), pauseMs);
    } else if (deleting && display.length > 0) {
      timeout = setTimeout(() => setDisplay(text.slice(0, display.length - 1)), deleteMs);
    } else if (deleting && display.length === 0) {
      timeout = setTimeout(() => setDeleting(false), 500);
    }

    return () => clearTimeout(timeout);
  }, [display, deleting, text, typingMs, pauseMs, deleteMs]);

  return display;
}

function VideoBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
        src={heroVideo}
      />
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10" />
    </div>
  );
}

function Navbar() {
  const { t } = useT();
  const brand = useBrand();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks: Array<{ label: string; to?: string; href?: string }> = [
    { label: t.nav.services, href: "#hero" },
    { label: t.nav.how, href: "#hero" },
    { label: t.nav.portal, to: "/portal" },
    { label: t.nav.pricing, to: "/register" },
  ];

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [menuOpen]);

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: easeOut }}
      className="fixed top-0 inset-x-0 z-50"
    >
      <div className="landing-shell flex items-center justify-between gap-4 h-16 sm:h-[4.5rem] lg:h-20 pt-3 sm:pt-4">
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <img
            src="/logo.jpg"
            alt={brand.name}
            width={44}
            height={44}
            className="size-9 sm:size-10 lg:size-11 rounded-lg object-cover"
          />
          <span className="hidden md:block text-[13px] lg:text-sm font-medium text-white/90 tracking-tight">
            {brand.name}
          </span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-4 lg:gap-10">
          <nav className="hidden md:flex items-center gap-5 lg:gap-8 xl:gap-10">
            {navLinks.map((item) =>
              item.to ? (
                <Link
                  key={item.label}
                  to={item.to}
                  className="text-[13px] lg:text-[14px] font-normal text-white/85 hover:text-white transition-colors whitespace-nowrap"
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-[13px] lg:text-[14px] font-normal text-white/85 hover:text-white transition-colors whitespace-nowrap"
                >
                  {item.label}
                </a>
              ),
            )}
          </nav>

          <LanguageSwitcher variant="minimal" align="end" className="hidden sm:block" />

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="grid size-10 place-items-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-sm transition-colors hover:bg-black/50 md:hidden"
            aria-label={t.nav.openMenu}
          >
            <Menu className="size-5" />
          </button>

          <Link
            to="/register"
            className="group inline-flex items-center gap-2 sm:gap-3 rounded-full bg-[#0a0a0a] ps-4 sm:ps-5 pe-1.5 py-1.5 text-[12px] sm:text-[13px] font-medium text-white hover:bg-black transition-colors shrink-0"
          >
            <span className="hidden xs:inline">{t.nav.startOrder}</span>
            <span className="xs:hidden">{t.landing.signUpTab}</span>
            <span className="grid size-7 sm:size-8 place-items-center rounded-full bg-white text-black group-hover:scale-105 transition-transform">
              <ArrowRight data-rtl-mirror="true" className="size-3.5 sm:size-4" />
            </span>
          </Link>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            className="fixed inset-0 z-[60] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
              aria-hidden
            />
            <motion.nav
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="absolute inset-x-4 top-20 rounded-2xl border border-white/10 bg-[#0a0a12]/95 p-4 shadow-2xl backdrop-blur-xl"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[13px] font-medium text-white/70">{brand.name}</span>
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
                {navLinks.map((item) => (
                  <li key={item.label}>
                    {item.to ? (
                      <Link
                        to={item.to}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center rounded-xl px-4 py-3.5 text-[15px] font-medium text-white/90 hover:bg-white/10 transition-colors"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <a
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center rounded-xl px-4 py-3.5 text-[15px] font-medium text-white/90 hover:bg-white/10 transition-colors"
                      >
                        {item.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
              <div className="mt-4 border-t border-white/10 pt-4 sm:hidden">
                <LanguageSwitcher variant="minimal" align="end" className="w-full" />
              </div>
            </motion.nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.header>
  );
}

function Hero() {
  const { t, isRtl } = useT();
  const line1 = t.landing.heroLine1;
  const line2 = t.landing.heroLine2;
  const fullHeadline = useMemo(() => `${line1} ${line2}`, [line1, line2]);
  const typed = useTypingLoop(fullHeadline);

  const headlineClass = `text-[clamp(2rem,4.8vw,3.75rem)] font-light leading-[1.12] tracking-[-0.02em] text-white ${
    isRtl ? "font-arabic" : ""
  }`;

  const renderHeadline = (text: string) => {
    if (text.length <= line1.length) return text;
    const second = text.slice(line1.length).trimStart();
    return (
      <>
        {line1}
        <br />
        {second}
      </>
    );
  };

  return (
    <motion.section
      id="hero"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.15, ease: easeOut }}
      className="w-full max-w-3xl"
    >
      <div className="landing-headline-slot">
        <h1 className={`${headlineClass} invisible`} aria-hidden="true">
          {line1}
          <br />
          {line2}
        </h1>
        <h1 className={`${headlineClass} absolute inset-0`}>
          {renderHeadline(typed)}
          <span className="landing-cursor" />
        </h1>
      </div>

      <div className="mt-8 sm:mt-10 flex flex-col xs:flex-row flex-wrap items-stretch xs:items-center gap-3">
        <Link
          to="/register"
          className="inline-flex h-11 sm:h-12 items-center justify-center rounded-full bg-white px-7 sm:px-8 text-[13px] sm:text-[14px] font-medium text-[#0a0a0a] hover:bg-white/92 transition-colors"
        >
          {t.hero.primaryCta}
        </Link>
        <Link
          to="/portal"
          className="inline-flex h-11 sm:h-12 items-center justify-center rounded-full border border-white/35 bg-black/40 px-7 sm:px-8 text-[13px] sm:text-[14px] font-medium text-white hover:bg-black/55 transition-colors backdrop-blur-sm"
        >
          {t.landing.explorePortal}
        </Link>
      </div>
    </motion.section>
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
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#060810] text-white">
      <VideoBackground />
      <Navbar />

      <main className="relative z-10 landing-shell min-h-screen flex flex-col justify-end pb-10 sm:pb-14 lg:pb-16 xl:pb-20 pt-24 sm:pt-28">
        <Hero />
      </main>
    </div>
  );
}
