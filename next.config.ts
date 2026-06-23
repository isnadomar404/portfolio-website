import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/portfolio-website",
  assetPrefix: "/portfolio-website/",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default nextConfig;
