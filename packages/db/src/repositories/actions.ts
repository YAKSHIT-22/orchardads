import type { Platform, RiskBand } from '@adsos/core';
import type { WorkspaceContext } from '../workspace-context';
import { withWorkspace } from '../workspace-context';

export type ActionStatus =
  | 'PROPOSED'
  | 'APPROVED'
  | 'QUEUED'
  | 'APPLYING'
  | 'APPLIED'
  | 'FAILED'
  | 'ROLLED_BACK'
  | 'DISMISSED';

export type CreateActionInput = {
  recommendationId?: string | null;
  platform: Platform;
  kind: string;
  entityType: string;
  entityId: string; // internal uuid
  externalEntityId: string;
  proposedPayload: unknown;
  humanDiff: unknown;
  validation: unknown;
  estimatedImpact: unknown;
  riskBand: RiskBand;
  approvalPolicy: unknown;
  idempotencyKey: string;
  proposedBy?: string | null;
};

/**
 * Create the Action record (all ten retained artifacts; sec 7.1). Idempotent on
 * key: reports whether this call created the claim (`created:true`) or found an
 * existing one, so the caller can short-circuit instead of re-executing a write
 * (ARCHITECTURE.md sec 7.2). The unique index is the backstop against a true race.
 */
export async function createAction(ctx: WorkspaceContext, input: CreateActionInput) {
  return withWorkspace(ctx, async (tx) => {
    const existing = await tx.action.findUnique({
      where: { workspaceId_idempotencyKey: { workspaceId: ctx.workspaceId, idempotencyKey: input.idempotencyKey } },
    });
    if (existing) return { action: existing, created: false };
    const action = await tx.action.create({
      data: {
        workspaceId: ctx.workspaceId,
        recommendationId: input.recommendationId ?? null,
        platform: input.platform,
        kind: input.kind,
        entityType: input.entityType,
        entityId: input.entityId,
        externalEntityId: input.externalEntityId,
        proposedPayload: input.proposedPayload as object,
        humanDiff: input.humanDiff as object,
        validation: input.validation as object,
        estimatedImpact: input.estimatedImpact as object,
        riskBand: input.riskBand,
        approvalPolicy: input.approvalPolicy as object,
        idempotencyKey: input.idempotencyKey,
        proposedBy: input.proposedBy ?? null,
        status: 'PROPOSED',
      },
    });
    return { action, created: true };
  });
}

export async function setStatus(
  ctx: WorkspaceContext,
  actionId: string,
  status: ActionStatus,
  patch: { apiResponse?: unknown; previousState?: unknown; rollbackPlan?: unknown; error?: string; approvedBy?: string } = {},
) {
  return withWorkspace(ctx, (tx) =>
    tx.action.update({
      where: { id: actionId },
      data: {
        status,
        apiResponse: patch.apiResponse as object | undefined,
        previousState: patch.previousState as object | undefined,
        rollbackPlan: patch.rollbackPlan as object | undefined,
        error: patch.error,
        approvedBy: patch.approvedBy,
        approvedAt: status === 'APPROVED' ? new Date() : undefined,
        appliedAt: status === 'APPLIED' ? new Date() : undefined,
      },
    }),
  );
}

export async function appendExecution(
  ctx: WorkspaceContext,
  actionId: string,
  exec: { attempt: number; request: unknown; response?: unknown; httpStatus?: number; rateLimit?: unknown; durationMs?: number; error?: string },
) {
  return withWorkspace(ctx, (tx) =>
    tx.actionExecution.create({
      data: {
        actionId,
        attempt: exec.attempt,
        request: exec.request as object,
        response: exec.response as object | undefined,
        httpStatus: exec.httpStatus,
        rateLimit: exec.rateLimit as object | undefined,
        durationMs: exec.durationMs,
        error: exec.error,
        finishedAt: new Date(),
      },
    }),
  );
}

export async function listRecent(ctx: WorkspaceContext, limit = 50) {
  return withWorkspace(ctx, (tx) =>
    tx.action.findMany({ where: { workspaceId: ctx.workspaceId }, orderBy: { proposedAt: 'desc' }, take: limit }),
  );
}

export async function getAction(ctx: WorkspaceContext, id: string) {
  return withWorkspace(ctx, (tx) => tx.action.findFirst({ where: { workspaceId: ctx.workspaceId, id } }));
}

export async function listAudit(ctx: WorkspaceContext, limit = 50) {
  return withWorkspace(ctx, (tx) =>
    tx.auditEvent.findMany({ where: { workspaceId: ctx.workspaceId }, orderBy: { createdAt: 'desc' }, take: limit }),
  );
}

export async function lastActionAt(
  ctx: WorkspaceContext,
  entityId: string,
  kind: string,
): Promise<number | null> {
  return withWorkspace(ctx, async (tx) => {
    const a = await tx.action.findFirst({
      where: { workspaceId: ctx.workspaceId, entityId, kind, status: 'APPLIED' },
      orderBy: { appliedAt: 'desc' },
      select: { appliedAt: true },
    });
    return a?.appliedAt ? a.appliedAt.getTime() : null;
  });
}

/** Append-only audit trail (sec 10.3). No update/delete path exists. */
export async function appendAudit(
  ctx: WorkspaceContext,
  event: { actorId?: string; actorType: 'USER' | 'RULE' | 'SYSTEM'; verb: string; subjectType: string; subjectId?: string; before?: unknown; after?: unknown; metadata?: unknown },
) {
  return withWorkspace(ctx, (tx) =>
    tx.auditEvent.create({
      data: {
        workspaceId: ctx.workspaceId,
        actorId: event.actorId,
        actorType: event.actorType,
        verb: event.verb,
        subjectType: event.subjectType,
        subjectId: event.subjectId,
        before: event.before as object | undefined,
        after: event.after as object | undefined,
        metadata: (event.metadata ?? {}) as object,
      },
    }),
  );
}
