import type { Platform } from '@adsos/core';

/** Per-platform onboarding metadata. */
export type PlatformOnboarding = {
  platform: Platform;
  color: string;
  connectable: boolean;
  tagline: string;
  access: string;
  requirements: string[];
  connectHref?: string;
  phase: number;
};

export const ONBOARDING: Record<Platform, PlatformOnboarding> = {
  TIKTOK: {
    platform: 'TIKTOK',
    color: 'var(--p-tiktok)',
    connectable: true,
    tagline: 'Short-form video ads: creative-led performance at scale.',
    access: 'Register a TikTok for Business developer app; a sandbox lets you build and test without approval.',
    requirements: [
      'A TikTok For Business account',
      'A developer app (app_id + secret) with the Ads Management scope',
      'Redirect URI set to this app callback',
    ],
    connectHref: '/api/oauth/tiktok',
    phase: 1,
  },
};

export const ONBOARDING_LIST = [ONBOARDING.TIKTOK];
