import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import { authApi } from "@/api/auth";
import { ProfilePhotoCard } from "@/components/profile/ProfilePhotoCard";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuthStore } from "@/store/auth";
import { useT } from "@/i18n/useT";

export default function PortalProfilePage() {
  const { t } = useT();
  const tt = t.staffUi.settings;
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [form, setForm] = useState({
    full_name: user?.full_name ?? "",
    phone: user?.phone ?? "",
  });

  const save = useMutation({
    mutationFn: () => authApi.updateProfile(form),
    onSuccess: (me) => {
      setUser(me);
      toast.success(tt.saved);
    },
  });

  return (
    <div className="page-shell space-y-4">
      <PageHeader title={tt.profileTitle} description={tt.avatarSub} />
      <div className="grid gap-4 lg:grid-cols-2">
        <ProfilePhotoCard />
        <Card>
          <CardHeader title={tt.profileTitle} subtitle={tt.profileSub} />
          <CardBody className="grid gap-3">
            <Input
              label={tt.fullName}
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
            <Input label={tt.email} value={user?.email ?? ""} disabled />
            <Input
              label={tt.phone}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <div className="flex justify-end">
              <Button loading={save.isPending} onClick={() => save.mutate()}>
                {tt.save}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
