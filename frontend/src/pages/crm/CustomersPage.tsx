import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import toast from "react-hot-toast";

import { customersApi } from "@/api/modules";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Column, DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageTip } from "@/components/ui/PageTip";
import { PageToolbar, TOOLBAR_INPUT } from "@/components/ui/PageToolbar";
import { Pagination } from "@/components/ui/Pagination";
import { useAuthStore } from "@/store/auth";
import { canCreateCrm, canDeleteCrm, canUpdateCrm } from "@/lib/permissions";
import { staffBreadcrumbs } from "@/lib/breadcrumbs";
import { apiErrorMessage } from "@/lib/apiErrors";
import { useT } from "@/i18n/useT";
import type { Customer } from "@/types/api";

export default function CustomersPage() {
  const { t } = useT();
  const location = useLocation();
  const tt = t.staffUi.customers;
  const common = t.staffUi.common;
  const user = useAuthStore((s) => s.user);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [openCreate, setOpenCreate] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);

  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["customers", page, q],
    queryFn: () => customersApi.list({ page, page_size: 20, q: q || undefined }),
    placeholderData: (prev) => prev,
  });

  const remove = useMutation({
    mutationFn: (id: number) => customersApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success(tt.archived);
    },
  });

  const columns: Column<Customer>[] = [
    {
      key: "name",
      header: tt.colCustomer,
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-full bg-grad-brand grid place-items-center text-white text-[12px] font-semibold">
            {c.full_name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
          </div>
          <div>
            <div className="font-medium">{c.full_name}</div>
            <div className="text-[11.5px] text-text-3">{c.email ?? t.common.none}</div>
          </div>
        </div>
      ),
    },
    { key: "code", header: tt.colCode, hideOnMobile: true, render: (c) => <span className="font-mono text-[12px]">{c.code}</span> },
    { key: "phone", header: tt.colPhone, render: (c) => c.phone ?? t.common.none },
    { key: "city", header: tt.colLocation, hideOnMobile: true, render: (c) => [c.city, c.country].filter(Boolean).join(", ") || t.common.none },
    {
      key: "portal",
      header: tt.colPortal,
      render: (c) =>
        c.user_id ? (
          <Badge variant="success">{tt.portalBadge}</Badge>
        ) : (
          <span className="text-[12px] text-text-3">—</span>
        ),
    },
    { key: "tags", header: tt.colTags, hideOnMobile: true, render: (c) => (c.tags ? <Badge variant="brand">{c.tags}</Badge> : t.common.none) },
    ...(canUpdateCrm(user) || canDeleteCrm(user)
      ? [
          {
            key: "actions",
            header: "",
            align: "right" as const,
            render: (c: Customer) => (
              <div className="flex flex-wrap justify-end gap-1">
                {canUpdateCrm(user) ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Pencil className="size-3.5" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditCustomer(c);
                    }}
                  >
                    {tt.editBtn}
                  </Button>
                ) : null}
                {canDeleteCrm(user) ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 className="size-3.5" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`${common.archive}? ${c.full_name}`)) remove.mutate(c.id);
                    }}
                  >
                    {common.archive}
                  </Button>
                ) : null}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="page-shell">
      <PageHeader
        title={tt.title}
        description={tt.description}
        breadcrumbs={staffBreadcrumbs(location.pathname, t.staffUi.nav)}
        actions={
          canCreateCrm(user) ? (
            <Button icon={<Plus className="size-4" />} onClick={() => setOpenCreate(true)} className="w-full sm:w-auto min-h-11">
              {tt.newBtn}
            </Button>
          ) : null
        }
      />

      <PageTip storageKey="customers-list-crud">{tt.description}</PageTip>

      <PageToolbar>
        <Input
          iconLeft={<Search className="size-4" />}
          placeholder={tt.searchPh}
          value={q}
          onChange={(e) => {
            setPage(1);
            setQ(e.target.value);
          }}
          className={TOOLBAR_INPUT}
        />
      </PageToolbar>

      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        loading={isLoading}
        rowKey={(r) => r.id}
        empty={
          <EmptyState
            icon={<Users className="size-7" />}
            title={tt.emptyTitle}
            description={tt.emptyDesc}
            action={
              canCreateCrm(user) ? (
                <Button icon={<Plus className="size-4" />} onClick={() => setOpenCreate(true)}>
                  {tt.newBtn}
                </Button>
              ) : undefined
            }
          />
        }
      />

      {data ? (
        <Pagination className="mt-4" page={page} pageSize={20} total={data.total} onPageChange={setPage} />
      ) : null}

      {openCreate ? <CustomerFormModal open onClose={() => setOpenCreate(false)} /> : null}
      {editCustomer ? (
        <CustomerFormModal open customer={editCustomer} onClose={() => setEditCustomer(null)} />
      ) : null}
    </div>
  );
}

type FormState = {
  full_name: string;
  email: string;
  phone: string;
  title: string;
  city: string;
  country: string;
  tags: string;
  notes: string;
  create_portal_access: boolean;
  portal_password: string;
  portal_password_confirm: string;
};

function emptyForm(customer?: Customer): FormState {
  return {
    full_name: customer?.full_name ?? "",
    email: customer?.email ?? "",
    phone: customer?.phone ?? "",
    title: customer?.title ?? "",
    city: customer?.city ?? "",
    country: customer?.country ?? "",
    tags: customer?.tags ?? "",
    notes: customer?.notes ?? "",
    create_portal_access: !customer,
    portal_password: "",
    portal_password_confirm: "",
  };
}

function CustomerFormModal({
  open,
  onClose,
  customer,
}: {
  open: boolean;
  onClose: () => void;
  customer?: Customer;
}) {
  const { t, locale } = useT();
  const tt = t.staffUi.customers;
  const qc = useQueryClient();
  const isEdit = !!customer;
  const hasPortal = !!customer?.user_id;
  const [form, setForm] = useState<FormState>(() => emptyForm(customer));
  const [showPw, setShowPw] = useState(false);

  const save = useMutation({
    mutationFn: async () => {
      const wantsPortalCreate = form.create_portal_access && !hasPortal;
      const wantsPassword = !!form.portal_password;
      if ((wantsPortalCreate || wantsPassword) && form.portal_password !== form.portal_password_confirm) {
        throw new Error(tt.portalPasswordMismatch);
      }

      const base = {
        full_name: form.full_name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        title: form.title.trim() || undefined,
        city: form.city.trim() || undefined,
        country: form.country.trim() || undefined,
        tags: form.tags.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };

      if (isEdit) {
        return customersApi.update(customer!.id, {
          ...base,
          create_portal_access: wantsPortalCreate,
          portal_password: wantsPortalCreate || wantsPassword ? form.portal_password : undefined,
        });
      }

      return customersApi.create({
        ...base,
        create_portal_access: form.create_portal_access,
        portal_password: form.create_portal_access ? form.portal_password : undefined,
      });
    },
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      if (!isEdit && saved.user_id) toast.success(tt.portalSaved);
      else toast.success(isEdit ? tt.updated : tt.saved);
      onClose();
    },
    onError: (err) => {
      const msg =
        err instanceof Error && !("response" in err) ? err.message : apiErrorMessage(err, locale);
      toast.error(msg);
    },
  });

  const portalRequired =
    (!isEdit && form.create_portal_access) || (isEdit && form.create_portal_access && !hasPortal);
  const passwordNeeded = portalRequired || (isEdit && hasPortal && form.portal_password.length > 0);

  const canSubmit =
    !!form.full_name.trim() &&
    (!portalRequired || (!!form.email.trim() && form.portal_password.length >= 8)) &&
    (!passwordNeeded || form.portal_password === form.portal_password_confirm);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? tt.editTitle : tt.newTitle}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t.staffUi.common.cancel}
          </Button>
          <Button loading={save.isPending} onClick={() => save.mutate()} disabled={!canSubmit}>
            {isEdit ? t.staffUi.common.save : t.staffUi.common.create}
          </Button>
        </>
      }
    >
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Input
          label={tt.fullName}
          required
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
        />
        <Input
          label={tt.email}
          type="email"
          required={portalRequired}
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <Input label={tt.phone} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input label={tt.jobTitle} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Input label={tt.city} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        <Input label={tt.country} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
        <Input label={tt.tags} value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
        <Input label={tt.notes} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>

      <div className="mt-5 space-y-3 rounded-xl border border-border bg-surface-2/40 p-4">
        {!isEdit || !hasPortal ? (
          <label className="flex cursor-pointer select-none items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 size-4 accent-[rgb(var(--brand))]"
              checked={form.create_portal_access}
              onChange={(e) => setForm({ ...form, create_portal_access: e.target.checked })}
            />
            <span>
              <span className="block text-[13.5px] font-semibold text-text">
                {isEdit ? tt.enablePortal : tt.portalAccess}
              </span>
              <span className="mt-0.5 block text-[12.5px] leading-relaxed text-text-2">
                {isEdit ? tt.enablePortalHint : tt.portalAccessHint}
              </span>
            </span>
          </label>
        ) : (
          <p className="text-[13px] text-text-2">
            <Badge variant="success" className="me-2">
              {tt.portalBadge}
            </Badge>
            {tt.resetPortalPasswordHint}
          </p>
        )}

        {(form.create_portal_access && !hasPortal) || hasPortal ? (
          <div className="grid gap-3.5 pt-1 sm:grid-cols-2">
            <Input
              label={hasPortal ? tt.resetPortalPassword : tt.portalPassword}
              type={showPw ? "text" : "password"}
              required={!hasPortal && form.create_portal_access}
              autoComplete="new-password"
              value={form.portal_password}
              onChange={(e) => setForm({ ...form, portal_password: e.target.value })}
              hint={hasPortal ? tt.resetPortalPasswordHint : locale === "ar" ? "٨ أحرف على الأقل" : "At least 8 characters"}
              iconRight={
                <button
                  type="button"
                  className="text-text-3 hover:text-text"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label="toggle"
                >
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              }
            />
            <Input
              label={tt.portalPasswordConfirm}
              type={showPw ? "text" : "password"}
              required={!hasPortal && form.create_portal_access}
              autoComplete="new-password"
              value={form.portal_password_confirm}
              onChange={(e) => setForm({ ...form, portal_password_confirm: e.target.value })}
              error={
                form.portal_password_confirm && form.portal_password !== form.portal_password_confirm
                  ? tt.portalPasswordMismatch
                  : undefined
              }
            />
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
