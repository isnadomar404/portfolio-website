"use client";

// useDepthParallax — code-native depth-plane parallax (Path B).
// From "Sections After Hero — Design + Parallax Spec" §2. Transform-only, no WebGL.
// Pointer drives desktop; scroll drives everywhere (half strength on touch);
// prefers-reduced-motion renders everything static.

import { useEffect, useRef } from "react";
import { useMotionValue, useAnimationFrame, type MotionStyle } from "framer-motion";

// shared pointer: one window listener, normalized -1..1 from screen centre.
const pointer = { tx: 0, ty: 0 };
let pointerReady = false;
function initPointer() {
  if (pointerReady || typeof window === "undefined") return;
  pointerReady = true;
  window.addEventListener(
    "pointermove",
    (e) => {
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
    },
    { passive: true },
  );
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
  const off = useRef({ motion: false, coarse: false });

  useEffect(() => {
    initPointer();
    if (typeof window === "undefined") return;
    off.current.motion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    off.current.coarse = window.matchMedia("(pointer: coarse)").matches;
  }, []);

  useAnimationFrame(() => {
    if (off.current.motion) return;

    const dir = invert ? -1 : 1;
    if (!off.current.coarse && shift) {
      cur.current.x += (pointer.tx - cur.current.x) * lerp;
      cur.current.y += (pointer.ty - cur.current.y) * lerp;
    } else {
      cur.current.x = 0;
      cur.current.y = 0;
    }
    const px = cur.current.x * shift * dir;
    const py = cur.current.y * shift * dir;

    let sy = 0;
    if (scrollRate && ref.current) {
      const r = ref.current.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const centre = r.top + r.height / 2;
      const prog = clamp((vh / 2 - centre) / (vh / 2 + r.height / 2), -1, 1);
      sy = prog * scrollRate * (off.current.coarse ? 0.5 : 1);
    }

    x.set(px);
    y.set(py + sy);
    if (tilt && !off.current.coarse) {
      rotateY.set(cur.current.x * tilt);
      rotateX.set(-cur.current.y * tilt);
    }
  });

  const style: MotionStyle = { x, y, rotateX, rotateY, transformPerspective: 900 };
  return { ref, style };
}
