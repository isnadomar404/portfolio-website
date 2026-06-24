"use client";

import { useEffect, useRef } from "react";

const DOTS = [
  { id: "top", label: "Home" },
  { id: "about", label: "About" },
  { id: "work", label: "Work" },
  { id: "contact", label: "Contact" },
];

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const SRC = `${BASE}/video/cat-exit-scrub.mp4`;
const POSTER = `${BASE}/video/cat-poster.jpg`;
const TRACK_VH = 300; // scroll distance = cat speed
const EASE = 0.14; // higher = snappier, lower = silkier

/**
 * Frame-perfect, scroll-scrubbed hero (single clip, frozen unless scrolling).
 *   • Not scrolling -> cat is frozen on the current frame (no autoplay/loop).
 *   • Scroll down   -> timeline advances -> cat stands and walks out.
 *   • Scroll up     -> timeline rewinds  -> cat walks back in.
 * A hidden <video> is seeked and its decoded frame painted onto a <canvas> via
 * requestVideoFrameCallback (frame-perfect; falls back to per-rAF draw).
 */
export default function Hero() {
  const trackRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const railFillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const hint = hintRef.current;
    const railFill = railFillRef.current;
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

    // poster painted instantly before the video decodes
    const posterImg = new Image();
    posterImg.src = POSTER;

    // cover-fit a source (video frame or poster) onto the canvas
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
      try {
        video!.currentTime = current;
      } catch (_) {}
      if (!hasRVFC) draw();
      if (!done) raf = requestAnimationFrame(tick);
      else raf = null; // settle -> frozen frame until next scroll
    }

    function onScroll() {
      const rect = track!.getBoundingClientRect();
      const total = track!.offsetHeight - window.innerHeight;
      const p = Math.min(Math.max(-rect.top / total, 0), 1);
      // vertical rail fills downward as the cat leaves, drains as it returns
      if (railFill) railFill.style.transform = `scaleY(${p})`;
      if (hint) hint.style.opacity = p > 0.05 ? "0" : "1";
      if (!ready || !video!.duration) return;
      target = p * video!.duration;
      if (reduce) {
        current = target;
        try {
          video!.currentTime = current;
        } catch (_) {}
        draw();
        return;
      }
      if (!raf) raf = requestAnimationFrame(tick);
    }

    function onMeta() {
      ready = true;
      vw = video!.videoWidth;
      vh = video!.videoHeight;
      video!.pause();
      video!.currentTime = 0;
      if (hasRVFC) video!.requestVideoFrameCallback(onFrame);
      resize();
    }

    posterImg.addEventListener("load", draw);
    video.addEventListener("loadedmetadata", onMeta);
    video.addEventListener("seeked", draw); // guarantee a paint after each seek
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", resize);
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
    <section ref={trackRef} id="top" style={{ position: "relative", height: `${TRACK_VH}vh` }}>
      {/* Sticky viewport — pinned while we scroll through the track */}
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100svh",
          width: "100%",
          overflow: "hidden",
          background: "#070d1c",
        }}
      >
        {/* visible canvas — the frame-perfect scrubbed frame */}
        <canvas
          ref={canvasRef}
          aria-label="Isnad Bin Omar at his desk with a cat — scroll to animate"
          className="absolute inset-0 block h-full w-full"
          style={{ zIndex: 1 }}
        />
        {/* hidden source video we seek */}
        <video
          ref={videoRef}
          src={SRC}
          poster={POSTER}
          muted
          playsInline
          preload="auto"
          aria-hidden
          style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
        />

        {/* Neon depth wash — cyberpunk lighting over the scene */}
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

        {/* Left rail — location */}
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

        {/* Right rail — section dots threaded by a scroll-progress line */}
        <div
          className="absolute right-7 top-1/2 hidden -translate-y-1/2 flex-col items-center gap-4 lg:flex"
          style={{ zIndex: 10 }}
        >
          {/* vertical track from first dot centre to last dot centre */}
          <div
            aria-hidden
            className="absolute left-1/2 w-px -translate-x-1/2 overflow-hidden rounded-full bg-fg-muted/25"
            style={{ top: 6, bottom: 6 }}
          >
            {/* fill: grows downward with scroll (cat leaves), drains on scroll up */}
            <div
              ref={railFillRef}
              className="absolute inset-x-0 top-0 h-full origin-top bg-accent"
              style={{ transform: "scaleY(0)", willChange: "transform" }}
            />
          </div>

          {DOTS.map((d, i) => (
            <a
              key={d.id}
              href={`#${d.id}`}
              aria-label={d.label}
              className="group relative flex h-3 w-3 items-center justify-center cursor-pointer"
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

        {/* Scroll hint — the cat moves only when you do; fades as you scroll */}
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
      </div>
    </section>
  );
}
