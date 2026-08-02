import type { Metadata } from 'next';
import { Bricolage_Grotesque, IBM_Plex_Mono, Public_Sans } from 'next/font/google';
import './globals.css';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-bricolage-src',
});

const publicSans = Public_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-public-sans-src',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-plex-mono-src',
});

export const metadata: Metadata = {
  title: 'OrchardAds - Emerging Ads Optimization OS',
  description:
    'One AI media-buyer workspace for TikTok Ads: diagnostics, recommendations, safe one-click actions, and rollback.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${publicSans.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
