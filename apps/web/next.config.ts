import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Workspace packages ship TypeScript source; let Next compile them.
  transpilePackages: [
    '@adsos/ai',
    '@adsos/automation',
    '@adsos/core',
    '@adsos/db',
    '@adsos/metrics',
    '@adsos/platform-core',
    '@adsos/platform-tiktok',
    '@adsos/policy-engine',
    '@adsos/recommendations',
    '@adsos/ui',
  ],
  experimental: {
    // Server actions origin check (CSRF) - set real domains in prod.
    serverActions: { allowedOrigins: ['localhost:3000', '127.0.0.1:3000'] },
  },
};

export default nextConfig;
