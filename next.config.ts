import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lightgrey-cattle-160990.hostingersite.com",
      },
    ],
  },
};

export default nextConfig;