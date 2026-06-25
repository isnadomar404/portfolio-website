"use client";

import { useEffect, useRef } from "react";
import { asset } from "@/lib/asset";

/**
 * AboutCat — transparent VP9+alpha cat overlay, scrubbed by the About section's scroll.
 *
 * Behaviour:
 *   • Not scrolling -> cat is FROZEN on its current frame (no autoplay, no loop).
 *   • Scroll DOWN   -> timeline advances: cat walks in from OFF-SCREEN left, yawns, curls asleep.
 *   • Scroll UP     -> timeline rewinds: cat wakes and walks back off-screen left.
 *
 * Assets (in public/video/, resolved through asset()):
 *   • cat-sleep.webm        — VP9+alpha, all-keyframe, hero-scale, off-screen entrance (v4).
 *   • cat-sleep-poster.png  — tight transparent crop, first paint.
 *
 * Placement is bottom-left, in the About left-column negative space, below the copy/tags.
 * Mount inside the About <section> (which must be position:relative).
 */

interface AboutCatProps {
  /** Horizontal centre of the cat, % of the section width. */
  leftPct?: number;
  /** Cat's bottom edge above the section bottom, %. */
  bottomPct?: number;
  /** Cat width, % of section width. Default is hero-scale. */
  widthPct?: number;
  /** Scrub smoothing factor 0..1 (higher = snappier). */
  ease?: number;
}

export default function AboutCat({
  leftPct = 18,
  bottomPct = 4,
  widthPct = 26,
  ease = 0.14,
}: AboutCatProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const video = videoRef.current;
    if (!wrap || !video) return;

    // Measure scroll against the nearest positioned ancestor (the About <section>).
    const section =
      (wrap.offsetParent as HTMLElement | null) ?? wrap.parentElement;
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
      if (!ready || !video.duration || !section) return;
      const rect = section.getBoundingClientRect();
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
      if (raf === null) raf = requestAnimationFrame(tick);
    };

    const onReady = () => {
      // Handle both cold and cached loads (readyState >= 1 == HAVE_METADATA).
      if (video.readyState < 1) return;
      ready = true;
      video.pause();
      video.currentTime = 0;
      onScroll();
    };

    video.addEventListener("loadedmetadata", onReady);
    if (video.readyState >= 1) onReady();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      video.removeEventListener("loadedmetadata", onReady);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [ease]);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        left: `${leftPct}%`,
        bottom: `${bottomPct}%`,
        width: `${widthPct}%`,
        transform: "translateX(-50%)",
        pointerEvents: "none",
        zIndex: 3,
        lineHeight: 0,
      }}
    >
      <video
        ref={videoRef}
        muted
        playsInline
        preload="auto"
        poster={asset("/video/cat-sleep-poster.png")}
        style={{
          width: "100%",
          height: "auto",
          display: "block",
          filter: "drop-shadow(0 8px 10px rgba(0,0,0,0.55))",
        }}
      >
        <source src={asset("/video/cat-sleep.webm")} type="video/webm" />
      </video>
    </div>
  );
}
