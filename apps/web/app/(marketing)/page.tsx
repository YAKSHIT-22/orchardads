import { TOOLS, toolBySlug, toolsByCategory } from '@/lib/tools-registry';
import { Button } from '@adsos/ui';
import {
  ArrowRight,
  CircleDot,
  GitCompareArrows,
  ListChecks,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

const PLATFORMS = [{ name: 'TikTok Ads', color: 'var(--p-tiktok)', status: 'Live' }];

const LOOP = [
  ['Connect', 'OAuth into your TikTok Ads account. Tokens are encrypted; they never reach the browser.'],
  ['Diagnose', 'Delivery, pacing, tracking and creative-fatigue checks over a normalized TikTok data store.'],
  ['Recommend', 'Every opportunity as an Action Ledger: evidence, impact, risk, confidence.'],
  ['Approve', 'Preview the exact before/after diff. Guardrails and roles gate every change.'],
  ['Apply', 'One click writes through the official TikTok API, with a full audit trail and rollback.'],
  ['Learn', 'Outcomes are tracked from detected to evaluated, so the system earns trust.'],
];

const VERBS = [
  ['Monitor', 'Health, pacing, anomalies and tracking - across every campaign, always on.'],
  ['Optimize', 'Waste, budget, winners and losers as safe one-click actions.'],
  ['Automate', 'Rules that propose within guardrails, or push native TikTok automated rules.'],
  ['Report', 'Normalized metrics, true profitability, custom and scheduled reports.'],
  ['Analyze', 'Ask performance questions in plain language; every answer shows its query.'],
  ['AI', 'Explains evidence and drafts creative briefs - it never touches the keys.'],
];

const WHY = [
  [ShieldCheck, 'Safe by construction', 'Nothing writes to TikTok except through one action engine: policy, guardrails, approval, idempotency, rollback.'],
  [GitCompareArrows, 'You see every change first', 'The Action Ledger shows the exact field diff before you approve. Unchanged fields are shown too.'],
  [ListChecks, 'A full audit trail', 'Every applied change is frozen with the platform response - who approved it, when, and why.'],
  [RefreshCw, 'Reversible where it matters', 'Every action is labeled SAFE to HIGH risk, with a cooldown and a rollback plan before you apply.'],
];

const CREATOR_SLUGS = ['creator-to-spark', 'creator-discovery', 'spark-ads', 'creator-crm', 'comment-manager'];
const ECONOMICS_SLUGS = ['profitability', 'competitive-intel'];
const CREATOR_PIPELINE = ['Discover', 'Outreach', 'Brief', 'Spark Ad', 'Report'];

export default function Landing() {
  const categories = toolsByCategory().filter((g) => g.category !== 'Overview');
  const combinationCount = TOOLS.filter((t) => t.combination).length;
  const creatorTools = CREATOR_SLUGS.map((slug) => toolBySlug(slug)).filter(
    (t): t is NonNullable<typeof t> => Boolean(t),
  );
  const economicsTools = ECONOMICS_SLUGS.map((slug) => toolBySlug(slug)).filter(
    (t): t is NonNullable<typeof t> => Boolean(t),
  );

  return (
    <main>
      {/* Hero */}
      <section className="mx-auto flex max-w-[1120px] flex-col items-center gap-6 px-6 pt-20 pb-14 text-center">
        <span className="text-label text-iris">TikTok Ads optimization + creator OS</span>
        <h1 className="max-w-[18ch] font-display text-[clamp(2rem,5vw,3.4rem)] leading-[1.05] text-ink">
          One AI media-buyer for TikTok Ads.
        </h1>
        <p className="max-w-[60ch] font-ui text-[15px] leading-6 text-ink-muted">
          Diagnostics, recommendations and safe one-click changes for your ad accounts - plus
          creator discovery and Spark Ads in the same workspace. Connect TikTok and see exactly
          what needs attention, why, the expected impact, and the exact change before it ships.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/onboarding">
            <Button>
              Start free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/pricing">
            <Button variant="secondary">See pricing</Button>
          </Link>
        </div>
        <ul className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {PLATFORMS.map((p) => (
            <li
              key={p.name}
              className="flex items-center gap-2 border-l-[3px] bg-paper-sunk px-3 py-1.5"
              style={{ borderLeftColor: p.color, borderRadius: 'var(--r-sm)' }}
            >
              <span className="font-ui text-[13px] font-semibold text-ink">{p.name}</span>
              <span className="font-data text-[10px] text-applied">{p.status}</span>
            </li>
          ))}
        </ul>
        <p className="font-data text-[11px] text-ink-faint">
          {TOOLS.length} tools - {combinationCount} combination workflows - no percentage-of-spend fee
        </p>
      </section>

      {/* The loop */}
      <section className="border-y border-rule bg-paper-sunk">
        <div className="mx-auto max-w-[1120px] px-6 py-14">
          <div className="mb-8 flex items-center gap-2">
            <CircleDot className="h-4 w-4 text-iris" />
            <h2 className="font-display text-[22px] text-ink">Connect - diagnose - approve - apply - learn</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {LOOP.map(([title, body], i) => (
              <div key={title} className="flex flex-col gap-2 rounded-md border border-rule bg-paper p-4">
                <span className="font-data text-[11px] text-ink-faint">0{i + 1}</span>
                <span className="font-ui text-sm font-semibold text-ink">{title}</span>
                <p className="font-ui text-[12px] leading-4 text-ink-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Five verbs */}
      <section className="mx-auto max-w-[1120px] px-6 py-14">
        <div className="mb-8 flex flex-col gap-2">
          <span className="text-label text-ink-muted">One workspace, five jobs</span>
          <h2 className="font-display text-[22px] text-ink">Monitor, optimize, automate, report, analyze</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {VERBS.map(([h, b]) => (
            <div key={h} className="flex flex-col gap-1 rounded-md border border-rule bg-paper p-3">
              <span className="font-ui text-[13px] font-semibold text-ink">{h}</span>
              <p className="font-ui text-[11px] leading-4 text-ink-muted">{b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tool categories */}
      <section className="mx-auto max-w-[1120px] px-6 py-14">
        <div className="mb-8 flex items-end justify-between">
          <div className="flex flex-col gap-2">
            <span className="text-label text-ink-muted">The toolbox</span>
            <h2 className="font-display text-[22px] text-ink">
              {TOOLS.length} tools, one normalized TikTok data store
            </h2>
          </div>
          <Link href="/product" className="flex items-center gap-1 font-ui text-[13px] text-iris hover:underline">
            Explore all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((g) => (
            <div key={g.category} className="flex flex-col gap-2 rounded-md border border-rule bg-paper p-4">
              <div className="flex items-center justify-between">
                <span className="font-ui text-[13px] font-semibold text-ink">{g.category}</span>
                <span className="font-data text-[11px] text-ink-faint">{g.tools.length}</span>
              </div>
              <p className="font-ui text-[12px] leading-4 text-ink-muted">
                {g.tools
                  .slice(0, 3)
                  .map((t) => t.name)
                  .join(', ')}
                {g.tools.length > 3 ? `, +${g.tools.length - 3} more` : ''}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Creators + Spark Ads */}
      <section className="border-y border-rule bg-paper-sunk">
        <div className="mx-auto max-w-[1120px] px-6 py-14">
          <div className="mb-6 flex flex-col gap-2">
            <span className="text-label text-iris">Creators + Spark Ads</span>
            <h2 className="max-w-[42ch] font-display text-[22px] text-ink">
              Your AI creator manager for TikTok - not just an ad account optimizer.
            </h2>
            <p className="max-w-[64ch] font-ui text-[13px] leading-5 text-ink-muted">
              Optimizing an ad account is not enough on TikTok - the creative comes from creators.
              OrchardAds finds creators who fit your brand, drafts outreach on your behalf, turns
              their posts into Spark Ads, and reports the real GMV and profit behind every
              collaboration - not just platform ROAS. Every step lands in the same Action Ledger as
              every other change.
            </p>
          </div>
          <div className="mb-6 flex flex-wrap items-center gap-2" aria-label="creator to Spark Ad pipeline">
            {CREATOR_PIPELINE.map((step, i) => (
              <span key={step} className="flex items-center gap-2">
                <span className="rounded-sm border border-rule bg-paper px-2.5 py-1 font-ui text-[12px] font-medium text-ink">
                  {step}
                </span>
                {i < CREATOR_PIPELINE.length - 1 && (
                  <span className="text-ink-faint" aria-hidden>
                    -&gt;
                  </span>
                )}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {creatorTools.map((t) => {
              const Icon = t.icon;
              return (
                <div key={t.slug} className="flex flex-col gap-2 rounded-md border border-rule bg-paper p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-iris-wash text-iris">
                      <Icon className="h-4 w-4" />
                    </div>
                    {t.combination && (
                      <span className="rounded-sm bg-iris-wash px-1.5 py-0.5 text-label text-iris">combo</span>
                    )}
                  </div>
                  <span className="font-ui text-[13px] font-semibold text-ink">{t.name}</span>
                  <p className="font-ui text-[12px] leading-4 text-ink-muted">{t.description}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {economicsTools.map((t) => {
              const Icon = t.icon;
              return (
                <div key={t.slug} className="flex items-start gap-3 rounded-md border border-rule bg-paper p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-iris-wash text-iris">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-ui text-[13px] font-semibold text-ink">{t.name}</span>
                    <p className="font-ui text-[12px] leading-4 text-ink-muted">{t.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why safe - the Action Ledger */}
      <section className="mx-auto max-w-[1120px] px-6 py-14">
        <div className="mb-8 flex flex-col gap-2">
          <span className="text-label text-ink-muted">The Action Ledger</span>
          <h2 className="font-display text-[22px] text-ink">See the change before it happens.</h2>
          <p className="max-w-[64ch] font-ui text-[13px] leading-5 text-ink-muted">
            This is the one screen the product is remembered by. Every recommendation, everywhere
            in the workspace, renders the same way: the exact field diff, the evidence behind it,
            an impact estimate with a stated basis, and a risk label - before anything applies.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_1fr]">
          <div
            className="overflow-hidden rounded-md border border-rule border-l-[3px] bg-paper"
            style={{ borderLeftColor: 'var(--p-tiktok)' }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-rule px-4 py-2.5">
              <span className="text-label text-ink-muted">
                TIKTOK - AD GROUP - "US / Skincare / Conversions"
              </span>
            </div>
            <div className="flex flex-col gap-3 px-4 py-4">
              <div className="grid grid-cols-[110px_1fr] items-center gap-2">
                <span className="text-label text-ink-muted">daily_budget</span>
                <div className="flex flex-wrap items-center gap-2 font-data text-[13px]">
                  <span
                    className="rounded-sm px-1.5 py-0.5"
                    style={{ background: 'var(--diff-from-bg)', color: 'var(--diff-from-fg)' }}
                  >
                    800.00 USD
                  </span>
                  <span className="text-ink-faint" aria-hidden>
                    -&gt;
                  </span>
                  <span
                    className="rounded-sm px-1.5 py-0.5"
                    style={{ background: 'var(--diff-to-bg)', color: 'var(--diff-to-fg)' }}
                  >
                    1,000.00 USD
                  </span>
                  <span className="text-ink-faint">+25.0%</span>
                </div>
              </div>
              <div className="grid grid-cols-[110px_1fr] items-center gap-2">
                <span className="text-label text-ink-muted">bid_strategy</span>
                <div className="flex items-center gap-2 font-data text-[13px] text-ink-faint">
                  <span>LOWEST_COST</span>
                  <span aria-hidden>-&gt;</span>
                  <span>LOWEST_COST</span>
                  <span>(unchanged)</span>
                </div>
              </div>
              <div className="flex flex-col gap-1 border-t border-rule pt-3">
                <span className="text-label text-ink-faint">evidence</span>
                <p className="font-ui text-[12px] text-ink-muted">
                  CPA 11.40 USD over 14 d, 54 conversions - budget-capped 12 of 14 days
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-label text-ink-faint">estimate</span>
                <p className="font-ui text-[12px] text-ink">
                  +8 to +14 conversions / week <span className="text-ink-faint">confidence MEDIUM</span>
                </p>
                <p className="font-ui text-[11px] text-ink-faint">basis: trailing 14 d CVR held constant</p>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-rule pt-3">
                <span className="inline-flex items-center rounded-sm border border-applied/40 bg-applied-wash px-1.5 py-0.5 text-label text-applied">
                  risk LOW
                </span>
                <span className="font-ui text-[11px] text-ink-muted">reversible - cooldown 48 h</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {WHY.map(([Icon, title, body]) => {
              const I = Icon as typeof ShieldCheck;
              return (
                <div key={title as string} className="flex gap-3 rounded-md border border-rule bg-paper p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-iris-wash text-iris">
                    <I className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-ui text-sm font-semibold text-ink">{title as string}</span>
                    <p className="font-ui text-[12px] leading-4 text-ink-muted">{body as string}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1120px] px-6 py-16">
        <div className="flex flex-col items-center gap-4 rounded-lg border border-iris-edge bg-iris-wash px-6 py-12 text-center">
          <Sparkles className="h-5 w-5 text-iris" />
          <h2 className="max-w-[26ch] font-display text-[26px] leading-tight text-ink">
            Run TikTok Ads like a full-time media buyer never sleeps.
          </h2>
          <p className="max-w-[52ch] font-ui text-[13px] text-ink-muted">
            Free to start. No percentage of spend. Fixed, transparent pricing that scales with
            accounts, not your media budget - plus creator discovery and Spark Ads built in.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/onboarding">
              <Button>
                Start free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="secondary">See pricing</Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
