import type { Platform } from '@adsos/core';

/** Per-connection feature flags. The UI reads this; it never assumes. sec 12.1. */
export type CapabilityManifest = {
  platform: Platform;
  apiVersion: string;
  resolvedAt: string; // ISO
  features: {
    // Reddit
    redditMax?: boolean; // limited availability
    redditCbo?: boolean;
    redditCommunityPostPromotion?: boolean;
    redditLandingPageOptimization?: boolean;
    // Spotify
    spotifyReservedBuying?: boolean; // unconfirmed at API level
    spotifyCapi?: boolean;
    // Snap
    snapAdsGallery?: boolean;
    snapPublicProfile?: boolean;
    // Pinterest
    pinterestTrends?: boolean;
    pinterestCatalogs?: boolean;
    pinterestStandardAccess?: boolean;
  };
  limits: RateLimitSpec[];
};

export type RateLimitSpec = {
  bucket: string;
  tokens: number;
  windowSeconds: number;
};

export type FeatureKey = keyof CapabilityManifest['features'];

export function hasFeature(m: CapabilityManifest, key: FeatureKey): boolean {
  return m.features[key] === true;
}
