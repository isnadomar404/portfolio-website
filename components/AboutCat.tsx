"use client";

import { useEffect, useRef } from "react";
import { asset } from "@/lib/asset";

/**
 * AboutCat — two-clip transparent cat overlay for the About section.
 *
 * SAFARI FIX: `.mov` (HEVC-alpha) sources are listed FIRST so Safari picks the
 * format it actually supports. Until the .mov files are produced, Safari falls
 * back to the transparent `cat-sleep-poster.png` (the keyed cat), never a dark box.
 * Chrome / Firefox use the `.webm` (VP9+alpha) sources and always had transparency.
 *
 * Additional hardening:
 *   (1) wrapper overflow:hidden — no video frame bleeds outside the box
 *   (2) seek-then-reveal — clip is only made visible AFTER its frame is decoded
 *   (3) inactive clip is visibility:hidden (not just opacity:0) — no 1-frame leak
 *   (4) background:transparent on each <video> — no opaque fill if alpha path fails
 *
 * STATE MACHINE:
 *   armed  → intro (cat walks in via rAF) → ready (scroll scrubs sleep/wake clips)
 *   scroll UP while sleeping  → switch to wake clip, play forward (cat walks out)
 *   scroll DOWN while waking  → switch back to sleep, resume scrub
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
  const wrapRef  = useRef<HTMLDivElement | null>(null);
  const sleepRef = useRef<HTMLVideoElement | null>(null);
  const wakeRef  = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const wrap  = wrapRef.current;
    const sleep = sleepRef.current;
    const wake  = wakeRef.current;
    if (!wrap || !sleep || !wake) return;

    // Use the outer TALL section for scroll progress — NOT offsetParent which
    // returns the sticky child (rect.top stays 0 while pinned → progress = 0).
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

    const setT = (v: HTMLVideoElement, t: number) => {
      try { v.currentTime = Math.max(0, Math.min(t, v.duration || t)); } catch { /**/ }
    };

    // (2)+(3) seek-then-reveal: only make a clip visible once its frame is decoded.
    const reveal = (v: HTMLVideoElement) => {
      v.style.visibility = "visible";
      v.style.opacity = "1";
    };
    const hide = (v: HTMLVideoElement) => {
      v.style.opacity = "0";
      v.style.visibility = "hidden";
    };
    const showSeeked = (v: HTMLVideoElement, t: number) => {
      const onSeeked = () => { reveal(v); v.removeEventListener("seeked", onSeeked); };
      v.addEventListener("seeked", onSeeked);
      setT(v, t);
      // safety: reveal next tick if seeked never fires (cached exact frame)
      requestAnimationFrame(() => { if (v.style.visibility !== "visible") reveal(v); });
    };

    const activeVideo = () => (mode === "sleep" ? sleep : wake);

    // intro: rAF-driven playthrough of the SLEEP clip (cat walks in and settles)
    const introTick = (now: number) => {
      if (phase !== "intro") return;
      if (!introStart) introStart = now;
      const dur = sleep.duration || 8;
      const k = Math.min((now - introStart) / 1000 / introSeconds, 1);
      const eased = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      current = eased * dur;
      setT(sleep, current);
      if (k < 1) { raf = requestAnimationFrame(introTick); }
      else { phase = "ready"; current = target = dur; raf = null; }
    };

    const startIntro = () => {
      if (!readyS || phase !== "armed") return;
      mode = "sleep";
      reveal(sleep);
      hide(wake);
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

    const scrubTick = () => {
      const v = activeVideo();
      current += (target - current) * ease;
      const done = Math.abs(target - current) <= 0.004;
      if (done) current = target;
      setT(v, current);
      raf = done ? null : requestAnimationFrame(scrubTick);
    };

    const onScroll = () => {
      if (phase !== "ready") { lastScroll = window.scrollY; return; }
      const goingUp = window.scrollY < lastScroll;
      lastScroll = window.scrollY;

      const rect = track.getBoundingClientRect();
      const scrollable = Math.max(track.offsetHeight - window.innerHeight, 1);
      const p = Math.min(Math.max(-rect.top / scrollable, 0), 1);

      // Direction-aware clip switch — only at direction change, never mid-scrub
      if (goingUp && mode === "sleep") {
        mode = "wake";
        current = 0;
        hide(sleep);
        showSeeked(wake, 0);
      } else if (!goingUp && mode === "wake") {
        mode = "sleep";
        current = sleep.duration || 8;
        hide(wake);
        showSeeked(sleep, current);
      }

      const v = activeVideo();
      // SLEEP: p=0 → t=duration (asleep), p=1 → t=0 (off-screen). Reverse-mapped.
      // WAKE:  p=0 → t=0 (asleep), p→1 → t→end (exits left). Forward.
      target = mode === "sleep"
        ? (1 - p) * (v.duration || 8)
        : p * (v.duration || 8);

      if (reduce) { current = target; setT(v, current); return; }
      if (raf === null) raf = requestAnimationFrame(scrubTick);
    };

    const onReadyS = () => {
      if (sleep.readyState < 1 || readyS) return;
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

    track.addEventListener("pointerenter", startIntro);
    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries)
            if (e.isIntersecting && e.intersectionRatio > 0.35) startIntro();
        },
        { threshold: [0, 0.35, 0.6] }
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

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        // -2rem cancels the section's left padding so the cat hugs the true page edge
        left: `calc(${leftPct}% - 2rem)`,
        bottom: `${bottomPct}%`,
        width: `${widthPct}%`,
        overflow: "hidden",     // (1) clip — no sharp video bleed
        pointerEvents: "none",  // never blocks bio text or links underneath
        zIndex: 3,
        lineHeight: 0,
      }}
    >
      {/* SLEEP — visible by default.
          poster = transparent cat PNG so Safari shows the cat (not a dark box)
          until the HEVC-alpha .mov is available.
          .mov listed first so Safari picks HEVC-alpha when available. */}
      <video
        ref={sleepRef}
        muted
        playsInline
        preload="auto"
        poster={asset("/video/cat-sleep-poster.png")}
        style={{
          width: "100%",
          height: "auto",
          display: "block",
          opacity: 1,
          visibility: "visible",
          background: "transparent",
          transition: "opacity .12s linear",
          filter: "drop-shadow(0 8px 10px rgba(0,0,0,0.55))",
        }}
      >
        <source src={asset("/video/cat-sleep.mov")}  type='video/quicktime; codecs="hvc1"' />
        <source src={asset("/video/cat-sleep.webm")} type="video/webm" />
      </video>

      {/* WAKE — NO poster (never shown before seek); hidden until seek-then-reveal. */}
      <video
        ref={wakeRef}
        muted
        playsInline
        preload="auto"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "auto",
          display: "block",
          opacity: 0,
          visibility: "hidden",
          background: "transparent",
          transition: "opacity .12s linear",
          filter: "drop-shadow(0 8px 10px rgba(0,0,0,0.55))",
        }}
      >
        <source src={asset("/video/cat-wake.mov")}  type='video/quicktime; codecs="hvc1"' />
        <source src={asset("/video/cat-wake.webm")} type="video/webm" />
      </video>
    </div>
  );
}
