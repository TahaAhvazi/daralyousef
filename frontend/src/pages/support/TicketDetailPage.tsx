import { useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Send, UserRound } from "lucide-react";
import toast from "react-hot-toast";

import { ticketsApi, filesApi } from "@/api/modules";
import { FileUploadPanel, uploadFiles } from "@/components/files/FileUploadPanel";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Select, Textarea } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDateTime } from "@/lib/format";
import {
  canAssignTickets,
  canCloseTicket,
  canReplyToTicket,
  isTicketClosed,
} from "@/lib/permissions";
import { useAuthStore } from "@/store/auth";
import { useT } from "@/i18n/useT";
import type { Ticket, TicketMessage } from "@/types/api";

function ticketBasePath(pathname: string) {
  return pathname.startsWith("/portal") ? "/portal/tickets" : "/app/tickets";
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const ticketId = Number(id);
  const location = useLocation();
  const base = ticketBasePath(location.pathname);
  const user = useAuthStore((s) => s.user);
  const { t } = useT();
  const td = t.staffUi.tickets.detail;
  const qc = useQueryClient();
  const [reply, setReply] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const threadRef = useRef<HTMLDivElement>(null);

  const { data: ticket, isLoading } = useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: () => ticketsApi.get(ticketId),
    enabled: !!ticketId,
  });

  const { data: assignees = [] } = useQuery({
    queryKey: ["ticket.assignees"],
    queryFn: () => ticketsApi.assignees(),
    enabled: !!user && canAssignTickets(user),
  });

  const { data: attachments = [], refetch: refetchAttachments } = useQuery({
    queryKey: ["ticket.files", ticketId],
    queryFn: () => filesApi.list("ticket", ticketId),
    enabled: !!ticketId,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["ticket", ticketId] });
    qc.invalidateQueries({ queryKey: ["tickets"] });
    qc.invalidateQueries({ queryKey: ["portal.tickets"] });
  };

  const sendReply = useMutation({
    mutationFn: async () => {
      const text = reply.trim() || (pendingFiles.length ? "📎 Attachment" : "");
      await ticketsApi.reply(ticketId, text);
      if (pendingFiles.length) {
        await uploadFiles("ticket", ticketId, pendingFiles, filesApi.upload);
      }
    },
    onSuccess: () => {
      setReply("");
      setPendingFiles([]);
      invalidate();
      refetchAttachments();
      toast.success(td.replySent);
      threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
    },
  });

  const closeTicket = useMutation({
    mutationFn: () => ticketsApi.update(ticketId, { status: "closed" }),
    onSuccess: () => {
      invalidate();
      toast.success(td.closed);
    },
  });

  const assignTicket = useMutation({
    mutationFn: (assigneeId: number | "") =>
      ticketsApi.update(ticketId, { assignee_id: assigneeId === "" ? null : assigneeId }),
    onSuccess: () => {
      invalidate();
      toast.success(td.assigned);
    },
  });

  const messages = useMemo(() => {
    if (!ticket) return [] as TicketMessage[];
    const sorted = [...ticket.messages].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    if (sorted.length > 0) return sorted;
    if (ticket.body) {
      return [{
        id: 0,
        body: ticket.body,
        author_kind: "customer",
        author_name: null,
        created_at: ticket.created_at,
      }];
    }
    return sorted;
  }, [ticket]);

  if (isLoading || !ticket) {
    return <div className="text-text-3 text-sm py-8">{t.common.loading}</div>;
  }

  const closed = isTicketClosed(ticket);
  const canReply = canReplyToTicket(user, ticket);
  const canClose = canCloseTicket(user, ticket);
  const canAssign = canAssignTickets(user);
  const priorityLabel =
    t.staffUi.tickets.priorities[ticket.priority as keyof typeof t.staffUi.tickets.priorities]
    ?? ticket.priority;

  return (
    <div className="page-shell">
      <PageHeader
        title={ticket.subject}
        description={<span className="font-mono text-[12px]">{ticket.code}</span>}
        actions={
          <>
            <Link to={base} className="btn btn-secondary w-full sm:w-auto">
              <ArrowLeft className="size-4" /> {td.back}
            </Link>
            {canClose ? (
              <Button
                variant="secondary"
                className="w-full sm:w-auto"
                loading={closeTicket.isPending}
                icon={<CheckCircle2 className="size-4" />}
                onClick={() => closeTicket.mutate()}
              >
                {td.closeBtn}
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader title={td.conversation} subtitle={closed ? td.closedHint : td.openHint} />
            <CardBody className="p-0">
              <div ref={threadRef} className="max-h-[min(520px,60vh)] overflow-y-auto p-5 space-y-3">
                {messages.map((msg) => {
                  const isStaff = msg.author_kind === "staff";
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isStaff ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                          isStaff
                            ? "bg-surface-2 border border-border"
                            : "bg-brand/10 border border-brand/20"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1 text-[11px] text-text-3">
                          <span className="font-medium text-text-2">
                            {msg.author_name
                              ?? (isStaff ? td.staffLabel : td.customerLabel)}
                          </span>
                          <span>·</span>
                          <span>{formatDateTime(msg.created_at)}</span>
                        </div>
                        <p className="whitespace-pre-wrap">{msg.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {canReply ? (
                <div className="border-t border-border p-4 space-y-3">
                  <Textarea
                    rows={3}
                    placeholder={td.replyPlaceholder}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                  />
                  <FileUploadPanel
                    compact
                    pendingFiles={pendingFiles}
                    onAddFiles={(files) => setPendingFiles((prev) => [...prev, ...files])}
                    onRemovePending={(i) => setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    attachments={attachments}
                    label={t.staffUi.messages.attach}
                    hint={t.staffUi.newOrder.uploadHint}
                    disabled={sendReply.isPending}
                  />
                  <Button
                    loading={sendReply.isPending}
                    disabled={!reply.trim() && pendingFiles.length === 0}
                    icon={<Send className="size-4" />}
                    onClick={() => sendReply.mutate()}
                  >
                    {t.staffUi.common.send}
                  </Button>
                </div>
              ) : closed ? (
                <div className="border-t border-border p-4 text-[13px] text-text-3">
                  {td.closedHint}
                </div>
              ) : null}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title={td.details} />
            <CardBody className="space-y-3 text-[13px]">
              <div className="flex justify-between gap-3">
                <span className="text-text-2">{t.staffUi.tickets.colStatus}</span>
                <StatusBadge status={ticket.status} />
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-text-2">{t.staffUi.tickets.colPriority}</span>
                <span>{priorityLabel}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-text-2">{t.staffUi.tickets.colCreated}</span>
                <span className="tabular-nums">{formatDateTime(ticket.created_at)}</span>
              </div>
              {ticket.assignee_name || ticket.assignee_id ? (
                <div className="flex justify-between gap-3">
                  <span className="text-text-2">{td.assignee}</span>
                  <span className="inline-flex items-center gap-1.5">
                    <UserRound className="size-3.5 text-text-3" />
                    {ticket.assignee_name ?? `#${ticket.assignee_id}`}
                  </span>
                </div>
              ) : null}
            </CardBody>
          </Card>

          {canAssign ? (
            <Card>
              <CardHeader title={td.assignTitle} subtitle={td.assignHint} />
              <CardBody>
                <Select
                  label={td.assignee}
                  value={ticket.assignee_id ?? ""}
                  options={[
                    { value: "", label: td.unassigned },
                    ...assignees.map((a) => ({ value: String(a.id), label: a.full_name })),
                  ]}
                  onChange={(e) => {
                    const v = (e.target as HTMLSelectElement).value;
                    assignTicket.mutate(v === "" ? "" : Number(v));
                  }}
                />
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
