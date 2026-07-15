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
import { PageTip } from "@/components/ui/PageTip";
import { PageToolbar, TOOLBAR_INPUT } from "@/components/ui/PageToolbar";
import { Tabs } from "@/components/ui/Tabs";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { ProfileViewModal } from "@/components/profile/ProfileViewModal";
import { fromNow } from "@/lib/format";
import {
  canCreateUsers,
  canDeleteUsers,
  canUpdateUsers,
} from "@/lib/permissions";
import { useAuthStore } from "@/store/auth";
import { useT } from "@/i18n/useT";
import { apiErrorMessage } from "@/lib/apiErrors";
import type { User } from "@/types/api";

type FilterKey = "employees" | "portal" | "all";

export default function UsersPage() {
  const { t } = useT();
  const tt = t.staffUi.users;
  const me = useAuthStore((s) => s.user);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<FilterKey>("employees");
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [viewUserId, setViewUserId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["users", q],
    queryFn: () => usersApi.list({ page: 1, page_size: 100, q: q || undefined }),
  });

  const rows = useMemo(() => {
    const items = data?.items ?? [];
    if (filter === "employees") return items.filter((u) => u.is_staff);
    if (filter === "portal") return items.filter((u) => !u.is_staff);
    return items;
  }, [data?.items, filter]);

  const cols: Column<User>[] = [
    {
      key: "name",
      header: tt.colUser,
      render: (u) => (
        <button
          type="button"
          className="flex items-center gap-3 text-start hover:opacity-90"
          onClick={() => setViewUserId(u.id)}
        >
          <UserAvatar name={u.full_name} seed={u.id} src={u.avatar_url} size="sm" />
          <div>
            <div className="font-medium text-brand">{u.full_name}</div>
            <div className="text-[11.5px] text-text-3">{u.email}</div>
          </div>
        </button>
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
          {!u.is_staff ? <Badge variant="success">{t.staffUi.customers.portalBadge}</Badge> : null}
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
    { key: "seen", header: tt.colLastLogin, hideOnMobile: true, render: (u) => fromNow(u.last_login_at) },
    ...(canUpdateUsers(me) || canDeleteUsers(me)
      ? [
          {
            key: "actions",
            header: "",
            align: "right" as const,
            render: (u: User) => (
              <div className="flex flex-wrap justify-end gap-1">
                {canUpdateUsers(me) ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Pencil className="size-3.5" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditUser(u);
                    }}
                  >
                    {tt.editBtn}
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
            <Button icon={<Plus className="size-4" />} onClick={() => setCreateOpen(true)} className="w-full sm:w-auto min-h-11">
              {tt.newBtn}
            </Button>
          ) : null
        }
      />

      <PageTip storageKey="users-crud">
        {tt.description}
      </PageTip>

      <PageToolbar>
        <Input
          iconLeft={<Search className="size-4" />}
          placeholder={tt.searchPh}
          className={TOOLBAR_INPUT}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Tabs
          value={filter}
          onChange={(id) => setFilter(id as FilterKey)}
          items={[
            { id: "employees", label: tt.filterEmployees },
            { id: "portal", label: tt.filterPortal },
            { id: "all", label: tt.filterAll },
          ]}
        />
      </PageToolbar>

      <DataTable
        columns={cols}
        rows={rows}
        loading={isLoading}
        rowKey={(r) => r.id}
        empty={<EmptyState icon={<UserCog className="size-7" />} title={tt.emptyTitle} />}
      />

      {createOpen ? <UserFormModal open onClose={() => setCreateOpen(false)} /> : null}
      {editUser ? <UserFormModal open user={editUser} onClose={() => setEditUser(null)} /> : null}
      <ProfileViewModal
        userId={viewUserId}
        open={viewUserId != null}
        onClose={() => setViewUserId(null)}
      />
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
      icon={<Trash2 className="size-3.5" />}
      onClick={(e) => {
        e.stopPropagation();
        if (window.confirm(tt.confirmDelete)) remove.mutate();
      }}
    >
      {tt.deleteBtn}
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
  const { t, locale } = useT();
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
  const [isStaff, setIsStaff] = useState(user?.is_staff ?? true);
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
          is_staff: isStaff,
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
          is_staff: isStaff,
          role_slugs: roleSlugs,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success(isEdit ? tt.updated : tt.created);
      onClose();
    },
    onError: (err) => toast.error(apiErrorMessage(err, locale)),
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

        <label className="sm:col-span-2 flex items-center gap-2 text-[13px] text-text-2 select-none">
          <input
            type="checkbox"
            className="size-3.5 accent-[rgb(var(--brand))]"
            checked={isStaff}
            onChange={(e) => setIsStaff(e.target.checked)}
          />
          {tt.staffOnly}
        </label>

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
          <div className="mb-1 text-[12.5px] font-medium text-text">{tt.roles}</div>
          <p className="mb-2 text-[11.5px] text-text-3">{tt.rolesHint}</p>
          <div className="flex flex-wrap gap-2">
            {(roles ?? []).map((r) => {
              const on = roleSlugs.includes(r.slug);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => toggleRole(r.slug)}
                  className={`rounded-full border px-2.5 py-1 text-[12px] transition-colors ${
                    on
                      ? "border-brand bg-brand/12 text-brand"
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
