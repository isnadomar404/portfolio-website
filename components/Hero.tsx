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
const TRACK_VH = 300;
const EASE = 0.14;

/**
 * Frame-perfect, scroll-scrubbed hero (single clip, frozen unless scrolling).
 *   • Not scrolling -> cat is frozen on the current frame (no autoplay/loop).
 *   • Scroll down   -> timeline advances -> cat stands and walks out.
 *   • Scroll up     -> timeline rewinds  -> cat walks back in.
 *
 * Mobile fixes:
 *   • iOS ignores preload="auto" — we call video.load() explicitly so the
 *     browser starts fetching. preload="metadata" is respected everywhere.
 *   • iOS blocks currentTime seeks on a video that has never played. We call
 *     play().then(pause) in onMeta to "unlock" seeking without visible autoplay.
 *   • readyState guard handles the cached-load race (metadata may already be
 *     available before the event listener is attached).
 *   • viewH is cached at resize-time, not re-read per scroll, so the mobile
 *     address-bar appearing/hiding does not jitter the progress calculation.
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
    // Cache viewport height so the mobile address-bar collapsing doesn't
    // jitter the scroll progress — only update on genuine resize events.
    let viewH = window.innerHeight;

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
      viewH = window.innerHeight;
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
      const total = track!.offsetHeight - viewH;
      const p = Math.min(Math.max(-rect.top / total, 0), 1);
      if (railFill) railFill.style.transform = `scaleY(${p})`;
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
      if (ready) return; // guard against duplicate calls
      ready = true;
      vw = video!.videoWidth;
      vh = video!.videoHeight;
      if (hasRVFC) video!.requestVideoFrameCallback(onFrame);
      // iOS Safari blocks currentTime seeking on a video that has never played.
      // play() on a muted+playsInline video is allowed without user gesture.
      // We play then immediately pause to "unlock" seeking without visible playback.
      video!
        .play()
        .then(() => {
          video!.pause();
          video!.currentTime = 0;
          resize();
        })
        .catch(() => {
          // play() rejected (e.g., browser policy, reduced-motion off but video
          // not ready) — still try to seek; it may work on non-iOS browsers.
          try { video!.currentTime = 0; } catch (_) {}
          resize();
        });
    }

    posterImg.addEventListener("load", draw);
    video.addEventListener("loadedmetadata", onMeta);
    video.addEventListener("seeked", draw);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", resize);

    // Fast-cache guard: if metadata is already available (repeat visit /
    // cached), loadedmetadata won't fire again — initialise right now.
    if (video.readyState >= 1) {
      onMeta();
    } else {
      // Explicit load() call forces mobile browsers (especially iOS Safari,
      // which ignores preload="auto" on hidden video elements) to start
      // fetching the video so loadedmetadata fires.
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

        {/* hidden source video we seek — kept visible to the layout engine
            (display:none prevents iOS from loading frames at all) */}
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

        {/* Right rail — section dots threaded by a scroll-progress line */}
        <div
          className="absolute right-7 top-1/2 hidden -translate-y-1/2 flex-col items-center gap-4 lg:flex"
          style={{ zIndex: 10 }}
        >
          <div
            aria-hidden
            className="absolute left-1/2 w-px -translate-x-1/2 overflow-hidden rounded-full bg-fg-muted/25"
            style={{ top: 6, bottom: 6 }}
          >
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

        {/* Scroll hint */}
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
