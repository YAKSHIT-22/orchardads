import { RollbackButton } from '@/components/audit/rollback-button';
import { getWorkspaceContext } from '@/lib/session';
import { repositories } from '@adsos/db';
import { Card, EmptyState, RiskBadge, ToolHeader, cn } from '@adsos/ui';
import { History } from 'lucide-react';

const STATUS_STYLE: Record<string, string> = {
  APPLIED: 'text-applied bg-applied-wash',
  FAILED: 'text-risk bg-risk-wash',
  ROLLED_BACK: 'text-attention bg-attention-wash',
  PROPOSED: 'text-ink-muted bg-paper-sunk',
  APPROVED: 'text-ink-muted bg-paper-sunk',
};

type DiffRow = { field: string; from?: unknown; to?: unknown };

export default async function AuditPage() {
  const ctx = await getWorkspaceContext();
  const actions = ctx ? await repositories.actions.listRecent(ctx, 100) : [];

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-6 px-6 py-6">
      <ToolHeader
        icon={History}
        title="Activity"
        description="Every change, append-only: what was proposed, applied, and by whom - with rollback where possible."
      />

      {actions.length === 0 ? (
        <EmptyState
          icon={History}
          title="No activity yet"
          message="Actions you apply appear here with their exact diff, the platform response, and a rollback option."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {actions.map((a) => {
            const diff = (a.humanDiff as DiffRow[]) ?? [];
            const reversible = a.status === 'APPLIED' && a.rollbackPlan != null;
            return (
              <Card key={a.id} platform={a.platform} className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-label text-ink-muted">
                        {a.platform} {'·'} {a.entityType} {'·'} {a.kind}
                      </span>
                      <span className={cn('rounded-sm px-1.5 py-0.5 text-label', STATUS_STYLE[a.status] ?? '')}>
                        {a.status.toLowerCase()}
                      </span>
                      <RiskBadge risk={a.riskBand as 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH'} />
                    </div>
                    <span className="font-data text-[11px] text-ink-faint">{a.externalEntityId}</span>
                    {diff.map((d) => (
                      <span key={d.field} className="font-data text-[12px] text-ink">
                        {d.field}: {String(d.from ?? '')} {'->'} {String(d.to ?? '')}
                      </span>
                    ))}
                    {a.error && <span className="font-ui text-[11px] text-risk">{a.error}</span>}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-data text-[10px] text-ink-faint">
                      {(a.appliedAt ?? a.proposedAt).toISOString().slice(0, 16).replace('T', ' ')}
                    </span>
                    {(a.status === 'APPLIED' || a.status === 'ROLLED_BACK') && (
                      <RollbackButton actionId={a.id} reversible={reversible} />
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
