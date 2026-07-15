import { useMemo, useState } from "react";
import { MessageCircle, Search, UserRound, Users } from "lucide-react";

import { UserAvatar } from "@/components/messages/UserAvatar";
import { cn } from "@/lib/cn";
import { formatChatListTime } from "@/lib/format";
import { conversationPeer, conversationTitle } from "@/lib/messenger";
import type { Conversation } from "@/types/api";

type SidebarTab = "chats" | "contacts";

export function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onSelectContact,
  staff,
  selfId,
  labels,
  locale,
}: {
  conversations: Conversation[];
  activeId: number | null;
  onSelect: (id: number) => void;
  onSelectContact: (userId: number) => void;
  staff: { id: number; full_name: string; email: string; avatar_url?: string | null }[];
  selfId?: number;
  locale: string;
  labels: {
    tabChats: string;
    tabContacts: string;
    empty: string;
    search: string;
    groupFallback: string;
  };
}) {
  const [tab, setTab] = useState<SidebarTab>("chats");
  const [query, setQuery] = useState("");

  const filteredChats = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const title = conversationTitle(c, selfId, labels.groupFallback).toLowerCase();
      const preview = (c.last_message ?? "").toLowerCase();
      const order = (c.order_code ?? "").toLowerCase();
      return title.includes(q) || preview.includes(q) || order.includes(q);
    });
  }, [conversations, query, selfId, labels.groupFallback]);

  const filteredStaff = useMemo(() => {
    const q = query.trim().toLowerCase();
    return staff
      .filter((s) => s.id !== selfId)
      .filter((s) => !q || s.full_name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
  }, [staff, query, selfId]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface border-e border-border">
      <div className="flex shrink-0 border-b border-border">
        <button
          type="button"
          onClick={() => setTab("chats")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 py-3.5 text-[13px] font-medium transition-colors border-b-2",
            tab === "chats"
              ? "border-brand text-brand"
              : "border-transparent text-text-3 hover:text-text",
          )}
        >
          <MessageCircle className="size-4" />
          {labels.tabChats}
        </button>
        <button
          type="button"
          onClick={() => setTab("contacts")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 py-3.5 text-[13px] font-medium transition-colors border-b-2",
            tab === "contacts"
              ? "border-brand text-brand"
              : "border-transparent text-text-3 hover:text-text",
          )}
        >
          <UserRound className="size-4" />
          {labels.tabContacts}
        </button>
      </div>

      <div className="shrink-0 px-3 py-2.5">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-text-3 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={labels.search}
            className="w-full rounded-xl border border-border bg-surface-2/50 py-2 ps-9 pe-3 text-[13px] text-text placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {tab === "chats" ? (
          filteredChats.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-text-3">{labels.empty}</p>
          ) : (
            filteredChats.map((c) => {
              const title = conversationTitle(c, selfId, labels.groupFallback);
              const peer = conversationPeer(c, selfId);
              const displayName = c.kind === "group" ? title : peer?.full_name ?? title;
              const time = formatChatListTime(c.last_message_at ?? c.updated_at, locale);
              const active = activeId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelect(c.id)}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-3 text-start transition-colors",
                    active ? "bg-surface-2" : "hover:bg-surface-2/60",
                  )}
                >
                  {c.kind === "group" ? (
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/15 text-brand">
                      <Users className="size-5" />
                    </span>
                  ) : (
                    <UserAvatar
                      name={displayName}
                      seed={peer?.user_id ?? c.id}
                      src={peer?.avatar_url}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[14px] font-semibold text-text">{title}</span>
                      {time ? (
                        <span className="shrink-0 text-[11px] text-text-3">{time}</span>
                      ) : null}
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <p className="truncate text-[12.5px] text-text-3">
                        {c.last_message ?? (c.order_code ? `#${c.order_code}` : "—")}
                      </p>
                      {c.unread_count > 0 ? (
                        <span className="inline-flex min-w-[20px] h-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-semibold text-white">
                          {c.unread_count > 99 ? "99+" : c.unread_count}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })
          )
        ) : (
          filteredStaff.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelectContact(s.id)}
              className="flex w-full items-center gap-3 px-3 py-3 text-start transition-colors hover:bg-surface-2/60"
            >
              <UserAvatar name={s.full_name} seed={s.id} src={s.avatar_url} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-text">{s.full_name}</p>
                <p className="truncate text-[12px] text-text-3">{s.email}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
