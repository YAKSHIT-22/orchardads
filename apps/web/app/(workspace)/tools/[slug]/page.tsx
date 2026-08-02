import { RecLedger } from '@/components/inbox/rec-ledger';
import { TOOL_VIEWS } from '@/components/tools/views';
import { getWorkspaceDashboard } from '@/lib/data/platform';
import { TOOLS, toolBySlug } from '@/lib/tools-registry';
import { getWorkspaceContext } from '@/lib/session';
import { Button, EmptyState, ToolHeader } from '@adsos/ui';
import { PlugZap } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return TOOLS.map((t) => ({ slug: t.slug }));
}

export default async function ToolDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = toolBySlug(slug);
  if (!tool) notFound();

  const Icon = tool.icon;
  const View = TOOL_VIEWS[slug];
  const ctx = await getWorkspaceContext();
  const data = tool.status === 'live' && ctx ? await getWorkspaceDashboard(ctx) : null;
  const related = data?.recs.filter((r) => r.tool === slug) ?? [];

  // A tool with a dedicated view owns its whole body (its own header + sections).
  if (View) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-6 sm:px-10">
        <ToolHeader icon={Icon} title={tool.name} description={tool.description} />
        <View tool={tool} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-6 sm:px-10">
      <ToolHeader icon={Icon} title={tool.name} description={tool.description} />

      {tool.status === 'gated' ? (
        <EmptyState
          icon={Icon}
          title="Available on eligible accounts"
          message={`This tool depends on the "${tool.capabilityFlag}" capability. When a connected account has it, this page activates automatically.`}
        />
      ) : tool.status === 'soon' ? (
        <EmptyState
          icon={Icon}
          title={`Ships in phase ${tool.phase}`}
          message="This tool activates once there is enough synced TikTok data to analyze."
        />
      ) : !data?.anyConnected ? (
        <EmptyState
          icon={PlugZap}
          title="Connect TikTok"
          message="This tool runs on synced data. Connect an account to see live findings."
          action={
            <Link href="/accounts">
              <Button>Connect TikTok</Button>
            </Link>
          }
        />
      ) : related.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-label text-ink-muted">Live findings</h2>
          {related.map((r) => (
            <RecLedger key={r.id} {...r} />
          ))}
        </section>
      ) : (
        <EmptyState
          icon={Icon}
          title="No findings right now"
          message="This tool found nothing to act on for the current account and range. That is a good sign."
        />
      )}
    </div>
  );
}
