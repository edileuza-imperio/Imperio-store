import type { NextConfig } from "next";

import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  /*
   * --------------------------------------------------------------------------
   * IMAGENS
   * --------------------------------------------------------------------------
   */
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "api.universoimperio.test",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.universoimperio.test",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "imperio.com.br",
        port: "",
      },
      {
        protocol: "https",
        hostname: "imperio.com.br",
        port: "",
      },
      {
        protocol: "http",
        hostname: "www.imperio.com.br",
        port: "",
      },
      {
        protocol: "https",
        hostname: "www.imperio.com.br",
        port: "",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "80",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "80",
        pathname: "/**",
      },
    ],
    qualities: [75, 80],
    dangerouslyAllowLocalIP: true,
  },

  /*
   * --------------------------------------------------------------------------
   * DESENVOLVIMENTO
   * --------------------------------------------------------------------------
   */
  allowedDevOrigins: [
    "imperio.com.br",
    "www.imperio.com.br",
    "localhost",
    "127.0.0.1",
    "universoimperio.test",
    "api.universoimperio.test",
  ],

  /*
   * --------------------------------------------------------------------------
   * EXPERIMENTAL
   * --------------------------------------------------------------------------
   */
  experimental: {
    optimizePackageImports: ["react-icons"],
    scrollRestoration: true,
  },

  /*
   * --------------------------------------------------------------------------
   * COMPILER
   * --------------------------------------------------------------------------
   */
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default withBundleAnalyzer(nextConfig);
