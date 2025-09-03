import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    allowedDevOrigins: ['*.replit.dev', '*.pike.replit.dev']
  }
};

export default nextConfig;
