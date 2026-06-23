"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Play, ExternalLink } from "lucide-react";
import { Reveal } from "./anim";
import { useDepthParallax } from "@/hooks/useDepthParallax";

const PLAY_URL = "https://isnadomar404.github.io/quack-shot-play/";

const PARAGRAPHS = [
  "I started with a finger-gun mechanic — great theme, bad gameplay. Thumb tracking was noisy, the pose got tiring fast, and firing wasn't intuitive. Switching to pinch (the same gesture used in Vision Pro and Quest) made the game instantly understandable. I also latched aim at pinch start so the finger curl wouldn't throw off shots.",
  "The bigger takeaway: abstract input from day one. My game logic only talks to an InputSource, so swapping mouse, keyboard, or webcam-hand controls required zero changes to game code.",
  "Built with Vite, Phaser 3, TypeScript, MediaPipe HandLandmarker, and AI-assisted workflows in Claude Code and Cursor.",
  "I spend a lot of time building games, interactive products, and AI-powered experiments. This project was a good reminder that the best technical decisions are often UX decisions first.",
];

const STACK = ["Vite", "Phaser 3", "TypeScript", "MediaPipe", "Claude Code"];

export default function QuackShot() {
  // Heavy scroll parallax — image drifts strongly on scroll only (no pointer tilt).
  const img = useDepthParallax({ scrollRate: 120 });
  const glow = useDepthParallax({ scrollRate: -90 });
  const heading = useDepthParallax({ scrollRate: 60, shift: 8 });

  return (
    <section className="relative isolate overflow-hidden py-24 sm:py-32">
      {/* Ambient warm bleed matching game palette — parallax drift */}
      <motion.div
        ref={glow.ref}
        style={glow.style}
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 40% at 50% 25%, rgba(239,125,87,0.12), transparent 70%), radial-gradient(50% 45% at 50% 85%, rgba(167,240,112,0.07), transparent 70%)",
          }}
        />
      </motion.div>

      <div className="mx-auto w-full max-w-[1400px] px-5 sm:px-8">
        {/* Full game title screen — rounded like the gallery images */}
        <Reveal y={50}>
          <motion.div
            ref={img.ref}
            style={img.style}
            className="relative w-full overflow-hidden rounded-3xl border border-[rgba(239,125,87,0.22)] shadow-[0_40px_120px_-40px_rgba(239,125,87,0.45)]"
          >
            <div className="relative w-full" style={{ aspectRatio: "1600 / 1243" }}>
              <Image
                src="/images/quack-shot-game.jpg"
                alt="QUACK SHOT — retro gesture-controlled Duck Hunt remake title screen, ducks flying over a meadow"
                fill
                sizes="(max-width: 1024px) 92vw, 1400px"
                className="object-cover"
                priority
              />
            </div>
          </motion.div>
        </Reveal>

        {/* Retro pixel title — between image and description, drifts on scroll */}
        <Reveal y={30}>
          <motion.h2
            ref={heading.ref}
            style={{
              ...heading.style,
              fontFamily: "var(--font-pixel)",
              fontSize: "clamp(2rem, 6vw, 4.5rem)",
              color: "#ffcd75",
              textShadow:
                "3px 3px 0 #b13e53, 6px 6px 0 #5d275d, 9px 9px 0 #1a1c2c",
            }}
            className="mt-14 uppercase leading-tight sm:mt-16"
          >
            QUACK SHOT
          </motion.h2>
        </Reveal>

        {/* Description below the title */}
        <Reveal y={30} className="mt-8 w-full max-w-[1120px]">
          <p className="mb-6 text-[11px] uppercase tracking-[0.22em] text-fg-muted">
            Rebuilding Duck Hunt as a webcam-gesture-controlled game
          </p>

          <div className="space-y-5">
            {PARAGRAPHS.map((p, i) => (
              <p key={i} className="text-base leading-relaxed text-fg-muted">
                {p}
              </p>
            ))}
          </div>

          {/* Stack pills */}
          <div className="mt-8 flex flex-wrap gap-2">
            {STACK.map((s) => (
              <span
                key={s}
                className="rounded-full border border-[rgba(239,125,87,0.20)] bg-[rgba(18,24,41,0.6)] px-3 py-1 text-[11px] text-fg-muted"
              >
                {s}
              </span>
            ))}
          </div>

          {/* Play Game CTA — left aligned */}
          <div className="mt-12">
            <a
              href={PLAY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex cursor-pointer items-center gap-3 rounded-full px-7 py-3.5 text-sm font-semibold text-[#1a1c2c] shadow-[0_0_40px_-10px_rgba(255,205,117,0.6)] transition-all duration-300 hover:shadow-[0_0_60px_-8px_rgba(255,205,117,0.5)]"
              style={{ backgroundColor: "#ffcd75" }}
            >
              <Play className="h-4 w-4 fill-[#1a1c2c] transition-transform duration-300 group-hover:scale-110" />
              Play Game
              <ExternalLink className="h-3.5 w-3.5 opacity-60" />
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
