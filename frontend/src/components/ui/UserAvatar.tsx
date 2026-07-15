import { useState } from "react";

import { cn } from "@/lib/cn";
import { avatarColor, avatarInitials } from "@/lib/messenger";
import { resolveBackendAssetUrl } from "@/config/backend";

const SIZE: Record<"xs" | "sm" | "md" | "lg" | "xl", string> = {
  xs: "size-7 text-[10px]",
  sm: "size-9 text-[11px]",
  md: "size-10 text-[13px]",
  lg: "size-11 text-[15px]",
  xl: "size-20 text-[22px]",
};

export function UserAvatar({
  name,
  seed,
  src,
  size = "md",
  className,
  alt,
}: {
  name?: string | null;
  seed?: string | number | null;
  src?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  alt?: string;
}) {
  const [broken, setBroken] = useState(false);
  const url = src ? resolveBackendAssetUrl(src) : "";
  const showImg = !!url && !broken;
  const key = String(seed ?? name ?? "?");

  if (showImg) {
    return (
      <img
        src={url}
        alt={alt ?? name ?? ""}
        className={cn(
          "inline-block shrink-0 rounded-full object-cover ring-1 ring-border/60",
          SIZE[size],
          className,
        )}
        onError={() => setBroken(true)}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        avatarColor(key),
        SIZE[size],
        className,
      )}
      aria-hidden={!alt}
      title={alt ?? name ?? undefined}
    >
      {avatarInitials(name)}
    </span>
  );
}
