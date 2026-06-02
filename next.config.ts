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

  experimental: {
    optimizePackageImports: ["react-icons"],
    scrollRestoration: true,
  },

  // 🔥 ISSO AQUI AJUDA MUITO NO CSS CHUNKING
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default withBundleAnalyzer(nextConfig);