"use client";

import { useEffect, useRef } from "react";
import { asset } from "@/lib/asset";

/**
 * AboutCat — transparent VP9+alpha cat overlay for the About section.
 *
 * INTERACTION (state machine):
 *   1. "armed"   — initial. Cat frozen on frame 0 (off-screen). Waiting for the pointer / in-view.
 *   2. "playing" — the FIRST time the pointer enters the section (or it scrolls ~into view), the clip
 *                  auto-advances ONCE to the end: cat walks in from the left, meows, curls up asleep.
 *                  Driven by requestAnimationFrame (NOT native play) so it is perfectly smooth and
 *                  consistent with the scrub phase — no playback-rate pop, no decoder stutter.
 *   3. "scrub"   — after the intro reaches the asleep frame, scroll takes over: scrolling drives
 *                  video.currentTime (scroll up = cat wakes & walks back). Frozen when idle.
 *
 * Assets (public/video/, via asset()):
 *   • cat-sleep.webm        — VP9+alpha, all-keyframe (walk-in → meow → sleep).
 *   • cat-sleep-poster.png  — transparent first-paint poster.
 *
 * Mount inside the About <section> (position:relative). pointer-events:none — never blocks UI.
 */

interface AboutCatProps {
  leftPct?: number;
  bottomPct?: number;
  /** Cat width, % of section width. Scaled down from hero size. */
  widthPct?: number;
  /** Scrub smoothing factor 0..1 (higher = snappier). */
  ease?: number;
  /** Intro duration in seconds (how long the auto walk-in→sleep takes). */
  introSeconds?: number;
}

export default function AboutCat({
  leftPct = 0,
  bottomPct = 4,
  widthPct = 22,
  ease = 0.14,
  introSeconds = 3.2,
}: AboutCatProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const video = videoRef.current;
    if (!wrap || !video) return;

    const section =
      (wrap.offsetParent as HTMLElement | null) ?? wrap.parentElement;
    if (!section) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let ready = false;
    let phase: "armed" | "playing" | "scrub" = "armed";
    let target = 0; // scrub target time
    let current = 0; // smoothed applied time
    let raf: number | null = null;
    let introStart = 0;

    const setTime = (t: number) => {
      try {
        video.currentTime = t;
      } catch {
        /* seeking before metadata — ignore */
      }
    };

    // ---- phase 2: rAF intro (smooth auto walk-in → sleep) ----
    const introTick = (now: number) => {
      if (phase !== "playing") return;
      if (!introStart) introStart = now;
      const dur = video.duration || 10;
      const k = Math.min((now - introStart) / 1000 / introSeconds, 1);
      // easeInOutCubic for a natural settle
      const eased =
        k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      current = eased * dur;
      setTime(current);
      if (k < 1) {
        raf = requestAnimationFrame(introTick);
      } else {
        // hand off to scroll control, seeded at the asleep frame
        phase = "scrub";
        current = target = dur;
        raf = null;
        onScroll();
      }
    };

    const startIntro = () => {
      if (!ready || phase !== "armed") return;
      phase = "playing";
      introStart = 0;
      if (reduce) {
        // reduced-motion: skip the intro, settle straight to asleep then allow scrub
        phase = "scrub";
        current = target = video.duration || 10;
        setTime(current);
        return;
      }
      raf = requestAnimationFrame(introTick);
    };

    // ---- phase 3: scroll-driven scrubbing ----
    const scrubTick = () => {
      current += (target - current) * ease;
      const done = Math.abs(target - current) <= 0.004;
      if (done) current = target;
      setTime(current);
      raf = done ? null : requestAnimationFrame(scrubTick);
    };

    const onScroll = () => {
      if (!ready || phase !== "scrub" || !video.duration) return;
      const rect = section.getBoundingClientRect();
      const total = rect.height + window.innerHeight;
      const seen = window.innerHeight - rect.top;
      const p = Math.min(Math.max(seen / total, 0), 1);
      target = p * video.duration;
      if (reduce) {
        current = target;
        setTime(current);
        return;
      }
      if (raf === null) raf = requestAnimationFrame(scrubTick);
    };

    const onPointerEnter = () => startIntro();

    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting && e.intersectionRatio > 0.35) startIntro();
          }
        },
        { threshold: [0, 0.35, 0.6] }
      );
      io.observe(section);
    }

    const onReady = () => {
      if (video.readyState < 1) return;
      ready = true;
      video.pause();
      setTime(0);
    };

    video.addEventListener("loadedmetadata", onReady);
    if (video.readyState >= 1) onReady();
    section.addEventListener("pointerenter", onPointerEnter);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      video.removeEventListener("loadedmetadata", onReady);
      section.removeEventListener("pointerenter", onPointerEnter);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (io) io.disconnect();
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [ease, introSeconds]);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        // Hug the true page border: cancel the About section's horizontal
        // padding (px-5 / sm:px-8) so the cat sits flush against the left edge.
        left: `calc(${leftPct}% - 2rem)`,
        bottom: `${bottomPct}%`,
        width: `${widthPct}%`,
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
