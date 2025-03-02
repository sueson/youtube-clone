import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hekfgttq2b.ufs.sh",
      },
    ]
  }
};

export default nextConfig;
