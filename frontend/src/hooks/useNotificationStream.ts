import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { connectNotificationStream, type NotificationStreamEvent } from "@/lib/notificationStream";
import { NOTIFICATIONS_KEY } from "@/hooks/useNotifications";
import { useAuthStore } from "@/store/auth";

const RECONNECT_MS = 2_000;

/**
 * Keeps notification badge/list in sync via SSE (~1–2s latency).
 * Falls back to react-query refetch when the stream reconnects.
 */
export function useNotificationStream() {
  const token = useAuthStore((s) => s.accessToken);
  const qc = useQueryClient();

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    const abort = new AbortController();

    const applyEvent = (ev: NotificationStreamEvent) => {
      if (ev.type === "snapshot") {
        qc.setQueryData([...NOTIFICATIONS_KEY, "unread-count"], { count: ev.unread_count });
        return;
      }
      if (ev.type === "notifications") {
        qc.setQueryData([...NOTIFICATIONS_KEY, "unread-count"], { count: ev.unread_count });
        qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      }
    };

    const run = async () => {
      try {
        await connectNotificationStream(applyEvent, abort.signal);
      } catch {
        if (!cancelled && !abort.signal.aborted) {
          reconnectTimer = setTimeout(run, RECONNECT_MS);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
      abort.abort();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [token, qc]);
}
