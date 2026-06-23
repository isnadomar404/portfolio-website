"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MapPin, Clock, Send, ArrowUp } from "lucide-react";
import { useDepthParallax } from "@/hooks/useDepthParallax";
import { GlowBlob } from "./motifs";
import { Reveal } from "./anim";

const INFO = [
  {
    icon: Mail,
    label: "Email",
    value: "hello@isnadbinomar.com",
    href: "mailto:hello@isnadbinomar.com",
  },
  { icon: MapPin, label: "Location", value: "Dhaka, Bangladesh" },
  { icon: Clock, label: "Availability", value: "Open for new projects" },
];

const PROJECT_TYPES = [
  "UI/UX Design",
  "Branding & Identity",
  "Web Design",
  "Product Design",
  "Something else",
];

// Brand icons (Simple Icons paths) — lucide-react dropped social/brand glyphs.
type IconProps = { className?: string };
const Svg = ({ className = "", d }: IconProps & { d: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
    <path d={d} />
  </svg>
);
const InstagramIcon = ({ className }: IconProps) => (
  <Svg
    className={className}
    d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"
  />
);
const DribbbleIcon = ({ className }: IconProps) => (
  <Svg
    className={className}
    d="M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.12-10.358c-.35-.11-3.17-.953-6.384-.438 1.34 3.684 1.887 6.684 1.992 7.308 2.3-1.555 3.936-4.02 4.395-6.87zm-6.115 7.808c-.153-.9-.75-4.032-2.19-7.77l-.066.02c-5.79 2.015-7.86 6.025-8.04 6.4 1.73 1.358 3.92 2.166 6.29 2.166 1.42 0 2.77-.29 4-.814zm-11.62-2.58c.232-.4 3.045-5.055 8.332-6.765.135-.045.27-.084.405-.12-.26-.585-.54-1.167-.832-1.74C7.17 11.775 2.206 11.71 1.756 11.7l-.004.312c0 2.633.998 5.037 2.634 6.855zm-2.42-8.955c.46.008 4.683.026 9.477-1.248-1.698-3.018-3.53-5.558-3.8-5.928-2.868 1.35-5.01 3.99-5.676 7.17zM9.6 2.052c.282.38 2.145 2.914 3.822 6 3.645-1.365 5.19-3.44 5.373-3.702-1.81-1.61-4.19-2.586-6.795-2.586-.825 0-1.63.1-2.4.285zm10.335 3.483c-.218.29-1.935 2.493-5.724 4.04.24.49.47.985.68 1.486.08.18.15.36.22.53 3.41-.43 6.8.26 7.14.33-.02-2.42-.88-4.64-2.31-6.38z"
  />
);
const LinkedInIcon = ({ className }: IconProps) => (
  <Svg
    className={className}
    d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"
  />
);
const BehanceIcon = ({ className }: IconProps) => (
  <Svg
    className={className}
    d="M7.799 5.698c.589 0 1.12.051 1.606.156.483.102.9.273 1.245.507.348.235.612.547.804.939.188.387.281.871.281 1.443 0 .619-.141 1.137-.421 1.551-.284.413-.7.751-1.255 1.014.756.218 1.32.602 1.694 1.146.374.546.557 1.203.557 1.976 0 .625-.117 1.164-.354 1.62a3.075 3.075 0 01-.969 1.114c-.408.294-.87.513-1.385.658a6.05 6.05 0 01-1.594.215H0V5.698h7.799zm-.218 4.844c.481 0 .878-.114 1.192-.345.312-.228.463-.604.463-1.119 0-.286-.051-.522-.151-.707a1.118 1.118 0 00-.405-.434 1.683 1.683 0 00-.589-.225 3.336 3.336 0 00-.692-.06H3.448v2.889h4.133v.006zm.227 5.083c.267 0 .521-.026.763-.077.241-.052.453-.137.636-.261.182-.12.328-.286.437-.495.106-.21.16-.479.16-.804 0-.638-.18-1.094-.539-1.366-.359-.273-.833-.407-1.426-.407H3.448v3.41h4.36v.006zM19.054 5.713c-.628.628-1.054 1.495-1.279 2.604h6.118c-.094-1.066-.477-1.92-1.155-2.563-.674-.643-1.547-.967-2.616-.967-.484 0-.926.062-1.328.182zm5.949 6.298v1.018h-7.341c0 .867.238 1.508.715 1.929.476.421 1.05.629 1.721.629.504 0 .936-.123 1.295-.371.36-.246.581-.471.667-.674h2.563c-.41 1.272-1.038 2.181-1.886 2.732-.847.547-1.872.821-3.077.821a6.06 6.06 0 01-2.258-.405 4.766 4.766 0 01-1.708-1.146 5.236 5.236 0 01-1.078-1.794c-.252-.7-.379-1.475-.379-2.319 0-.819.13-1.581.387-2.281.258-.7.626-1.305 1.103-1.812a5.078 5.078 0 011.703-1.196c.662-.292 1.394-.438 2.193-.438.893 0 1.673.173 2.34.519a4.755 4.755 0 011.665 1.4c.448.589.768 1.265.969 2.024.135.508.205 1.115.205 1.831zM15.296 6.831h5.731V5.434h-5.731v1.397z"
  />
);

const SOCIALS = [
  { label: "Instagram", href: "https://instagram.com", Icon: InstagramIcon },
  { label: "Dribbble", href: "https://dribbble.com", Icon: DribbbleIcon },
  { label: "LinkedIn", href: "https://linkedin.com", Icon: LinkedInIcon },
  { label: "Behance", href: "https://behance.net", Icon: BehanceIcon },
];

export default function Contact() {
  const [sent, setSent] = useState(false);

  const P0 = useDepthParallax({ shift: 6, scrollRate: 18 });

  return (
    <section
      id="contact"
      className="relative isolate overflow-hidden px-5 pt-28 sm:px-8 sm:pt-36"
    >
      {/* ambient cobalt glow rising from the bottom */}
      <motion.div
        ref={P0.ref}
        style={P0.style}
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <GlowBlob
          style={{ bottom: "-30%", left: "50%", transform: "translateX(-50%)" }}
          size={920}
          opacity={0.16}
        />
      </motion.div>

      <div className="mx-auto w-full max-w-[1400px]">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* LEFT — intro + info + socials */}
          <Reveal className="lg:col-span-5">
            <p className="eyebrow">Let&rsquo;s Connect</p>
            <h2 className="mt-5 font-display text-[clamp(2.2rem,5.5vw,3.6rem)] font-semibold leading-[1.0] text-fg">
              Get in touch
            </h2>
            <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-fg-muted">
              Got a project, a role, or a half-formed idea? I&rsquo;m open to new
              work and good conversations.
            </p>

            <ul className="mt-8 space-y-3">
              {INFO.map((item) => (
                <li key={item.label}>
                  <div className="glass neon-hover flex items-center gap-4 rounded-xl p-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-neon-cyan-bright">
                      <item.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-[12px] uppercase tracking-[0.14em] text-fg-muted">
                        {item.label}
                      </p>
                      {item.href ? (
                        <a
                          href={item.href}
                          className="text-[15px] text-fg transition-colors hover:text-neon-cyan-bright cursor-pointer"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-[15px] text-fg">{item.value}</p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <ul className="mt-7 flex gap-3">
              {SOCIALS.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    aria-label={label}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="glass neon-hover flex h-11 w-11 items-center justify-center rounded-lg text-fg-muted transition-colors hover:text-neon-cyan-bright cursor-pointer"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>

          {/* RIGHT — form */}
          <Reveal y={30} className="lg:col-span-7">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
              className="glass rounded-2xl p-6 sm:p-8"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-[13px] text-fg-muted"
                  >
                    Your name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="John Doe"
                    className="w-full rounded-xl border border-card-stroke bg-bg/40 px-4 py-3 text-sm text-fg placeholder:text-fg-muted/60 outline-none transition-colors focus:border-neon-cyan/50"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-[13px] text-fg-muted"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-card-stroke bg-bg/40 px-4 py-3 text-sm text-fg placeholder:text-fg-muted/60 outline-none transition-colors focus:border-neon-cyan/50"
                  />
                </div>
              </div>

              <div className="mt-5">
                <label
                  htmlFor="ptype"
                  className="mb-2 block text-[13px] text-fg-muted"
                >
                  Project type
                </label>
                <select
                  id="ptype"
                  name="ptype"
                  defaultValue=""
                  className="w-full rounded-xl border border-card-stroke bg-bg/40 px-4 py-3 text-sm text-fg outline-none transition-colors focus:border-neon-cyan/50"
                >
                  <option value="" disabled>
                    Select a type
                  </option>
                  {PROJECT_TYPES.map((t) => (
                    <option key={t} value={t} className="bg-panel text-fg">
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-5">
                <label
                  htmlFor="message"
                  className="mb-2 block text-[13px] text-fg-muted"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  placeholder="Tell me about your project..."
                  className="w-full resize-none rounded-xl border border-card-stroke bg-bg/40 px-4 py-3 text-sm text-fg placeholder:text-fg-muted/60 outline-none transition-colors focus:border-neon-cyan/50"
                />
              </div>

              <button
                type="submit"
                className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-accent-bright cursor-pointer"
                style={{ boxShadow: "0 0 30px -6px rgba(76,141,255,0.6)" }}
              >
                {sent ? "Message sent" : "Send Message"}
                <Send className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </button>
              {sent && (
                <p className="mt-3 text-sm text-neon-cyan-bright" role="status">
                  Thanks — I&rsquo;ll get back to you soon.
                </p>
              )}
            </form>
          </Reveal>
        </div>

        {/* Footer */}
        <footer className="mt-24 flex flex-col items-center justify-between gap-3 border-t border-card-stroke py-6 text-[13px] text-fg-muted sm:flex-row">
          <span className="font-display text-sm font-semibold tracking-tight text-fg">
            ISNAD BIN OMAR
          </span>
          <span>© 2026 Isnad Bin Omar. All rights reserved.</span>
          <a
            href="#top"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-fg cursor-pointer"
          >
            Back to top
            <ArrowUp className="h-4 w-4" />
          </a>
        </footer>
      </div>
    </section>
  );
}
