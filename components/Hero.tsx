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
// Two clips switched by scroll direction — no moonwalking.
const EXIT_SRC   = `${BASE}/video/cat-exit-scrub.mp4`;   // cat sits → walks OUT right (scroll down)
const RETURN_SRC = `${BASE}/video/cat-return-scrub.mp4`; // cat walks IN from right → sits (scroll up)
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
  const trackRef  = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const exitRef   = useRef<HTMLVideoElement>(null);
  const returnRef = useRef<HTMLVideoElement>(null);
  const hintRef   = useRef<HTMLDivElement>(null);

  // Subtle pointer-only drift on the video layer. No scroll drift: the stage is
  // pinned, so a scroll-rate transform would walk the canvas off the viewport.
  const P_video = useDepthParallax({ scrollRate: 0 });

  useEffect(() => {
    const track  = trackRef.current;
    const canvas = canvasRef.current;
    const exit   = exitRef.current;
    const ret    = returnRef.current;
    const hint   = hintRef.current;
    if (!track || !canvas || !exit || !ret) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const reduce  = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasRVFC = "requestVideoFrameCallback" in HTMLVideoElement.prototype;

    let readyExit   = false;
    let readyReturn = false;
    let active: "exit" | "return" = "exit";
    let goneLatched   = false; // exit clip reached its end — cat fully off-screen
    let seatedLatched = false; // return clip reached its end — cat fully seated
    let lastScroll = window.scrollY;
    let target  = 0;
    let current = 0;
    let raf: number | null = null;
    let vw = 0;
    let vh = 0;

    const activeVideo = () => (active === "exit" ? exit : ret);

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
      if (readyExit && vw) {
        coverDraw(vw, vh, activeVideo());
      } else {
        // Fill with the page background colour so the canvas never flashes black.
        ctx!.fillStyle = "#070a12";
        ctx!.fillRect(0, 0, canvas!.width, canvas!.height);
        if (posterImg.complete && posterImg.naturalWidth)
          coverDraw(posterImg.naturalWidth, posterImg.naturalHeight, posterImg);
      }
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
      if (hasRVFC) activeVideo().requestVideoFrameCallback(onFrame);
    }

    function tick() {
      const v = activeVideo();
      current += (target - current) * EASE;
      const done = Math.abs(target - current) <= 0.004;
      if (done) current = target;
      try { v.currentTime = current; } catch (_) {}
      if (!hasRVFC) draw();
      if (!done) raf = requestAnimationFrame(tick);
      else raf = null;
    }

    function onScroll() {
      const rect = track!.getBoundingClientRect();
      const scrollable = Math.max(track!.offsetHeight - window.innerHeight, 1);
      const p = Math.min(Math.max(-rect.top / scrollable, 0), 1);
      if (hint) hint.style.opacity = p > 0.05 ? "0" : "1";

      if (!readyExit || !readyReturn) { lastScroll = window.scrollY; return; }

      const goingUp = window.scrollY < lastScroll;
      lastScroll = window.scrollY;

      // Switch clips ONLY at the boundaries, so a mid-scrub reverse stays on the
      // SAME clip (smooth, replays the footage backward) instead of jumping to
      // the other one:
      //  • Mid-exit + scroll up  → exit clip just scrubs backward (cat walks back
      //    in reverse). No switch, no jump.
      //  • Cat fully GONE (exit reached its end, p≈1) + scroll up → hand off to
      //    the RETURN clip so the cat walks back in FORWARD (natural, not reverse).
      //  • Cat fully SEATED (return reached its end, p≈0) + scroll down → hand
      //    back to the EXIT clip so it walks out forward again.
      // The two clips agree visually at both ends (gone↔gone at p=1, seated↔seated
      // at p=0), so every handoff is seamless.
      // Latches arm only when a clip actually reaches its far end — i.e. you
      // really scrolled to the bottom (cat gone) or back to the top (cat seated).
      // A latch persists across events, so even a coarse trackpad flick triggers
      // the handoff; and if you DON'T reach the end, no latch arms and a reverse
      // simply scrubs the same clip backward (the mid-scrub case).
      const PE = 0.02; // how close to the end counts as "reached it"

      if (active === "exit") {
        if (p >= 1 - PE) goneLatched = true; // cat fully off-screen — arm return
        if (goneLatched && goingUp) {
          // reversing after the cat left → hand off to the forward return clip
          active = "return";
          goneLatched = false;
          vw = ret!.videoWidth;
          vh = ret!.videoHeight;
          current = 0; // return t=0 = cat off-screen, matches the exit clip's end
          if (hasRVFC) ret!.requestVideoFrameCallback(onFrame);
        }
      } else {
        if (p <= PE) seatedLatched = true; // cat fully seated — arm exit
        if (seatedLatched && !goingUp) {
          // heading back down after the cat sat → hand off to the forward exit clip
          active = "exit";
          seatedLatched = false;
          vw = exit!.videoWidth;
          vh = exit!.videoHeight;
          current = 0; // exit t=0 = cat seated, matches the return clip's end
          if (hasRVFC) exit!.requestVideoFrameCallback(onFrame);
        }
      }

      const v = activeVideo();
      if (!v.duration) return;
      // EXIT:   t = p·dur        (seated at p=0 → walks out → gone at p=1)
      // RETURN: t = (1−p)·dur    (gone at p=1 → walks in → seated at p=0)
      // Either direction on a clip is just a scrub of that clip — reversing
      // mid-way replays the same footage backward (smooth), never a clip jump.
      target = active === "exit" ? p * v.duration : (1 - p) * v.duration;

      if (reduce) {
        current = target;
        try { v.currentTime = current; } catch (_) {}
        draw();
        return;
      }
      if (!raf) raf = requestAnimationFrame(tick);
    }

    function onMetaExit() {
      if (readyExit) return;
      readyExit = true;
      vw = exit!.videoWidth;
      vh = exit!.videoHeight;
      if (hasRVFC) exit!.requestVideoFrameCallback(onFrame);
      // iOS Safari unlock
      exit!
        .play()
        .then(() => { exit!.pause(); exit!.currentTime = 0; resize(); })
        .catch(() => { try { exit!.currentTime = 0; } catch (_) {} resize(); });
    }

    function onMetaReturn() {
      if (readyReturn) return;
      readyReturn = true;
      ret!.pause();
      ret!.currentTime = 0;
    }

    posterImg.addEventListener("load", draw);
    exit.addEventListener("loadedmetadata", onMetaExit);
    ret.addEventListener("loadedmetadata",  onMetaReturn);
    exit.addEventListener("seeked", draw);
    ret.addEventListener("seeked",  draw);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", resize);

    if (exit.readyState >= 1) onMetaExit(); else exit.load();
    if (ret.readyState  >= 1) onMetaReturn(); else ret.load();

    resize();

    return () => {
      posterImg.removeEventListener("load", draw);
      exit.removeEventListener("loadedmetadata", onMetaExit);
      ret.removeEventListener("loadedmetadata",  onMetaReturn);
      exit.removeEventListener("seeked", draw);
      ret.removeEventListener("seeked",  draw);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", resize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      ref={trackRef}
      id="top"
      className="relative"
      style={{ height: "280svh" }}
    >
      {/* Sticky stage — pinned on screen for the whole track. Scroll through the
          runway scrubs the cat out; once the runway is consumed the pin releases
          and the page flows into the next section. */}
      <div
        className="sticky top-0 isolate"
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
        {/* Hidden source videos — decoded & seeked per frame, painted onto the
            canvas; never shown directly. Parked offscreen (left:-9999) with NO
            poster so a stray paint of the diorama first-frame can't leak as a
            box (see CAT-OVERLAY-BUGFIX fix #5). The canvas draws POSTER itself. */}
        <video
          ref={exitRef}
          src={EXIT_SRC}
          muted
          playsInline
          preload="auto"
          aria-hidden
          style={{ position: "absolute", left: -9999, top: 0, width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
        />
        <video
          ref={returnRef}
          src={RETURN_SRC}
          muted
          playsInline
          preload="auto"
          aria-hidden
          style={{ position: "absolute", left: -9999, top: 0, width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
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
      {/* Extended bottom fade — blends the hero into the next section */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg to-transparent"
        style={{ zIndex: 4, height: "30%" }}
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
          Based in Budapest, Hungary
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
      </div>
    </section>
  );
}
