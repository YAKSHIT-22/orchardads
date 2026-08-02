import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes with conflict resolution. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Platform identity colour variables - used ONLY in 3px rails and chips. */
export const PLATFORM_COLOR: Record<string, string> = {
  REDDIT: 'var(--p-reddit)',
  SPOTIFY: 'var(--p-spotify)',
  SNAP: 'var(--p-snap)',
  PINTEREST: 'var(--p-pinterest)',
};
