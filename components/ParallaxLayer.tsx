"use client";

import { motion } from "framer-motion";
import { useDepthParallax, type PlaneOpts } from "@/hooks/useDepthParallax";

// One depth-plane wrapper = one useDepthParallax instance (so each card/figure
// moves independently — no lockstep). Spreads transform motion values onto a
// motion.div while keeping static positioning (position/inset/zIndex) intact.
export function ParallaxLayer({
  opts,
  className,
  style,
  children,
  ariaHidden,
}: {
  opts: PlaneOpts;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  ariaHidden?: boolean;
}) {
  const p = useDepthParallax(opts);
  return (
    <motion.div
      ref={p.ref}
      aria-hidden={ariaHidden}
      className={className}
      style={{ ...style, ...p.style }}
    >
      {children}
    </motion.div>
  );
}
