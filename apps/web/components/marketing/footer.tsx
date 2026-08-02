import Link from 'next/link';

const COLS: { title: string; links: [string, string][] }[] = [
  { title: 'Product', links: [['Overview', '/product'], ['Pricing', '/pricing'], ['Onboarding', '/onboarding']] },
  { title: 'Company', links: [['About', '/about'], ['Contact', '/contact']] },
  { title: 'Creators', links: [['Creator discovery', '/product'], ['Spark Ads', '/product']] },
  { title: 'Trust', links: [['Action Ledger', '/product'], ['No percentage of spend', '/pricing']] },
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
            The AI media-buyer and creator OS for TikTok Ads: diagnostics, safe one-click
            changes, and Spark Ads - without a cut of your spend.
          </p>
          <span
            className="mt-1 flex w-fit items-center gap-1.5 border-l-[3px] bg-paper px-2 py-0.5"
            style={{ borderLeftColor: 'var(--p-tiktok)', borderRadius: 'var(--r-sm)' }}
          >
            <span className="font-data text-[10px] font-medium text-ink-muted">TikTok Ads - Live</span>
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-4 sm:gap-10">
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
            OrchardAds - TikTok Ads optimization and creator OS. Not affiliated with TikTok.
          </span>
        </div>
      </div>
    </footer>
  );
}
