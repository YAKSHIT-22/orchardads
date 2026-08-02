import { type ToolDef, toolsByCategory } from '@/lib/tools-registry';
import { cn } from '@adsos/ui';

const STATUS_STYLE: Record<ToolDef['status'], string> = {
  live: 'text-applied bg-applied-wash',
  soon: 'text-ink-muted bg-paper-sunk',
  gated: 'text-attention bg-attention-wash',
};

export default function ProductPage() {
  const groups = toolsByCategory();
  return (
    <main className="mx-auto flex max-w-[1120px] flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-3">
        <span className="text-label text-iris">Product</span>
        <h1 className="max-w-[22ch] font-display text-[clamp(1.8rem,4vw,2.6rem)] leading-tight text-ink">
          Every tool, one normalized store, one action engine.
        </h1>
        <p className="max-w-[60ch] font-ui text-[14px] text-ink-muted">
          The moat is not "AI optimizes ads" - the native platforms do that. It is independent
          diagnostics, a normalized store, safe bulk actions, recommendation outcome
          tracking and agency workflows. Tools are registry-driven, so the catalog grows without new
          screens.
        </p>
      </header>

      {groups.map((g) => (
        <section key={g.category} className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-[18px] text-ink">{g.category}</h2>
            <span className="font-data text-[11px] text-ink-faint">{g.tools.length}</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {g.tools.map((t) => {
              const Icon = t.icon;
              const platforms = t.platforms === 'ALL' ? 'All platforms' : t.platforms.join(', ');
              return (
                <div key={t.slug} className="flex flex-col gap-2 rounded-md border border-rule bg-paper p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-iris-wash text-iris">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className={cn('rounded-sm px-1.5 py-0.5 text-label', STATUS_STYLE[t.status])}>
                      {t.status}
                    </span>
                  </div>
                  <span className="font-ui text-[13px] font-semibold text-ink">{t.name}</span>
                  <p className="font-ui text-[12px] leading-4 text-ink-muted">{t.description}</p>
                  <span className="mt-auto font-data text-[10px] text-ink-faint">
                    {platforms} {'\u00B7'} phase {t.phase}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </main>
  );
}
