import { CATEGORY_ORDER, TOOLS, type ToolCategory } from '@/lib/tools-registry';
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

const PLATFORMS = [{ name: 'TikTok', color: 'var(--p-tiktok)', status: 'Live' }];

const LOOP = [
  ['Connect', 'OAuth into your ad accounts. Tokens are encrypted; they never reach the browser.'],
  ['Diagnose', 'Independent health, pacing, waste and tracking checks over a normalized store.'],
  ['Recommend', 'Every opportunity as an Action Ledger: evidence, impact, risk, confidence.'],
  ['Approve', 'Preview the exact before/after diff. Guardrails and roles gate every change.'],
  ['Apply', 'One click writes through the official API, with a full audit trail and rollback.'],
  ['Learn', 'Outcomes are tracked from detected to evaluated, so the system earns trust.'],
];

const WHY = [
  [ShieldCheck, 'Safe by construction', 'Nothing writes to a platform except through one action engine: policy, guardrails, approval, idempotency, rollback.'],
  [GitCompareArrows, 'You see every change first', 'The Action Ledger shows the exact field diff before you approve. Unchanged fields are shown too.'],
  [ListChecks, 'Independent diagnostics', 'Not "AI optimizes ads". Cross-platform normalization, waste finding, and recommendation outcome tracking the native tools do not give you.'],
  [RefreshCw, 'Compliance is code', 'Data retention enforced in the repository. Platform fees shown separately from spend, always.'],
];

function toolCount(cat: ToolCategory): number {
  return TOOLS.filter((t) => t.category === cat).length;
}

export default function Landing() {
  return (
    <main>
      {/* Hero */}
      <section className="mx-auto flex max-w-[1120px] flex-col items-center gap-6 px-6 pt-20 pb-14 text-center">
        <span className="text-label text-iris">Emerging Ads Optimization OS</span>
        <h1 className="max-w-[16ch] font-display text-[clamp(2rem,5vw,3.4rem)] leading-[1.05] text-ink">
          One AI media-buyer for TikTok, built for creative-led performance.
        </h1>
        <p className="max-w-[58ch] font-ui text-[15px] leading-6 text-ink-muted">
          Connect TikTok. Every morning, see exactly what needs
          attention, why, the expected impact, and safely apply the fix - diagnostics, recommendations, safe one-click actions and reporting without a percentage tax on your media spend.
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
              <span className="font-data text-[10px] text-ink-faint">{p.status}</span>
            </li>
          ))}
        </ul>
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
          {[
            ['Monitor', 'Health, pacing, anomalies, tracking - across every account.'],
            ['Optimize', 'Waste, budget, winners and losers as safe one-click actions.'],
            ['Automate', 'Rules that propose within guardrails, never bypassing approval.'],
            ['Report', 'Normalized metrics, profitability, multi-touch attribution.'],
            ['Analyze', 'Ask questions in plain language; every answer shows its query.'],
            ['AI', 'Explains evidence and drafts creative - it never touches the keys.'],
          ].map(([h, b]) => (
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
            <h2 className="font-display text-[22px] text-ink">{TOOLS.length} tools, one normalized store</h2>
          </div>
          <Link href="/product" className="font-ui text-[13px] text-iris hover:underline">
            Explore all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {CATEGORY_ORDER.map((cat) => (
            <div key={cat} className="flex flex-col gap-1 rounded-md border border-rule bg-paper p-4">
              <span className="font-data text-[20px] leading-6 text-ink">{toolCount(cat)}</span>
              <span className="font-ui text-[13px] font-medium text-ink">{cat}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Why */}
      <section className="border-t border-rule bg-paper-sunk">
        <div className="mx-auto max-w-[1120px] px-6 py-14">
          <h2 className="mb-8 font-display text-[22px] text-ink">Why a workspace, not another dashboard</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
          <h2 className="max-w-[24ch] font-display text-[26px] leading-tight text-ink">
            Start optimizing TikTok today.
          </h2>
          <p className="max-w-[48ch] font-ui text-[13px] text-ink-muted">
            Free to start. No percentage of spend. Fixed, transparent pricing that scales with
            accounts, not with your ad budget.
          </p>
          <Link href="/onboarding">
            <Button>
              Connect an account <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
