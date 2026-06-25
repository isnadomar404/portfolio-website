# Portfolio Handoff — Isnad Bin Omar
> `~/Desktop/portfolio` · Next.js 16 + TypeScript + Tailwind v4 · Static export → GitHub Pages
> Live: https://isnadomar404.github.io/portfolio-website/

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 App Router, `output: "export"` (static) |
| Language | TypeScript strict |
| Styling | Tailwind v4 + custom CSS in `app/globals.css` |
| Animation | Framer Motion 12 + GSAP 3 + Lenis smooth scroll |
| 3D | @react-three/fiber + @react-three/drei + Three.js |
| Deploy | GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`) |

---

## File Map

```
app/
  layout.tsx          Root layout — fonts (Archivo, Space Grotesk, Press Start 2P), Lenis, Nav
  page.tsx            Home: Hero → About → SelectedWork → Photography → Testimonials → QuackShot → Contact
  globals.css         All CSS custom properties, glass/neon utilities, marquee, case-card deck, reduced-motion
  work/page.tsx       /work — infinite vertical gallery of case-study cards
  photography/page.tsx /photography — infinite vertical photo gallery

components/
  Hero.tsx            Scroll-scrubbed cat exit (canvas + hidden video, requestVideoFrameCallback)
  About.tsx           Depth-parallax character scene + copy, hosts <AboutCat />
  AboutCat.tsx        Transparent VP9 cat overlay, scrubbed by About section scroll
  SelectedWork.tsx    Sticky stacked case-study deck (framer-motion useScroll)
  CaseCard.tsx        Single sticky card — scale/brightness recede as next card covers it
  Photography.tsx     MY LENS section — masonry preview + "View full gallery" CTA
  InfiniteGallery.tsx Used by /work and /photography pages — infinite vertical masonry scroll
  QuackShot.tsx       QUACK SHOT game showcase — full-width image, pixel font, parallax
  Testimonials.tsx    Infinite horizontal marquee — two rows, hover-pause + focus highlight
  Contact.tsx         Get in Touch section — warm CTA, social links
  Nav.tsx             Sticky nav with section-aware active dot
  SmoothScroll.tsx    Lenis wrapper (client component, wraps children)
  ParallaxLayer.tsx   Thin wrapper around useDepthParallax for motif cards
  motifs.tsx          Decorative design-tool SVG cards (TypeSpecimen, NodeGraph, SwatchCluster, …)
  anim.tsx            <Reveal> fade-up wrapper

hooks/
  useDepthParallax.ts  Scroll + pointer-driven parallax — returns { ref, style }

lib/
  asset.ts            asset("/path") helper — prepends NEXT_PUBLIC_BASE_PATH for GitHub Pages
  caseStudies.ts      CaseStudy type + 4 entries (FileSure, Lumi, Traço, Strata)
  photos.ts           Photo manifest for /photography gallery
  projects.ts         Project list for /work gallery
  testimonials.ts     Testimonials data

public/
  about/isnad-character.png     Standing character PNG (1024×1535)
  images/quack-shot-game.jpg    QUACK SHOT title screen crop (1600×1243)
  images/projects/              4 case-study cover JPGs (filesure / lumi / traco / strata)
  photography/                  photo-001.jpg … photo-052.jpg + named hero shots
  video/
    cat-exit-scrub.mp4          Hero cat walk-out (scroll scrubbed on canvas)
    cat-poster.jpg              Hero cat poster (first paint)
    cat-sleep.webm              About cat — VP9+alpha all-keyframe (v3, 12MB)
    cat-sleep-poster.png        About cat poster — tight transparent crop
```

---

## Critical Patterns

### `asset()` — image paths on GitHub Pages
`next/image` does NOT auto-prepend `basePath` to `src`. Every image `src` must go through:
```ts
import { asset } from "@/lib/asset";
<Image src={asset("/images/foo.png")} … />
```
`asset()` prepends `NEXT_PUBLIC_BASE_PATH` (set to `/portfolio-website` in the Actions build step).

### basePath wiring (`next.config.ts`)
```ts
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export default { output: "export", basePath: basePath || undefined, assetPrefix: basePath ? `${basePath}/` : undefined }
```

### Hero cat — scroll-scrubbed canvas
`Hero.tsx` uses a hidden `<video>` seeked per frame, painted onto a `<canvas>` via `requestVideoFrameCallback`. The visible element is the canvas, not the video. The right-rail dots have a vertical fill line (`railFillRef`) driven by scroll progress in `onScroll()` — runs BEFORE the `ready` guard so it updates even before the video loads.

### About cat — transparent VP9 overlay
`AboutCat.tsx` measures scroll against `wrapRef.current?.offsetParent` (the `<section position:relative>`). `loadedmetadata` + `readyState >= 1` guard handles both cold and cached loads. No `autoplay`, no `loop` — cat is always frozen unless the user is actively scrolling.

### Sticky stacked card deck
`SelectedWork.tsx` wraps cards in a `useScroll` target. Each `CaseCard` is `position:sticky` with `top: calc(96px + i*14px)`, `margin-bottom: 17vh` (scroll runway), and framer-motion `scale`/`filter` recede driven by `scrollYProgress`. The ambient glow sits in a SIBLING div (not an ancestor) — putting `overflow:hidden` in an ancestor breaks `position:sticky`.

### Turbopack CSS cache
When adding new CSS rule blocks, `rm -rf .next` is required before `npm run dev`. Turbopack can cache stale compiled CSS and new rules won't appear otherwise.

---

## Deploy

Push to `main` → GitHub Actions runs `.github/workflows/deploy.yml` → builds with `NEXT_PUBLIC_BASE_PATH=/portfolio-website` → deploys to `gh-pages` branch → live in ~90 seconds.

```bash
git push origin main
```

To build locally with the same base path:
```bash
NEXT_PUBLIC_BASE_PATH=/portfolio-website npm run build
```

---

## What still needs real content

| Placeholder | File to edit |
|---|---|
| Case study covers (FileSure, Lumi, Traço, Strata) | Replace `public/images/projects/*.png` with real screenshots |
| Case study metadata (year, metrics, link) | `lib/caseStudies.ts` |
| Photography images | Replace `public/photography/photo-001…052.jpg` with real shots |
| Testimonials (names, quotes, companies) | `lib/testimonials.ts` |
| Projects list on /work | `lib/projects.ts` |
| Contact email / social handles | `components/Contact.tsx` |
| Hero video | `public/video/cat-exit-scrub.mp4` (currently the cat-exit clip drives the whole hero) |

---

## QUACK SHOT section

The QUACK SHOT game showcase lives in `components/QuackShot.tsx`. It is intentionally kept separate from the game codebase at `~/Desktop/claude`. It pulls a single static screenshot (`public/images/quack-shot-game.jpg`) and the Press Start 2P pixel font (loaded in `app/layout.tsx`). The game itself is a completely separate project — see `QUACK-SHOT-HANDOFF.md` in `~/Desktop/claude/` for that codebase.
