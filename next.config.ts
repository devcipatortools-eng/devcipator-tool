import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Category ids differ from their nav labels ("PDF", "Utilities"); send the guessable URLs to the real ones.
  async redirects() {
    return [
      { source: "/category/pdf", destination: "/category/document", permanent: true },
      { source: "/category/utilities", destination: "/category/utility", permanent: true },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
