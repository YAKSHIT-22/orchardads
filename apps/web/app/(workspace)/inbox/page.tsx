import { RecLedger } from '@/components/inbox/rec-ledger';
import { getWorkspaceDashboard } from '@/lib/data/platform';
import { getWorkspaceContext } from '@/lib/session';
import { Button, EmptyState, ToolHeader } from '@adsos/ui';
import { ListChecks, PlugZap } from 'lucide-react';
import Link from 'next/link';

export default async function InboxPage() {
  const ctx = await getWorkspaceContext();
  const data = ctx ? await getWorkspaceDashboard(ctx) : null;

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-6 px-6 py-6">
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
        <div className="flex flex-col gap-2">
          {data.recs.map((r) => (
            <RecLedger key={r.id} {...r} density="line" />
          ))}
        </div>
      )}
    </div>
  );
}
