"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useDepthParallax } from "@/hooks/useDepthParallax";

const DOTS = [
  { id: "top", label: "Home" },
  { id: "about", label: "About" },
  { id: "work", label: "Work" },
  { id: "contact", label: "Contact" },
];

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
// cat-exit-scrub.mp4 — cat gets up and walks off screen; scrubbed by scroll.
const SRC = `${BASE}/video/cat-exit-scrub.mp4`;
const POSTER = `${BASE}/video/cat-poster.jpg`;
const EASE = 0.14;

/**
 * Hero — scroll-scrubbed cat animation, no scroll-jack.
 *
 *   • Not scrolling  -> cat is FROZEN on the current frame.
 *   • Scroll DOWN    -> cat stands up and walks out (animation advances).
 *   • Scroll UP      -> same clip rewinds (cat walks back in).
 *
 * The section is one viewport tall (100svh). The page scrolls freely past it.
 * Progress = −rect.top / section.height: starts at 0 when the hero fills the
 * screen, reaches 1 when the hero has fully exited the top. The animation
 * plays over that natural scroll distance — no pin, no scroll-jack.
 *
 * The video layer gets a gentle parallax drift (scrollRate 35) so the image
 * eases away slightly faster than the page — a depth cue, not a lock.
 *
 * Mobile / iOS: play().then(pause) unlocks seeking; readyState guard handles
 * the cached-load race where loadedmetadata fires before the listener attaches.
 */
export default function Hero() {
  const trackRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);

  // Gentle parallax drift on the video layer — transform only, never affects scroll speed.
  const P_video = useDepthParallax({ scrollRate: 35 });

  useEffect(() => {
    const track = trackRef.current;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const hint = hintRef.current;
    if (!track || !canvas || !video) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasRVFC = "requestVideoFrameCallback" in HTMLVideoElement.prototype;

    let ready = false;
    let target = 0;
    let current = 0;
    let raf: number | null = null;
    let vw = 0;
    let vh = 0;

    const posterImg = new Image();
    posterImg.src = POSTER;

    function coverDraw(srcW: number, srcH: number, source: CanvasImageSource) {
      const cw = canvas!.width;
      const ch = canvas!.height;
      const scale = Math.max(cw / srcW, ch / srcH);
      const w = srcW * scale;
      const h = srcH * scale;
      ctx!.drawImage(source, (cw - w) / 2, (ch - h) / 2, w, h);
    }

    function draw() {
      if (ready && vw) coverDraw(vw, vh, video!);
      else if (posterImg.complete && posterImg.naturalWidth)
        coverDraw(posterImg.naturalWidth, posterImg.naturalHeight, posterImg);
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(canvas!.clientWidth * dpr);
      canvas!.height = Math.round(canvas!.clientHeight * dpr);
      draw();
      onScroll();
    }

    function onFrame() {
      draw();
      if (hasRVFC) video!.requestVideoFrameCallback(onFrame);
    }

    function tick() {
      current += (target - current) * EASE;
      const done = Math.abs(target - current) <= 0.004;
      if (done) current = target;
      try { video!.currentTime = current; } catch (_) {}
      if (!hasRVFC) draw();
      if (!done) raf = requestAnimationFrame(tick);
      else raf = null;
    }

    function onScroll() {
      const rect = track!.getBoundingClientRect();
      // Progress 0→1 as the section exits viewport (no pin — natural scroll speed).
      // rect.top goes from 0 (hero fills screen) to -rect.height (hero fully gone).
      const p = Math.min(Math.max(-rect.top / rect.height, 0), 1);
      if (hint) hint.style.opacity = p > 0.05 ? "0" : "1";
      if (!ready || !video!.duration) return;
      target = p * video!.duration;
      if (reduce) {
        current = target;
        try { video!.currentTime = current; } catch (_) {}
        draw();
        return;
      }
      if (!raf) raf = requestAnimationFrame(tick);
    }

    function onMeta() {
      if (ready) return;
      ready = true;
      vw = video!.videoWidth;
      vh = video!.videoHeight;
      if (hasRVFC) video!.requestVideoFrameCallback(onFrame);
      // iOS Safari blocks seeking until the video has played at least once.
      // play().then(pause) on a muted+playsInline video is allowed without user gesture.
      video!
        .play()
        .then(() => { video!.pause(); video!.currentTime = 0; resize(); })
        .catch(() => { try { video!.currentTime = 0; } catch (_) {} resize(); });
    }

    posterImg.addEventListener("load", draw);
    video.addEventListener("loadedmetadata", onMeta);
    video.addEventListener("seeked", draw);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", resize);

    // Fast-cache guard — metadata may already be loaded on repeat visits.
    if (video.readyState >= 1) {
      onMeta();
    } else {
      // Force mobile browsers (especially iOS, which ignores preload="auto" on
      // hidden videos) to start fetching so loadedmetadata fires.
      video.load();
    }

    resize();

    return () => {
      posterImg.removeEventListener("load", draw);
      video.removeEventListener("loadedmetadata", onMeta);
      video.removeEventListener("seeked", draw);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      ref={trackRef}
      id="top"
      className="relative isolate"
      style={{ height: "100svh", overflow: "hidden" }}
    >
      {/* Video layer — parallax drift only, never slows page scroll */}
      <motion.div
        ref={P_video.ref}
        style={{ ...P_video.style, position: "absolute", inset: 0, zIndex: 1 }}
        aria-hidden
      >
        <canvas
          ref={canvasRef}
          aria-label="Isnad Bin Omar at his desk with a cat — scroll to animate"
          className="absolute inset-0 block h-full w-full"
        />
        {/* Hidden source video — seeked per frame, painted onto canvas */}
        <video
          ref={videoRef}
          src={SRC}
          poster={POSTER}
          muted
          playsInline
          preload="metadata"
          aria-hidden
          style={{
            position: "absolute",
            width: 1,
            height: 1,
            opacity: 0,
            pointerEvents: "none",
          }}
        />
      </motion.div>

      {/* Neon depth wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          zIndex: 4,
          background:
            "radial-gradient(120% 80% at 50% 38%, transparent 42%, rgba(7,10,18,0.5) 100%), radial-gradient(70% 60% at 88% 18%, rgba(115,239,247,0.12), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-bg to-transparent"
        style={{ zIndex: 4 }}
      />

      {/* Left rail */}
      <div
        className="pointer-events-none absolute left-6 top-0 hidden h-full flex-col items-center justify-center lg:flex"
        style={{ zIndex: 10 }}
      >
        <span className="mb-6 h-24 w-px bg-rule" />
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        <span
          className="mt-6 text-[11px] uppercase tracking-[0.3em] text-fg-muted"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          Based in Dhaka, Bangladesh
        </span>
      </div>

      {/* Right rail — section nav dots */}
      <div
        className="absolute right-7 top-1/2 hidden -translate-y-1/2 flex-col items-center gap-4 lg:flex"
        style={{ zIndex: 10 }}
      >
        {DOTS.map((d, i) => (
          <a
            key={d.id}
            href={`#${d.id}`}
            aria-label={d.label}
            className="group relative flex h-3 w-3 cursor-pointer items-center justify-center"
          >
            <span
              className={`block rounded-full transition-all duration-300 ${
                i === 0
                  ? "h-3 w-3 bg-accent"
                  : "h-2.5 w-2.5 border border-fg-muted/60 bg-bg group-hover:border-accent"
              }`}
            />
          </a>
        ))}
      </div>

      {/* Scroll hint — fades as soon as you start scrolling */}
      <div
        ref={hintRef}
        className="absolute bottom-7 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-fg-muted"
        style={{ zIndex: 10, transition: "opacity .3s" }}
      >
        <span className="flex h-9 w-6 items-start justify-center rounded-full border border-fg-muted/60 pt-1.5">
          <span className="h-1.5 w-1 animate-bounce rounded-full bg-fg-muted" />
        </span>
        <span className="text-[11px] uppercase tracking-[0.24em]">
          Scroll — the cat follows
        </span>
      </div>
    </section>
  );
}
