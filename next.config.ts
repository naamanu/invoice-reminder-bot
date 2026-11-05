import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "/" has no page of its own; send people to the clients list.
  async redirects() {
    return [{ source: "/", destination: "/clients", permanent: false }];
  },
  cacheComponents: true,
  partialPrefetching: true,
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
