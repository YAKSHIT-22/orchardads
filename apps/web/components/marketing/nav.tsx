import { Logo } from '@/components/brand/logo';
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
        <div className="flex items-center gap-3">
          <Logo width={128} className="h-7 w-auto" />
        </div>
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
        <div className="flex items-center gap-4">
          <Link
            href="/signin"
            className="hidden font-ui text-[13px] font-medium text-ink-muted transition-colors hover:text-ink sm:block"
          >
            Sign in
          </Link>
          <Link href="/signup">
            <Button className="h-10 rounded-full px-6 text-sm">Get started</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
