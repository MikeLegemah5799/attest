import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // App Router bundles server-side imports by default (Next 16 docs,
  // guides/package-bundling.md). better-sqlite3 and canvas are already in
  // Next's default serverExternalPackages list; pdfjs-dist isn't, and its
  // Node-specific `fs`/`process.getBuiltinModule` calls in lib/pdf/ break if
  // bundled, so it's opted out here too.
  serverExternalPackages: ["pdfjs-dist"],
};

export default nextConfig;
