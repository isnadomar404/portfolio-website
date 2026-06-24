"use client";

import { useEffect, useRef } from "react";
import { asset } from "@/lib/asset";

/**
 * AboutCat — the same ginger-and-white cat from the hero, curling up asleep at
 * the standing character's feet. A transparent VP9/alpha WebM scrubbed by scroll:
 *
 *   • Not scrolling      -> frozen on the current frame (never autoplays).
 *   • Scroll DOWN        -> cat walks in from the right, yawns, curls up asleep.
 *   • Scroll UP          -> same clip rewinds -> cat wakes, gets up, walks away.
 *
 * Rendered as a pointer-events:none overlay so the figure + copy underneath stay
 * visible and clickable. Positioned within its parent (the character scene); the
 * scrub progress is measured from the enclosing About <section> travelling
 * through the viewport.
 *
 * Safari can't decode VP9-with-alpha, so it gracefully shows the transparent
 * poster (curled cat) instead of scrubbing.
 */
export default function AboutCat({
  /** horizontal centre of the cat, % of parent width */
  xPct = 50,
  /** cat's bottom from the parent bottom, % of parent height */
  bottomPct = 0,
  /** overlay width, % of parent width (the clip has padding around the cat) */
  widthPct = 96,
  /** scrub smoothing — higher = snappier, lower = silkier */
  ease = 0.14,
}: {
  xPct?: number;
  bottomPct?: number;
  widthPct?: number;
  ease?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const section = wrapRef.current?.closest("section");
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
        left: `${xPct}%`,
        bottom: `${bottomPct}%`,
        width: `${widthPct}%`,
        transform: "translateX(-50%)",
        pointerEvents: "none",
        zIndex: 4,
      }}
    >
      <video
        ref={videoRef}
        muted
        playsInline
        preload="auto"
        poster={asset("/video/cat-sleep-poster.png")}
        className="block h-auto w-full"
      >
        <source src={asset("/video/cat-sleep.webm")} type="video/webm" />
      </video>
    </div>
  );
}
