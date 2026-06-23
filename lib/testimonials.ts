export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  company: string;
};

// ⚠ PLACEHOLDER CONTENT — replace with real testimonials before launch.
// Per the spec: "fabricated praise fails the moment a reviewer recognises it."
// These are neutral stand-ins so the layout is complete; swap names/roles/quotes.
export const PLACEHOLDER = true;

export const testimonials: Testimonial[] = [
  {
    quote:
      "Isnad turned a tangle of research into a system the whole team could build on. Calm, fast, and unusually clear about trade-offs.",
    name: "Sample Name",
    role: "Head of Product",
    company: "Placeholder Co.",
  },
  {
    quote:
      "The rare designer who ships. He owned the problem end to end and left us with a design language we still use every day.",
    name: "Sample Name",
    role: "Founder & CEO",
    company: "Placeholder Inc.",
  },
  {
    quote:
      "Thoughtful, research-led, and relentless about detail. Our activation numbers moved the week his redesign went live.",
    name: "Sample Name",
    role: "VP Design",
    company: "Placeholder Labs",
  },
  {
    quote:
      "He reads a product the way a good editor reads a draft — cutting what doesn't earn its place. The result felt inevitable.",
    name: "Sample Name",
    role: "Director of UX",
    company: "Placeholder Studio",
  },
  {
    quote:
      "Brought clarity to a roadmap three teams couldn't agree on. Six weeks later we shipped, and it just worked.",
    name: "Sample Name",
    role: "CPO",
    company: "Placeholder Ventures",
  },
  {
    quote:
      "Equal parts craftsman and systems thinker. The design language he set still scales cleanly two years on.",
    name: "Sample Name",
    role: "Engineering Lead",
    company: "Placeholder Tech",
  },
];
