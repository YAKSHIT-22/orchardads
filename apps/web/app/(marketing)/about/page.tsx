const PRINCIPLES = [
  ['Show the change before it happens', 'The Action Ledger renders the exact before/after diff. You approve facts, not vibes.'],
  ['The AI never holds the keys', 'The model explains pre-computed evidence and drafts proposals. Deterministic code does the arithmetic and the writing.'],
  ['Independent, not a reseller of platform AI', 'We normalize four platforms into one store and diagnose them impartially.'],
  ['Compliance is a control, not a footnote', 'Per-platform data retention is enforced in code. Fees are shown apart from spend.'],
];

export default function AboutPage() {
  return (
    <main className="mx-auto flex max-w-[760px] flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-3">
        <span className="text-label text-iris">About</span>
        <h1 className="font-display text-[clamp(1.8rem,4vw,2.6rem)] leading-tight text-ink">
          Enterprise-grade optimization for the channels enterprise tools skip.
        </h1>
        <p className="font-ui text-[15px] leading-6 text-ink-muted">
          TikTok carries enormous ad budget and comparatively little independent optimization tooling.
          The incumbents chase Google and Meta. OrchardAds is built for media buyers and agencies who
          spend on emerging channels and want an instrument, not another dashboard template.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-[20px] text-ink">What we believe</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PRINCIPLES.map(([h, b]) => (
            <div key={h} className="flex flex-col gap-1 rounded-md border border-rule bg-paper p-4">
              <span className="font-ui text-[13px] font-semibold text-ink">{h}</span>
              <p className="font-ui text-[12px] leading-4 text-ink-muted">{b}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-[20px] text-ink">How we ship</h2>
        <p className="font-ui text-[14px] leading-6 text-ink-muted">
          One core system, focused on TikTok first, because it has the clearest
          near-term wedge - and the architecture adds any frictionless emerging channel as an adapter into an already-proven
          optimization engine. Everything is built for four platforms but exercised by one, so a
          premature abstraction reveals itself early and cheaply.
        </p>
      </section>
    </main>
  );
}
