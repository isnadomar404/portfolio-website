"use client";

import { useEffect, useRef } from "react";

/**
 * useHoverGlow — cursor-following cobalt radial glow inside a card on hover.
 *
 * Updates CSS variables on the element:
 *   --gx  / --gy   pointer position relative to the card (px)
 *   --go           glow opacity (0 idle, 1 hovered)
 *
 * These are consumed by the `.case-card::before` rule in globals.css.
 * No-op under prefers-reduced-motion or coarse pointer (touch).
 */
export function useHoverGlow<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (reduce || coarse) return;

    const onEnter = () => el.style.setProperty("--go", "1");
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--gx", `${e.clientX - r.left}px`);
      el.style.setProperty("--gy", `${e.clientY - r.top}px`);
    };
    const onLeave = () => el.style.setProperty("--go", "0");

    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return ref;
}
