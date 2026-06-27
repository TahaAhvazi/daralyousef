import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Expand, Hand, Maximize2, Minimize2, Minus, Plus, RotateCcw, Shrink } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const MIN_SCALE = 0.3;
const MAX_SCALE = 1.4;
export const DEFAULT_BOARD_SCALE = 0.6;

export interface BoardCanvasLabels {
  zoomIn: string;
  zoomOut: string;
  resetZoom: string;
  fitView: string;
  zoomPct: string;
  panHint: string;
  enterFullscreen: string;
  exitFullscreen: string;
}

interface BoardCanvasProps {
  children: ReactNode;
  className?: string;
  contentWidth?: number;
  labels: BoardCanvasLabels;
  cardDragging?: boolean;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/** Snap scale to 1% steps — avoids blurry subpixel rasterization */
function snapScale(s: number) {
  return Math.round(clamp(s, MIN_SCALE, MAX_SCALE) * 100) / 100;
}

const BOARD_ZOOM_SUPPORTED =
  typeof CSS !== "undefined" && CSS.supports("zoom", "1");

export function columnAtPoint(x: number, y: number): string | null {
  const els = document.elementsFromPoint(x, y);
  for (const el of els) {
    const zone = el.closest("[data-board-drop]");
    if (zone) return zone.getAttribute("data-board-drop");
  }
  return null;
}

export function BoardCanvas({
  children,
  className,
  contentWidth,
  labels,
  cardDragging = false,
}: BoardCanvasProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(DEFAULT_BOARD_SCALE);
  const [pan, setPan] = useState({ x: 24, y: 16 });
  const [fullscreen, setFullscreen] = useState(false);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [panning, setPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const scaleRef = useRef(scale);
  const panRef = useRef(pan);
  const cardDraggingRef = useRef(cardDragging);
  scaleRef.current = scale;
  panRef.current = pan;
  cardDraggingRef.current = cardDragging;

  const zoomAt = useCallback((clientX: number, clientY: number, nextScale: number) => {
    const vp = viewportRef.current;
    if (!vp) return;
    const rect = vp.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;
    const s = scaleRef.current;
    const p = panRef.current;
    const contentX = (mx - p.x) / s;
    const contentY = (my - p.y) / s;
    const clamped = snapScale(nextScale);
    setScale(clamped);
    setPan({
      x: Math.round(mx - contentX * clamped),
      y: Math.round(my - contentY * clamped),
    });
  }, []);

  const centerAtScale = useCallback(
    (targetScale: number = DEFAULT_BOARD_SCALE) => {
      const vp = viewportRef.current;
      if (!vp) return;
      const rect = vp.getBoundingClientRect();
      const w = (contentWidth ?? 2800) * targetScale;
      const h = 560 * targetScale;
      setScale(targetScale);
      setPan({
        x: Math.max(32, Math.round((rect.width - w) / 2)),
        y: Math.max(24, Math.round((rect.height - h) / 2)),
      });
    },
    [contentWidth],
  );

  const fitToView = useCallback(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const rect = vp.getBoundingClientRect();
    const w = contentWidth ?? 2800;
    const h = 560;
    const pad = 48;
    const fit = snapScale(Math.min((rect.width - pad) / w, (rect.height - pad) / h));
    setScale(fit);
    setPan({ x: Math.round(pad / 2), y: Math.round(pad / 2) });
  }, [contentWidth]);

  useLayoutEffect(() => {
    centerAtScale(DEFAULT_BOARD_SCALE);
  }, [centerAtScale, fullscreen]);

  useEffect(() => {
    if (!fullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [fullscreen]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        const t = e.target as HTMLElement;
        if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable) return;
        e.preventDefault();
        setSpaceHeld(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") setSpaceHeld(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  /** Native wheel listener — passive:false blocks Chrome page zoom on Ctrl+scroll */
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onWheelNative = (e: globalThis.WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (cardDraggingRef.current) return;

      // Shift + scroll = pan; plain scroll = canvas zoom (no Ctrl needed)
      if (e.shiftKey) {
        setPan((p) => ({
          x: Math.round(p.x - e.deltaX - e.deltaY),
          y: Math.round(p.y - e.deltaY),
        }));
        return;
      }

      const delta = -e.deltaY * 0.0015;
      zoomAt(e.clientX, e.clientY, snapScale(scaleRef.current * (1 + delta)));
    };

    el.addEventListener("wheel", onWheelNative, { passive: false });
    return () => el.removeEventListener("wheel", onWheelNative);
  }, [zoomAt, fullscreen]);

  const startPan = (clientX: number, clientY: number) => {
    panStart.current = { x: clientX, y: clientY, panX: panRef.current.x, panY: panRef.current.y };
    setPanning(true);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (cardDragging) return;
    const target = e.target as HTMLElement;
    if (target.closest("[data-board-card], [data-board-controls], a, button, input, select")) return;

    const panMode = spaceHeld || e.button === 1;
    if (!panMode) return;

    e.preventDefault();
    viewportRef.current?.setPointerCapture(e.pointerId);
    startPan(e.clientX, e.clientY);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!panning) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setPan({
      x: Math.round(panStart.current.panX + dx),
      y: Math.round(panStart.current.panY + dy),
    });
  };

  const endPan = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!panning) return;
    setPanning(false);
    try {
      viewportRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const onCanvasDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (cardDragging) return;
    if ((e.target as HTMLElement).closest("[data-board-card], [data-board-controls], button")) return;
    setFullscreen((f) => !f);
  };

  const zoomPct = Math.round(scale * 100);

  const viewport = (
    <div
      ref={viewportRef}
      data-board-viewport
      className={cn(
        "relative min-h-0 overflow-hidden bg-surface-2/50",
        fullscreen ? "h-full w-full rounded-none border-0" : "flex-1 rounded-xl border border-border",
        (spaceHeld || panning) && !cardDragging && "cursor-grab",
        panning && "cursor-grabbing",
        className,
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPan}
      onPointerCancel={endPan}
      onDoubleClick={onCanvasDoubleClick}
      style={{ touchAction: "none", overscrollBehavior: "none" }}
      title={fullscreen ? labels.exitFullscreen : labels.enterFullscreen}
    >
      <div
        data-board-canvas-bg
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(148,163,184,0.35) 1px, transparent 1px)",
          backgroundSize: `${20 * scale}px ${20 * scale}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      />

      <div
        data-board-canvas-content
        className="board-canvas-layer absolute left-0 top-0"
        style={
          BOARD_ZOOM_SUPPORTED
            ? {
                transform: `translate3d(${Math.round(pan.x)}px, ${Math.round(pan.y)}px, 0)`,
                zoom: scale,
              }
            : {
                transform: `translate3d(${Math.round(pan.x)}px, ${Math.round(pan.y)}px, 0) scale(${scale})`,
              }
        }
      >
        {children}
      </div>

      <div
        data-board-controls
        className="absolute bottom-3 right-3 z-20 flex items-center gap-1 rounded-lg border border-border/80 bg-surface/95 p-1 shadow-lg backdrop-blur-sm"
      >
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="!px-2 !h-8"
          title={labels.zoomOut}
          onClick={() => {
            const vp = viewportRef.current;
            if (!vp) return;
            const r = vp.getBoundingClientRect();
            zoomAt(r.left + r.width / 2, r.top + r.height / 2, scaleRef.current / 1.15);
          }}
        >
          <Minus className="size-4" />
        </Button>
        <span className="text-[11px] font-medium text-text-2 tabular-nums min-w-[3rem] text-center">
          {labels.zoomPct.replace("{n}", String(zoomPct))}
        </span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="!px-2 !h-8"
          title={labels.zoomIn}
          onClick={() => {
            const vp = viewportRef.current;
            if (!vp) return;
            const r = vp.getBoundingClientRect();
            zoomAt(r.left + r.width / 2, r.top + r.height / 2, scaleRef.current * 1.15);
          }}
        >
          <Plus className="size-4" />
        </Button>
        <div className="w-px h-5 bg-border mx-0.5" />
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="!px-2 !h-8"
          title={labels.fitView}
          onClick={fitToView}
        >
          <Maximize2 className="size-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="!px-2 !h-8"
          title={labels.resetZoom}
          onClick={() => centerAtScale(DEFAULT_BOARD_SCALE)}
        >
          <RotateCcw className="size-4" />
        </Button>
        <div className="w-px h-5 bg-border mx-0.5" />
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="!px-2 !h-8"
          title={fullscreen ? labels.exitFullscreen : labels.enterFullscreen}
          onClick={() => setFullscreen((f) => !f)}
        >
          {fullscreen ? <Shrink className="size-4" /> : <Expand className="size-4" />}
        </Button>
      </div>

      <p className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 text-[10px] text-text-3/80 pointer-events-none select-none max-w-[70%]">
        <Hand className="size-3 shrink-0" />
        <span>{labels.panHint}</span>
      </p>
    </div>
  );

  if (fullscreen) {
    return createPortal(
      <div className="fixed inset-0 z-[200] flex flex-col bg-bg">
        <div className="flex shrink-0 items-center justify-end gap-2 border-b border-border px-3 py-2 bg-surface/80 backdrop-blur-sm">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            title={labels.exitFullscreen}
            onClick={() => setFullscreen(false)}
          >
            <Minimize2 className="size-4" />
          </Button>
        </div>
        <div className="relative min-h-0 flex-1">{viewport}</div>
      </div>,
      document.body,
    );
  }

  return viewport;
}
