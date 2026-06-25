"use client";

import { useEffect, useRef } from "react";
import { asset } from "@/lib/asset";

/**
 * AboutCat — canvas-composited transparent cat overlay for the About section.
 *
 * Renders via canvas (alpha:true) so VP9+alpha transparency is correctly
 * composited even when the browser's <video> element alpha path has issues.
 * clearRect() before each drawImage() ensures transparent pixels show through.
 *
 * TWO CLIPS (both VP9+alpha, all-keyframe, transparent):
 *   • cat-sleep.webm — walk in from LEFT → settle → rest.   (arrive clip)
 *   • cat-wake.webm  — wake up → stand → walk OUT LEFT.     (leave clip)
 *
 * STATE MACHINE:
 *   1. armed  — frozen at t=0. Waiting for pointer/IntersectionObserver.
 *   2. intro  — rAF-driven auto-play of the SLEEP clip (cat walks in, settles).
 *   3. ready  — scroll takes over:
 *        scroll DOWN → scrub SLEEP clip (cat sleeps deeper)
 *        scroll UP   → switch to WAKE clip, play it forward (cat walks out left)
 *        scroll DOWN again → back to SLEEP
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
  const wrapRef   = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sleepRef  = useRef<HTMLVideoElement | null>(null);
  const wakeRef   = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const wrap   = wrapRef.current;
    const canvas = canvasRef.current;
    const sleep  = sleepRef.current;
    const wake   = wakeRef.current;
    if (!wrap || !canvas || !sleep || !wake) return;

    // Pin-track: use the outer TALL section, not the sticky offsetParent.
    // The sticky child's rect.top stays fixed at 0 while pinned; the outer
    // section's rect.top advances through the runway — that's the progress source.
    const track =
      (wrap.closest("section") as HTMLElement | null) ?? wrap.parentElement;
    if (!track) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasRVFC = "requestVideoFrameCallback" in HTMLVideoElement.prototype;

    let readyS = false;
    let readyW = false;
    let phase: "armed" | "intro" | "ready" = "armed";
    let mode: "sleep" | "wake" = "sleep";
    let lastScroll = window.scrollY;
    let target = 0;
    let current = 0;
    let raf: number | null = null;
    let introStart = 0;
    let vw = 0;
    let vh = 0;

    const activeVideo = () => (mode === "sleep" ? sleep : wake);

    // --- canvas draw ---
    function draw() {
      const cw = canvas!.width;
      const ch = canvas!.height;
      ctx!.clearRect(0, 0, cw, ch);              // clear to transparent each frame
      if (!vw || !ch) return;
      const v = activeVideo();
      const scale = Math.max(cw / vw, ch / vh);
      const dw = vw * scale;
      const dh = vh * scale;
      ctx!.drawImage(v, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width  = Math.round(canvas!.clientWidth  * dpr);
      canvas!.height = Math.round(canvas!.clientHeight * dpr);
      draw();
    }

    function onFrame() {
      draw();
      if (hasRVFC) activeVideo().requestVideoFrameCallback(onFrame);
    }

    function ensureRVFC() {
      if (hasRVFC) activeVideo().requestVideoFrameCallback(onFrame);
    }

    // --- setTime helper ---
    const setT = (v: HTMLVideoElement, t: number) => {
      try { v.currentTime = Math.max(0, Math.min(t, v.duration || t)); } catch { /**/ }
    };

    // --- intro: rAF-driven SLEEP clip playthrough ---
    const introTick = (now: number) => {
      if (phase !== "intro") return;
      if (!introStart) introStart = now;
      const dur = sleep.duration || 8;
      const k = Math.min((now - introStart) / 1000 / introSeconds, 1);
      const eased = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      current = eased * dur;
      setT(sleep, current);
      if (!hasRVFC) draw();
      if (k < 1) {
        raf = requestAnimationFrame(introTick);
      } else {
        phase = "ready";
        current = target = dur;
        raf = null;
      }
    };

    const startIntro = () => {
      if (!readyS || phase !== "armed") return;
      mode = "sleep";
      if (reduce) {
        phase = "ready";
        current = target = sleep.duration || 8;
        setT(sleep, current);
        draw();
        return;
      }
      phase = "intro";
      introStart = 0;
      raf = requestAnimationFrame(introTick);
    };

    // --- scrub tick ---
    const scrubTick = () => {
      const v = activeVideo();
      current += (target - current) * ease;
      const done = Math.abs(target - current) <= 0.004;
      if (done) current = target;
      setT(v, current);
      if (!hasRVFC) draw();
      raf = done ? null : requestAnimationFrame(scrubTick);
    };

    // --- scroll handler ---
    const onScroll = () => {
      if (phase !== "ready") { lastScroll = window.scrollY; return; }

      const goingUp = window.scrollY < lastScroll;
      lastScroll = window.scrollY;

      const rect = track.getBoundingClientRect();
      const scrollable = Math.max(track.offsetHeight - window.innerHeight, 1);
      const p = Math.min(Math.max(-rect.top / scrollable, 0), 1);

      // Direction-aware clip switch
      if (goingUp && mode === "sleep") {
        mode = "wake";
        vw = wake.videoWidth || vw;
        vh = wake.videoHeight || vh;
        current = 0;
        setT(wake, 0);
        ensureRVFC();
      } else if (!goingUp && mode === "wake") {
        mode = "sleep";
        vw = sleep.videoWidth || vw;
        vh = sleep.videoHeight || vh;
        current = sleep.duration || 8;
        setT(sleep, current);
        ensureRVFC();
      }

      const v = activeVideo();
      // SLEEP: p=0 → t=duration (asleep), p=1 → t=0 (off-screen). Reverse-mapped.
      // WAKE:  p=0 → t=0 (asleep), p→small → t→end (exits left). Forward.
      target = mode === "sleep"
        ? (1 - p) * (v.duration || 8)
        : p * (v.duration || 8);

      if (reduce) { current = target; setT(v, current); draw(); return; }
      if (raf === null) raf = requestAnimationFrame(scrubTick);
    };

    // --- video ready handlers ---
    const onReadyS = () => {
      if (sleep.readyState < 1 || readyS) return;
      readyS = true;
      vw = sleep.videoWidth;
      vh = sleep.videoHeight;
      sleep.pause();
      setT(sleep, 0);
      resize();
      ensureRVFC();
    };
    const onReadyW = () => {
      if (wake.readyState < 1 || readyW) return;
      readyW = true;
      wake.pause();
      setT(wake, 0);
    };

    sleep.addEventListener("loadedmetadata", onReadyS);
    wake.addEventListener("loadedmetadata", onReadyW);
    sleep.addEventListener("seeked", () => { if (!hasRVFC) draw(); });
    wake.addEventListener("seeked",  () => { if (!hasRVFC) draw(); });
    if (sleep.readyState >= 1) onReadyS();
    if (wake.readyState  >= 1) onReadyW();

    // Intro triggers
    track.addEventListener("pointerenter", startIntro);
    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        (entries) => { for (const e of entries) if (e.isIntersecting && e.intersectionRatio > 0.3) startIntro(); },
        { threshold: [0, 0.3, 0.45] }
      );
      io.observe(track);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", resize);

    return () => {
      sleep.removeEventListener("loadedmetadata", onReadyS);
      wake.removeEventListener("loadedmetadata", onReadyW);
      track.removeEventListener("pointerenter", startIntro);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resize);
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
        // Cancel the section's px-5 (1.25rem) padding so cat hugs the true page border
        left: `calc(${leftPct}% - 2rem)`,
        bottom: `${bottomPct}%`,
        width: `${widthPct}%`,
        aspectRatio: "1440 / 1320",
        pointerEvents: "none",
        zIndex: 3,
      }}
    >
      {/* Canvas — visible layer, alpha:true composites VP9 transparency correctly */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          filter: "drop-shadow(0 8px 10px rgba(0,0,0,0.55))",
        }}
      />
      {/* Hidden source videos — decoded & seeked per frame, painted onto the
          canvas; never shown directly. Parked offscreen (left:-9999) so a stray
          paint can't leak as a box (CAT-OVERLAY-BUGFIX fix #5). No poster. */}
      <video
        ref={sleepRef}
        muted playsInline preload="auto"
        style={{ position: "absolute", left: -9999, top: 0, width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
      >
        <source src={asset("/video/cat-sleep.webm")} type="video/webm" />
      </video>
      <video
        ref={wakeRef}
        muted playsInline preload="auto"
        style={{ position: "absolute", left: -9999, top: 0, width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
      >
        <source src={asset("/video/cat-wake.webm")} type="video/webm" />
      </video>
    </div>
  );
}
