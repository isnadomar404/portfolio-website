import type { NextConfig } from "next";

// Single source of truth for the deployment subpath. The GitHub Pages workflow
// sets NEXT_PUBLIC_BASE_PATH=/portfolio-website at build time; locally it's
// empty so dev runs at "/". asset() (lib/asset.ts) reads the same var, so image
// paths and basePath always stay in sync.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath: basePath || undefined,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
