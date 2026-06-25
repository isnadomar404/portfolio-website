"use client";

import { useEffect, useRef } from "react";
import { asset } from "@/lib/asset";

/**
 * AboutCat — UNIVERSAL transparent cat overlay (Chrome, Firefox, Safari, every browser).
 *
 * WHY THIS APPROACH
 * -----------------
 * Transparent video has no single cross-browser format:
 *   • VP9-alpha .webm → Chrome/Firefox only (Safari paints an OPAQUE box — the bug).
 *   • HEVC-alpha .mov → Safari only.
 * So we stop relying on the browser's alpha entirely. Each clip is ONE plain (opaque)
 * H.264 MP4 that stacks COLOR on top and an ALPHA MATTE (white-on-black) on the bottom.
 * A <canvas> composites them itself (color × matte → transparent). Every browser decodes
 * plain H.264 → truly universal, no Safari box, ever. The only visible element is the
 * canvas; the source videos are parked offscreen and never shown, so no raw frame leaks.
 *
 * BEHAVIOR
 * --------
 *   • Default: the cat sits SLEEPING (rest frame of the sleep clip).
 *   • Scroll DOWN: nothing changes — cat stays asleep.
 *   • Scroll UP (About → back toward Hero): the cat WAKES and walks away, played FORWARD
 *     (cat-wake), scrubbed by upward progress. Scroll down again re-settles it asleep.
 *
 * PIN CONTEXT
 * -----------
 * About is a pinned-scrub: outer <section height:220svh> with a sticky inner stage.
 * Progress MUST come from the outer section (closest("section")) — offsetParent returns
 * the sticky child whose rect.top is pinned at 0, which would freeze progress at 0.
 *
 * ASSETS (stacked color-over-matte, all-keyframe H.264, 960×1760 → 960×880 keyed):
 *   • /video/cat-sleep-stacked.mp4 — walk-in → sleep. Last frame = resting cat (idle).
 *   • /video/cat-wake-stacked.mp4  — wake → walk away (forward). Last frame = empty.
 */
interface AboutCatProps {
  leftPct?: number;   // horizontal anchor, % of section width
  bottomPct?: number; // overlay bottom from section bottom, % of section height
  widthPct?: number;  // overlay width, % of section width
  ease?: number;      // scrub smoothing (0..1; higher = snappier, 1 = rigid 1:1)
}

export default function AboutCat({
  leftPct = 0,
  bottomPct = 4,
  widthPct = 22,
  ease = 0.16,
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

    // Outer TALL section drives progress — NOT offsetParent (the sticky child).
    const track =
      (wrap.closest("section") as HTMLElement | null) ?? wrap.parentElement;
    if (!track) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const reduce  = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasRVFC = "requestVideoFrameCallback" in HTMLVideoElement.prototype;

    // offscreen scratch canvases for the keying math
    const colorC = document.createElement("canvas");
    const maskC  = document.createElement("canvas");
    const outC   = document.createElement("canvas");
    const colorCtx = colorC.getContext("2d", { willReadFrequently: true })!;
    const maskCtx  = maskC.getContext("2d", { willReadFrequently: true })!;
    const outCtx   = outC.getContext("2d", { willReadFrequently: true })!;

    let readySleep = false;
    let readyWake  = false;
    let mode: "sleep" | "wake" = "sleep";
    let pTarget = 1;            // 1 = fully settled asleep (sleep clip at its end frame)
    let cur = 1;
    let running = false;
    let lastScroll = window.scrollY;
    let pendingPaint = false;

    const activeVideo = () => (mode === "sleep" ? sleep : wake);

    // Composite the active stacked frame (color top + matte bottom) → keyed RGBA.
    const composite = () => {
      const src = activeVideo();
      const fullW = src.videoWidth;
      const fullH = src.videoHeight;
      if (!fullW || !fullH) return;
      const halfH = Math.floor(fullH / 2);

      if (colorC.width !== fullW || colorC.height !== halfH) {
        colorC.width = fullW; colorC.height = halfH;
        maskC.width  = fullW; maskC.height  = halfH;
        outC.width   = fullW; outC.height   = halfH;
        canvas.width = fullW; canvas.height = halfH;
      }

      colorCtx.drawImage(src, 0, 0, fullW, halfH, 0, 0, fullW, halfH);    // top = color
      maskCtx.drawImage(src, 0, halfH, fullW, halfH, 0, 0, fullW, halfH); // bottom = matte

      const color = colorCtx.getImageData(0, 0, fullW, halfH);
      const mask  = maskCtx.getImageData(0, 0, fullW, halfH);
      const cd = color.data;
      const md = mask.data;
      for (let i = 0; i < cd.length; i += 4) cd[i + 3] = md[i]; // matte luma → alpha
      outCtx.putImageData(color, 0, 0);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(outC, 0, 0);
      pendingPaint = false;
    };

    const timeFor = (src: HTMLVideoElement, p: number) => {
      const dur = src.duration || 0;
      return Math.max(0, Math.min(p * dur, dur - 0.001));
    };

    const armPaint = (src: HTMLVideoElement) => {
      if (hasRVFC) src.requestVideoFrameCallback(() => composite());
      else requestAnimationFrame(() => composite());
    };

    // Single eased rAF loop, one seek per frame, paint on decode.
    const loop = () => {
      cur += (pTarget - cur) * ease;
      const settled = Math.abs(pTarget - cur) <= 0.0008;
      if (settled) cur = pTarget;

      const src = activeVideo();
      const t = timeFor(src, cur);
      if (Math.abs(src.currentTime - t) > 0.001) {
        pendingPaint = true;
        try { src.currentTime = t; } catch { /* ignore */ }
        armPaint(src);
      }
      if (settled && !pendingPaint) { running = false; return; }
      requestAnimationFrame(loop);
    };

    const kick = () => {
      if (reduce) {
        const src = activeVideo();
        try { src.currentTime = timeFor(src, pTarget); } catch { /* ignore */ }
        armPaint(src);
        return;
      }
      if (!running) { running = true; requestAnimationFrame(loop); }
    };

    const onScroll = () => {
      if (!readySleep || !readyWake) { lastScroll = window.scrollY; return; }
      const goingUp = window.scrollY < lastScroll;
      lastScroll = window.scrollY;

      // Pinned-scrub progress from the outer section: 0 at top of runway, 1 at end.
      const rect = track.getBoundingClientRect();
      const scrollable = Math.max(track.offsetHeight - window.innerHeight, 1);
      const p = Math.min(Math.max(-rect.top / scrollable, 0), 1);

      if (goingUp) {
        // scrolling UP toward hero → WAKE and walk away, forward.
        if (mode !== "wake") {
          mode = "wake";
          cur = 0;            // wake starts at asleep pose (matches sleep clip's end)
          pendingPaint = true;
          armPaint(wake);
        }
        // as you scroll up, p shrinks → (1 - p) grows → wake plays forward.
        pTarget = Math.min(Math.max(1 - p, 0), 1);
      } else {
        // scrolling DOWN → cat stays asleep; settle to the sleep clip's rest frame.
        if (mode !== "sleep") {
          mode = "sleep";
          cur = 1;
          pendingPaint = true;
          armPaint(sleep);
        }
        pTarget = 1;
      }
      kick();
    };

    const onMetaSleep = () => {
      if (sleep.readyState < 1 || readySleep) return;
      readySleep = true;
      sleep.pause();
      try { sleep.currentTime = sleep.duration || 0; } catch { /* ignore */ } // rest frame
      armPaint(sleep);
    };
    const onMetaWake = () => {
      if (wake.readyState < 1 || readyWake) return;
      readyWake = true;
      wake.pause();
      try { wake.currentTime = 0; } catch { /* ignore */ }
    };

    const onSeeked = () => composite();

    sleep.addEventListener("loadedmetadata", onMetaSleep);
    wake.addEventListener("loadedmetadata", onMetaWake);
    sleep.addEventListener("seeked", onSeeked);
    wake.addEventListener("seeked", onSeeked);
    if (sleep.readyState >= 1) onMetaSleep();
    if (wake.readyState >= 1) onMetaWake();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      sleep.removeEventListener("loadedmetadata", onMetaSleep);
      wake.removeEventListener("loadedmetadata", onMetaWake);
      sleep.removeEventListener("seeked", onSeeked);
      wake.removeEventListener("seeked", onSeeked);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ease]);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        // -2rem cancels the section's px-5 padding so the cat hugs the true page edge
        left: `calc(${leftPct}% - 2rem)`,
        bottom: `${bottomPct}%`,
        width: `${widthPct}%`,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 3,
        lineHeight: 0,
        filter: "drop-shadow(0 8px 10px rgba(0,0,0,0.55))",
      }}
    >
      {/* The ONLY visible element — keyed by JS → transparent in every browser. */}
      <canvas ref={canvasRef} style={{ width: "100%", height: "auto", display: "block" }} />

      {/* Hidden source videos — plain opaque H.264, decoded but never shown.
          Parked offscreen so a stray paint can never leak. */}
      <video
        ref={sleepRef}
        src={asset("/video/cat-sleep-stacked.mp4")}
        muted playsInline preload="auto"
        style={{ position: "absolute", width: 1, height: 1, left: -9999, top: 0, opacity: 0, pointerEvents: "none" }}
      />
      <video
        ref={wakeRef}
        src={asset("/video/cat-wake-stacked.mp4")}
        muted playsInline preload="auto"
        style={{ position: "absolute", width: 1, height: 1, left: -9999, top: 0, opacity: 0, pointerEvents: "none" }}
      />
    </div>
  );
}
