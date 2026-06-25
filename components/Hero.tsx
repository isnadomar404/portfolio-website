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
// idle-loop.mp4 plays continuously — the cat sits at the desk, never tied to scroll.
const SRC = `${BASE}/video/idle-loop.mp4`;
const POSTER = `${BASE}/video/cat-poster.jpg`;

/**
 * Hero — normal section (no sticky, no scroll-jack).
 *   • The video plays and loops on its own, independent of scroll.
 *   • The video layer drifts gently via useDepthParallax so it eases away as the
 *     section exits the viewport — but the actual page scroll is never slowed.
 *   • Parallax uses P0 tier values (scrollRate 35) matching the section exit feel.
 */
export default function Hero() {
  const hintRef = useRef<HTMLDivElement>(null);
  // Gentle exit drift — no pointer shift, no tilt, scroll-only
  const P_video = useDepthParallax({ scrollRate: 35 });

  useEffect(() => {
    const hint = hintRef.current;
    if (!hint) return;
    const onScroll = () => {
      hint.style.opacity = window.scrollY > 60 ? "0" : "1";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section
      id="top"
      className="relative isolate"
      style={{ height: "100svh", overflow: "hidden" }}
    >
      {/* Video layer — loops freely, drifts gently on exit */}
      <motion.div
        ref={P_video.ref}
        style={{ ...P_video.style, position: "absolute", inset: 0, zIndex: 1 }}
        aria-hidden
      >
        <video
          src={SRC}
          poster={POSTER}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
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
          Scroll to explore
        </span>
      </div>
    </section>
  );
}
