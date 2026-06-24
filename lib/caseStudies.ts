// Case studies for the sticky stacked-card "Selected Work" deck.
//
// These reuse the real projects in lib/projects.ts (the owner's actual work).
// The two `metrics` per card are FACTUAL metadata (discipline + year) — not
// invented outcome numbers. Swap them for real impact metrics when available;
// keep exactly two so the card layout stays balanced.

export type CaseStudy = {
  slug: string;
  title: string;
  /** one-sentence context/summary */
  context: string;
  /** exactly two — { label, value } */
  metrics: { label: string; value: string }[];
  /** /public path to the product screenshot */
  cover: string;
  tags?: string[];
  link?: string;
};

export const caseStudies: CaseStudy[] = [
  {
    slug: "filesure",
    title: "FileSure",
    context:
      "A clean, modern B2B data platform built for clarity at scale.",
    metrics: [
      { label: "Discipline", value: "Dashboard Design" },
      { label: "Year", value: "2026" },
    ],
    cover: "/images/projects/filesure.png",
    tags: ["Product", "Web App"],
    link: "/work",
  },
  {
    slug: "lumi",
    title: "Lumi",
    context:
      "An eldercare companion with a calm, reassuring interface.",
    metrics: [
      { label: "Discipline", value: "UI/UX Design" },
      { label: "Year", value: "2026" },
    ],
    cover: "/images/projects/lumi.png",
    tags: ["Product", "Mobile"],
    link: "/work",
  },
  {
    slug: "traco",
    title: "Traço",
    context:
      "Modular car-system identity — print system and visual language.",
    metrics: [
      { label: "Discipline", value: "Brand Identity" },
      { label: "Year", value: "2025" },
    ],
    cover: "/images/projects/traco.png",
    tags: ["Branding", "Print"],
    link: "/work",
  },
  {
    slug: "strata",
    title: "Strata",
    context:
      "A dual-horizon editorial system with a bold typographic grid.",
    metrics: [
      { label: "Discipline", value: "Editorial & Print" },
      { label: "Year", value: "2025" },
    ],
    cover: "/images/projects/strata.png",
    tags: ["Editorial", "Print"],
    link: "/work",
  },
];
