"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { photos } from "@/lib/photos";
import { useDepthParallax } from "@/hooks/useDepthParallax";
import { GlowBlob } from "./motifs";
import { Reveal } from "./anim";

export default function Photography() {
  const P0 = useDepthParallax({ shift: 8, scrollRate: 20 });

  // 8 photos used in the bento grid
  const p = photos.slice(0, 8);

  return (
    <section
      id="photography"
      className="relative isolate overflow-hidden py-24 sm:py-32"
    >
      <motion.div
        ref={P0.ref}
        style={P0.style}
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <GlowBlob style={{ top: "10%", right: "8%" }} size={620} opacity={0.1} />
      </motion.div>

      <div className="mx-auto w-full max-w-[1400px] px-5 sm:px-8">
        <Reveal className="mb-12 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">My Lens</p>
            <h2 className="mt-4 font-display text-[clamp(1.8rem,4vw,2.8rem)] font-semibold text-fg">
              Photography
            </h2>
          </div>
          <Link href="/photography" className="cta-minimal shrink-0 cursor-pointer">
            View full gallery
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>

        {/* Large asymmetric bento — desktop uses grid-template-areas */}
        <Reveal y={30}>
          {/* Desktop bento */}
          <div
            className="gallery-grid hidden lg:grid"
            style={{
              gridTemplateColumns: "repeat(4, 1fr)",
              gridTemplateRows: "320px 240px 220px",
              gridTemplateAreas: `
                "a a b c"
                "a a d d"
                "e f g h"
              `,
              gap: "12px",
            }}
          >
            <Frame photo={p[0]} style={{ gridArea: "a" }} />
            <Frame photo={p[1]} style={{ gridArea: "b" }} />
            <Frame photo={p[2]} style={{ gridArea: "c" }} />
            <Frame photo={p[3]} style={{ gridArea: "d" }} />
            <Frame photo={p[4]} style={{ gridArea: "e" }} />
            <Frame photo={p[5]} style={{ gridArea: "f" }} />
            <Frame photo={p[6]} style={{ gridArea: "g" }} />
            <Frame photo={p[7]} style={{ gridArea: "h" }} />
          </div>

          {/* Mobile / tablet grid — 2 columns, 4 rows */}
          <div className="gallery-grid grid grid-cols-2 gap-3 lg:hidden">
            <Frame photo={p[0]} className="row-span-2 h-[320px] sm:h-[400px]" />
            <Frame photo={p[1]} className="h-[152px] sm:h-[192px]" />
            <Frame photo={p[2]} className="h-[152px] sm:h-[192px]" />
            <Frame photo={p[3]} className="col-span-2 h-[180px] sm:h-[220px]" />
            <Frame photo={p[4]} className="h-[150px] sm:h-[180px]" />
            <Frame photo={p[5]} className="h-[150px] sm:h-[180px]" />
            <Frame photo={p[6]} className="h-[150px] sm:h-[180px]" />
            <Frame photo={p[7]} className="h-[150px] sm:h-[180px]" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Frame({
  photo,
  className = "",
  style,
}: {
  photo: { src: string; alt: string };
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`gallery-item group relative overflow-hidden rounded-2xl border border-card-stroke ${className}`}
      style={style}
    >
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />
    </div>
  );
}
