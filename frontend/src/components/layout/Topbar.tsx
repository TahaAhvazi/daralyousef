import { useNavigate } from "react-router-dom";
import { LogOut, Menu, Moon, Search, Sun, User as UserIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useAuthStore } from "@/store/auth";
import { applyThemeClass, useThemeStore } from "@/store/theme";
import { authApi } from "@/api/auth";
import { useT } from "@/i18n/useT";
import { LanguageSwitcher } from "@/components/brand/LanguageSwitcher";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { BrandMark } from "@/components/brand/BrandMark";
import { useBrand } from "@/hooks/useBrand";

export function Topbar({ onMenuOpen }: { onMenuOpen?: () => void }) {
  const navigate = useNavigate();
  const { t, dir } = useT();
  const brand = useBrand();
  const user = useAuthStore((s) => s.user);
  const refresh = useAuthStore((s) => s.refreshToken);
  const logout = useAuthStore((s) => s.logout);
  const { theme, toggle } = useThemeStore();
  useEffect(() => applyThemeClass(theme), [theme]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleLogout = async () => {
    try {
      if (refresh) await authApi.logout(refresh);
    } catch {}
    logout();
    navigate("/login");
  };

  return (
    <header className="z-30 shrink-0 border-b border-border backdrop-blur supports-[backdrop-filter]:bg-surface/60">
      <div className="relative flex items-center gap-2 px-3 sm:gap-3 sm:px-6 h-14">
        <button
          type="button"
          onClick={onMenuOpen}
          className="btn btn-ghost h-9 w-9 shrink-0 p-0 lg:hidden"
          aria-label={t.staffUi.topbar.openMenu}
        >
          <Menu className="size-5" />
        </button>

        <div className="flex min-w-0 items-center gap-2 lg:hidden">
          <BrandMark size={28} className="shadow-glow shrink-0" />
          <span className="truncate text-[13px] font-semibold tracking-tight max-w-[120px] sm:max-w-none">
            {brand.name}
          </span>
        </div>

        <div className="hidden lg:block flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-text-3" />
            <input
              placeholder={t.staffUi.topbar.search}
              className="input ps-9"
            />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end gap-1 sm:gap-1.5 lg:flex-none">
          <button
            type="button"
            onClick={() => setSearchOpen((s) => !s)}
            className="btn btn-ghost h-9 w-9 p-0 lg:hidden"
            aria-label={t.staffUi.topbar.search}
          >
            <Search className="size-4" />
          </button>
          <LanguageSwitcher variant="ghost" align={dir === "rtl" ? "start" : "end"} />
          <button
            onClick={toggle}
            className="btn btn-ghost h-9 w-9 p-0"
            aria-label={t.staffUi.topbar.themeToggle}
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <NotificationBell />

          <div ref={ref} className="relative">
            <button
              onClick={() => setMenuOpen((s) => !s)}
              className="flex items-center gap-2 rounded-xl px-1.5 py-1.5 sm:px-2 hover:bg-surface-2 transition-colors"
            >
              <div className="size-8 rounded-full bg-grad-brand grid place-items-center text-white text-[12px] font-semibold shrink-0">
                {(user?.full_name || "?").split(" ").map((s) => s[0]).slice(0, 2).join("")}
              </div>
              <div className="hidden md:block text-start leading-tight">
                <div className="text-[12.5px] font-semibold">{user?.full_name}</div>
                <div className="text-[11px] text-text-3">{user?.roles?.[0]?.name ?? t.staffUi.topbar.defaultRole}</div>
              </div>
            </button>
            {menuOpen ? (
              <div className="absolute end-0 mt-2 w-56 glass rounded-xl overflow-hidden animate-fade-up z-50">
                <button
                  onClick={() => { setMenuOpen(false); navigate("/app/settings"); }}
                  className="flex w-full items-center gap-2 px-3.5 py-2.5 text-[13.5px] hover:bg-surface-2 text-start"
                >
                  <UserIcon className="size-4 text-text-2" />
                  {t.staffUi.topbar.profile}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3.5 py-2.5 text-[13.5px] hover:bg-surface-2 text-danger text-start"
                >
                  <LogOut className="size-4" />
                  {t.staffUi.topbar.signOut}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {searchOpen ? (
        <div className="border-t border-border px-3 pb-3 pt-2 lg:hidden">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-text-3" />
            <input
              autoFocus
              placeholder={t.staffUi.topbar.search}
              className="input ps-9 w-full"
              onBlur={() => setSearchOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </header>
  );
}
