import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2, UserCog } from "lucide-react";
import toast from "react-hot-toast";

import { usersApi } from "@/api/modules";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Column, DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageToolbar, TOOLBAR_INPUT } from "@/components/ui/PageToolbar";
import { fromNow } from "@/lib/format";
import {
  canCreateUsers,
  canDeleteUsers,
  canUpdateUsers,
} from "@/lib/permissions";
import { useAuthStore } from "@/store/auth";
import { useT } from "@/i18n/useT";
import type { User } from "@/types/api";

export default function UsersPage() {
  const { t } = useT();
  const tt = t.staffUi.users;
  const me = useAuthStore((s) => s.user);
  const [q, setQ] = useState("");
  const [staffOnly, setStaffOnly] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["users", q],
    queryFn: () => usersApi.list({ page: 1, page_size: 100, q: q || undefined }),
  });

  const rows = useMemo(() => {
    const items = data?.items ?? [];
    return staffOnly ? items.filter((u) => u.is_staff) : items;
  }, [data?.items, staffOnly]);

  const cols: Column<User>[] = [
    {
      key: "name",
      header: tt.colUser,
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-full bg-grad-brand grid place-items-center text-white text-[12px] font-semibold">
            {u.full_name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
          </div>
          <div>
            <div className="font-medium">{u.full_name}</div>
            <div className="text-[11.5px] text-text-3">{u.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "roles",
      header: tt.colRoles,
      render: (u) => (
        <div className="flex flex-wrap gap-1">
          {u.roles.map((r) => (
            <Badge key={r.id} variant="brand">
              {r.name}
            </Badge>
          ))}
        </div>
      ),
    },
    { key: "dept", header: tt.colDept, render: (u) => u.department ?? t.common.none },
    {
      key: "status",
      header: tt.colStatus,
      render: (u) =>
        u.is_active ? (
          <Badge variant="success">{tt.active}</Badge>
        ) : (
          <Badge variant="danger">{tt.inactive}</Badge>
        ),
    },
    { key: "seen", header: tt.colLastLogin, render: (u) => fromNow(u.last_login_at) },
    ...(canUpdateUsers(me) || canDeleteUsers(me)
      ? [
          {
            key: "actions",
            header: "",
            align: "right" as const,
            render: (u: User) => (
              <div className="flex justify-end gap-1">
                {canUpdateUsers(me) ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditUser(u);
                    }}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                ) : null}
                {canDeleteUsers(me) && u.id !== me?.id ? (
                  <DeleteUserButton user={u} />
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
        actions={
          canCreateUsers(me) ? (
            <Button icon={<Plus className="size-4" />} onClick={() => setCreateOpen(true)} className="w-full sm:w-auto">
              {tt.newBtn}
            </Button>
          ) : null
        }
      />

      <PageToolbar>
        <Input
          iconLeft={<Search className="size-4" />}
          placeholder={tt.searchPh}
          className={TOOLBAR_INPUT}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <label className="flex w-full min-w-0 items-center gap-2 text-[12.5px] text-text-2 select-none sm:w-auto">
          <input
            type="checkbox"
            className="size-3.5 shrink-0 accent-[rgb(var(--brand))]"
            checked={staffOnly}
            onChange={(e) => setStaffOnly(e.target.checked)}
          />
          <span className="min-w-0 break-words">{tt.staffOnly}</span>
        </label>
      </PageToolbar>
      <DataTable
        columns={cols}
        rows={rows}
        loading={isLoading}
        rowKey={(r) => r.id}
        empty={<EmptyState icon={<UserCog className="size-7" />} title={tt.emptyTitle} />}
      />

      {createOpen ? <UserFormModal open onClose={() => setCreateOpen(false)} /> : null}
      {editUser ? (
        <UserFormModal open user={editUser} onClose={() => setEditUser(null)} />
      ) : null}
    </div>
  );
}

function DeleteUserButton({ user }: { user: User }) {
  const { t } = useT();
  const tt = t.staffUi.users;
  const qc = useQueryClient();
  const remove = useMutation({
    mutationFn: () => usersApi.remove(user.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success(tt.deleted);
    },
  });

  return (
    <Button
      variant="ghost"
      size="sm"
      loading={remove.isPending}
      onClick={(e) => {
        e.stopPropagation();
        if (window.confirm(tt.confirmDelete)) remove.mutate();
      }}
    >
      <Trash2 className="size-3.5" />
    </Button>
  );
}

function UserFormModal({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user?: User;
}) {
  const { t } = useT();
  const tt = t.staffUi.users;
  const qc = useQueryClient();
  const isEdit = !!user;

  const { data: roles } = useQuery({
    queryKey: ["roles"],
    queryFn: usersApi.roles,
    enabled: open,
  });

  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [department, setDepartment] = useState(user?.department ?? "");
  const [title, setTitle] = useState(user?.title ?? "");
  const [isActive, setIsActive] = useState(user?.is_active ?? true);
  const [roleSlugs, setRoleSlugs] = useState<string[]>(
    () => user?.roles.map((r) => r.slug) ?? [],
  );

  const toggleRole = (slug: string) => {
    setRoleSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  const save = useMutation({
    mutationFn: async () => {
      if (isEdit) {
        const payload: Record<string, unknown> = {
          full_name: fullName,
          phone: phone || null,
          department: department || null,
          title: title || null,
          is_active: isActive,
          is_staff: true,
          role_slugs: roleSlugs,
        };
        if (password.trim()) payload.password = password;
        await usersApi.update(user!.id, payload);
      } else {
        await usersApi.create({
          email,
          password,
          full_name: fullName,
          phone: phone || undefined,
          department: department || undefined,
          title: title || undefined,
          is_staff: true,
          role_slugs: roleSlugs,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success(isEdit ? tt.updated : tt.created);
      onClose();
    },
  });

  const canSubmit =
    fullName.trim() &&
    (isEdit || (email.trim() && password.length >= 8));

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
          <Button loading={save.isPending} disabled={!canSubmit} onClick={() => save.mutate()}>
            {isEdit ? t.staffUi.common.save : t.staffUi.common.create}
          </Button>
        </>
      }
    >
      <div className="grid gap-3.5 sm:grid-cols-2">
        <Input
          label={tt.fullName}
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          wrapperClassName="sm:col-span-2"
        />
        {!isEdit ? (
          <Input
            label={tt.email}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        ) : (
          <Input label={tt.email} value={email} disabled wrapperClassName="opacity-70" />
        )}
        <Input
          label={isEdit ? tt.passwordOptional : tt.password}
          type="password"
          required={!isEdit}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input label={tt.phone} value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input
          label={tt.department}
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        />
        <Input label={tt.titleField} value={title} onChange={(e) => setTitle(e.target.value)} />
        {isEdit ? (
          <label className="sm:col-span-2 flex items-center gap-2 text-[13px] text-text-2 select-none">
            <input
              type="checkbox"
              className="size-3.5 accent-[rgb(var(--brand))]"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            {tt.isActive}
          </label>
        ) : null}
        <div className="sm:col-span-2">
          <div className="text-[12.5px] font-medium text-text-1 mb-1">{tt.roles}</div>
          <p className="text-[11.5px] text-text-3 mb-2">{tt.rolesHint}</p>
          <div className="flex flex-wrap gap-2">
            {(roles ?? []).map((r) => {
              const on = roleSlugs.includes(r.slug);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => toggleRole(r.slug)}
                  className={`px-2.5 py-1 rounded-full text-[12px] border transition-colors ${
                    on
                      ? "bg-[rgb(var(--brand)/0.12)] border-[rgb(var(--brand))] text-[rgb(var(--brand))]"
                      : "border-border text-text-2 hover:border-text-3"
                  }`}
                >
                  {r.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
