'use server';

import { createHash } from 'node:crypto';
import type { EntityType, Platform } from '@adsos/core';
import { type WorkspaceContext, prisma, repositories } from '@adsos/db';
import type { ApprovedAction, ProposedAction } from '@adsos/platform-core';
import { canApprove, evaluatePolicy } from '@adsos/policy-engine';
import { z } from 'zod';
import { getAdapter } from '../adapters';
import { authedAction } from '../safe-action';

// Only identity + intent come from the client. Guardrail inputs (previous budget,
// conversion-optimizing) are derived server-side so a crafted request cannot opt
// out of the caps (ARCHITECTURE.md sec 7.3).
const schema = z.object({
  platform: z.enum(['TIKTOK']),
  kind: z.enum(['PAUSE', 'RESUME', 'SET_BUDGET', 'SET_BID', 'RENAME']),
  entityType: z.enum(['CAMPAIGN', 'AD_GROUP', 'AD']),
  entityId: z.string(),
  externalId: z.string(),
  proposedPayload: z.record(z.string(), z.unknown()),
});

function idempotencyKey(ctx: WorkspaceContext, i: z.infer<typeof schema>): string {
  const canonical = JSON.stringify({ e: i.externalId, k: i.kind, p: i.proposedPayload });
  const bucket = Math.floor(Date.now() / 3_600_000); // 1h proposal window
  return createHash('sha256').update(`${ctx.workspaceId}|${i.platform}|${canonical}|${bucket}`).digest('hex');
}

/**
 * Apply a recommendation. Nothing writes to a platform except through this path:
 * policy -> action record -> capture previous state -> adapter execute -> audit
 * (ARCHITECTURE.md sec 7). Returns violations instead of writing when blocked.
 */
export const applyRecommendation = authedAction.inputSchema(schema).action(async ({ parsedInput, ctx }) => {
  const wsCtx = ctx.workspace;
  const i = parsedInput;
  const platform = i.platform as Platform;

  if (!canApprove(wsCtx.role, 'OPERATOR')) {
    return { ok: false as const, violations: [{ code: 'ROLE', message: 'Your role cannot apply changes.' }] };
  }

  const ws = await prisma.workspace.findUnique({ where: { id: wsCtx.workspaceId }, select: { killSwitch: true } });
  const lastAt = await repositories.actions.lastActionAt(wsCtx, i.entityId, i.kind);

  // Server-derived guardrail inputs - never trusted from the client.
  const conversionOptimizing = i.kind === 'SET_BUDGET' || i.kind === 'SET_BID';
  const previousMinor = await repositories.sync.currentBudgetMinor(wsCtx, i.entityId);
  const proposedMinor =
    i.kind === 'SET_BUDGET' && typeof i.proposedPayload.dailyBudgetMinor === 'string'
      ? BigInt(i.proposedPayload.dailyBudgetMinor)
      : null;

  const policy = evaluatePolicy({
    kind: i.kind,
    previousMinor,
    proposedMinor,
    conversionOptimizing,
    trackingHealth: await repositories.metrics.accountTrackingHealth(wsCtx, platform),
    killSwitch: Boolean(ws?.killSwitch),
    lastActionAt: lastAt,
  });

  if (!policy.allowed) {
    return { ok: false as const, violations: policy.violations };
  }
  if (!canApprove(wsCtx.role, policy.approval.minRole)) {
    return {
      ok: false as const,
      violations: [{ code: 'APPROVAL', message: `This ${policy.riskBand} action needs ${policy.approval.minRole}+.` }],
    };
  }

  const humanDiff = Object.entries(i.proposedPayload).map(([field, to]) => ({
    field,
    from: previousMinor != null ? previousMinor.toString() : '(current)',
    to: typeof to === 'object' ? JSON.stringify(to) : String(to),
    changed: true,
  }));

  const key = idempotencyKey(wsCtx, i);
  const { action, created } = await repositories.actions.createAction(wsCtx, {
    platform,
    kind: i.kind,
    entityType: i.entityType,
    entityId: i.entityId,
    externalEntityId: i.externalId,
    proposedPayload: i.proposedPayload,
    humanDiff,
    validation: { violations: [] },
    estimatedImpact: {},
    riskBand: policy.riskBand,
    approvalPolicy: policy.approval,
    idempotencyKey: key,
    proposedBy: wsCtx.userId,
  });

  // Idempotency: a prior invocation with the same key already owns this write.
  if (!created && action.status !== 'PROPOSED') {
    return {
      ok: action.status === 'APPLIED',
      apiResponse: (action.apiResponse ?? {}) as Record<string, unknown>,
      error: action.status === 'APPLIED' ? undefined : 'This change was already processed.',
    };
  }

  await repositories.actions.setStatus(wsCtx, action.id, 'APPROVED', { approvedBy: wsCtx.userId });

  const adapter = getAdapter(platform, wsCtx);
  const accountExternalId =
    (await repositories.sync.entityAccountExternalId(wsCtx, i.entityType, i.entityId)) ?? undefined;
  const entityRef = {
    platform,
    entityType: i.entityType as EntityType,
    externalId: i.externalId,
    workspaceId: wsCtx.workspaceId,
    accountExternalId,
  };
  const previous = await adapter.captureState(entityRef);

  const proposed: ProposedAction = {
    workspaceId: wsCtx.workspaceId,
    platform,
    kind: i.kind,
    entityRef,
    proposedPayload: i.proposedPayload,
    riskBand: policy.riskBand,
  };
  const approved: ApprovedAction = { ...proposed, actionId: action.id, idempotencyKey: key };

  const started = Date.now();
  const result = await adapter.executeAction(approved);

  await repositories.actions.appendExecution(wsCtx, action.id, {
    attempt: 1,
    request: i.proposedPayload,
    response: result.apiResponse,
    rateLimit: result.rateLimit,
    durationMs: Date.now() - started,
    error: result.error,
  });
  await repositories.actions.setStatus(wsCtx, action.id, result.ok ? 'APPLIED' : 'FAILED', {
    apiResponse: result.apiResponse,
    previousState: previous.state,
    rollbackPlan: result.ok ? { kind: i.kind, previous: previous.state } : undefined,
    error: result.error,
  });
  await repositories.actions.appendAudit(wsCtx, {
    actorId: wsCtx.userId,
    actorType: 'USER',
    verb: result.ok ? 'action.applied' : 'action.failed',
    subjectType: i.entityType,
    subjectId: i.externalId,
    after: i.proposedPayload,
    metadata: { riskBand: policy.riskBand },
  });

  return { ok: result.ok, error: result.error, apiResponse: result.apiResponse };
});
