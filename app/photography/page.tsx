import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import InfiniteGallery from "@/components/InfiniteGallery";
import SmoothScroll from "@/components/SmoothScroll";
import { photos } from "@/lib/photos";

export const metadata = {
  title: "Photography — Isnad Bin Omar",
};

export default function PhotographyGallery() {
  const images = photos.map((p) => ({ src: p.src, alt: p.alt }));

  return (
    <>
      <SmoothScroll />
      <main className="relative min-h-screen px-5 pb-24 pt-28 sm:px-8">
        <header className="fixed inset-x-0 top-0 z-50 border-b border-[rgba(115,239,247,0.12)] bg-[rgba(11,15,26,0.55)] backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-4 sm:px-8">
            <Link href="/#photography" className="cta-minimal cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <p className="font-display text-sm font-semibold tracking-tight text-fg">
              Photography
            </p>
            <span className="w-[72px]" aria-hidden />
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1500px]">
          <p className="eyebrow">My Lens</p>
          <h1 className="mb-10 mt-4 font-display text-[clamp(2rem,5vw,3.4rem)] font-semibold text-fg">
            Through the lens
          </h1>
          <InfiniteGallery images={images} fit="cover" />
        </div>
      </main>
    </>
  );
}
