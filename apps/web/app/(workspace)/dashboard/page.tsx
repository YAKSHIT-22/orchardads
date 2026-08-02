import { RecLedger } from '@/components/inbox/rec-ledger';
import { SyncButton } from '@/components/sync-button';
import { getWorkspaceDashboard } from '@/lib/data/platform';
import { getWorkspaceContext } from '@/lib/session';
import { Button, Card, CardContent, CardHeader, CardTitle, EmptyState, MetricStat, PlatformChip, SyncStatus } from '@adsos/ui';
import { PlugZap } from 'lucide-react';
import Link from 'next/link';

const HEALTH_TONE = { HEALTHY: 'fresh', DEGRADED: 'stale', BROKEN: 'failed', UNKNOWN: 'stale' } as const;

export default async function DashboardPage() {
  const ctx = await getWorkspaceContext();
  const data = ctx ? await getWorkspaceDashboard(ctx) : null;
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="mx-auto flex max-w-[1120px] flex-col gap-6 px-6 py-6">
      <header className="flex items-end justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-label text-ink-muted">{today}</span>
          <h1 className="font-display text-[32px] leading-9 text-ink">Morning Brief</h1>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {data?.connectedPlatforms.map((p) => <PlatformChip key={p} platform={p} />)}
        </div>
      </header>

      {!data?.anyConnected ? (
        <EmptyState
          icon={PlugZap}
          title="Connect an ad account to begin"
          message="Connect TikTok. The first sync pulls 30 days of data and the recommendation engine runs - every number traces to a synced metric."
          action={
            <Link href="/onboarding">
              <Button>Connect TikTok</Button>
            </Link>
          }
        />
      ) : (
        <>
          {data.platforms.map((p) => (
            <Card key={p.platform} platform={p.platform}>
              <CardHeader className="flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <PlatformChip platform={p.platform} />
                  <SyncStatus tone={HEALTH_TONE[p.trackingHealth]} label={`tracking ${p.trackingHealth.toLowerCase()}`} />
                </div>
                <SyncButton platform={p.platform} />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                  {p.kpis.map((k) => (
                    <MetricStat key={k.label} label={k.label} value={k.value} delta={k.delta} sub={k.sub} />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          <section className="flex w-full max-w-[720px] flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-label text-ink-muted">Needs attention</h2>
              <span className="font-data text-[11px] text-ink-faint">{data.recs.length} items</span>
            </div>
            {data.recs.length === 0 ? (
              <EmptyState title="No findings right now" message="Nothing needs attention across your accounts for this range. Check back after the next sync." />
            ) : (
              data.recs.map((r) => <RecLedger key={r.id} {...r} />)
            )}
          </section>
        </>
      )}
    </div>
  );
}
