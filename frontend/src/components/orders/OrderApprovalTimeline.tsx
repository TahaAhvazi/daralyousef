import { useMemo } from "react";
import { Link } from "react-router-dom";
import { MessageSquare } from "lucide-react";

import { StatusBadge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useT } from "@/i18n/useT";
import type { OrderStatusEvent } from "@/types/api";

type Props = {
  events: OrderStatusEvent[];
  title?: string;
  showTeamLink?: boolean;
  maxItems?: number;
  className?: string;
};

export function OrderApprovalTimeline({
  events,
  title,
  showTeamLink,
  maxItems = 50,
  className,
}: Props) {
  const { t } = useT();
  const tl = t.staffUi.orders.timeline;
  const tStatus = (s: string) => (t.portalUi.statuses as Record<string, string>)[s] ?? s;

  const sorted = useMemo(
    () =>
      [...events]
        .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
        .slice(0, maxItems),
    [events, maxItems],
  );

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader title={title ?? tl.title} subtitle={tl.subtitle} className="shrink-0" />
      <CardBody className="flex flex-col p-0">
        <div className="px-5 pb-4">
          {sorted.length === 0 ? (
            <p className="text-[13px] text-text-3 py-2">{tl.noMessage}</p>
          ) : (
            <ol className="relative border-s border-border/80 ms-2 space-y-0">
              {sorted.map((ev, idx) => {
                const isStaff = ev.actor_kind === "staff";
                const isLatest = idx === 0;
                return (
                  <li key={ev.id} className={`relative ps-5 ${idx < sorted.length - 1 ? "pb-4" : "pb-0"}`}>
                    <span
                      className={`absolute -start-[5px] top-1 size-2.5 rounded-full ring-2 ring-surface ${
                        isLatest ? "bg-brand" : "bg-border"
                      }`}
                    />
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <StatusBadge status={ev.to_status} />
                      <span className="text-[11px] text-text-3 tabular-nums">
                        {formatDateTime(ev.occurred_at)}
                      </span>
                    </div>
                    <div className="text-[11px] text-text-3 mb-1.5">
                      {ev.actor_name ?? (isStaff ? tl.staff : tl.customer)}
                      {ev.from_status ? (
                        <span>
                          {" "}
                          · {tStatus(ev.from_status)} → {tStatus(ev.to_status)}
                        </span>
                      ) : null}
                    </div>
                    {ev.notes?.trim() ? (
                      <div
                        className={`rounded-lg px-3 py-2 text-[12.5px] leading-relaxed ${
                          isStaff
                            ? "bg-surface border border-border"
                            : "bg-brand/10 border border-brand/20"
                        }`}
                      >
                        <div className="flex items-center gap-1 text-[10px] text-text-3 mb-1">
                          <MessageSquare className="size-3" />
                          {tl.thread}
                        </div>
                        <p className="whitespace-pre-wrap text-text">{ev.notes}</p>
                      </div>
                    ) : (
                      <p className="text-[11.5px] text-text-3 italic">{tl.noMessage}</p>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {showTeamLink ? (
          <div className="shrink-0 border-t border-border/60 px-5 py-3">
            <Link to="/app/messages" className="text-[12px] text-brand inline-flex items-center gap-1">
              {tl.openMessages}
            </Link>
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
