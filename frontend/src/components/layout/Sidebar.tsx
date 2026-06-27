import { BrandMark } from "@/components/brand/BrandMark";
import { SidebarNav } from "@/components/layout/SidebarNav";
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
        "hidden lg:flex h-full min-h-0 w-[260px] shrink-0 flex-col bg-surface/60",
        dir === "rtl" ? "border-l border-border" : "border-r border-border",
      )}
    >
      <div className="px-5 pt-5 pb-3 flex items-center gap-2.5">
        <BrandMark size={36} className="shadow-glow" />
        <div>
          <div className="text-[14.5px] font-semibold tracking-tight">{brand.name}</div>
          <div className="text-[11px] text-text-3 -mt-0.5">{brand.sidebarSubtitle}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-6">
        <SidebarNav />
      </div>

      <div className="m-3 rounded-xl p-3 glass">
        <div className="text-[12px] font-semibold">{user?.full_name}</div>
        <div className="text-[11px] text-text-3 truncate">{user?.email}</div>
        <div className="mt-1 flex flex-wrap gap-1">
          {(user?.roles || []).slice(0, 2).map((r) => (
            <span key={r.id} className="badge badge-brand">{r.name}</span>
          ))}
        </div>
      </div>
    </aside>
  );
}
