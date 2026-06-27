import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Download, FileText, Link2, Trash2 } from "lucide-react";

import { Link } from "react-router-dom";

import toast from "react-hot-toast";



import { financeApi } from "@/api/modules";

import { StatusBadge } from "@/components/ui/Badge";

import { Button } from "@/components/ui/Button";

import { CollapsibleCard } from "@/components/ui/CollapsibleCard";

import { Card, CardBody, CardHeader } from "@/components/ui/Card";

import { formatDate, formatDateTime, formatMoney } from "@/lib/format";

import { hasAnyPermission } from "@/lib/permissions";

import { useAuthStore } from "@/store/auth";

import { useT } from "@/i18n/useT";

import type { Invoice } from "@/types/api";



async function savePdfBlob(blob: Blob, filename: string) {

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");

  a.href = url;

  a.download = filename;

  a.click();

  URL.revokeObjectURL(url);

}



export function OrderInvoicesPanel({ orderId }: { orderId: number }) {

  const user = useAuthStore((s) => s.user);

  const { t } = useT();

  const fi = t.staffUi.invoices;

  const qc = useQueryClient();

  const canFinance = hasAnyPermission(user, "finance:create", "finance:update", "finance:read");

  const canManage = hasAnyPermission(user, "finance:update", "finance:create");

  const [sharePortal, setSharePortal] = useState(false);



  const { data, isLoading } = useQuery({

    queryKey: ["order-invoices", orderId],

    queryFn: () => financeApi.orderInvoices(orderId),

    enabled: canFinance,

  });



  const invoices = data?.items ?? [];



  const generate = useMutation({

    mutationFn: () => financeApi.invoiceFromOrder(orderId, { lang: "en", portal_visible: sharePortal }),

    onSuccess: (inv) => {

      const refreshed = invoices.length > 0;

      qc.invalidateQueries({ queryKey: ["order-invoices", orderId] });

      qc.invalidateQueries({ queryKey: ["invoices"] });

      toast.success(

        refreshed ? fi.updated.replace("{code}", inv.code) : fi.generated.replace("{code}", inv.code),

      );

    },

    onError: (e: Error) => toast.error(e.message || t.common.error),

  });



  const togglePortal = useMutation({

    mutationFn: ({ id, portal_visible }: { id: number; portal_visible: boolean }) =>

      financeApi.updateInvoice(id, { portal_visible }),

    onSuccess: () => {

      qc.invalidateQueries({ queryKey: ["order-invoices", orderId] });

      toast.success(fi.portalUpdated);

    },

  });



  const remove = useMutation({

    mutationFn: (id: number) => financeApi.removeInvoice(id),

    onSuccess: () => {

      qc.invalidateQueries({ queryKey: ["order-invoices", orderId] });

      qc.invalidateQueries({ queryKey: ["invoices"] });

      toast.success(fi.deleted);

    },

    onError: (e: Error) => toast.error(e.message || t.common.error),

  });



  const download = useMutation({

    mutationFn: async ({ id, lang, code }: { id: number; lang: "en" | "ar"; code: string }) => {

      const blob = await financeApi.downloadInvoicePdf(id, lang);

      await savePdfBlob(blob, `${code}_${lang}.pdf`);

    },

    onSuccess: () => toast.success(fi.pdfDownloaded),

  });



  if (!canFinance) return null;



  return (

    <CollapsibleCard title={fi.orderSectionTitle} subtitle={fi.orderSectionSub} compact>

      <div className="space-y-3">

        <label className="flex items-center gap-2 text-[12px] text-text-2 select-none cursor-pointer">

          <input

            type="checkbox"

            className="size-3.5 accent-[rgb(var(--brand))]"

            checked={sharePortal}

            onChange={(e) => setSharePortal(e.target.checked)}

          />

          {fi.shareWithPortal}

        </label>

        {canManage ? (

          <Button

            size="sm"

            icon={<FileText className="size-3.5" />}

            loading={generate.isPending}

            disabled={generate.isPending}

            onClick={() => generate.mutate()}

          >

            {fi.generateBtn}

          </Button>

        ) : null}



        {isLoading ? (

          <p className="text-[12px] text-text-3">{fi.loading}</p>

        ) : invoices.length === 0 ? (

          <p className="text-[12px] text-text-3">{fi.noOrderInvoices}</p>

        ) : (

          <ul className="space-y-2">

            {invoices.map((inv) => (

              <InvoiceRow

                key={inv.id}

                inv={inv}

                fi={fi}

                staffBase="/app/invoices"

                onDownload={(lang) => download.mutate({ id: inv.id, lang, code: inv.code })}

                onTogglePortal={(v) => togglePortal.mutate({ id: inv.id, portal_visible: v })}

                onDelete={canManage ? () => {

                  if (window.confirm(fi.confirmDelete)) remove.mutate(inv.id);

                } : undefined}

                downloading={download.isPending}

                deleting={remove.isPending}

                canManage={canManage}

              />

            ))}

          </ul>

        )}

      </div>

    </CollapsibleCard>

  );

}



export function InvoiceRow({

  inv,

  fi,

  staffBase,

  onDownload,

  onTogglePortal,

  onDelete,

  downloading,

  deleting,

  canManage,

}: {

  inv: Invoice;

  fi: ReturnType<typeof useT>["t"]["staffUi"]["invoices"];

  staffBase: string;

  onDownload: (lang: "en" | "ar") => void;

  onTogglePortal?: (visible: boolean) => void;

  onDelete?: () => void;

  downloading?: boolean;

  deleting?: boolean;

  canManage?: boolean;

}) {

  return (

    <li className="rounded-lg border border-border p-2.5 space-y-2">

      <div className="flex flex-wrap items-start justify-between gap-2">

        <div className="min-w-0">

          <Link to={`${staffBase}/${inv.id}`} className="font-mono text-[13px] font-semibold text-brand hover:underline">

            {inv.code}

          </Link>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-text-3">

            <StatusBadge status={inv.status} />

            <span>

              {formatDate(inv.issue_date)}

              {inv.issued_at ? (

                <span className="text-text-3"> · {formatDateTime(inv.issued_at)}</span>

              ) : null}

            </span>

            <span className="font-medium text-text">{formatMoney(inv.grand_total, inv.currency)}</span>

          </div>

        </div>

        {inv.portal_visible ? (

          <span className="badge badge-brand shrink-0">{fi.portalVisible}</span>

        ) : null}

      </div>

      <div className="flex flex-wrap gap-2">

        <Button

          size="sm"

          variant="secondary"

          icon={<Download className="size-3.5" />}

          loading={downloading}

          onClick={() => onDownload("en")}

        >

          {fi.downloadEn}

        </Button>

        <Button

          size="sm"

          variant="secondary"

          icon={<Download className="size-3.5" />}

          loading={downloading}

          onClick={() => onDownload("ar")}

        >

          {fi.downloadAr}

        </Button>

        {canManage && onTogglePortal ? (

          <Button

            size="sm"

            variant="ghost"

            icon={<Link2 className="size-3.5" />}

            onClick={() => onTogglePortal(!inv.portal_visible)}

          >

            {inv.portal_visible ? fi.hideFromPortal : fi.showInPortal}

          </Button>

        ) : null}

        {canManage && onDelete ? (

          <Button

            size="sm"

            variant="ghost"

            icon={<Trash2 className="size-3.5" />}

            loading={deleting}

            onClick={onDelete}

            className="text-danger hover:text-danger"

          >

            {fi.deleteBtn}

          </Button>

        ) : null}

      </div>

    </li>

  );

}



export function PortalOrderInvoicesPanel({ orderId }: { orderId: number }) {

  const { t } = useT();

  const fi = t.staffUi.invoices;



  const { data, isLoading } = useQuery({

    queryKey: ["order-invoices", orderId],

    queryFn: () => financeApi.orderInvoices(orderId),

  });



  const download = useMutation({

    mutationFn: async ({ id, lang, code }: { id: number; lang: "en" | "ar"; code: string }) => {

      const blob = await financeApi.downloadInvoicePdf(id, lang);

      await savePdfBlob(blob, `${code}_${lang}.pdf`);

    },

    onSuccess: () => toast.success(fi.pdfDownloaded),

  });



  const invoices = data?.items ?? [];

  if (isLoading || invoices.length === 0) return null;



  return (

    <Card>

      <CardHeader title={fi.orderSectionTitle} subtitle={fi.orderSectionSub} />

      <CardBody>

        <ul className="space-y-3">

          {invoices.map((inv) => (

            <InvoiceRow

              key={inv.id}

              inv={inv}

              fi={fi}

              staffBase="/portal/invoices"

              onDownload={(lang) => download.mutate({ id: inv.id, lang, code: inv.code })}

              downloading={download.isPending}

            />

          ))}

        </ul>

      </CardBody>

    </Card>

  );

}


