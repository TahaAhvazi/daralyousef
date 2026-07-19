import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Plus } from "lucide-react";
import toast from "react-hot-toast";

import { financeApi, salesApi } from "@/api/modules";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDate, formatMoney } from "@/lib/format";
import { useT } from "@/i18n/useT";

export default function InstallmentsPage() {
  const { t } = useT();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["installments"],
    queryFn: () => salesApi.installments({ page: 1, page_size: 50 }),
  });
  const { data: invoices } = useQuery({
    queryKey: ["invoices", "unpaid"],
    queryFn: () => financeApi.invoices({ page: 1, page_size: 100 }),
    enabled: open,
  });

  const [invoiceId, setInvoiceId] = useState("");
  const [count, setCount] = useState("3");
  const [firstDue, setFirstDue] = useState(new Date().toISOString().slice(0, 10));

  const create = useMutation({
    mutationFn: () =>
      salesApi.createInstallmentPlan({
        invoice_id: Number(invoiceId),
        count: Number(count) || 3,
        first_due: firstDue,
        interval_days: 30,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["installments"] });
      toast.success(t.staffUi.common.create);
      setOpen(false);
    },
  });

  const pay = useMutation({
    mutationFn: (id: number) => salesApi.payInstallment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["installments"] });
      qc.invalidateQueries({ queryKey: ["payments"] });
      toast.success("Paid");
    },
  });

  return (
    <div className="page-shell space-y-4">
      <PageHeader
        title={t.staffUi.nav.installmentPlans}
        actions={<Button icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>{t.staffUi.common.create}</Button>}
      />
      {isLoading ? <p className="text-sm text-text-3">…</p> : null}
      {(data?.items ?? []).length === 0 ? (
        <EmptyState icon={<CalendarClock className="size-7" />} title={t.staffUi.common.noResults} />
      ) : (
        (data?.items ?? []).map((plan: any) => (
          <Card key={plan.id}>
            <CardHeader
              title={`${plan.code} · ${formatMoney(plan.total_amount, plan.currency)}`}
              subtitle={`Invoice #${plan.invoice_id} · ${plan.status}`}
            />
            <CardBody className="divide-y divide-border/70">
              {(plan.installments ?? []).map((inst: any) => (
                <div key={inst.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                  <div>
                    <div className="text-[13px] font-medium">#{inst.sequence} · {formatMoney(inst.amount, plan.currency)}</div>
                    <div className="text-[12px] text-text-3">{formatDate(inst.due_date)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={inst.status === "paid" ? "success" : "warning"}>{inst.status}</Badge>
                    {inst.status !== "paid" ? (
                      <Button size="sm" loading={pay.isPending} onClick={() => pay.mutate(inst.id)}>Pay</Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        ))
      )}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t.staffUi.nav.installmentPlans}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>{t.staffUi.common.cancel}</Button>
            <Button loading={create.isPending} disabled={!invoiceId} onClick={() => create.mutate()}>
              {t.staffUi.common.create}
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <select className="input w-full" value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)}>
            <option value="">Invoice…</option>
            {(invoices?.items ?? []).filter((i) => i.balance > 0).map((i) => (
              <option key={i.id} value={i.id}>{i.code} · bal {formatMoney(i.balance, i.currency)}</option>
            ))}
          </select>
          <Input label="Installments" value={count} onChange={(e) => setCount(e.target.value)} />
          <Input label="First due" type="date" value={firstDue} onChange={(e) => setFirstDue(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
}
