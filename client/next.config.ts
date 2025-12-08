import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.pinimg.com",
      },
      {
        hostname: "icm-bucket.sfo3.digitaloceanspaces.com",
      },
    ],
  },
};

export default nextConfig;
