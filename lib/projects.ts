export type Project = {
  slug: string;
  title: string;
  /** short category pill */
  tag: string;
  /** one-line description shown on the card */
  blurb: string;
  category: string;
  year: number;
  cover: string;
  /** dominant tint used behind the contained thumbnail */
  tint: string;
};

export const projects: Project[] = [
  {
    slug: "filesure",
    title: "FileSure",
    tag: "Dashboard Design",
    blurb:
      "A clean, modern B2B data platform built for clarity at scale.",
    category: "B2B Data Platform — Web",
    year: 2026,
    cover: "/images/projects/filesure.png",
    tint: "#dbe6ff",
  },
  {
    slug: "lumi",
    title: "Lumi",
    tag: "UI/UX Design",
    blurb:
      "An eldercare companion with a calm, reassuring interface.",
    category: "Eldercare Companion — Product",
    year: 2026,
    cover: "/images/projects/lumi.png",
    tint: "#e9edf5",
  },
  {
    slug: "traco",
    title: "Traço",
    tag: "Branding & Visual Identity",
    blurb:
      "Modular car-system identity — print system and visual language.",
    category: "Modular Car System — Print",
    year: 2025,
    cover: "/images/projects/traco.png",
    tint: "#0c1626",
  },
  {
    slug: "strata",
    title: "Strata",
    tag: "Editorial & Print",
    blurb:
      "A dual-horizon editorial system with a bold typographic grid.",
    category: "Dual Horizon — Print",
    year: 2025,
    cover: "/images/projects/strata.png",
    tint: "#d8d2c4",
  },
];
