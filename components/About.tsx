"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useDepthParallax } from "@/hooks/useDepthParallax";
import { asset } from "@/lib/asset";
import AboutCat from "./AboutCat";
import { ParallaxLayer } from "./ParallaxLayer";
import {
  GlowBlob,
  TypeSpecimen,
  NodeGraph,
  SwatchCluster,
  LayersPanel,
  PenToolCard,
  RulerCard,
} from "./motifs";
import { Reveal } from "./anim";

const CAPS = ["Product", "Brand", "Design Systems", "Prototyping", "Research"];

export default function About() {
  const P0 = useDepthParallax({ shift: 8, scrollRate: 20 }); // ambient
  const P3 = useDepthParallax({ shift: 46, scrollRate: 110, tilt: 3 }); // copy
  const CHAR = useDepthParallax({ shift: 24, scrollRate: 60, tilt: 2 }); // figure

  return (
    <section
      id="about"
      className="relative isolate overflow-hidden px-5 py-28 sm:px-8 sm:py-36"
      style={{ minHeight: "100svh", display: "flex", alignItems: "center" }}
    >
      {/* P0 — ambient cobalt glow (unchanged) */}
      <motion.div
        ref={P0.ref}
        style={P0.style}
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <GlowBlob style={{ top: "8%", right: "6%" }} size={680} opacity={0.16} />
        <GlowBlob style={{ bottom: "-10%", left: "-6%" }} size={520} opacity={0.1} />
      </motion.div>

      <div className="relative mx-auto grid w-full max-w-[1400px] items-center gap-10 lg:grid-cols-2">
        {/* LEFT COLUMN — unchanged copy (P3, drifts with cursor) */}
        <motion.div ref={P3.ref} style={P3.style} className="relative z-[2]">
          <Reveal>
            <p className="eyebrow">About</p>
            <h2 className="mt-6 max-w-2xl font-display text-[clamp(2rem,4.6vw,3.4rem)] font-semibold leading-[1.06] text-fg">
              The designer inside
              <br />
              their own <span className="text-accent-bright">system</span>.
            </h2>
            <div className="mt-7 max-w-xl space-y-4 text-[15px] leading-relaxed text-fg-muted">
              <p>
                I&rsquo;m Isnad Bin Omar — a senior product &amp; brand designer
                working research-led, from the first interview to the shipped
                interface.
              </p>
              <p>
                Currently Head of Design, building design systems and the teams
                that keep them honest. I care about interfaces that feel
                considered, never decorative.
              </p>
            </div>
            <ul className="mt-8 flex flex-wrap gap-2">
              {CAPS.map((c) => (
                <li
                  key={c}
                  className="rounded-full border border-card-stroke bg-card-fill px-4 py-1.5 text-[13px] text-fg/85"
                >
                  {c}
                </li>
              ))}
            </ul>
          </Reveal>
        </motion.div>

        {/* RIGHT — character depth scene */}
        <div
          className="relative isolate mx-auto h-[460px] w-full max-w-[560px] md:h-[560px] lg:h-[640px]"
          style={{ perspective: 1100 }}
        >
          {/* behind tier (zIndex 1) ----------------------------------------- */}
          {/* cobalt rim glow directly behind the figure */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 -z-0 h-[70%] w-[60%] -translate-x-1/2 -translate-y-1/2"
            style={{
              zIndex: 1,
              background:
                "radial-gradient(closest-side, rgba(76,141,255,0.32), transparent 75%)",
              filter: "blur(36px)",
            }}
          />
          <ParallaxLayer
            ariaHidden
            opts={{ shift: 18, scrollRate: 45, invert: true }}
            className="absolute left-[1%] top-[5%]"
            style={{ zIndex: 1 }}
          >
            <TypeSpecimen style={{ width: 170, opacity: 0.92 }} />
          </ParallaxLayer>
          <ParallaxLayer
            ariaHidden
            opts={{ shift: 20, scrollRate: 48, invert: true }}
            className="absolute right-[0%] top-[16%] hidden md:block"
            style={{ zIndex: 1 }}
          >
            <NodeGraph style={{ width: 210, opacity: 0.9 }} />
          </ParallaxLayer>
          <ParallaxLayer
            ariaHidden
            opts={{ shift: 16, scrollRate: 42, invert: true }}
            className="absolute bottom-[16%] left-[-2%] hidden lg:block"
            style={{ zIndex: 1 }}
          >
            <LayersPanel style={{ width: 186, opacity: 0.92 }} />
          </ParallaxLayer>

          {/* character (zIndex 2) ------------------------------------------ */}
          <motion.div
            ref={CHAR.ref}
            style={{ ...CHAR.style, zIndex: 2 }}
            className="absolute bottom-0 left-1/2 w-[230px] -translate-x-1/2 md:w-[320px] lg:w-[400px]"
          >
            {/* contact shadow / floor glow under the feet */}
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-2 left-1/2 h-10 w-[80%] -translate-x-1/2 rounded-[50%]"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(0,0,0,0.55), rgba(76,141,255,0.12) 60%, transparent 80%)",
                filter: "blur(8px)",
              }}
            />
            <Image
              src={asset("/about/isnad-character.png")}
              alt="Isnad Bin Omar holding a laptop"
              width={1024}
              height={1535}
              priority={false}
              loading="lazy"
              sizes="(max-width: 768px) 230px, (max-width: 1024px) 320px, 400px"
              className="relative h-auto w-full select-none drop-shadow-[0_24px_40px_rgba(0,0,0,0.5)]"
            />
          </motion.div>

          {/* front tier (zIndex 3) — overlaps the figure -------------------- */}
          <ParallaxLayer
            ariaHidden
            opts={{ shift: 34, scrollRate: 90 }}
            className="absolute left-[10%] top-[30%]"
            style={{ zIndex: 3 }}
          >
            <SwatchCluster warm style={{ width: 196 }} />
          </ParallaxLayer>
          <ParallaxLayer
            ariaHidden
            opts={{ shift: 40, scrollRate: 100 }}
            className="absolute bottom-[8%] right-[8%] hidden md:block"
            style={{ zIndex: 3 }}
          >
            <RulerCard style={{ width: 210 }} />
          </ParallaxLayer>
          <ParallaxLayer
            ariaHidden
            opts={{ shift: 46, scrollRate: 110 }}
            className="absolute right-[2%] top-[6%] hidden lg:block"
            style={{ zIndex: 3 }}
          >
            <PenToolCard style={{ width: 200 }} />
          </ParallaxLayer>
          <ParallaxLayer
            ariaHidden
            opts={{ shift: 38, scrollRate: 95 }}
            className="absolute bottom-[24%] left-[16%] hidden lg:block"
            style={{ zIndex: 3 }}
          >
            <TypeSpecimen style={{ width: 140 }} />
          </ParallaxLayer>
        </div>
      </div>

      {/* the hero cat, grounded bottom-left under the copy — scroll-scrubbed */}
      <AboutCat />
    </section>
  );
}
