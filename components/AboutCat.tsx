"use client";

import { useEffect, useRef } from "react";
import { asset } from "@/lib/asset";

/**
 * AboutCat — the same ginger-and-white cat from the hero, scrubbed by scroll.
 *
 *   • Not scrolling      -> frozen on the current frame (never autoplays).
 *   • Scroll DOWN        -> cat walks in from the right, yawns, curls up asleep.
 *   • Scroll UP          -> same clip rewinds -> cat wakes, gets up, walks away.
 *
 * The clip is a WIDE SHORT STRIP (1056x528) where the cat is always GROUNDED at
 * the bottom of the frame. It sits BOTTOM-LEFT in the About section's negative
 * space, below the headline/bio/tags, aligned with the text's left margin. A
 * baked CSS drop-shadow grounds it. pointer-events:none so it never blocks UI;
 * scrub progress is measured from the enclosing About <section>.
 *
 * Safari can't decode VP9-with-alpha, so it gracefully shows the transparent
 * poster (curled cat) instead of scrubbing.
 */
export default function AboutCat({
  /** horizontal centre of the cat, % of section width (bottom-left, under the text) */
  leftPct = 18,
  /** cat's BOTTOM edge above the section bottom, % (rests on the floor) */
  bottomPct = 4,
  /** cat strip width, % of section width */
  widthPct = 15,
  /** scrub smoothing — higher = snappier, lower = silkier */
  ease = 0.14,
}: {
  leftPct?: number;
  bottomPct?: number;
  widthPct?: number;
  ease?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    // offsetParent = nearest positioned ancestor (the About <section> with position:relative/isolate).
    // More reliable than closest("section") when wrapper nesting changes.
    const section = (wrapRef.current?.offsetParent || wrapRef.current?.parentElement) as HTMLElement | null;
    if (!video || !section) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let ready = false;
    let target = 0;
    let current = 0;
    let raf: number | null = null;

    const tick = () => {
      current += (target - current) * ease;
      const done = Math.abs(target - current) <= 0.004;
      if (done) current = target;
      try {
        video.currentTime = current;
      } catch {
        /* seeking before metadata — ignore */
      }
      raf = done ? null : requestAnimationFrame(tick);
    };

    const onScroll = () => {
      if (!ready || !video.duration) return;
      const rect = section.getBoundingClientRect();
      // progress 0..1 as the section travels through the viewport
      const total = rect.height + window.innerHeight;
      const seen = window.innerHeight - rect.top;
      const p = Math.min(Math.max(seen / total, 0), 1);
      target = p * video.duration;
      if (reduce) {
        current = target;
        try {
          video.currentTime = current;
        } catch {
          /* ignore */
        }
        return;
      }
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onMeta = () => {
      ready = true;
      video.pause();
      video.currentTime = 0;
      onScroll();
    };

    video.addEventListener("loadedmetadata", onMeta);
    // metadata may already be loaded before this effect ran (fast cache hit) —
    // in that case loadedmetadata never fires again, so initialise now.
    if (video.readyState >= 1) onMeta();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      video.removeEventListener("loadedmetadata", onMeta);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ease]);

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className="absolute"
      style={{
        left: `${leftPct}%`,
        bottom: `${bottomPct}%`,
        width: `${widthPct}%`,
        transform: "translateX(-50%)",
        pointerEvents: "none",
        zIndex: 4,
        lineHeight: 0,
      }}
    >
      <video
        ref={videoRef}
        muted
        playsInline
        preload="auto"
        poster={asset("/video/cat-sleep-poster.png")}
        className="block h-auto w-full"
        style={{ filter: "drop-shadow(0 8px 10px rgba(0,0,0,0.55))" }}
      >
        <source src={asset("/video/cat-sleep.webm")} type="video/webm" />
      </video>
    </div>
  );
}
