// Prefix a public-folder asset path with the deployment basePath.
//
// next/image with `unoptimized` does NOT prepend `basePath` to the `src`, so on
// GitHub Pages (served under /portfolio-website/) every absolute "/foo.png" 404s.
// Wrap raw public paths with asset() at the call site to fix this in one place.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const asset = (path: string) =>
  path.startsWith("/") ? `${BASE}${path}` : path;
