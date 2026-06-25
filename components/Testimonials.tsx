"use client";

import { motion } from "framer-motion";
import { useDepthParallax } from "@/hooks/useDepthParallax";
import { testimonials, PLACEHOLDER, type Testimonial } from "@/lib/testimonials";
import { GlowBlob, QuoteMark } from "./motifs";
import { Reveal } from "./anim";

function Card({ t }: { t: Testimonial }) {
  return (
    <figure className="marquee-card glass relative mx-3 flex h-full w-[340px] shrink-0 flex-col rounded-2xl p-6 sm:w-[400px]">
      <span
        aria-hidden
        className="font-display text-5xl leading-none text-neon-cyan-bright/70"
      >
        &ldquo;
      </span>
      <blockquote className="mt-2 flex-1 text-[15px] leading-relaxed text-fg/90">
        {t.quote}
      </blockquote>
      <figcaption className="mt-6 border-t border-card-stroke pt-4">
        <p className="font-display text-sm font-semibold text-fg">{t.name}</p>
        <p className="mt-0.5 text-[13px] text-fg-muted">
          {t.role} · {t.company}
        </p>
      </figcaption>
    </figure>
  );
}

export default function Testimonials() {
  const P0 = useDepthParallax({ shift: 8, scrollRate: 20 });
  const P1 = useDepthParallax({ shift: 18, scrollRate: 45, invert: true });

  // Duplicate the list once so the -50% keyframe loops seamlessly.
  const belt = [...testimonials, ...testimonials];

  return (
    <section
      id="testimonials"
      className="relative isolate overflow-hidden py-28 sm:py-36"
    >
      {/* P0 — soft cobalt glow */}
      <motion.div
        ref={P0.ref}
        style={P0.style}
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <GlowBlob
          style={{ top: "30%", left: "50%", transform: "translateX(-50%)" }}
          size={760}
          opacity={0.12}
        />
      </motion.div>

      {/* P1 — oversized ghosted quotation mark (the through-line motif) */}
      <motion.div
        ref={P1.ref}
        style={P1.style}
        aria-hidden
        className="pointer-events-none absolute -z-[5] hidden lg:block"
      >
        <QuoteMark
          style={{
            position: "absolute",
            top: "2%",
            left: "8%",
            width: 460,
            height: 360,
            opacity: 0.18,
          }}
        />
      </motion.div>

      <div className="mx-auto w-full max-w-[1400px] px-5 sm:px-8">
        <Reveal className="mb-12 text-center">
          <p className="eyebrow justify-center">Testimonials</p>
          <h2 className="mt-4 font-display text-[clamp(1.8rem,4vw,2.8rem)] font-semibold text-fg">
            Words from people I&rsquo;ve built with
          </h2>
          {PLACEHOLDER && (
            <p className="mt-3 text-[12px] uppercase tracking-[0.2em] text-accent-sharp/80">
              Placeholder quotes — replace before launch
            </p>
          )}
        </Reveal>
      </div>

      {/* Infinite marquee belt — auto-scrolls; hover pauses + focuses a card.
          Edge masks fade cards in/out so the loop seam is invisible. */}
      <div
        className="marquee-row relative w-full overflow-hidden py-6"
        style={{
          maskImage:
            "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
          WebkitMaskImage:
            "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
        }}
      >
        <div className="marquee-track" style={{ ["--marquee-duration" as string]: "52s" }}>
          {belt.map((t, i) => (
            <Card key={i} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}
