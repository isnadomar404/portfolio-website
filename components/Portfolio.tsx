"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { projects, type Project } from "@/lib/projects";
import { useDepthParallax } from "@/hooks/useDepthParallax";
import { asset } from "@/lib/asset";
import { GlowBlob } from "./motifs";
import { Reveal } from "./anim";

function ProjectCard({ p }: { p: Project }) {
  return (
    <article className="marquee-card glass relative mx-3 flex w-[300px] shrink-0 flex-col overflow-hidden rounded-2xl sm:w-[340px]">
      {/* image thumbnail */}
      <div
        className="relative flex aspect-[4/3] items-center justify-center overflow-hidden"
        style={{ backgroundColor: p.tint }}
      >
        <Image
          src={asset(p.cover)}
          alt={`${p.title} — ${p.category}`}
          fill
          sizes="340px"
          className="object-contain p-2"
        />
      </div>

      {/* meta */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-semibold text-fg">{p.title}</h3>
        <span className="mt-2 inline-flex w-fit rounded-md border border-card-stroke bg-white/5 px-2.5 py-1 text-[11px] text-fg/80">
          {p.tag}
        </span>
        <p className="mt-3 flex-1 text-[13px] leading-relaxed text-fg-muted">
          {p.blurb}
        </p>
        <Link
          href="/work"
          className="group mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-neon-cyan-bright transition-colors hover:text-fg"
        >
          View case study
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </article>
  );
}

export default function Portfolio() {
  const P0 = useDepthParallax({ shift: 10, scrollRate: 24 });

  // Duplicate so the -50% marquee keyframe loops seamlessly.
  const belt = [...projects, ...projects, ...projects];

  return (
    <section
      id="work"
      className="relative isolate overflow-hidden bg-bg-elev py-24 sm:py-32"
    >
      {/* P0 — glow blobs */}
      <motion.div
        ref={P0.ref}
        style={P0.style}
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <GlowBlob style={{ top: "20%", left: "12%" }} size={560} opacity={0.12} />
        <GlowBlob style={{ bottom: "0%", right: "10%" }} size={620} opacity={0.1} />
      </motion.div>

      <div className="mx-auto w-full max-w-[1400px] px-5 sm:px-8">
        <Reveal className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">My Work</p>
            <h2 className="mt-4 font-display text-[clamp(1.8rem,4vw,2.8rem)] font-semibold text-fg">
              Projects I&rsquo;m proud of
            </h2>
          </div>
          <Link href="/work" className="cta-minimal shrink-0 cursor-pointer">
            View all projects
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
      </div>

      {/* Auto-scrolling belt — hover pauses + focuses a card */}
      <div
        className="marquee-row relative w-full overflow-hidden py-6"
        style={{
          maskImage:
            "linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)",
          WebkitMaskImage:
            "linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)",
        }}
      >
        <div
          className="marquee-track"
          style={{ ["--marquee-duration" as string]: "60s" }}
        >
          {belt.map((p, i) => (
            <ProjectCard key={`${p.slug}-${i}`} p={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
