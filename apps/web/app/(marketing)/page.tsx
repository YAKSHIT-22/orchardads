import { TOOLS, toolBySlug, toolsByCategory } from '@/lib/tools-registry';
import { Button } from '@adsos/ui';
import {
  ArrowRight,
  ChevronRight,
  CircleDot,
  GitCompareArrows,
  ListChecks,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

const LOOP = [
  ['Connect', 'OAuth into your TikTok Ads account. Tokens are encrypted; they never reach the browser.'],
  ['Diagnose', 'Delivery, pacing, tracking and creative-fatigue checks over a normalized TikTok data store.'],
  ['Recommend', 'Every opportunity as an Action Ledger: evidence, impact, risk, confidence.'],
  ['Approve', 'Preview the exact before/after diff. Guardrails and roles gate every change.'],
  ['Apply', 'One click writes through the official TikTok API, with a full audit trail and rollback.'],
  ['Learn', 'Outcomes are tracked from detected to evaluated, so the system earns trust.'],
];

const STEPS = [
  { step: '01', title: 'Sign up', desc: 'Create your workspace with email verification in under two minutes.' },
  { step: '02', title: 'Connect TikTok', desc: 'OAuth into your TikTok Ads account through the official API. Keys are encrypted at rest.' },
  { step: '03', title: 'Sync 30 days', desc: 'The first sync pulls 30 days of campaign, ad group, ad and tracking data.' },
  { step: '04', title: 'Optimize', desc: 'Review the Action Ledger, approve what you like, and let Autopilot handle the rest.' },
];

const WHY = [
  [ShieldCheck, 'Safe by construction', 'Nothing writes to TikTok except through one action engine: policy, guardrails, approval, idempotency, rollback.'],
  [GitCompareArrows, 'You see every change first', 'The Action Ledger shows the exact field diff before you approve. Unchanged fields are shown too.'],
  [ListChecks, 'A full audit trail', 'Every applied change is frozen with the platform response - who approved it, when, and why.'],
  [RefreshCw, 'Reversible where it matters', 'Every action is labeled SAFE to HIGH risk, with a cooldown and a rollback plan before you apply.'],
];

const STATS = [
  { v: String(TOOLS.length), l: 'tools in the registry' },
  { v: '30', l: 'days synced on connect' },
  { v: 'AES-256', l: 'encrypted TikTok keys' },
  { v: '0%', l: 'tax on your ad spend' },
];

const MOCK_KPIS = [
  { label: 'Spend', value: '$18,420', trend: '+12%' },
  { label: 'CPA', value: '$11.40', trend: '-9%' },
  { label: 'ROAS', value: '3.4x', trend: '+21%' },
  { label: 'Conversions', value: '1,620', trend: '+14%' },
];

const MOCK_CAMPAIGNS = [
  { name: 'US - Skincare - Conversions', status: 'RUNNING', budget: '$1,000/day', metric: '3.6x ROAS' },
  { name: 'UK - Product Launch', status: 'PAUSED', budget: '$400/day', metric: '2.1x ROAS' },
  { name: 'Spark - Creator Batch 04', status: 'RUNNING', budget: '$650/day', metric: '4.2x ROAS' },
];

const PRICING_TEASER = [
  { name: 'Free', price: '$0', note: '1 TikTok ad account' },
  { name: 'Pro', price: '$50', note: '10 accounts + Autopilot', featured: true },
  { name: 'Pro Max', price: '$100', note: '50 accounts + teams' },
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
    <main className="flex w-full flex-col">
      {/* Hero */}
      <section className="relative w-full overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 -top-40 h-[30rem] w-[60rem] -translate-x-1/2 rounded-full bg-iris/15 blur-[130px]" />
          <div className="absolute right-10 top-52 h-64 w-64 rounded-full bg-[var(--p-tiktok)]/10 blur-[110px]" />
        </div>

        <div className="mx-auto flex max-w-6xl flex-col items-center gap-7 px-6 pt-20 pb-10 text-center sm:px-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-rule bg-paper/70 px-3.5 py-1.5 font-ui text-xs text-ink-muted shadow-xs backdrop-blur">
            <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-applied" />
            No percentage of spend - fixed, transparent pricing
          </div>

          <h1 className="max-w-4xl font-display text-[2.5rem] leading-[1.05] tracking-[-0.02em] text-ink sm:text-6xl lg:text-[4.2rem]">
            One AI media-buyer for{' '}
            <span className="bg-gradient-to-br from-iris to-[var(--p-tiktok)] bg-clip-text text-transparent">
              TikTok Ads
            </span>
            .
          </h1>

          <p className="max-w-xl font-ui text-lg leading-relaxed text-ink-muted">
            Diagnostics, recommendations and safe one-click changes for your ad accounts - plus
            creator discovery and Spark Ads in the same workspace. Connect TikTok and see exactly
            what needs attention, why, and the exact change before it ships.
          </p>

          <div className="flex flex-col gap-3 pt-1 sm:flex-row">
            <Link href="/onboarding">
              <Button size="lg" className="group w-full rounded-full px-7 shadow-lg shadow-iris/20 sm:w-auto">
                Start free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="secondary" className="w-full rounded-full px-7 sm:w-auto">
                See the tools
              </Button>
            </Link>
          </div>

          <span
            className="mt-1 flex w-fit items-center gap-2 border-l-[3px] bg-paper-sunk px-3 py-1.5"
            style={{ borderLeftColor: 'var(--p-tiktok)', borderRadius: 'var(--r-sm)' }}
          >
            <span className="font-ui text-[13px] font-semibold text-ink">TikTok Ads</span>
            <span className="font-data text-[10px] text-applied">Live</span>
          </span>

          {/* stat strip */}
          <div className="mt-4 grid w-full max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-rule bg-rule sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.l} className="bg-paper px-4 py-5 text-center">
                <div className="font-display text-2xl tracking-tight text-ink">{s.v}</div>
                <div className="mt-0.5 font-ui text-xs text-ink-muted">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Product mock */}
        <div className="mx-auto max-w-6xl px-6 pb-24 sm:px-10">
          <div className="overflow-hidden rounded-2xl border border-rule bg-paper shadow-2xl shadow-iris/5">
            <div className="flex items-center gap-2 border-b border-rule bg-paper-sunk px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-risk/40" />
              <span className="h-3 w-3 rounded-full bg-attention/50" />
              <span className="h-3 w-3 rounded-full bg-applied/50" />
              <span className="ml-3 font-data text-xs text-ink-faint">orchardads.app / dashboard</span>
            </div>
            <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
              {MOCK_KPIS.map((kpi) => (
                <div key={kpi.label} className="rounded-xl border border-rule bg-paper-sunk p-4">
                  <p className="mb-1 font-ui text-xs text-ink-muted">{kpi.label}</p>
                  <p className="font-display text-2xl tracking-tight text-ink">{kpi.value}</p>
                  <p
                    className={`mt-1 font-ui text-xs font-medium ${kpi.trend.startsWith('+') ? 'text-applied' : 'text-risk'}`}
                  >
                    {kpi.trend} vs last period
                  </p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-3 px-6 pb-6 sm:grid-cols-3">
              {MOCK_CAMPAIGNS.map((c) => (
                <div key={c.name} className="flex flex-col gap-2 rounded-xl border border-rule bg-paper-sunk p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-ui text-sm font-semibold text-ink">{c.name}</p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 font-data text-[10px] font-medium ${
                        c.status === 'RUNNING' ? 'bg-applied-wash text-applied' : 'bg-attention-wash text-attention'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-ui text-xs text-ink-muted">
                    <span>{c.budget}</span>
                    <span>{c.metric}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* The loop */}
      <section id="features" className="w-full border-y border-rule bg-paper-sunk py-20">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <div className="mb-10 flex items-center gap-2">
            <CircleDot className="h-4 w-4 text-iris" />
            <h2 className="font-display text-3xl tracking-[-0.02em] text-ink sm:text-4xl">
              Connect, diagnose, approve, apply, learn.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {LOOP.map(([title, body], i) => (
              <div key={title} className="flex flex-col gap-2 rounded-2xl border border-rule bg-paper p-5">
                <span className="font-data text-[11px] text-ink-faint">0{i + 1}</span>
                <span className="font-ui text-sm font-semibold text-ink">{title}</span>
                <p className="font-ui text-[13px] leading-5 text-ink-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tool categories */}
      <section className="w-full py-20">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <div className="mb-10 flex items-end justify-between">
            <div className="flex max-w-xl flex-col gap-2">
              <span className="font-ui text-[11px] font-semibold uppercase tracking-[0.22em] text-iris/80">
                The toolbox
              </span>
              <h2 className="font-display text-3xl tracking-[-0.02em] text-ink sm:text-4xl">
                {TOOLS.length} tools, one normalized TikTok data store.
              </h2>
            </div>
            <Link
              href="/product"
              className="hidden items-center gap-1 font-ui text-sm font-medium text-iris hover:gap-1.5 sm:flex"
            >
              Explore all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((g) => (
              <div key={g.category} className="flex flex-col gap-2 rounded-2xl border border-rule bg-paper p-5">
                <div className="flex items-center justify-between">
                  <span className="font-ui text-sm font-semibold text-ink">{g.category}</span>
                  <span className="font-data text-[11px] text-ink-faint">{g.tools.length}</span>
                </div>
                <p className="font-ui text-[13px] leading-5 text-ink-muted">
                  {g.tools
                    .slice(0, 3)
                    .map((t) => t.name)
                    .join(', ')}
                  {g.tools.length > 3 ? `, +${g.tools.length - 3} more` : ''}
                </p>
              </div>
            ))}
          </div>
          <Link
            href="/product"
            className="mt-6 flex items-center gap-1 font-ui text-sm font-medium text-iris hover:gap-1.5 sm:hidden"
          >
            Explore all tools <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* How it works - timeline */}
      <section className="w-full border-t border-rule py-20">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <div className="mb-12 max-w-xl">
            <span className="font-ui text-[11px] font-semibold uppercase tracking-[0.22em] text-iris/80">
              Getting started
            </span>
            <h2 className="mt-2 font-display text-3xl tracking-[-0.02em] text-ink sm:text-4xl">
              Live in four steps.
            </h2>
          </div>
          <div className="relative grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div
              aria-hidden
              className="absolute top-5 left-[12%] right-[12%] hidden h-px bg-gradient-to-r from-transparent via-rule to-transparent lg:block"
            />
            {STEPS.map((s) => (
              <div key={s.step} className="relative flex flex-col gap-3">
                <div className="z-10 flex h-10 w-10 items-center justify-center rounded-full border border-rule bg-paper font-data text-sm font-semibold text-iris shadow-xs">
                  {s.step}
                </div>
                <h3 className="font-ui text-[15px] font-semibold text-ink">{s.title}</h3>
                <p className="font-ui text-[13px] leading-5 text-ink-muted">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Creators + Spark Ads */}
      <section className="w-full border-y border-rule bg-paper-sunk py-20">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <div className="mb-6 flex flex-col gap-2">
            <span className="font-ui text-[11px] font-semibold uppercase tracking-[0.22em] text-iris/80">
              Creators + Spark Ads
            </span>
            <h2 className="max-w-[42ch] font-display text-3xl tracking-[-0.02em] text-ink sm:text-4xl">
              Your AI creator manager for TikTok - not just an ad account optimizer.
            </h2>
            <p className="max-w-[70ch] font-ui text-[14px] leading-6 text-ink-muted">
              Optimizing an ad account is not enough on TikTok - the creative comes from creators.
              OrchardAds finds creators who fit your brand, drafts outreach on your behalf, turns
              their posts into Spark Ads, and reports the real GMV and profit behind every
              collaboration - not just platform ROAS. Every step lands in the same Action Ledger as
              every other change.
            </p>
          </div>
          <div className="mb-8 flex flex-wrap items-center gap-2" aria-label="creator to Spark Ad pipeline">
            {CREATOR_PIPELINE.map((step, i) => (
              <span key={step} className="flex items-center gap-2">
                <span className="rounded-full border border-rule bg-paper px-3 py-1.5 font-ui text-[12px] font-medium text-ink">
                  {step}
                </span>
                {i < CREATOR_PIPELINE.length - 1 && (
                  <ChevronRight className="h-3.5 w-3.5 text-ink-faint" aria-hidden />
                )}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {creatorTools.map((t) => {
              const Icon = t.icon;
              return (
                <div key={t.slug} className="flex flex-col gap-2 rounded-2xl border border-rule bg-paper p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-iris-wash text-iris">
                      <Icon className="h-4 w-4" />
                    </div>
                    {t.combination && (
                      <span className="rounded-full bg-iris-wash px-2 py-0.5 font-ui text-[10px] font-semibold uppercase tracking-wide text-iris">
                        combo
                      </span>
                    )}
                  </div>
                  <span className="font-ui text-sm font-semibold text-ink">{t.name}</span>
                  <p className="font-ui text-[13px] leading-5 text-ink-muted">{t.description}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {economicsTools.map((t) => {
              const Icon = t.icon;
              return (
                <div key={t.slug} className="flex items-start gap-3 rounded-2xl border border-rule bg-paper p-5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-iris-wash text-iris">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-ui text-sm font-semibold text-ink">{t.name}</span>
                    <p className="font-ui text-[13px] leading-5 text-ink-muted">{t.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why safe - the Action Ledger */}
      <section className="w-full py-20">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <div className="mb-10 flex flex-col gap-2">
            <span className="font-ui text-[11px] font-semibold uppercase tracking-[0.22em] text-iris/80">
              The Action Ledger
            </span>
            <h2 className="font-display text-3xl tracking-[-0.02em] text-ink sm:text-4xl">
              See the change before it happens.
            </h2>
            <p className="max-w-[70ch] font-ui text-[14px] leading-6 text-ink-muted">
              This is the one screen the product is remembered by. Every recommendation, everywhere
              in the workspace, renders the same way: the exact field diff, the evidence behind it,
              an impact estimate with a stated basis, and a risk label - before anything applies.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_1fr]">
            <div
              className="overflow-hidden rounded-2xl border border-rule border-l-[3px] bg-paper"
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
                  <span className="inline-flex items-center rounded-full border border-applied/40 bg-applied-wash px-2 py-0.5 text-label text-applied">
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
                  <div key={title as string} className="flex gap-3 rounded-2xl border border-rule bg-paper p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-iris-wash text-iris">
                      <I className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="font-ui text-sm font-semibold text-ink">{title as string}</span>
                      <p className="font-ui text-[13px] leading-5 text-ink-muted">{body as string}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="w-full py-20">
        <div className="mx-auto max-w-6xl px-6 sm:px-10">
          <div className="relative overflow-hidden rounded-3xl bg-iris p-8 text-white sm:p-12">
            <div aria-hidden className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_1.3fr]">
              <div>
                <span className="font-ui text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
                  Pricing
                </span>
                <h2 className="mt-2 font-display text-3xl tracking-[-0.02em] sm:text-4xl">
                  One simple price.
                  <br />
                  No tax on your spend.
                </h2>
                <p className="mt-3 max-w-sm font-ui text-[13px] leading-5 text-white/70">
                  You pay for connected ad accounts - never a percentage of media spend. Every
                  tool, on every connected account.
                </p>
                <Link href="/pricing" className="mt-6 inline-block">
                  <Button
                    variant="secondary"
                    className="w-fit rounded-full border-transparent bg-white px-7 text-iris shadow-none hover:border-transparent hover:bg-white/90"
                  >
                    See pricing <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {PRICING_TEASER.map((t) => (
                  <div
                    key={t.name}
                    className={`flex flex-col gap-1 rounded-2xl border p-4 ${
                      t.featured ? 'border-white/40 bg-white/10' : 'border-white/15 bg-white/5'
                    }`}
                  >
                    <span className="font-ui text-[12px] font-semibold text-white/80">{t.name}</span>
                    <span className="font-display text-2xl">{t.price}</span>
                    <span className="font-ui text-[11px] text-white/60">{t.note}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full py-24 text-center">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 px-6 sm:px-10">
          <Sparkles className="h-5 w-5 text-iris" />
          <h2 className="font-display text-4xl tracking-[-0.02em] text-ink sm:text-5xl">
            Stop guessing. Start optimizing.
          </h2>
          <p className="max-w-lg font-ui text-[15px] leading-6 text-ink-muted">
            Connect your TikTok Ads account and see exactly what needs attention - free to start,
            no percentage of spend, ever.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/onboarding">
              <Button size="lg" className="group rounded-full px-8 shadow-lg shadow-iris/20">
                Connect TikTok Ads
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="secondary" className="rounded-full px-8">
                See pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
