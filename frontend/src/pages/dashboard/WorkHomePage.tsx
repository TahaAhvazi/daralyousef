import { Link, useLocation } from "react-router-dom";
import {
  Boxes, FileText, LayoutGrid, LifeBuoy, Plus, Receipt, Users,
} from "lucide-react";

import { Card, CardBody } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageTip } from "@/components/ui/PageTip";
import { useAuthStore } from "@/store/auth";
import { hasPermission } from "@/lib/permissions";
import { useT } from "@/i18n/useT";
import { staffBreadcrumbs } from "@/lib/breadcrumbs";

type HintKey = keyof ReturnType<typeof useT>["t"]["staffUi"]["workHome"]["hints"];

const TILES: {
  to: string;
  labelKey: "orderBoard" | "newOrder" | "customers" | "invoices" | "quotations" | "materials" | "tickets" | "orders";
  hintKey: HintKey;
  icon: typeof LayoutGrid;
  perm: string;
  tone: string;
  primary?: boolean;
}[] = [
  { to: "/app/orders/board", labelKey: "orderBoard", hintKey: "orderBoard", icon: LayoutGrid, perm: "production:read", tone: "bg-brand/10 text-brand", primary: true },
  { to: "/app/orders/board", labelKey: "orderBoard", hintKey: "orderBoard", icon: LayoutGrid, perm: "production:update", tone: "bg-brand/10 text-brand", primary: true },
  { to: "/app/orders/new", labelKey: "newOrder", hintKey: "newOrder", icon: Plus, perm: "orders:create", tone: "bg-success/10 text-success", primary: true },
  { to: "/app/customers", labelKey: "customers", hintKey: "customers", icon: Users, perm: "crm:read", tone: "bg-info/10 text-info" },
  { to: "/app/invoices", labelKey: "invoices", hintKey: "invoices", icon: Receipt, perm: "finance:read", tone: "bg-warning/10 text-warning" },
  { to: "/app/quotations", labelKey: "quotations", hintKey: "quotations", icon: FileText, perm: "finance:read", tone: "bg-accent/15 text-accent-2" },
  { to: "/app/materials", labelKey: "materials", hintKey: "materials", icon: Boxes, perm: "inventory:read", tone: "bg-surface-2 text-text-2" },
  { to: "/app/tickets", labelKey: "tickets", hintKey: "tickets", icon: LifeBuoy, perm: "support:read", tone: "bg-danger/10 text-danger" },
];

export default function WorkHomePage() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const { t } = useT();
  const nav = t.staffUi.nav;
  const wh = t.staffUi.workHome;

  const tiles = TILES.filter(
    (tile, idx, arr) =>
      hasPermission(user, tile.perm) &&
      arr.findIndex((x) => x.to === tile.to && x.labelKey === tile.labelKey) === idx,
  );

  const primary = tiles.filter((x) => x.primary);
  const rest = tiles.filter((x) => !x.primary);
  const breadcrumbs = staffBreadcrumbs(location.pathname, nav);

  return (
    <div className="page-shell space-y-6">
      <PageHeader
        title={wh.title}
        description={wh.description}
        breadcrumbs={breadcrumbs}
      />

      <PageTip storageKey="work-home">
        {user?.full_name
          ? `${user.full_name}${user.roles?.[0]?.name ? ` · ${user.roles[0].name}` : ""} — `
          : ""}
        {wh.description}
      </PageTip>

      {tiles.length === 0 ? (
        <Card>
          <CardBody>
            <p className="py-8 text-center text-sm text-text-3">{t.staffUi.common.noResults}</p>
          </CardBody>
        </Card>
      ) : (
        <>
          {primary.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-overline px-0.5">{t.staffUi.common.startHere}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {primary.map((tile) => (
                  <TileCard key={`${tile.to}-${tile.perm}`} tile={tile} label={nav[tile.labelKey]} hint={wh.hints[tile.hintKey]} openLabel={wh.openShortcut} big />
                ))}
              </div>
            </section>
          ) : null}

          {rest.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-overline px-0.5">{nav.operations}</h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {rest.map((tile) => (
                  <TileCard key={`${tile.to}-${tile.perm}`} tile={tile} label={nav[tile.labelKey]} hint={wh.hints[tile.hintKey]} openLabel={wh.openShortcut} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}

function TileCard({
  tile,
  label,
  hint,
  openLabel,
  big,
}: {
  tile: (typeof TILES)[number];
  label: string;
  hint: string;
  openLabel: string;
  big?: boolean;
}) {
  return (
    <Link
      to={tile.to}
      data-tour={
        tile.labelKey === "orderBoard"
          ? "tile-order-board"
          : tile.labelKey === "newOrder"
            ? "tile-new-order"
            : tile.labelKey === "invoices"
              ? "tile-invoices"
              : tile.labelKey === "customers"
                ? "tile-customers"
                : tile.labelKey === "materials"
                  ? "tile-materials"
                  : undefined
      }
      className="group block h-full focus-ring rounded-2xl"
    >
      <Card interactive className="h-full ring-1 ring-transparent group-hover:ring-brand/20">
        <CardBody className={`flex h-full flex-col gap-3 ${big ? "p-5 sm:p-6" : "p-4 sm:p-5"}`}>
          <div className="flex items-center gap-3">
            <span className={`grid shrink-0 place-items-center rounded-xl ${tile.tone} ${big ? "size-12" : "size-10"}`}>
              <tile.icon className={big ? "size-6" : "size-5"} />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className={big ? "text-lg font-semibold tracking-tight" : "text-heading"}>{label}</h3>
              <p className="mt-0.5 text-[13px] leading-snug text-text-2">{hint}</p>
            </div>
          </div>
          <span className="mt-auto inline-flex items-center gap-1 text-[13px] font-semibold text-brand">
            {openLabel}
          </span>
        </CardBody>
      </Card>
    </Link>
  );
}
