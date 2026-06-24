"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { asset } from "@/lib/asset";

export type GalleryImage = { src: string; alt: string; tint?: string };

/**
 * Masonry gallery with infinite vertical scroll.
 *  - Images only, no captions.
 *  - A sentinel near the bottom appends another batch as you scroll, looping
 *    the source set endlessly.
 *  - Hovering any tile highlights it and dims the rest (.gallery-grid CSS).
 */
export default function InfiniteGallery({
  images,
  initialBatches = 2,
  fit = "cover",
}: {
  images: GalleryImage[];
  initialBatches?: number;
  fit?: "cover" | "contain";
}) {
  const [batches, setBatches] = useState(initialBatches);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // cap so it can't grow without bound on very long sessions
          setBatches((b) => (b < 24 ? b + 1 : b));
        }
      },
      { rootMargin: "800px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const tiles: GalleryImage[] = [];
  for (let b = 0; b < batches; b++) tiles.push(...images);

  return (
    <>
      <div className="gallery-grid columns-2 gap-4 [column-fill:_balance] sm:columns-3 lg:columns-4">
        {tiles.map((img, i) => (
          <div
            key={i}
            className="gallery-item group relative mb-4 block break-inside-avoid overflow-hidden rounded-xl border border-card-stroke"
            style={fit === "contain" ? { backgroundColor: img.tint ?? "#0e1320" } : undefined}
          >
            <Image
              src={asset(img.src)}
              alt={img.alt}
              width={800}
              height={1000}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`h-auto w-full transition-transform duration-700 ease-out group-hover:scale-105 ${
                fit === "contain" ? "object-contain p-3" : "object-cover"
              }`}
            />
          </div>
        ))}
      </div>
      <div ref={sentinel} aria-hidden className="h-px w-full" />
    </>
  );
}
