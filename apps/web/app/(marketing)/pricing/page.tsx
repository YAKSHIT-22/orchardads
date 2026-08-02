import { PricingTable } from '@/components/marketing/pricing-table';

export default function PricingPage() {
  return (
    <main className="mx-auto flex max-w-[1120px] flex-col gap-10 px-6 py-16">
      <header className="flex flex-col items-center gap-3 text-center">
        <span className="text-label text-iris">Pricing</span>
        <h1 className="max-w-[20ch] font-display text-[clamp(1.8rem,4vw,2.6rem)] leading-tight text-ink">
          One simple price. No tax on your spend.
        </h1>
        <p className="max-w-[56ch] font-ui text-[14px] text-ink-muted">
          You pay for connected ad accounts - not per platform, and never a percentage of media
          spend. An account is one TikTok advertiser account. Use any
          tool on any connected account.
        </p>
      </header>

      <PricingTable />

      <section className="rounded-lg border border-rule bg-paper-sunk p-6">
        <h2 className="mb-3 font-display text-[18px] text-ink">Why one simple price</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            ['Unified workspace', 'Every tool works across every connected account, so one meter - accounts - is honest.'],
            ['No spend tax', 'Percentage-of-spend pricing punishes you for scaling. A flat fee does not.'],
            ['Fees shown separately', 'Platform fees are always displayed apart from media spend - a discipline we apply everywhere.'],
          ].map(([h, b]) => (
            <div key={h} className="flex flex-col gap-1">
              <span className="font-ui text-[13px] font-semibold text-ink">{h}</span>
              <p className="font-ui text-[12px] text-ink-muted">{b}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
