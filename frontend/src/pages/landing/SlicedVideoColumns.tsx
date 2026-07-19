import { useId, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import heroVideo from "@/assets/mixkit-busy-office-space-918-hd-ready.mp4";
import { ServiceCategoryDialog } from "@/pages/landing/ServiceCategoryDialog";
import {
  LANDING_COLUMN_SERVICES,
  type ServiceCategory,
} from "@/pages/landing/serviceCategories";
import { useT } from "@/i18n/useT";

/** Symmetrical column heights — outer tallest, inner shortest (matches mockup). */
const COLUMN_HEIGHTS = [1, 0.76, 0.5, 0.5, 0.76, 1] as const;
const COLUMN_GAP_RATIO = 0.012;

/** Below this stage width the 6 thin columns collapse into a 3x2 staggered grid. */
const MOBILE_STAGE_WIDTH = 640;

type ColumnRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  rx: number;
  index: number;
  /** Which service this tile maps to (already RTL-aware). */
  serviceIndex: number;
};

function buildDesktopColumns(width: number, height: number, isRtl: boolean): ColumnRect[] {
  const gap = Math.max(4, width * COLUMN_GAP_RATIO);
  const colWidth = (width - gap * (COLUMN_HEIGHTS.length - 1)) / COLUMN_HEIGHTS.length;

  return COLUMN_HEIGHTS.map((heightRatio, index) => {
    const colHeight = height * heightRatio;
    const rx = colWidth * 0.22;

    return {
      x: index * (colWidth + gap),
      y: height - colHeight,
      width: colWidth,
      height: colHeight,
      rx,
      index,
      serviceIndex: isRtl ? COLUMN_HEIGHTS.length - 1 - index : index,
    };
  });
}

/**
 * Mobile: 3 columns x 2 rows of video tiles. All columns are bottom-aligned
 * and the middle column starts lower, keeping the signature "dip" in the
 * middle where the logo sits — same idea, just readable on small screens.
 */
function buildMobileGrid(width: number, height: number, isRtl: boolean): ColumnRect[] {
  const cols = 3;
  const rows = 2;
  const gap = Math.max(6, width * 0.025);
  const pad = gap;
  const innerWidth = width - pad * 2;
  const colWidth = (innerWidth - gap * (cols - 1)) / cols;
  const dip = height * 0.1;
  const columnOffsets = [0, dip, 0];

  const rects: ColumnRect[] = [];
  for (let col = 0; col < cols; col += 1) {
    const offset = columnOffsets[col];
    const tileHeight = (height - offset - gap * (rows - 1)) / rows;
    const rx = Math.min(colWidth, tileHeight) * 0.16;

    for (let row = 0; row < rows; row += 1) {
      const index = row * cols + col;
      rects.push({
        x: pad + col * (colWidth + gap),
        y: offset + row * (tileHeight + gap),
        width: colWidth,
        height: tileHeight,
        rx,
        index,
        serviceIndex: row * cols + (isRtl ? cols - 1 - col : col),
      });
    }
  }
  return rects;
}

function buildColumns(width: number, height: number, isRtl: boolean): ColumnRect[] {
  if (width <= 0 || height <= 0) return [];
  if (width < MOBILE_STAGE_WIDTH) return buildMobileGrid(width, height, isRtl);
  return buildDesktopColumns(width, height, isRtl);
}

export function SlicedVideoColumns() {
  const stageRef = useRef<HTMLDivElement>(null);
  const maskId = useId().replace(/:/g, "");
  const reduceMotion = useReducedMotion();
  const { isRtl } = useT();
  const [stage, setStage] = useState({ width: 0, height: 0 });
  const [activeCategory, setActiveCategory] = useState<ServiceCategory | null>(null);

  useLayoutEffect(() => {
    const node = stageRef.current;
    if (!node) return;

    const measure = () => {
      const { width, height } = node.getBoundingClientRect();
      setStage({
        width: Math.round(width),
        height: Math.round(height),
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const columns = buildColumns(stage.width, stage.height, isRtl);
  const ready = columns.length > 0;

  return (
    <>
      <div ref={stageRef} className="landing-dar-columns" aria-hidden={!ready}>
        {ready ? (
          <>
            <svg
              className="landing-dar-mask-svg"
              width={stage.width}
              height={stage.height}
              viewBox={`0 0 ${stage.width} ${stage.height}`}
              aria-hidden
            >
              <defs>
                <mask
                  id={maskId}
                  maskUnits="userSpaceOnUse"
                  x="0"
                  y="0"
                  width={stage.width}
                  height={stage.height}
                >
                  {columns.map((column) => (
                    <rect
                      key={column.index}
                      x={column.x}
                      y={column.y}
                      width={column.width}
                      height={column.height}
                      rx={column.rx}
                      ry={column.rx}
                      fill="white"
                    />
                  ))}
                </mask>
              </defs>
            </svg>

            <motion.video
              initial={reduceMotion ? false : { opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className="landing-dar-video"
              style={{
                width: stage.width,
                height: stage.height,
                WebkitMaskImage: `url(#${maskId})`,
                maskImage: `url(#${maskId})`,
              }}
              src={heroVideo}
            />

            {columns.map((column) => {
              const service = LANDING_COLUMN_SERVICES[column.serviceIndex];
              const title = isRtl ? service.titleAr : service.titleEn;

              return (
                <motion.button
                  key={column.index}
                  type="button"
                  onClick={() => setActiveCategory(service)}
                  aria-label={title}
                  initial={reduceMotion ? false : { opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={
                    reduceMotion
                      ? undefined
                      : { scale: 1.028, y: -5, transition: { type: "spring", stiffness: 420, damping: 26 } }
                  }
                  whileTap={
                    reduceMotion
                      ? undefined
                      : { scale: 1.014, transition: { type: "spring", stiffness: 500, damping: 30 } }
                  }
                  transition={{
                    duration: 0.65,
                    delay: 0.06 * column.index,
                    ease: [0.2, 0.7, 0.2, 1],
                  }}
                  style={{
                    left: column.x,
                    top: column.y,
                    width: column.width,
                    height: column.height,
                    borderRadius: column.rx,
                    transformOrigin: "center bottom",
                  }}
                  className={`landing-dar-column-slot landing-dar-column-link landing-dar-shine ${isRtl ? "font-arabic" : ""}`}
                >
                  <span className="landing-dar-column-caption">
                    <span className="landing-dar-column-title">{title}</span>
                  </span>
                </motion.button>
              );
            })}
          </>
        ) : null}
      </div>

      <ServiceCategoryDialog
        category={activeCategory}
        onClose={() => setActiveCategory(null)}
      />
    </>
  );
}
