"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { scrollToSection } from "@/lib/lenis";

const LINKS = [
  { id: "about", label: "About" },
  { id: "work", label: "Work" },
  { id: "photography", label: "Photography" },
  { id: "contact", label: "Contact" },
];

export default function Nav() {
  const [active, setActive] = useState<string>("");
  const [open, setOpen] = useState(false);

  // Section-aware active state — drives the dot indicator.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    LINKS.forEach((l) => {
      const el = document.getElementById(l.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // Close the mobile menu on scroll or Escape.
  useEffect(() => {
    if (!open) return;
    const onScroll = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const go = (id: string) => {
    setOpen(false);
    scrollToSection(id);
  };

  const pillShadow =
    "inset 0 1px 0 rgba(255,255,255,0.08), 0 22px 60px -24px rgba(0,0,0,0.85), 0 0 44px -16px rgba(76,141,255,0.35)";

  return (
    <header
      className="pointer-events-none flex flex-col items-center px-4 pt-4 sm:pt-5"
      // Inline position beats the unlayered `body > *` rule in globals.css
      // (which would otherwise force position:relative / z-index:1 on this
      // direct body child and stop the nav from staying fixed).
      style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50 }}
    >
      {/* Floating glass pill */}
      <nav
        aria-label="Primary"
        className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/10 bg-[rgba(11,15,26,0.6)] px-2 py-2 backdrop-blur-xl backdrop-saturate-150"
        style={{ boxShadow: pillShadow }}
      >
        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="flex h-10 w-10 items-center justify-center rounded-full text-fg/80 transition-colors hover:bg-white/5 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 md:hidden cursor-pointer"
        >
          <span className="relative block h-4 w-5">
            <span
              className={`absolute left-0 block h-0.5 w-5 rounded-full bg-current transition-all duration-300 ${
                open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0.5"
              }`}
            />
            <span
              className={`absolute left-0 top-1/2 block h-0.5 w-5 -translate-y-1/2 rounded-full bg-current transition-all duration-200 ${
                open ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 block h-0.5 w-5 rounded-full bg-current transition-all duration-300 ${
                open ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0.5"
              }`}
            />
          </span>
        </button>

        {/* Desktop links */}
        <ul className="hidden items-center sm:flex">
          {LINKS.map((l) => {
            const isActive = active === l.id;
            return (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => go(l.id)}
                  aria-current={isActive ? "true" : undefined}
                  className={`relative rounded-full px-4 pb-3 pt-2 text-sm transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 cursor-pointer ${
                    isActive ? "text-fg" : "text-fg/70"
                  }`}
                >
                  {l.label}
                  <span
                    aria-hidden
                    className={`absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-accent transition-all duration-300 ${
                      isActive ? "scale-100 opacity-100" : "scale-0 opacity-0"
                    }`}
                  />
                </button>
              </li>
            );
          })}
        </ul>

        {/* Let's Talk CTA */}
        <button
          type="button"
          onClick={() => go("contact")}
          className="group ml-1 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] py-1.5 pl-4 pr-1.5 text-sm text-fg transition-colors hover:border-accent/50 hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 cursor-pointer"
        >
          <span>Let&rsquo;s Talk</span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-white transition-transform duration-300 group-hover:rotate-45">
            <ArrowRight className="h-4 w-4" />
          </span>
        </button>
      </nav>

      {/* Mobile dropdown */}
      {open && (
        <div
          className="pointer-events-auto mt-2 w-[min(92vw,320px)] overflow-hidden rounded-3xl border border-white/10 bg-[rgba(11,15,26,0.9)] p-2 backdrop-blur-xl sm:hidden"
          style={{ boxShadow: "0 24px 60px -24px rgba(0,0,0,0.9)" }}
        >
          <ul className="flex flex-col">
            {LINKS.map((l) => {
              const isActive = active === l.id;
              return (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => go(l.id)}
                    aria-current={isActive ? "true" : undefined}
                    className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-base transition-colors hover:bg-white/5 cursor-pointer ${
                      isActive ? "text-fg" : "text-fg/80"
                    }`}
                  >
                    {l.label}
                    <span
                      aria-hidden
                      className={`h-1.5 w-1.5 rounded-full bg-accent transition-opacity ${
                        isActive ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </header>
  );
}
