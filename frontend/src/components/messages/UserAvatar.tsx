import { cn } from "@/lib/cn";
import { avatarColor, avatarInitials } from "@/lib/messenger";

export function UserAvatar({
  name,
  seed,
  size = "md",
  className,
}: {
  name?: string | null;
  seed?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const s = size === "sm" ? "size-9 text-[11px]" : size === "lg" ? "size-11 text-[15px]" : "size-10 text-[13px]";
  const key = seed ?? name ?? "?";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        avatarColor(key),
        s,
        className,
      )}
      aria-hidden
    >
      {avatarInitials(name)}
    </span>
  );
}
