import type Lenis from "lenis";

// Shared Lenis instance so non-provider components (e.g. Nav) can drive smooth
// scrolling. SmoothScroll registers the instance on mount and clears it on
// unmount; under reduced-motion no instance is created and callers fall back to
// native scrolling.
let instance: Lenis | null = null;

export function setLenis(l: Lenis | null) {
  instance = l;
}

export function getLenis(): Lenis | null {
  return instance;
}

/**
 * Smooth-scroll to a section by id ("top" scrolls to the very top).
 * Uses Lenis when available; otherwise falls back to native scrolling
 * (instant under reduced-motion). `offset` leaves room for the floating nav.
 */
export function scrollToSection(id: string, offset = -96) {
  const lenis = getLenis();
  const target: string | number = id === "top" ? 0 : `#${id}`;

  if (lenis) {
    lenis.scrollTo(target, { offset, duration: 1.1 });
    return;
  }

  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const behavior: ScrollBehavior = reduce ? "auto" : "smooth";

  if (id === "top") {
    window.scrollTo({ top: 0, behavior });
    return;
  }
  const el = document.getElementById(id);
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY + offset;
  window.scrollTo({ top: y, behavior });
}
