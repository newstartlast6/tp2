import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['*.replit.dev', '*.pike.replit.dev', '*.janeway.replit.dev', '*.riker.replit.dev', '127.0.0.1'],
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
