import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Suppress turbopack root warning
  experimental: {
    turbo: {
      root: process.cwd(),
    },
  },
};

export default nextConfig;
