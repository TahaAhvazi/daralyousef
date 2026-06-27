import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PackageCheck } from "lucide-react";
import toast from "react-hot-toast";

import { ordersApi } from "@/api/modules";
import { Button } from "@/components/ui/Button";
import { CollapsibleCard } from "@/components/ui/CollapsibleCard";
import { Textarea } from "@/components/ui/Input";
import { useT } from "@/i18n/useT";

type Copy = {
  title: string;
  hint: string;
  question: string;
  yes: string;
  success: string;
};

type Props = {
  orderId: number;
  copy: Copy;
  showNotes?: boolean;
  notesLabel?: string;
  onSuccess?: () => void;
};

export function OrderReceiptConfirmCard({
  orderId,
  copy,
  showNotes = false,
  notesLabel,
  onSuccess,
}: Props) {
  const { t } = useT();
  const qc = useQueryClient();
  const [notes, setNotes] = useState("");
  const [confirming, setConfirming] = useState(false);

  const confirm = useMutation({
    mutationFn: () => ordersApi.confirmReceipt(orderId, notes.trim() || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["order", orderId] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["portal.orders.all"] });
      qc.invalidateQueries({ queryKey: ["workflow-board"] });
      toast.success(copy.success);
      setNotes("");
      setConfirming(false);
      onSuccess?.();
    },
    onError: (e: Error) => toast.error(e.message || t.common.error),
  });

  return (
    <CollapsibleCard title={copy.title} subtitle={copy.hint} compact>
      <div className="space-y-3">
        <p className="text-[13px] font-medium text-text flex items-center gap-2">
          <PackageCheck className="size-4 text-brand shrink-0" />
          {copy.question}
        </p>
        {showNotes ? (
          <Textarea
            label={notesLabel}
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        ) : null}
        {!confirming ? (
          <Button size="sm" onClick={() => setConfirming(true)} icon={<PackageCheck className="size-4" />}>
            {copy.yes}
          </Button>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              loading={confirm.isPending}
              onClick={() => confirm.mutate()}
              icon={<PackageCheck className="size-4" />}
            >
              {copy.yes}
            </Button>
            <Button size="sm" variant="secondary" disabled={confirm.isPending} onClick={() => setConfirming(false)}>
              {t.staffUi.common.cancel}
            </Button>
          </div>
        )}
      </div>
    </CollapsibleCard>
  );
}
