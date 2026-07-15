import { useMemo } from "react";
import { NavLink } from "react-router-dom";

import { cn } from "@/lib/cn";
import { useAuthStore } from "@/store/auth";
import { useT } from "@/i18n/useT";
import { STAFF_NAV_SECTIONS, filterNavItem } from "@/components/layout/navConfig";

/** Use exact match when another nav path is nested under this one (e.g. /orders vs /orders/new). */
function needsExactMatch(to: string, allPaths: string[]): boolean {
  if (to === "/app") return true;
  return allPaths.some((other) => other !== to && other.startsWith(`${to}/`));
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useT();
  const user = useAuthStore((s) => s.user);

  const allPaths = useMemo(
    () =>
      STAFF_NAV_SECTIONS.flatMap((section) =>
        section.items.filter((item) => filterNavItem(item, user)).map((item) => item.to),
      ),
    [user],
  );

  return (
    <nav className="py-2" aria-label={t.staffUi.nav.overview}>
      {STAFF_NAV_SECTIONS.map((section) => {
        const items = section.items.filter((item) => filterNavItem(item, user));
        if (items.length === 0) return null;
        return (
          <div key={section.labelKey} className="mt-5 first:mt-0">
            <div className="mb-1.5 px-3 text-overline">
              {t.staffUi.nav[section.labelKey]}
            </div>
            <ul className="space-y-0.5">
              {items.map((item) => (
                <li key={`${item.to}-${String(item.perm)}`}>
                  <NavLink
                    to={item.to}
                    end={needsExactMatch(item.to, allPaths)}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        "group flex min-h-[42px] items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px] transition-all",
                        isActive
                          ? "bg-brand/10 font-semibold text-brand shadow-soft ring-1 ring-brand/15"
                          : "text-text-2 hover:bg-surface-2 hover:text-text",
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={cn(
                            "grid size-8 shrink-0 place-items-center rounded-lg transition-colors",
                            isActive
                              ? "bg-grad-brand text-white shadow-soft"
                              : "bg-surface-2 text-text-3 group-hover:text-text",
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
          </div>
        );
      })}
    </nav>
  );
}
