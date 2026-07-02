import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Cpu,
  FileText,
  Mail,
  MapPin,
  MousePointerClick,
  Palette,
  Printer,
  Shirt,
  Truck,
  Upload,
} from "lucide-react";

import landingLogoName from "@/assets/landing-logo-name.png";
import { useBrand } from "@/hooks/useBrand";
import { useT } from "@/i18n/useT";
import { LANDING_COLUMN_SERVICES } from "@/pages/landing/serviceCategories";

const easeOut = [0.2, 0.7, 0.2, 1] as const;

const SERVICE_ICONS = [FileText, Cpu, Printer, Palette, Shirt, BookOpen] as const;

const STEP_ICONS = [MousePointerClick, Upload, CheckCircle2, Truck] as const;

type StatConfig = {
  end: number;
  suffix: string;
  label: string;
  decimals?: number;
};

function useCountUp(target: number, active: boolean, duration = 1600, decimals = 0) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;

    let frame = 0;
    let start: number | null = null;

    const tick = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setValue(target * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, duration, target]);

  if (decimals > 0) return value.toFixed(decimals);
  return String(Math.round(value));
}

function AnimatedStat({ stat, delay = 0 }: { stat: StatConfig; delay?: number }) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const decimals = stat.decimals ?? 0;
  const display = useCountUp(stat.end, inView && !reduceMotion, 1600, decimals);
  const finalValue =
    decimals > 0 ? stat.end.toFixed(decimals) : String(Math.round(stat.end));
  const shown = reduceMotion ? finalValue : display;

  return (
    <motion.div
      ref={ref}
      className="landing-dar-stat"
      initial={reduceMotion ? false : { opacity: 0, y: 28 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, ease: easeOut, delay }}
    >
      <span className="landing-dar-stat-value">
        {shown}
        {stat.suffix}
      </span>
      <span className="landing-dar-stat-label">{stat.label}</span>
    </motion.div>
  );
}

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 28 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, ease: easeOut, delay }}
    >
      {children}
    </motion.div>
  );
}

function LandingFooter() {
  const { t } = useT();
  const brand = useBrand();

  const helpLinks = [
    { label: t.footer.columns.help.items[0], to: "/portal" },
    { label: t.footer.columns.help.items[1], to: "/login" },
    { label: t.footer.columns.help.items[2], to: "/register" },
  ];

  return (
    <footer id="contact" className="landing-dar-footer">
      <div className="landing-shell">
        <div className="landing-dar-footer-grid">
          <Reveal className="landing-dar-footer-brand">
            <Link
              to="/"
              className="landing-dar-footer-logo-link"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <img
                src={landingLogoName}
                alt={brand.name}
                width={640}
                height={224}
                className="landing-dar-footer-logo"
                loading="lazy"
                decoding="async"
              />
            </Link>
            <p className="landing-dar-footer-tagline">{t.footer.tagline}</p>
            <div className="landing-dar-footer-contact">
              <span className="landing-dar-footer-contact-row">
                <MapPin className="size-4 shrink-0" aria-hidden />
                {t.landing.regionLabel}
              </span>
              <a href="mailto:hello@daralyousif.com" className="landing-dar-footer-contact-row">
                <Mail className="size-4 shrink-0" aria-hidden />
                hello@daralyousif.com
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.05}>
            <h3 className="landing-dar-footer-col-title">{t.footer.columns.services.title}</h3>
            <ul className="landing-dar-footer-links">
              {t.footer.columns.services.items.map((item) => (
                <li key={item}>
                  <a href="#services">{item}</a>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.1}>
            <h3 className="landing-dar-footer-col-title">{t.footer.columns.company.title}</h3>
            <ul className="landing-dar-footer-links">
              {t.footer.columns.company.items.map((item) => (
                <li key={item}>
                  <a href="#services">{item}</a>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.15}>
            <h3 className="landing-dar-footer-col-title">{t.footer.columns.help.title}</h3>
            <ul className="landing-dar-footer-links">
              {helpLinks.map((item) => (
                <li key={item.label}>
                  <Link to={item.to}>{item.label}</Link>
                </li>
              ))}
              <li>
                <a href="#faq">{t.footer.columns.help.items[3]}</a>
              </li>
              <li>
                <a href="#faq">{t.footer.columns.help.items[4]}</a>
              </li>
            </ul>
          </Reveal>
        </div>

        <div className="landing-dar-footer-bottom">
          <p>{t.footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
}

export function LandingScrollSections() {
  const { t, locale } = useT();
  const reduceMotion = useReducedMotion();
  const isAr = locale.startsWith("ar");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const steps = [
    t.how.steps.orderOnline,
    t.how.steps.uploadBrief,
    t.how.steps.approveDesign,
    t.how.steps.receive,
  ];

  const stats: StatConfig[] = [
    { end: 12, suffix: "K+", label: t.stats.ordersDelivered },
    { end: 8, suffix: "K+", label: t.stats.designsApproved },
    { end: 98, suffix: "%", label: t.stats.onTime },
    { end: 4.9, suffix: "", decimals: 1, label: t.stats.rating },
  ];

  return (
    <div className="landing-dar-scroll">
      <motion.a
        href="#services"
        className="landing-dar-scroll-hint"
        aria-label={t.nav.services}
        initial={reduceMotion ? false : { opacity: 0, y: -6 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.5, ease: easeOut }}
      >
        <ChevronDown className="size-5 animate-bounce" aria-hidden />
      </motion.a>

      <section id="services" className="landing-dar-section">
        <div className="landing-shell">
          <Reveal className="landing-dar-section-head">
            <p className="landing-dar-eyebrow">{t.services.eyebrow}</p>
            <h2 className="landing-dar-section-title">
              {t.services.title.line1}
              <br />
              {t.services.title.line2}
            </h2>
            <p className="landing-dar-section-lead">{t.services.description}</p>
          </Reveal>

          <div className="landing-dar-services-grid">
            {LANDING_COLUMN_SERVICES.map((service, index) => {
              const Icon = SERVICE_ICONS[index] ?? FileText;
              const title = isAr ? service.titleAr : service.titleEn;
              const desc = isAr ? service.descriptionAr : service.descriptionEn;

              return (
                <Reveal key={service.slug} delay={index * 0.06}>
                  <article className="landing-dar-card landing-dar-shine">
                    <span className="landing-dar-card-icon" aria-hidden>
                      <Icon className="size-5" />
                    </span>
                    <h3 className="landing-dar-card-title">{title}</h3>
                    <p className="landing-dar-card-desc">{desc}</p>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section id="how" className="landing-dar-section landing-dar-section--alt">
        <div className="landing-shell">
          <Reveal className="landing-dar-section-head">
            <p className="landing-dar-eyebrow">{t.how.eyebrow}</p>
            <h2 className="landing-dar-section-title">{t.how.title}</h2>
            <p className="landing-dar-section-lead">{t.how.description}</p>
          </Reveal>

          <ol className="landing-dar-steps">
            {steps.map((step, index) => {
              const Icon = STEP_ICONS[index] ?? MousePointerClick;
              return (
                <Reveal key={step.title} delay={index * 0.08}>
                  <li className="landing-dar-step">
                    <span className="landing-dar-step-num">{index + 1}</span>
                    <span className="landing-dar-step-icon" aria-hidden>
                      <Icon className="size-5" />
                    </span>
                    <div>
                      <h3 className="landing-dar-step-title">{step.title}</h3>
                      <p className="landing-dar-step-desc">{step.desc}</p>
                    </div>
                  </li>
                </Reveal>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="landing-dar-section landing-dar-section--stats">
        <div className="landing-shell">
          <div className="landing-dar-stats">
            {stats.map((stat, index) => (
              <AnimatedStat key={stat.label} stat={stat} delay={index * 0.06} />
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="landing-dar-section landing-dar-section--alt">
        <div className="landing-shell landing-dar-faq-shell">
          <Reveal className="landing-dar-section-head">
            <p className="landing-dar-eyebrow">{t.faq.eyebrow}</p>
            <h2 className="landing-dar-section-title">{t.faq.title}</h2>
            <p className="landing-dar-section-lead">{t.faq.description}</p>
          </Reveal>

          <div className="landing-dar-faq-list">
            {t.faq.items.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <Reveal key={item.q} delay={index * 0.05}>
                  <div className={`landing-dar-faq-item${isOpen ? " is-open" : ""}`}>
                    <button
                      type="button"
                      className="landing-dar-faq-trigger"
                      aria-expanded={isOpen}
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                    >
                      <span>{item.q}</span>
                      <ChevronDown className="landing-dar-faq-chevron size-5" aria-hidden />
                    </button>
                    <div className="landing-dar-faq-panel" hidden={!isOpen}>
                      <p>{item.a}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="landing-dar-section landing-dar-section--cta">
        <div className="landing-shell">
          <Reveal className="landing-dar-cta-band">
            <div className="landing-dar-cta-copy">
              <h2 className="landing-dar-cta-title">
                {t.finalCta.title.line1}
                <br />
                {t.finalCta.title.line2}
              </h2>
              <p className="landing-dar-cta-lead">{t.finalCta.description}</p>
              <div className="landing-dar-cta-badges">
                <span>{t.finalCta.free}</span>
                <span>{t.finalCta.designed}</span>
              </div>
            </div>
            <div className="landing-dar-cta-actions">
              <Link to="/register" className="landing-dar-cta-primary landing-dar-shine">
                {t.finalCta.primaryCta}
                <ArrowRight data-rtl-mirror="true" className="size-4" />
              </Link>
              <Link to="/login" className="landing-dar-cta-secondary">
                {t.finalCta.secondaryCta}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
