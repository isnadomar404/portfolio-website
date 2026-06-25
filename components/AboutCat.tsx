"use client";

import { useEffect, useRef } from "react";
import { asset } from "@/lib/asset";

/**
 * AboutCat — two-clip transparent cat overlay for the About section.
 *
 * TWO CLIPS (both VP9+alpha, all-keyframe, transparent):
 *   • cat-sleep.webm — cat WALKS IN from the left and settles to rest (the arrive clip).
 *   • cat-wake.webm  — cat WAKES, stands and WALKS OUT to the LEFT (the leave clip).
 *
 * INTERACTION:
 *   1. Pointer enters section (or IntersectionObserver fires) → SLEEP clip auto-plays once
 *      via rAF: cat walks in and settles. Then frozen, asleep.
 *   2. Scroll DOWN → scrub SLEEP clip toward its end (cat stays/settles).
 *      Scroll UP   → switch to WAKE clip and play it forward: cat wakes and walks out LEFT.
 *      Frozen whenever the user is not scrolling.
 *
 * Positioning: leftPct=0 + left:calc(0% - 2rem) to cancel the section's px-5 padding
 * and hug the true page border. The sticky parent's offsetParent won't work here; we
 * use wrap.closest("section") to get the tall pin-track whose rect.top advances during scroll.
 */

interface AboutCatProps {
  leftPct?: number;
  bottomPct?: number;
  widthPct?: number;
  ease?: number;
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
  const sleepRef = useRef<HTMLVideoElement | null>(null);
  const wakeRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const sleep = sleepRef.current;
    const wake = wakeRef.current;
    if (!wrap || !sleep || !wake) return;

    // Use the outer TALL section (pin track), not the sticky offsetParent — the
    // sticky child's rect.top stays fixed at 0 while pinned, so progress would
    // always read 0. The outer section's rect.top advances through the runway.
    const track =
      (wrap.closest("section") as HTMLElement | null) ?? wrap.parentElement;
    if (!track) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let readyS = false;
    let phase: "armed" | "intro" | "ready" = "armed";
    let mode: "sleep" | "wake" = "sleep";
    let lastScroll = window.scrollY;

    let target = 0;
    let current = 0;
    let raf: number | null = null;
    let introStart = 0;

    const show = (which: "sleep" | "wake") => {
      mode = which;
      sleep.style.opacity = which === "sleep" ? "1" : "0";
      wake.style.opacity = which === "wake" ? "1" : "0";
    };
    const setT = (v: HTMLVideoElement, t: number) => {
      try {
        v.currentTime = Math.max(0, Math.min(t, v.duration || t));
      } catch {
        /* ignore */
      }
    };

    // ---- rAF-driven intro: play SLEEP clip in once ----
    const introTick = (now: number) => {
      if (phase !== "intro") return;
      if (!introStart) introStart = now;
      const dur = sleep.duration || 8;
      const k = Math.min((now - introStart) / 1000 / introSeconds, 1);
      const eased = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      current = eased * dur;
      setT(sleep, current);
      if (k < 1) raf = requestAnimationFrame(introTick);
      else {
        phase = "ready";
        current = target = dur;
        raf = null;
      }
    };

    const startIntro = () => {
      if (!readyS || phase !== "armed") return;
      show("sleep");
      if (reduce) {
        phase = "ready";
        current = target = sleep.duration || 8;
        setT(sleep, current);
        return;
      }
      phase = "intro";
      introStart = 0;
      raf = requestAnimationFrame(introTick);
    };

    // ---- scrub loop ----
    const tick = () => {
      const v = mode === "sleep" ? sleep : wake;
      current += (target - current) * ease;
      const done = Math.abs(target - current) <= 0.004;
      if (done) current = target;
      setT(v, current);
      raf = done ? null : requestAnimationFrame(tick);
    };

    const onScroll = () => {
      if (phase !== "ready") {
        lastScroll = window.scrollY;
        return;
      }
      const goingUp = window.scrollY < lastScroll;
      lastScroll = window.scrollY;

      // Pinned scrub progress: 0 = stage just pinned, 1 = runway consumed.
      const rect = track.getBoundingClientRect();
      const scrollable = Math.max(track.offsetHeight - window.innerHeight, 1);
      const p = Math.min(Math.max(-rect.top / scrollable, 0), 1);

      if (goingUp && mode === "sleep") {
        // Switch to WAKE clip: cat genuinely wakes and walks out left
        show("wake");
        current = 0;
        setT(wake, 0);
      } else if (!goingUp && mode === "wake") {
        // Returning: go back to the SLEEP clip
        show("sleep");
        current = sleep.duration || 8;
        setT(sleep, current);
      }

      const active = mode === "sleep" ? sleep : wake;
      if (mode === "wake") {
        // Scroll UP increases p→decreases p... reverse: cat exits as user scrolls up
        target = p * (active.duration || 8);
      } else {
        // SLEEP clip: p=0 → t=duration (asleep), p=1 → t=0 (off-screen)
        target = (1 - p) * (active.duration || 8);
      }

      if (reduce) {
        current = target;
        setT(active, current);
        return;
      }
      if (raf === null) raf = requestAnimationFrame(tick);
    };

    const onReadyS = () => {
      if (sleep.readyState < 1) return;
      readyS = true;
      sleep.pause();
      setT(sleep, 0);
    };
    const onReadyW = () => {
      if (wake.readyState < 1) return;
      wake.pause();
      setT(wake, 0);
    };

    sleep.addEventListener("loadedmetadata", onReadyS);
    wake.addEventListener("loadedmetadata", onReadyW);
    if (sleep.readyState >= 1) onReadyS();
    if (wake.readyState >= 1) onReadyW();

    // Pointer enter fires the walk-in intro
    track.addEventListener("pointerenter", startIntro);

    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      // Track is ~2.2 viewports tall → max intersection ratio ~0.45 in a 100svh viewport
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting && e.intersectionRatio > 0.3) startIntro();
          }
        },
        { threshold: [0, 0.3, 0.45] }
      );
      io.observe(track);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      sleep.removeEventListener("loadedmetadata", onReadyS);
      wake.removeEventListener("loadedmetadata", onReadyW);
      track.removeEventListener("pointerenter", startIntro);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (io) io.disconnect();
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [ease, introSeconds]);

  const videoStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "auto",
    display: "block",
    filter: "drop-shadow(0 8px 10px rgba(0,0,0,0.55))",
  };

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        // Hug the true page border: cancel the About section's horizontal
        // padding (px-5 = 1.25rem) so the cat sits flush against the left edge.
        left: `calc(${leftPct}% - 2rem)`,
        bottom: `${bottomPct}%`,
        width: `${widthPct}%`,
        pointerEvents: "none",
        zIndex: 3,
        lineHeight: 0,
      }}
    >
      {/* SLEEP clip — walk in & rest (default visible) */}
      <video
        ref={sleepRef}
        muted
        playsInline
        preload="auto"
        poster={asset("/video/cat-sleep-poster.png")}
        style={{ ...videoStyle, position: "relative", opacity: 1 }}
      >
        <source src={asset("/video/cat-sleep.webm")} type="video/webm" />
      </video>
      {/* WAKE clip — wake & walk out left (shown on scroll-up) */}
      <video
        ref={wakeRef}
        muted
        playsInline
        preload="auto"
        style={{ ...videoStyle, opacity: 0, transition: "opacity .12s linear" }}
      >
        <source src={asset("/video/cat-wake.webm")} type="video/webm" />
      </video>
    </div>
  );
}
