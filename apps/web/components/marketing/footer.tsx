import Link from 'next/link';

const COLS: { title: string; links: [string, string][] }[] = [
  { title: 'Product', links: [['Overview', '/product'], ['Pricing', '/pricing'], ['Onboarding', '/onboarding']] },
  { title: 'Company', links: [['About', '/about'], ['Contact', '/contact']] },
  { title: 'Platforms', links: [['TikTok', '/product']] },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-rule bg-paper-sunk">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-8 px-6 py-12 sm:flex-row sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-iris font-display text-sm text-white">
              O
            </span>
            <span className="font-display text-[15px] text-ink">OrchardAds</span>
          </div>
          <p className="max-w-xs font-ui text-[12px] text-ink-muted">
            One AI media-buyer workspace for TikTok Ads.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-10">
          {COLS.map((c) => (
            <div key={c.title} className="flex flex-col gap-2">
              <span className="text-label text-ink-faint">{c.title}</span>
              {c.links.map(([label, href]) => (
                <Link key={label} href={href} className="font-ui text-[12px] text-ink-muted hover:text-ink">
                  {label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-rule">
        <div className="mx-auto max-w-[1120px] px-6 py-4">
          <span className="font-data text-[11px] text-ink-faint">
            OrchardAds - Emerging Ads Optimization OS. Not affiliated with TikTok.
          </span>
        </div>
      </div>
    </footer>
  );
}
