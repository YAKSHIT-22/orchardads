import type { Confidence, Platform, RiskBand } from '@adsos/core';
import type { WorkspaceContext } from '../workspace-context';
import { withWorkspace } from '../workspace-context';

export type RecPersistInput = {
  platform: Platform;
  kind: string;
  entityType: string;
  entityId: string; // internal uuid
  evidence: unknown;
  confidence: Confidence;
  estimatedImpact: unknown;
  riskBand: RiskBand;
  explanation?: string | null;
};

/** Replace the open recommendation set for a platform after a fresh analysis run. */
export async function replaceOpen(
  ctx: WorkspaceContext,
  platform: Platform,
  recs: RecPersistInput[],
): Promise<number> {
  return withWorkspace(ctx, async (tx) => {
    await tx.recommendation.deleteMany({
      where: { workspaceId: ctx.workspaceId, platform, status: 'OPEN' },
    });
    if (recs.length === 0) return 0;
    await tx.recommendation.createMany({
      data: recs.map((r) => ({
        workspaceId: ctx.workspaceId,
        platform: r.platform,
        kind: r.kind,
        entityType: r.entityType,
        entityId: r.entityId,
        evidence: r.evidence as object,
        confidence: r.confidence,
        estimatedImpact: r.estimatedImpact as object,
        riskBand: r.riskBand,
        explanation: r.explanation ?? null,
        status: 'OPEN',
      })),
    });
    return recs.length;
  });
}

export async function listOpen(ctx: WorkspaceContext) {
  return withWorkspace(ctx, (tx) =>
    tx.recommendation.findMany({
      where: { workspaceId: ctx.workspaceId, status: 'OPEN' },
      orderBy: [{ riskBand: 'desc' }, { detectedAt: 'desc' }],
    }),
  );
}
