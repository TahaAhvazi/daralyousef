import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { CircleHelp, Sparkles, X } from "lucide-react";

import { cn } from "@/lib/cn";
import { useT } from "@/i18n/useT";
import {
  buildTourSteps,
  clearTourCompleted,
  isTourCompleted,
  markTourCompleted,
  requestOpenNavSection,
  resolveTourProfile,
  type TourStepDef,
  type TourStepKey,
} from "@/lib/productTour";
import { useAuthStore } from "@/store/auth";

type Rect = { top: number; left: number; width: number; height: number };

const MAX_SPOTLIGHT_PX = 96;
const MIN_SPOTLIGHT_PX = 56;

function measureTarget(selector: string): Rect | null {
  const nodes = document.querySelectorAll(`[data-tour="${selector}"]`);
  const pick = (el: HTMLElement): Rect | null => {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return null;
    // Huge containers (main pane / long sidebar) → use a small centered hit area
    const maxDim = 120;
    if (r.width > maxDim || r.height > maxDim) {
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      return { top: cy - maxDim / 2, left: cx - maxDim / 2, width: maxDim, height: maxDim };
    }
    return { top: r.top, left: r.left, width: r.width, height: r.height };
  };

  // Prefer the visible (on-screen) match — avoid hidden mobile duplicates
  for (const node of nodes) {
    const el = node as HTMLElement;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    if (r.bottom < 0 || r.top > window.innerHeight || r.right < 0 || r.left > window.innerWidth) {
      continue;
    }
    return pick(el);
  }
  // Fallback: first measurable node even if off-screen (we'll clamp later)
  for (const node of nodes) {
    const picked = pick(node as HTMLElement);
    if (picked) return picked;
  }
  return null;
}

/** Spotlight never larger than MAX — huge targets (main pane) stay as a small ring. */
function spotlightFromRect(r: Rect | null): { cx: number; cy: number; size: number } {
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  if (!r) {
    return { cx: vw / 2, cy: Math.min(vh * 0.35, vh / 2), size: MIN_SPOTLIGHT_PX };
  }
  const raw = Math.max(r.width, r.height) + 16;
  const size = Math.min(MAX_SPOTLIGHT_PX, Math.max(MIN_SPOTLIGHT_PX, raw));
  let cx = r.left + r.width / 2;
  let cy = r.top + r.height / 2;
  // Keep spotlight fully inside viewport
  const half = size / 2 + 8;
  cx = Math.min(Math.max(cx, half), vw - half);
  cy = Math.min(Math.max(cy, half), vh - half);
  return { cx, cy, size };
}

function tooltipPosition(
  spot: { cx: number; cy: number; size: number },
  placement: TourStepDef["placement"],
  isRtl: boolean,
) {
  const gap = 16;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const maxW = Math.min(400, vw - 24);
  const cardH = 320; // taller cards for beginner-detail copy

  let place = placement === "auto" || !placement ? "bottom" : placement;
  // Prefer bottom; if near bottom of screen, flip to top
  if (place === "bottom" && spot.cy + spot.size / 2 + gap + cardH > vh - 12) {
    place = "top";
  }
  if (place === "top" && spot.cy - spot.size / 2 - gap - cardH < 12) {
    place = "bottom";
  }

  let top = spot.cy + spot.size / 2 + gap;
  let left = spot.cx;
  let transform = "translate(-50%, 0)";

  if (place === "top") {
    top = spot.cy - spot.size / 2 - gap;
    transform = "translate(-50%, -100%)";
  } else if (place === "left" || place === "right") {
    top = spot.cy;
    const toEnd = place === "right" ? !isRtl : isRtl;
    if (toEnd) {
      left = spot.cx + spot.size / 2 + gap;
      transform = "translate(0, -50%)";
    } else {
      left = spot.cx - spot.size / 2 - gap;
      transform = "translate(-100%, -50%)";
    }
  }

  // Always keep the card fully inside the viewport (all placements)
  left = Math.min(Math.max(left, 12 + maxW / 2), vw - 12 - maxW / 2);
  if (place === "top") {
    // after translate(-50%, -100%), `top` is the bottom edge of the card
    top = Math.max(top, cardH + 12);
    top = Math.min(top, vh - 12);
  } else if (place === "left" || place === "right") {
    // after translate(±…, -50%), `top` is the vertical center of the card
    top = Math.min(Math.max(top, cardH / 2 + 12), vh - cardH / 2 - 12);
  } else {
    top = Math.min(Math.max(top, 12), vh - cardH - 12);
  }

  return { top, left, maxWidth: maxW, transform, place };
}

function stepCopy(
  steps: Record<string, { title: string; body: string }>,
  key: TourStepKey,
  profile: string,
) {
  if (key === "welcome") {
    const flavored = steps[`${profile}_welcome`];
    if (flavored) return flavored;
  }
  return steps[key] ?? { title: key, body: "" };
}

function scrollTargetIntoView(selector: string) {
  const nodes = document.querySelectorAll(`[data-tour="${selector}"]`);
  for (const node of nodes) {
    const el = node as HTMLElement;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    try {
      el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    } catch {
      /* ignore */
    }
    return;
  }
}

export function ProductTourHost() {
  const { t, isRtl } = useT();
  const tour = t.staffUi.tour;
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [steps, setSteps] = useState<TourStepDef[]>([]);

  const profile = resolveTourProfile(user);

  const refreshRect = useCallback((step: TourStepDef | undefined) => {
    if (!step) {
      setRect(null);
      return;
    }
    setRect(measureTarget(step.target));
  }, []);

  const start = useCallback(
    (force = false) => {
      if (!user) return;
      const built = buildTourSteps(user);
      if (built.length === 0) return;
      if (!force && isTourCompleted(user.id, profile)) return;
      setSteps(built);
      setIndex(0);
      setActive(true);
    },
    [user, profile],
  );

  const stop = useCallback(
    (markDone: boolean) => {
      setActive(false);
      setRect(null);
      if (markDone && user) markTourCompleted(user.id, profile);
    },
    [user, profile],
  );

  const replay = useCallback(() => {
    if (!user) return;
    clearTourCompleted(user.id, profile);
    start(true);
  }, [user, profile, start]);

  const autoStarted = useRef(false);
  useEffect(() => {
    if (!user?.id || autoStarted.current) return;
    autoStarted.current = true;
    const tmr = window.setTimeout(() => start(false), 800);
    return () => window.clearTimeout(tmr);
  }, [user?.id, start]);

  useEffect(() => {
    const onReplay = () => replay();
    window.addEventListener("atelier:tour-replay", onReplay);
    return () => window.removeEventListener("atelier:tour-replay", onReplay);
  }, [replay]);

  const step = steps[index];

  useEffect(() => {
    if (!active || !step) return;
    let cancelled = false;

    const run = async () => {
      if (step.openSection) requestOpenNavSection(step.openSection);
      if (step.route && window.location.pathname !== step.route) {
        navigate(step.route);
        await new Promise((r) => setTimeout(r, 320));
      } else {
        await new Promise((r) => setTimeout(r, 80));
      }
      if (cancelled) return;
      scrollTargetIntoView(step.target);
      await new Promise((r) => setTimeout(r, 120));

      for (let i = 0; i < 10; i++) {
        if (cancelled) return;
        const m = measureTarget(step.target);
        if (m) {
          setRect(m);
          return;
        }
        await new Promise((r) => setTimeout(r, 70));
      }
      // Missing target — still show centered card so user can skip/next
      setRect(null);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [active, step, navigate]);

  useLayoutEffect(() => {
    if (!active || !step) return;
    const onWin = () => refreshRect(step);
    window.addEventListener("resize", onWin);
    window.addEventListener("scroll", onWin, true);
    return () => {
      window.removeEventListener("resize", onWin);
      window.removeEventListener("scroll", onWin, true);
    };
  }, [active, step, refreshRect]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        stop(true);
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        goNextRef.current();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goBackRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, stop]);

  const goNext = useCallback(() => {
    setIndex((i) => {
      if (i >= steps.length - 1) {
        stop(true);
        return i;
      }
      return i + 1;
    });
  }, [steps.length, stop]);

  const goBack = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  const goNextRef = useRef(goNext);
  const goBackRef = useRef(goBack);
  goNextRef.current = goNext;
  goBackRef.current = goBack;

  if (!active || !step) return null;

  const copy = stepCopy(tour.steps as Record<string, { title: string; body: string }>, step.key, profile);
  const spot = spotlightFromRect(rect);
  const tip = tooltipPosition(spot, step.placement ?? "auto", isRtl);

  return createPortal(
    <div className="fixed inset-0 z-[10000]" role="dialog" aria-modal="true" aria-label={tour.ariaLabel}>
      {/* Full-screen dim with a soft cutout around the spotlight */}
      <button
        type="button"
        className="absolute inset-0 z-[10000] cursor-default border-0 p-0"
        aria-label={tour.skip}
        onClick={() => stop(true)}
        style={{
          background: `radial-gradient(circle ${spot.size / 2 + 6}px at ${spot.cx}px ${spot.cy}px, transparent 0, transparent ${spot.size / 2}px, rgba(40,28,5,0.58) ${spot.size / 2 + 4}px)`,
        }}
      />

      {/* Spotlight ring only — dim comes from the backdrop (never page-sized yellow) */}
      <div
        className="pointer-events-none absolute z-[10001] rounded-full transition-all duration-300 ease-out"
        style={{
          top: spot.cy - spot.size / 2,
          left: spot.cx - spot.size / 2,
          width: spot.size,
          height: spot.size,
          boxShadow: `
            0 0 0 3px rgba(252, 211, 77, 0.98),
            0 0 0 10px rgba(251, 191, 36, 0.28),
            0 0 28px 6px rgba(245, 158, 11, 0.35)
          `,
          background: "rgba(253, 230, 138, 0.22)",
        }}
      />
      {/* Clickable hotspot over spotlight to advance */}
      <button
        type="button"
        className="absolute z-[10002] rounded-full border-0 bg-transparent p-0"
        style={{
          top: spot.cy - spot.size / 2,
          left: spot.cx - spot.size / 2,
          width: spot.size,
          height: spot.size,
        }}
        aria-label={tour.next}
        onClick={(e) => {
          e.stopPropagation();
          goNext();
        }}
      />

      {/* Card always on-screen + above overlay so Skip/Next stay usable */}
      <div
        className={cn(
          "absolute z-[10003] rounded-2xl border border-amber-400/45 bg-surface p-4 shadow-xl",
          "ring-1 ring-amber-300/35 backdrop-blur-sm",
        )}
        style={{
          top: tip.top,
          left: tip.left,
          maxWidth: tip.maxWidth,
          width: `min(400px, calc(100vw - 24px))`,
          transform: tip.transform,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-start gap-2">
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-amber-400/25 text-amber-700 dark:text-amber-300">
            <Sparkles className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-medium uppercase tracking-wide text-amber-700/85 dark:text-amber-300/85">
              {tour.progress
                .replace("{n}", String(index + 1))
                .replace("{total}", String(steps.length))}
            </div>
            <h3 className="text-[15px] font-semibold leading-snug text-text">{copy.title}</h3>
          </div>
          <button
            type="button"
            className="btn btn-ghost h-8 w-8 shrink-0 p-0 text-text-3"
            aria-label={tour.skip}
            onClick={() => stop(true)}
          >
            <X className="size-4" />
          </button>
        </div>
        <p className="max-h-[min(42vh,280px)] overflow-y-auto text-[13px] leading-relaxed text-text-2">
          {copy.body}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <button type="button" className="btn btn-ghost h-9 px-3 text-[12.5px]" onClick={() => stop(true)}>
            {tour.skip}
          </button>
          <div className="flex items-center gap-2">
            {index > 0 ? (
              <button type="button" className="btn btn-secondary h-9 px-3 text-[12.5px]" onClick={goBack}>
                {tour.back}
              </button>
            ) : null}
            <button type="button" className="btn btn-primary h-9 px-4 text-[12.5px]" onClick={goNext}>
              {index >= steps.length - 1 ? tour.finish : tour.next}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Topbar / floating control to replay the guided tour. */
export function TourReplayButton({ className }: { className?: string }) {
  const { t } = useT();
  return (
    <button
      type="button"
      data-tour="tour-replay"
      className={cn("btn btn-ghost h-10 w-10 p-0", className)}
      aria-label={t.staffUi.tour.replay}
      title={t.staffUi.tour.replay}
      onClick={() => window.dispatchEvent(new Event("atelier:tour-replay"))}
    >
      <CircleHelp className="size-4 text-amber-600 dark:text-amber-400" />
    </button>
  );
}
