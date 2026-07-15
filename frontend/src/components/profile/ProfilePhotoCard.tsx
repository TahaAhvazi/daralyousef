import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Camera, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { authApi } from "@/api/auth";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useAuthStore } from "@/store/auth";
import { useT } from "@/i18n/useT";
import { apiErrorMessage } from "@/lib/apiErrors";

export function ProfilePhotoCard() {
  const { t, locale } = useT();
  const tt = t.staffUi.settings;
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const upload = useMutation({
    mutationFn: (file: File) => authApi.uploadAvatar(file),
    onSuccess: (me) => {
      setUser(me);
      setPreview(null);
      toast.success(tt.avatarUpdated);
    },
    onError: (err) => toast.error(apiErrorMessage(err, locale)),
  });

  const remove = useMutation({
    mutationFn: () => authApi.removeAvatar(),
    onSuccess: (me) => {
      setUser(me);
      setPreview(null);
      toast.success(tt.avatarRemoved);
    },
    onError: (err) => toast.error(apiErrorMessage(err, locale)),
  });

  const onPick = (file: File | undefined) => {
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) {
      toast.error(tt.avatarTypeError);
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error(tt.avatarSizeError);
      return;
    }
    const local = URL.createObjectURL(file);
    setPreview(local);
    upload.mutate(file, {
      onSettled: () => URL.revokeObjectURL(local),
    });
  };

  return (
    <Card>
      <CardHeader title={tt.avatarTitle} subtitle={tt.avatarSub} />
      <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <UserAvatar
          name={user?.full_name}
          seed={user?.id}
          src={preview ?? user?.avatar_url}
          size="xl"
          className="ring-2 ring-brand/20"
        />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-[13px] text-text-2">{tt.avatarHint}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              icon={<Camera className="size-3.5" />}
              loading={upload.isPending}
              onClick={() => inputRef.current?.click()}
            >
              {user?.avatar_url ? tt.avatarChange : tt.avatarUpload}
            </Button>
            {user?.avatar_url ? (
              <Button
                size="sm"
                variant="secondary"
                icon={<Trash2 className="size-3.5" />}
                loading={remove.isPending}
                onClick={() => remove.mutate()}
              >
                {tt.avatarRemove}
              </Button>
            ) : null}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              onPick(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
      </CardBody>
    </Card>
  );
}
