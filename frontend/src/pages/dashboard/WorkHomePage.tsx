import { Link } from "react-router-dom";
import {
  Boxes, FileText, LayoutGrid, LifeBuoy, ListChecks, Receipt, Users,
} from "lucide-react";

import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuthStore } from "@/store/auth";
import { hasPermission } from "@/lib/permissions";
import { useT } from "@/i18n/useT";

const TILES = [
  { to: "/app/orders/board", labelKey: "orderBoard" as const, icon: LayoutGrid, perm: "production:read" },
  { to: "/app/orders/board", labelKey: "orderBoard" as const, icon: LayoutGrid, perm: "production:update" },
  { to: "/app/orders/new", labelKey: "orders" as const, icon: ListChecks, perm: "orders:create" },
  { to: "/app/customers", labelKey: "customers" as const, icon: Users, perm: "crm:read" },
  { to: "/app/invoices", labelKey: "invoices" as const, icon: Receipt, perm: "finance:read" },
  { to: "/app/quotations", labelKey: "quotations" as const, icon: FileText, perm: "finance:read" },
  { to: "/app/materials", labelKey: "materials" as const, icon: Boxes, perm: "inventory:read" },
  { to: "/app/tickets", labelKey: "tickets" as const, icon: LifeBuoy, perm: "support:read" },
];

export default function WorkHomePage() {
  const user = useAuthStore((s) => s.user);
  const { t } = useT();
  const nav = t.staffUi.nav;

  const tiles = TILES.filter(
    (tile, idx, arr) =>
      hasPermission(user, tile.perm) &&
      arr.findIndex((x) => x.to === tile.to && x.labelKey === tile.labelKey) === idx,
  );

  return (
    <div className="page-shell">
      <PageHeader
        title={nav.dashboard}
        description={user?.roles?.[0]?.name ?? user?.full_name ?? ""}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => (
          <Link key={`${tile.to}-${tile.perm}`} to={tile.to}>
            <Card className="h-full hover:shadow-glow transition-shadow">
              <CardHeader title={nav[tile.labelKey]} />
              <CardBody className="flex items-center gap-3 pt-0 text-text-2">
                <span className="grid place-items-center size-10 rounded-xl bg-brand/10 text-brand">
                  <tile.icon className="size-5" />
                </span>
                <span className="text-[13px]">{t.staffUi.common.next} →</span>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
      {tiles.length === 0 ? (
        <p className="text-text-3 text-sm mt-4">{t.staffUi.common.noResults}</p>
      ) : null}
    </div>
  );
}
