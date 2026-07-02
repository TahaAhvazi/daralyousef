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

type ColumnRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  rx: number;
  index: number;
};

function buildColumns(width: number, height: number): ColumnRect[] {
  if (width <= 0 || height <= 0) return [];

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
    };
  });
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

  const columns = buildColumns(stage.width, stage.height);
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
              const serviceIndex = isRtl
                ? LANDING_COLUMN_SERVICES.length - 1 - column.index
                : column.index;
              const service = LANDING_COLUMN_SERVICES[serviceIndex];
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
