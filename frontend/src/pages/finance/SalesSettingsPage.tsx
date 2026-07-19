import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { salesApi } from "@/api/modules";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { useT } from "@/i18n/useT";

export default function SalesSettingsPage() {
  const { t } = useT();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["sales-settings"],
    queryFn: () => salesApi.salesSettings(),
  });

  const [currency, setCurrency] = useState("IQD");
  const [tax, setTax] = useState("0");
  const [dueDays, setDueDays] = useState("14");
  const [invPrefix, setInvPrefix] = useState("INV");
  const [cnPrefix, setCnPrefix] = useState("CN");
  const [qtPrefix, setQtPrefix] = useState("QT");
  const [terms, setTerms] = useState("");

  useEffect(() => {
    if (!data) return;
    setCurrency(data.default_currency ?? "IQD");
    setTax(String(data.default_tax_pct ?? 0));
    setDueDays(String(data.default_due_days ?? 14));
    setInvPrefix(data.invoice_prefix ?? "INV");
    setCnPrefix(data.credit_note_prefix ?? "CN");
    setQtPrefix(data.quotation_prefix ?? "QT");
    setTerms(data.payment_terms ?? "");
  }, [data]);

  const save = useMutation({
    mutationFn: () =>
      salesApi.updateSalesSettings({
        default_currency: currency,
        default_tax_pct: Number(tax) || 0,
        default_due_days: Number(dueDays) || 14,
        invoice_prefix: invPrefix,
        credit_note_prefix: cnPrefix,
        quotation_prefix: qtPrefix,
        payment_terms: terms || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales-settings"] });
      toast.success(t.staffUi.common.save);
    },
  });

  return (
    <div className="page-shell space-y-4">
      <PageHeader title={t.staffUi.nav.salesSettings} description={t.staffUi.nav.modSales} />
      <Card>
        <CardBody className="grid max-w-xl gap-3">
          <Input label="Default currency" value={currency} onChange={(e) => setCurrency(e.target.value)} />
          <Input label="Default tax %" value={tax} onChange={(e) => setTax(e.target.value)} />
          <Input label="Default due days" value={dueDays} onChange={(e) => setDueDays(e.target.value)} />
          <Input label="Invoice prefix" value={invPrefix} onChange={(e) => setInvPrefix(e.target.value)} />
          <Input label="Credit note prefix" value={cnPrefix} onChange={(e) => setCnPrefix(e.target.value)} />
          <Input label="Quotation prefix" value={qtPrefix} onChange={(e) => setQtPrefix(e.target.value)} />
          <Input label="Payment terms" value={terms} onChange={(e) => setTerms(e.target.value)} />
          <Button loading={save.isPending} onClick={() => save.mutate()}>{t.staffUi.common.save}</Button>
        </CardBody>
      </Card>
    </div>
  );
}
