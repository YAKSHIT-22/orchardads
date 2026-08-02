import { RecLedger } from '@/components/inbox/rec-ledger';
import { getWorkspaceDashboard } from '@/lib/data/platform';
import { getWorkspaceContext } from '@/lib/session';
import { Button, EmptyState, StatGrid, StatTile, ToolHeader } from '@adsos/ui';
import { AlertTriangle, CircleCheck, ListChecks, PlugZap, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default async function InboxPage() {
  const ctx = await getWorkspaceContext();
  const data = ctx ? await getWorkspaceDashboard(ctx) : null;

  const highRisk = data?.recs.filter((r) => r.risk === 'HIGH').length ?? 0;
  const mediumRisk = data?.recs.filter((r) => r.risk === 'MEDIUM').length ?? 0;
  const safe = data?.recs.filter((r) => r.risk === 'SAFE' || r.risk === 'LOW').length ?? 0;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-6 sm:px-10">
      <ToolHeader
        icon={ListChecks}
        title="Recommendation Inbox"
        description="Every opportunity across your platforms as an Action Ledger. Preview the exact change, then apply or dismiss."
      />
      {!data?.anyConnected ? (
        <EmptyState
          icon={PlugZap}
          title="No account connected"
          message="Connect TikTok and run a sync; recommendations appear here once there is data to analyze."
          action={
            <Link href="/onboarding">
              <Button>Connect TikTok</Button>
            </Link>
          }
        />
      ) : data.recs.length === 0 ? (
        <EmptyState title="Inbox zero" message="Nothing needs attention across your accounts right now." />
      ) : (
        <>
          <StatGrid className="max-w-2xl grid-cols-3 sm:grid-cols-3">
            <StatTile icon={ListChecks} label="Total" value={String(data.recs.length)} tone="iris" />
            <StatTile icon={ShieldAlert} label="High risk" value={String(highRisk)} tone={highRisk > 0 ? 'risk' : 'neutral'} />
            <StatTile
              icon={AlertTriangle}
              label="Medium risk"
              value={String(mediumRisk)}
              tone={mediumRisk > 0 ? 'attention' : 'neutral'}
            />
          </StatGrid>
          <p className="font-ui text-[12px] text-ink-faint">
            <CircleCheck className="mr-1 inline h-3.5 w-3.5 -translate-y-px text-applied" />
            {safe} more at safe/low risk
          </p>
          <div className="flex max-w-4xl flex-col gap-2">
            {data.recs.map((r) => (
              <RecLedger key={r.id} {...r} density="line" />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
