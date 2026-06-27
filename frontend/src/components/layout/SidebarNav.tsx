import { NavLink } from "react-router-dom";

import { cn } from "@/lib/cn";
import { useAuthStore } from "@/store/auth";
import { useT } from "@/i18n/useT";
import { STAFF_NAV_SECTIONS, filterNavItem } from "@/components/layout/navConfig";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useT();
  const user = useAuthStore((s) => s.user);

  return (
    <nav className="px-3 py-4">
      {STAFF_NAV_SECTIONS.map((section) => {
        const items = section.items.filter((item) => filterNavItem(item, user));
        if (items.length === 0) return null;
        return (
          <div key={section.labelKey} className="mt-4 first:mt-0">
            <div className="px-3 mb-2 text-[10.5px] font-semibold uppercase tracking-[.08em] text-text-3">
              {t.staffUi.nav[section.labelKey]}
            </div>
            <ul className="space-y-0.5">
              {items.map((item) => (
                <li key={`${item.to}-${String(item.perm)}`}>
                  <NavLink
                    to={item.to}
                    end={item.to === "/app"}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        "group flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13.5px] text-text-2 transition-colors",
                        isActive
                          ? "bg-grad-brand/[.08] text-text font-semibold shadow-soft"
                          : "hover:bg-surface-2 hover:text-text",
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={cn(
                            "grid place-items-center rounded-md size-7 shrink-0",
                            isActive
                              ? "bg-grad-brand text-white shadow-soft"
                              : "bg-surface-2 text-text-3 group-hover:text-text",
                          )}
                        >
                          {item.icon}
                        </span>
                        <span>{t.staffUi.nav[item.labelKey]}</span>
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
