import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes with conflict resolution. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Platform identity colour variables - used ONLY in 3px rails and chips. */
export const PLATFORM_COLOR: Record<string, string> = {
  TIKTOK: 'var(--p-tiktok)',
};

/** Correct display casing for platform names (TikTok, not "Tiktok"). */
export const PLATFORM_LABEL: Record<string, string> = {
  TIKTOK: 'TikTok',
};

/** Falls back to title-case for platforms not yet in PLATFORM_LABEL. */
export function platformLabel(platform: string): string {
  return PLATFORM_LABEL[platform] ?? platform.charAt(0) + platform.slice(1).toLowerCase();
}
