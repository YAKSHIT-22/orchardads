import { Button } from '@adsos/ui';
import Link from 'next/link';

const LINKS = [
  { href: '/product', label: 'Product' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1120px] items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-iris font-display text-sm text-white">
            O
          </span>
          <span className="font-display text-[15px] text-ink">OrchardAds</span>
          <span
            className="hidden items-center gap-1.5 border-l-[3px] bg-paper-sunk px-2 py-0.5 sm:flex"
            style={{ borderLeftColor: 'var(--p-tiktok)', borderRadius: 'var(--r-sm)' }}
          >
            <span className="font-data text-[10px] font-medium text-ink-muted">TikTok Ads</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-ui text-[13px] text-ink-muted transition-colors hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="hidden sm:block">
            <span className="font-ui text-[13px] text-ink-muted transition-colors hover:text-ink">Sign in</span>
          </Link>
          <Link href="/onboarding">
            <Button size="sm">Start free</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
