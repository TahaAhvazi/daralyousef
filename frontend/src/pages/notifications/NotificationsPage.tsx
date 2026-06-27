import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Bell, CheckCheck, ClipboardList, MessageSquare } from "lucide-react";

import { notificationsApi } from "@/api/modules";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/cn";
import { fromNow } from "@/lib/format";
import { notificationDisplay, notificationIconType } from "@/lib/notificationText";
import { NOTIFICATIONS_KEY, useNotificationActions } from "@/hooks/useNotifications";
import { useT } from "@/i18n/useT";
import type { NotificationItem } from "@/types/api";

export default function NotificationsPage() {
  const { t } = useT();
  const nt = t.staffUi.notifications;
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const { markRead, markAllRead } = useNotificationActions();

  const { data, isLoading } = useQuery({
    queryKey: [...NOTIFICATIONS_KEY, "page", filter],
    queryFn: () =>
      notificationsApi.list({
        page: 1,
        page_size: 50,
        unread_only: filter === "unread",
      }),
    refetchInterval: 60_000,
  });

  const openItem = useMutation({
    mutationFn: async (item: NotificationItem) => {
      if (!item.read_at) await markRead.mutateAsync(item.id);
      if (item.link) navigate(item.link);
    },
  });

  const items = data?.items ?? [];
  const unreadCount = items.filter((i) => !i.read_at).length;

  return (
    <div className="page-shell">
      <PageHeader
        title={nt.title}
        description={nt.description}
        actions={
          unreadCount > 0 || filter === "unread" ? (
            <Button
              variant="secondary"
              className="w-full sm:w-auto"
              icon={<CheckCheck className="size-4" />}
              onClick={() => markAllRead.mutate()}
              loading={markAllRead.isPending}
            >
              {nt.markAllRead}
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", "unread"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
              filter === key
                ? "bg-brand text-white"
                : "bg-surface-2 text-text-2 hover:bg-surface-3",
            )}
          >
            {key === "all" ? nt.all : nt.unread}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden divide-y divide-border">
        {isLoading ? (
          <div className="p-8 text-center text-[13px] text-text-3">…</div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Bell className="size-7" />}
            title={nt.emptyTitle}
            description={nt.emptyHint}
          />
        ) : (
          items.map((item) => (
            <NotificationListRow
              key={item.id}
              item={item}
              onClick={() => openItem.mutate(item)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function NotificationListRow({
  item,
  onClick,
}: {
  item: NotificationItem;
  onClick: () => void;
}) {
  const { t } = useT();
  const display = notificationDisplay(item, t);
  const iconType = notificationIconType(item.type);
  const unread = !item.read_at;
  const Icon =
    iconType === "message" ? MessageSquare : iconType === "order" ? ClipboardList : Bell;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full gap-4 px-4 py-3.5 text-start transition-colors hover:bg-surface-2",
        unread && "bg-brand/[0.04]",
      )}
    >
      <div
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-xl",
          iconType === "message" && "bg-sky-500/15 text-sky-600 dark:text-sky-400",
          iconType === "order" && "bg-amber-500/15 text-amber-600 dark:text-amber-400",
          iconType === "bell" && "bg-surface-2 text-text-2",
        )}
      >
        <Icon className="size-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("text-[14px]", unread ? "font-semibold" : "font-medium")}>
            {display.title}
          </span>
          <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[10.5px] font-medium text-text-3">
            {display.kind}
          </span>
        </div>
        <p className="mt-1 text-[13px] text-text-2">{display.body}</p>
        <p className="mt-1.5 text-[11.5px] text-text-3">{fromNow(item.created_at)}</p>
      </div>
      {unread ? <span className="mt-2 size-2 shrink-0 rounded-full bg-grad-brand" /> : null}
    </button>
  );
}
