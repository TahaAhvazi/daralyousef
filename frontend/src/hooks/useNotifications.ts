import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { notificationsApi } from "@/api/modules";

export const NOTIFICATIONS_KEY = ["notifications"] as const;

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, "unread-count"],
    queryFn: () => notificationsApi.unreadCount(),
    refetchInterval: 60_000,
    staleTime: 5_000,
    select: (d) => d.count,
  });
}

export function useNotificationsList(opts?: { unreadOnly?: boolean; pageSize?: number }) {
  const unreadOnly = opts?.unreadOnly ?? false;
  const pageSize = opts?.pageSize ?? 25;
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, "list", { unreadOnly, pageSize }],
    queryFn: () =>
      notificationsApi.list({ page: 1, page_size: pageSize, unread_only: unreadOnly }),
    refetchInterval: 60_000,
    staleTime: 5_000,
  });
}

export function useNotificationActions() {
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
  };

  const markRead = useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: invalidate,
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: invalidate,
  });

  return { markRead, markAllRead, invalidate };
}
