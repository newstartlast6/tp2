import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['*.replit.dev', '*.pike.replit.dev', '*.janeway.replit.dev', '*.riker.replit.dev', '127.0.0.1'],
  serverExternalPackages: [
    "@sparticuz/chromium", 
    "puppeteer-core", 
    "puppeteer-extra", 
    "puppeteer-extra-plugin-stealth"
  ],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude problematic packages from client-side bundling
      config.externals = [
        ...(config.externals || []),
        'puppeteer-extra',
        'puppeteer-extra-plugin-stealth',
        'clone-deep',
        'merge-deep'
      ];
    }
    
    // Handle dynamic requires
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
    };
    
    return config;
  },
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
