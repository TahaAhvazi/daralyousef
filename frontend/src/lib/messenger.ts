import type { Conversation, ConversationMember } from "@/types/api";

const AVATAR_COLORS = [
  "bg-violet-500",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-orange-500",
];

export function avatarInitials(name?: string | null): string {
  const parts = (name ?? "?").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0]?.[0] ?? "?").toUpperCase();
}

export function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash + seed.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[hash];
}

export function conversationTitle(
  c: Conversation,
  selfId?: number,
  groupFallback = "Group chat",
): string {
  if (c.title?.trim()) return c.title.trim();
  if (c.kind === "group") return groupFallback;
  const other = c.members.find((m) => m.user_id !== selfId);
  return other?.full_name ?? c.members.map((m) => m.full_name).join(", ") ?? "—";
}

export function conversationPeer(
  c: Conversation,
  selfId?: number,
): ConversationMember | undefined {
  if (c.kind === "group") return undefined;
  return c.members.find((m) => m.user_id !== selfId);
}

export function findDmWithUser(
  conversations: Conversation[],
  otherUserId: number,
  selfId: number,
): Conversation | undefined {
  return conversations.find(
    (c) =>
      c.kind === "dm" &&
      c.members.length === 2 &&
      c.members.some((m) => m.user_id === otherUserId) &&
      c.members.some((m) => m.user_id === selfId),
  );
}

export function sameDay(a: string, b: string): boolean {
  return a.slice(0, 10) === b.slice(0, 10);
}
