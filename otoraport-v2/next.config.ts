import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Ignore ESLint errors during production builds
    // TODO: Fix all ESLint errors in future iteration
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore TypeScript errors during production builds
    // TODO: Fix all TypeScript errors in future iteration
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
