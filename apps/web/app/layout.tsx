import type { Metadata } from 'next';
import { IBM_Plex_Mono, Space_Grotesk, Urbanist } from 'next/font/google';
import './globals.css';

// Display face (headings) - handyAds uses Space Grotesk.
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-bricolage-src',
});

// UI / body face - handyAds uses Urbanist.
const urbanist = Urbanist({
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
  title: 'OrchardAds - TikTok Ads Optimization OS',
  description:
    'One AI media-buyer workspace for TikTok Ads: diagnostics, recommendations, safe one-click actions, creator discovery and Spark Ads.',
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${urbanist.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
