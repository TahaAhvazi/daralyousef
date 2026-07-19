import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, PackageSearch, XCircle } from "lucide-react";
import toast from "react-hot-toast";

import { ordersApi } from "@/api/modules";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Input";
import { canStockCheckOrder } from "@/lib/permissions";
import { apiErrorMessage } from "@/lib/apiErrors";
import { useAuthStore } from "@/store/auth";
import { useT } from "@/i18n/useT";
import type { Order } from "@/types/api";

export function OrderStockCheckPanel({ order }: { order: Order }) {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const { t, locale } = useT();
  const sc = t.staffUi.orderLifecycle.stockCheck;
  const [notes, setNotes] = useState("");

  const canAct = canStockCheckOrder(user);
  const waiting = order.status === "paid" && order.stock_check_status !== "approved";

  const mutate = useMutation({
    mutationFn: (approved: boolean) =>
      ordersApi.stockCheck(order.id, { approved, notes: notes.trim() || undefined }),
    onSuccess: (_data, approved) => {
      qc.invalidateQueries({ queryKey: ["order", order.id] });
      qc.invalidateQueries({ queryKey: ["workflow-board"] });
      qc.invalidateQueries({ queryKey: ["order.conversation", order.id] });
      toast.success(approved ? sc.approvedToast : sc.rejectedToast);
      setNotes("");
    },
    onError: (err) => toast.error(apiErrorMessage(err, locale)),
  });

  if (order.status === "cancelled" || order.status === "closed") return null;
  if (!waiting && order.stock_check_status !== "approved" && order.stock_check_status !== "rejected") {
    if (order.status !== "paid") return null;
  }
  if (!waiting && !order.stock_check_status) return null;

  return (
    <Card>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            <PackageSearch className="size-4 text-brand" />
            {sc.title}
          </span>
        }
        subtitle={sc.subtitle}
      />
      <CardBody className="space-y-3">
        {order.stock_check_status === "approved" ? (
          <p className="text-[13px] text-emerald-700 dark:text-emerald-400">
            {sc.approvedLabel}
            {order.stock_check_notes ? ` — ${order.stock_check_notes}` : ""}
          </p>
        ) : null}
        {order.stock_check_status === "rejected" ? (
          <p className="text-[13px] text-amber-700 dark:text-amber-400">
            {sc.rejectedLabel}
            {order.stock_check_notes ? ` — ${order.stock_check_notes}` : ""}
          </p>
        ) : null}
        {waiting && canAct ? (
          <>
            <p className="text-[12.5px] text-text-2">{sc.waitingHint}</p>
            <Textarea
              label={sc.notesLabel}
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={sc.notesPlaceholder}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                loading={mutate.isPending}
                onClick={() => mutate.mutate(true)}
                icon={<CheckCircle2 className="size-4" />}
              >
                {sc.approve}
              </Button>
              <Button
                variant="secondary"
                loading={mutate.isPending}
                disabled={!notes.trim()}
                onClick={() => mutate.mutate(false)}
                icon={<XCircle className="size-4" />}
              >
                {sc.reject}
              </Button>
            </div>
          </>
        ) : null}
        {waiting && !canAct ? (
          <p className="text-[12.5px] text-text-3">{sc.waitForWarehouse}</p>
        ) : null}
      </CardBody>
    </Card>
  );
}
