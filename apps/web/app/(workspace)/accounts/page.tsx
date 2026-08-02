import { SyncButton } from '@/components/sync-button';
import { getWorkspaceContext } from '@/lib/session';
import type { Platform } from '@adsos/core';
import { repositories } from '@adsos/db';
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  SyncStatus,
  ToolHeader,
  platformLabel,
} from '@adsos/ui';
import { Building2 } from 'lucide-react';

type Row = { platform: Platform; phase: number; note: string; connectable: boolean };

const CATALOG: Row[] = [
  { platform: 'TIKTOK', phase: 1, note: 'Campaign management, reporting, recommendations, safe apply, rollback.', connectable: true },
];

export default async function AccountsPage() {
  const ctx = await getWorkspaceContext();
  const connected = new Set<string>();
  if (ctx) {
    const conns = await repositories.connections.listConnections(ctx);
    for (const c of conns) if (c.status === 'ACTIVE') connected.add(c.platform);
  }

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-6 px-6 py-6">
      <ToolHeader
        icon={Building2}
        title="Accounts"
        description="OAuth connections, sync health and capabilities. Some operations deep-link to native Ads Managers by design."
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {CATALOG.map((c) => {
          const isConnected = connected.has(c.platform);
          return (
            <Card key={c.platform} platform={c.platform} interactive>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>{platformLabel(c.platform)}</CardTitle>
                {isConnected ? (
                  <SyncStatus tone="fresh" label="connected" />
                ) : (
                  <span className="text-label text-ink-faint">phase {c.phase}</span>
                )}
              </CardHeader>
              <CardContent>
                <p className="font-ui text-[12px] text-ink-muted">{c.note}</p>
              </CardContent>
              <CardFooter>
                {isConnected ? (
                  <SyncButton platform={c.platform} />
                ) : c.connectable ? (
                  <a href={`/api/oauth/${c.platform.toLowerCase()}`}>
                    <Button size="sm">Connect {platformLabel(c.platform)}</Button>
                  </a>
                ) : (
                  <Button variant="ghost" size="sm" disabled>
                    Not yet available
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
