import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb", // allow uploading several phone photos at once
    },
  },
};

export default nextConfig;