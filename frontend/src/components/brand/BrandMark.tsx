import { useState } from "react";
import { cn } from "@/lib/cn";
import { useBrand } from "@/hooks/useBrand";

interface BrandMarkProps {
  size?: number;
  className?: string;
  rounded?: string;
  /**
   * Optional override URL. When omitted, falls back to the admin-managed logo
   * from `useBrand()` (which itself defaults to `/logo.jpg` from `public/`).
   */
  src?: string;
}

/**
 * Renders the company logo as a square mark. Loads the brand logo (admin
 * configurable) and falls back to a stylised gradient placeholder if the file
 * is missing — so the layout never breaks while the asset is being delivered.
 */
export function BrandMark({ size = 40, className, rounded = "rounded-xl", src }: BrandMarkProps) {
  const { logoUrl } = useBrand();
  const finalSrc = src || logoUrl;
  const [errored, setErrored] = useState(false);

  return (
    <span
      className={cn(
        "relative inline-block overflow-hidden shrink-0 align-middle",
        rounded,
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {!errored ? (
        <img
          key={finalSrc}
          src={finalSrc}
          alt=""
          width={size}
          height={size}
          loading="eager"
          decoding="async"
          onError={() => setErrored(true)}
          className="absolute inset-0 size-full object-cover"
          draggable={false}
        />
      ) : (
        <span className="absolute inset-0 grid place-items-center bg-grad-brand text-white shadow-glow">
          <svg viewBox="0 0 64 64" className="size-[65%]" aria-hidden>
            <defs>
              <linearGradient id="bm-g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#E0B860" />
                <stop offset="100%" stopColor="#C49A3C" />
              </linearGradient>
            </defs>
            <path
              d="M14 18 L50 18 L50 26 L24 26 L24 36 L46 36 L46 44 L14 44 Z"
              fill="url(#bm-g)"
            />
            <circle cx="54" cy="14" r="3.5" fill="url(#bm-g)" />
          </svg>
        </span>
      )}
    </span>
  );
}
