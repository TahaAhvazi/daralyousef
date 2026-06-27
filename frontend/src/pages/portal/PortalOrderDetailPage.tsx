import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, X } from "lucide-react";
import toast from "react-hot-toast";

import { ordersApi } from "@/api/modules";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { LineItemHeading } from "@/components/orders/LineItemSpecList";
import { PortalOrderInvoicesPanel } from "@/components/finance/OrderInvoicesPanel";
import { OrderApprovalTimeline } from "@/components/orders/OrderApprovalTimeline";
import { OrderReceiptConfirmCard } from "@/components/orders/OrderReceiptConfirmCard";
import { useT } from "@/i18n/useT";
import { isOrderReceiptConfirmable } from "@/lib/permissions";

export default function PortalOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const { t } = useT();
  const po = t.portalUi.orders;
  const qc = useQueryClient();
  const [notes, setNotes] = useState("");

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => ordersApi.get(orderId),
    enabled: !!orderId,
  });

  const respond = useMutation({
    mutationFn: (approved: boolean) => ordersApi.customerRespond(orderId, approved, notes || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["order", orderId] });
      qc.invalidateQueries({ queryKey: ["portal.orders.all"] });
      toast.success(po.responseSent);
      setNotes("");
    },
  });

  if (isLoading || !order) {
    return <div className="text-text-3 text-sm py-8">{t.common.loading}</div>;
  }

  const awaiting = order.status === "awaiting_customer";
  const showPricing = order.grand_total > 0;
  const showReceiptConfirm = isOrderReceiptConfirmable(order.status);

  return (
    <div className="page-shell">
      <PageHeader
        title={order.title ?? order.code}
        description={<span className="font-mono text-[12px]">{order.code}</span>}
        actions={
          <Link to="/portal/orders" className="btn btn-secondary w-full sm:w-auto">
            <ArrowLeft className="size-4" /> {po.back}
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader title={po.requestDetails} />
            <CardBody className="space-y-3 text-[13.5px]">
              <div className="flex justify-between gap-3">
                <span className="text-text-2">{po.colStatus}</span>
                <StatusBadge status={order.status} />
              </div>
              {order.deadline ? (
                <div className="flex justify-between gap-3">
                  <span className="text-text-2">{po.colDeadline}</span>
                  <span>{formatDate(order.deadline)}</span>
                </div>
              ) : (
                <p className="text-text-3 text-[12.5px]">{po.deadlinePending}</p>
              )}
              {order.notes ? (
                <p className="text-text-2 pt-2 border-t border-border">{order.notes}</p>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={po.lineItems} />
            <CardBody className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between gap-3 border-b border-border/60 pb-2 last:border-0">
                  <LineItemHeading
                    name={item.name}
                    quantity={item.quantity}
                    unit={item.unit}
                    spec={item.spec}
                  />
                  {showPricing ? (
                    <span className="tabular-nums font-medium">{formatMoney(item.line_total)}</span>
                  ) : (
                    <span className="text-[12px] text-text-3">{po.pricingPending}</span>
                  )}
                </div>
              ))}
            </CardBody>
          </Card>

          {awaiting ? (
            <Card>
              <CardHeader title={po.reviewProposal} />
              <CardBody className="space-y-4">
                <p className="text-[13px] text-text-2">{po.reviewHint}</p>
                <Textarea
                  label={po.responseNotes}
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  <Button loading={respond.isPending} onClick={() => respond.mutate(true)} icon={<Check className="size-4" />}>
                    {po.approve}
                  </Button>
                  <Button variant="secondary" loading={respond.isPending} onClick={() => respond.mutate(false)} icon={<X className="size-4" />}>
                    {po.requestChanges}
                  </Button>
                </div>
              </CardBody>
            </Card>
          ) : null}

          {showReceiptConfirm ? (
            <OrderReceiptConfirmCard
              orderId={order.id}
              copy={{
                title: po.confirmReceiptTitle,
                hint: po.confirmReceiptHint,
                question: po.confirmReceiptQuestion,
                yes: po.confirmReceiptYes,
                success: po.confirmReceiptSuccess,
              }}
            />
          ) : null}

          <PortalOrderInvoicesPanel orderId={order.id} />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title={po.colTotal} />
            <CardBody>
              {showPricing ? (
                <div className="text-2xl font-semibold tabular-nums">{formatMoney(order.grand_total, order.currency)}</div>
              ) : (
                <p className="text-text-3 text-[13px]">{po.pricingPending}</p>
              )}
            </CardBody>
          </Card>

          <OrderApprovalTimeline events={order.events} title={po.timeline} />
        </div>
      </div>
    </div>
  );
}
