import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, CircleDollarSign } from "lucide-react";
import toast from "react-hot-toast";

import { filesApi, ordersApi } from "@/api/modules";
import { FileUploadPanel, uploadFiles } from "@/components/files/FileUploadPanel";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Input";
import { isOrderPaymentConfirmed } from "@/lib/orderStatuses";
import { useT } from "@/i18n/useT";
import type { Order } from "@/types/api";

type Props = {
  order: Order;
  canEdit: boolean;
};

export function OrderPaymentToggle({ order, canEdit }: Props) {
  const { t } = useT();
  const pt = t.staffUi.orders.payment;
  const qc = useQueryClient();
  const paid = isOrderPaymentConfirmed(order.status);
  const locked = paid && order.status !== "paid";
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [targetPaid, setTargetPaid] = useState(true);

  const { data: proofFiles = [] } = useQuery({
    queryKey: ["order-payment-proof", order.id],
    queryFn: () => filesApi.list("order", order.id),
    select: (files) => files.filter((f) => f.kind === "payment_proof"),
  });

  const toggle = useMutation({
    mutationFn: async () => {
      if (targetPaid && pendingFiles.length > 0) {
        await uploadFiles("order", order.id, pendingFiles, (et, eid, file) =>
          filesApi.upload(et, eid, file, "payment_proof"),
        );
      }
      return ordersApi.setPayment(order.id, targetPaid, notes.trim() || undefined);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["order", order.id] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["workflow-board"] });
      qc.invalidateQueries({ queryKey: ["order-payment-proof", order.id] });
      toast.success(targetPaid ? pt.markedPaid : pt.clearedPaid);
      setOpen(false);
      setNotes("");
      setPendingFiles([]);
    },
    onError: (e: Error) => toast.error(e.message || t.common.error),
  });

  const openModal = (nextPaid: boolean) => {
    setTargetPaid(nextPaid);
    setNotes("");
    setPendingFiles([]);
    setOpen(true);
  };

  const canSubmit =
    targetPaid
      ? notes.trim().length > 0 || pendingFiles.length > 0 || proofFiles.length > 0
      : notes.trim().length > 0;

  return (
    <>
      <label
        className={`flex items-center gap-2.5 select-none ${
          canEdit && !locked ? "cursor-pointer" : "cursor-default opacity-90"
        }`}
      >
        <span
          className={`size-5 shrink-0 grid place-items-center rounded border transition-colors ${
            paid
              ? "bg-success/15 border-success text-success"
              : "border-border bg-surface-2 text-text-3"
          }`}
        >
          {paid ? <Check className="size-3.5" /> : null}
        </span>
        <span className="flex items-center gap-1.5 text-[13px] font-medium text-text">
          <CircleDollarSign className="size-3.5 text-text-3" />
          {pt.label}
        </span>
        <input
          type="checkbox"
          className="sr-only"
          checked={paid}
          disabled={!canEdit || locked || toggle.isPending}
          onChange={(e) => openModal(e.target.checked)}
        />
      </label>

      {paid && proofFiles.length > 0 ? (
        <div className="mt-2 ps-7">
          <FileUploadPanel
            compact
            showPicker={false}
            pendingFiles={[]}
            onAddFiles={() => {}}
            onRemovePending={() => {}}
            attachments={proofFiles}
          />
        </div>
      ) : null}

      <Modal
        open={open}
        onClose={() => !toggle.isPending && setOpen(false)}
        title={targetPaid ? pt.confirmTitle : pt.revokeTitle}
      >
        <div className="space-y-4">
          <p className="text-[13px] text-text-2">
            {targetPaid ? pt.confirmHint : pt.revokeHint}
          </p>
          <Textarea
            label={targetPaid ? pt.notesLabel : pt.revokeReasonLabel}
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={targetPaid ? pt.notesPlaceholder : pt.revokeReasonPlaceholder}
          />
          {targetPaid ? (
            <FileUploadPanel
              compact
              label={pt.uploadLabel}
              hint={pt.uploadHint}
              accept="image/*,.pdf"
              pendingFiles={pendingFiles}
              onAddFiles={(files) => setPendingFiles((prev) => [...prev, ...files])}
              onRemovePending={(i) => setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))}
              attachments={proofFiles}
            />
          ) : null}
          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="secondary" disabled={toggle.isPending} onClick={() => setOpen(false)}>
              {t.staffUi.common.cancel}
            </Button>
            <Button
              loading={toggle.isPending}
              disabled={!canSubmit}
              onClick={() => toggle.mutate()}
            >
              {targetPaid ? pt.confirmBtn : pt.revokeBtn}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
