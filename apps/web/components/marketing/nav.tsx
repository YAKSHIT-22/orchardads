import { Button } from '@adsos/ui';
import Link from 'next/link';

const LINKS = [
  { href: '/#features', label: 'Features' },
  { href: '/product', label: 'Product' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
];

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-rule/60 bg-paper/80 py-4 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 sm:px-10">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-iris font-display text-sm text-white">
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
        <nav className="hidden items-center gap-7 md:flex">
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
        <div className="flex items-center gap-2.5">
          <Link
            href="/signin"
            className="hidden px-2 font-ui text-[13px] font-medium text-ink-muted transition-colors hover:text-ink sm:block"
          >
            Sign in
          </Link>
          <Link href="/signup">
            <Button size="sm" className="rounded-full px-5">
              Get started
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
