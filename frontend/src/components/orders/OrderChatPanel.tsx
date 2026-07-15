import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Send, Users } from "lucide-react";
import toast from "react-hot-toast";

import { conversationsApi } from "@/api/modules";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuthStore } from "@/store/auth";
import { useT } from "@/i18n/useT";
import { formatMessageTime } from "@/lib/format";
import { apiErrorMessage } from "@/lib/apiErrors";
import { cn } from "@/lib/cn";

export function OrderChatPanel({ orderId }: { orderId: number }) {
  const { t, locale } = useT();
  const tt = t.staffUi.orderCollab;
  const me = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: conv, isLoading, isError } = useQuery({
    queryKey: ["order.conversation", orderId],
    queryFn: () => conversationsApi.byOrder(orderId),
    refetchInterval: 8000,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conv?.messages?.length]);

  const send = useMutation({
    mutationFn: () => conversationsApi.send(conv!.id, { body: draft.trim(), order_id: orderId }),
    onSuccess: () => {
      setDraft("");
      qc.invalidateQueries({ queryKey: ["order.conversation", orderId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (err) => toast.error(apiErrorMessage(err, locale)),
  });

  const members = conv?.members ?? [];
  const messages = conv?.messages ?? [];

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            <MessageSquare className="size-4 text-brand" />
            {tt.chatTitle}
          </span>
        }
        subtitle={tt.chatSubtitle}
        action={
          members.length > 0 ? (
            <span className="inline-flex items-center gap-1 text-caption">
              <Users className="size-3.5" />
              {members.length}
            </span>
          ) : null
        }
      />
      <CardBody className="pt-0 space-y-3">
        {members.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {members.map((m) => (
              <span
                key={m.user_id}
                className="rounded-full border border-border bg-surface-2/80 px-2.5 py-0.5 text-[11.5px] text-text-2"
                title={m.email}
              >
                {m.full_name}
              </span>
            ))}
          </div>
        ) : null}

        <div className="flex min-h-[220px] max-h-[360px] flex-col overflow-hidden rounded-xl border border-border bg-surface-2/30">
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-3/4 rounded-xl" />)
            ) : isError ? (
              <EmptyState compact title={tt.chatLoadError} />
            ) : messages.length === 0 ? (
              <EmptyState compact title={tt.chatEmpty} description={tt.chatEmptyHint} />
            ) : (
              messages.map((msg) => {
                const self = msg.author_user_id === me?.id;
                return (
                  <div key={msg.id} className={cn("flex", self ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3.5 py-2 text-[13.5px] leading-relaxed shadow-soft",
                        self
                          ? "rounded-ee-md bg-brand text-white"
                          : "rounded-es-md border border-border bg-surface text-text",
                      )}
                    >
                      {!self && msg.author_name ? (
                        <div className={cn("mb-0.5 text-[11px] font-semibold", self ? "text-white/80" : "text-brand")}>
                          {msg.author_name}
                        </div>
                      ) : null}
                      <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                      <span className={cn("mt-1 block text-end text-[10px]", self ? "text-white/70" : "text-text-3")}>
                        {formatMessageTime(msg.created_at, locale)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          <form
            className="flex gap-2 border-t border-border bg-surface p-2.5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!draft.trim() || !conv || send.isPending) return;
              send.mutate();
            }}
          >
            <input
              className="input h-10 flex-1"
              placeholder={tt.chatPlaceholder}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={!conv || send.isPending}
            />
            <Button
              type="submit"
              size="sm"
              className="h-10 px-3"
              loading={send.isPending}
              disabled={!draft.trim() || !conv}
              icon={<Send className="size-4" />}
            >
              {tt.send}
            </Button>
          </form>
        </div>
      </CardBody>
    </Card>
  );
}
