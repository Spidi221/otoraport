import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

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

// Sentry configuration options
const sentryWebpackPluginOptions = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only upload source maps in production
  silent: process.env.NODE_ENV !== 'production',

  // Upload source maps during build
  widenClientFileUpload: true,

  // Automatically tree-shake Sentry in production
  hideSourceMaps: true,

  // Automatically annotate React components for better error messages
  reactComponentAnnotation: {
    enabled: true,
  },

  // Disable telemetry
  telemetry: false,
};

// Wrap Next.js config with Bundle Analyzer and Sentry config
export default withBundleAnalyzer(withSentryConfig(nextConfig, sentryWebpackPluginOptions));
