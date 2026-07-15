import { useQuery } from "@tanstack/react-query";
import { Mail, Briefcase, Building2 } from "lucide-react";

import { authApi } from "@/api/auth";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Badge } from "@/components/ui/Badge";
import { useT } from "@/i18n/useT";

export function ProfileViewModal({
  userId,
  open,
  onClose,
}: {
  userId: number | null;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useT();
  const tt = t.staffUi.settings;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["user.profile", userId],
    queryFn: () => authApi.publicProfile(userId!),
    enabled: open && !!userId,
  });

  return (
    <Modal open={open} onClose={onClose} title={tt.profileViewTitle} size="sm">
      {isLoading ? (
        <div className="flex flex-col items-center gap-3 py-4">
          <Skeleton className="size-20 rounded-full" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-28" />
        </div>
      ) : isError || !data ? (
        <p className="py-6 text-center text-[13px] text-text-3">{tt.profileLoadError}</p>
      ) : (
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <UserAvatar
            name={data.full_name}
            seed={data.id}
            src={data.avatar_url}
            size="xl"
            className="ring-2 ring-brand/20"
          />
          <div className="min-w-0">
            <h3 className="text-[16px] font-semibold text-text">{data.full_name}</h3>
            {data.title ? (
              <p className="mt-0.5 text-[13px] text-text-2">{data.title}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap justify-center gap-1.5">
            {data.roles.map((r) => (
              <Badge key={r.id} variant="brand">
                {r.name}
              </Badge>
            ))}
          </div>
          <ul className="mt-2 w-full space-y-2 text-start text-[13px] text-text-2">
            <li className="flex items-center gap-2 rounded-lg bg-surface-2/60 px-3 py-2">
              <Mail className="size-3.5 shrink-0 text-text-3" />
              <span className="truncate">{data.email}</span>
            </li>
            {data.department ? (
              <li className="flex items-center gap-2 rounded-lg bg-surface-2/60 px-3 py-2">
                <Building2 className="size-3.5 shrink-0 text-text-3" />
                <span className="truncate">{data.department}</span>
              </li>
            ) : null}
            {data.title ? (
              <li className="flex items-center gap-2 rounded-lg bg-surface-2/60 px-3 py-2">
                <Briefcase className="size-3.5 shrink-0 text-text-3" />
                <span className="truncate">{data.title}</span>
              </li>
            ) : null}
          </ul>
        </div>
      )}
    </Modal>
  );
}
