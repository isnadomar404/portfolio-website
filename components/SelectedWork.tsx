"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { caseStudies } from "@/lib/caseStudies";
import { useDepthParallax } from "@/hooks/useDepthParallax";
import { GlowBlob } from "./motifs";
import { Reveal } from "./anim";
import CaseCard from "./CaseCard";

export default function SelectedWork() {
  const P0 = useDepthParallax({ shift: 8, scrollRate: 20 });
  const stackRef = useRef<HTMLDivElement>(null);

  // Native-scroll progress across the whole stack runway. Drives recede/dim only.
  const { scrollYProgress } = useScroll({
    target: stackRef,
    offset: ["start start", "end end"],
  });

  return (
    <section id="work" className="relative isolate py-24 sm:py-32">
      {/* Ambient glow — clipped in its OWN sibling so it never sets overflow on
          an ancestor of the sticky cards (which would break position: sticky). */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <motion.div ref={P0.ref} style={P0.style} className="absolute inset-0">
          <GlowBlob style={{ top: "12%", left: "12%" }} size={560} opacity={0.12} />
          <GlowBlob style={{ bottom: "4%", right: "10%" }} size={620} opacity={0.1} />
        </motion.div>
      </div>

      <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-8">
        <Reveal className="mb-12 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Selected Work</p>
            <h2 className="mt-4 font-display text-[clamp(1.8rem,4vw,2.8rem)] font-semibold text-fg">
              Projects I&rsquo;m proud of
            </h2>
          </div>
          <Link href="/work" className="cta-minimal shrink-0 cursor-pointer">
            View all projects
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>

        {/* The deck: sticky siblings in one containing block so covered cards
            stay pinned beneath, peeking in a stepped edge. */}
        <div ref={stackRef} className="case-stack">
          {caseStudies.map((study, i) => (
            <CaseCard
              key={study.slug}
              study={study}
              index={i}
              total={caseStudies.length}
              progress={scrollYProgress}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
