import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lightgrey-cattle-160990.hostingersite.com",
      },
    ],
  },
  // Añade esta sección:
  experimental: {
    optimizePackageImports: ["react-icons"],
  },
};

export default withBundleAnalyzer(nextConfig);