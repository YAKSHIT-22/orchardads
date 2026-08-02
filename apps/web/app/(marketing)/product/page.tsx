import { TOOLS, type ToolDef, toolsByCategory } from '@/lib/tools-registry';
import { cn } from '@adsos/ui';

const STATUS_STYLE: Record<ToolDef['status'], string> = {
  live: 'text-applied bg-applied-wash',
  soon: 'text-ink-muted bg-paper-sunk',
  gated: 'text-attention bg-attention-wash',
};

const CATEGORY_NOTE: Partial<Record<ToolDef['category'], string>> = {
  Creators: 'Discover, brief, and track creators - the CRM sits next to your ad account, not apart from it.',
  Diagnostics: 'Independent checks over a normalized store - not a repeat of TikTok\'s own dashboard.',
  Measurement: 'Every conversion-optimizing action is gated until the tracking stack underneath it is healthy.',
};

function ScopeTags({ scopes }: { scopes?: string[] }) {
  if (!scopes || scopes.length === 0) return null;
  const shown = scopes.slice(0, 2);
  const rest = scopes.length - shown.length;
  return (
    <div className="flex flex-wrap gap-1">
      {shown.map((s) => (
        <span
          key={s}
          className="rounded-sm border border-rule px-1.5 py-0.5 text-label text-ink-faint"
        >
          {s}
        </span>
      ))}
      {rest > 0 && (
        <span className="rounded-sm border border-rule px-1.5 py-0.5 text-label text-ink-faint">
          +{rest} more
        </span>
      )}
    </div>
  );
}

function ToolCard({ t }: { t: ToolDef }) {
  const Icon = t.icon;
  const platforms = t.platforms === 'ALL' ? 'All platforms' : t.platforms.join(', ');
  return (
    <div className="flex flex-col gap-2 rounded-md border border-rule bg-paper p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-iris-wash text-iris">
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex items-center gap-1.5">
          {t.combination && (
            <span className="rounded-sm bg-iris-wash px-1.5 py-0.5 text-label text-iris">combo</span>
          )}
          <span className={cn('rounded-sm px-1.5 py-0.5 text-label', STATUS_STYLE[t.status])}>{t.status}</span>
        </div>
      </div>
      <span className="font-ui text-[13px] font-semibold text-ink">{t.name}</span>
      <p className="font-ui text-[12px] leading-4 text-ink-muted">{t.description}</p>
      <ScopeTags scopes={t.scopes} />
      <span className="mt-auto font-data text-[10px] text-ink-faint">
        {platforms} - phase {t.phase}
      </span>
    </div>
  );
}

export default function ProductPage() {
  const groups = toolsByCategory();
  const combinationTools = TOOLS.filter((t) => t.combination);
  const liveCount = TOOLS.filter((t) => t.status === 'live').length;

  return (
    <main className="mx-auto flex max-w-[1120px] flex-col gap-14 px-6 py-16">
      <header className="flex flex-col gap-3">
        <span className="text-label text-iris">Product</span>
        <h1 className="max-w-[24ch] font-display text-[clamp(1.8rem,4vw,2.6rem)] leading-tight text-ink">
          Every TikTok tool, one normalized store, one action engine.
        </h1>
        <p className="max-w-[64ch] font-ui text-[14px] leading-6 text-ink-muted">
          The moat is not "AI optimizes TikTok Ads" - TikTok's own console already does some of
          that. It is independent diagnostics across the whole TikTok API surface, a normalized
          store, safe one-click actions with a full audit trail, and a creator + Spark Ads
          workflow that lives next to the ad account instead of in a separate tool. Every tool
          below is registry-driven and declares the TikTok scope(s) it needs, so a tool your
          connection lacks renders an explained empty state, never a broken control.
        </p>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 font-data text-[11px] text-ink-faint">
          <span>{TOOLS.length} tools</span>
          <span>{liveCount} live today</span>
          <span>{combinationTools.length} combination workflows</span>
          <span>{groups.length} categories</span>
        </div>
      </header>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-label text-ink-muted">The differentiator</span>
          <h2 className="font-display text-[20px] text-ink">
            Combination tools - one outcome, several TikTok scopes
          </h2>
          <p className="max-w-[64ch] font-ui text-[13px] leading-5 text-ink-muted">
            No single TikTok API endpoint delivers these outcomes on its own. Each one chains
            diagnosis, recommendation, creator, creative and reporting scopes into a single flow -
            the work an experienced media buyer would otherwise stitch together by hand.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {combinationTools.map((t) => {
            const Icon = t.icon;
            return (
              <div
                key={t.slug}
                className="flex flex-col gap-2 rounded-md border border-iris-edge bg-iris-wash/40 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-paper text-iris">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="rounded-sm bg-paper px-1.5 py-0.5 text-label text-iris">
                    {t.scopes?.length ?? 0} scopes
                  </span>
                </div>
                <span className="font-ui text-[13px] font-semibold text-ink">{t.name}</span>
                <p className="font-ui text-[12px] leading-4 text-ink-muted">{t.description}</p>
                {t.scopes && (
                  <p className="font-data text-[10px] text-ink-faint">{t.scopes.join(' + ')}</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {groups.map((g) => (
        <section key={g.category} className="flex flex-col gap-3">
          <div className="flex items-baseline gap-3">
            <h2 className="font-display text-[18px] text-ink">{g.category}</h2>
            <span className="font-data text-[11px] text-ink-faint">{g.tools.length}</span>
          </div>
          {CATEGORY_NOTE[g.category] && (
            <p className="max-w-[62ch] font-ui text-[12px] leading-4 text-ink-muted">
              {CATEGORY_NOTE[g.category]}
            </p>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {g.tools.map((t) => (
              <ToolCard key={t.slug} t={t} />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
