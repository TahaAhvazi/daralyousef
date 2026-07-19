import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";

import { departmentsApi, hrApi, usersApi } from "@/api/modules";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useT } from "@/i18n/useT";
import { apiErrorMessage } from "@/lib/apiErrors";
import type { User } from "@/types/api";

export function StaffUserFormModal({
  open,
  onClose,
  user,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  user?: User;
  onSaved?: (user: User) => void;
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

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: () => departmentsApi.list(),
    enabled: open,
  });

  const { data: designations } = useQuery({
    queryKey: ["hr.designations"],
    queryFn: () => hrApi.designations({ active_only: true }),
    enabled: open,
  });

  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [departmentId, setDepartmentId] = useState<number | "">(
    user?.department_id ?? "",
  );
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
    mutationFn: async (): Promise<User> => {
      const dept =
        departmentId === ""
          ? null
          : (departments ?? []).find((d) => d.id === departmentId) ?? null;
      if (isEdit) {
        const payload: Record<string, unknown> = {
          full_name: fullName,
          phone: phone || null,
          department_id: dept?.id ?? null,
          department: dept?.name ?? null,
          title: title || null,
          is_active: isActive,
          is_staff: isStaff,
          role_slugs: roleSlugs,
        };
        if (password.trim()) payload.password = password;
        await usersApi.update(user!.id, payload);
        return {
          ...user!,
          full_name: fullName,
          phone: phone || null,
          department: dept?.name ?? null,
          department_id: dept?.id ?? null,
          title: title || null,
          is_active: isActive,
          is_staff: isStaff,
          roles: roleSlugs.map((slug, i) => {
            const existing = user!.roles.find((r) => r.slug === slug);
            return existing ?? { id: i + 1, slug, name: slug };
          }),
        };
      }
      return usersApi.create({
        email,
        password,
        full_name: fullName,
        phone: phone || undefined,
        department_id: dept?.id ?? undefined,
        department: dept?.name ?? undefined,
        title: title || undefined,
        is_staff: isStaff,
        role_slugs: roleSlugs,
      });
    },
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["hr.employee"] });
      qc.invalidateQueries({ queryKey: ["hr.summary"] });
      toast.success(isEdit ? tt.updated : tt.created);
      onSaved?.(saved);
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

        <label className="block min-w-0">
          <span className="mb-1.5 block text-[12.5px] font-medium text-text-2">
            {tt.department}
          </span>
          <select
            className="input w-full"
            value={departmentId === "" ? "" : String(departmentId)}
            onChange={(e) =>
              setDepartmentId(e.target.value ? Number(e.target.value) : "")
            }
          >
            <option value="">—</option>
            {(departments ?? []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>

        <Input
          label={tt.titleField}
          value={title}
          list="staff-designation-options"
          onChange={(e) => setTitle(e.target.value)}
        />
        <datalist id="staff-designation-options">
          {(designations ?? []).map((d) => (
            <option key={d.id} value={d.name} />
          ))}
        </datalist>

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
