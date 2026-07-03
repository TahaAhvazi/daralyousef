import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";

import { useT } from "@/i18n/useT";
import { LANDING_COLUMN_SERVICES } from "@/pages/landing/serviceCategories";

const easeOut = [0.2, 0.7, 0.2, 1] as const;
const HOVER_CLOSE_MS = 140;

type MenuItem = {
  label: string;
  desc?: string;
  href?: string;
  to?: string;
};

type NavMenuConfig = {
  id: string;
  label: string;
  items: MenuItem[];
  viewAll?: { label: string; href: string };
};

function MenuLink({
  item,
  className,
  onNavigate,
}: {
  item: MenuItem;
  className: string;
  onNavigate?: () => void;
}) {
  if (item.to) {
    return (
      <Link to={item.to} className={className} onClick={onNavigate}>
        <span className="landing-dar-nav-dropdown-label">{item.label}</span>
        {item.desc ? <span className="landing-dar-nav-dropdown-desc">{item.desc}</span> : null}
      </Link>
    );
  }

  return (
    <a href={item.href} className={className} onClick={onNavigate}>
      <span className="landing-dar-nav-dropdown-label">{item.label}</span>
      {item.desc ? <span className="landing-dar-nav-dropdown-desc">{item.desc}</span> : null}
    </a>
  );
}

function NavHoverMenu({ menu }: { menu: NavMenuConfig }) {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };

  const hide = () => {
    closeTimer.current = setTimeout(() => setOpen(false), HOVER_CLOSE_MS);
  };

  return (
    <div
      className="landing-dar-nav-item"
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      <button
        type="button"
        className={`landing-dar-nav-trigger${open ? " is-open" : ""}`}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
      >
        <span>{menu.label}</span>
        <ChevronDown className="landing-dar-nav-chevron size-3.5" aria-hidden />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="landing-dar-nav-dropdown"
            initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.98 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.22, ease: easeOut }}
            onMouseEnter={show}
            onMouseLeave={hide}
          >
            <ul className="landing-dar-nav-dropdown-list">
              {menu.items.map((item) => (
                <li key={item.label}>
                  <MenuLink item={item} className="landing-dar-nav-dropdown-link" />
                </li>
              ))}
            </ul>
            {menu.viewAll ? (
              <a href={menu.viewAll.href} className="landing-dar-nav-dropdown-footer">
                {menu.viewAll.label}
              </a>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function LandingNavMenus() {
  const { t, locale } = useT();
  const isAr = locale.startsWith("ar");

  const servicesMenu: NavMenuConfig = {
    id: "services",
    label: t.nav.services,
    items: LANDING_COLUMN_SERVICES.map((service) => ({
      label: isAr ? service.titleAr : service.titleEn,
      desc: isAr ? service.descriptionAr : service.descriptionEn,
      href: "#services",
    })),
    viewAll: { label: t.nav.services, href: "#services" },
  };

  const howMenu: NavMenuConfig = {
    id: "how",
    label: t.nav.how,
    items: [
      { label: t.how.steps.orderOnline.title, desc: t.how.steps.orderOnline.desc, href: "#how" },
      { label: t.how.steps.uploadBrief.title, desc: t.how.steps.uploadBrief.desc, href: "#how" },
      { label: t.how.steps.approveDesign.title, desc: t.how.steps.approveDesign.desc, href: "#how" },
      { label: t.how.steps.receive.title, desc: t.how.steps.receive.desc, href: "#how" },
    ],
    viewAll: { label: t.nav.how, href: "#how" },
  };

  const portalMenu: NavMenuConfig = {
    id: "portal",
    label: t.nav.portal,
    items: [
      { label: t.landing.explorePortal, desc: t.landing.authCardLead, to: "/portal" },
      { label: t.nav.signIn, to: "/login" },
      { label: t.auth.createAccount, to: "/register" },
      { label: t.faq.eyebrow, desc: t.faq.description, href: "#faq" },
    ],
  };

  return (
    <nav className="landing-dar-nav-menus hidden sm:flex items-center gap-1">
      <NavHoverMenu menu={servicesMenu} />
      <NavHoverMenu menu={howMenu} />
      <NavHoverMenu menu={portalMenu} />
    </nav>
  );
}

export function useLandingMobileMenus() {
  const { t, locale } = useT();
  const isAr = locale.startsWith("ar");

  const menus: NavMenuConfig[] = [
    {
      id: "services",
      label: t.nav.services,
      items: LANDING_COLUMN_SERVICES.map((service) => ({
        label: isAr ? service.titleAr : service.titleEn,
        href: "#services",
      })),
      viewAll: { label: t.nav.services, href: "#services" },
    },
    {
      id: "how",
      label: t.nav.how,
      items: [
        { label: t.how.steps.orderOnline.title, href: "#how" },
        { label: t.how.steps.uploadBrief.title, href: "#how" },
        { label: t.how.steps.approveDesign.title, href: "#how" },
        { label: t.how.steps.receive.title, href: "#how" },
      ],
      viewAll: { label: t.nav.how, href: "#how" },
    },
    {
      id: "portal",
      label: t.nav.portal,
      items: [
        { label: t.landing.explorePortal, to: "/portal" },
        { label: t.nav.signIn, to: "/login" },
        { label: t.auth.createAccount, to: "/register" },
        { label: t.faq.eyebrow, href: "#faq" },
      ],
    },
  ];

  return menus;
}

export function LandingMobileMenuSection({
  menu,
  onNavigate,
}: {
  menu: NavMenuConfig;
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <li className="landing-dar-mobile-menu-section">
      <button
        type="button"
        className={`landing-dar-mobile-menu-trigger${open ? " is-open" : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{menu.label}</span>
        <ChevronDown className="landing-dar-nav-chevron size-4" aria-hidden />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.ul
            className="landing-dar-mobile-submenu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: easeOut }}
          >
            {menu.items.map((item) => (
              <li key={item.label}>
                <MenuLink
                  item={item}
                  className="landing-dar-mobile-submenu-link"
                  onNavigate={() => {
                    onNavigate();
                    setOpen(false);
                  }}
                />
              </li>
            ))}
            {menu.viewAll ? (
              <li>
                <a
                  href={menu.viewAll.href}
                  className="landing-dar-mobile-submenu-viewall"
                  onClick={onNavigate}
                >
                  {menu.viewAll.label}
                </a>
              </li>
            ) : null}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </li>
  );
}
