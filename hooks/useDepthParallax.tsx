"use client";

// useDepthParallax — code-native depth-plane parallax (Path B).
// From "Sections After Hero — Design + Parallax Spec" §2. Transform-only, no WebGL.
// Pointer drives desktop; scroll drives everywhere (half strength on touch);
// prefers-reduced-motion renders everything static.
//
// Performance notes (the part that keeps scrolling glitch-free):
//   • One shared window pointer/scroll/resize listener set — not one per layer.
//   • Per-frame work is gated by an IntersectionObserver, so off-screen layers
//     cost nothing.
//   • getBoundingClientRect() (a forced reflow) runs ONLY when the scroll
//     position actually changed — never every frame, never when idle.
//   • innerHeight is cached and refreshed on resize instead of read each frame.
//   • Motion values are written only when they actually move, so a settled
//     layer stops churning the render pipeline.
//   • Layers are GPU-promoted (will-change: transform) so they composite
//     instead of repainting on the main layer.

import { useEffect, useRef } from "react";
import { useMotionValue, useAnimationFrame, type MotionStyle } from "framer-motion";

// shared environment: one set of window listeners for every layer.
const pointer = { tx: 0, ty: 0 };
let pointerMoved = false; // stays false until the user actually moves — lets idle layers skip pointer math
let envReady = false;
let viewH = typeof window !== "undefined" ? window.innerHeight : 1;
let scrollY = typeof window !== "undefined" ? window.scrollY : 0;

function initEnv() {
  if (envReady || typeof window === "undefined") return;
  envReady = true;
  viewH = window.innerHeight;
  scrollY = window.scrollY;
  window.addEventListener(
    "pointermove",
    (e) => {
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
      pointerMoved = true;
    },
    { passive: true },
  );
  window.addEventListener("scroll", () => { scrollY = window.scrollY; }, { passive: true });
  window.addEventListener("resize", () => { viewH = window.innerHeight; }, { passive: true });
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export type PlaneOpts = {
  shift?: number; // max pointer translate px at full deflection
  scrollRate?: number; // max scroll translate px across the viewport pass
  tilt?: number; // max rotateX/Y deg (front plane only)
  lerp?: number; // trail smoothing 0..1
  /** invert pointer direction (panels drift AGAINST the cursor) */
  invert?: boolean;
};

export function useDepthParallax({
  shift = 0,
  scrollRate = 0,
  tilt = 0,
  lerp = 0.1,
  invert = false,
}: PlaneOpts) {
  const ref = useRef<HTMLDivElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const cur = useRef({ x: 0, y: 0 });
  const env = useRef({ motion: false, coarse: false, visible: true });
  const sy = useRef(0);
  const lastScroll = useRef(Number.NaN);
  const last = useRef({ x: 0, y: 0 });

  useEffect(() => {
    initEnv();
    if (typeof window === "undefined") return;
    env.current.motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    env.current.coarse = window.matchMedia("(pointer: coarse)").matches;

    // Gate per-frame work to when the layer is on/near the viewport.
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => { env.current.visible = entry.isIntersecting; },
      { rootMargin: "15% 0px 15% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useAnimationFrame(() => {
    const e = env.current;
    if (e.motion || !e.visible) return;

    const dir = invert ? -1 : 1;

    // pointer drift — desktop only, and only once the cursor has actually moved
    let px = 0;
    let py = 0;
    if (shift && !e.coarse && pointerMoved) {
      cur.current.x += (pointer.tx - cur.current.x) * lerp;
      cur.current.y += (pointer.ty - cur.current.y) * lerp;
      px = cur.current.x * shift * dir;
      py = cur.current.y * shift * dir;
    }

    // scroll drift — recompute layout ONLY when the scroll position changed.
    if (scrollRate && ref.current) {
      if (scrollY !== lastScroll.current) {
        const r = ref.current.getBoundingClientRect();
        const centre = r.top + r.height / 2;
        const prog = clamp((viewH / 2 - centre) / (viewH / 2 + r.height / 2), -1, 1);
        sy.current = prog * scrollRate * (e.coarse ? 0.5 : 1);
        lastScroll.current = scrollY;
      }
    } else {
      sy.current = 0;
    }

    const ny = py + sy.current;

    // Skip writes when nothing moved — a settled layer stops churning renders.
    if (Math.abs(px - last.current.x) < 0.01 && Math.abs(ny - last.current.y) < 0.01) {
      return;
    }
    last.current.x = px;
    last.current.y = ny;

    x.set(px);
    y.set(ny);
    if (tilt && !e.coarse) {
      rotateY.set(cur.current.x * tilt);
      rotateX.set(-cur.current.y * tilt);
    }
  });

  const style: MotionStyle = {
    x,
    y,
    rotateX,
    rotateY,
    transformPerspective: 900,
    willChange: "transform",
    backfaceVisibility: "hidden",
  };
  return { ref, style };
}
