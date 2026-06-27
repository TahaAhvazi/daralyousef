import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Users } from "lucide-react";

import { PagePanel } from "@/components/layout/PagePanel";
import { ChatEmptyState, ChatPane } from "@/components/messages/ChatPane";
import { ConversationSidebar } from "@/components/messages/ConversationSidebar";
import { NewGroupModal } from "@/components/messages/NewGroupModal";
import { conversationsApi, filesApi } from "@/api/modules";
import { uploadFiles } from "@/components/files/FileUploadPanel";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { findDmWithUser } from "@/lib/messenger";
import { useAuthStore } from "@/store/auth";
import { useT } from "@/i18n/useT";

export default function MessagesPage() {
  const user = useAuthStore((s) => s.user);
  const { t, locale } = useT();
  const m = t.staffUi.messages;
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const [activeId, setActiveId] = useState<number | null>(null);
  const [groupOpen, setGroupOpen] = useState(false);

  useEffect(() => {
    const c = searchParams.get("c");
    if (c) {
      const id = Number(c);
      if (!Number.isNaN(id) && id > 0) setActiveId(id);
    }
  }, [searchParams]);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => conversationsApi.list(),
    refetchInterval: 15_000,
  });

  const { data: active } = useQuery({
    queryKey: ["conversation", activeId],
    queryFn: () => conversationsApi.get(activeId!),
    enabled: !!activeId,
    refetchInterval: 10_000,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["conversations.orders"],
    queryFn: () => conversationsApi.orders(),
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["conversations.staff"],
    queryFn: () => conversationsApi.staff(),
  });

  const { data: attachments = [], refetch: refetchAttachments } = useQuery({
    queryKey: ["conversation.files", activeId],
    queryFn: () => filesApi.list("conversation", activeId!),
    enabled: !!activeId,
  });

  const send = useMutation({
    mutationFn: async ({
      body,
      orderId,
      files,
    }: {
      body: string;
      orderId?: number;
      files?: File[];
    }) => {
      await conversationsApi.send(activeId!, { body, order_id: orderId });
      if (files?.length) {
        await uploadFiles("conversation", activeId!, files, filesApi.upload);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversation", activeId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      refetchAttachments();
    },
  });

  const openDm = useMutation({
    mutationFn: async (otherUserId: number) => {
      const existing = findDmWithUser(conversations, otherUserId, user!.id);
      if (existing) return existing.id;
      const conv = await conversationsApi.create({ kind: "dm", member_ids: [otherUserId] });
      return conv.id;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      setActiveId(id);
    },
  });

  const sidebarLabels = {
    tabChats: m.tabChats,
    tabContacts: m.tabContacts,
    empty: m.empty,
    search: m.search,
    groupFallback: m.groupFallback,
  };

  const chatLabels = {
    placeholder: m.placeholder,
    linkProject: m.linkProject,
    noProject: m.noProject,
    attach: m.attach,
    attachments: m.attachments,
    groupFallback: m.groupFallback,
    today: m.today,
    selectChat: m.selectChat,
    uploadHint: t.staffUi.newOrder.uploadHint,
    send: t.staffUi.common.send,
  };

  if (isLoading) {
    return <div className="py-8 text-sm text-text-3">{t.common.loading}</div>;
  }

  return (
    <PagePanel className="gap-0 !h-[calc(100dvh-7.5rem)] min-h-[520px]">
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-surface px-4 py-3">
        <div>
          <h1 className="text-[17px] font-semibold text-text">{m.title}</h1>
          <p className="text-[12px] text-text-3">{m.description}</p>
        </div>
        {user?.is_superuser ? (
          <Button size="sm" icon={<Users className="size-4" />} onClick={() => setGroupOpen(true)}>
            {m.newGroup}
          </Button>
        ) : null}
      </div>

      <div className="grid min-h-0 flex-1 overflow-hidden rounded-b-xl border border-t-0 border-border lg:grid-cols-[minmax(280px,340px)_1fr]">
        <div
          className={cn(
            "min-h-0 flex flex-col",
            activeId ? "hidden lg:flex" : "flex",
          )}
        >
          <ConversationSidebar
            conversations={conversations}
            activeId={activeId}
            onSelect={setActiveId}
            onSelectContact={(id) => openDm.mutate(id)}
            staff={staff}
            selfId={user?.id}
            locale={locale}
            labels={sidebarLabels}
          />
        </div>

        <div
          className={cn(
            "min-h-0 flex flex-col",
            !activeId ? "hidden lg:flex" : "flex",
          )}
        >
          {active && activeId ? (
            <ChatPane
              conversation={active}
              selfId={user?.id}
              locale={locale}
              orders={orders}
              attachments={attachments}
              sending={send.isPending}
              showBack
              onBack={() => setActiveId(null)}
              labels={chatLabels}
              onSend={async (body, orderId, files) => {
                await send.mutateAsync({ body, orderId, files });
              }}
            />
          ) : (
            <ChatEmptyState message={m.selectChat} />
          )}
        </div>
      </div>

      {user?.is_superuser ? (
        <NewGroupModal
          open={groupOpen}
          onClose={() => setGroupOpen(false)}
          staff={staff}
          orders={orders}
          onCreated={setActiveId}
        />
      ) : null}
    </PagePanel>
  );
}
