import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { notificationsApi } from "@/api/modules";
import { useAuthStore } from "@/store/auth";
import { useT } from "@/i18n/useT";
import {
  disableWebPush,
  enableWebPush,
  isPushPromptDismissed,
  isPushSupported,
  permissionState,
  registerPushServiceWorker,
  syncWebPushIfGranted,
} from "@/lib/webPush";

export function useWebPush() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const { t } = useT();
  const tt = t.staffUi.settings;
  const [permission, setPermission] = useState(permissionState());

  useEffect(() => {
    if (!user?.is_staff && !user?.is_superuser) return;
    void registerPushServiceWorker();
    void syncWebPushIfGranted();
  }, [user?.id, user?.is_staff, user?.is_superuser]);

  useEffect(() => {
    const onFocus = () => setPermission(permissionState());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const statusQ = useQuery({
    queryKey: ["push.status", user?.id],
    queryFn: () => notificationsApi.pushStatus(),
    enabled: !!user && (user.is_staff || !!user.is_superuser) && isPushSupported(),
    staleTime: 30_000,
  });

  const enable = useMutation({
    mutationFn: enableWebPush,
    onSuccess: (res) => {
      setPermission(permissionState());
      qc.invalidateQueries({ queryKey: ["push.status"] });
      if (res.ok) {
        toast.success(tt.pushEnabled);
        return;
      }
      if (res.reason === "denied") toast.error(tt.pushDenied);
      else if (res.reason === "unsupported") toast.error(tt.pushUnsupported);
      else if (res.reason === "no-vapid") toast.error(tt.pushUnavailable);
      else toast.error(tt.pushFailed);
    },
    onError: () => toast.error(tt.pushFailed),
  });

  const disable = useMutation({
    mutationFn: disableWebPush,
    onSuccess: () => {
      setPermission(permissionState());
      qc.invalidateQueries({ queryKey: ["push.status"] });
      toast.success(tt.pushDisabled);
    },
    onError: () => toast.error(tt.pushFailed),
  });

  const supported = isPushSupported();
  const serverEnabled = !!statusQ.data?.enabled;
  const granted = permission === "granted";
  const active = supported && granted && serverEnabled;

  const showPrompt =
    supported &&
    !!user &&
    (user.is_staff || !!user.is_superuser) &&
    permission !== "denied" &&
    !active &&
    !isPushPromptDismissed();

  return {
    supported,
    permission,
    active,
    status: statusQ.data,
    loading: statusQ.isLoading || enable.isPending || disable.isPending,
    enable: () => enable.mutate(),
    disable: () => disable.mutate(),
    showPrompt,
    isEnabling: enable.isPending,
    isDisabling: disable.isPending,
  };
}
