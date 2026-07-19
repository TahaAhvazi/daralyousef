import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Plus, Search, Trash2, UserCog } from "lucide-react";
import toast from "react-hot-toast";

import { departmentsApi, usersApi } from "@/api/modules";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Column, DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageTip } from "@/components/ui/PageTip";
import { PageToolbar, TOOLBAR_INPUT } from "@/components/ui/PageToolbar";
import { Pagination } from "@/components/ui/Pagination";
import { Tabs } from "@/components/ui/Tabs";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { ProfileViewModal } from "@/components/profile/ProfileViewModal";
import { StaffUserFormModal } from "@/components/users/StaffUserFormModal";
import { fromNow } from "@/lib/format";
import {
  canCreateUsers,
  canDeleteUsers,
  canUpdateUsers,
} from "@/lib/permissions";
import { useDebouncedValue } from "@/lib/useDebouncedValue";
import { useAuthStore } from "@/store/auth";
import { useT } from "@/i18n/useT";
import type { User } from "@/types/api";

type FilterKey = "employees" | "portal" | "all";

const PAGE_SIZE = 25;

export default function UsersPage() {
  const { t } = useT();
  const tt = t.staffUi.users;
  const me = useAuthStore((s) => s.user);
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q.trim(), 300);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<FilterKey>("employees");
  const [departmentId, setDepartmentId] = useState<number | "">("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [viewUserId, setViewUserId] = useState<number | null>(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, filter, departmentId]);

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: () => departmentsApi.list(),
  });

  const listParams = useMemo(() => {
    const params: {
      page: number;
      page_size: number;
      q?: string;
      is_staff?: boolean;
      department_id?: number;
    } = { page, page_size: PAGE_SIZE, q: debouncedQ || undefined };
    if (filter === "employees") params.is_staff = true;
    if (filter === "portal") params.is_staff = false;
    if (departmentId !== "" && filter !== "portal") {
      params.department_id = departmentId;
    }
    return params;
  }, [page, debouncedQ, filter, departmentId]);

  const { data, isLoading } = useQuery({
    queryKey: ["users", listParams],
    queryFn: () => usersApi.list(listParams),
    placeholderData: (prev) => prev,
  });

  const rows = data?.items ?? [];
  const total = data?.total ?? 0;

  const cols: Column<User>[] = [
    {
      key: "name",
      header: tt.colUser,
      render: (u) =>
        u.is_staff ? (
          <Link
            to={`/app/hr/employees/${u.id}`}
            className="flex items-center gap-3 text-start hover:opacity-90"
          >
            <UserAvatar name={u.full_name} seed={u.id} src={u.avatar_url} size="sm" />
            <div className="min-w-0">
              <div className="font-medium text-brand truncate">{u.full_name}</div>
              <div className="text-[11.5px] text-text-3 truncate">
                {[u.email, u.phone].filter(Boolean).join(" · ")}
              </div>
            </div>
          </Link>
        ) : (
          <button
            type="button"
            className="flex items-center gap-3 text-start hover:opacity-90"
            onClick={() => setViewUserId(u.id)}
          >
            <UserAvatar name={u.full_name} seed={u.id} src={u.avatar_url} size="sm" />
            <div className="min-w-0">
              <div className="font-medium text-brand truncate">{u.full_name}</div>
              <div className="text-[11.5px] text-text-3 truncate">
                {[u.email, u.phone].filter(Boolean).join(" · ")}
              </div>
            </div>
          </button>
        ),
    },
    {
      key: "title",
      header: tt.colTitle,
      hideOnMobile: true,
      render: (u) => u.title || t.common.none,
    },
    {
      key: "dept",
      header: tt.colDept,
      render: (u) =>
        u.department ? (
          <Badge variant="default">{u.department}</Badge>
        ) : (
          <span className="text-text-3">{t.common.none}</span>
        ),
    },
    {
      key: "roles",
      header: tt.colRoles,
      hideOnMobile: true,
      render: (u) => (
        <div className="flex flex-wrap gap-1">
          {u.roles.map((r) => (
            <Badge key={r.id} variant="brand">
              {r.name}
            </Badge>
          ))}
          {!u.is_staff ? (
            <Badge variant="success">{t.staffUi.customers.portalBadge}</Badge>
          ) : null}
          {!u.roles.length && u.is_staff ? (
            <span className="text-text-3 text-[12px]">—</span>
          ) : null}
        </div>
      ),
    },
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
    {
      key: "seen",
      header: tt.colLastLogin,
      hideOnMobile: true,
      render: (u) => fromNow(u.last_login_at),
    },
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
            <Button
              icon={<Plus className="size-4" />}
              onClick={() => setCreateOpen(true)}
              className="w-full sm:w-auto min-h-11"
            >
              {tt.newBtn}
            </Button>
          ) : null
        }
      />

      <PageTip storageKey="users-crud">{tt.description}</PageTip>

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
          onChange={(id) => {
            setFilter(id as FilterKey);
            if (id === "portal") setDepartmentId("");
          }}
          items={[
            { id: "employees", label: tt.filterEmployees },
            { id: "portal", label: tt.filterPortal },
            { id: "all", label: tt.filterAll },
          ]}
        />
      </PageToolbar>

      {filter !== "portal" ? (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setDepartmentId("")}
            className={`rounded-md border px-2.5 py-1.5 text-[12.5px] transition-colors ${
              departmentId === ""
                ? "border-brand bg-brand/10 text-brand"
                : "border-border text-text-2 hover:border-text-3"
            }`}
          >
            {tt.allDepartments}
          </button>
          {(departments ?? []).map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDepartmentId(d.id)}
              className={`rounded-md border px-2.5 py-1.5 text-[12.5px] transition-colors ${
                departmentId === d.id
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-border text-text-2 hover:border-text-3"
              }`}
            >
              {d.name}
            </button>
          ))}
          <span className="ms-auto text-[12px] text-text-3">
            {tt.resultCount.replace("{n}", String(total))}
          </span>
        </div>
      ) : (
        <div className="mb-3 text-end text-[12px] text-text-3">
          {tt.resultCount.replace("{n}", String(total))}
        </div>
      )}

      <DataTable
        columns={cols}
        rows={rows}
        loading={isLoading}
        rowKey={(r) => r.id}
        empty={
          <EmptyState
            icon={<UserCog className="size-7" />}
            title={tt.emptyTitle}
            description={tt.emptyDesc}
          />
        }
      />

      <Pagination
        className="mt-4"
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onPageChange={setPage}
      />

      {createOpen ? <StaffUserFormModal open onClose={() => setCreateOpen(false)} /> : null}
      {editUser ? (
        <StaffUserFormModal open user={editUser} onClose={() => setEditUser(null)} />
      ) : null}
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
      qc.invalidateQueries({ queryKey: ["hr.employee"] });
      qc.invalidateQueries({ queryKey: ["hr.summary"] });
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
