import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, ClipboardList, MessageSquare, MonitorSmartphone } from "lucide-react";

import {
  useNotificationActions,
  useNotificationsList,
  useUnreadNotificationCount,
} from "@/hooks/useNotifications";
import { useWebPush } from "@/hooks/useWebPush";
import { dismissPushPrompt } from "@/lib/webPush";
import { notificationDisplay, notificationIconType } from "@/lib/notificationText";
import { fromNow } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useT } from "@/i18n/useT";
import type { NotificationItem } from "@/types/api";
import { Button } from "@/components/ui/Button";

function NotificationRow({
  item,
  onOpen,
}: {
  item: NotificationItem;
  onOpen: (item: NotificationItem) => void;
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
      onClick={() => onOpen(item)}
      className={cn(
        "flex w-full gap-3 px-3.5 py-3 text-start transition-colors hover:bg-surface-2",
        unread && "bg-brand/5",
      )}
    >
      <div
        className={cn(
          "mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg",
          iconType === "message" && "bg-sky-500/15 text-sky-600 dark:text-sky-400",
          iconType === "order" && "bg-amber-500/15 text-amber-600 dark:text-amber-400",
          iconType === "bell" && "bg-surface-2 text-text-2",
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-[13px] leading-snug", unread ? "font-semibold" : "font-medium")}>
            {display.title}
          </p>
          {unread ? <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-grad-brand" /> : null}
        </div>
        <p className="mt-0.5 line-clamp-2 text-[12px] text-text-3">{display.body}</p>
        <p className="mt-1 text-[11px] text-text-3">{fromNow(item.created_at)}</p>
      </div>
    </button>
  );
}

export function NotificationBell() {
  const navigate = useNavigate();
  const { t, dir } = useT();
  const tb = t.staffUi.topbar;
  const tt = t.staffUi.settings;
  const [open, setOpen] = useState(false);
  const [promptHidden, setPromptHidden] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: unread = 0 } = useUnreadNotificationCount();
  const { data } = useNotificationsList({ pageSize: 10 });
  const { markRead, markAllRead } = useNotificationActions();
  const push = useWebPush();

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleOpen = async (item: NotificationItem) => {
    if (!item.read_at) {
      try {
        await markRead.mutateAsync(item.id);
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
    if (item.link) navigate(item.link);
    else navigate("/app/notifications");
  };

  const badge =
    unread > 0 ? (
      <span className="absolute -top-0.5 -end-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-grad-brand px-1 text-[10px] font-bold text-white">
        {unread > 99 ? "99+" : unread}
      </span>
    ) : null;

  const showEnableBanner = push.showPrompt && !promptHidden;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="btn btn-ghost relative h-9 w-9 p-0"
        aria-label={tb.notifications}
        aria-expanded={open}
      >
        <Bell className="size-4" />
        {badge}
      </button>

      {open ? (
        <div
          className={cn(
            "absolute z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border glass shadow-xl animate-fade-up",
            dir === "rtl" ? "start-0" : "end-0",
          )}
        >
          <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
            <span className="text-[13px] font-semibold">{tb.notifications}</span>
            {unread > 0 ? (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="flex items-center gap-1 text-[11.5px] font-medium text-brand hover:underline"
              >
                <CheckCheck className="size-3.5" />
                {tb.markAllRead}
              </button>
            ) : null}
          </div>

          {showEnableBanner ? (
            <div className="border-b border-border bg-brand/5 px-3.5 py-3">
              <div className="flex gap-2.5">
                <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-brand/15 text-brand">
                  <MonitorSmartphone className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold text-text">{tt.pushPromptTitle}</p>
                  <p className="mt-0.5 text-[11.5px] leading-snug text-text-2">{tt.pushPromptBody}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Button
                      size="sm"
                      className="!h-8 !text-[11.5px]"
                      loading={push.isEnabling}
                      onClick={() => push.enable()}
                    >
                      {tt.pushEnable}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="!h-8 !text-[11.5px]"
                      onClick={() => {
                        dismissPushPrompt();
                        setPromptHidden(true);
                      }}
                    >
                      {tt.pushLater}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="max-h-[min(24rem,60vh)] overflow-y-auto divide-y divide-border/60">
            {(data?.items ?? []).length === 0 ? (
              <div className="px-4 py-8 text-center text-[13px] text-text-3">{tb.noNotifications}</div>
            ) : (
              (data?.items ?? []).map((item) => (
                <NotificationRow key={item.id} item={item} onOpen={handleOpen} />
              ))
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate("/app/notifications");
            }}
            className="w-full border-t border-border px-3.5 py-2.5 text-center text-[12.5px] font-medium text-brand hover:bg-surface-2"
          >
            {tb.viewAllNotifications}
          </button>
        </div>
      ) : null}
    </div>
  );
}
