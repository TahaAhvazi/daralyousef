import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Hash, MoreVertical, Paperclip, Send } from "lucide-react";

import { UserAvatar } from "@/components/messages/UserAvatar";
import { FileUploadPanel, uploadFiles } from "@/components/files/FileUploadPanel";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { formatDate, formatMessageTime } from "@/lib/format";
import { conversationTitle, sameDay } from "@/lib/messenger";
import type { Attachment, ChatMessage, Conversation } from "@/types/api";

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex justify-center py-3">
      <span className="rounded-full bg-black/5 px-3 py-1 text-[11px] font-medium text-text-3 dark:bg-white/10">
        {label}
      </span>
    </div>
  );
}

function MessageBubble({
  msg,
  self,
  showAvatar,
  locale,
}: {
  msg: ChatMessage;
  self: boolean;
  showAvatar: boolean;
  locale: string;
}) {
  return (
    <div className={cn("flex gap-2 mb-1", self ? "flex-row-reverse" : "flex-row")}>
      {showAvatar ? (
        <UserAvatar name={msg.author_name} seed={String(msg.author_user_id)} size="sm" className="mt-auto mb-0.5" />
      ) : (
        <span className="size-9 shrink-0" />
      )}
      <div className={cn("flex max-w-[72%] flex-col", self ? "items-end" : "items-start")}>
        {!self && showAvatar && msg.author_name ? (
          <span className="mb-0.5 px-1 text-[11px] font-medium text-brand">{msg.author_name}</span>
        ) : null}
        <div
          className={cn(
            "relative px-3.5 py-2 text-[13.5px] leading-relaxed shadow-sm",
            self
              ? "rounded-2xl rounded-ee-md bg-brand text-white"
              : "rounded-2xl rounded-es-md bg-white text-text dark:bg-surface border border-border/40",
          )}
        >
          {msg.order_id && msg.order_code ? (
            <Link
              to={`/app/orders/${msg.order_id}`}
              className={cn(
                "mb-1.5 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium",
                self ? "bg-white/20 text-white" : "bg-brand/10 text-brand",
              )}
            >
              <Hash className="size-3" />
              {msg.order_code}
            </Link>
          ) : null}
          <p className="whitespace-pre-wrap break-words">{msg.body}</p>
          <span
            className={cn(
              "mt-1 block text-end text-[10px]",
              self ? "text-white/75" : "text-text-3",
            )}
          >
            {formatMessageTime(msg.created_at, locale)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ChatPane({
  conversation,
  selfId,
  locale,
  orders,
  attachments,
  onSend,
  sending,
  onBack,
  showBack,
  labels,
}: {
  conversation: Conversation;
  selfId?: number;
  locale: string;
  orders: { id: number; code: string; title?: string | null }[];
  attachments: Attachment[];
  onSend: (body: string, orderId?: number, files?: File[]) => Promise<void>;
  sending: boolean;
  onBack?: () => void;
  showBack?: boolean;
  labels: {
    placeholder: string;
    linkProject: string;
    noProject: string;
    attach: string;
    attachments: string;
    groupFallback: string;
    today: string;
    selectChat: string;
    uploadHint: string;
    send: string;
  };
}) {
  const [body, setBody] = useState("");
  const [orderId, setOrderId] = useState<number | "">(conversation.order_id ?? "");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [showExtras, setShowExtras] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const title = conversationTitle(conversation, selfId, labels.groupFallback);

  const grouped = useMemo(() => {
    const out: { date: string; label: string; messages: ChatMessage[] }[] = [];
    for (const msg of conversation.messages) {
      const day = msg.created_at.slice(0, 10);
      const last = out[out.length - 1];
      if (!last || !sameDay(last.date, day)) {
        const isToday = day === new Date().toISOString().slice(0, 10);
        out.push({
          date: day,
          label: isToday ? labels.today : formatDate(msg.created_at, "MMMM D, YYYY", locale),
          messages: [msg],
        });
      } else {
        last.messages.push(msg);
      }
    }
    return out;
  }, [conversation.messages, labels.today, locale]);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [conversation.messages.length]);

  const handleSend = async () => {
    const text = body.trim();
    if (!text && pendingFiles.length === 0) return;
    await onSend(
      text || "📎",
      orderId === "" ? undefined : orderId,
      pendingFiles.length ? pendingFiles : undefined,
    );
    setBody("");
    setPendingFiles([]);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#e8edf3] dark:bg-surface-2/30">
      <header className="flex shrink-0 items-center gap-3 border-b border-border/60 bg-surface px-4 py-3">
        {showBack ? (
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg p-2 text-text-2 hover:bg-surface-2 lg:hidden"
            aria-label="Back"
          >
            <ArrowLeft className="size-5" />
          </button>
        ) : null}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[15px] font-semibold text-text">{title}</h2>
          {conversation.order_code ? (
            <Link
              to={`/app/orders/${conversation.order_id}`}
              className="inline-flex items-center gap-1 text-[11px] text-brand hover:underline"
            >
              <Hash className="size-3" />
              {conversation.order_code}
            </Link>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setShowExtras((v) => !v)}
          className="rounded-lg p-2 text-text-3 hover:bg-surface-2"
        >
          <MoreVertical className="size-5" />
        </button>
      </header>

      <div ref={threadRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-5">
        {grouped.map((g) => (
          <div key={g.date}>
            <DateSeparator label={g.label} />
            {g.messages.map((msg, idx) => {
              const prev = g.messages[idx - 1];
              const showAvatar =
                !prev ||
                prev.author_user_id !== msg.author_user_id ||
                msg.created_at.slice(0, 16) !== prev.created_at.slice(0, 16);
              return (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  self={msg.author_user_id === selfId}
                  showAvatar={showAvatar}
                  locale={locale}
                />
              );
            })}
          </div>
        ))}
        {attachments.length > 0 ? (
          <div className="mx-2 mt-4 rounded-xl border border-border/60 bg-white/80 p-3 dark:bg-surface/80">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-3">
              {labels.attachments}
            </p>
            <FileUploadPanel compact showPicker={false} pendingFiles={[]} onAddFiles={() => {}} onRemovePending={() => {}} attachments={attachments} />
          </div>
        ) : null}
      </div>

      {showExtras ? (
        <div className="shrink-0 border-t border-border/60 bg-surface px-4 py-2">
          <Select
            label={labels.linkProject}
            value={orderId === "" ? "" : String(orderId)}
            options={[
              { value: "", label: labels.noProject },
              ...orders.map((o) => ({ value: String(o.id), label: `${o.code} — ${o.title ?? o.code}` })),
            ]}
            onChange={(e) => {
              const v = (e.target as HTMLSelectElement).value;
              setOrderId(v === "" ? "" : Number(v));
            }}
          />
        </div>
      ) : null}

      {pendingFiles.length > 0 ? (
        <div className="shrink-0 border-t border-border/40 bg-surface px-4 py-2">
          <FileUploadPanel
            compact
            pendingFiles={pendingFiles}
            onAddFiles={() => {}}
            onRemovePending={(i) => setPendingFiles((p) => p.filter((_, idx) => idx !== i))}
            showPicker={false}
          />
        </div>
      ) : null}

      <footer className="shrink-0 border-t border-border/60 bg-surface p-3 sm:p-4">
        <div className="flex items-end gap-2">
          <label className="cursor-pointer rounded-xl p-2.5 text-text-3 transition-colors hover:bg-surface-2 hover:text-brand">
            <Paperclip className="size-5" />
            <input
              type="file"
              multiple
              className="sr-only"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                if (files.length) setPendingFiles((p) => [...p, ...files]);
                e.target.value = "";
              }}
            />
          </label>
          <textarea
            rows={1}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder={labels.placeholder}
            className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border border-border bg-surface-2/40 px-4 py-2.5 text-[14px] text-text placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-brand/25"
          />
          <Button
            variant="primary"
            className="!rounded-xl !px-3"
            loading={sending}
            disabled={!body.trim() && pendingFiles.length === 0}
            onClick={() => void handleSend()}
            aria-label={labels.send}
          >
            <Send className="size-5" />
          </Button>
        </div>
      </footer>
    </div>
  );
}

export function ChatEmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full min-h-[320px] flex-col items-center justify-center bg-[#e8edf3] dark:bg-surface-2/20 text-text-3">
      <div className="mb-3 flex size-16 items-center justify-center rounded-full bg-white shadow-sm dark:bg-surface">
        <Send className="size-7 opacity-40" />
      </div>
      <p className="text-[14px]">{message}</p>
    </div>
  );
}
