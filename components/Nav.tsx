"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

const LINKS = [
  { id: "about", label: "About" },
  { id: "work", label: "Work" },
  { id: "photography", label: "Photography" },
  { id: "contact", label: "Contact" },
];

export default function Nav() {
  const [active, setActive] = useState<string>("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

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

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-[rgba(115,239,247,0.14)] bg-[rgba(11,15,26,0.55)] shadow-[0_8px_40px_-20px_rgba(76,141,255,0.5)] backdrop-blur-xl backdrop-saturate-150"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-end px-5 py-4 sm:px-8 sm:py-5">
        <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-9 md:flex">
          {LINKS.map((l) => (
            <li key={l.id}>
              <a
                href={`#${l.id}`}
                className="relative text-sm text-fg/80 transition-colors hover:text-fg"
              >
                {l.label}
                <span
                  className={`absolute -bottom-2 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-accent transition-opacity duration-300 ${
                    active === l.id ? "opacity-100" : "opacity-0"
                  }`}
                />
              </a>
            </li>
          ))}
        </ul>

        <a
          href="#contact"
          className="group flex items-center gap-2 rounded-full border border-rule bg-bg/40 py-1.5 pl-4 pr-1.5 text-sm text-fg backdrop-blur-sm transition-colors hover:border-accent cursor-pointer"
        >
          <span>Let&rsquo;s Talk</span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-white transition-transform duration-300 group-hover:rotate-45">
            <ArrowRight className="h-4 w-4" />
          </span>
        </a>
      </div>
    </nav>
  );
}
