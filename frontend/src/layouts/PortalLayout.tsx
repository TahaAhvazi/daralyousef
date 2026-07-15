import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutGrid, FileText, Receipt, LifeBuoy, LogOut, Package, UserRound } from "lucide-react";
import { useEffect } from "react";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useAuthStore } from "@/store/auth";
import { applyThemeClass, useThemeStore } from "@/store/theme";
import { applyLocaleToHtml, useLocaleStore } from "@/store/locale";
import { authApi } from "@/api/auth";
import { BrandMark } from "@/components/brand/BrandMark";
import { useT } from "@/i18n/useT";
import { useBrand } from "@/hooks/useBrand";
import { LanguageSwitcher } from "@/components/brand/LanguageSwitcher";
import { portalBreadcrumbs } from "@/lib/breadcrumbs";
import { cn } from "@/lib/cn";

export function PortalLayout() {
  const user = useAuthStore((s) => s.user);
  const refresh = useAuthStore((s) => s.refreshToken);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useThemeStore();
  const locale = useLocaleStore((s) => s.locale);
  const { t } = useT();
  const brand = useBrand();
  useEffect(() => applyThemeClass(theme), [theme]);
  useEffect(() => applyLocaleToHtml(locale), [locale]);

  const breadcrumbs = portalBreadcrumbs(location.pathname, t.portalUi.nav, {
    newOrder: t.portalUi.home.startOrder,
  });

  const ITEMS = [
    { to: "/portal", label: t.portalUi.nav.overview, shortLabel: t.portalUi.nav.overview, icon: <LayoutGrid className="size-4" /> },
    { to: "/portal/orders", label: t.portalUi.nav.myOrders, shortLabel: t.portalUi.nav.myOrders, icon: <Package className="size-4" /> },
    { to: "/portal/quotations", label: t.portalUi.nav.quotations, shortLabel: t.portalUi.nav.quotations, icon: <FileText className="size-4" /> },
    { to: "/portal/invoices", label: t.portalUi.nav.invoices, shortLabel: t.portalUi.nav.invoices, icon: <Receipt className="size-4" /> },
    { to: "/portal/tickets", label: t.portalUi.nav.support, shortLabel: t.portalUi.nav.support, icon: <LifeBuoy className="size-4" /> },
    { to: "/portal/profile", label: t.portalUi.nav.profile, shortLabel: t.portalUi.nav.profile, icon: <UserRound className="size-4" /> },
  ];

  const handleSignOut = async () => {
    try { if (refresh) await authApi.logout(refresh); } catch {}
    logout();
    navigate("/login");
  };

  return (
    <div className="relative flex h-dvh max-h-dvh w-full flex-col overflow-hidden bg-bg text-text">
      <div className="ambient pointer-events-none" />
      <header className="z-30 shrink-0 border-b border-border bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex min-h-14 max-w-[1200px] items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <BrandMark size={32} className="shadow-glow shrink-0 sm:size-9" />
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold tracking-tight sm:text-[14.5px]">
                {brand.name} · {t.portal.badge}
              </div>
              <div className="-mt-0.5 truncate text-[10.5px] text-text-3 sm:text-[11px]">
                {t.portalUi.welcomeUser.replace("{name}", user?.full_name ?? "")}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => navigate("/portal/profile")}
              className="rounded-full focus-ring"
              aria-label={t.portalUi.nav.profile}
            >
              <UserAvatar name={user?.full_name} seed={user?.id} src={user?.avatar_url} size="sm" />
            </button>
            <LanguageSwitcher variant="ghost" />
            <button
              onClick={handleSignOut}
              className="btn btn-secondary h-10 px-2.5 sm:px-3"
              aria-label={t.portalUi.signOut}
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">{t.portalUi.signOut}</span>
            </button>
          </div>
        </div>

        {breadcrumbs.length > 1 ? (
          <div className="mx-auto hidden max-w-[1200px] px-6 pb-2 md:block">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        ) : null}


        <nav className="mx-auto hidden max-w-[1200px] items-center gap-1 overflow-x-auto px-6 pb-3 md:flex" aria-label={t.portalUi.nav.overview}>
          {ITEMS.map((i) => (
            <NavLink
              key={i.to}
              to={i.to}
              end={i.to === "/portal"}
              className={({ isActive }) =>
                cn(
                  "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors min-h-[36px]",
                  isActive
                    ? "bg-brand/10 text-brand ring-1 ring-brand/15"
                    : "text-text-2 hover:bg-surface-2 hover:text-text",
                )
              }
            >
              {i.icon}
              {i.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="page-shell min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:pb-0">
        <div className="mx-auto max-w-[1200px] px-3 py-4 sm:px-6 sm:py-6">
          {breadcrumbs.length > 1 ? (
            <Breadcrumbs items={breadcrumbs} className="mb-4 md:hidden" />
          ) : null}
          <Outlet />
        </div>
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur-xl md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label={t.portalUi.nav.overview}
      >
        <div className="mx-auto flex max-w-[1200px] items-stretch justify-around gap-0.5 px-1 pt-1">
          {ITEMS.map((i) => (
            <NavLink
              key={i.to}
              to={i.to}
              end={i.to === "/portal"}
              className={({ isActive }) =>
                cn(
                  "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-medium transition-colors min-h-[52px]",
                  isActive ? "text-brand" : "text-text-3 hover:text-text-2",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      "grid size-9 place-items-center rounded-xl transition-colors",
                      isActive ? "bg-grad-brand text-white shadow-soft" : "bg-transparent",
                    )}
                  >
                    {i.icon}
                  </span>
                  <span className="max-w-full truncate leading-tight">{i.shortLabel}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
