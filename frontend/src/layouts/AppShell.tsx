import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import { Sidebar } from "@/components/layout/Sidebar";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Topbar } from "@/components/layout/Topbar";
import { Drawer } from "@/components/ui/Drawer";
import { BrandMark } from "@/components/brand/BrandMark";
import { useNotificationStream } from "@/hooks/useNotificationStream";
import { useWebPush } from "@/hooks/useWebPush";
import { useAuthStore } from "@/store/auth";
import { useBrand } from "@/hooks/useBrand";

export function AppShell() {
  const location = useLocation();
  const isOrderBoard = location.pathname.endsWith("/orders/board");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const brand = useBrand();
  useNotificationStream();
  useWebPush();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onMsg = (event: MessageEvent) => {
      const data = event.data as { type?: string; url?: string } | undefined;
      if (data?.type === "notification-click" && data.url) {
        window.location.assign(data.url);
      }
    };
    navigator.serviceWorker?.addEventListener("message", onMsg);
    return () => navigator.serviceWorker?.removeEventListener("message", onMsg);
  }, []);

  return (
    <div className="relative flex h-dvh max-h-dvh w-full overflow-hidden bg-bg text-text">
      <div className="ambient" />
      <Sidebar />

      <Drawer
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        title={
          <div className="flex items-center gap-2.5 min-w-0">
            <BrandMark size={32} className="shadow-glow shrink-0" />
            <div className="min-w-0">
              <div className="truncate text-[14px] font-semibold">{brand.name}</div>
              <div className="truncate text-[11px] text-text-3 font-normal">{brand.sidebarSubtitle}</div>
            </div>
          </div>
        }
      >
        <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
        <div className="mx-3 mb-4 rounded-xl p-3 glass">
          <div className="text-[12px] font-semibold">{user?.full_name}</div>
          <div className="text-[11px] text-text-3 truncate">{user?.email}</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {(user?.roles || []).slice(0, 2).map((r) => (
              <span key={r.id} className="badge badge-brand">{r.name}</span>
            ))}
          </div>
        </div>
      </Drawer>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Topbar onMenuOpen={() => setMobileNavOpen(true)} />
        <main className="min-h-0 flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className={
                isOrderBoard
                  ? "flex h-full min-h-0 w-full max-w-none flex-col overflow-hidden px-3 py-3"
                  : "page-shell mx-auto flex h-full min-h-0 w-full max-w-[1320px] flex-col overflow-y-auto overflow-x-hidden overscroll-contain px-3 py-4 sm:px-6 sm:py-6"
              }
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
