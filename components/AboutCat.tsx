"use client";

import { useEffect, useRef } from "react";
import { asset } from "@/lib/asset";

/**
 * AboutCat — canvas-composited transparent cat overlay for the About section.
 *
 * WHY CANVAS: a visible <video> element paints its decoded frame (or poster)
 * directly, so any alpha hiccup or unseeked frame shows up as an opaque "box".
 * Drawing to a canvas with { alpha:true } + clearRect() every frame guarantees
 * true per-frame transparency and means no element can ever leak a box.
 *
 * CROSS-BROWSER ALPHA: the hidden feeder <video>s carry BOTH sources —
 *   • cat-*.mov  (HEVC + alpha)  → Safari / iOS  (no VP9-alpha support)
 *   • cat-*.webm (VP9 + alpha)   → Chrome / Firefox
 * The browser decodes whichever it supports; drawImage() preserves that alpha.
 *
 * SMOOTH SCRUB (no jank): scroll sets a `target` time only. A single seek loop
 * COALESCES seeks — it never issues a new seek while one is pending; when the
 * pending seek finishes it jumps straight to the newest target. This avoids the
 * seek-queue thrash that makes per-scroll-event currentTime writes stutter.
 * Painting is driven by requestVideoFrameCallback, decoupled from seek timing.
 *
 * CLIPS (both all-keyframe, transparent):
 *   • cat-sleep.webm/.mov — walk in from left → settle.  (scroll DOWN scrubs in)
 *   • cat-wake.webm/.mov  — wake → walk OUT left.         (scroll UP plays out)
 */

interface AboutCatProps {
  leftPct?: number;
  bottomPct?: number;
  widthPct?: number;
  introSeconds?: number;
}

export default function AboutCat({
  leftPct = 0,
  bottomPct = 4,
  widthPct = 22,
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

    // Pin-track = the outer TALL section (its rect.top advances through the
    // runway). offsetParent would return the sticky child whose rect.top is
    // pinned at 0 → progress always 0.
    const track =
      (wrap.closest("section") as HTMLElement | null) ?? wrap.parentElement;
    if (!track) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduce  = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasRVFC = "requestVideoFrameCallback" in HTMLVideoElement.prototype;

    let readyS = false;
    let phase: "armed" | "intro" | "ready" = "armed";
    let mode: "sleep" | "wake" = "sleep";
    let lastScroll = window.scrollY;
    let vw = 0, vh = 0;

    // --- per-video seek-coalescing state ---
    // target = where we WANT to be; seeking = a seek is in flight. When it lands
    // we re-seek only if the target has since moved. One seek per settled frame.
    const st = {
      sleep: { target: 0, seeking: false },
      wake:  { target: 0, seeking: false },
    };
    const activeVideo = () => (mode === "sleep" ? sleep : wake);
    const stateOf = (v: HTMLVideoElement) => (v === sleep ? st.sleep : st.wake);

    let introRaf: number | null = null;
    let introStart = 0;

    // --- canvas paint ---
    function draw() {
      const cw = canvas!.width, ch = canvas!.height;
      ctx!.clearRect(0, 0, cw, ch);          // transparent every frame
      if (!vw || !vh) return;
      const v = activeVideo();
      const scale = Math.max(cw / vw, ch / vh);
      const dw = vw * scale, dh = vh * scale;
      ctx!.drawImage(v, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width  = Math.round(canvas!.clientWidth  * dpr);
      canvas!.height = Math.round(canvas!.clientHeight * dpr);
      draw();
    }

    function paintLoop() {
      draw();
      if (hasRVFC) activeVideo().requestVideoFrameCallback(paintLoop);
    }
    function ensurePaint() {
      if (hasRVFC) activeVideo().requestVideoFrameCallback(paintLoop);
    }

    // Coalesced seek: only one in flight; chase the latest target on landing.
    function pump(v: HTMLVideoElement) {
      const s = stateOf(v);
      if (s.seeking) return;
      const want = Math.max(0, Math.min(s.target, v.duration || s.target));
      if (Math.abs(v.currentTime - want) < 0.012) { if (!hasRVFC) draw(); return; }
      s.seeking = true;
      try { v.currentTime = want; } catch { s.seeking = false; }
    }
    const onSeeked = (v: HTMLVideoElement) => () => {
      stateOf(v).seeking = false;
      if (!hasRVFC) draw();
      // target may have advanced while seeking → chase it
      const s = stateOf(v);
      if (Math.abs(v.currentTime - Math.min(s.target, v.duration || s.target)) >= 0.012) pump(v);
    };

    // --- intro: rAF playthrough of the SLEEP clip (cat walks in, settles) ---
    const introTick = (now: number) => {
      if (phase !== "intro") return;
      if (!introStart) introStart = now;
      const dur = sleep.duration || 8;
      const k = Math.min((now - introStart) / 1000 / introSeconds, 1);
      const eased = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      st.sleep.target = eased * dur;
      pump(sleep);
      if (k < 1) { introRaf = requestAnimationFrame(introTick); }
      else { phase = "ready"; st.sleep.target = dur; introRaf = null; }
    };

    const startIntro = () => {
      if (!readyS || phase !== "armed") return;
      mode = "sleep";
      if (reduce) { phase = "ready"; st.sleep.target = sleep.duration || 8; pump(sleep); return; }
      phase = "intro";
      introStart = 0;
      introRaf = requestAnimationFrame(introTick);
    };

    // --- scroll: set target only; the seek loop chases it smoothly ---
    const onScroll = () => {
      if (phase !== "ready") { lastScroll = window.scrollY; return; }
      const goingUp = window.scrollY < lastScroll;
      lastScroll = window.scrollY;

      const rect = track.getBoundingClientRect();
      const scrollable = Math.max(track.offsetHeight - window.innerHeight, 1);
      const p = Math.min(Math.max(-rect.top / scrollable, 0), 1);

      // Direction-aware clip switch (canvas just draws whichever is active —
      // no visibility toggling, so the cat can never blink out or box up).
      if (goingUp && mode === "sleep") {
        mode = "wake";
        st.wake.target = 0;       // wake t=0 = cat asleep (matches sleep end)
        ensurePaint();
      } else if (!goingUp && mode === "wake") {
        mode = "sleep";
        st.sleep.target = sleep.duration || 8;
        ensurePaint();
      }

      const v = activeVideo();
      const dur = v.duration || 8;
      // SLEEP: p=0 → t=dur (asleep), p=1 → t=0 (off-screen). Reverse-mapped.
      // WAKE:  p=0 → t=0 (asleep), p=1 → t=dur (walked out left). Forward.
      stateOf(v).target = mode === "sleep" ? (1 - p) * dur : p * dur;
      pump(v);
    };

    // --- ready handlers ---
    const onReadyS = () => {
      if (sleep.readyState < 1 || readyS) return;
      readyS = true;
      vw = sleep.videoWidth; vh = sleep.videoHeight;
      sleep.pause();
      st.sleep.target = 0;
      try { sleep.currentTime = 0; } catch { /**/ }
      resize();
      ensurePaint();
    };
    const onReadyW = () => {
      if (wake.readyState < 1) return;
      wake.pause();
      try { wake.currentTime = 0; } catch { /**/ }
    };

    const seekedSleep = onSeeked(sleep);
    const seekedWake  = onSeeked(wake);

    sleep.addEventListener("loadedmetadata", onReadyS);
    wake.addEventListener("loadedmetadata", onReadyW);
    sleep.addEventListener("seeked", seekedSleep);
    wake.addEventListener("seeked", seekedWake);
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
    window.addEventListener("resize", resize);

    return () => {
      sleep.removeEventListener("loadedmetadata", onReadyS);
      wake.removeEventListener("loadedmetadata", onReadyW);
      sleep.removeEventListener("seeked", seekedSleep);
      wake.removeEventListener("seeked", seekedWake);
      track.removeEventListener("pointerenter", startIntro);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resize);
      if (io) io.disconnect();
      if (introRaf !== null) cancelAnimationFrame(introRaf);
    };
  }, [introSeconds]);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        // -2rem cancels the section's left padding so the cat hugs the true edge
        left: `calc(${leftPct}% - 2rem)`,
        bottom: `${bottomPct}%`,
        width: `${widthPct}%`,
        aspectRatio: "1440 / 1320",
        pointerEvents: "none",
        zIndex: 3,
      }}
    >
      {/* Canvas — the ONLY visible layer. alpha:true + clearRect() = real
          transparency; no element can ever paint an opaque box. */}
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
      {/* Hidden feeder videos — decoded & seeked, painted onto the canvas, never
          shown. Parked offscreen at 1×1 so a stray paint can't leak. Each lists
          .mov (Safari HEVC-alpha) BEFORE .webm (Chrome/FF VP9-alpha). */}
      <video
        ref={sleepRef}
        muted playsInline preload="auto"
        style={{ position: "absolute", left: -9999, top: 0, width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
      >
        <source src={asset("/video/cat-sleep.mov")}  type='video/quicktime; codecs="hvc1"' />
        <source src={asset("/video/cat-sleep.webm")} type="video/webm" />
      </video>
      <video
        ref={wakeRef}
        muted playsInline preload="auto"
        style={{ position: "absolute", left: -9999, top: 0, width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
      >
        <source src={asset("/video/cat-wake.mov")}  type='video/quicktime; codecs="hvc1"' />
        <source src={asset("/video/cat-wake.webm")} type="video/webm" />
      </video>
    </div>
  );
}
