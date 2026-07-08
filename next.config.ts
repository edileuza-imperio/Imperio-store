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
          hostname: "api.universoimperio.com.br",
        },
        {
          protocol: "https",
          hostname: "universoimperio.com.br",
        },
      ],
      qualities: [75, 80],
    },

    async rewrites() {
      return [
        {
          source: "/api/v1/:path*",
          destination: "https://api.universoimperio.com.br/api/v1/:path*",
        },
        {
          source: "/upload/:path*",
          destination: "https://api.universoimperio.com.br/upload/:path*",
        },
      ];
    },

    experimental: {
      optimizePackageImports: ["react-icons"],
      scrollRestoration: true,
    },

    compiler: {
      removeConsole: process.env.NODE_ENV === "production",
    },
  };

  export default withBundleAnalyzer(nextConfig);