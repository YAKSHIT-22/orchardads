import type { NextConfig } from 'next';

// Content Security Policy (adapted from handyAds). Next injects inline styles/JSON
// so 'unsafe-inline' stays; fonts come from next/font (self-hosted) so no Google
// font hosts are needed. connect-src allows the TikTok Business API + same-origin.
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  font-src 'self' data:;
  img-src 'self' data: https:;
  connect-src 'self' https://business-api.tiktok.com https:;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
`.replace(/\n/g, '');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: ContentSecurityPolicy },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
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
    serverActions: {
      allowedOrigins: ['www.orchardads.in', 'orchardads.in'],
    },
  },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

export default nextConfig;
