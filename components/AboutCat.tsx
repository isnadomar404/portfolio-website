"use client";

import { useEffect, useRef } from "react";
import { asset } from "@/lib/asset";

/**
 * AboutCat — UNIVERSAL transparent cat overlay (Chrome, Firefox, Safari, every browser).
 *
 * WHY THIS APPROACH
 * -----------------
 * Transparent video has no single cross-browser format (VP9-alpha .webm is
 * Chrome/FF-only; HEVC-alpha .mov is Safari-only). So we don't rely on the
 * browser's alpha at all. Each clip is ONE plain (opaque) H.264 MP4 that stacks
 * COLOR on top and an ALPHA MATTE (white-on-black) on the bottom; a <canvas>
 * composites them itself (matte luma → color alpha). Plain H.264 decodes
 * everywhere → no Safari box, ever.
 *
 * RENDERING — self-correcting continuous loop
 * -------------------------------------------
 * The visible canvas is driven by a single requestAnimationFrame loop that runs
 * while the section is in view. EVERY tick re-keys the CURRENT decoded video
 * frame from scratch (clearRect + key + draw). Because the canvas is rebuilt
 * every frame, no stale or un-keyed (opaque "box") frame can ever persist — a
 * bad frame is overwritten on the very next tick, and the loop always settles on
 * a correctly-keyed frame. (The earlier RVFC/"paint-once" path could leave a
 * stale opaque frame as the last paint — that was the box bug.)
 *
 * BEHAVIOR
 * --------
 *   • Scroll DOWN (Hero → About): cat WALKS IN and settles asleep (cat-sleep
 *     clip scrubbed forward over the first part of the section runway).
 *   • Scroll UP (About → Hero): cat WAKES and walks away (cat-wake forward).
 *
 * PIN CONTEXT — progress from the outer <section> (closest("section")), NOT
 * offsetParent (which is the sticky child, frozen at rect.top 0).
 *
 * ASSETS (stacked color-over-matte, all-keyframe H.264, 960×1760 → 960×880 keyed):
 *   • /video/cat-sleep-stacked.mp4 — walk-in → sleep. Last frame = resting cat.
 *   • /video/cat-wake-stacked.mp4  — wake → walk away. Last frame = empty.
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
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
    let pTarget = 0;           // sleep: 0 = walk-in start, 1 = settled asleep; wake: 0..1 progress
    let cur = 0;
    let lastScroll = window.scrollY;
    let inView = false;
    let raf: number | null = null;
    let tail = 0;              // extra frames to keep compositing after settling
    let seeking = false;       // a coalesced seek is in flight on the active video
    let badFrames = 0;         // consecutive invalid ("box") frames at a settled target

    // Fraction of the section runway over which the cat finishes walking in on
    // scroll-down. After this point it holds the resting (asleep) frame.
    const ARRIVE = 0.4;

    const activeVideo = () => (mode === "sleep" ? sleep : wake);

    // A correctly-keyed cat always covers only a MINORITY of the frame (≈35% at
    // most). If the keyed result comes out almost fully opaque, the source frame
    // was invalid — an undecoded/garbage frame on seek, or the bad first
    // keyframe — which is exactly the opaque "box". We never draw that.
    const OPAQUE_BOX_LIMIT = 0.6;

    // Composite the active stacked frame (color top + matte bottom) → keyed RGBA.
    // Returns true only when a VALID keyed frame was drawn; on any failure or an
    // invalid (box-like) frame it leaves the canvas cleared (transparent) rather
    // than ever showing the raw opaque frame. Bulletproof across browsers/timing.
    const composite = (): boolean => {
      const src = activeVideo();
      const fullW = src.videoWidth;
      const fullH = src.videoHeight;
      if (!fullW || !fullH) return false;
      const halfH = Math.floor(fullH / 2);

      if (colorC.width !== fullW || colorC.height !== halfH) {
        colorC.width = fullW; colorC.height = halfH;
        maskC.width  = fullW; maskC.height  = halfH;
        outC.width   = fullW; outC.height   = halfH;
        canvas.width = fullW; canvas.height = halfH;
      }

      colorCtx.drawImage(src, 0, 0, fullW, halfH, 0, 0, fullW, halfH);    // top = color
      maskCtx.drawImage(src, 0, halfH, fullW, halfH, 0, 0, fullW, halfH); // bottom = matte

      let color: ImageData, mask: ImageData;
      try {
        color = colorCtx.getImageData(0, 0, fullW, halfH);
        mask  = maskCtx.getImageData(0, 0, fullW, halfH);
      } catch {
        return false; // tainted/unavailable — never fall back to the raw opaque frame
      }
      const cd = color.data, md = mask.data;
      let opaque = 0;
      for (let i = 0; i < cd.length; i += 4) {
        const a = md[i];      // matte luma → alpha
        cd[i + 3] = a;
        if (a > 180) opaque++;
      }
      // Reject the invalid "box" frame: keep the canvas transparent instead.
      if (opaque / (cd.length / 4) > OPAQUE_BOX_LIMIT) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return false;
      }
      outCtx.putImageData(color, 0, 0);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(outC, 0, 0);
      return true;
    };

    const timeFor = (src: HTMLVideoElement, p: number) => {
      const dur = src.duration || 0;
      return Math.max(0, Math.min(p * dur, dur - 0.001));
    };

    // Self-correcting render loop. Runs while in view; re-keys every tick so an
    // un-keyed/opaque frame can never persist.
    const frame = () => {
      raf = null;
      if (!inView) return;

      const src = activeVideo();
      cur += (pTarget - cur) * (reduce ? 1 : ease);
      const settled = Math.abs(pTarget - cur) <= 0.0008;
      if (settled) cur = pTarget;

      // coalesced seek: only one in flight; chase the latest target on 'seeked'
      const t = timeFor(src, cur);
      if (!seeking && Math.abs(src.currentTime - t) > 0.005) {
        seeking = true;
        try { src.currentTime = t; } catch { seeking = false; }
      }

      const ok = composite(); // always re-key the current decoded frame
      if (ok) badFrames = 0;
      else if (settled) badFrames++;

      if (!settled) tail = 12;
      else if (tail > 0) tail--;

      // If a settled frame keyed to the invalid box, keep re-keying briefly to
      // catch the real frame once it decodes; give up (staying transparent,
      // never a box) after a bounded number of attempts.
      const retryBad = !ok && badFrames > 0 && badFrames < 20;
      if (!settled || tail > 0 || seeking || retryBad) raf = requestAnimationFrame(frame);
    };

    const ensureLoop = () => { if (raf === null && inView) raf = requestAnimationFrame(frame); };

    const onSeeked = () => { seeking = false; ensureLoop(); };

    const onScroll = () => {
      if (!readySleep || !readyWake) { lastScroll = window.scrollY; return; }
      const goingUp = window.scrollY < lastScroll;
      lastScroll = window.scrollY;

      const rect = track.getBoundingClientRect();
      const scrollable = Math.max(track.offsetHeight - window.innerHeight, 1);
      const p = Math.min(Math.max(-rect.top / scrollable, 0), 1);

      if (goingUp) {
        if (mode !== "wake")  { mode = "wake";  cur = 0; seeking = false; }
        pTarget = Math.min(Math.max(1 - p, 0), 1); // scroll up → wake plays forward (walk away)
      } else {
        // scroll down → sleep clip scrubs forward: cat WALKS IN, then settles asleep.
        const sleepP = Math.min(Math.max(p / ARRIVE, 0), 1);
        if (mode !== "sleep") { mode = "sleep"; cur = sleepP; seeking = false; }
        pTarget = sleepP;
      }
      tail = 12;
      badFrames = 0;
      ensureLoop();
    };

    const onMetaSleep = () => {
      if (sleep.readyState < 1 || readySleep) return;
      readySleep = true;
      sleep.pause();
      try { sleep.currentTime = 0; } catch { /* ignore */ } // walk-in start frame
      tail = 30; ensureLoop();
      if (readyWake) onScroll(); // sync to current scroll position
    };
    const onMetaWake = () => {
      if (wake.readyState < 1 || readyWake) return;
      readyWake = true;
      wake.pause();
      try { wake.currentTime = 0; } catch { /* ignore */ }
      if (readySleep) onScroll(); // sync to current scroll position
    };

    sleep.addEventListener("loadedmetadata", onMetaSleep);
    wake.addEventListener("loadedmetadata", onMetaWake);
    sleep.addEventListener("seeked", onSeeked);
    wake.addEventListener("seeked", onSeeked);
    if (sleep.readyState >= 1) onMetaSleep();
    if (wake.readyState >= 1) onMetaWake();

    // Run the loop only while the section is near/in view (perf).
    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            inView = e.isIntersecting;
            if (inView) { tail = 12; ensureLoop(); }
          }
        },
        { rootMargin: "200px 0px" }
      );
      io.observe(track);
    } else {
      inView = true; ensureLoop();
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      sleep.removeEventListener("loadedmetadata", onMetaSleep);
      wake.removeEventListener("loadedmetadata", onMetaWake);
      sleep.removeEventListener("seeked", onSeeked);
      wake.removeEventListener("seeked", onSeeked);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (io) io.disconnect();
      if (raf !== null) cancelAnimationFrame(raf);
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
