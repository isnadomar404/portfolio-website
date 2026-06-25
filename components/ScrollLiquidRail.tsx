"use client";

import { useState } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValueEvent,
  useReducedMotion,
} from "framer-motion";

/**
 * ScrollLiquidRail — a slim vertical loader pill pinned to the right edge that
 * fills with cobalt "liquid" across the WHOLE page scroll: 0% (empty) at the
 * very top, 100% (full, liquid touching the top of the track) at the absolute
 * bottom. Scrolling back up drains it smoothly back to empty. It replaces the
 * old hero nav dots; section navigation already lives in the floating top Nav,
 * so this reads as a pure scroll-progress meter (role="progressbar").
 *
 * Driven by Framer Motion `useScroll()` (whole-document scrollYProgress, full
 * scrollable range). The visible fill follows a `useSpring` for buttery,
 * slightly-overshooting motion as it rises and drains; `aria-valuenow` follows
 * the RAW progress so it reports an exact 0 at the top and 100 at the bottom.
 *
 * It is `position: fixed` so it stays put through every section (the old dots
 * lived inside the sticky hero and scrolled away after ~22%, which is why the
 * meter appeared to under-fill).
 *
 * Liquid surface: two SVG waves drift horizontally at different speeds; their
 * interference reads as a sloshing meniscus, with a bright crest highlight and
 * a soft cobalt glow. Under `prefers-reduced-motion` the spring and the wave
 * drift are both disabled — the fill snaps to the exact scroll level with a
 * still surface.
 */
const TRACK_H = 180;
const SURFACE_H = 14; // wave band height (px)

// viewBox 0 0 200 14 — 4 wave periods (period 50). Rendered at 200% width and
// drifted translateX(-50%) so each loop advances exactly two periods and tiles
// seamlessly. Baseline y=7, amplitude ~5. Path fills below the curve.
const WAVE_PATH =
  "M0 7 Q12.5 2 25 7 T50 7 T75 7 T100 7 T125 7 T150 7 T175 7 T200 7 L200 14 L0 14 Z";

export default function ScrollLiquidRail() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();

  const smooth = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 16,
    mass: 0.5,
    restDelta: 0.0002,
  });
  const source = reduce ? scrollYProgress : smooth;

  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  const fillHeight = useTransform(source, (v) => `${clamp(v) * 100}%`);
  // Fade the whole liquid out over the first sliver of scroll so the rail is
  // genuinely EMPTY at the very top (and drains back to empty on reverse).
  const liquidOpacity = useTransform(scrollYProgress, [0, 0.01], [0, 1]);

  const [pct, setPct] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const next = Math.round(clamp(v) * 100);
    setPct((prev) => (prev === next ? prev : next));
  });

  return (
    <div
      role="progressbar"
      aria-label="Page scroll progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className="fixed right-7 top-1/2 hidden -translate-y-1/2 lg:block"
      style={{ zIndex: 30 }}
    >
      <style>{`
        @keyframes lrWaveDrift { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .lr-wave { animation: lrWaveDrift linear infinite; will-change: transform; }
        .lr-wave-a { animation-duration: 3.4s; }
        .lr-wave-b { animation-duration: 5.6s; animation-direction: reverse; opacity: 0.55; }
        @media (prefers-reduced-motion: reduce) { .lr-wave { animation: none !important; } }
      `}</style>

      {/* Track — translucent glassy pill, clips the liquid at both ends */}
      <div
        className="relative overflow-hidden rounded-full"
        style={{
          width: 10,
          height: TRACK_H,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))",
          boxShadow:
            "inset 0 0 0 1px rgba(255,255,255,0.09), inset 0 1px 6px rgba(0,0,0,0.55)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
        }}
      >
        {/* Liquid fill — bottom-anchored, height = scroll progress */}
        <motion.div
          aria-hidden
          className="absolute inset-x-0 bottom-0"
          style={{ height: fillHeight, opacity: liquidOpacity }}
        >
          {/* Solid body of the liquid */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, var(--accent-bright), var(--accent) 55%, #2f6bd6)",
              boxShadow:
                "0 0 12px 1px var(--accent-glow), 0 0 24px 2px rgba(76,141,255,0.4)",
            }}
          />

          {/* Wavy meniscus — straddles the liquid top so crests rise above the
              surface. Two drifting waves give a sloshing interference. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0"
            style={{
              top: -(SURFACE_H / 2),
              height: SURFACE_H,
              filter: "drop-shadow(0 0 4px var(--accent-glow))",
            }}
          >
            <svg
              className={reduce ? undefined : "lr-wave lr-wave-a"}
              viewBox="0 0 200 14"
              preserveAspectRatio="none"
              style={{ position: "absolute", inset: 0, width: "200%", height: "100%" }}
            >
              <path d={WAVE_PATH} fill="var(--accent)" />
            </svg>
            <svg
              className={reduce ? undefined : "lr-wave lr-wave-b"}
              viewBox="0 0 200 14"
              preserveAspectRatio="none"
              style={{ position: "absolute", inset: 0, width: "200%", height: "100%" }}
            >
              <path d={WAVE_PATH} fill="var(--accent-bright)" />
            </svg>
            {/* Bright crest highlight riding the surface */}
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: SURFACE_H / 2 - 1,
                height: 2,
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)",
                filter: "blur(0.5px)",
                opacity: 0.75,
              }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
