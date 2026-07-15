import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { NotebookPen, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { ordersApi } from "@/api/modules";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Textarea } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuthStore } from "@/store/auth";
import { useT } from "@/i18n/useT";
import { formatDateTime } from "@/lib/format";
import { apiErrorMessage } from "@/lib/apiErrors";
import { canWriteOrderNotes } from "@/lib/permissions";
import type { Order } from "@/types/api";

export function OrderNotesPanel({ order }: { order: Order }) {
  const { t, locale } = useT();
  const tt = t.staffUi.orderCollab;
  const me = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const canWrite = canWriteOrderNotes(me, order);

  const { data: notes, isLoading } = useQuery({
    queryKey: ["order.notes", order.id],
    queryFn: () => ordersApi.listNotes(order.id),
  });

  const create = useMutation({
    mutationFn: () => ordersApi.createNote(order.id, body.trim()),
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["order.notes", order.id] });
      toast.success(tt.noteSaved);
    },
    onError: (err) => toast.error(apiErrorMessage(err, locale)),
  });

  const remove = useMutation({
    mutationFn: (noteId: number) => ordersApi.deleteNote(order.id, noteId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["order.notes", order.id] });
      toast.success(tt.noteDeleted);
    },
    onError: (err) => toast.error(apiErrorMessage(err, locale)),
  });

  return (
    <Card>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            <NotebookPen className="size-4 text-warning" />
            {tt.notesTitle}
          </span>
        }
        subtitle={tt.notesSubtitle}
      />
      <CardBody className="space-y-4 pt-2">
        {canWrite ? (
          <div className="rounded-xl border border-border bg-surface-2/40 p-3 space-y-2.5">
            <Textarea
              label={tt.notesComposeLabel}
              placeholder={tt.notesPlaceholder}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[96px]"
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                icon={<Plus className="size-3.5" />}
                loading={create.isPending}
                disabled={!body.trim()}
                onClick={() => create.mutate()}
              >
                {tt.addNote}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-caption rounded-lg border border-dashed border-border px-3 py-2">
            {tt.notesReadOnly}
          </p>
        )}

        <div className="space-y-2.5">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)
          ) : (notes ?? []).length === 0 ? (
            <EmptyState compact title={tt.notesEmpty} description={tt.notesEmptyHint} />
          ) : (
            (notes ?? []).map((n) => (
              <article
                key={n.id}
                className="rounded-xl border border-border bg-surface p-3.5 shadow-soft"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold text-text">
                      {n.author_name ?? t.common.none}
                    </div>
                    <div className="text-[11px] text-text-3">{formatDateTime(n.created_at)}</div>
                  </div>
                  {n.author_id === me?.id || me?.is_superuser ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 className="size-3.5" />}
                      loading={remove.isPending}
                      onClick={() => {
                        if (window.confirm(tt.confirmDeleteNote)) remove.mutate(n.id);
                      }}
                    >
                      {t.staffUi.common.delete}
                    </Button>
                  ) : null}
                </div>
                <p className="whitespace-pre-wrap break-words text-[13.5px] leading-relaxed text-text-2">
                  {n.body}
                </p>
              </article>
            ))
          )}
        </div>
      </CardBody>
    </Card>
  );
}
