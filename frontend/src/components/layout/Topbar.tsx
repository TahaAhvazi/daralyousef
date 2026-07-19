import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, Menu, Moon, Search, Sun, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useAuthStore } from "@/store/auth";
import { applyThemeClass, useThemeStore } from "@/store/theme";
import { authApi } from "@/api/auth";
import { useT } from "@/i18n/useT";
import { LanguageSwitcher } from "@/components/brand/LanguageSwitcher";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { BrandMark } from "@/components/brand/BrandMark";
import { TourReplayButton } from "@/components/tour/ProductTour";
import { Dropdown } from "@/components/ui/Dropdown";
import { useBrand } from "@/hooks/useBrand";
import { staffBreadcrumbs } from "@/lib/breadcrumbs";

export function Topbar({ onMenuOpen }: { onMenuOpen?: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, dir } = useT();
  const brand = useBrand();
  const user = useAuthStore((s) => s.user);
  const refresh = useAuthStore((s) => s.refreshToken);
  const logout = useAuthStore((s) => s.logout);
  const { theme, toggle } = useThemeStore();
  useEffect(() => applyThemeClass(theme), [theme]);
  const [searchOpen, setSearchOpen] = useState(false);

  const breadcrumbs = staffBreadcrumbs(location.pathname, t.staffUi.nav, {
    notifications: t.staffUi.topbar.notifications,
  });

  const handleLogout = async () => {
    try {
      if (refresh) await authApi.logout(refresh);
    } catch {}
    logout();
    navigate("/login");
  };

  return (
    <header className="z-30 shrink-0 border-b border-border bg-surface/80 backdrop-blur-xl supports-[backdrop-filter]:bg-surface/70">
      <div className="relative flex items-center gap-2 px-3 sm:gap-3 sm:px-6 min-h-14 py-2">
        <button
          type="button"
          onClick={onMenuOpen}
          className="btn btn-ghost h-10 w-10 shrink-0 p-0 lg:hidden"
          aria-label={t.staffUi.topbar.openMenu}
        >
          <Menu className="size-5" />
        </button>

        <div className="flex min-w-0 flex-1 flex-col gap-1 lg:gap-0.5">
          <div className="flex min-w-0 items-center gap-2 lg:hidden">
            <BrandMark size={28} className="shadow-glow shrink-0" />
            <span className="truncate text-[13px] font-semibold tracking-tight max-w-[120px] sm:max-w-none">
              {brand.name}
            </span>
          </div>
          <Breadcrumbs items={breadcrumbs} className="hidden lg:flex" />
        </div>

        <div className="hidden lg:block flex-1 max-w-md xl:max-w-lg">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-text-3" aria-hidden />
            <input
              placeholder={t.staffUi.topbar.search}
              className="input ps-9 h-10"
              aria-label={t.staffUi.topbar.search}
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={() => setSearchOpen((s) => !s)}
            className="btn btn-ghost h-10 w-10 p-0 lg:hidden"
            aria-label={t.staffUi.topbar.search}
          >
            <Search className="size-4" />
          </button>
          <LanguageSwitcher variant="ghost" align={dir === "rtl" ? "start" : "end"} />
          <TourReplayButton />
          <button
            onClick={toggle}
            className="btn btn-ghost h-10 w-10 p-0"
            aria-label={t.staffUi.topbar.themeToggle}
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <NotificationBell />

          <Dropdown
            align={dir === "rtl" ? "start" : "end"}
            trigger={
              <button
                type="button"
                className="focus-ring flex items-center gap-2 rounded-xl px-1.5 py-1.5 sm:px-2 hover:bg-surface-2 transition-colors"
                aria-label={t.staffUi.topbar.profile}
              >
                <UserAvatar
                  name={user?.full_name}
                  seed={user?.id}
                  src={user?.avatar_url}
                  size="sm"
                />
                <div className="hidden md:block text-start leading-tight">
                  <div className="text-[12.5px] font-semibold max-w-[8rem] truncate">{user?.full_name}</div>
                  <div className="text-[11px] text-text-3 truncate max-w-[8rem]">
                    {user?.roles?.[0]?.name ?? t.staffUi.topbar.defaultRole}
                  </div>
                </div>
              </button>
            }
            items={[
              {
                id: "profile",
                label: t.staffUi.topbar.profile,
                icon: <UserIcon className="size-4" />,
                onClick: () => navigate("/app/settings"),
              },
              {
                id: "logout",
                label: t.staffUi.topbar.signOut,
                icon: <LogOut className="size-4" />,
                danger: true,
                onClick: handleLogout,
              },
            ]}
          />
        </div>
      </div>

      {searchOpen ? (
        <div className="border-t border-border px-3 pb-3 pt-2 lg:hidden">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-text-3" />
            <input
              autoFocus
              placeholder={t.staffUi.topbar.search}
              className="input ps-9 w-full h-10"
              onBlur={() => setSearchOpen(false)}
            />
          </div>
        </div>
      ) : null}

      {breadcrumbs.length > 1 ? (
        <div className="border-t border-border/70 px-3 py-2 lg:hidden sm:px-6">
          <Breadcrumbs items={breadcrumbs} />
        </div>
      ) : null}
    </header>
  );
}
