import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { conversationsApi } from "@/api/modules";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useT } from "@/i18n/useT";

export function NewGroupModal({
  open,
  onClose,
  staff,
  orders,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  staff: { id: number; full_name: string; email: string }[];
  orders: { id: number; code: string; title?: string | null }[];
  onCreated?: (id: number) => void;
}) {
  const { t } = useT();
  const m = t.staffUi.messages;
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [orderId, setOrderId] = useState<number | "">("");
  const [members, setMembers] = useState<number[]>([]);

  const create = useMutation({
    mutationFn: () =>
      conversationsApi.create({
        kind: "group",
        title,
        order_id: orderId === "" ? undefined : orderId,
        member_ids: members,
      }),
    onSuccess: (conv) => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      toast.success(m.groupCreated);
      onCreated?.(conv.id);
      onClose();
      setTitle("");
      setOrderId("");
      setMembers([]);
    },
  });

  const toggle = (id: number) =>
    setMembers((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={m.newGroup}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{t.staffUi.common.cancel}</Button>
          <Button
            loading={create.isPending}
            disabled={!title.trim() || members.length === 0}
            onClick={() => create.mutate()}
          >
            {m.createGroup}
          </Button>
        </>
      }
    >
      <div className="grid gap-3.5">
        <Input label={m.groupName} value={title} onChange={(e) => setTitle(e.target.value)} />
        <Select
          label={m.linkProject}
          value={orderId === "" ? "" : String(orderId)}
          options={[
            { value: "", label: m.noProject },
            ...orders.map((o) => ({ value: String(o.id), label: `${o.code} — ${o.title ?? o.code}` })),
          ]}
          onChange={(e) => {
            const v = (e.target as HTMLSelectElement).value;
            setOrderId(v === "" ? "" : Number(v));
          }}
        />
        <div>
          <p className="label mb-2">{m.members}</p>
          <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
            {staff.map((s) => (
              <label key={s.id} className="flex cursor-pointer items-center gap-2 py-1 text-[13px]">
                <input type="checkbox" checked={members.includes(s.id)} onChange={() => toggle(s.id)} />
                {s.full_name}
              </label>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
