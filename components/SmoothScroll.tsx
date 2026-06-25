"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
    });

    // Drive ScrollTrigger from Lenis so parallax is perfectly in sync, and drive
    // Lenis from GSAP's single ticker so there's ONE rAF loop for the whole page.
    lenis.on("scroll", ScrollTrigger.update);
    const onTick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    // Late layout shifts (font swaps, lazy images, the case-card deck) move the
    // document height after ScrollTrigger captured its start/end positions, which
    // makes reveals fire early/late. Refresh — debounced — whenever the body
    // resizes or the page finishes loading so triggers stay accurate.
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => ScrollTrigger.refresh();
    const scheduleRefresh = () => {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(refresh, 200);
    };
    const ro = new ResizeObserver(scheduleRefresh);
    ro.observe(document.body);
    window.addEventListener("load", refresh);

    return () => {
      window.removeEventListener("load", refresh);
      ro.disconnect();
      clearTimeout(refreshTimer);
      gsap.ticker.remove(onTick);
      lenis.destroy();
    };
  }, []);

  return null;
}
