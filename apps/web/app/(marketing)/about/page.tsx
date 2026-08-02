const PRINCIPLES = [
  ['Show the change before it happens', 'The Action Ledger renders the exact before/after diff. You approve facts, not vibes.'],
  ['The AI never holds the keys', 'The model explains pre-computed evidence and drafts proposals. Deterministic code does the arithmetic and the writing.'],
  ['Creators are part of the media plan', 'Discovery, briefs and Spark Ads sit next to budget and bid changes - not in a separate tool with its own login.'],
  ['Compliance is a control, not a footnote', 'TikTok data retention is enforced in code. Platform fees are shown apart from spend, always.'],
];

const WHY_TIKTOK = [
  ['A single, deep integration', 'TikTok exposes ads, creators, measurement and commerce through one API surface. We went deep on it instead of wide across four platforms.'],
  ['No percentage tax on spend', 'Fixed, transparent pricing that scales with accounts and seats - not a cut of your media budget.'],
  ['Built for the creator economy', 'On TikTok the creative comes from creators. A tool that only optimizes the ad account is optimizing half the problem.'],
];

export default function AboutPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-16 sm:px-10 sm:py-20">
      <header className="flex flex-col gap-3">
        <span className="font-ui text-[11px] font-semibold uppercase tracking-[0.22em] text-iris/80">About</span>
        <h1 className="font-display text-4xl leading-tight tracking-[-0.02em] text-ink sm:text-5xl">
          One AI media-buyer for TikTok Ads - and the creators behind the ads.
        </h1>
        <p className="font-ui text-[15px] leading-6 text-ink-muted">
          TikTok carries enormous, fast-growing ad budget and, unlike Google or Meta, almost no
          independent optimization tooling built for how the platform actually works: performance
          driven by creative, creative driven by creators. OrchardAds is a single, TikTok-native
          workspace for media buyers and agencies - diagnostics, safe one-click actions, and a
          creator + Spark Ads workflow, in one place, without a cut of your spend.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-[20px] text-ink">Why TikTok, specifically</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {WHY_TIKTOK.map(([h, b]) => (
            <div key={h} className="flex flex-col gap-1 rounded-2xl border border-rule bg-paper p-4">
              <span className="font-ui text-[13px] font-semibold text-ink">{h}</span>
              <p className="font-ui text-[12px] leading-4 text-ink-muted">{b}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-[20px] text-ink">What we believe</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PRINCIPLES.map(([h, b]) => (
            <div key={h} className="flex flex-col gap-1 rounded-2xl border border-rule bg-paper p-4">
              <span className="font-ui text-[13px] font-semibold text-ink">{h}</span>
              <p className="font-ui text-[12px] leading-4 text-ink-muted">{b}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-[20px] text-ink">How we ship</h2>
        <p className="font-ui text-[14px] leading-6 text-ink-muted">
          One core system, focused on TikTok end to end: ad accounts, creators, tracking and
          commerce, through the scopes TikTok's own API exposes. Every tool declares the scope it
          needs, so the roadmap grows as a registry, not a rewrite - and a connection missing a
          scope gets an explained empty state instead of a broken screen.
        </p>
        <p className="font-ui text-[14px] leading-6 text-ink-muted">
          The near-term wedge is narrow on purpose: TikTok Ads plus TikTok creators, done deeply,
          rather than four ad platforms done shallowly. Depth on one platform is what makes the
          diagnostics trustworthy enough to act on.
        </p>
      </section>
    </main>
  );
}
