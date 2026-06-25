"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { asset } from "@/lib/asset";
import type { CaseStudy } from "@/lib/caseStudies";
import { useHoverGlow } from "@/hooks/useHoverGlow";

/** px each covered card peeks above the one on top of it (the stepped edge). */
const STEP = 14;

/** Small SSR-safe matchMedia hook. */
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(query);
    setMatches(m.matches);
    const on = () => setMatches(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, [query]);
  return matches;
}

export default function CaseCard({
  study,
  index,
  total,
  progress,
}: {
  study: CaseStudy;
  index: number;
  total: number;
  /** scroll progress (0→1) of the whole stack */
  progress: MotionValue<number>;
}) {
  const isLast = index === total - 1;

  // The covering window for this card: from when it lands to when the next lands.
  const start = index / total;
  const end = (index + 1) / total;

  // Recede + dim as the NEXT card rises to cover this one. Last card stays full.
  // Hooks must run unconditionally — keep ranges flat for the top card.
  const scale = useTransform(progress, [start, end], isLast ? [1, 1] : [1, 0.94]);
  const filter = useTransform(
    progress,
    [start, end],
    isLast ? ["brightness(1)", "brightness(1)"] : ["brightness(1)", "brightness(0.65)"],
  );

  const isMobile = useMediaQuery("(max-width: 767px)");
  const reduce = useReducedMotion();
  const isStatic = isMobile || reduce;

  // Cursor-following cobalt glow — updates CSS vars --gx/--gy/--go on the card element.
  // useHoverGlow is a no-op under reduced-motion / coarse pointer.
  const glowRef = useHoverGlow<HTMLElement>();

  const card = (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-10 md:p-2">
      {/* text — left */}
      <div className="flex flex-col justify-center px-6 pt-7 md:px-8 md:py-10">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs tracking-widest text-accent">
            {String(index + 1).padStart(2, "0")}
          </span>
          {study.tags?.length ? (
            <div className="flex flex-wrap gap-2">
              {study.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-card-stroke bg-white/5 px-2.5 py-0.5 text-[11px] text-fg-muted"
                >
                  {t}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <h3 className="mt-4 font-display text-[clamp(1.7rem,3.4vw,2.6rem)] font-semibold leading-tight text-fg">
          {study.title}
        </h3>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-fg-muted">
          {study.context}
        </p>

        {/* two metrics */}
        <dl className="mt-7 flex gap-10">
          {study.metrics.slice(0, 2).map((m) => (
            <div key={m.label}>
              <dt className="text-[11px] uppercase tracking-[0.18em] text-fg-muted">
                {m.label}
              </dt>
              <dd className="mt-1 font-display text-xl font-semibold text-fg">
                {m.value}
              </dd>
            </div>
          ))}
        </dl>

        {study.link ? (
          <Link
            href={study.link}
            className="group mt-8 inline-flex w-fit items-center gap-1.5 text-sm font-medium text-accent-bright transition-colors hover:text-fg"
          >
            View case study
            <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        ) : null}
      </div>

      {/* screenshot — right (below on mobile) */}
      <div className="relative mx-4 mb-4 overflow-hidden rounded-2xl border border-card-stroke bg-[#0c1424] md:mx-0 md:mb-0 md:rounded-[18px]">
        <Image
          src={asset(study.cover)}
          alt={`${study.title} — product screenshot`}
          width={1200}
          height={900}
          sizes="(max-width: 767px) 90vw, 540px"
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );

  // Mobile / reduced-motion: plain card in normal flow — no sticky, no motion.
  if (isStatic) {
    return (
      <article
        ref={glowRef as React.Ref<HTMLElement>}
        className="case-card case-card--static relative mb-8 overflow-hidden rounded-3xl"
      >
        {card}
      </article>
    );
  }

  return (
    <motion.article
      ref={glowRef as React.Ref<HTMLElement>}
      className="case-card relative overflow-hidden rounded-3xl"
      style={{
        top: `calc(var(--nav-h, 96px) + ${index * STEP}px)`,
        zIndex: index + 1,
        scale,
        filter,
        transformOrigin: "center top",
        willChange: "transform",
      }}
    >
      {card}
    </motion.article>
  );
}
