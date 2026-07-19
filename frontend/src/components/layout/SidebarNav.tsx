import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/cn";
import { useAuthStore } from "@/store/auth";
import { useT } from "@/i18n/useT";
import {
  STAFF_NAV_SECTIONS,
  filterNavItem,
  sectionMatchesPath,
} from "@/components/layout/navConfig";
import { TOUR_OPEN_SECTION_EVENT } from "@/lib/productTour";

const STORAGE_KEY = "staff-nav-open-modules-v2";

function tourPathId(to: string): string {
  return to.replace(/^\/app\/?/, "").replace(/\//g, "-") || "home";
}

function needsExactMatch(to: string, allPaths: string[]): boolean {
  if (to === "/app") return true;
  return allPaths.some((other) => other !== to && other.startsWith(`${to}/`));
}

function loadOpen(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { t, isRtl } = useT();
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const [open, setOpen] = useState<Set<string>>(loadOpen);

  const visibleSections = useMemo(
    () =>
      STAFF_NAV_SECTIONS.map((section) => ({
        ...section,
        items: section.items.filter((item) => filterNavItem(item, user)),
      })).filter((section) => section.items.length > 0),
    [user],
  );

  const allPaths = useMemo(
    () => visibleSections.flatMap((s) => s.items.map((i) => i.to)),
    [visibleSections],
  );

  useEffect(() => {
    const active = visibleSections.find((s) => sectionMatchesPath(s, location.pathname));
    if (!active) return;
    setOpen((prev) => {
      if (prev.has(active.id)) return prev;
      const next = new Set(prev);
      next.add(active.id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  }, [location.pathname, visibleSections]);

  useEffect(() => {
    const onTourOpen = (event: Event) => {
      const sectionId = (event as CustomEvent<{ sectionId?: string }>).detail?.sectionId;
      if (!sectionId) return;
      setOpen((prev) => {
        if (prev.has(sectionId)) return prev;
        const next = new Set(prev);
        next.add(sectionId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
        return next;
      });
    };
    window.addEventListener(TOUR_OPEN_SECTION_EVENT, onTourOpen);
    return () => window.removeEventListener(TOUR_OPEN_SECTION_EVENT, onTourOpen);
  }, []);

  const toggle = (id: string) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  return (
    <nav className="py-2" aria-label={t.staffUi.nav.modDashboard}>
      {visibleSections.map((section) => {
        const isOpen = open.has(section.id);
        const hasActive = sectionMatchesPath(section, location.pathname);
        return (
          <div key={section.id} className="mb-0.5">
            <button
              type="button"
              data-tour={`nav-section-${section.id}`}
              onClick={() => toggle(section.id)}
              className={cn(
                "flex w-full min-h-[42px] items-center gap-2 rounded-xl px-3 py-2 text-[13.5px] font-semibold transition-colors",
                hasActive ? "text-brand" : "text-text-2 hover:bg-surface-2 hover:text-text",
              )}
              aria-expanded={isOpen}
            >
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-lg",
                  hasActive ? "bg-grad-brand text-white" : "bg-surface-2 text-text-3",
                )}
              >
                {section.icon}
              </span>
              <span className="min-w-0 flex-1 truncate text-start">
                {t.staffUi.nav[section.labelKey]}
              </span>
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-text-3 transition-transform",
                  isOpen && "rotate-180",
                  isRtl && !isOpen && "",
                )}
              />
            </button>

            {isOpen ? (
              <ul className="ms-3 space-y-0.5 border-s border-border/70 ps-2 py-1">
                {section.items.map((item) => (
                  <li key={`${section.id}-${item.to}-${item.labelKey}`}>
                    <NavLink
                      to={item.to}
                      end={needsExactMatch(item.to, allPaths)}
                      data-tour={`nav-item-${tourPathId(item.to)}`}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          "group flex min-h-[38px] items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] transition-all",
                          isActive
                            ? "bg-brand/10 font-semibold text-brand"
                            : "text-text-2 hover:bg-surface-2 hover:text-text",
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className={cn(
                              "grid size-7 shrink-0 place-items-center rounded-md",
                              isActive
                                ? "bg-brand/15 text-brand"
                                : "text-text-3 group-hover:text-text",
                            )}
                          >
                            {item.icon}
                          </span>
                          <span className="truncate">{t.staffUi.nav[item.labelKey]}</span>
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
