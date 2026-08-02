import { Logo } from '@/components/brand/logo';
import Link from 'next/link';

const COLS: { title: string; links: [string, string][] }[] = [
  {
    title: 'Product',
    links: [
      ['Features', '/#features'],
      ['Product', '/product'],
      ['Pricing', '/pricing'],
      ['Get started', '/signup'],
    ],
  },
  { title: 'Company', links: [['About', '/about'], ['Contact', '/contact']] },
  { title: 'Creators', links: [['Creator discovery', '/product'], ['Spark Ads', '/product']] },
  { title: 'Legal', links: [['Privacy', '/privacy'], ['Terms', '/terms']] },
];

export function MarketingFooter() {
  return (
    <footer className="mt-auto w-full border-t border-rule bg-paper-sunk">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12 sm:px-10 sm:flex-row sm:justify-between">
        <div className="flex max-w-xs flex-col gap-3">
          <Logo width={128} className="h-7 w-auto" />
          <p className="font-ui text-[13px] leading-5 text-ink-muted">
            The AI media-buyer and creator OS for TikTok Ads: diagnostics, safe one-click
            changes, and Spark Ads - without a cut of your spend.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-4 sm:gap-10">
          {COLS.map((c) => (
            <div key={c.title} className="flex flex-col gap-2.5">
              <span className="text-label text-ink-faint">{c.title}</span>
              {c.links.map(([label, href]) => (
                <Link key={label} href={href} className="font-ui text-[13px] text-ink-muted hover:text-ink">
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-rule/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 sm:flex-row sm:px-10">
          <span className="font-data text-[11px] text-ink-faint">
            (c) {new Date().getFullYear()} OrchardAds. Not affiliated with TikTok.
          </span>
          <span className="font-data text-[11px] text-ink-faint">Built for TikTok performance marketers.</span>
        </div>
      </div>
    </footer>
  );
}
