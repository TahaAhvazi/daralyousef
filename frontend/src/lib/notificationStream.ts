import { API_BASE } from "@/config/backend";
import { useAuthStore } from "@/store/auth";
import type { NotificationItem } from "@/types/api";

export type NotificationStreamEvent =
  | { type: "snapshot"; unread_count: number }
  | { type: "notifications"; unread_count: number; data: NotificationItem[] };

function parseSseChunk(buffer: string): { events: NotificationStreamEvent[]; rest: string } {
  const events: NotificationStreamEvent[] = [];
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";

  for (const block of parts) {
    for (const line of block.split("\n")) {
      if (!line.startsWith("data: ")) continue;
      try {
        const parsed = JSON.parse(line.slice(6)) as NotificationStreamEvent;
        if (parsed?.type) events.push(parsed);
      } catch {
        /* ignore malformed */
      }
    }
  }

  return { events, rest };
}

export async function connectNotificationStream(
  onEvent: (event: NotificationStreamEvent) => void,
  signal: AbortSignal,
): Promise<void> {
  const token = useAuthStore.getState().accessToken;
  if (!token) return;

  const res = await fetch(`${API_BASE}/notifications/stream`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "text/event-stream",
    },
    signal,
  });

  if (!res.ok) {
    throw new Error(`Notification stream failed (${res.status})`);
  }
  if (!res.body) {
    throw new Error("Notification stream has no body");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (!signal.aborted) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const { events, rest } = parseSseChunk(buffer);
    buffer = rest;
    for (const ev of events) onEvent(ev);
  }
}
