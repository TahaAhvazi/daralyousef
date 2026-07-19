import { Check } from "lucide-react";

import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { orderBoardColumn, type OrderBoardColumn } from "@/lib/workflow";
import { useT } from "@/i18n/useT";
import type { Order } from "@/types/api";

const FLOW_STEPS: OrderBoardColumn[] = [
  "intake",
  "approval",
  "confirmed",
  "paid",
  "warehouse",
  "design",
  "printing",
  "production",
  "finishing",
  "delivery",
  "completed",
];

export function OrderLifecycleGuide({ order }: { order: Order }) {
  const { t } = useT();
  const lc = t.staffUi.orderLifecycle;
  const cols = t.staffUi.orderBoard.columns as Record<string, string>;
  const current = orderBoardColumn(order);
  const curIdx = FLOW_STEPS.indexOf(current as (typeof FLOW_STEPS)[number]);
  const roleHints: Record<string, string> = {
    intake: lc.roleSales,
    approval: lc.roleSales,
    confirmed: lc.roleAccountant,
    paid: lc.roleWarehouse,
    warehouse: lc.roleWarehouse,
    design: lc.roleDesigner,
    printing: lc.rolePrint,
    production: lc.roleCnc,
    finishing: lc.roleFinish,
    delivery: lc.roleDelivery,
    completed: lc.roleDone,
  };

  return (
    <Card>
      <CardHeader title={lc.guideTitle} subtitle={lc.guideSubtitle} />
      <CardBody>
        <ol className="space-y-1.5">
          {FLOW_STEPS.map((step, idx) => {
            const done = curIdx > idx || current === "completed";
            const active = step === current;
            const label = cols[step] ?? step;
            const roleHint = roleHints[step] ?? "";
            return (
              <li
                key={step}
                className={cn(
                  "flex items-start gap-2 rounded-md px-2 py-1.5 text-[12.5px]",
                  active && "bg-brand/10 text-brand",
                  done && !active && "text-text-3",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px]",
                    active && "border-brand bg-brand text-white",
                    done && !active && "border-emerald-500/40 bg-emerald-500/15 text-emerald-700",
                    !done && !active && "border-border text-text-3",
                  )}
                >
                  {done && !active ? <Check className="size-3" /> : idx + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{label}</span>
                  {roleHint ? (
                    <span className="mt-0.5 block text-[11px] text-text-3">{roleHint}</span>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 text-[11.5px] text-text-3">{lc.gmHint}</p>
      </CardBody>
    </Card>
  );
}
