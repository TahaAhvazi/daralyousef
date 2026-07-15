import { BrandMark } from "@/components/brand/BrandMark";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useAuthStore } from "@/store/auth";
import { useT } from "@/i18n/useT";
import { useBrand } from "@/hooks/useBrand";
import { cn } from "@/lib/cn";

export function Sidebar() {
  const { dir } = useT();
  const brand = useBrand();
  const user = useAuthStore((s) => s.user);

  return (
    <aside
      className={cn(
        "hidden lg:flex h-full min-h-0 w-[268px] shrink-0 flex-col border-border bg-surface/80 backdrop-blur-xl",
        dir === "rtl" ? "border-l" : "border-r",
      )}
    >
      <div className="flex items-center gap-3 px-4 pt-5 pb-4">
        <BrandMark size={38} className="shadow-glow shrink-0" />
        <div className="min-w-0">
          <div className="truncate text-[14.5px] font-semibold tracking-tight">{brand.name}</div>
          <div className="truncate text-[11px] text-text-3">{brand.sidebarSubtitle}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain px-2 pb-4">
        <SidebarNav />
      </div>

      <div className="mx-3 mb-4 rounded-xl border border-border/80 bg-surface-2/50 p-3">
        <div className="flex items-center gap-2.5">
          <UserAvatar name={user?.full_name} seed={user?.id} src={user?.avatar_url} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12.5px] font-semibold">{user?.full_name}</div>
            <div className="truncate text-[11px] text-text-3">{user?.email}</div>
          </div>
        </div>
        {(user?.roles?.length ?? 0) > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {(user?.roles || []).slice(0, 2).map((r) => (
              <span key={r.id} className="badge badge-brand">{r.name}</span>
            ))}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
